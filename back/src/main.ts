import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // ... et rejette la requête s'il y en a
      transform: true, // instancie réellement la classe du DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
