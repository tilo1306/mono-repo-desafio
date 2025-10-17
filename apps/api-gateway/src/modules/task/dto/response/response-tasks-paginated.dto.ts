import { ApiProperty } from '@nestjs/swagger';
import { ResponseCreateTaskDto } from './response-create-task';

export class ResponseTasksPaginatedDto {
  @ApiProperty({
    description: 'Array of tasks matching the filters',
    type: [ResponseCreateTaskDto],
    isArray: true,
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Implementar sistema de autenticação',
        description: 'Criar login e registro de usuários com JWT',
        status: 'TODO',
        priority: 'HIGH',
        deadline: '2025-12-31T23:59:59.000Z',
        createdAt: '2025-10-15T21:30:37.766Z',
        updatedAt: '2025-10-15T21:30:37.766Z',
        userId: '5657847d-2c5b-40fe-bd09-8f10bc0989bc',
        createdById: '5657847d-2c5b-40fe-bd09-8f10bc0989bc',
        assignees: [
          {
            id: 'assignee-uuid-1',
            taskId: '550e8400-e29b-41d4-a716-446655440000',
            userId: '297f8c26-ac4a-4647-a326-97258a7c475d',
            user: {
              name: 'Diego',
              email: 'diego@exemplo.com'
            }
          }
        ],
        creator: {
          name: 'Douglas',
          email: 'douglas@exemplo.com'
        }
      }
    ]
  })
  data: ResponseCreateTaskDto[];

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  size: number;

  @ApiProperty({
    description: 'Total number of tasks matching the filters',
    example: 25,
    minimum: 0,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
    minimum: 0,
  })
  totalPages: number;
}
