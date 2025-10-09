import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { User } from '../src/entities/user.entity';
import { BcryptService } from '../src/hashing/bcrypt.service';
import { HashingService } from '../src/hashing/hashing.service';
import { AuthJwtModule } from '../src/jwt/jwt.module';
import { UserRepository } from '../src/repositories/user.repository';
import { TestDataSource } from './typeorm-test.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => TestDataSource.options,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    AuthJwtModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class TestAppModule {}
