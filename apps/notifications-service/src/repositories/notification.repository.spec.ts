import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationType } from '@repo/types';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let notificationRepository: jest.Mocked<Repository<Notification>>;

  const mockNotification = {
    id: 'notification-1',
    userId: 'user-1',
    taskId: 'task-1',
    type: NotificationType.TASK_CREATED,
    title: 'Test Notification',
    message: 'Test message',
    data: { taskId: 'task-1' },
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    notificationRepository = module.get(getRepositoryToken(Notification));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification for a specific user', async () => {
      const event = {
        id: 'event-1',
        type: NotificationType.TASK_CREATED,
        userId: 'user-1',
        taskId: 'task-1',
        title: 'Test Notification',
        message: 'Test message',
        data: { taskId: 'task-1' },
        createdAt: new Date(),
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await repository.createNotification(event);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        taskId: event.taskId,
        type: event.type,
        title: event.title,
        message: event.message,
        data: event.data,
        isRead: false,
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(
        mockNotification,
      );
    });

    it('should create a global notification when userId is "all"', async () => {
      const event = {
        id: 'event-1',
        type: NotificationType.TASK_CREATED,
        userId: 'all',
        taskId: 'task-1',
        title: 'Global Notification',
        message: 'Global message',
        data: { taskId: 'task-1' },
        createdAt: new Date(),
      };

      const globalNotification = { ...mockNotification, userId: 'global' };
      notificationRepository.create.mockReturnValue(globalNotification);
      notificationRepository.save.mockResolvedValue(globalNotification);

      const result = await repository.createNotification(event);

      expect(result).toEqual(globalNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId: 'global',
        taskId: event.taskId,
        type: event.type,
        title: event.title,
        message: event.message,
        data: event.data,
        isRead: false,
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with default limit', async () => {
      const notifications = [mockNotification];
      notificationRepository.find.mockResolvedValue(notifications);

      const result = await repository.getUserNotifications('user-1');

      expect(result).toEqual(notifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should get user notifications with custom limit', async () => {
      const notifications = [mockNotification];
      notificationRepository.find.mockResolvedValue(notifications);

      const result = await repository.getUserNotifications('user-1', 10);

      expect(result).toEqual(notifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await repository.markAsRead('notification-1', 'user-1');

      expect(notificationRepository.update).toHaveBeenCalledWith(
        { id: 'notification-1', userId: 'user-1' },
        { isRead: true },
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      notificationRepository.update.mockResolvedValue({ affected: 5 } as any);

      await repository.markAllAsRead('user-1');

      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true },
      );
    });
  });
});
