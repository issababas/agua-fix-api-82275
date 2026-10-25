import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Report } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    EmailModule,
    StorageModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
    ReportsRepository,
  ],

  exports: [
    ReportsService,
  ],
})
export class ReportsModule {}