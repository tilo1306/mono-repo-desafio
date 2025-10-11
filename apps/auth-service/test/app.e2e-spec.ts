import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppService } from '../src/app.service';
import { User } from '../src/entities/user.entity';
import { TestAppModule } from './test-app.module';

describe('Auth Service E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let appService: AppService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    appService = moduleFixture.get<AppService>(AppService);

    await app.init();

    await dataSource.getRepository(User).clear();
  });

  afterEach(async () => {
    if (dataSource) {
      await dataSource.getRepository(User).clear();
    }
    await app.close();
  });

  describe('Database', () => {
    it('should have clean database', async () => {
      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(0);
    });
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(1);

      const user = await dataSource.getRepository(User).findOne({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user!.name).toBe(userData.name);
      expect(user!.email).toBe(userData.email);
      expect(user!.password).toBeDefined();
      expect(user!.password).not.toBe(userData.password);
      expect(user!.password.length).toBeGreaterThan(50);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      await expect(appService.register(userData)).rejects.toThrow(
        'Email already exists',
      );

      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(1);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);
    });

    it('should login successfully and return tokens', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'password123',
      };

      const result = await appService.login(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should not login with wrong password', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'wrongpassword',
      };

      await expect(appService.login(loginData)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(appService.login(loginData)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      const loginResult = await appService.login({
        email: userData.email,
        password: userData.password,
      });

      refreshToken = loginResult.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const result = await appService.refreshToken({ refreshToken });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should not refresh with invalid token', async () => {
      await expect(
        appService.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow('Error refreshing token');
    });
  });

  describe('User Profile', () => {
    let userId: string;

    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);
      const user = await dataSource.getRepository(User).findOne({
        where: { email: userData.email },
      });
      userId = user!.id;
    });

    it('should get user profile successfully', async () => {
      const result = await appService.profile(userId);

      expect(result).toHaveProperty('name', 'João Silva');
      expect(result).toHaveProperty('email', 'joao@example.com');
      expect(result).toHaveProperty('avatar');
      expect(result.avatar).toContain('robohash.org');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(appService.profile(nonExistentUserId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('Avatar Upload', () => {
    let userId: string;

    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);
      const user = await dataSource.getRepository(User).findOne({
        where: { email: userData.email },
      });
      userId = user!.id;
    });

    it('should upload avatar successfully', async () => {
      const mockFile = {
        originalname: 'avatar.jpg',
        buffer: Buffer.from('fake-image-data'),
      };

      const result = await appService.avatar(userId, mockFile);

      expect(result).toMatch(/\/api\/auth\/avatar\/\w+\/\d+-\w+\.jpg/);
      
      const updatedUser = await dataSource.getRepository(User).findOne({
        where: { id: userId },
      });
      expect(updatedUser!.avatar).toBe(result);
    });

    it('should replace existing avatar', async () => {
      const mockFile1 = {
        originalname: 'avatar1.jpg',
        buffer: Buffer.from('fake-image-data-1'),
      };

      const mockFile2 = {
        originalname: 'avatar2.png',
        buffer: Buffer.from('fake-image-data-2'),
      };

      const result1 = await appService.avatar(userId, mockFile1);
      const result2 = await appService.avatar(userId, mockFile2);

      expect(result1).toMatch(/\/api\/auth\/avatar\/\w+\/\d+-\w+\.jpg/);
      expect(result2).toMatch(/\/api\/auth\/avatar\/\w+\/\d+-\w+\.png/);
      expect(result1).not.toBe(result2);

      const updatedUser = await dataSource.getRepository(User).findOne({
        where: { id: userId },
      });
      expect(updatedUser!.avatar).toBe(result2);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174999';
      const mockFile = {
        originalname: 'avatar.jpg',
        buffer: Buffer.from('fake-image-data'),
      };

      await expect(appService.avatar(nonExistentUserId, mockFile)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
