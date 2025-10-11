import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('assignees')
@Unique(['taskId', 'userId'])
export class Assignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  taskId: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Task, t => t.assignees, { onDelete: 'CASCADE' })
  task: Task;
}
