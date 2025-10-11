import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from '@repo/types';
import { DataSource } from 'typeorm';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.dataSource
      .query('SELECT * FROM "user" WHERE email = $1', [email])
      .then(rows => rows[0] || null);
  }

  async findById(id: string): Promise<User | null> {
    return await this.dataSource
      .query('SELECT * FROM "user" WHERE id = $1', [id])
      .then(rows => rows[0] || null);
  }

  async findManyByEmails(emails: string[]): Promise<User[]> {
    return await this.dataSource
      .query('SELECT * FROM "user" WHERE email = ANY($1)', [emails])
      .then(rows => rows || []);
  }
}
