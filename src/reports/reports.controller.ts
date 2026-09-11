import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Post()
  async create(@Body() createReportDto: CreateReportDto) {
    return await this.reportsService.create(createReportDto);
  }

  @Get()
  async findAll() {
    return await this.reportsService.findAll();
  }
}