import { Comment } from '../../entities/comment.entity';

export interface ICommentRepository {
  create(data: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<Comment>;
  findByTaskIdWithPagination(
    taskId: string,
    page: number,
    size: number,
  ): Promise<{
    data: Comment[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }>;
}
