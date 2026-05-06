import { IsString, IsArray, IsInt, IsOptional, Min, Max, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCreateVisitDto {
  @ApiProperty({ example: 'patient-id-1' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'aide-soignant-id' })
  @IsString()
  aideSoignantId: string;

  @ApiProperty({ example: [1, 3, 5], description: 'Jours de la semaine: 1=Lun, 7=Dim' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  joursRepetition: number[]; // 1=lundi ... 7=dimanche

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(0)
  @Max(23)
  heure: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(0)
  @Max(59)
  minute: number;

  @ApiProperty({ example: 45, description: 'Durée en minutes' })
  @IsInt()
  @Min(5)
  duree: number;

  @ApiProperty({ example: '2026-05-01' })
  @IsString()
  dateDebut: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsString()
  dateFin: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
