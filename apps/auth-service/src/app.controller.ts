import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { RegisterUserDTO } from './dtos/register';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('createAuth')
  register(registerUserDTO: RegisterUserDTO) {
    return this.appService.register(registerUserDTO);
  }
}
