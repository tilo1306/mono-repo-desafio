import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Notifications Service E2E Tests', () => {
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
    }
  });

  describe('Notification Creation', () => {
    it('should create notification successfully', async () => {
      const notificationData = {
        id: 'test-notification-1',
        type: NotificationType.TASK_CREATED,
        userId: 'test-user-id',
        taskId: 'test-task-id',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { taskId: 'test-task-id' },
        createdAt: new Date(),
      };

      const response = await request(app.getHttpServer())
        .post('/notification.created')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification).toBeDefined();
      expect(response.body.notification.title).toBe(notificationData.title);
      expect(response.body.notification.message).toBe(notificationData.message);
    });

    it('should create comment notification', async () => {
      const notificationData = {
        id: 'test-comment-notification-1',
        type: NotificationType.COMMENT_CREATED,
        userId: 'test-user-id',
        taskId: 'test-task-id',
        title: 'New Comment',
        message: 'A new comment was added to your task',
        data: {
          taskId: 'test-task-id',
          commentContent: 'This is a test comment',
          commenterId: 'commenter-id',
          taskTitle: 'Test Task',
        },
        createdAt: new Date(),
      };

      const response = await request(app.getHttpServer())
        .post('/notification.created')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification.type).toBe(
        NotificationType.COMMENT_CREATED,
      );
    });

    it('should create task status change notification', async () => {
      const notificationData = {
        id: 'test-status-notification-1',
        type: NotificationType.TASK_STATUS_CHANGED,
        userId: 'test-user-id',
        taskId: 'test-task-id',
        title: 'Task Status Changed',
        message: 'Your task status has been updated',
        data: {
          taskId: 'test-task-id',
          oldStatus: 'TODO',
          newStatus: 'IN_PROGRESS',
        },
        createdAt: new Date(),
      };

      const response = await request(app.getHttpServer())
        .post('/notification.created')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification.type).toBe(
        NotificationType.TASK_STATUS_CHANGED,
      );
    });
  });

  describe('Notification Retrieval', () => {
    beforeEach(async () => {
      const notifications = [
        {
          id: 'notification-1',
          type: NotificationType.TASK_CREATED,
          userId: 'test-user-1',
          taskId: 'task-1',
          title: 'Task Created',
          message: 'A new task was created',
          data: { taskId: 'task-1' },
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notification-2',
          type: NotificationType.COMMENT_CREATED,
          userId: 'test-user-1',
          taskId: 'task-1',
          title: 'New Comment',
          message: 'A new comment was added',
          data: { taskId: 'task-1' },
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notification-3',
          type: NotificationType.TASK_CREATED,
          userId: 'test-user-2',
          taskId: 'task-2',
          title: 'Task Created',
          message: 'A new task was created',
          data: { taskId: 'task-2' },
          isRead: false,
          createdAt: new Date(),
        },
      ];

      for (const notification of notifications) {
        await request(app.getHttpServer())
          .post('/notification.created')
          .send(notification);
      }
    });

    it('should get user notifications', async () => {
      const response = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'test-user-1',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBe(2);

      response.body.notifications.forEach((notification: any) => {
        expect(notification.userId).toBe('test-user-1');
      });
    });

    it('should get user notifications with limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'test-user-1',
          limit: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(response.body.notifications.length).toBeLessThanOrEqual(1);
    });

    it('should get user notifications without limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'test-user-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(response.body.notifications.length).toBe(2);
    });

    it('should return empty array for user with no notifications', async () => {
      const response = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'non-existent-user',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(response.body.notifications.length).toBe(0);
    });
  });

  describe('Notification Mark as Read', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notificationData = {
        id: 'mark-read-notification-1',
        type: NotificationType.TASK_CREATED,
        userId: 'test-user-1',
        taskId: 'task-1',
        title: 'Task Created',
        message: 'A new task was created',
        data: { taskId: 'task-1' },
        isRead: false,
        createdAt: new Date(),
      };

      const response = await request(app.getHttpServer())
        .post('/notification.created')
        .send(notificationData);

      notificationId = response.body.notification.id;
    });

    it('should mark notification as read', async () => {
      const response = await request(app.getHttpServer())
        .post('/markAsRead')
        .send({
          notificationId: notificationId,
          userId: 'test-user-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const getResponse = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'test-user-1',
          limit: 10,
        });

      const notification = getResponse.body.notifications.find(
        (n: any) => n.id === notificationId,
      );
      expect(notification.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app.getHttpServer())
        .post('/markAsRead')
        .send({
          notificationId: 'non-existent-id',
          userId: 'test-user-1',
        })
        .expect(404);
    });

    it('should not mark notification as read for different user', async () => {
      await request(app.getHttpServer())
        .post('/markAsRead')
        .send({
          notificationId: notificationId,
          userId: 'different-user',
        })
        .expect(404);
    });
  });

  describe('Mark All Notifications as Read', () => {
    beforeEach(async () => {
      const notifications = [
        {
          id: 'mark-all-1',
          type: NotificationType.TASK_CREATED,
          userId: 'test-user-mark-all',
          taskId: 'task-1',
          title: 'Task Created 1',
          message: 'A new task was created',
          data: { taskId: 'task-1' },
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'mark-all-2',
          type: NotificationType.COMMENT_CREATED,
          userId: 'test-user-mark-all',
          taskId: 'task-1',
          title: 'New Comment 1',
          message: 'A new comment was added',
          data: { taskId: 'task-1' },
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'mark-all-3',
          type: NotificationType.TASK_STATUS_CHANGED,
          userId: 'test-user-mark-all',
          taskId: 'task-1',
          title: 'Status Changed 1',
          message: 'Task status was updated',
          data: { taskId: 'task-1' },
          isRead: false,
          createdAt: new Date(),
        },
      ];

      for (const notification of notifications) {
        await request(app.getHttpServer())
          .post('/notification.created')
          .send(notification);
      }
    });

    it('should mark all notifications as read for a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/markAllAsRead')
        .send({
          userId: 'test-user-mark-all',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const getResponse = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'test-user-mark-all',
          limit: 10,
        });

      getResponse.body.notifications.forEach((notification: any) => {
        expect(notification.isRead).toBe(true);
      });
    });

    it('should handle user with no notifications', async () => {
      const response = await request(app.getHttpServer())
        .post('/markAllAsRead')
        .send({
          userId: 'user-with-no-notifications',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
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

  describe('Notification Consumer Integration', () => {
    it('should process notification events', async () => {
      const notificationEvent = {
        id: 'consumer-test-notification-1',
        type: NotificationType.TASK_CREATED,
        userId: 'consumer-test-user',
        taskId: 'consumer-test-task',
        title: 'Consumer Test Notification',
        message: 'This notification was processed by the consumer',
        data: { taskId: 'consumer-test-task' },
        createdAt: new Date(),
      };

      const response = await request(app.getHttpServer())
        .post('/notification.created')
        .send(notificationEvent)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.notification).toBeDefined();
      const getResponse = await request(app.getHttpServer())
        .post('/getUserNotifications')
        .send({
          userId: 'consumer-test-user',
          limit: 10,
        });

      expect(getResponse.body.notifications.length).toBe(1);
      expect(getResponse.body.notifications[0].title).toBe(
        'Consumer Test Notification',
      );
    });
  });
});
