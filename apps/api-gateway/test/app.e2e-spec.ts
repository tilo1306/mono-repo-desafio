import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('Health Check', () => {
    it('/api/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('ok');
          expect(res.body.info).toBeDefined();
          expect(res.body.error).toBeDefined();
          expect(res.body.details).toBeDefined();
        });
    });

    it('/api/health/ready (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Authentication', () => {
    it('/api/auth/register (POST)', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.name).toBe(registerDto.name);
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('/api/auth/login (POST)', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.user).toBeDefined();
        });
    });

    it('/api/auth/refresh (POST)', () => {
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send(refreshDto)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });
  });

  describe('Tasks', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'taskuser@example.com',
        password: 'password123',
        name: 'Task User',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'taskuser@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/tasks (POST)', () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH',
        assigneeEmails: ['assignee@example.com'],
      };

      return request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createTaskDto)
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.task).toBeDefined();
          expect(res.body.task.title).toBe(createTaskDto.title);
          expect(res.body.task.description).toBe(createTaskDto.description);
        });
    });

    it('/api/tasks (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/tasks?page=1&size=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('/api/tasks/:id (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/tasks/task-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.task).toBeDefined();
          expect(res.body.task.id).toBe('task-1');
        });
    });

    it('/api/tasks/:id (PUT)', () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'MEDIUM',
      };

      return request(app.getHttpServer())
        .put('/api/tasks/task-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateTaskDto)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.task).toBeDefined();
          expect(res.body.task.title).toBe(updateTaskDto.title);
        });
    });

    it('/api/tasks/:id (DELETE)', () => {
      return request(app.getHttpServer())
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
        });
    });

    it('/api/tasks/:id/comments (POST)', () => {
      const createCommentDto = {
        content: 'Test comment',
      };

      return request(app.getHttpServer())
        .post('/api/tasks/task-1/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCommentDto)
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.comment).toBeDefined();
          expect(res.body.comment.content).toBe(createCommentDto.content);
        });
    });

    it('/api/tasks/:id/comments (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/tasks/task-1/comments?page=1&size=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });
  });

  describe('Notifications', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'notifuser@example.com',
        password: 'password123',
        name: 'Notification User',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notifuser@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/notifications (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/notifications?page=1&size=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('/api/notifications/:id/read (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/notification-1/read')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
        });
    });

    it('/api/notifications/read-all (POST)', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for protected routes without token', () => {
      return request(app.getHttpServer()).get('/api/tasks').expect(401);
    });

    it('should return 400 for invalid request data', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          name: '',
        })
        .expect(400);
    });

    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer()).get('/api/non-existent').expect(404);
    });
  });

  describe('Users List', () => {
    let accessToken: string;

    beforeEach(async () => {
      
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'user1@example.com',
        password: 'Password@123',
        name: 'User One',
      });

      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'user2@example.com',
        password: 'Password@123',
        name: 'User Two',
      });

      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'user3@example.com',
        password: 'Password@123',
        name: 'User Three',
      });
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'Password@123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/auth/users (GET) - should return paginated list of users', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(3);
          
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('totalPages');
          expect(res.body.meta).toHaveProperty('hasNext');
          expect(res.body.meta).toHaveProperty('hasPrev');
          
          res.body.data.forEach((user: any) => {
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('avatar');
            expect(user).not.toHaveProperty('password');
            expect(user).not.toHaveProperty('id');
            expect(user).not.toHaveProperty('createdAt');
            expect(user).not.toHaveProperty('updatedAt');
          });

          const userNames = res.body.data.map((user: any) => user.name);
          expect(userNames).toContain('User One');
          expect(userNames).toContain('User Two');
          expect(userNames).toContain('User Three');
        });
    });

    it('/api/auth/users (GET) - should filter users by email', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users?email=user1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toBeDefined();
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          
          res.body.data.forEach((user: any) => {
            expect(user.email).toContain('user1');
          });
        });
    });

    it('/api/auth/users (GET) - should handle pagination correctly', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toBeDefined();
          expect(res.body.data.length).toBeLessThanOrEqual(2);
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(2);
        });
    });

    it('/api/auth/users (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users')
        .expect(401);
    });

    it('/api/auth/users (GET) - should work with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Password Update', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/auth/password (POST) - should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/auth/password')
        .send({
          password: 'password123',
          newPassword: 'newPassword456',
        })
        .expect(401);
    });

    it('/api/auth/password (POST) - should update password successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
          newPassword: 'newPassword456',
        })
        .expect(200);
    });

    it('/api/auth/password (POST) - should reject invalid current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'wrongPassword',
          newPassword: 'newPassword456',
        })
        .expect(401);
    });

    it('/api/auth/password (POST) - should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('/api/auth/password (POST) - should work with new password after update', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
          newPassword: 'newPassword456',
        })
        .expect(200);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newPassword456',
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('/api/auth/password (POST) - should not work with old password after update', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
          newPassword: 'newPassword456',
        })
        .expect(200);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });
});
