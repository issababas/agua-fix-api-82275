import 'dotenv/config';
import env from 'env-var';

export const envs = {
  port: env.get('PORT').default('3000').asPortNumber(),

  dbHost: env.get('DB_HOST').required().asString(),
  dbPort: env.get('DB_PORT').default('5432').asPortNumber(),
  dbUsername: env.get('DB_USERNAME').required().asString(),
  dbPassword: env.get('DB_PASSWORD').required().asString(),
  dbName: env.get('DB_NAME').required().asString(),

  mailHost: env.get('MAIL_HOST').required().asString(),
  mailPort: env.get('MAIL_PORT').default('587').asPortNumber(),
  mailUser: env.get('MAIL_USER').required().asString(),
  mailPassword: env.get('MAIL_PASSWORD').required().asString(),
  mailFrom: env.get('MAIL_FROM').required().asString(),
  mailTo: env.get('MAIL_TO').required().asString(),
};