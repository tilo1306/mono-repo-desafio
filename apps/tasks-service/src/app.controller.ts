import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { CreateTaskDto } from './dtos/create-task.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('createTask')
  createTask(@Payload() createTaskDto: CreateTaskDto) {
    return this.appService.createTask(createTaskDto);
  }

  @MessagePattern('getTasks')
  getTasks(@Payload() data: { userId: string; page?: number; size?: number }) {
    return this.appService.getTasks(data.userId, data.page, data.size);
  }

  @MessagePattern('getTask')
  getTask(@Payload() data: { taskId: string; userId: string }) {
    return this.appService.getTask(data.taskId, data.userId);
  }

  @MessagePattern('updateTask')
  updateTask(
    @Payload() data: { taskId: string; userId: string; updates: any },
  ) {
    return this.appService.updateTask(data.taskId, data.userId, data.updates);
  }

  @MessagePattern('deleteTask')
  deleteTask(@Payload() data: { taskId: string; userId: string }) {
    return this.appService.deleteTask(data.taskId, data.userId);
  }

  @MessagePattern('addComment')
  addComment(
    @Payload() data: { taskId: string; userId: string; content: string },
  ) {
    return this.appService.addComment(data.taskId, data.userId, data.content);
  }

  @MessagePattern('getComments')
  getComments(
    @Payload()
    data: {
      taskId: string;
      userId: string;
      page?: number;
      size?: number;
    },
  ) {
    return this.appService.getComments(
      data.taskId,
      data.userId,
      data.page,
      data.size,
    );
  }
}
