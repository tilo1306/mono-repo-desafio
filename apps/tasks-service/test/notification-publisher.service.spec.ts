import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { of, throwError } from 'rxjs';
import { NotificationPublisherService } from '../src/services/notification-publisher.service';

describe('NotificationPublisherService', () => {
  let service: NotificationPublisherService;
  let mockDateNow: jest.SpyInstance;

  const clientMock = {
    emit: jest.fn(),
  } as unknown as ClientProxy;

  beforeEach(async () => {
    jest.resetAllMocks();

    const mockTimestamp = Date.now();
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPublisherService,
        { provide: 'NOTIFICATION_SERVICE', useValue: clientMock },
      ],
    }).compile();

    service = module.get(NotificationPublisherService);

    (clientMock.emit as any).mockReturnValue(of(true));

    jest.spyOn((service as any).logger, 'log').mockImplementation(() => {});
    jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockDateNow.mockRestore();
  });

  const getMockedTimestamp = () => Date.now();

  describe('publishTaskCreated', () => {
    it('should emit notification.created with correct payload', async () => {
      await service.publishTaskCreated('task-1', 'creator-1', 'My Task');

      expect(clientMock.emit).toHaveBeenCalledTimes(1);
      expect(clientMock.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          id: `task-created-task-1-${getMockedTimestamp()}`,
          type: NotificationType.TASK_CREATED,
          userId: 'creator-1',
          taskId: 'task-1',
          title: 'Tarefa criada com sucesso',
          message: 'Sua tarefa "My Task" foi criada com sucesso!',
          data: {
            taskId: 'task-1',
            taskTitle: 'My Task',
            creatorId: 'creator-1',
          },
          createdAt: expect.any(Date),
        }),
      );
    });
  });

  describe('publishTaskAssigned', () => {
    it('should emit notification.created with correct payload', async () => {
      await service.publishTaskAssigned('task-2', 'assignee-9', 'Board');

      expect(clientMock.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          id: `task-assigned-task-2-assignee-9-${getMockedTimestamp()}`,
          type: NotificationType.TASK_ASSIGNED,
          userId: 'assignee-9',
          taskId: 'task-2',
          title: 'Nova tarefa atribuída',
          message: 'Você foi atribuído à tarefa: Board',
          data: { taskId: 'task-2', taskTitle: 'Board' },
          createdAt: expect.any(Date),
        }),
      );
    });
  });

  describe('publishTaskStatusChanged', () => {
    it('should emit notification.created with correct payload', async () => {
      await service.publishTaskStatusChanged(
        'task-3',
        'u1',
        'Card',
        'OPEN',
        'DONE',
      );

      expect(clientMock.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          id: `task-status-task-3-u1-${getMockedTimestamp()}`,
          type: NotificationType.TASK_STATUS_CHANGED,
          userId: 'u1',
          taskId: 'task-3',
          title: 'Status da tarefa alterado',
          message: 'A tarefa "Card" mudou de OPEN para DONE',
          data: {
            taskId: 'task-3',
            taskTitle: 'Card',
            oldStatus: 'OPEN',
            newStatus: 'DONE',
          },
          createdAt: expect.any(Date),
        }),
      );
    });
  });

  describe('publishTaskUpdated', () => {
    it('should emit notification.created with correct payload', async () => {
      await service.publishTaskUpdated('task-4', 'u2', 'Epic');

      expect(clientMock.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          id: `task-updated-task-4-${getMockedTimestamp()}`,
          type: NotificationType.TASK_UPDATED,
          userId: 'u2',
          taskId: 'task-4',
          title: 'Tarefa atualizada',
          message: 'A tarefa "Epic" foi atualizada',
          data: { taskId: 'task-4', taskTitle: 'Epic', updatedBy: 'u2' },
          createdAt: expect.any(Date),
        }),
      );
    });
  });

  describe('publishCommentCreatedForUser', () => {
    it('should emit notification.created with correct payload and truncated message', async () => {
      const content =
        'This is a very long comment that should be truncated at 100 characters to ensure the message looks neat and tidy for notifications.';
      await service.publishCommentCreatedForUser('task-5', 'Task Title', 'recipient-1', 'u3', content);

      expect(clientMock.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          id: `comment-created-task-5-recipient-1-${getMockedTimestamp()}`,
          type: NotificationType.COMMENT_CREATED,
          userId: 'recipient-1',
          taskId: 'task-5',
          title: 'Novo comentário',
          message: 'Na tarefa "Task Title"',
          data: {
            taskId: 'task-5',
            commentContent: content,
            commenterId: 'u3',
            taskTitle: 'Task Title',
          },
          createdAt: expect.any(Date),
        }),
      );
    });
  });

});
