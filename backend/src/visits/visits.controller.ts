import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@ApiTags('visits')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('visits')
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Planifier une visite' })
  create(@Body() dto: CreateVisitDto) {
    return this.visitsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Visites par date (et optionnellement par aide-soignant)' })
  @ApiQuery({ name: 'date', example: '2025-05-05' })
  @ApiQuery({ name: 'aideSoignantId', required: false })
  findByDate(@Query('date') date: string, @Query('aideSoignantId') aideSoignantId?: string) {
    return this.visitsService.findByDate(date, aideSoignantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une visite' })
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une visite' })
  update(@Param('id') id: string, @Body() dto: UpdateVisitDto) {
    return this.visitsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une visite' })
  remove(@Param('id') id: string) {
    return this.visitsService.remove(id);
  }
}
