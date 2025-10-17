import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDTO {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

export class ResponseUsersPaginatedDTO {
  @ApiProperty({
    description: 'List of users',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao@example.com' },
        avatar: { type: 'string', example: 'https://robohash.org/joao@example.com' },
      },
    },
  })
  data: Array<{
    name: string;
    email: string;
    avatar: string;
  }>;

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDTO,
  })
  meta: PaginationMetaDTO;
}
