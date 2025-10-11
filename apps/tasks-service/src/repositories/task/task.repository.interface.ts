import { CreateTaskDto } from 'src/dtos/create-task.dto';
import { Task } from '../../entities/task.entity';

export interface ITaskRepository {
  create(createTaskDto: CreateTaskDto): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByUserId(userId: string): Promise<Task[]>;
  findByUserIdWithPagination(
    userId: string,
    page: number,
    size: number,
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }>;
  hasUserAccess(taskId: string, userId: string): Promise<boolean>;
  update(id: string, taskData: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
