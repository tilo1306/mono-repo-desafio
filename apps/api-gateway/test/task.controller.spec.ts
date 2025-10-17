import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { Priority, Status } from '@repo/types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { of, throwError } from 'rxjs';
import { Logger } from 'winston';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { CreateCommentDto } from '../src/modules/task/dto/request/create-comment.dto';
import { RequestCreateTaskDto } from '../src/modules/task/dto/request/request-create-task.dto';
import { RequestPaginationDto } from '../src/modules/task/dto/request/request-pagination.dto';
import { UpdateTaskDto } from '../src/modules/task/dto/request/update-task.dto';
import { TaskController } from '../src/modules/task/task.controller';

describe('TaskController', () => {
  let controller: TaskController;
  let tasksClient: jest.Mocked<ClientProxy>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockTasksClient = {
      send: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: 'TASKS_SERVICE', useValue: mockTasksClient },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaskController>(TaskController);
    tasksClient = module.get('TASKS_SERVICE');
    logger = module.get(WINSTON_MODULE_PROVIDER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const userId = 'user123';
      const createTaskDto: RequestCreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: Priority.HIGH,
        deadline: '2024-12-31T23:59:59.000Z',
        status: Status.TODO,
        assigneeEmails: ['test@example.com'],
      };

      const mockResponse = {
        id: 'task123',
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'HIGH',
        deadline: createTaskDto.deadline,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        createdById: userId,
        assignees: [],
        creator: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.create(userId, createTaskDto);

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('createTask', {
        userId,
        ...createTaskDto,
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Creating task for user user123',
        {
          userId,
          taskTitle: createTaskDto.title,
          assigneeCount: createTaskDto.assigneeEmails.length,
        },
      );
    });

    it('should handle task creation errors', async () => {
      const userId = 'user123';
      const createTaskDto: RequestCreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        priority: Priority.HIGH,
        deadline: '2024-12-31T23:59:59.000Z',
        status: Status.TODO,
        assigneeEmails: ['invalid-email'],
      };

      const error = new Error('Assignee emails are not valid');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.create(userId, createTaskDto)).rejects.toThrow(
        'Assignee emails are not valid',
      );
    });
  });

  describe('getTasks', () => {
    it('should get tasks with pagination and filters', async () => {
      const userId = 'user123';
      const paginationDto: RequestPaginationDto = {
        page: 1,
        size: 10,
        q: 'test',
        status: Status.TODO,
        priority: Priority.HIGH,
      };

      const mockResponse = {
        data: [
          {
            id: 'task123',
            title: 'Test Task',
            description: 'Test Description',
            status: 'TODO',
            priority: 'HIGH',
            deadline: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId,
            createdById: userId,
            assignees: [],
            creator: {
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.getTasks(userId, paginationDto);

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('getAllTasks', {
        page: paginationDto.page,
        size: paginationDto.size,
        q: paginationDto.q,
        status: paginationDto.status,
        priority: paginationDto.priority,
      });
      expect(logger.info).toHaveBeenCalledWith(
        `Getting all tasks (admin view)`,
        {
          userId,
          page: paginationDto.page,
          size: paginationDto.size,
        },
      );
    });

    it('should get tasks without filters', async () => {
      const userId = 'user123';
      const paginationDto: RequestPaginationDto = {
        page: 1,
        size: 10,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        size: 10,
        totalPages: 0,
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.getTasks(userId, paginationDto);

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('getAllTasks', {
        page: paginationDto.page,
        size: paginationDto.size,
        q: undefined,
        status: undefined,
        priority: undefined,
      });
    });
  });

  describe('getTaskById', () => {
    it('should get task by id successfully', async () => {
      const userId = 'user123';
      const taskId = 'task123';

      const mockResponse = {
        id: 'task123',
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'HIGH',
        deadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        createdById: userId,
        assignees: [],
        creator: {
          name: 'Test User',
          email: 'test@example.com',
        },
        comments: [],
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.getTask(userId, taskId);

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('getTask', {
        userId,
        taskId,
      });
    });

    it('should handle task not found', async () => {
      const userId = 'user123';
      const taskId = 'nonexistent';

      const error = new Error('Task not found');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.getTask(userId, taskId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const mockResponse = {
        id: 'task123',
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        deadline: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        createdById: userId,
        assignees: [],
        creator: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.updateTask(userId, taskId, updateTaskDto);

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('updateTask', {
        userId,
        taskId,
        updates: updateTaskDto,
      });
    });

    it('should handle update errors', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const error = new Error('Task not found');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(
        controller.updateTask(userId, taskId, updateTaskDto),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const userId = 'user123';
      const taskId = 'task123';

      tasksClient.send.mockReturnValue(of({ success: true }));

      const result = await controller.deleteTask(userId, taskId);

      expect(result).toEqual({ success: true });
      expect(tasksClient.send).toHaveBeenCalledWith('deleteTask', {
        userId,
        taskId,
      });
    });

    it('should handle delete errors', async () => {
      const userId = 'user123';
      const taskId = 'task123';

      const error = new Error('Task not found');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.deleteTask(userId, taskId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a test comment',
      };

      const mockResponse = {
        id: 'comment123',
        taskId: 'task123',
        userId: 'user123',
        content: 'This is a test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.addComment(
        userId,
        taskId,
        createCommentDto,
      );

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('addComment', {
        userId,
        taskId,
        content: createCommentDto.content,
      });
    });

    it('should handle comment creation errors', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const createCommentDto: CreateCommentDto = {
        content: 'This is a test comment',
      };

      const error = new Error('Task not found');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(
        controller.addComment(userId, taskId, createCommentDto),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('getComments', () => {
    it('should get comments successfully', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const paginationDto: RequestPaginationDto = {
        page: 1,
        size: 10,
      };

      const mockResponse = [
        {
          id: 'comment123',
          taskId: 'task123',
          userId: 'user123',
          content: 'This is a test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      tasksClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.getComments(
        userId,
        taskId,
        paginationDto,
      );

      expect(result).toEqual(mockResponse);
      expect(tasksClient.send).toHaveBeenCalledWith('getComments', {
        userId,
        taskId,
        page: paginationDto.page,
        size: paginationDto.size,
      });
    });

    it('should handle get comments errors', async () => {
      const userId = 'user123';
      const taskId = 'task123';
      const paginationDto: RequestPaginationDto = {
        page: 1,
        size: 10,
      };

      const error = new Error('Task not found');
      tasksClient.send.mockReturnValue(throwError(() => error));

      await expect(
        controller.getComments(userId, taskId, paginationDto),
      ).rejects.toThrow('Task not found');
    });
  });
});
