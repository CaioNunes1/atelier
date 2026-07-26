import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  const webUrl   = configService.get<string>('WEB_URL') ?? ''
  const adminUrl = configService.get<string>('ADMIN_URL') ?? ''
  const allowedOrigins = [webUrl, adminUrl].filter(Boolean)

  console.log('Origens CORS permitidas:', allowedOrigins)

  app.enableCors({
    origin: (origin, callback) => {
      // Sem origin = Postman / server-to-server → permite
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      console.warn('CORS bloqueado:', origin)
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  app.useGlobalFilters(new GlobalExceptionFilter())

  const port = configService.get<number>('PORT') ?? 3333
  await app.listen(port, '0.0.0.0')
  console.log(`API rodando na porta ${port}`)
}

bootstrap();