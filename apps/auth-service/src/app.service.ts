import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoginResponseDTO } from './dtos/login-response.dto';
import { LoginDTO } from './dtos/login.dto';
import { RefreshResponseDTO } from './dtos/refresh-response.dto';
import { RefreshTokenDTO } from './dtos/refresh-token.dto';
import { RegisterResponseDTO } from './dtos/register-response.dto';
import { RegisterUserDTO } from './dtos/register.dto';
import { HashingService } from './hashing/hashing.service';
import { AuthJwtService } from './jwt/jwt.service';
import { IUserRepository } from './repositories/user.repository.interface';

@Injectable()
export class AppService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly hashingService: HashingService,
    private readonly authJwtService: AuthJwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async register(
    registerUserDTO: RegisterUserDTO,
  ): Promise<RegisterResponseDTO> {
    const isEmailExists = await this.userRepository.findByEmail(
      registerUserDTO.email,
    );

    if (isEmailExists) {
      this.logger.error('Email already exists', {
        context: 'AppService',
        name: registerUserDTO.name,
        email: registerUserDTO.email,
      });
      throw new RpcException({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      });
    }

    const hashedPassword = await this.hashingService.hash(
      registerUserDTO.password,
    );

    const userData = {
      ...registerUserDTO,
      password: hashedPassword,
    };

    await this.userRepository.create(userData);

    this.logger.info('User created successfully', {
      context: 'AppService',
      email: registerUserDTO.email,
      name: registerUserDTO.name,
    });

    return {
      message: 'User created successfully',
    };
  }

  async login(loginUserDTO: LoginDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(loginUserDTO.email);

    if (!user) {
      this.logger.error('User not found', {
        context: 'AppService',
        email: loginUserDTO.email,
      });
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    }

    const isPasswordValid = await this.hashingService.compare(
      loginUserDTO.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.error('Invalid password', {
        context: 'AppService',
        email: loginUserDTO.email,
      });
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    }

    const tokens = await this.authJwtService.generateTokens(user);

    this.logger.info('User login successful', {
      context: 'AppService',
      email: loginUserDTO.email,
      userId: user.id,
    });

    return {
      ...tokens,
    };
  }

  async refreshToken(
    refreshTokenDTO: RefreshTokenDTO,
  ): Promise<RefreshResponseDTO> {
    try {
      const payload = await this.authJwtService.verifyRefreshToken(
        refreshTokenDTO.refreshToken,
      );

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        this.logger.error('User not found for token refresh', {
          context: 'AppService',
          refreshTokenDTO: refreshTokenDTO,
        });
        throw new UnauthorizedException('Error refreshing token');
      }

      const tokens = await this.authJwtService.generateTokens(user);

      this.logger.info('Token refresh successful', {
        context: 'AppService',
        userId: user.id,
        email: user.email,
      });

      return tokens;
    } catch (error) {
      this.logger.error('Error refreshing token', {
        context: 'AppService',
        error: error instanceof Error ? error.message : String(error),
        refreshTokenDTO: refreshTokenDTO,
      });
      throw new RpcException({
        statusCode: 401,
        message: 'Error refreshing token',
        error: 'Unauthorized',
      });
    }
  }
}
