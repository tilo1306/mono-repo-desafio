import { Priority, Status } from '@repo/types';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class RequestCreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    maxLength: 180,
  })
  @IsString()
  @MaxLength(180)
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Create login and registration endpoints with JWT authentication',
    maxLength: 360,
  })
  @MaxLength(360)
  description: string;

  @ApiProperty({
    description: 'Task deadline',
    example: '2024-12-25T23:59:59.000Z',
    format: 'date-time',
  })
  @IsDateString()
  deadline: string;

  @ApiProperty({
    description: 'Task priority',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({
    description: 'Task status',
    enum: Status,
    example: Status.TODO,
  })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    description: 'List of assignee email addresses',
    example: ['user1@example.com', 'user2@example.com'],
    type: [String],
    isArray: true,
  })
  @ValidateIf(o => !o.assigneeIds?.length)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((e: string) => e.toLowerCase().trim())
  @IsEmail({}, { each: true })
  assigneeEmails: string[];
}
