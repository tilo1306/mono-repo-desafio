import { Assignee } from '../../entities/assignee.entity';

export interface IAssigneeRepository {
  create(assigneeData: Partial<Assignee>): Promise<Assignee>;
  findByTaskId(taskId: string): Promise<Assignee[]>;
}
