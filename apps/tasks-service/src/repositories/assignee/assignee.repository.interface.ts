import { Assignee } from 'src/entities/assignee.entity';

export interface IAssigneeRepository {
  create(assigneeData: Partial<Assignee>): Promise<Assignee>;
}
