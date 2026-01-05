import { PrismaClient, UserRole, GuestType, StaffRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Crear usuarios staff (admin y recepcionista)
  const adminPassword = await bcrypt.hash('reservaya2024', 10);
  const receptionistPassword = await bcrypt.hash('recepcion2024', 10);

  const staffAdmin = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: StaffRole.ADMIN,
    },
  });

  const staffReceptionist = await prisma.staff.upsert({
    where: { username: 'recepcion' },
    update: {},
    create: {
      username: 'recepcion',
      password: receptionistPassword,
      firstName: 'Recepcionista',
      lastName: 'Principal',
      role: StaffRole.RECEPTIONIST,
    },
  });

  console.log('Staff created:', { admin: staffAdmin.username, receptionist: staffReceptionist.username });

  // Crear propietarios
  const owner1 = await prisma.owner.upsert({
    where: { departmentCode: '503A' },
    update: { dni: '00000001' },
    create: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '00000001',
      email: 'juan.perez@email.com',
      phone: '987654321',
      departmentCode: '503A',
    },
  });

  const owner2 = await prisma.owner.upsert({
    where: { departmentCode: '807B' },
    update: { dni: '00000002' },
    create: {
      firstName: 'María',
      lastName: 'García',
      dni: '00000002',
      email: 'maria.garcia@email.com',
      phone: '912345678',
      departmentCode: '807B',
    },
  });

  const adminOwner = await prisma.owner.upsert({
    where: { departmentCode: 'ADMIN' },
    update: { dni: '00000000' },
    create: {
      firstName: 'Administrador',
      lastName: 'Sistema',
      dni: '00000000',
      email: 'admin@reservaya.com',
      phone: '000000000',
      departmentCode: 'ADMIN',
    },
  });

  console.log('Owners created:', { owner1: owner1.id, owner2: owner2.id, admin: adminOwner.id });

  // Crear usuarios
  const user1 = await prisma.user.upsert({
    where: { tower_floor_apartment: { tower: 'A', floor: '5', apartment: '3' } },
    update: {},
    create: {
      tower: 'A',
      floor: '5',
      apartment: '3',
      ownerId: owner1.id,
      role: UserRole.USER,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { tower_floor_apartment: { tower: 'B', floor: '8', apartment: '7' } },
    update: {},
    create: {
      tower: 'B',
      floor: '8',
      apartment: '7',
      ownerId: owner2.id,
      role: UserRole.USER,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { tower_floor_apartment: { tower: 'A', floor: '1', apartment: '1' } },
    update: {},
    create: {
      tower: 'A',
      floor: '1',
      apartment: '1',
      ownerId: adminOwner.id,
      role: UserRole.ADMIN,
    },
  });

  console.log('Users created:', { user1: user1.id, user2: user2.id, admin: adminUser.id });

  // Crear parrillas - Torre A (2)
  const grillA1 = await prisma.grill.upsert({
    where: { id: 'grill-a1' },
    update: {},
    create: {
      id: 'grill-a1',
      name: 'Parrilla Piscina A1',
      tower: 'A',
      description: 'Parrilla grande junto a la piscina, vista panorámica',
    },
  });

  const grillA2 = await prisma.grill.upsert({
    where: { id: 'grill-a2' },
    update: {},
    create: {
      id: 'grill-a2',
      name: 'Parrilla Piscina A2',
      tower: 'A',
      description: 'Parrilla mediana junto a la piscina, ambiente familiar',
    },
  });

  // Crear parrillas - Torre B (6)
  const grillsB = await Promise.all([
    prisma.grill.upsert({
      where: { id: 'grill-b1' },
      update: {},
      create: {
        id: 'grill-b1',
        name: 'Parrilla B1',
        tower: 'B',
        description: 'Parrilla techada, protegida de la lluvia',
      },
    }),
    prisma.grill.upsert({
      where: { id: 'grill-b2' },
      update: {},
      create: {
        id: 'grill-b2',
        name: 'Parrilla B2',
        tower: 'B',
        description: 'Parrilla al aire libre, zona jardín',
      },
    }),
    prisma.grill.upsert({
      where: { id: 'grill-b3' },
      update: {},
      create: {
        id: 'grill-b3',
        name: 'Parrilla B3',
        tower: 'B',
        description: 'Parrilla familiar, ambiente tranquilo',
      },
    }),
    prisma.grill.upsert({
      where: { id: 'grill-b4' },
      update: {},
      create: {
        id: 'grill-b4',
        name: 'Parrilla B4',
        tower: 'B',
        description: 'Parrilla grande para eventos',
      },
    }),
    prisma.grill.upsert({
      where: { id: 'grill-b5' },
      update: {},
      create: {
        id: 'grill-b5',
        name: 'Parrilla B5',
        tower: 'B',
        description: 'Parrilla mediana, vista al jardín',
      },
    }),
    prisma.grill.upsert({
      where: { id: 'grill-b6' },
      update: {},
      create: {
        id: 'grill-b6',
        name: 'Parrilla B6',
        tower: 'B',
        description: 'Parrilla techada premium',
      },
    }),
  ]);

  console.log('Grills created:', { torreA: 2, torreB: grillsB.length });

  // Crear configuración de piscina
  const poolConfig = await prisma.poolConfig.upsert({
    where: { id: 'pool-config-1' },
    update: { maxHoursPerVisit: 2 },
    create: {
      id: 'pool-config-1',
      maxCapacity: 25,
      maxHoursPerVisit: 2,
      openingTime: '08:00',
      closingTime: '22:00',
      isActive: true,
    },
  });

  console.log('Pool config created:', poolConfig.id);

  // Crear invitados de piscina para el usuario 1
  const guest1 = await prisma.poolGuest.upsert({
    where: { id: 'guest-1' },
    update: {},
    create: {
      id: 'guest-1',
      firstName: 'Carlos',
      lastName: 'Pérez',
      documentNumber: '12345678',
      guestType: GuestType.RESIDENT,
      departmentCode: '503A',
      registeredById: user1.id,
    },
  });

  const guest2 = await prisma.poolGuest.upsert({
    where: { id: 'guest-2' },
    update: {},
    create: {
      id: 'guest-2',
      firstName: 'Ana',
      lastName: 'López',
      guestType: GuestType.FRIEND,
      departmentCode: '503A',
      registeredById: user1.id,
    },
  });

  console.log('Pool guests created:', { guest1: guest1.id, guest2: guest2.id });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
