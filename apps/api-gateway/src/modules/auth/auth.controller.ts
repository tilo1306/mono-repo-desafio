import { Controller, Inject, Post } from '@nestjs/common'
import { ClientProxy, Payload } from '@nestjs/microservices'
import { RequestRegisterDTO } from './dto/request/request-register.dto'

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  @Post('register')
  create(@Payload() requestRegisterDTO: RequestRegisterDTO) {
    return this.authClient.send('createAuth', requestRegisterDTO)
  }

  // @MessagePattern('findAllAuth')
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @MessagePattern('findOneAuth')
  // findOne(@Payload() id: number) {
  //   return this.authService.findOne(id);
  // }

  // @MessagePattern('updateAuth')
  // update(@Payload() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(updateAuthDto.id, updateAuthDto);
  // }

  // @MessagePattern('removeAuth')
  // remove(@Payload() id: number) {
  //   return this.authService.remove(id);
  // }
}
