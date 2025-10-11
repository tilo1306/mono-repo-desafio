import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppService } from '../src/app.service';
import { NotificationPublisherService } from '../src/services/notification-publisher.service';

type User = { id: string; email: string };
type Task = { id: string; title: string; userId: string };
type Comment = { id: string; taskId: string; userId: string; content: string };

describe('AppService', () => {
  let service: AppService;

  const loggerMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const taskRepositoryMock = {
    create: jest.fn(),
    findByUserIdWithPagination: jest.fn(),
    findById: jest.fn(),
    hasUserAccess: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const assigneeRepositoryMock = {
    create: jest.fn(),
  };

  const userRepositoryMock = {
    findById: jest.fn(),
    findManyByEmails: jest.fn(),
  };

  const commentRepositoryMock = {
    create: jest.fn(),
    findByTaskIdWithPagination: jest.fn(),
  };

  const notificationPublisherMock = {
    publishTaskCreated: jest.fn(),
    publishTaskAssigned: jest.fn(),
    publishTaskUpdated: jest.fn(),
    publishCommentCreated: jest.fn(),
  };

  const creator: User = { id: 'u-creator', email: 'creator@test.com' };
  const assignees: User[] = [
    { id: 'u-a1', email: 'a1@test.com' },
    { id: 'u-a2', email: 'a2@test.com' },
  ];
  const createTaskDto = {
    title: 'Minha Task',
    description: 'Teste',
    userId: creator.id,
    assigneeEmails: assignees.map(a => a.email),
  };
  const createdTask: Task = {
    id: 't-1',
    title: createTaskDto.title,
    userId: creator.id,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: 'ITaskRepository', useValue: taskRepositoryMock },
        { provide: 'IAssigneeRepository', useValue: assigneeRepositoryMock },
        { provide: 'IUserRepository', useValue: userRepositoryMock },
        { provide: 'ICommentRepository', useValue: commentRepositoryMock },
        { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
        {
          provide: NotificationPublisherService,
          useValue: notificationPublisherMock,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should create task and notify globally and to each assignee', async () => {
    userRepositoryMock.findById.mockResolvedValue(creator);
    userRepositoryMock.findManyByEmails.mockResolvedValue(assignees);
    taskRepositoryMock.create.mockResolvedValue(createdTask);

    const result = await service.createTask(createTaskDto as any);
    expect(result).toEqual(createdTask);

    expect(taskRepositoryMock.create).toHaveBeenCalledWith(createTaskDto);
    expect(notificationPublisherMock.publishTaskCreated).toHaveBeenCalledWith(
      createdTask.id,
      creator.id,
      createdTask.title,
    );
    expect(assigneeRepositoryMock.create).toHaveBeenCalledTimes(
      assignees.length,
    );
    assignees.forEach(a => {
      expect(assigneeRepositoryMock.create).toHaveBeenCalledWith({
        taskId: createdTask.id,
        userId: a.id,
      });
      expect(
        notificationPublisherMock.publishTaskAssigned,
      ).toHaveBeenCalledWith(createdTask.id, a.id, createdTask.title);
    });
  });

  it('should throw NotFoundException when creator user not found', async () => {
    userRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.createTask(createTaskDto as any),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(loggerMock.warn).toHaveBeenCalledWith(
      `User not found: ${creator.id}`,
    );
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when invalid assignees', async () => {
    userRepositoryMock.findById.mockResolvedValue(creator);
    userRepositoryMock.findManyByEmails.mockResolvedValue([assignees[0]]);
    await expect(
      service.createTask(createTaskDto as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(taskRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('should get tasks with default pagination parameters', async () => {
    const payload = { data: [createdTask], total: 1, page: 1, size: 10 };
    taskRepositoryMock.findByUserIdWithPagination.mockResolvedValue(payload);

    const result = await service.getTasks(creator.id);

    expect(result).toEqual(payload);
    expect(taskRepositoryMock.findByUserIdWithPagination).toHaveBeenCalledWith(
      creator.id,
      1,
      10,
    );
  });

  it('should throw NotFoundException when task not found', async () => {
    taskRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.getTask('t-x', creator.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when user has no access', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(false);

    await expect(
      service.getTask(createdTask.id, 'u-otro'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return task successfully', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(true);

    const result = await service.getTask(createdTask.id, creator.id);
    expect(result).toEqual(createdTask);
  });

  it('should throw NotFoundException when task not found for update', async () => {
    taskRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.updateTask('t-x', creator.id, { title: 'novo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when user is not the creator', async () => {
    const otherTask: Task = { id: 't-2', title: 'x', userId: 'u-otro' };
    taskRepositoryMock.findById.mockResolvedValue(otherTask);

    await expect(
      service.updateTask(otherTask.id, creator.id, { title: 'novo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when update returns null', async () => {
    const t: Task = { id: 't-3', title: 'x', userId: creator.id };
    taskRepositoryMock.findById.mockResolvedValue(t);
    taskRepositoryMock.update.mockResolvedValue(null);

    await expect(
      service.updateTask(t.id, creator.id, { title: 'novo' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update task and publish event successfully', async () => {
    const t: Task = { id: 't-4', title: 'x', userId: creator.id };
    const updated: Task = { ...t, title: 'novo' };
    taskRepositoryMock.findById.mockResolvedValue(t);
    taskRepositoryMock.update.mockResolvedValue(updated);

    const result = await service.updateTask(t.id, creator.id, {
      title: 'novo',
    });
    expect(result).toEqual(updated);
    expect(notificationPublisherMock.publishTaskUpdated).toHaveBeenCalledWith(
      t.id,
      creator.id,
      updated.title,
    );
  });

  it('should throw NotFoundException when task not found for delete', async () => {
    taskRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.deleteTask('t-x', creator.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when user is not creator for delete', async () => {
    const other: Task = { id: 't-5', title: 'x', userId: 'u-otro' };
    taskRepositoryMock.findById.mockResolvedValue(other);

    await expect(
      service.deleteTask(other.id, creator.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should delete task successfully', async () => {
    const t: Task = { id: 't-6', title: 'x', userId: creator.id };
    taskRepositoryMock.findById.mockResolvedValue(t);
    taskRepositoryMock.delete.mockResolvedValue(undefined);

    await service.deleteTask(t.id, creator.id);
    expect(taskRepositoryMock.delete).toHaveBeenCalledWith(t.id);
  });

  it('should throw NotFoundException when task not found for addComment', async () => {
    taskRepositoryMock.findById.mockResolvedValue(null);
    await expect(
      service.addComment('t-x', creator.id, 'oi'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when user has no access for addComment', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(false);
    await expect(
      service.addComment(createdTask.id, 'u-otro', 'oi'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should create comment and notify successfully', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(true);
    const comment: Comment = {
      id: 'c-1',
      taskId: createdTask.id,
      userId: creator.id,
      content: 'oi',
    };
    commentRepositoryMock.create.mockResolvedValue(comment);

    const result = await service.addComment(createdTask.id, creator.id, 'oi');
    expect(result).toEqual(comment);
    expect(
      notificationPublisherMock.publishCommentCreated,
    ).toHaveBeenCalledWith(createdTask.id, creator.id, 'oi');
  });

  it('should throw NotFoundException when task not found for getComments', async () => {
    taskRepositoryMock.findById.mockResolvedValue(null);
    await expect(
      service.getComments('t-x', creator.id, 1, 10),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when user has no access for getComments', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(false);
    await expect(
      service.getComments(createdTask.id, 'u-otro', 1, 10),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should get comments with default pagination parameters', async () => {
    taskRepositoryMock.findById.mockResolvedValue(createdTask);
    taskRepositoryMock.hasUserAccess.mockResolvedValue(true);
    const payload = {
      data: [
        {
          id: 'c-2',
          taskId: createdTask.id,
          userId: creator.id,
          content: 'ok',
        },
      ],
      total: 1,
      page: 1,
      size: 10,
    };
    commentRepositoryMock.findByTaskIdWithPagination.mockResolvedValue(payload);

    const result = await service.getComments(createdTask.id, creator.id);

    expect(result).toEqual(payload);
    expect(
      commentRepositoryMock.findByTaskIdWithPagination,
    ).toHaveBeenCalledWith(createdTask.id, 1, 10);
  });
});
