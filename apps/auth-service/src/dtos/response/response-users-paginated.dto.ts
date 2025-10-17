export class PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResponseUsersPaginatedDTO {
  data: Array<{
    name: string;
    email: string;
    avatar: string;
  }>;
  meta: PaginationMetaDTO;
}
