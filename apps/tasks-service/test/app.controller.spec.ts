import { Test, TestingModule } from '@nestjs/testing';
import { Priority, Status } from '@repo/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { CreateTaskDto } from '../src/dtos/create-task.dto';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockService = {
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    addComment: jest.fn(),
    getComments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);

    jest.clearAllMocks();
  });

  it('should create task', async () => {
    const dto: CreateTaskDto = {
      title: 'Integration Test',
      description: 'Testing create task',
      userId: 'u1',
      deadline: '2024-12-31',
      priority: Priority.MEDIUM,
      status: Status.TODO,
      assigneeEmails: ['a@test.com'],
    };
    const expected = { id: 't1', title: dto.title };

    mockService.createTask.mockResolvedValue(expected);

    const result = await controller.createTask(dto);

    expect(service.createTask).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should get tasks with pagination', async () => {
    const payload = { userId: 'u1', page: 2, size: 5 };
    const expected = { total: 1, data: [] };
    mockService.getTasks.mockResolvedValue(expected);

    const result = await controller.getTasks(payload);

    expect(service.getTasks).toHaveBeenCalledWith(payload.userId, 2, 5);
    expect(result).toEqual(expected);
  });

  it('should get task by id', async () => {
    const payload = { taskId: 't1', userId: 'u1' };
    const expected = { id: 't1', title: 'Sample' };
    mockService.getTask.mockResolvedValue(expected);

    const result = await controller.getTask(payload);

    expect(service.getTask).toHaveBeenCalledWith('t1', 'u1');
    expect(result).toEqual(expected);
  });

  it('should update task', async () => {
    const payload = {
      taskId: 't1',
      userId: 'u1',
      updates: { title: 'Updated' },
    };
    const expected = { id: 't1', title: 'Updated' };
    mockService.updateTask.mockResolvedValue(expected);

    const result = await controller.updateTask(payload);

    expect(service.updateTask).toHaveBeenCalledWith('t1', 'u1', {
      title: 'Updated',
    });
    expect(result).toEqual(expected);
  });

  it('should delete task', async () => {
    const payload = { taskId: 't1', userId: 'u1' };
    mockService.deleteTask.mockResolvedValue(undefined);

    const result = await controller.deleteTask(payload);

    expect(service.deleteTask).toHaveBeenCalledWith('t1', 'u1');
    expect(result).toBeUndefined();
  });

  it('should add comment to task', async () => {
    const payload = { taskId: 't1', userId: 'u1', content: 'Nice work!' };
    const expected = { id: 'c1', taskId: 't1', content: 'Nice work!' };
    mockService.addComment.mockResolvedValue(expected);

    const result = await controller.addComment(payload);

    expect(service.addComment).toHaveBeenCalledWith('t1', 'u1', 'Nice work!');
    expect(result).toEqual(expected);
  });

  it('should get comments with pagination', async () => {
    const payload = { taskId: 't1', userId: 'u1', page: 1, size: 10 };
    const expected = { total: 1, data: [] };
    mockService.getComments.mockResolvedValue(expected);

    const result = await controller.getComments(payload);

    expect(service.getComments).toHaveBeenCalledWith('t1', 'u1', 1, 10);
    expect(result).toEqual(expected);
  });
});
