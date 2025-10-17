import { ApiProperty } from '@nestjs/swagger';

export class ResponseUpdateAvatarDTO {
  @ApiProperty({
    description: 'User avatar',
    example: 'https://robohash.org/john.doe@example.com',
  })
  avatarUrl: string;
  
 }
