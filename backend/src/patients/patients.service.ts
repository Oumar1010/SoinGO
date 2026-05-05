import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../common/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = this.config.get('GOOGLE_GEOCODING_API_KEY');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
      const { data } = await firstValueFrom(this.http.get(url));
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
    } catch {}
    return null;
  }

  async create(dto: CreatePatientDto) {
    const coords = await this.geocodeAddress(dto.address_raw);
    return this.prisma.patient.create({
      data: {
        nom: dto.nom,
        address_raw: dto.address_raw,
        lat: coords?.lat,
        lng: coords?.lng,
        access_info: dto.access_info,
        telephone: dto.telephone,
      },
    });
  }

  async findAll() {
    return this.prisma.patient.findMany({ orderBy: { nom: 'asc' } });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient non trouvé');
    return patient;
  }

  async update(id: string, dto: Partial<CreatePatientDto>) {
    await this.findOne(id);
    let coords: { lat: number; lng: number } | null = null;
    if (dto.address_raw) coords = await this.geocodeAddress(dto.address_raw);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.patient.delete({ where: { id } });
  }
}
