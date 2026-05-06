import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { BulkCreateVisitDto } from './dto/bulk-create-visit.dto';

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

  @Post('bulk')
  @ApiOperation({ summary: 'Générer des visites récurrentes (planning mensuel)' })
  bulkCreate(@Body() dto: BulkCreateVisitDto) {
    return this.visitsService.bulkCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Visites par date (et optionnellement par aide-soignant)' })
  @ApiQuery({ name: 'date', required: false, example: '2025-05-05' })
  @ApiQuery({ name: 'month', required: false, example: '5' })
  @ApiQuery({ name: 'year',  required: false, example: '2026' })
  @ApiQuery({ name: 'aideSoignantId', required: false })
  findByDate(
    @Query('date')          date?: string,
    @Query('month')         month?: string,
    @Query('year')          year?: string,
    @Query('aideSoignantId') aideSoignantId?: string,
  ) {
    if (month && year) {
      return this.visitsService.findByMonth(+year, +month, aideSoignantId);
    }
    return this.visitsService.findByDate(date ?? new Date().toISOString().split('T')[0], aideSoignantId);
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
