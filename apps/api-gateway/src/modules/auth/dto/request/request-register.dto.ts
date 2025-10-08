import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class RequestRegisterDTO {
  @ApiProperty({
    description: 'User full name',
    example: 'João da Silva',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name: string

  @ApiProperty({
    description: 'User email',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  email: string

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
  password: string
}
