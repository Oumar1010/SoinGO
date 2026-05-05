import { IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  aideSoignantId: string;

  @ApiProperty({ example: '2025-05-05T09:00:00' })
  @IsDateString()
  dateHeure: string;

  @ApiProperty({ example: 45, description: 'Durée en minutes' })
  @IsInt()
  @Min(5)
  duree: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
