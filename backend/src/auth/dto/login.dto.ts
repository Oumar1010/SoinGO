import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'oumar1010@soingo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Amie1010' })
  @IsString()
  @MinLength(4)
  password: string;
}
