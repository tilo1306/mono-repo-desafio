import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../src/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockRequest = {
    headers: {} as any,
    cookies: {} as any,
    user: null,
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    jest.clearAllMocks();
    mockRequest.headers = {};
    mockRequest.cookies = {};
    mockRequest.user = null;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should authenticate with valid token from Authorization header', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user123', email: 'test@example.com' });

      mockRequest.headers.authorization = 'Bearer valid-token';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'secret123',
      });
      expect(mockRequest.user).toEqual({ sub: 'user123', email: 'test@example.com' });
    });

    it('should authenticate with valid token from cookie', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user123', email: 'test@example.com' });

      mockRequest.cookies.access_token = 'valid-token';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'secret123',
      });
      expect(mockRequest.user).toEqual({ sub: 'user123', email: 'test@example.com' });
    });

    it('should prefer Authorization header over cookie when both are present', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user123', email: 'test@example.com' });

      mockRequest.headers.authorization = 'Bearer header-token';
      mockRequest.cookies.access_token = 'cookie-token';

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('header-token', {
        secret: 'secret123',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'JWT token mismatch between Authorization header and cookie; preferring header',
      );

      consoleSpy.mockRestore();
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret123');

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw expiredError;
      });

      mockRequest.headers.authorization = 'Bearer expired-token';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret123');

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockRequest.headers.authorization = 'Bearer invalid-token';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should handle malformed Authorization header', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      mockRequest.headers.authorization = 'InvalidFormat';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
    });

        it('should use default JWT secret when not configured', () => {
          reflector.getAllAndOverride.mockReturnValue(false);
          configService.get.mockReturnValue(undefined);
          jwtService.verify.mockReturnValue({ sub: 'user123', email: 'test@example.com' });

          mockRequest.headers.authorization = 'Bearer valid-token';

          const result = guard.canActivate(mockExecutionContext);

          expect(result).toBe(true);
          expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
            secret: undefined,
          });
        });
  });
});
