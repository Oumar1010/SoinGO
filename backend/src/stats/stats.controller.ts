import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Stats dashboard (today + semaine + chart 7j)' })
  getDashboard() {
    return this.statsService.getDashboard();
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Calendrier mensuel des visites' })
  getCalendar(
    @Query('year')  year:  string,
    @Query('month') month: string,
    @Query('aideSoignantId') aideSoignantId?: string,
  ) {
    return this.statsService.getMonthCalendar(+year, +month, aideSoignantId);
  }
}
