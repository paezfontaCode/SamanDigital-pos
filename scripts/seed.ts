import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Crear usuario admin por defecto
  const adminPassword = await bcrypt.hash('Admin2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@samandigital.com' },
    update: {},
    create: {
      name: 'Admin Saman Digital',
      email: 'admin@samandigital.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Crear configuración del negocio básica
  const config = await prisma.businessConfig.upsert({
    where: { key: 'BUSINESS_INFO' },
    update: {},
    create: {
      key: 'BUSINESS_INFO',
      value: JSON.stringify({
        name: 'Saman Digital',
        phone: '+584120000000',
        address: 'Dirección del Local',
        taxId: 'J-123456789'
      }),
      description: 'Configuración general del negocio',
    },
  });
  console.log('✅ Business config created');

  // 3. Crear algunas categorías base
  const category1 = await prisma.productCategory.upsert({
    where: { name: 'Forros' },
    update: {},
    create: {
      name: 'Forros',
      type: 'ACCESORIO',
      description: 'Forros para celulares'
    }
  });

  const category2 = await prisma.productCategory.upsert({
    where: { name: 'Pantallas' },
    update: {},
    create: {
      name: 'Pantallas',
      type: 'REPUESTO',
      description: 'Pantallas de repuesto para reparación'
    }
  });
  console.log('✅ Default categories created');

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
