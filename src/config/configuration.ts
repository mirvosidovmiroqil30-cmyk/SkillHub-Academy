export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    pass: process.env.DB_PASS || '',
    name: process.env.DB_NAME || 'skillhub_academy',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10) || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
});
