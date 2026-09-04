import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const connectionString = String(process.env.DATABASE_URL || '')
  .replace(/^"|"$/g, '');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateStrongPassword(): string {
  return crypto.randomBytes(18).toString('base64url');
}

async function main() {
  // Create admin with a random strong password (printed to stdout for first login)
  const adminPassword = generateStrongPassword();
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: 'admin@myra.com' },
    update: {},
    create: {
      email: 'admin@myra.com',
      phoneNumber: '9999999999',
      password: adminHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  const isDev = process.env.NODE_ENV === 'development';
  console.log(`[SEED] Admin created (email: admin@myra.com)${isDev ? ` password: ${adminPassword}` : ''}`);

  // Create delivery agent with a random strong password
  const deliveryPassword = generateStrongPassword();
  const deliveryHash = await bcrypt.hash(deliveryPassword, 12);
  await prisma.user.upsert({
    where: { email: 'delivery@myra.com' },
    update: {},
    create: {
      email: 'delivery@myra.com',
      phoneNumber: '8888888888',
      password: deliveryHash,
      name: 'Delivery Agent',
      role: 'MULTI_WORKER',
    },
  });
  console.log(`[SEED] Delivery created (email: delivery@myra.com)${isDev ? ` password: ${deliveryPassword}` : ''}`);


  // Create multi-worker with a random strong password
  const workerPassword = generateStrongPassword();
  const workerHash = await bcrypt.hash(workerPassword, 12);
  await prisma.user.upsert({
    where: { email: 'worker@myra.com' },
    update: {},
    create: {
      email: 'worker@myra.com',
      phoneNumber: '7777777777',
      password: workerHash,
      name: 'Multi-Worker',
      role: 'MULTI_WORKER',
      canManageInventory: true,
      canManageShipping: true,
    },
  });
  console.log(`[SEED] Worker created (email: worker@myra.com)${isDev ? ` password: ${workerPassword}` : ''}`);


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

  const bridalCollection = await prisma.collection.upsert({
    where: { slug: 'bridal' },
    update: {},
    create: { name: 'Bridal', slug: 'bridal', description: 'Exclusive Bridal Wear' },
  });

  // Create dummy products
  await prisma.product.upsert({
    where: { slug: 'elegant-orange-saree' },
    update: {
      images: ['/displaypics/saree1.png'],
    },
    create: {
      name: 'Elegant Orange Saree',
      slug: 'elegant-orange-saree',
      description: 'A beautiful orange saree perfect for weddings.',
      price: 4999.00,
      stockQuantity: 10,
      collectionId: womenCollection.id,
      images: ['/displaypics/saree1.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'casual-blue-top' },
    update: {
      images: ['/displaypics/women1.png'],
    },
    create: {
      name: 'Casual Blue Top',
      slug: 'casual-blue-top',
      description: 'Dresses that define you.',
      price: 1299.00,
      stockQuantity: 50,
      collectionId: womenCollection.id,
      images: ['/displaypics/women1.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kids-party-wear' },
    update: {
      images: ['/displaypics/kids1.png'],
    },
    create: {
      name: 'Kids Party Wear',
      slug: 'kids-party-wear',
      description: 'Comfortable and stylish kids wear.',
      price: 899.00,
      stockQuantity: 30,
      collectionId: kidsCollection.id,
      images: ['/displaypics/kids1.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'men-ethnic-kurta' },
    update: {
      images: ['/displaypics/saree2.png'],
    },
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
      images: ['/displaypics/saree2.png'],
    },
  });

  await prisma.product.upsert({
    where: { slug: 'banarasi-silk-saree' },
    update: {
      images: ['/displaypics/saree2.png'],
    },
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
      images: ['/displaypics/saree2.png'],
    },
  });

  // New Products for Bridal, Sarees, Women, Kids (Best Sellers and New Arrivals)
  await prisma.product.upsert({
    where: { slug: 'designer-bridal-lehenga' },
    update: {
      images: ['/displaypics/bridal poster.png'],
      bestSeller: true,
      createdAt: new Date(),
    },
    create: {
      name: 'Designer Bridal Lehenga',
      slug: 'designer-bridal-lehenga',
      description: 'Stunning designer bridal lehenga for your special day.',
      price: 25999.00,
      stockQuantity: 5,
      collectionId: bridalCollection.id,
      images: ['/displaypics/bridal poster.png'],
      bestSeller: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'silk-kanjeevaram-saree' },
    update: {
      images: ['/displaypics/saree1.png'],
      bestSeller: true,
      createdAt: new Date(),
    },
    create: {
      name: 'Silk Kanjeevaram Saree',
      slug: 'silk-kanjeevaram-saree',
      description: 'Authentic silk Kanjeevaram saree in vibrant red.',
      price: 15999.00,
      stockQuantity: 8,
      collectionId: sareesCollection.id,
      images: ['/displaypics/saree1.png'],
      bestSeller: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'women-designer-suit' },
    update: {
      images: ['/displaypics/women1.png'],
      bestSeller: true,
      createdAt: new Date(),
    },
    create: {
      name: 'Women Designer Suit',
      slug: 'women-designer-suit',
      description: 'Elegant designer suit for festive wear.',
      price: 3999.00,
      stockQuantity: 15,
      collectionId: womenCollection.id,
      images: ['/displaypics/women1.png'],
      bestSeller: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kids-ethnic-lehenga' },
    update: {
      images: ['/displaypics/kids1.png'],
      bestSeller: true,
      createdAt: new Date(),
    },
    create: {
      name: 'Kids Ethnic Lehenga',
      slug: 'kids-ethnic-lehenga',
      description: 'Cute ethnic lehenga for kids.',
      price: 1999.00,
      stockQuantity: 20,
      collectionId: kidsCollection.id,
      images: ['/displaypics/kids1.png'],
      bestSeller: true,
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
