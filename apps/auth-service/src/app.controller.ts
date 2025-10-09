import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { LoginResponseDTO } from './dtos/login-response.dto';
import { LoginDTO } from './dtos/login.dto';
import { RefreshResponseDTO } from './dtos/refresh-response.dto';
import { RefreshTokenDTO } from './dtos/refresh-token.dto';
import { RegisterResponseDTO } from './dtos/register-response.dto';
import { RegisterUserDTO } from './dtos/register.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('createAuth')
  async register(
    @Payload() registerUserDTO: RegisterUserDTO,
  ): Promise<RegisterResponseDTO> {
    return await this.appService.register(registerUserDTO);
  }

  @MessagePattern('loginAuth')
  async login(@Payload() loginUserDTO: LoginDTO): Promise<LoginResponseDTO> {
    return await this.appService.login(loginUserDTO);
  }

  @MessagePattern('refreshAuth')
  async refreshToken(
    @Payload() refreshTokenDTO: RefreshTokenDTO,
  ): Promise<RefreshResponseDTO> {
    return await this.appService.refreshToken(refreshTokenDTO);
  }
}
