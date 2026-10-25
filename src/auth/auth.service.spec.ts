
import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const hashedPassword = '$2a$10$fakehashedpassword';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('NO devuelve password ni passwordHash en la respuesta', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.create.mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isNotificationEnabled: true,
      });

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'plaintext123',
      });

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('lanza BadRequestException si el email ya existe', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
      });

      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('rechaza una contraseña incorrecta', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        isNotificationEnabled: true,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequestException si el usuario no existe', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'no@exist.com',
          password: 'any',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
