import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { RequestLoginDTO } from './dto/request/request-login.dto';
import { RequestRefreshTokenDTO } from './dto/request/request-refresh-token.dto';
import { RequestRegisterDTO } from './dto/request/request-register.dto';
import { ResponseLoginDTO } from './dto/response/response-login.dtos';
import { ResponseRefreshTokenDTO } from './dto/response/response-refresh-token.dto';
import { ResponseRegisterDTO } from './dto/response/response-register.dto';

@Controller('auth')
@Throttle({ short: { limit: 10, ttl: 1000 } })
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account.',
  })
  @ApiBody({ type: RequestRegisterDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User created successfully.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email already exists',
        },
        error: {
          type: 'string',
          example: 'Conflict',
        },
        statusCode: {
          type: 'number',
          example: 409,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation errors',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid email',
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
        statusCode: {
          type: 'number',
          example: 400,
        },
      },
    },
  })
  async create(
    @Body() requestRegisterDTO: RequestRegisterDTO,
  ): Promise<ResponseRegisterDTO> {
    try {
      this.logger.info('User registration attempt', {
        context: 'AuthController',
        email: requestRegisterDTO.email,
        name: requestRegisterDTO.name,
      });

      const result = await firstValueFrom(
        this.authClient.send('createAuth', requestRegisterDTO),
      );

      this.logger.info('User registration successful', {
        context: 'AuthController',
        email: requestRegisterDTO.email,
      });

      return result;
    } catch (error) {
      this.logger.error('Registration error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
        email: requestRegisterDTO.email,
      });
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Authenticates a user with email and password and returns a JWT token',
  })
  @ApiBody({ type: RequestLoginDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User authenticated successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Access token JWT',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Refresh token to renew the access token',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid credentials',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Too many failed attempts',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Too many failed login attempts. Try again later.',
        },
        error: {
          type: 'string',
          example: 'Forbidden',
        },
        statusCode: {
          type: 'number',
          example: 403,
        },
      },
    },
  })
  async login(
    @Body() requestLoginDTO: RequestLoginDTO,
  ): Promise<ResponseLoginDTO> {
    try {
      this.logger.info('User login attempt', {
        context: 'AuthController',
        email: requestLoginDTO.email,
      });

      const result = await firstValueFrom(
        this.authClient.send('loginAuth', requestLoginDTO),
      );

      this.logger.info('User login successful', {
        context: 'AuthController',
        email: requestLoginDTO.email,
      });

      return result;
    } catch (error) {
      this.logger.error('Login error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
        email: requestLoginDTO.email,
      });
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Renews the access token using a valid refresh token',
  })
  @ApiBody({ type: RequestRefreshTokenDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token renewed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          description: 'New access token JWT',
        },
        refreshToken: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          description: 'New refresh token JWT',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            'refreshToken should not be empty',
            'refreshToken must be a string',
          ],
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
        statusCode: {
          type: 'number',
          example: 400,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many refresh attempts - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async refreshToken(
    @Body() requestRefreshTokenDTO: RequestRefreshTokenDTO,
  ): Promise<ResponseRefreshTokenDTO> {
    try {
      this.logger.info('Token refresh attempt', {
        context: 'AuthController',
      });

      const result = await firstValueFrom(
        this.authClient.send('refreshAuth', requestRefreshTokenDTO),
      );

      this.logger.info('Token refresh successful', {
        context: 'AuthController',
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
