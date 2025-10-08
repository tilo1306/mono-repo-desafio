import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { RegisterUserDTO } from './dtos/register';
import { HashingService } from './hashing/hashing.service';
import { IUserRepository } from './repositories/user.repository.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async register(registerUserDTO: RegisterUserDTO): Promise<void> {
    const isEmailExists = await this.userRepository.findByEmail(
      registerUserDTO.email,
    );

    if (isEmailExists) {
      this.logger.error('Email already exists');
      this.logger.error({
        name: registerUserDTO.name,
        email: registerUserDTO.email,
      });
      throw new ConflictException('Email already exists');
    }

    registerUserDTO.password = await this.hashingService.hash(
      registerUserDTO.password,
    );

    await this.userRepository.create(registerUserDTO);
  }
}
