import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getModelToken } from '@nestjs/sequelize';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import * as hbs from 'hbs';
import { User } from './modules/users/models/user.model';
import { UserRole } from './common/enums/user-role.enum';

async function seedAdmin(app: NestExpressApplication): Promise<void> {
  const logger = new Logger('SeedAdmin');
  const userModel = app.get<typeof User>(getModelToken(User));

  const existingAdmin = await userModel.findOne({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    logger.log(`Admin allaqachon mavjud: ${existingAdmin.email}`);
    return;
  }

  const email = process.env.ADMIN_EMAIL ?? 'admin@skillhub.uz';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const fullName = process.env.ADMIN_NAME ?? 'Super Admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  await userModel.create({
    full_name: fullName,
    email,
    password: hashedPassword,
    role: UserRole.ADMIN,
    is_active: true,
    telegram_id: null,
  });

  logger.log(`✅ Admin yaratildi — email: ${email}`);
  logger.warn(`⚠️  Parolni .env orqali o'zgartiring: ADMIN_PASSWORD`);
}

function registerHbsHelpers(): void {
  (hbs as unknown as { handlebars: { registerHelper: (name: string, fn: (...args: unknown[]) => unknown) => void } })
    .handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public' });

  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  registerHbsHelpers();

  // Admin seed — faqat admin yo'q bo'lsa yaratadi
  await seedAdmin(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on ${port}`);
}
void bootstrap();
