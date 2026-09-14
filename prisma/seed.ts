import { PrismaClient } from '@prisma/client';
import {
  PRESET_CATEGORIES,
  PRESET_STORAGE_LOCATIONS,
} from '../src/catalogs/catalog.constants';

const prisma = new PrismaClient();

async function main() {
  for (const category of PRESET_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name, userId: null },
      create: { id: category.id, name: category.name, userId: null },
    });
  }

  for (const location of PRESET_STORAGE_LOCATIONS) {
    await prisma.storageLocation.upsert({
      where: { id: location.id },
      update: { name: location.name, userId: null },
      create: { id: location.id, name: location.name, userId: null },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
