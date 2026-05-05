import { IsString, IsArray, IsDateString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptimizeRouteDto {
  @ApiProperty({ example: 'claid...' })
  @IsString()
  aideSoignantId: string;

  @ApiProperty({ example: '2025-05-05' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [String], example: ['visitId1', 'visitId2', 'visitId3'] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  visitIds: string[];
}
