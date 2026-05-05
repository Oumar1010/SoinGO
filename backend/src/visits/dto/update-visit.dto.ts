import { IsString, IsInt, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitDto {
  @ApiPropertyOptional({ example: '2025-05-05T10:00:00' })
  @IsOptional()
  @IsDateString()
  dateHeure?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(5)
  duree?: number;

  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  statut?: VisitStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
