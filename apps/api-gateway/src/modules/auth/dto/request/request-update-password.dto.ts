import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RequestUpdatePasswordDTO {
   @ApiProperty({
    description: 'User password',
    example: 'Senha@123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
  )
  password: string;

   @ApiProperty({
    description: 'User new password',
    example: '123@Senha',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
  )
  newPassword: string;
}
