import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [HttpModule],
  providers: [RoutingService, PrismaService],
  controllers: [RoutingController],
})
export class RoutingModule {}
