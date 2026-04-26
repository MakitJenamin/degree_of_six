import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mở cửa CORS để cấp quyền cho Frontend (localhost:3000) được phép chui vào lấy API
  app.enableCors({
    origin: 'http://localhost:3000',
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
