import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  taskId: string;

  @Index()
  @Column({ type: 'uuid' })
  changedBy: string; // userId (JWT)

  @Column({ length: 80 })
  field:
    | 'title'
    | 'description'
    | 'deadline'
    | 'priority'
    | 'status'
    | 'assignees';

  @Column({ type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ type: 'jsonb', nullable: true })
  newValue: any;

  @ManyToOne(() => Task, t => t.history, { onDelete: 'CASCADE' })
  task: Task;

  @CreateDateColumn()
  changedAt: Date;
}
