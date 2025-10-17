import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPaginationDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  size?: number = 10;

  @ApiProperty({
    description: 'Search query for title and description',
    example: 'login',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Filter by priority level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    example: 'HIGH',
    required: false,
  })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiProperty({
    description: 'Filter by task status',
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
    example: 'IN_PROGRESS',
    required: false,
  })
  @IsOptional()
  @IsIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
  status?: string;
}

export class PaginatedResponse<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
