import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // logger: true → NestJS sẽ log tất cả HTTP request vào console (Render sẽ hiển thị)
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // origin: true → server tự echo lại đúng Origin của request
  // Phù hợp cho public API / open-source project
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
