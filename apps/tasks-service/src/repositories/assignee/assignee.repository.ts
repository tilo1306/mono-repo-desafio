import { InjectRepository } from '@nestjs/typeorm';
import { Assignee } from '../../entities/assignee.entity';
import { Repository } from 'typeorm';
import { IAssigneeRepository } from './assignee.repository.interface';

export class AssigneeRepository implements IAssigneeRepository {
  constructor(
    @InjectRepository(Assignee)
    private readonly repository: Repository<Assignee>,
  ) {}
  
  async create(assigneeData: Partial<Assignee>): Promise<Assignee> {
    const assignee = this.repository.create(assigneeData);
    return await this.repository.save(assignee);
  }

  async findByTaskId(taskId: string): Promise<Assignee[]> {
    return await this.repository.find({
      where: { taskId },
    });
  }
}
