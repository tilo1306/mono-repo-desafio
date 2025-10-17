import { User } from '@/decorators/payload.decorator';
import { Public } from '@/decorators/public.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { RequestLoginDTO } from './dto/request/request-login.dto';
import { RequestRefreshTokenDTO } from './dto/request/request-refresh-token.dto';
import { RequestRegisterDTO } from './dto/request/request-register.dto';
import { RequestUpdatePasswordDTO } from './dto/request/request-update-password.dto';
import { RequestUsersQueryDTO } from './dto/request/request-users-query.dto';
import { ResponseLoginDTO } from './dto/response/response-login.dto';
import { ResponseProfileDTO } from './dto/response/response-profile-dto';
import { ResponseRefreshTokenDTO } from './dto/response/response-refresh-token.dto';
import { ResponseRegisterDTO } from './dto/response/response-register.dto';
import { ResponseUpdateAvatarDTO } from './dto/response/response-update-avatar.dto';
import { ResponseUsersPaginatedDTO } from './dto/response/response-users-paginated.dto';

@Controller('auth')
@Throttle({ short: { limit: 10, ttl: 1000 } })
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('register')
  @Public()
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
        error: {
          type: 'string',
          example: 'Too Many Requests',
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
        error: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
        email: requestRegisterDTO.email,
        date: new Date().toISOString(),
      });
      throw error;
    }
  }

  @Post('login')
  @Public()
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
  @ApiTooManyRequestsResponse({
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
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async login(
    @Body() requestLoginDTO: RequestLoginDTO,
    @Res({ passthrough: true }) response: Response,
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

      this.setCookie(response, result.accessToken, result.refreshToken);

      this.logger.info('User login successful', {
        context: 'AuthController',
        email: requestLoginDTO.email,
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Login error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
        email: requestLoginDTO.email,
        date: new Date().toISOString(),
      });
      throw error;
    }
  }

  @Post('refresh')
  @Public()
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
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unauthorized',
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
        error: {
          type: 'string',
          example: 'Too Many Requests',
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResponseRefreshTokenDTO> {
    try {
      this.logger.info('Token refresh attempt', {
        context: 'AuthController',
        date: new Date().toISOString(),
      });

      const cookieToken = (request.cookies as any)?.refresh_token as
        | string
        | undefined;

      const bodyToken = requestRefreshTokenDTO.refreshToken;

      if (cookieToken && bodyToken && cookieToken !== bodyToken) {
        this.logger.warn(
          'Refresh token mismatch between cookie and body; preferring body token',
          {
            context: 'AuthController',
            date: new Date().toISOString(),
          },
        );
      }

      const refreshToken = bodyToken ?? cookieToken;

      if (!refreshToken) {
        throw new BadRequestException('refreshToken is required');
      }

      const result = await firstValueFrom(
        this.authClient.send('refreshAuth', { refreshToken }),
      );

      this.setCookie(response, result.accessToken, result.refreshToken);

      this.logger.info('Token refresh successful', {
        context: 'AuthController',
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh error', {
        context: 'AuthController',
        error: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
        date: new Date().toISOString(),
      });
      throw error;
    }
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the user profile',
  })
  @ApiOkResponse({
    description: 'User profile returned successfully',
    type: ResponseProfileDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unauthorized',
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
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
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
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async profile(@User('sub') userId: string): Promise<ResponseProfileDTO> {
    return await firstValueFrom(this.authClient.send('profile', userId));
  }

  @Post('upload-avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload user avatar',
    description:
      'Uploads a new avatar image for the authenticated user. Supported formats: JPEG, PNG, GIF. Max size: 5MB.',
  })
  @ApiBody({
    description: 'Avatar image file upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, GIF) - Max size: 5MB',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'Avatar uploaded successfully',
    type: ResponseUpdateAvatarDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unauthorized',
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
    description: 'Bad request',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Bad request',
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
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
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
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async uploadAvatar(
    @UploadedFile() file: any,
    @User('sub') userId: string,
  ): Promise<ResponseUpdateAvatarDTO> {
    if (!file) {
      this.logger.error('No file provided for avatar upload', {
        context: 'AuthController',
        userId,
        date: new Date().toISOString(),
      });
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      this.logger.error('File buffer is missing', {
        context: 'AuthController',
        userId,
        fileKeys: Object.keys(file || {}),
        date: new Date().toISOString(),
      });
      throw new BadRequestException('Invalid file format');
    }

    this.logger.info('Uploading avatar', {
      context: 'AuthController',
      userId,
      fileName: file.originalname,
      fileSize: file.size,
      date: new Date().toISOString(),
    });

    return await firstValueFrom(
      this.authClient.send('uploadAvatar', { userId, file }),
    );
  }

  @Get('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get users list',
    description: 'Returns a paginated list of users with optional email filter',
  })
  @ApiOkResponse({
    description: 'Users list returned successfully',
    type: ResponseUsersPaginatedDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unauthorized',
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
  @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async userInfo(
    @Query() query: RequestUsersQueryDTO,
  ): Promise<ResponseUsersPaginatedDTO> {
    return await firstValueFrom(this.authClient.send('users', query));
  }

  @Get('avatar/:userId/:filename')
  @Public()
  @ApiOperation({
    summary: 'Get user avatar',
    description: 'Serves user avatar image files',
  })
  @ApiOkResponse({
    description: 'Avatar image served successfully',
    content: {
      'image/*': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Avatar not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Avatar not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
  async getAvatar(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const avatarPath = path.join(
        process.cwd(),
        '..',
        'shared',
        'uploads',
        'avatars',
        userId,
        filename,
      );
      if (!fs.existsSync(avatarPath)) {
        this.logger.warn('Avatar file not found', {
          context: 'AuthController',
          userId,
          filename,
          avatarPath,
          date: new Date().toISOString(),
        });
        throw new NotFoundException('Avatar not found');
      }

      const ext = path.extname(filename).toLowerCase();
      let contentType = 'image/jpeg';

      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.jpg':
        case '.jpeg':
        default:
          contentType = 'image/jpeg';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      const fileStream = fs.createReadStream(avatarPath);
      fileStream.pipe(res);

      this.logger.info('Avatar served successfully', {
        context: 'AuthController',
        userId,
        filename,
        contentType,
        date: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error serving avatar', {
        context: 'AuthController',
        userId,
        filename,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
        date: new Date().toISOString(),
      });

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException('Avatar not found');
    }
  }

  @Post('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update user password',
    description: 'Updates the user password',
  })
  @ApiOkResponse({
    description: 'Password updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Password updated successfully',
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
          example: 'Invalid password',
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
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
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
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async updatePassword(
    @User('sub') userId: string,
    @Body() requestUpdatePasswordDTO: RequestUpdatePasswordDTO,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.info('Password update attempt', {
        context: 'AuthController',
        userId,
        date: new Date().toISOString(),
      });

      const result = await firstValueFrom(
        this.authClient.send('updatePassword', {
          userId,
          requestUpdatePasswordDTO,
        }),
      );

      this.logger.info('Password updated successfully', {
        context: 'AuthController',
        userId,
        date: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      this.logger.error('Password update error', {
        context: 'AuthController',
        userId,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
        date: new Date().toISOString(),
      });
      throw error;
    }
  }

  private setCookie(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', refreshToken, {
      secure: true,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
