import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SoinGo database...\n');

  // ── Utilisateurs ─────────────────────────────────────────
  const adminHash = await bcrypt.hash('Amie1010', 10);
  const asHash1   = await bcrypt.hash('jiji', 10);
  const asHash2   = await bcrypt.hash('soingo123', 10);
  const coordHash = await bcrypt.hash('soingo123', 10);

  const admin = await prisma.user.upsert({
    where:  { email: 'oumar1010@soingo.com' },
    update: {},
    create: { nom: 'Oumar Maiga', email: 'oumar1010@soingo.com', role: 'ADMIN',         hash_mdp: adminHash },
  });

  const coordo = await prisma.user.upsert({
    where:  { email: 'coordo@soingo.com' },
    update: {},
    create: { nom: 'Sophie Lambert', email: 'coordo@soingo.com', role: 'COORDO',        hash_mdp: coordHash },
  });

  const as1 = await prisma.user.upsert({
    where:  { email: 'amie1010@soingo.com' },
    update: {},
    create: { nom: 'Amie Diallo',    email: 'amie1010@soingo.com', role: 'AIDE_SOIGNANT', hash_mdp: asHash1 },
  });

  const as2 = await prisma.user.upsert({
    where:  { email: 'thomas@soingo.com' },
    update: {},
    create: { nom: 'Thomas Renard',  email: 'thomas@soingo.com',   role: 'AIDE_SOIGNANT', hash_mdp: asHash2 },
  });

  console.log('✓ Utilisateurs créés');

  // ── Patients Reims ───────────────────────────────────────
  const patientsData = [
    {
      id:          'reims-patient-1',
      nom:         'Mme Dupont',
      address_raw: '12 Rue des Lilas, 51100 Reims, France',
      lat:         49.2587,
      lng:         4.0315,
      access_info: 'Code porte 245B, 2e étage',
      telephone:   '+33 3 26 00 00 01',
    },
    {
      id:          'reims-patient-2',
      nom:         'M. Bernard',
      address_raw: '8 Rue de Vesle, 51100 Reims, France',
      lat:         49.2583,
      lng:         4.0319,
      access_info: 'Interphone 3, ascenseur',
      telephone:   '+33 3 26 00 00 02',
    },
    {
      id:          'reims-patient-3',
      nom:         'Mme Lefèvre',
      address_raw: '25 Avenue Jean Jaurès, 51100 Reims, France',
      lat:         49.2479,
      lng:         4.0268,
      access_info: 'Rez-de-chaussée, sonnette gauche',
      telephone:   '+33 3 26 00 00 03',
    },
    {
      id:          'reims-patient-4',
      nom:         'M. Martin',
      address_raw: '3 Rue du Général Sarrail, 51100 Reims, France',
      lat:         49.2591,
      lng:         4.0312,
      access_info: 'Appartement 5B, digicode 1123',
      telephone:   '+33 3 26 00 00 04',
    },
    {
      id:          'reims-patient-5',
      nom:         'Mme Petit',
      address_raw: '18 Rue de Courlancy, 51100 Reims, France',
      lat:         49.2472,
      lng:         4.0198,
      access_info: 'Maison individuelle, portail vert',
      telephone:   '+33 3 26 00 00 05',
    },
    {
      id:          'reims-patient-6',
      nom:         'M. Durand',
      address_raw: '4 Rue Gambetta, 51100 Reims, France',
      lat:         49.2585,
      lng:         4.0327,
      access_info: '3e étage, ascenseur',
      telephone:   '+33 3 26 00 00 06',
    },
    {
      id:          'reims-patient-7',
      nom:         'Mme Moreau',
      address_raw: '10 Rue du Colonel Fabien, 51100 Reims, France',
      lat:         49.2541,
      lng:         4.0289,
      access_info: 'Code porte 9982, sonnette droite',
      telephone:   '+33 3 26 00 00 07',
    },
  ];

  const patients = [];
  for (const p of patientsData) {
    const patient = await prisma.patient.upsert({
      where:  { id: p.id },
      update: { lat: p.lat, lng: p.lng, telephone: p.telephone, access_info: p.access_info },
      create: p,
    });
    patients.push(patient);
  }
  console.log(`✓ ${patients.length} patients Reims insérés`);

  // ── Visites pour aujourd'hui ─────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visitesAS1 = [
    // Tournée Amie Diallo — 4 visites matin
    { patient: patients[0], heure: 8,  minute: 0,  duree: 45, notes: 'Pansement jambe droite + tension' },
    { patient: patients[1], heure: 9,  minute: 0,  duree: 30, notes: 'Injection insuline' },
    { patient: patients[3], heure: 10, minute: 0,  duree: 60, notes: 'Toilette complète + repas' },
    { patient: patients[6], heure: 11, minute: 15, duree: 30, notes: 'Contrôle glycémie' },
  ];

  const visitesAS2 = [
    // Tournée Thomas Renard — 3 visites après-midi
    { patient: patients[2], heure: 14, minute: 0,  duree: 45, notes: 'Toilette + médicaments 14h' },
    { patient: patients[4], heure: 15, minute: 0,  duree: 30, notes: 'Prise de sang + pansement' },
    { patient: patients[5], heure: 16, minute: 0,  duree: 45, notes: 'Toilette soir + repas' },
  ];

  let visitCount = 0;

  for (const v of visitesAS1) {
    const dateHeure = new Date(today);
    dateHeure.setHours(v.heure, v.minute, 0, 0);
    const existing = await prisma.visit.findFirst({
      where: { patientId: v.patient.id, aideSoignantId: as1.id, dateHeure },
    });
    if (!existing) {
      await prisma.visit.create({
        data: {
          patientId:      v.patient.id,
          aideSoignantId: as1.id,
          dateHeure,
          duree:   v.duree,
          statut:  'PLANIFIE',
          notes:   v.notes,
        },
      });
      visitCount++;
    }
  }

  for (const v of visitesAS2) {
    const dateHeure = new Date(today);
    dateHeure.setHours(v.heure, v.minute, 0, 0);
    const existing = await prisma.visit.findFirst({
      where: { patientId: v.patient.id, aideSoignantId: as2.id, dateHeure },
    });
    if (!existing) {
      await prisma.visit.create({
        data: {
          patientId:      v.patient.id,
          aideSoignantId: as2.id,
          dateHeure,
          duree:   v.duree,
          statut:  'PLANIFIE',
          notes:   v.notes,
        },
      });
      visitCount++;
    }
  }

  console.log(`✓ ${visitCount} visites créées pour aujourd'hui`);

  // ── Résumé ────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Comptes de test :');
  console.log('  Admin       — oumar1010@soingo.com  / Amie1010');
  console.log('  Coordinateur— coordo@soingo.com     / soingo123');
  console.log('  Aide-soign. — amie1010@soingo.com   / jiji       (4 visites matin)');
  console.log('  Aide-soign. — thomas@soingo.com     / soingo123  (3 visites après-midi)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
