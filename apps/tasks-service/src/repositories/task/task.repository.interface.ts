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
    filters?: { q?: string; status?: string; priority?: string },
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }>;
  findAllWithPagination(
    page: number,
    size: number,
    filters?: { q?: string; status?: string; priority?: string },
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }>;
  update(id: string, taskData: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  getTaskAssigneesWithEmails(
    taskId: string,
  ): Promise<
    Array<{ id: string; userId: string; taskId: string; email: string }>
  >;
}
