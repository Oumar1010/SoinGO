import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { VisitsModule } from './visits/visits.module';
import { RoutingModule } from './routing/routing.module';
import { StatsModule } from './stats/stats.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PatientsModule,
    VisitsModule,
    RoutingModule,
    StatsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
