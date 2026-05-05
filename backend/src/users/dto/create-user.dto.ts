import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Oumar Diallo' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'oumar1010@soingo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, example: 'ADMIN' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'Amie1010' })
  @IsString()
  @MinLength(4)
  password: string;
}
