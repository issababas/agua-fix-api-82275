import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new BadRequestException(
        'El correo electrónico ya está registrado',
      );
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    const user = await this.usersService.create({
  ...createUserDto,
  password: hashedPassword,
});

return {
  id: user.id,
  name: user.name,
  email: user.email,
  isNotificationEnabled: user.isNotificationEnabled,
  };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

    if (!user) {
      throw new BadRequestException(
        'Correo o contraseña incorrectos',
      );
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new BadRequestException(
        'Correo o contraseña incorrectos',
      );
    }

    return {
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isNotificationEnabled: user.isNotificationEnabled,
      },
    };
  }
}