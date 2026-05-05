import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

@ApiTags('routes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('routes')
export class RoutingController {
  constructor(private routingService: RoutingService) {}

  @Post('optimize')
  @ApiOperation({ summary: 'Optimiser une tournée (Nearest Neighbor + Google Distance Matrix)' })
  optimize(@Body() dto: OptimizeRouteDto) {
    return this.routingService.optimize(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir la tournée optimisée pour une date' })
  findByDate(@Query('date') date: string, @Query('aideSoignantId') aideSoignantId: string) {
    return this.routingService.findRouteByDate(date, aideSoignantId);
  }
}
