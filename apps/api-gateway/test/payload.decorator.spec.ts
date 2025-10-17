import { User } from '../src/decorators/payload.decorator';

describe('User Decorator', () => {
  it('should be defined', () => {
    expect(User).toBeDefined();
  });

  it('should return a function when called', () => {
    const decorator = User('sub');
    expect(typeof decorator).toBe('function');
  });
});
