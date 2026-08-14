import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Policy Management API')
    .setDescription('Configurable policy types and policy instances')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger, {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  });

  // Drop unused empty schemas the plugin may emit for transformed primitives.
  if (document.components?.schemas?.Object) {
    delete document.components.schemas.Object;
  }

  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('API_PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
