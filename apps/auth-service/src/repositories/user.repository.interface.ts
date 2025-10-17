import { User } from '../entities/user.entity';

export interface PaginationOptions {
  page: number;
  limit: number;
  email?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  findMany(): Promise<User[]>;
  findManyPaginated(options: PaginationOptions): Promise<PaginatedResult<User>>;
}
