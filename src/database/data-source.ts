import 'dotenv/config';
import { DataSource } from 'typeorm';
import { envs } from '../config/envs';

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: envs.dbHost,
  port: envs.dbPort,
  username: envs.dbUsername,
  password: envs.dbPassword,
  database: envs.dbName,

  entities: [
    'src/**/*.entity.ts',
  ],

  migrations: [
    'src/database/migrations/*.ts',
  ],

  synchronize: false,
});