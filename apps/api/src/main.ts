import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

async function bootstrap() {
  Logger.log(
    `Starting server in environment: ${process.env.NODE_ENV} with RPC URL: ${process.env.NETWORK_RPC_URL}`,
  );
  const app = await NestFactory.create(AppModule);

  // CORS origins are configurable; defaults cover local monorepo dev (web on 3400).
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3400')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Monorepo port table: web 3400, api 3401.
  const port = process.env.API_PORT ?? process.env.PORT ?? 3401;
  await app.listen(port);
  Logger.log(`API listening on port ${port}`);
}
bootstrap();
