import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from 'src/dtos/create-task.dto';
import { Assignee } from 'src/entities/assignee.entity';
import { Task } from 'src/entities/task.entity';
import { Repository } from 'typeorm';
import { ITaskRepository } from './task.repository.interface';

@Injectable()
export class TaskRepository implements ITaskRepository {
  private readonly logger = new Logger(TaskRepository.name);

  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
    @InjectRepository(Assignee)
    private readonly assigneeRepository: Repository<Assignee>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.repository.create(createTaskDto);
    return await this.repository.save(task);
  }

  async findById(id: string): Promise<Task | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Task[]> {
    return await this.repository.find({ where: { userId } });
  }

  async findByUserIdWithPagination(userId: string, page: number, size: number) {
    const skip = (page - 1) * size;

    const query = this.repository
      .createQueryBuilder('task')
      .leftJoin('task.assignees', 'assignee')
      .where('task.userId = :userId OR assignee.userId = :userId', { userId })
      .orderBy('task.createdAt', 'DESC');

    const [tasks, total] = await query.skip(skip).take(size).getManyAndCount();

    const totalPages = Math.ceil(total / size);

    this.logger.log(`Found ${total} tasks for user ${userId}, page ${page}`);

    return {
      data: tasks,
      total,
      page,
      size,
      totalPages,
    };
  }

  async hasUserAccess(taskId: string, userId: string): Promise<boolean> {
    const task = await this.repository.findOne({
      where: { id: taskId, userId },
    });

    if (task) {
      return true;
    }

    const assignee = await this.assigneeRepository.findOne({
      where: { taskId, userId },
    });

    return !!assignee;
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, taskData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
