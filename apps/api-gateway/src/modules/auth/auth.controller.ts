import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: ResponseRegisterDTO,
  })
  @ApiConflictResponse({
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
  @ApiTooManyRequestsResponse({
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
  @ApiBadRequestResponse({
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
  async register(
    @Body() requestRegisterDTO: RequestRegisterDTO,
  ): Promise<ResponseRegisterDTO> {
    try {
      this.logger.info('User registration attempt', {
        context: 'AuthController',
        email: requestRegisterDTO.email,
        name: requestRegisterDTO.name,
        date: new Date().toISOString(),
      });

      const result = await firstValueFrom(
        this.authClient.send('createAuth', requestRegisterDTO),
      );

      this.logger.info('User registration successful', {
        context: 'AuthController',
        email: requestRegisterDTO.email,
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Registration error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
        email: requestRegisterDTO.email,
        date: new Date().toISOString(),
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
  @ApiOkResponse({
    description: 'User authenticated successfully',
    type: ResponseLoginDTO,
  })
  @ApiUnauthorizedResponse({
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
  @ApiForbiddenResponse({
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
        date: new Date().toISOString(),
      });

      const result = await firstValueFrom(
        this.authClient.send('loginAuth', requestLoginDTO),
      );

      this.logger.info('User login successful', {
        context: 'AuthController',
        email: requestLoginDTO.email,
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Login error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
        email: requestLoginDTO.email,
        date: new Date().toISOString(),
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
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: ResponseRefreshTokenDTO,
  })
  @ApiUnauthorizedResponse({
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
  @ApiBadRequestResponse({
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
  @ApiTooManyRequestsResponse({
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
        date: new Date().toISOString(),
      });

      const result = await firstValueFrom(
        this.authClient.send('refreshAuth', requestRefreshTokenDTO),
      );

      this.logger.info('Token refresh successful', {
        context: 'AuthController',
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : String(error),
        date: new Date().toISOString(),
      });
      throw error;
    }
  }
}
