import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Auth Service E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE users CASCADE');
    }
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!',
      };

      const response = await request(app.getHttpServer())
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(userData)
        .expect(201);

      await request(app.getHttpServer())
        .post('/register')
        .send(userData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      const userData = {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer()).post('/register').send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Test123!',
      };

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/login')
        .send(loginData)
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        name: 'Refresh Test User',
        email: 'refresh@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer()).post('/register').send(userData);

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('User Profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const userData = {
        name: 'Profile Test User',
        email: 'profile@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer()).post('/register').send(userData);

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('profile@example.com');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/profile').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Password Update', () => {
    let accessToken: string;

    beforeEach(async () => {
      const userData = {
        name: 'Password Test User',
        email: 'password@example.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer()).post('/register').send(userData);

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should update password successfully', async () => {
      const updateData = {
        password: 'Test123!',
        newPassword: 'NewTest123!',
      };

      await request(app.getHttpServer())
        .post('/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'password@example.com',
          password: 'NewTest123!',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'password@example.com',
          password: 'Test123!',
        })
        .expect(401);
    });

    it('should reject wrong current password', async () => {
      const updateData = {
        password: 'WrongPassword',
        newPassword: 'NewTest123!',
      };

      await request(app.getHttpServer())
        .post('/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('User List', () => {
    let accessToken: string;

    beforeEach(async () => {
      const users = [
        { name: 'User One', email: 'user1@example.com', password: 'Test123!' },
        { name: 'User Two', email: 'user2@example.com', password: 'Test123!' },
        {
          name: 'User Three',
          email: 'user3@example.com',
          password: 'Test123!',
        },
      ];

      for (const user of users) {
        await request(app.getHttpServer()).post('/register').send(user);
      }

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'user1@example.com',
          password: 'Test123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should get paginated user list', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter users by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?email=user1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].email).toContain('user1');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('up');
    });
  });
});
