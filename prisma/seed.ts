import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear parrillas
  const grills = [
    { name: 'Parrilla 1', tower: 'A', description: 'Parrilla torre A - Piso 1' },
    { name: 'Parrilla 2', tower: 'A', description: 'Parrilla torre A - Piso 2' },
    { name: 'Parrilla 3', tower: 'B', description: 'Parrilla torre B - Piso 1' },
    { name: 'Parrilla 4', tower: 'B', description: 'Parrilla torre B - Piso 2' },
    { name: 'Parrilla 5', tower: 'B', description: 'Parrilla torre B - Piso 3' },
    { name: 'Parrilla 6', tower: 'B', description: 'Parrilla torre B - Piso 4' },
    { name: 'Parrilla 7', tower: 'B', description: 'Parrilla torre B - Piso 5' },
    { name: 'Parrilla 8', tower: 'B', description: 'Parrilla torre B - Piso 6' },
  ];

  for (const grill of grills) {
    await prisma.grill.upsert({
      where: { id: grill.name.toLowerCase().replace(' ', '-') },
      update: grill,
      create: {
        id: grill.name.toLowerCase().replace(' ', '-'),
        ...grill,
      },
    });
  }

  console.log('Seed completado: 8 parrillas creadas');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
