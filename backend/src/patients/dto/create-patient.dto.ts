import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Fatou Diallo' })
  @IsString()
  nom: string;

  @ApiProperty({ example: '12 Rue de la Santé, 75014 Paris' })
  @IsString()
  address_raw: string;

  @ApiPropertyOptional({ example: 'Code portail: 1234, 3ème étage droite' })
  @IsOptional()
  @IsString()
  access_info?: string;

  @ApiPropertyOptional({ example: '+221 77 000 00 00' })
  @IsOptional()
  @IsString()
  telephone?: string;
}
