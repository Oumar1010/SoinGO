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

  async optimize(dto: OptimizeRouteDto) {
    const visits = await this.prisma.visit.findMany({
      where: { id: { in: dto.visitIds } },
      include: { patient: true },
    });

    const withCoords = visits.filter(v => v.patient.lat && v.patient.lng);
    if (withCoords.length < 2)
      throw new BadRequestException('Au moins 2 patients géocodés requis');

    const coords   = withCoords.map(v => `${v.patient.lat},${v.patient.lng}`);
    const origins  = coords.join('|');
    const apiKey   = this.config.get('GOOGLE_DISTANCE_MATRIX_API_KEY');

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`
      + `?origins=${encodeURIComponent(origins)}`
      + `&destinations=${encodeURIComponent(origins)}`
      + `&key=${apiKey}&mode=driving&language=fr`;

    const { data } = await firstValueFrom(this.http.get(url));
    if (data.status !== 'OK')
      throw new BadRequestException('Erreur Distance Matrix API');

    const n = withCoords.length;

    // Matrice durée (secondes) et distance (mètres)
    const durationMatrix: number[][] = data.rows.map((row: any) =>
      row.elements.map((el: any) => el.status === 'OK' ? el.duration.value : Infinity)
    );
    const distanceMatrix: number[][] = data.rows.map((row: any) =>
      row.elements.map((el: any) => el.status === 'OK' ? el.distance.value : Infinity)
    );

    // Nearest Neighbor depuis index 0
    const visited  = new Array(n).fill(false);
    const ordered: number[] = [0];
    visited[0] = true;

    for (let step = 0; step < n - 1; step++) {
      const current = ordered[ordered.length - 1];
      let nearest = -1;
      let minDur  = Infinity;
      for (let j = 0; j < n; j++) {
        if (!visited[j] && durationMatrix[current][j] < minDur) {
          minDur  = durationMatrix[current][j];
          nearest = j;
        }
      }
      if (nearest >= 0) {
        visited[nearest] = true;
        ordered.push(nearest);
      }
    }

    const orderedVisits = ordered.map(i => withCoords[i]);

    // Étapes détaillées : distance + durée entre chaque arrêt consécutif
    const legs = [];
    let totalDistanceM = 0;
    let totalDurationS = 0;

    for (let i = 0; i < ordered.length - 1; i++) {
      const from = ordered[i];
      const to   = ordered[i + 1];
      const distM = distanceMatrix[from][to];
      const durS  = durationMatrix[from][to];
      totalDistanceM += distM;
      totalDurationS += durS;

      legs.push({
        fromIndex:   i,
        toIndex:     i + 1,
        fromPatient: orderedVisits[i].patient.nom,
        toPatient:   orderedVisits[i + 1].patient.nom,
        distanceM,
        distanceKm:  +(distM / 1000).toFixed(2),
        durationS,
        durationMin: Math.round(durS / 60),
      });
    }

    // Persist route en DB
    const route = await this.prisma.route.create({
      data: {
        aideSoignantId: dto.aideSoignantId,
        date:           new Date(dto.date),
        distanceTotale: +(totalDistanceM / 1000).toFixed(2),
        tempsTotalMin:  Math.round(totalDurationS / 60),
        visits: {
          create: orderedVisits.map((v, index) => ({
            visitId: v.id,
            ordre:   index,
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
      legs,
      summary: {
        totalStops:      orderedVisits.length,
        distanceTotaleKm: +(totalDistanceM / 1000).toFixed(2),
        tempsTotalMin:    Math.round(totalDurationS / 60),
        tempsTotalH:      `${Math.floor(totalDurationS / 3600)}h${String(Math.round((totalDurationS % 3600) / 60)).padStart(2, '0')}`,
      },
      orderedVisits: orderedVisits.map((v, i) => ({
        ordre:    i + 1,
        visitId:  v.id,
        patient:  v.patient,
        dateHeure: v.dateHeure,
        duree:    v.duree,
        statut:   v.statut,
      })),
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
