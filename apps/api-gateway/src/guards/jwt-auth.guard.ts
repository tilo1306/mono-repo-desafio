import { IS_PUBLIC_KEY } from '@/decorators/public.decorator';
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RpcErrorHelper } from '@repo/utils';

@Injectable()
export class JwtAuthGuard {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headerToken = this.extractTokenFromHeader(request);
    const tokenCookie = this.extractTokenFromCookie(request);

    if (headerToken && tokenCookie && headerToken !== tokenCookie) {
      console.warn(
        'JWT token mismatch between Authorization header and cookie; preferring header',
      );
    }

    const token = headerToken ?? tokenCookie;

    if (!token) {
      throw new UnauthorizedException(
        RpcErrorHelper.UnauthorizedException('JWT token not found'),
      );
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'secret123');

      const payload = this.jwtService.verify(token, {
        secret: secret,
      });

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          RpcErrorHelper.UnauthorizedException('Token expired'),
        );
      }

      throw new UnauthorizedException(
        RpcErrorHelper.UnauthorizedException('Invalid token'),
      );
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.substring(7);
  }

  private extractTokenFromCookie(request: any): string | undefined {
    const cookies = request.cookies;
    return cookies.access_token;
  }
}
