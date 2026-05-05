import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../common/prisma.service';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

@Injectable()
export class RoutingService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  /**
   * Nearest Neighbor heuristic using Google Distance Matrix API
   */
  async optimize(dto: OptimizeRouteDto) {
    const visits = await this.prisma.visit.findMany({
      where: { id: { in: dto.visitIds } },
      include: { patient: true },
    });

    const withCoords = visits.filter(v => v.patient.lat && v.patient.lng);
    if (withCoords.length < 2) throw new BadRequestException('Au moins 2 patients géocodés requis');

    const origins = withCoords.map(v => `${v.patient.lat},${v.patient.lng}`).join('|');
    const destinations = origins;
    const apiKey = this.config.get('GOOGLE_DISTANCE_MATRIX_API_KEY');

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${apiKey}&mode=driving`;

    const { data } = await firstValueFrom(this.http.get(url));
    if (data.status !== 'OK') throw new BadRequestException('Erreur Distance Matrix API');

    // Nearest Neighbor depuis le point 0 (départ)
    const n = withCoords.length;
    const matrix: number[][] = data.rows.map((row: any) =>
      row.elements.map((el: any) => el.status === 'OK' ? el.duration.value : Infinity)
    );

    const visited = new Array(n).fill(false);
    const ordered: number[] = [0];
    visited[0] = true;
    let totalDistance = 0;
    let totalTime = 0;

    for (let step = 0; step < n - 1; step++) {
      const current = ordered[ordered.length - 1];
      let nearest = -1;
      let minDist = Infinity;
      for (let j = 0; j < n; j++) {
        if (!visited[j] && matrix[current][j] < minDist) {
          minDist = matrix[current][j];
          nearest = j;
        }
      }
      if (nearest >= 0) {
        visited[nearest] = true;
        ordered.push(nearest);
        totalTime += minDist;
        totalDistance += data.rows[current].elements[nearest].distance?.value || 0;
      }
    }

    const orderedVisits = ordered.map(i => withCoords[i]);

    const route = await this.prisma.route.create({
      data: {
        aideSoignantId: dto.aideSoignantId,
        date: new Date(dto.date),
        distanceTotale: totalDistance / 1000,
        tempsTotalMin: Math.round(totalTime / 60),
        visits: {
          create: orderedVisits.map((v, index) => ({
            visitId: v.id,
            ordre: index,
          })),
        },
      },
      include: {
        visits: {
          include: { visit: { include: { patient: true } } },
          orderBy: { ordre: 'asc' },
        },
      },
    });

    return {
      route,
      summary: {
        totalVisits: orderedVisits.length,
        distanceTotaleKm: route.distanceTotale,
        tempsTotalMin: route.tempsTotalMin,
      },
    };
  }

  async findRouteByDate(date: string, aideSoignantId: string) {
    return this.prisma.route.findFirst({
      where: { date: new Date(date), aideSoignantId },
      include: {
        visits: {
          include: { visit: { include: { patient: true } } },
          orderBy: { ordre: 'asc' },
        },
      },
    });
  }
}
