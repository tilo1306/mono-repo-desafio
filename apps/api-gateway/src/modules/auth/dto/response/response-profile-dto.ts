import { ApiProperty } from '@nestjs/swagger';

export class ResponseProfileDTO {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
  
  
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;
  
  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email: string;
  
  @ApiProperty({
    description: 'User avatar',
    example: 'https://robohash.org/john.doe@example.com',
  })
  avatar: string;
  

 }
