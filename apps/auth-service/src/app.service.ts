import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import fs from 'fs';
import path from 'path';

import { HashingService } from './hashing/hashing.service';
import { AuthJwtService } from './jwt/jwt.service';
import { IUserRepository } from './repositories/user.repository.interface';
import { RequestRegisterUserDTO } from './dtos/request/request-register.dto';
import { ResponseRegisterDTO } from './dtos/response/response.register.dto';
import { RequestLoginDTO } from './dtos/request/request-login.dto';
import { ResponseLoginDTO } from './dtos/response/response.login.dto';
import { RequestRefreshTokenDTO } from './dtos/request/request-refresh-token.dto';
import { ResponseRefreshTokenDTO } from './dtos/response/response-refresh-token.dto';
import { ResponseGetProfileDTO } from './dtos/response/response-get-profile.dto';

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
    requestRegisterUserDTO: RequestRegisterUserDTO,
  ): Promise<ResponseRegisterDTO> {
    const isEmailExists = await this.userRepository.findByEmail(
      requestRegisterUserDTO.email,
    );

    if (isEmailExists) {
      this.logger.error('Email already exists', {
        context: 'AppService',
        name: requestRegisterUserDTO.name,
        email: requestRegisterUserDTO.email,
        date: new Date().toISOString(),
      });
      throw new RpcException({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      });
    }

    const hashedPassword = await this.hashingService.hash(
      requestRegisterUserDTO.password,
    );

    const userData = {
      ...requestRegisterUserDTO,
      password: hashedPassword,
      avatar: `https://robohash.org/${requestRegisterUserDTO.email}`,
    };

    await this.userRepository.create(userData);

    this.logger.info('User created successfully', {
      context: 'AppService',
      email: requestRegisterUserDTO.email,
      name: requestRegisterUserDTO.name,
      date: new Date().toISOString(),
    });

    return {
      message: 'User created successfully',
    };
  }

  async login(loginUserDTO: RequestLoginDTO): Promise<ResponseLoginDTO> {
    const user = await this.userRepository.findByEmail(loginUserDTO.email);

    if (!user) {
      this.logger.error('User not found', {
        context: 'AppService',
        email: loginUserDTO.email,
        date: new Date().toISOString(),
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
        date: new Date().toISOString(),
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
      date: new Date().toISOString(),
    });

    return {
      ...tokens,
    };
  }

  async refreshToken(
    requestRefreshTokenDTO: RequestRefreshTokenDTO,
  ): Promise<ResponseRefreshTokenDTO> {
    try {
      const payload = await this.authJwtService.verifyRefreshToken(
        requestRefreshTokenDTO.refreshToken,
      );

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        this.logger.error('User not found for token refresh', {
          context: 'AppService',
          requestRefreshTokenDTO: requestRefreshTokenDTO,
          date: new Date().toISOString(),
        });
        throw new UnauthorizedException('Error refreshing token');
      }

      const tokens = await this.authJwtService.generateTokens(user);

      this.logger.info('Token refresh successful', {
        context: 'AppService',
        userId: user.id,
        email: user.email,
        date: new Date().toISOString(),
      });

      return tokens;
    } catch (error) {
      this.logger.error('Error refreshing token', {
        context: 'AppService',
        error: error instanceof Error ? error.message : String(error),
        requestRefreshTokenDTO: requestRefreshTokenDTO,
        date: new Date().toISOString(),
      });
      throw new RpcException({
        statusCode: 401,
        message: 'Error refreshing token',
        error: 'Unauthorized',
      });
    }
  }

  async profile(userId: string): Promise<ResponseGetProfileDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  } 
  async avatar(userId: string, file: any): Promise<string> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadPath = `uploads/avatars/${userId}`;

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    if (user.avatar && user.avatar.includes('/api/auth/avatar/')) {
      const oldFileName = user.avatar.split('/').pop();
      const oldFilePath = path.join(uploadPath, oldFileName || '');
      
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const fileName = `${Date.now()}-${userId}`;
    const fileExtension = path.extname(file.originalname || '.jpg');
    const finalFileName = `${fileName}${fileExtension}`;
    const finalFilePath = path.join(uploadPath, finalFileName);

    fs.writeFileSync(finalFilePath, file.buffer);

    const avatarUrl = `/api/auth/avatar/${userId}/${finalFileName}`;
    
    await this.userRepository.update(userId, { avatar: avatarUrl });

    return avatarUrl;
  }
}
