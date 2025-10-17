import { ApiProperty } from '@nestjs/swagger';

export class ResponseProfileDTO {
  
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
