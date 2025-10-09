import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: parseInt(process.env.PORT ?? '3003'),
      },
    },
  );
  await app.listen();
  Logger.log(`Tasks Service is running on port ${process.env.PORT ?? '3003'}`);
}
bootstrap();
