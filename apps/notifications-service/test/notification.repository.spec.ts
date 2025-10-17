import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '@repo/types';
import { NotificationRepository } from '../src/repositories/notification.repository';
import { Notification } from '../src/entities/notification.entity';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let mockRepository: jest.Mocked<Repository<Notification>>;

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
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    mockRepository = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create and save a notification', async () => {
      const notificationEvent = {
        id: 'event-1',
        type: NotificationType.TASK_CREATED,
        userId: 'user-1',
        taskId: 'task-1',
        title: 'Test Notification',
        message: 'Test message',
        data: { taskId: 'task-1' },
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification as any);
      mockRepository.save.mockResolvedValue(mockNotification as any);

      const result = await repository.createNotification(notificationEvent);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        taskId: notificationEvent.taskId,
        type: notificationEvent.type,
        title: notificationEvent.title,
        message: notificationEvent.message,
        data: notificationEvent.data,
        isRead: false,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with limit', async () => {
      const mockNotifications = [mockNotification];
      mockRepository.find.mockResolvedValue(mockNotifications as any);

      const result = await repository.getUserNotifications('user-1', 10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return user notifications without limit', async () => {
      const mockNotifications = [mockNotification];
      mockRepository.find.mockResolvedValue(mockNotifications as any);

      const result = await repository.getUserNotifications('user-1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50, // default limit
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      await repository.markAsRead('notification-1', 'user-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'notification-1', userId: 'user-1' },
        { isRead: true },
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 5 } as any);

      await repository.markAllAsRead('user-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true },
      );
    });
  });
});
