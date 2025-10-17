import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ResponseLoginDTO } from './dtos/response/response.login.dto';
import { RequestLoginDTO } from './dtos/request/request-login.dto';

import { ResponseRegisterDTO } from './dtos/response/response.register.dto';
import { RequestRegisterUserDTO } from './dtos/request/request-register.dto';
import { RequestRefreshTokenDTO } from './dtos/request/request-refresh-token.dto';
import { ResponseRefreshTokenDTO } from './dtos/response/response-refresh-token.dto';
import { ResponseGetProfileDTO } from './dtos/response/response-get-profile.dto';
import { RequestUsersDTO } from './dtos/request/request-users.dto';
import { ResponseUsersPaginatedDTO } from './dtos/response/response-users-paginated.dto';
import { ResponseUpdateAvatarDTO } from './dtos/response/response-update-avatar.dto';
import { RequestUpdatePasswordDTO } from './dtos/request/request-update-password.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('createAuth')
  async register(
    @Payload() requestRegisterUserDTO: RequestRegisterUserDTO,
  ): Promise<ResponseRegisterDTO> {
    return await this.appService.register(requestRegisterUserDTO);
  }

  @MessagePattern('loginAuth')
  async login(@Payload() requestLoginDTO: RequestLoginDTO): Promise<ResponseLoginDTO> {
    return await this.appService.login(requestLoginDTO);
  }

  @MessagePattern('refreshAuth')
  async refreshToken(
    @Payload() requestRefreshTokenDTO: RequestRefreshTokenDTO,
  ): Promise<ResponseRefreshTokenDTO> {
    return await this.appService.refreshToken(requestRefreshTokenDTO);
  }

  @MessagePattern('profile')
  async profile(@Payload() userId: string): Promise<ResponseGetProfileDTO> {
    return await this.appService.profile(userId);
  }

  @MessagePattern('uploadAvatar')
  async uploadAvatar(@Payload() data: { userId: string; file: any }): Promise<ResponseUpdateAvatarDTO> {
    return await this.appService.avatar(data.userId, data.file);
  }
  
  @MessagePattern('users')
  async users(@Payload() requestUsersDTO: RequestUsersDTO): Promise<ResponseUsersPaginatedDTO> {
    return await this.appService.users(requestUsersDTO);
  }

  @MessagePattern('updatePassword')
  async updatePassword(@Payload() data: { userId: string; requestUpdatePasswordDTO: RequestUpdatePasswordDTO }): Promise<{ success: boolean; message: string }> {
    await this.appService.updatePassword(data.userId, data.requestUpdatePasswordDTO);
    return { success: true, message: 'Password updated successfully' };
  }


  @MessagePattern('health')
  async health(): Promise<{ status: string }> {
    return { status: 'up' };
  }
}
