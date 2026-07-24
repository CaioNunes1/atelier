import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({
    origin: [configService.get<string>('WEB_URL'), configService.get<string>('ADMIN_URL')],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
    // Render exige 0.0.0.0 e usa a variável PORT
  const port = configService.get<number>('PORT') ?? 3333
  await app.listen(port, '0.0.0.0');
}
bootstrap();
