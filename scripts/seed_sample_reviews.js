const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../src/generated/prisma'));

const rawConnectionString = process.env.DATABASE_URL;
const connectionString = rawConnectionString?.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: 'cream-floral-digital-print-silk-saree-with-royal-purple-zari-brocade-border' },
    });

    if (!product) {
      console.error('Product not found!');
      return;
    }

    console.log(`Target product: "${product.name}" (${product.id})`);

    // 1. Existing user
    let user1 = await prisma.user.findFirst({
      where: { email: 'akhilrajuvysyaraju@gmail.com' },
    });

    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          name: 'Vysyaraju Akhil Raju',
          email: 'akhilrajuvysyaraju@gmail.com',
          role: 'CUSTOMER',
        },
      });
    }

    // 2. Additional customer user for realistic side-by-side review display
    let user2 = await prisma.user.findFirst({
      where: { email: 'meera.patel@example.com' },
    });

    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          name: 'Meera Patel',
          email: 'meera.patel@example.com',
          role: 'CUSTOMER',
        },
      });
    }

    // Upsert Review 1
    const review1 = await prisma.review.upsert({
      where: { id: 'sample-review-cream-silk-1' },
      update: {
        rating: 5,
        comment: 'Absolutely gorgeous saree! The silk fabric is lightweight yet rich, and the digital floral print with the royal purple zari border looks stunning in real life. Wore it to a wedding reception and received endless compliments.',
        isApproved: true,
      },
      create: {
        id: 'sample-review-cream-silk-1',
        userId: user1.id,
        productId: product.id,
        rating: 5,
        comment: 'Absolutely gorgeous saree! The silk fabric is lightweight yet rich, and the digital floral print with the royal purple zari border looks stunning in real life. Wore it to a wedding reception and received endless compliments.',
        isApproved: true,
        images: [],
      },
    });
    console.log('Review 1 added/updated:', review1.id);

    // Upsert Review 2
    const review2 = await prisma.review.upsert({
      where: { id: 'sample-review-cream-silk-2' },
      update: {
        rating: 5,
        comment: 'The drape and texture exceeded my expectations. The colors match the photos accurately and the craftsmanship on the border is top-notch. Packaging was also very neat and arrived on time!',
        isApproved: true,
      },
      create: {
        id: 'sample-review-cream-silk-2',
        userId: user2.id,
        productId: product.id,
        rating: 5,
        comment: 'The drape and texture exceeded my expectations. The colors match the photos accurately and the craftsmanship on the border is top-notch. Packaging was also very neat and arrived on time!',
        isApproved: true,
        images: [],
      },
    });
    console.log('Review 2 added/updated:', review2.id);

    const allReviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true, email: true } } },
    });
    console.log('\nAll Reviews for product:');
    console.dir(allReviews, { depth: null });
  } catch (err) {
    console.error('Error inserting review:', err);
  } finally {
    await pool.end();
  }
}

main();
