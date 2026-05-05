import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

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
