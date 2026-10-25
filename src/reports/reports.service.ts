import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsRepository } from './reports.repository';
import { EmailService } from '../email/email.service';
import { StorageService, UploadedFile } from '../storage/storage.service';
import { generateReportTemplate } from './templates/report.template';

import { envs } from '../config/envs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createReportDto: CreateReportDto,
    file: UploadedFile,
  ) {
    // 1. Subir foto a S3 → reports/
    const photoUrl = await this.storageService.uploadFile(file, 'reports');

    // 2. Persistir reporte. Si falla, limpiar el objeto de S3.
    let report;
    try {
      report = await this.reportsRepository.create({
        ...createReportDto,
        photoUrl,
        isResolved: false,
      });
    } catch (dbError) {
      this.logger.error(
        'La base de datos falló al guardar el reporte. Intentando eliminar el objeto de S3.',
      );
      // Intento de limpieza best-effort (no lanza si falla)
      await this.storageService.deleteFileByUrl(photoUrl);
      throw dbError;
    }

    // 3. Enviar correo de notificación (fallo no revierte el reporte guardado)
    try {
      const emailTemplate = generateReportTemplate(createReportDto, photoUrl);
      await this.emailService.sendEmail(
        envs.mailTo,
        'Nuevo reporte de fuga de agua',
        emailTemplate,
      );
    } catch (mailError) {
      this.logger.error(
        'El correo de notificación falló, pero el reporte fue guardado.',
        mailError,
      );
    }

    return report;
  }

  async findAll() {
    return await this.reportsRepository.findAll();
  }

  /**
   * Marca un reporte como resuelto y sube la foto del trabajo terminado.
   * Ruta: PATCH /reports/:id/resolve
   */
  async resolveReport(id: number, file: UploadedFile) {
    const report = await this.reportsRepository.findById(id);

    if (!report) {
      throw new NotFoundException(`Reporte con id ${id} no encontrado.`);
    }

    if (report.isResolved) {
      throw new ConflictException(
        `El reporte con id ${id} ya fue marcado como resuelto.`,
      );
    }

    // Subir foto de reparación a repairs/
    const repairPhotoUrl = await this.storageService.uploadFile(
      file,
      'repairs',
    );

    // Si falla la BD, limpiar el objeto subido
    try {
      report.repairPhotoUrl = repairPhotoUrl;
      report.isResolved = true;
      return await this.reportsRepository.save(report);
    } catch (dbError) {
      this.logger.error(
        'La base de datos falló al resolver el reporte. Intentando eliminar objeto de S3.',
      );
      await this.storageService.deleteFileByUrl(repairPhotoUrl);
      throw dbError;
    }
  }
}