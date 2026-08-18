import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const connectionString = String(process.env.DATABASE_URL || '')
  .replace(/^"|"$/g, '');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
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

  // Create delivery agent
  const deliveryPassword = await bcrypt.hash('delivery123', 10);
  await prisma.user.upsert({
    where: { email: 'delivery@myra.com' },
    update: {},
    create: {
      email: 'delivery@myra.com',
      phoneNumber: '8888888888',
      password: deliveryPassword,
      name: 'Delivery Agent',
      role: 'DELIVERY',
    },
  });

  // Create multi-worker
  const workerPassword = await bcrypt.hash('worker123', 10);
  await prisma.user.upsert({
    where: { email: 'worker@myra.com' },
    update: {},
    create: {
      email: 'worker@myra.com',
      phoneNumber: '7777777777',
      password: workerPassword,
      name: 'Multi-Worker',
      role: 'MULTI_WORKER',
      canManageInventory: true,
      canManageShipping: true,
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

  const menCollection = await prisma.collection.upsert({
    where: { slug: 'men' },
    update: {},
    create: { name: 'Men', slug: 'men', description: 'Men\'s fashion and ethnic wear' },
  });

  const sareesCollection = await prisma.collection.upsert({
    where: { slug: 'sarees' },
    update: {},
    create: { name: 'Sarees', slug: 'sarees', description: 'Traditional sarees for every occasion' },
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

  await prisma.product.upsert({
    where: { slug: 'men-ethnic-kurta' },
    update: {},
    create: {
      name: 'Men Ethnic Kurta',
      slug: 'men-ethnic-kurta',
      description: 'Classic kurta for festive occasions.',
      price: 1899.00,
      stockQuantity: 25,
      productType: 'Kurti / Ethnic',
      material: 'Cotton Blend',
      weight: '350 g',
      collectionId: menCollection.id,
      images: ['/displaypics/50offsale.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'banarasi-silk-saree' },
    update: {},
    create: {
      name: 'Banarasi Silk Saree',
      slug: 'banarasi-silk-saree',
      description: 'Handwoven Banarasi silk saree with gold zari.',
      price: 8999.00,
      stockQuantity: 12,
      productType: 'Saree',
      material: 'Pure Silk',
      weight: '850 g',
      collectionId: sareesCollection.id,
      images: ['/displaypics/70offsale.png'],
    },
  });

  const seedPincodes = [
    { code: '110001', city: 'New Delhi', state: 'Delhi' },
    { code: '400001', city: 'Mumbai', state: 'Maharashtra' },
    { code: '700001', city: 'Kolkata', state: 'West Bengal' },
    { code: '600001', city: 'Chennai', state: 'Tamil Nadu' },
    { code: '560001', city: 'Bengaluru', state: 'Karnataka' },
    { code: '500001', city: 'Hyderabad', state: 'Telangana' },
    { code: '380001', city: 'Ahmedabad', state: 'Gujarat' },
    { code: '226001', city: 'Lucknow', state: 'Uttar Pradesh' },
    { code: '302001', city: 'Jaipur', state: 'Rajasthan' },
    { code: '411001', city: 'Pune', state: 'Maharashtra' },
  ];

  for (const p of seedPincodes) {
    await prisma.pincode.upsert({
      where: { code: p.code },
      update: {},
      create: { code: p.code, city: p.city, state: p.state },
    });
  }

  const defaultSettings: Record<string, string> = {
    storeName: 'Myra Shopping Mall',
    supportEmail: 'support@myra.com',
    supportPhone: '+91 00000 00000',
    footerAbout: 'Curated sarees and ethnic wear crafted for every celebration.',
    taxPercent: '0',
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log('Seeding finished successfully.');
}main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
