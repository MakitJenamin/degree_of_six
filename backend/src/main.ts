import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Middleware log HTTP request — hiển thị trong Render Logs
  // VD: [HTTP] GET /api/people 200 - 12ms - ::ffff:x.x.x.x
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.url} ${res.statusCode} - ${ms}ms - ${req.ip}`);
    });
    next();
  });

  // Trim trailing slash để tránh mismatch: "vercel.app/" ≠ "vercel.app"
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');

  const allowedOrigins = [
    'http://localhost:3000',
    frontendUrl,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

