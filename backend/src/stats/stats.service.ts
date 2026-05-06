import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Semaine courante (lundi–dimanche)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // 7 derniers jours pour le graphique
    const last7 = new Date(today);
    last7.setDate(today.getDate() - 6);

    const [
      visitesToday,
      visitesTerminees,
      totalPatients,
      totalUsers,
      visitesWeek,
      routesWeek,
      visitesSemaine7j,
    ] = await Promise.all([
      this.prisma.visit.count({
        where: { dateHeure: { gte: today, lte: todayEnd } },
      }),
      this.prisma.visit.count({
        where: { dateHeure: { gte: today, lte: todayEnd }, statut: 'TERMINE' },
      }),
      this.prisma.patient.count(),
      this.prisma.user.count({ where: { role: 'AIDE_SOIGNANT' } }),
      this.prisma.visit.count({
        where: { dateHeure: { gte: monday, lte: sunday } },
      }),
      this.prisma.route.findMany({
        where: { date: { gte: monday, lte: sunday } },
        select: { distanceTotale: true, tempsTotalMin: true },
      }),
      this.prisma.visit.findMany({
        where: { dateHeure: { gte: last7, lte: todayEnd } },
        select: { dateHeure: true, statut: true },
      }),
    ]);

    // Graphique 7 jours
    const chartData = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(last7);
      day.setDate(last7.getDate() + d);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const dayStr = day.toISOString().split('T')[0];

      const visites = visitesSemaine7j.filter(v => {
        const vDate = v.dateHeure.toISOString().split('T')[0];
        return vDate === dayStr;
      });

      chartData.push({
        date: dayStr,
        label: day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        total: visites.length,
        terminees: visites.filter(v => v.statut === 'TERMINE').length,
        planifiees: visites.filter(v => v.statut === 'PLANIFIE').length,
      });
    }

    const distanceSemaine = routesWeek.reduce((a, r) => a + (r.distanceTotale ?? 0), 0);
    const tempsSemaine = routesWeek.reduce((a, r) => a + (r.tempsTotalMin ?? 0), 0);

    return {
      today: {
        visites: visitesToday,
        terminees: visitesTerminees,
        tauxCompletion: visitesToday > 0 ? Math.round((visitesTerminees / visitesToday) * 100) : 0,
      },
      week: {
        visites: visitesWeek,
        distanceKm: +distanceSemaine.toFixed(1),
        tempsH: `${Math.floor(tempsSemaine / 60)}h${String(tempsSemaine % 60).padStart(2, '0')}`,
      },
      totaux: {
        patients: totalPatients,
        aidesSoignants: totalUsers,
      },
      chart: chartData,
    };
  }

  async getMonthCalendar(year: number, month: number, aideSoignantId?: string) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);

    const visits = await this.prisma.visit.findMany({
      where: {
        dateHeure: { gte: start, lte: end },
        ...(aideSoignantId ? { aideSoignantId } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true } },
        aideSoignant: { select: { id: true, nom: true } },
      },
      orderBy: { dateHeure: 'asc' },
    });

    // Grouper par jour
    const byDay: Record<string, typeof visits> = {};
    for (const v of visits) {
      const day = v.dateHeure.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(v);
    }

    return { year, month, visits: byDay };
  }
}
