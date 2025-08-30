import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('query parser', 'extended');
  await app.listen(process.env.PORT ?? 3100);
}

bootstrap().catch((error) => {
  console.error(error);
});
