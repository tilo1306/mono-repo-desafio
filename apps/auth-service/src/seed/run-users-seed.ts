import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersSeed } from './users.seed';
import { HashingService } from '../hashing/hashing.service';
import { DataSource } from 'typeorm';

async function runUsersSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  const hashingService = app.get(HashingService);
  
  const seed = new UsersSeed(dataSource, hashingService);
  await seed.run();
  
  await app.close();
}

runUsersSeed()
  .then(() => {
    console.log('✅ Users seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Users seed failed:', error);
    process.exit(1);
  });
