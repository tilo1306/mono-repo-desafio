import * as bcrypt from 'bcryptjs';
import { BcryptService } from './bcrypt.service';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(() => {
    service = new BcryptService();
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash password successfully', async () => {
      const password = 'plainPassword123';
      const salt = 'generatedSalt';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
    });

    it('should throw error when salt generation fails', async () => {
      const password = 'plainPassword123';
      const error = new Error('Salt generation failed');

      (bcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await expect(service.hash(password)).rejects.toThrow(error);
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('compare', () => {
    it('should return true when passwords match', async () => {
      const password = 'plainPassword123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.compare(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.compare(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });
});
