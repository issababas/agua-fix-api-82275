import { Injectable } from '@nestjs/common';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsRepository } from './reports.repository';
import { EmailService } from '../email/email.service';
import { generateReportTemplate } from './templates/report.template';

import { envs } from '../config/envs';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(createReportDto: CreateReportDto) {
    const report = await this.reportsRepository.create({
      ...createReportDto,
      isResolved: false,
    });

    const emailTemplate = generateReportTemplate(
      createReportDto,
    );

    await this.emailService.sendEmail(
      envs.mailTo,
      'Nuevo reporte de fuga de agua',
      emailTemplate,
    );

    return report;
  }

  async findAll() {
    return await this.reportsRepository.findAll();
  }
}