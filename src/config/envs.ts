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

  // AWS S3
  // Credenciales leídas automáticamente por AWS SDK desde:
  //   - Variables de entorno: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
  //   - Perfil de credenciales (~/.aws/credentials)
  //   - IAM role (recomendado en producción)
  awsRegion: env.get('AWS_REGION').required().asString(),
  awsS3Bucket: env.get('AWS_S3_BUCKET').required().asString(),
  // URL base pública (CloudFront u otro CDN). Opcional.
  // Si no se define, se usa la URL estándar de S3.
  awsS3PublicBaseUrl: env.get('AWS_S3_PUBLIC_BASE_URL').asString(),
};