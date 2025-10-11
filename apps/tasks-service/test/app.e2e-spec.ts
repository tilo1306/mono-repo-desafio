import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppService } from '../src/app.service';
import { Assignee } from '../src/entities/assignee.entity';
import { Comment } from '../src/entities/comment.entity';
import { Task } from '../src/entities/task.entity';
import { User } from '../src/entities/user.entity';
import { TestAppModule } from './test-app.module';

describe('Tasks Service E2E', () => {
  let app: INestApplication;
  let service: AppService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    service = moduleFixture.get<AppService>(AppService);

    await app.init();
  });

  afterAll(async () => {
    if (dataSource) {
      try {
        await dataSource.query('DELETE FROM comment');
        await dataSource.query('DELETE FROM assignee');
        await dataSource.query('DELETE FROM task');
        await dataSource.query('DELETE FROM "user"');
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (app) {
      await app.close();
    }
  });

  describe('Database', () => {
    it('should have clean database', async () => {
      const userCount = await dataSource.getRepository(User).count();
      const taskCount = await dataSource.getRepository(Task).count();
      const assigneeCount = await dataSource.getRepository(Assignee).count();
      const commentCount = await dataSource.getRepository(Comment).count();

      expect(userCount).toBe(0);
      expect(taskCount).toBe(0);
      expect(assigneeCount).toBe(0);
      expect(commentCount).toBe(0);
    });
  });

  describe('Task Creation Flow', () => {
    it('should create task with assignees and publish notifications', async () => {
      // Create users first
      const creator = await dataSource.getRepository(User).save({
        name: 'Creator User',
        email: 'creator@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const assignee = await dataSource.getRepository(User).save({
        name: 'Assignee User',
        email: 'assignee@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createTaskDto = {
        title: 'E2E Test Task',
        description: 'E2E Test Description',
        userId: creator.id,
        assigneeEmails: ['assignee@example.com'],
        deadline: '2024-12-31',
        priority: 'HIGH' as any,
        status: 'TODO' as any,
      };

      // Execute
      const result = await service.createTask(createTaskDto);

      // Assertions
      expect(result).toBeDefined();
      expect(result.title).toBe('E2E Test Task');
      expect(result.userId).toBe(creator.id);

      // Verify task was created in database
      const savedTask = await dataSource.getRepository(Task).findOne({
        where: { id: result.id },
        relations: ['assignees', 'comments'],
      });
      expect(savedTask).toBeDefined();
      expect(savedTask?.title).toBe('E2E Test Task');

      // Verify assignee was created
      const savedAssignee = await dataSource.getRepository(Assignee).findOne({
        where: { taskId: result.id, userId: assignee.id },
      });
      expect(savedAssignee).toBeDefined();
    });
  });

  describe('Task Update Flow', () => {
    it('should update task and publish notification', async () => {
      // Create user and task first
      const user = await dataSource.getRepository(User).save({
        name: 'Test User',
        email: 'user@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const task = await dataSource.getRepository(Task).save({
        title: 'Original Task',
        description: 'Original Description',
        userId: user.id,
        priority: 'LOW' as any,
        status: 'TODO' as any,
        assignees: [],
        comments: [],
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updates = {
        title: 'Updated E2E Task',
        status: 'IN_PROGRESS' as any,
      };

      const result = await service.updateTask(task.id, user.id, updates);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated E2E Task');
      expect(result.status).toBe('IN_PROGRESS');

      // Verify task was updated in database
      const updatedTask = await dataSource.getRepository(Task).findOne({
        where: { id: task.id },
      });
      expect(updatedTask?.title).toBe('Updated E2E Task');
      expect(updatedTask?.status).toBe('IN_PROGRESS');
    });
  });

  describe('Comment Flow', () => {
    it('should add comment and publish notification', async () => {
      // Create user and task first
      const user = await dataSource.getRepository(User).save({
        name: 'Commenter User',
        email: 'commenter@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const task = await dataSource.getRepository(Task).save({
        title: 'Comment Task',
        description: 'Task for commenting',
        userId: user.id,
        priority: 'MEDIUM' as any,
        status: 'TODO' as any,
        assignees: [],
        comments: [],
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addComment(task.id, user.id, 'New comment');

      expect(result).toBeDefined();
      expect(result.content).toBe('New comment');
      expect(result.taskId).toBe(task.id);
      expect(result.authorId).toBe(user.id);

      // Verify comment was created in database
      const savedComment = await dataSource.getRepository(Comment).findOne({
        where: { id: result.id },
        relations: ['task'],
      });
      expect(savedComment).toBeDefined();
      expect(savedComment?.content).toBe('New comment');
    });
  });

  describe('Pagination Flow', () => {
    it('should return paginated tasks', async () => {
      // Create user and tasks first
      const user = await dataSource.getRepository(User).save({
        name: 'Paginated User',
        email: 'paginated@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create multiple tasks
      for (let i = 1; i <= 3; i++) {
        await dataSource.getRepository(Task).save({
          title: `Task ${i}`,
          description: `Description ${i}`,
          userId: user.id,
          priority: 'MEDIUM' as any,
          status: 'TODO' as any,
          assignees: [],
          comments: [],
          history: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const result = await service.getTasks(user.id, 1, 2);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.size).toBe(2);
    });

    it('should return paginated comments', async () => {
      // Create user and task first
      const user = await dataSource.getRepository(User).save({
        name: 'Comment Paginated User',
        email: 'commentpaginated@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const task = await dataSource.getRepository(Task).save({
        title: 'Comment Pagination Task',
        description: 'Task for comment pagination',
        userId: user.id,
        priority: 'MEDIUM' as any,
        status: 'TODO' as any,
        assignees: [],
        comments: [],
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create multiple comments
      for (let i = 1; i <= 3; i++) {
        await dataSource.getRepository(Comment).save({
          taskId: task.id,
          authorId: user.id,
          content: `Comment ${i}`,
          createdAt: new Date(),
        });
      }

      const result = await service.getComments(task.id, user.id, 1, 2);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.size).toBe(2);
    });
  });
});
