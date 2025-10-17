import { Priority, Status } from '@repo/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assignee } from './assignee.entity';
import { Comment } from './comment.entity';
import { TaskHistory } from './history.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid', name: 'createdById' })
  createdById: string;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deadline?: Date;

  @Index()
  @Column({ type: 'enum', enum: Priority, default: Priority.LOW })
  priority: Priority;

  @Index()
  @Column({ type: 'enum', enum: Status, default: Status.TODO })
  status: Status;

  @OneToMany(() => Assignee, a => a.task, { cascade: true })
  assignees: Assignee[];

  @OneToMany(() => Comment, b => b.task)
  comments: Comment[];

  @OneToMany(() => TaskHistory, h => h.task)
  history: TaskHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
