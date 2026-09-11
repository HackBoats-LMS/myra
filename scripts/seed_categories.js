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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function upsertCategory({ name, slug, description, parentId = null, order = 0, showInNav = true }) {
  const finalSlug = slug || slugify(name);
  
  const existing = await prisma.collection.findFirst({
    where: {
      OR: [
        { slug: finalSlug },
        { name: { equals: name, mode: 'insensitive' } }
      ]
    }
  });

  if (existing) {
    return prisma.collection.update({
      where: { id: existing.id },
      data: {
        name,
        slug: finalSlug,
        description: description || existing.description,
        parentId: parentId !== undefined ? parentId : existing.parentId,
        order,
        showInNav,
      },
    });
  }

  return prisma.collection.create({
    data: {
      name,
      slug: finalSlug,
      description: description || null,
      parentId,
      order,
      showInNav,
    },
  });
}

async function main() {
  console.log('--- Starting Categories & Subcategories Seeding ---');

  // 1. TOP-LEVEL PARENTS
  const sareesParent = await upsertCategory({
    name: 'Sarees',
    slug: 'sarees',
    description: 'Explore our rich collection of traditional, festive, and modern sarees.',
    order: 1,
    showInNav: true,
  });

  const pattuParent = await upsertCategory({
    name: 'Pattu Sarees',
    slug: 'pattu-sarees',
    description: 'Pure and blended South Indian Pattu sarees for weddings and grand celebrations.',
    order: 2,
    showInNav: true,
  });

  const bridalParent = await upsertCategory({
    name: 'Bridal',
    slug: 'bridal',
    description: 'Exclusive bridal collections and wedding wear.',
    order: 3,
    showInNav: true,
  });

  const womenParent = await upsertCategory({
    name: 'Women',
    slug: 'women',
    description: 'Women wear, dresses, and ethnic fashion.',
    order: 4,
    showInNav: true,
  });

  // 2. SAREES SUBCATEGORIES (under Sarees)
  const sareesSubs = [
    { name: 'Fancy Sarees', slug: 'fancy-sarees' },
    { name: 'Work Sarees', slug: 'work-sarees' },
    { name: 'Jaipur Georgette Sarees', slug: 'jaipur-georgette-sarees' },
    { name: 'Semi Pattu', slug: 'semi-pattu' },
    { name: 'Surat Silk Sarees', slug: 'surat-silk-sarees' },
    { name: 'Surat Crepe Sarees', slug: 'surat-crepe-sarees' },
    { name: 'Surat Georgette Sarees', slug: 'surat-georgette-sarees' },
    { name: 'Cotton Sarees', slug: 'cotton-sarees' },
    { name: 'Venkatagiri Sarees', slug: 'venkatagiri-sarees' },
    { name: 'Gadwal Sarees', slug: 'gadwal-sarees' },
    { name: 'Kanchi Cotton Sarees', slug: 'kanchi-cotton-sarees' },
    { name: 'Coimbatore Cotton Sarees', slug: 'coimbatore-cotton-sarees' },
    { name: 'Mangalagiri Cotton Sarees', slug: 'mangalagiri-cotton-sarees' },
    { name: 'Mangalagiri Pattu Sarees', slug: 'mangalagiri-pattu-sarees' },
    { name: 'Ikkat Sarees', slug: 'ikkat-sarees' },
    { name: 'Dola Silk Sarees', slug: 'dola-silk-sarees' },
    { name: 'Soft Silk with Brocade Sarees', slug: 'soft-silk-brocade-sarees' },
    { name: 'Paithani Sarees', slug: 'paithani-sarees' },
    { name: 'Ramango Sarees', slug: 'ramango-sarees' },
    { name: 'Kota Digital Sarees', slug: 'kota-digital-sarees' },
  ];

  for (let i = 0; i < sareesSubs.length; i++) {
    await upsertCategory({
      name: sareesSubs[i].name,
      slug: sareesSubs[i].slug,
      parentId: sareesParent.id,
      order: i + 1,
      showInNav: true,
    });
  }

  // 3. PATTU SAREES SUBCATEGORIES (under Pattu Sarees)
  const pattuSubs = [
    { name: 'Kanchi Pattu Sarees', slug: 'kanchi-pattu-sarees' },
    { name: 'Dharmavaram Pattu Sarees', slug: 'dharmavaram-pattu-sarees' },
    { name: 'Arani Pattu Sarees', slug: 'arani-pattu-sarees' },
    { name: 'Padiya Pattu Sarees', slug: 'padiya-pattu-sarees' },
    { name: 'Kanakamahalakshmi Pattu Sarees', slug: 'kanakamahalakshmi-pattu-sarees' },
    { name: 'Banaras Pattu Sarees', slug: 'banaras-pattu-sarees' },
    { name: 'Soft Pattu Sarees', slug: 'soft-pattu-sarees' },
    { name: 'Coimbatore Pattu Sarees', slug: 'coimbatore-pattu-sarees' },
    { name: 'Srikara Pattu Sarees', slug: 'srikara-pattu-sarees' },
    { name: 'Patola Pattu Sarees', slug: 'patola-pattu-sarees' },
    { name: 'Ikkat Pattu Sarees', slug: 'ikkat-pattu-sarees' },
    { name: 'Uppada Pattu Sarees', slug: 'uppada-pattu-sarees' },
    { name: 'Pure Mangalagiri Pattu Sarees', slug: 'pure-mangalagiri-pattu-sarees' },
    { name: 'Vintage Pattu Sarees', slug: 'vintage-pattu-sarees' },
    { name: 'Pattu Work Sarees', slug: 'pattu-work-sarees' },
    { name: 'Badhri Print Sarees', slug: 'badhri-print-sarees' },
    { name: 'Gadwal Pattu Sarees', slug: 'gadwal-pattu-sarees' },
    { name: 'Tussar Pattu Sarees', slug: 'tussar-pattu-sarees' },
    { name: 'Kuppadam Pattu Sarees', slug: 'kuppadam-pattu-sarees' },
    { name: 'Organza Sarees', slug: 'organza-sarees' },
    { name: 'Pattu Pavadas', slug: 'pattu-pavadas' },
    { name: 'Kathan Pattu Sarees', slug: 'kathan-pattu-sarees' },
    { name: 'Wedding Bridal Pattu Sarees', slug: 'wedding-bridal-pattu-sarees' },
  ];

  for (let i = 0; i < pattuSubs.length; i++) {
    await upsertCategory({
      name: pattuSubs[i].name,
      slug: pattuSubs[i].slug,
      parentId: pattuParent.id,
      order: i + 1,
      showInNav: true,
    });
  }

  // 4. BRIDAL SUBCATEGORIES (under Bridal)
  const bridalSubs = [
    { name: 'Bridal Pattu Sarees', slug: 'bridal-pattu-sarees' },
    { name: 'Bridal Kanchi Pattu', slug: 'bridal-kanchi-pattu' },
    { name: 'Bridal Kanchi Padia Pattu', slug: 'bridal-kanchi-padia-pattu' },
    { name: 'Bridal Kanchi Vintage Pattu', slug: 'bridal-kanchi-vintage-pattu' },
    { name: 'Bridal Kanchi Meenakari Pattu', slug: 'bridal-kanchi-meenakari-pattu' },
    { name: 'Bridal Kanchi Paithani Pattu', slug: 'bridal-kanchi-paithani-pattu' },
  ];

  for (let i = 0; i < bridalSubs.length; i++) {
    await upsertCategory({
      name: bridalSubs[i].name,
      slug: bridalSubs[i].slug,
      parentId: bridalParent.id,
      order: i + 1,
      showInNav: true,
    });
  }

  // 5. WOMEN SUBCATEGORIES (under Women)
  const womenSubs = [
    { name: 'Dresses', slug: 'dresses' },
    { name: 'Tops', slug: 'tops' },
    { name: 'Chudidars', slug: 'chudidars' },
    { name: '3-Piece Sets', slug: '3-piece-sets' },
    { name: 'Long Frocks', slug: 'long-frocks' },
    { name: 'Sharara', slug: 'sharara' },
    { name: 'Gagra', slug: 'gagra' },
    { name: 'Half Sarees', slug: 'half-sarees' },
    { name: 'Dress Materials', slug: 'dress-materials' },
    { name: 'Night Dresses', slug: 'night-dresses' },
    { name: 'Nighties', slug: 'nighties' },
    { name: 'Plazos', slug: 'plazos' },
    { name: 'Night Pants', slug: 'night-pants' },
    { name: 'Western Tops', slug: 'western-tops' },
    { name: 'Ladies Jeans', slug: 'ladies-jeans' },
    { name: 'Ladies Panties', slug: 'ladies-panties' },
    { name: 'Ladies Bras', slug: 'ladies-bras' },
    { name: 'Scarfs', slug: 'scarfs' },
  ];

  for (let i = 0; i < womenSubs.length; i++) {
    await upsertCategory({
      name: womenSubs[i].name,
      slug: womenSubs[i].slug,
      parentId: womenParent.id,
      order: i + 1,
      showInNav: true,
    });
  }

  console.log('Categories seeded and aligned with Bridal & Women parents!');
}

main()
  .catch(console.error)
  .finally(() => pool.end());
