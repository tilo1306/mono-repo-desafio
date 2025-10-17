import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { AppService } from '../src/app.service';
import { INotificationRepository } from '../src/repositories/notification.repository.interface';

describe('AppService', () => {
  let service: AppService;
  let notificationRepository: jest.Mocked<INotificationRepository>;

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
    const mockNotificationRepository = {
      createNotification: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    notificationRepository = module.get('INotificationRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with limit', async () => {
      const mockNotifications = [mockNotification];
      notificationRepository.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications('user-1', 10);

      expect(result).toEqual(mockNotifications);
      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        10,
      );
    });

    it('should return user notifications with default limit', async () => {
      const mockNotifications = [mockNotification];
      notificationRepository.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications('user-1');

      expect(result).toEqual(mockNotifications);
      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        50, // default limit
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationRepository.markAsRead.mockResolvedValue();

      await service.markAsRead('notification-1', 'user-1');

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'notification-1',
        'user-1',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationRepository.markAllAsRead.mockResolvedValue();

      await service.markAllAsRead('user-1');

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });
});
