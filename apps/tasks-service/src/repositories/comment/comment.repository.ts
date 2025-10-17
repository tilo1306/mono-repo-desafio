import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../entities/comment.entity';
import { ICommentRepository } from './comment.repository.interface';

@Injectable()
export class CommentRepository implements ICommentRepository {
  private readonly logger = new Logger(CommentRepository.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(data: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<Comment> {
    const comment = this.commentRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      content: data.content,
    });

    const savedComment = await this.commentRepository.save(comment);
    this.logger.log(`Comment created: ${savedComment.id}`);
    return savedComment;
  }

  async findByTaskIdWithPagination(taskId: string, page: number, size: number) {
    const skip = (page - 1) * size;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
    });

    for (const comment of comments) {
      const userQuery = this.commentRepository.manager
        .createQueryBuilder()
        .select(['u.name as name', 'u.avatar as avatar', 'u.email as email'])
        .from('user', 'u')
        .where('u.id = :userId', { userId: comment.userId });

      const user = await userQuery.getRawOne();
      (comment as any).user = user;
    }

    const totalPages = Math.ceil(total / size);

    this.logger.log(`Found ${total} comments for task ${taskId}, page ${page}`);

    return {
      data: comments,
      total,
      page,
      size,
      totalPages,
    };
  }
}
