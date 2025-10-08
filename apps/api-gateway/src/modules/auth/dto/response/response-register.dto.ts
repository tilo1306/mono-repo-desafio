import { ApiProperty } from '@nestjs/swagger';

export class ResponseRegisterDTO {
  @ApiProperty({
    description: 'User full name',
    example: 'João da Silva',
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'usuario@exemplo.com',
  })
  email: string;
}
