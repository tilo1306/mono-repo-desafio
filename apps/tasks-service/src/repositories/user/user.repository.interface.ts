import { User } from '@repo/types';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findManyByEmails(emails: string[]): Promise<User[]>;
}
