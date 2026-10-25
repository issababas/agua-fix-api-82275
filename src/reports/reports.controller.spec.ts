
import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  resolveReport: jest.fn(),
};

const mockDto = {
  address: 'Calle Falsa 123',
  description: 'Fuga visible',
  severity: 'high',
  reporterPhone: '4771234567',
};

const mockMulterFile = {
  originalname: 'fuga.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake'),
  size: 100,
  fieldname: 'photo',
  encoding: '7bit',
  stream: undefined,
  destination: '',
  filename: '',
  path: '',
} as Express.Multer.File;

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /reports', () => {
    it('lanza BadRequestException si no se adjunta photo', async () => {
      await expect(
        controller.create(mockDto, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('delega al service con el DTO y el archivo', async () => {
      const report = {
        id: 1,
        ...mockDto,
        photoUrl: 'url',
        isResolved: false,
      };

      mockService.create.mockResolvedValueOnce(report);

      const result = await controller.create(mockDto, mockMulterFile);

      expect(mockService.create).toHaveBeenCalledWith(
        mockDto,
        expect.objectContaining({
          originalname: 'fuga.jpg',
          mimetype: 'image/jpeg',
        }),
      );

      expect(result).toEqual(report);
    });
  });

  describe('GET /reports', () => {
    it('devuelve el listado del service', async () => {
      const reports = [
        { id: 1, photoUrl: 'url1', repairPhotoUrl: null },
        { id: 2, photoUrl: 'url2', repairPhotoUrl: 'url3' },
      ];

      mockService.findAll.mockResolvedValueOnce(reports);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('photoUrl', 'url1');
    });
  });

  describe('PATCH /reports/:id/resolve', () => {
    it('lanza BadRequestException si no se adjunta photo', async () => {
      await expect(
        controller.resolve(1, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('delega al service con id y archivo', async () => {
      const resolved = {
        id: 1,
        isResolved: true,
        repairPhotoUrl: 'url-repair',
      };

      mockService.resolveReport.mockResolvedValueOnce(resolved);

      const result = await controller.resolve(1, mockMulterFile);

      expect(mockService.resolveReport).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          originalname: 'fuga.jpg',
        }),
      );

      expect(result.isResolved).toBe(true);
    });
  });
});
