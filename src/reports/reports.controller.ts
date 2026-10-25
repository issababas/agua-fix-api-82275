import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * POST /reports
   * Cuerpo: multipart/form-data
   * Campos del DTO + archivo obligatorio llamado 'photo'
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage() }),
  )
  async create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException(
        'El campo "photo" es obligatorio y debe contener una imagen válida.',
      );
    }

    return await this.reportsService.create(createReportDto, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });
  }

  /**
   * GET /reports
   * Devuelve todos los reportes incluyendo photoUrl y repairPhotoUrl.
   */
  @Get()
  async findAll() {
    return await this.reportsService.findAll();
  }

  /**
   * PATCH /reports/:id/resolve
   * Cuerpo: multipart/form-data con archivo obligatorio 'photo'
   * Marca el reporte como resuelto y guarda la foto de reparación.
   */
  @Patch(':id/resolve')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage() }),
  )
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException(
        'El campo "photo" es obligatorio para resolver el reporte.',
      );
    }

    return await this.reportsService.resolveReport(id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });
  }
}