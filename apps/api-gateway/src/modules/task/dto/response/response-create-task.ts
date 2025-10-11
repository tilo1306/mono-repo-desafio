import { ApiProperty } from '@nestjs/swagger';
import { Priority, Status } from '@repo/types';

export class ResponseCreateTaskDto {
  @ApiProperty({
    description: 'Unique identifier of the task',
    example: 'f8a5e6d8-8a0e-4c7c-bd6e-2b6c2bbf8f9b',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the task',
    example: 'Implement user authentication',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the task',
    example: 'Add JWT authentication to the API',
  })
  description: string;

  @ApiProperty({
    description: 'Task deadline',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
    nullable: true,
  })
  deadline: Date;

  @ApiProperty({
    description: 'Task priority level',
    enum: Priority,
    example: Priority.HIGH,
  })
  priority: Priority;

  @ApiProperty({
    description: 'Current status of the task',
    enum: Status,
    example: Status.TODO,
  })
  status: Status;

  @ApiProperty({
    description: 'ID of the user who created the task',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Task creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Task last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
