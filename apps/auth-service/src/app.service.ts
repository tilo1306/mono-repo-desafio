import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RpcErrorHelper } from '@repo/utils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import fs from 'fs';
import path from 'path';

import { RequestLoginDTO } from './dtos/request/request-login.dto';
import { RequestRefreshTokenDTO } from './dtos/request/request-refresh-token.dto';
import { RequestRegisterUserDTO } from './dtos/request/request-register.dto';
import { RequestUpdatePasswordDTO } from './dtos/request/request-update-password.dto';
import { RequestUsersDTO } from './dtos/request/request-users.dto';
import { ResponseGetProfileDTO } from './dtos/response/response-get-profile.dto';
import { ResponseRefreshTokenDTO } from './dtos/response/response-refresh-token.dto';
import { ResponseUpdateAvatarDTO } from './dtos/response/response-update-avatar.dto';
import { ResponseUsersPaginatedDTO } from './dtos/response/response-users-paginated.dto';
import { ResponseLoginDTO } from './dtos/response/response.login.dto';
import { ResponseRegisterDTO } from './dtos/response/response.register.dto';
import { HashingService } from './hashing/hashing.service';
import { AuthJwtService } from './jwt/jwt.service';
import {
  IUserRepository,
  PaginationOptions,
} from './repositories/user.repository.interface';

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
      throw new RpcException(
        RpcErrorHelper.ConflictException('Email already exists'),
      );
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
      throw new RpcException(
        RpcErrorHelper.UnauthorizedException('Invalid credentials'),
      );
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
      throw new RpcException(
        RpcErrorHelper.UnauthorizedException('Invalid credentials'),
      );
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
        throw new RpcException(
          RpcErrorHelper.UnauthorizedException('Error refreshing token'),
        );
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
      throw new RpcException(
        RpcErrorHelper.NotFoundException('User not found'),
      );
    }

    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  }
  async avatar(userId: string, file: any): Promise<ResponseUpdateAvatarDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new RpcException(
        RpcErrorHelper.NotFoundException('User not found'),
      );
    }

    if (!file) {
      this.logger.error('No file provided for avatar upload', {
        context: 'AppService',
        userId,
        date: new Date().toISOString(),
      });
      throw new RpcException(
        RpcErrorHelper.BadRequestException('No file provided'),
      );
    }

    if (!file.buffer) {
      this.logger.error('File buffer is missing', {
        context: 'AppService',
        userId,
        fileKeys: Object.keys(file || {}),
        date: new Date().toISOString(),
      });
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid file format',
        error: 'Bad Request',
      });
    }

    this.logger.info('File buffer analysis', {
      context: 'AppService',
      userId,
      bufferType: typeof file.buffer,
      isBuffer: Buffer.isBuffer(file.buffer),
      bufferKeys: file.buffer ? Object.keys(file.buffer) : [],
      bufferLength: file.buffer
        ? Array.isArray(file.buffer)
          ? file.buffer.length
          : 'not array'
        : 'no buffer',
      date: new Date().toISOString(),
    });

    const uploadPath = path.join(
      process.cwd(),
      '..',
      'shared',
      'uploads',
      'avatars',
      userId,
    );

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      this.logger.info('Directory created successfully', {
        context: 'AppService',
        userId,
        uploadPath,
        date: new Date().toISOString(),
      });
    } else {
      this.logger.info('Directory already exists', {
        context: 'AppService',
        userId,
        uploadPath,
        date: new Date().toISOString(),
      });
    }

    if (user.avatar && user.avatar.includes('/api/auth/avatar/')) {
      const oldFileName = user.avatar.split('/').pop();
      const oldFilePath = path.join(uploadPath, oldFileName || '');

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const fileName = `${Date.now()}-${userId}`;
    const fileExtension = file.originalname
      ? path.extname(file.originalname)
      : '.jpg';
    const finalFileName = `${fileName}${fileExtension}`;
    const finalFilePath = path.join(uploadPath, finalFileName);

    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.buffer)) {
      fileBuffer = file.buffer;
    } else if (
      file.buffer &&
      typeof file.buffer === 'object' &&
      file.buffer.data
    ) {
      fileBuffer = Buffer.from(file.buffer.data);
    } else if (
      file.buffer &&
      typeof file.buffer === 'object' &&
      Array.isArray(file.buffer)
    ) {
      fileBuffer = Buffer.from(file.buffer);
    } else {
      this.logger.error('Invalid file buffer format', {
        context: 'AppService',
        userId,
        bufferType: typeof file.buffer,
        bufferKeys: file.buffer ? Object.keys(file.buffer) : [],
        date: new Date().toISOString(),
      });
      throw new RpcException(
        RpcErrorHelper.BadRequestException('Invalid file buffer format'),
      );
    }

    this.logger.info('Writing file to disk', {
      context: 'AppService',
      userId,
      finalFilePath,
      bufferLength: fileBuffer.length,
      date: new Date().toISOString(),
    });

    fs.writeFileSync(finalFilePath, fileBuffer);

    if (fs.existsSync(finalFilePath)) {
      this.logger.info('File written successfully', {
        context: 'AppService',
        userId,
        finalFilePath,
        fileSize: fs.statSync(finalFilePath).size,
        date: new Date().toISOString(),
      });
    } else {
      this.logger.error('File was not created', {
        context: 'AppService',
        userId,
        finalFilePath,
        date: new Date().toISOString(),
      });
    }

    const avatarUrl = `http://localhost:3001/api/auth/avatar/${userId}/${finalFileName}`;

    await this.userRepository.update(userId, { avatar: avatarUrl });

    this.logger.info('Avatar uploaded successfully', {
      context: 'AppService',
      userId,
      avatarUrl,
      date: new Date().toISOString(),
    });

    return { avatarUrl: avatarUrl };
  }

  async updatePassword(
    userId: string,
    requestUpdatePasswordDTO: RequestUpdatePasswordDTO,
  ): Promise<void> {
    this.logger.info('Password update attempt', {
      context: 'AppService',
      userId,
      date: new Date().toISOString(),
    });

    const isUserExists = await this.userRepository.findById(userId);

    if (!isUserExists) {
      this.logger.error('User not found for password update', {
        context: 'AppService',
        userId,
        date: new Date().toISOString(),
      });
      throw new RpcException(
        RpcErrorHelper.NotFoundException('User not found'),
      );
    }

    const isPasswordValid = await this.hashingService.compare(
      requestUpdatePasswordDTO.password,
      isUserExists.password,
    );

    if (!isPasswordValid) {
      this.logger.error('Invalid current password for password update', {
        context: 'AppService',
        userId,
        email: isUserExists.email,
        date: new Date().toISOString(),
      });
      throw new RpcException(
        RpcErrorHelper.BadRequestException('Invalid password'),
      );
    }

    const newPassword = await this.hashingService.hash(
      requestUpdatePasswordDTO.newPassword,
    );

    await this.userRepository.update(userId, { password: newPassword });

    this.logger.info('Password updated successfully', {
      context: 'AppService',
      userId,
      email: isUserExists.email,
      date: new Date().toISOString(),
    });
  }

  async users(
    requestUsersDTO: RequestUsersDTO,
  ): Promise<ResponseUsersPaginatedDTO> {
    const { page = 1, limit = 10, email } = requestUsersDTO;

    const paginationOptions: PaginationOptions = {
      page,
      limit,
      email,
    };

    const result =
      await this.userRepository.findManyPaginated(paginationOptions);

    return {
      data: result.data.map(user => ({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      })),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    };
  }
}
