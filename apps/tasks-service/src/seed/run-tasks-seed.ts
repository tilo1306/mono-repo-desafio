import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TasksSeed } from './tasks.seed';
import { DataSource } from 'typeorm';

async function runTasksSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  
  const seed = new TasksSeed(dataSource);
  await seed.run();
  
  await app.close();
}

runTasksSeed()
  .then(() => {
    console.log('✅ Tasks seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tasks seed failed:', error);
    process.exit(1);
  });
