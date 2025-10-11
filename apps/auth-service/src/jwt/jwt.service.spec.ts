import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../entities/user.entity';
import { AuthJwtService } from './jwt.service';

const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'hashedPassword123',
  avatar: 'https://robohash.org/joao@example.com',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

describe('AuthJwtService', () => {
  let service: AuthJwtService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthJwtService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthJwtService>(AuthJwtService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jwtService.signAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.generateTokens(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '7d' },
      );
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token', async () => {
      const mockToken = 'mock-access-token';
      const mockPayload = { sub: mockUser.id, email: mockUser.email };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.verifyAccessToken(mockToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token', async () => {
      const mockToken = 'mock-refresh-token';
      const mockPayload = { sub: mockUser.id, email: mockUser.email };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.verifyRefreshToken(mockToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });
  });
});
