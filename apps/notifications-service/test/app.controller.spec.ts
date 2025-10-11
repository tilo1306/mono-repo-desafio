import { Test, TestingModule } from '@nestjs/testing';
  import { AppController } from '../src/app.controller';
  import { INotificationRepository } from '../src/repositories/notification.repository.interface';

describe('AppController', () => {
  let appController: AppController;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(async () => {
    const mockNotificationRepository = {
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    notificationRepository = app.get('INotificationRepository');
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [];
      notificationRepository.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await appController.getUserNotifications({
        userId: 'user-1',
        limit: 10,
      });

      expect(result).toEqual(mockNotifications);
      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        10,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationRepository.markAsRead.mockResolvedValue();

      const result = await appController.markAsRead({
        notificationId: 'notif-1',
        userId: 'user-1',
      });

      expect(result).toEqual({ success: true });
      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'notif-1',
        'user-1',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationRepository.markAllAsRead.mockResolvedValue();

      const result = await appController.markAllAsRead({ userId: 'user-1' });

      expect(result).toEqual({ success: true });
      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });
});
