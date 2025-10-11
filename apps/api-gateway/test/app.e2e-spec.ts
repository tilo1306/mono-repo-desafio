import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
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
});
