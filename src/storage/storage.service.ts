import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { envs } from '../config/envs';

/** MIME types permitidos y su extensión canónica */
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** Tamaño máximo permitido: 5 MB */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Magic bytes para validar el tipo real del buffer */
const MAGIC_BYTES: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF header — webp check below
];

function detectMime(buffer: Buffer): string | null {
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return 'image/jpeg';

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) return 'image/png';

  // WebP: RIFF????WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) return 'image/webp';

  return null;
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor() {
    this.client = new S3Client({ region: envs.awsRegion });
    this.bucket = envs.awsS3Bucket;
    this.publicBaseUrl = envs.awsS3PublicBaseUrl ?? null;
  }

  /**
   * Valida y sube un archivo a S3.
   * @param file   Archivo recibido de Multer (MemoryStorage)
   * @param folder Carpeta dentro del bucket, p.ej. 'reports' o 'repairs'
   * @returns URL pública o path canónico del objeto
   */
  async uploadFile(file: UploadedFile, folder: string): Promise<string> {
    // 1. Validar tamaño
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo permitido (5 MB).`,
      );
    }

    // 2. Validar MIME declarado
    if (!ALLOWED_MIME[file.mimetype]) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WebP.`,
      );
    }

   // 3. Validar magic bytes y comprobar que coincidan con el MIME declarado
const realMime = detectMime(file.buffer);

if (!realMime || !ALLOWED_MIME[realMime] || realMime !== file.mimetype) {
  throw new BadRequestException(
    'El contenido del archivo no coincide con un formato de imagen válido.',
  );
}

    // 4. Construir clave única: folder/uuid-nombreoriginal.ext
    const originalExt =
      extname(file.originalname).toLowerCase() || ALLOWED_MIME[realMime];
    const safeBasename = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const key = `${folder}/${randomUUID()}-${safeBasename}`;

    // 5. Subir a S3
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: realMime,
        }),
      );
    } catch {
      // No se filtran detalles internos al cliente
      this.logger.error(`Error al subir objeto a S3 (folder=${folder})`);
      throw new InternalServerErrorException(
        'No se pudo guardar la imagen. Intente de nuevo más tarde.',
      );
    }

    // 6. Devolver URL
    return this.buildUrl(key);
  }

  /**
   * Intenta eliminar un objeto de S3 por su URL completa.
   * Falla silenciosamente (solo registra): se usa para limpiar
   * objetos huérfanos cuando la base de datos falla posteriormente.
   */
  async deleteFileByUrl(url: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(url);
      if (!key) return;

      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      this.logger.warn(`No se pudo eliminar el objeto huérfano de S3: ${url}`);
    }
  }

  // ──────────────────────────────────────────────
  // Métodos privados
  // ──────────────────────────────────────────────

  private buildUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    // URL estándar de S3 (requiere que el objeto sea público o acceso por IAM)
    return `https://${this.bucket}.s3.${envs.awsRegion}.amazonaws.com/${key}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      // URL personalizada: publicBaseUrl/key
      if (
        this.publicBaseUrl &&
        url.startsWith(this.publicBaseUrl)
      ) {
        return parsed.pathname.replace(/^\//, '');
      }

      // URL estándar de S3: https://bucket.s3.region.amazonaws.com/key
      const s3Host = `${this.bucket}.s3.${envs.awsRegion}.amazonaws.com`;
      if (parsed.hostname === s3Host) {
        return parsed.pathname.replace(/^\//, '');
      }

      return null;
    } catch {
      return null;
    }
  }
}
