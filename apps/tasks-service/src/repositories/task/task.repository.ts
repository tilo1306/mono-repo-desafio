import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from '../../dtos/create-task.dto';
import { Task } from '../../entities/task.entity';
import { ITaskRepository } from './task.repository.interface';

@Injectable()
export class TaskRepository implements ITaskRepository {
  private readonly logger = new Logger(TaskRepository.name);

  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.repository.create({
      ...createTaskDto,
      createdById: createTaskDto.userId,
    });
    return await this.repository.save(task);
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const query = this.repository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.assignees', 'assignee')
        .orderBy('task.createdAt', 'DESC')
        .where('task.id = :id', { id });

      const task = await query.getOne();
      if (!task) return null;

      const creatorQuery = this.repository.manager
        .createQueryBuilder()
        .select(['u.name as name', 'u.email as email'])
        .from('user', 'u')
        .where('u.id = :userId', { userId: task.userId });

      const creator = await creatorQuery.getRawOne();
      (task as any).creator = creator;

      if (task.assignees && task.assignees.length > 0) {
        const assigneeIds = task.assignees.map(a => a.userId);
        const assigneesQuery = this.repository.manager
          .createQueryBuilder()
          .select(['u.id as id', 'u.name as name', 'u.email as email'])
          .from('user', 'u')
          .where('u.id IN (:...assigneeIds)', { assigneeIds });

        const assigneeUsers = await assigneesQuery.getRawMany();

        task.assignees = task.assignees.map(assignee => ({
          ...assignee,
          user: {
            name: assigneeUsers.find(u => u.id === assignee.userId)?.name,
            email: assigneeUsers.find(u => u.id === assignee.userId)?.email,
          },
        }));
      }

      return task;
    } catch (error) {
      console.error('Error in findById:', error);

      return await this.repository.findOne({ where: { id } });
    }
  }

  async findByUserId(userId: string): Promise<Task[]> {
    return await this.repository.find({ where: { userId } });
  }

  async findByUserIdWithPagination(
    userId: string,
    page: number,
    size: number,
    filters?: { q?: string; status?: string; priority?: string },
  ) {
    const skip = (page - 1) * size;

    const query = this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee')
      .where('(task.userId = :userId OR assignee.userId = :userId)', { userId })
      .distinct(true)
      .orderBy('task.createdAt', 'DESC');

    if (filters?.q) {
      query.andWhere('(task.title ILIKE :q OR task.description ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    const [tasks, total] = await query.skip(skip).take(size).getManyAndCount();

    for (const task of tasks) {
      const creatorQuery = this.repository.manager
        .createQueryBuilder()
        .select(['u.name as name', 'u.email as email'])
        .from('user', 'u')
        .where('u.id = :userId', { userId: task.userId });

      const creator = await creatorQuery.getRawOne();
      (task as any).creator = creator;

      if (task.assignees && task.assignees.length > 0) {
        const assigneeIds = task.assignees.map(a => a.userId);
        const assigneesQuery = this.repository.manager
          .createQueryBuilder()
          .select(['u.id as id', 'u.name as name', 'u.email as email'])
          .from('user', 'u')
          .where('u.id IN (:...assigneeIds)', { assigneeIds });

        const assigneeUsers = await assigneesQuery.getRawMany();

        task.assignees = task.assignees.map(assignee => ({
          ...assignee,
          user: {
            name: assigneeUsers.find(u => u.id === assignee.userId)?.name,
            email: assigneeUsers.find(u => u.id === assignee.userId)?.email,
          },
        }));
      }
    }

    const totalPages = Math.ceil(total / size);

    this.logger.log(`Found ${total} tasks, page ${page}`);

    return {
      data: tasks,
      total,
      page,
      size,
      totalPages,
    };
  }

  async findAllWithPagination(
    page: number,
    size: number,
    filters?: { q?: string; status?: string; priority?: string },
  ) {
    const skip = (page - 1) * size;

    const query = this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignee')
      .orderBy('task.createdAt', 'DESC');

    if (filters?.q) {
      query.andWhere('(task.title ILIKE :q OR task.description ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    const [tasks, total] = await query.skip(skip).take(size).getManyAndCount();

    for (const task of tasks) {
      if (task.assignees && task.assignees.length > 0) {
        const assigneeIds = task.assignees.map(a => a.userId);
        const assigneesQuery = this.repository.manager
          .createQueryBuilder()
          .select(['u.id as id', 'u.name as name', 'u.email as email'])
          .from('user', 'u')
          .where('u.id IN (:...assigneeIds)', { assigneeIds });

        const assigneeUsers = await assigneesQuery.getRawMany();

        task.assignees = task.assignees.map(assignee => ({
          ...assignee,
          user: {
            name: assigneeUsers.find(u => u.id === assignee.userId)?.name,
            email: assigneeUsers.find(u => u.id === assignee.userId)?.email,
          },
        }));
      }
    }

    const totalPages = Math.ceil(total / size);

    return {
      data: tasks,
      total,
      page,
      size,
      totalPages,
    };
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, taskData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getTaskAssigneesWithEmails(
    taskId: string,
  ): Promise<
    Array<{ id: string; userId: string; taskId: string; email: string }>
  > {
    const assignees = await this.repository.manager.query(
      `SELECT a.*, u.email FROM assignees a 
       JOIN "user" u ON a."userId" = u.id 
       WHERE a."taskId" = $1`,
      [taskId],
    );
    return assignees;
  }
}
