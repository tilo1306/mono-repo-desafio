import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Tasks Service E2E Tests', () => {
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
      await dataSource.query('TRUNCATE TABLE comments CASCADE');
      await dataSource.query('TRUNCATE TABLE assignees CASCADE');
      await dataSource.query('TRUNCATE TABLE tasks CASCADE');
    }
  });

  describe('Task Creation', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'HIGH',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: ['assignee@example.com'],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.title).toBe(taskData.title);
      expect(response.body.task.description).toBe(taskData.description);
      expect(response.body.task.priority).toBe(taskData.priority);
      expect(response.body.task.status).toBe(taskData.status);
    });

    it('should create a task without assignees', async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Solo Task',
        description: 'This is a solo task',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: [],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe(taskData.title);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/createTask')
        .send({
          userId: 'test-user-id',
          title: '',
          description: '',
          priority: 'INVALID',
          status: 'INVALID',
        })
        .expect(400);
    });
  });

  describe('Task Retrieval', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Retrieval Test Task',
        description: 'This task will be retrieved',
        priority: 'LOW',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: [],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData);

      taskId = response.body.task.id;
    });

    it('should get task by ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/getTask')
        .send({
          userId: 'test-user-id',
          taskId: taskId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.id).toBe(taskId);
      expect(response.body.task.title).toBe('Retrieval Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .post('/getTask')
        .send({
          userId: 'test-user-id',
          taskId: 'non-existent-id',
        })
        .expect(404);
    });

    it('should get tasks with pagination', async () => {
      const response = await request(app.getHttpServer())
        .post('/getTasks')
        .send({
          userId: 'test-user-id',
          page: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app.getHttpServer())
        .post('/getTasks')
        .send({
          userId: 'test-user-id',
          page: 1,
          size: 10,
          priority: 'LOW',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].priority).toBe('LOW');
    });

    it('should filter tasks by status', async () => {
      const response = await request(app.getHttpServer())
        .post('/getTasks')
        .send({
          userId: 'test-user-id',
          page: 1,
          size: 10,
          status: 'TODO',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].status).toBe('TODO');
    });

    it('should search tasks by text', async () => {
      const response = await request(app.getHttpServer())
        .post('/getTasks')
        .send({
          userId: 'test-user-id',
          page: 1,
          size: 10,
          q: 'Retrieval',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].title).toContain('Retrieval');
    });
  });

  describe('Task Updates', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Update Test Task',
        description: 'This task will be updated',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: [],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData);

      taskId = response.body.task.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        userId: 'test-user-id',
        taskId: taskId,
        updates: {
          title: 'Updated Task Title',
          description: 'Updated task description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/updateTask')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.title).toBe('Updated Task Title');
      expect(response.body.task.status).toBe('IN_PROGRESS');
      expect(response.body.task.priority).toBe('HIGH');
    });

    it('should return 404 for non-existent task update', async () => {
      const updateData = {
        userId: 'test-user-id',
        taskId: 'non-existent-id',
        updates: {
          title: 'Updated Title',
        },
      };

      await request(app.getHttpServer())
        .post('/updateTask')
        .send(updateData)
        .expect(404);
    });
  });

  describe('Task Deletion', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Delete Test Task',
        description: 'This task will be deleted',
        priority: 'LOW',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: [],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData);

      taskId = response.body.task.id;
    });

    it('should delete task successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/deleteTask')
        .send({
          userId: 'test-user-id',
          taskId: taskId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      await request(app.getHttpServer())
        .post('/getTask')
        .send({
          userId: 'test-user-id',
          taskId: taskId,
        })
        .expect(404);
    });

    it('should return 404 for non-existent task deletion', async () => {
      await request(app.getHttpServer())
        .post('/deleteTask')
        .send({
          userId: 'test-user-id',
          taskId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('Comments', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = {
        userId: 'test-user-id',
        title: 'Comment Test Task',
        description: 'This task will have comments',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '2024-12-31T23:59:59.000Z',
        assigneeEmails: [],
      };

      const response = await request(app.getHttpServer())
        .post('/createTask')
        .send(taskData);

      taskId = response.body.task.id;
    });

    it('should add comment successfully', async () => {
      const commentData = {
        userId: 'test-user-id',
        taskId: taskId,
        content: 'This is a test comment',
      };

      const response = await request(app.getHttpServer())
        .post('/addComment')
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.content).toBe(commentData.content);
      expect(response.body.comment.taskId).toBe(taskId);
    });

    it('should get comments for a task', async () => {
      const commentData = {
        userId: 'test-user-id',
        taskId: taskId,
        content: 'This is a test comment',
      };

      await request(app.getHttpServer()).post('/addComment').send(commentData);

      const response = await request(app.getHttpServer())
        .post('/getComments')
        .send({
          userId: 'test-user-id',
          taskId: taskId,
          page: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for comments on non-existent task', async () => {
      await request(app.getHttpServer())
        .post('/addComment')
        .send({
          userId: 'test-user-id',
          taskId: 'non-existent-id',
          content: 'This comment should fail',
        })
        .expect(404);
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
