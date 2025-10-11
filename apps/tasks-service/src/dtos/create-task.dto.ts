import { Priority, Status } from '@repo/types';

export class CreateTaskDto {
  userId: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  status: Status;
  assigneeEmails: string[];
}
