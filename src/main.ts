import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';
import { ORGANIZATION_ID_HEADER } from '@/common/constants/header';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', ORGANIZATION_ID_HEADER],
    },
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.set('trust proxy', 1);
  app.set('query parser', 'extended');
  app.use(cookieParser());
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
      strategy: 'excludeAll',
    }),
  );

  await app.listen(process.env.PORT ?? 3100);
}

bootstrap().catch((error) => {
  console.error(error);
});
