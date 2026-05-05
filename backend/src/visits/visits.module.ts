import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [VisitsService, PrismaService],
  controllers: [VisitsController],
  exports: [VisitsService],
})
export class VisitsModule {}
