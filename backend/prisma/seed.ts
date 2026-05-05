import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Amie1010', 10);
  const userHash  = await bcrypt.hash('jiji', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'oumar1010@soingo.com' },
    update: {},
    create: {
      nom:      'Oumar Maiga',
      email:    'oumar1010@soingo.com',
      role:     'ADMIN',
      hash_mdp: adminHash,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'amie1010@soingo.com' },
    update: {},
    create: {
      nom:      'Amie Diallo',
      email:    'amie1010@soingo.com',
      role:     'AIDE_SOIGNANT',
      hash_mdp: userHash,
    },
  });

  console.log(`Admin créé : ${admin.email}`);
  console.log(`Aide-soignant créé : ${user.email}`);

  // Patients de démonstration
  const p1 = await prisma.patient.upsert({
    where: { id: 'demo-patient-1' },
    update: {},
    create: {
      id:          'demo-patient-1',
      nom:         'Marie Dupont',
      address_raw: '10 Rue de Rivoli, 75004 Paris',
      access_info: 'Code: 1234, 2ème étage gauche',
      telephone:   '+33 6 00 00 00 01',
    },
  });

  const p2 = await prisma.patient.upsert({
    where: { id: 'demo-patient-2' },
    update: {},
    create: {
      id:          'demo-patient-2',
      nom:         'Jean Martin',
      address_raw: '5 Avenue des Champs-Élysées, 75008 Paris',
      telephone:   '+33 6 00 00 00 02',
    },
  });

  console.log(`Patients créés : ${p1.nom}, ${p2.nom}`);
  console.log('\nSeed terminé !');
  console.log('\nComptes de test :');
  console.log('  Admin       — email: oumar1010@soingo.com | mdp: Amie1010');
  console.log('  Aide-soign. — email: amie1010@soingo.com  | mdp: jiji');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
