import { ApiProperty } from '@nestjs/swagger';

export class ResponseRegisterDTO {
  @ApiProperty({
    description: 'Success message',
    example: 'User created successfully.',
  })
  message: string;
}
