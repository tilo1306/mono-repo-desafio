import { Priority, Status } from '@repo/types';
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
  @IsString()
  @MaxLength(180)
  title: string;

  @MaxLength(360)
  description: string;

  @IsDateString()
  deadline: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsEnum(Status)
  status: Status;

  @ValidateIf(o => !o.assigneeIds?.length)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((e: string) => e.toLowerCase().trim())
  @IsEmail({}, { each: true })
  assigneeEmails: string[];
}
