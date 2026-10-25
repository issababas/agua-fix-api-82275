import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.unstable_mockModule('../config/envs', () => ({
  envs: {
    awsRegion: 'us-east-1',
    awsS3Bucket: 'test-bucket',
    awsS3PublicBaseUrl: undefined,
  },
}));

const { StorageService } = await import('./storage.service');

const jpegBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
]);

const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe('StorageService', () => {
  let service: InstanceType<typeof StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('sube un JPEG válido y devuelve una URL', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: jpegBuffer,
        size: 100,
      };

      const url = await service.uploadFile(file, 'reports');

      expect(url).toContain('reports/');
      expect(url).toContain('.jpg');
    });

    it('sube un PNG válido y devuelve una URL', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: pngBuffer,
        size: 100,
      };

      const url = await service.uploadFile(file, 'repairs');

      expect(url).toContain('repairs/');
    });

    it('rechaza archivos que no son imágenes', async () => {
      const file = {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        buffer: jpegBuffer,
        size: 100,
      };

      await expect(
        service.uploadFile(file, 'reports'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza contenido que no coincide con el MIME', async () => {
      const file = {
        originalname: 'fake.jpg',
        mimetype: 'image/jpeg',
        buffer: pngBuffer,
        size: 100,
      };

      await expect(
        service.uploadFile(file, 'reports'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza archivos que superan 5 MB', async () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
      bigBuffer[0] = 0xff;
      bigBuffer[1] = 0xd8;
      bigBuffer[2] = 0xff;

      const file = {
        originalname: 'big.jpg',
        mimetype: 'image/jpeg',
        buffer: bigBuffer,
        size: bigBuffer.length,
      };

      await expect(
        service.uploadFile(file, 'reports'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteFileByUrl', () => {
    it('no lanza errores con una URL válida', async () => {
      await expect(
        service.deleteFileByUrl(
          'https://test-bucket.s3.us-east-1.amazonaws.com/reports/uuid.jpg',
        ),
      ).resolves.toBeUndefined();
    });

    it('no lanza errores con una URL inválida', async () => {
      await expect(
        service.deleteFileByUrl('no-es-una-url'),
      ).resolves.toBeUndefined();
    });
  });
});