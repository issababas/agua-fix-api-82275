
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';

const mockFile = {
  originalname: 'fuga.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake'),
  size: 100,
};

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockEmail = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
};

const mockStorage = {
  uploadFile: jest.fn().mockResolvedValue(
    'https://s3.example.com/reports/uuid-fuga.jpg',
  ),
  deleteFileByUrl: jest.fn().mockResolvedValue(undefined),
};

const mockDto = {
  address: 'Calle Falsa 123',
  description: 'Fuga visible',
  severity: 'high',
  reporterPhone: '4771234567',
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: mockRepo },
        { provide: EmailService, useValue: mockEmail },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('sube la foto a reports/ y persiste photoUrl', async () => {
      const savedReport = {
        id: 1,
        ...mockDto,
        photoUrl: 'https://s3.example.com/reports/uuid-fuga.jpg',
        isResolved: false,
      };

      mockRepo.create.mockResolvedValueOnce(savedReport);

      const result = await service.create(mockDto, mockFile);

      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'reports',
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          photoUrl: 'https://s3.example.com/reports/uuid-fuga.jpg',
        }),
      );

      expect(result.photoUrl).toBe(
        'https://s3.example.com/reports/uuid-fuga.jpg',
      );
    });

    it('limpia el objeto de S3 si la BD falla', async () => {
      mockRepo.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.create(mockDto, mockFile),
      ).rejects.toThrow('DB error');

      expect(mockStorage.deleteFileByUrl).toHaveBeenCalledWith(
        'https://s3.example.com/reports/uuid-fuga.jpg',
      );
    });

    it('no falla si el correo falla después de guardar el reporte', async () => {
      const savedReport = {
        id: 1,
        ...mockDto,
        photoUrl: 'https://s3.example.com/reports/uuid-fuga.jpg',
        isResolved: false,
      };

      mockRepo.create.mockResolvedValueOnce(savedReport);
      mockEmail.sendEmail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.create(mockDto, mockFile),
      ).resolves.toEqual(savedReport);
    });
  });

  describe('findAll', () => {
    it('devuelve reportes con photoUrl y repairPhotoUrl', async () => {
      const reports = [
        {
          id: 1,
          photoUrl: 'url1',
          repairPhotoUrl: null,
          isResolved: false,
        },
        {
          id: 2,
          photoUrl: 'url2',
          repairPhotoUrl: 'url3',
          isResolved: true,
        },
      ];

      mockRepo.findAll.mockResolvedValueOnce(reports);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('photoUrl');
      expect(result[1]).toHaveProperty('repairPhotoUrl');
    });
  });

  describe('resolveReport', () => {
    it('marca el reporte como resuelto y guarda repairPhotoUrl', async () => {
      const report = {
        id: 1,
        ...mockDto,
        photoUrl: 'url1',
        repairPhotoUrl: null,
        isResolved: false,
      };

      mockRepo.findById.mockResolvedValueOnce(report);

      mockStorage.uploadFile.mockResolvedValueOnce(
        'https://s3.example.com/repairs/uuid-fix.jpg',
      );

      mockRepo.save.mockResolvedValueOnce({
        ...report,
        isResolved: true,
        repairPhotoUrl: 'https://s3.example.com/repairs/uuid-fix.jpg',
      });

      const result = await service.resolveReport(1, mockFile);

      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'repairs',
      );
      expect(result.isResolved).toBe(true);
      expect(result.repairPhotoUrl).toBe(
        'https://s3.example.com/repairs/uuid-fix.jpg',
      );
    });

    it('lanza NotFoundException si el reporte no existe', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.resolveReport(999, mockFile),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza ConflictException si el reporte ya estaba resuelto', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 1,
        isResolved: true,
      });

      await expect(
        service.resolveReport(1, mockFile),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
