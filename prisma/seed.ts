import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myra.com' },
    update: {},
    create: {
      email: 'admin@myra.com',
      phoneNumber: '9999999999',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create Collections
  const womenCollection = await prisma.collection.upsert({
    where: { slug: 'women' },
    update: {},
    create: { name: 'Women', slug: 'women', description: 'Traditional and Modern wear for women' },
  });

  const kidsCollection = await prisma.collection.upsert({
    where: { slug: 'kids' },
    update: {},
    create: { name: 'Kids', slug: 'kids', description: 'Cute outfits for the little ones' },
  });

  // Create dummy products
  await prisma.product.upsert({
    where: { slug: 'elegant-orange-saree' },
    update: {},
    create: {
      name: 'Elegant Orange Saree',
      slug: 'elegant-orange-saree',
      description: 'A beautiful orange saree perfect for weddings.',
      price: 4999.00,
      stockQuantity: 10,
      collectionId: womenCollection.id,
      images: ['/displaypics/50offsale.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'casual-blue-top' },
    update: {},
    create: {
      name: 'Casual Blue Top',
      slug: 'casual-blue-top',
      description: 'Dresses that define you.',
      price: 1299.00,
      stockQuantity: 50,
      collectionId: womenCollection.id,
      images: ['/displaypics/dressesthatdefine.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kids-party-wear' },
    update: {},
    create: {
      name: 'Kids Party Wear',
      slug: 'kids-party-wear',
      description: 'Comfortable and stylish kids wear.',
      price: 899.00,
      stockQuantity: 30,
      collectionId: kidsCollection.id,
      images: ['/displaypics/70offsale.png'],
    },
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
