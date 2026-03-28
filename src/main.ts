import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CONFIG_INJECT_KEY, ConfigType } from '@src/config/app.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule, { logger });
  const config = app.get(CONFIG_INJECT_KEY) as ConfigType;

  app.enableCors({
    origin: '*', // For development, allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(config.port, () => {
    logger.log(`Application started on port: ${config.port}`);
  });
}

void bootstrap();
