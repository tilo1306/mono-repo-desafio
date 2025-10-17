import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { IUserRepository, PaginationOptions, PaginatedResult } from './user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findMany(): Promise<User[]> {
    return await this.repository.find();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);

    return await this.repository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.repository.update(id, userData);
    const updatedUser = await this.repository.findOne({ where: { id } });
    
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return updatedUser;
  }

  async findManyPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { page, limit, email } = options;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (email) {
      whereCondition.email = Like(`%${email}%`);
    }

    const total = await this.repository.count({ where: whereCondition });
    const data = await this.repository.find({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
