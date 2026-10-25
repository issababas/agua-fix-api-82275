import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { envs } from '../config/envs';

// __dirname apunta a src/database/ (ts-node) o a dist/database/ (node)
// Ambas rutas resuelven correctamente con este patrón.
export const AppDataSource = new DataSource({
  type: 'postgres',

  host: envs.dbHost,
  port: envs.dbPort,
  username: envs.dbUsername,
  password: envs.dbPassword,
  database: envs.dbName,

  entities: [
    join(__dirname, '..', '**', '*.entity.{ts,js}'),
  ],

  migrations: [
    join(__dirname, 'migrations', '*.{ts,js}'),
  ],

  synchronize: false,
});