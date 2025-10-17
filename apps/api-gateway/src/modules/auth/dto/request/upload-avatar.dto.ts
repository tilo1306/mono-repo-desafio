import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file (JPEG, PNG, GIF) - Max size: 5MB',
    example: 'avatar.jpg',
  })
  file: any;
}
