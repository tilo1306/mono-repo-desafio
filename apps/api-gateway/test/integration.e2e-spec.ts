import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Task } from '../src/entities/task.entity';
import { Comment } from '../src/entities/comment.entity';
import { Assignee } from '../src/entities/assignee.entity';
import { Notification } from '../src/entities/notification.entity';

describe('API Gateway Integration Tests', () => {
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
      await dataSource.query('TRUNCATE TABLE notifications CASCADE');
      await dataSource.query('TRUNCATE TABLE comments CASCADE');
      await dataSource.query('TRUNCATE TABLE assignees CASCADE');
      await dataSource.query('TRUNCATE TABLE tasks CASCADE');
      await dataSource.query('TRUNCATE TABLE users CASCADE');
    }
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {

      const registerData = {
        name: 'Integration Test User',
        email: 'integration@test.com',
        password: 'Test123!',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe(registerData.email);
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();

      const { accessToken, refreshToken } = loginResponse.body;
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(registerData.email);
      expect(profileResponse.body.name).toBe(registerData.name);
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();
      const newAccessToken = refreshResponse.body.accessToken;
      const newProfileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProfileResponse.body.email).toBe(registerData.email);
    });

    it('should handle authentication errors properly', async () => {

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('Task Management Integration', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {

      const registerData = {
        name: 'Task Test User',
        email: 'tasktest@test.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        });

      accessToken = loginResponse.body.accessToken;
      userId = loginResponse.body.user.id;
    });

    it('should complete full task lifecycle', async () => {

      const createTaskData = {
        title: 'Integration Test Task',
        description: 'This is a test task for integration testing',
        priority: 'HIGH',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: ['assignee@test.com'],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createTaskData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.task.title).toBe(createTaskData.title);
      const taskId = createResponse.body.task.id;
      const getTaskResponse = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getTaskResponse.body.success).toBe(true);
      expect(getTaskResponse.body.task.id).toBe(taskId);
      const updateData = {
        title: 'Updated Integration Test Task',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.task.title).toBe(updateData.title);
      expect(updateResponse.body.task.status).toBe(updateData.status);
      const commentData = {
        content: 'This is a test comment for integration testing',
      };

      const commentResponse = await request(app.getHttpServer())
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      expect(commentResponse.body.success).toBe(true);
      expect(commentResponse.body.comment.content).toBe(commentData.content);
      const getCommentsResponse = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getCommentsResponse.body.success).toBe(true);
      expect(getCommentsResponse.body.data).toHaveLength(1);
      const getTasksResponse = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getTasksResponse.body.success).toBe(true);
      expect(getTasksResponse.body.data).toHaveLength(1);
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should handle task filtering and pagination', async () => {

      const tasks = [
        {
          title: 'High Priority Task',
          description: 'This is a high priority task',
          priority: 'HIGH',
          status: 'TODO',
          deadline: '2024-12-31T23:59:59.000Z',
        },
        {
          title: 'Medium Priority Task',
          description: 'This is a medium priority task',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          deadline: '2024-12-31T23:59:59.000Z',
        },
        {
          title: 'Low Priority Task',
          description: 'This is a low priority task',
          priority: 'LOW',
          status: 'DONE',
          deadline: '2024-12-31T23:59:59.000Z',
        },
      ];

      for (const task of tasks) {
        await request(app.getHttpServer())
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(task)
          .expect(201);
      }
      const highPriorityResponse = await request(app.getHttpServer())
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(highPriorityResponse.body.data).toHaveLength(1);
      expect(highPriorityResponse.body.data[0].priority).toBe('HIGH');
      const inProgressResponse = await request(app.getHttpServer())
        .get('/api/tasks?status=IN_PROGRESS')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(inProgressResponse.body.data).toHaveLength(1);
      expect(inProgressResponse.body.data[0].status).toBe('IN_PROGRESS');
      const searchResponse = await request(app.getHttpServer())
        .get('/api/tasks?q=High Priority')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(searchResponse.body.data).toHaveLength(1);
      expect(searchResponse.body.data[0].title).toContain('High Priority');
      const paginationResponse = await request(app.getHttpServer())
        .get('/api/tasks?page=1&size=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(paginationResponse.body.data).toHaveLength(2);
      expect(paginationResponse.body.total).toBe(3);
      expect(paginationResponse.body.page).toBe(1);
      expect(paginationResponse.body.size).toBe(2);
    });
  });

  describe('Notification System Integration', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {

      const registerData = {
        name: 'Notification Test User',
        email: 'notiftest@test.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        });

      accessToken = loginResponse.body.accessToken;
      userId = loginResponse.body.user.id;
    });

    it('should handle notification flow when task is created', async () => {

      const createTaskData = {
        title: 'Notification Test Task',
        description: 'This task should trigger notifications',
        priority: 'HIGH',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createTaskData)
        .expect(201);

      const taskId = createResponse.body.task.id;
      await new Promise(resolve => setTimeout(resolve, 1000));
      const notificationsResponse = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(notificationsResponse.body).toBeDefined();
      expect(Array.isArray(notificationsResponse.body)).toBe(true);
    });

    it('should handle notification flow when comment is added', async () => {

      const createTaskData = {
        title: 'Comment Notification Test Task',
        description: 'This task will have comments',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createTaskData)
        .expect(201);

      const taskId = createResponse.body.task.id;
      const commentData = {
        content: 'This comment should trigger notifications',
      };

      await request(app.getHttpServer())
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const notificationsResponse = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(notificationsResponse.body).toBeDefined();
      expect(Array.isArray(notificationsResponse.body)).toBe(true);
    });

    it('should handle notification read operations', async () => {

      const createTaskData = {
        title: 'Read Notification Test Task',
        description: 'This task will test notification read operations',
        priority: 'LOW',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createTaskData)
        .expect(201);

      const taskId = createResponse.body.task.id;
      const commentData = {
        content: 'This comment will generate a notification',
      };

      await request(app.getHttpServer())
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const notificationsResponse = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (notificationsResponse.body.length > 0) {
        const notificationId = notificationsResponse.body[0].id;
        await request(app.getHttpServer())
          .post(`/api/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        await request(app.getHttpServer())
          .post('/api/notifications/read-all')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      }
    });
  });

  describe('User Management Integration', () => {
    let accessToken: string;

    beforeEach(async () => {

      const registerData = {
        name: 'User Management Test',
        email: 'usermgmt@test.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should handle user list operations', async () => {

      const additionalUsers = [
        { name: 'User One', email: 'user1@test.com', password: 'Test123!' },
        { name: 'User Two', email: 'user2@test.com', password: 'Test123!' },
        { name: 'User Three', email: 'user3@test.com', password: 'Test123!' },
      ];

      for (const user of additionalUsers) {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(user);
      }
      const usersResponse = await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(usersResponse.body)).toBe(true);
      expect(usersResponse.body.length).toBeGreaterThanOrEqual(4);
      const paginatedResponse = await request(app.getHttpServer())
        .get('/api/auth/users?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(paginatedResponse.body)).toBe(true);
      expect(paginatedResponse.body.length).toBeLessThanOrEqual(2);
    });

    it('should handle password update flow', async () => {
      const updatePasswordData = {
        password: 'Test123!',
        newPassword: 'NewTest123!',
      };
      await request(app.getHttpServer())
        .post('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePasswordData)
        .expect(200);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'usermgmt@test.com',
          password: 'NewTest123!',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.accessToken).toBeDefined();
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'usermgmt@test.com',
          password: 'Test123!',
        })
        .expect(401);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle various error scenarios', async () => {

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
      const registerData = {
        name: 'Duplicate Test',
        email: 'duplicate@test.com',
        password: 'Test123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);
      await request(app.getHttpServer())
        .post('/api/tasks')
        .send({
          title: '',
          description: '',
          priority: 'INVALID',
          status: 'INVALID',
        })
        .expect(401); // Should fail due to missing auth
      await request(app.getHttpServer())
        .get('/api/non-existent')
        .expect(404);
    });
  });
});
