import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { BulkCreateVisitDto } from './dto/bulk-create-visit.dto';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVisitDto) {
    return this.prisma.visit.create({
      data: {
        patientId: dto.patientId,
        aideSoignantId: dto.aideSoignantId,
        dateHeure: new Date(dto.dateHeure),
        duree: dto.duree,
        notes: dto.notes,
      },
      include: { patient: true, aideSoignant: { select: { id: true, nom: true } } },
    });
  }

  async bulkCreate(dto: BulkCreateVisitDto) {
    const debut = new Date(dto.dateDebut);
    const fin   = new Date(dto.dateFin);
    fin.setHours(23, 59, 59, 999);

    const toCreate: { patientId: string; aideSoignantId: string; dateHeure: Date; duree: number; notes?: string }[] = [];
    const current = new Date(debut);

    while (current <= fin) {
      // getDay() retourne 0=Dim, 1=Lun..6=Sam → convertir en 1=Lun..7=Dim
      const jourSemaine = current.getDay() === 0 ? 7 : current.getDay();
      if (dto.joursRepetition.includes(jourSemaine)) {
        const dateHeure = new Date(current);
        dateHeure.setHours(dto.heure, dto.minute, 0, 0);
        toCreate.push({
          patientId:      dto.patientId,
          aideSoignantId: dto.aideSoignantId,
          dateHeure,
          duree:          dto.duree,
          notes:          dto.notes,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (toCreate.length === 0) return { created: 0, visits: [] };

    await this.prisma.visit.createMany({ data: toCreate, skipDuplicates: true });
    return { created: toCreate.length };
  }

  async findByDate(date: string, aideSoignantId?: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.prisma.visit.findMany({
      where: {
        dateHeure: { gte: start, lte: end },
        ...(aideSoignantId ? { aideSoignantId } : {}),
      },
      include: { patient: true, aideSoignant: { select: { id: true, nom: true } } },
      orderBy: { dateHeure: 'asc' },
    });
  }

  async findByMonth(year: number, month: number, aideSoignantId?: string) {
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.visit.findMany({
      where: {
        dateHeure: { gte: start, lte: end },
        ...(aideSoignantId ? { aideSoignantId } : {}),
      },
      include: { patient: true, aideSoignant: { select: { id: true, nom: true } } },
      orderBy: { dateHeure: 'asc' },
    });
  }

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: { patient: true, aideSoignant: { select: { id: true, nom: true } } },
    });
    if (!visit) throw new NotFoundException('Visite non trouvée');
    return visit;
  }

  async update(id: string, dto: UpdateVisitDto) {
    await this.findOne(id);
    return this.prisma.visit.update({
      where: { id },
      data: {
        ...(dto.dateHeure ? { dateHeure: new Date(dto.dateHeure) } : {}),
        ...(dto.duree ? { duree: dto.duree } : {}),
        ...(dto.statut ? { statut: dto.statut } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { patient: true, aideSoignant: { select: { id: true, nom: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.visit.delete({ where: { id } });
  }
}
