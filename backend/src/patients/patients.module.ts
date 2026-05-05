import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [HttpModule],
  providers: [PatientsService, PrismaService],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
