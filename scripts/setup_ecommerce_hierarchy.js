const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../src/generated/prisma'));

const rawConnectionString = process.env.DATABASE_URL;
const connectionString = rawConnectionString?.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});
pool.on('error', (err) => {
  console.warn('[Pool Warning]', err.message);
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

async function upsertCol({ name, slug, description, parentId = null, order = 0, showInNav = true }, retries = 3) {
  const finalSlug = slug || slugify(name);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const existing = await prisma.collection.findFirst({
        where: {
          OR: [
            { slug: finalSlug },
            { name: { equals: name, mode: 'insensitive' } }
          ]
        }
      });

      if (existing) {
        return await prisma.collection.update({
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

      return await prisma.collection.create({
        data: {
          name,
          slug: finalSlug,
          description: description || null,
          parentId,
          order,
          showInNav,
        },
      });
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Retry ${attempt}/${retries}] for "${name}":`, err.message);
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
}

async function main() {
  console.log('--- Setting Up Real E-Commerce Hierarchy (Pattern A) ---');

  // Hide old top-level standalone collections from navbar if needed
  await prisma.collection.updateMany({
    where: { slug: { in: ['best-sellers', 'new-arrivals'] } },
    data: { showInNav: false },
  });

  // 1. TOP-LEVEL DEPARTMENTS
  const sarees = await upsertCol({
    name: 'Sarees',
    slug: 'sarees',
    description: 'Explore the complete world of sarees from authentic South Indian Pattu to handcrafted cottons and designer party wear.',
    parentId: null,
    order: 1,
    showInNav: true,
  });

  const bridal = await upsertCol({
    name: 'Bridal',
    slug: 'bridal',
    description: 'Exclusive, heirloom-quality bridal wear and wedding pattu sarees for brides.',
    parentId: null,
    order: 2,
    showInNav: true,
  });

  const women = await upsertCol({
    name: 'Women',
    slug: 'women',
    description: 'Ethnic ensembles, party frocks, daily wear, and nightwear for women.',
    parentId: null,
    order: 3,
    showInNav: true,
  });

  console.log('✓ Created/Updated Top-Level Departments: Sarees, Bridal, Women');

  // 2. SAREES LEVEL-2 SECTIONS (under Sarees)
  const pattuSection = await upsertCol({
    name: 'Pure Pattu & Silk',
    slug: 'pattu-sarees',
    description: 'Heritage pure silk and pattu sarees handwoven for grand occasions.',
    parentId: sarees.id,
    order: 1,
    showInNav: true,
  });

  const cottonSection = await upsertCol({
    name: 'Cotton & Handlooms',
    slug: 'cotton-handloom-sarees',
    description: 'Breezy and comfortable handloom cotton sarees for daily and office wear.',
    parentId: sarees.id,
    order: 2,
    showInNav: true,
  });

  const partySection = await upsertCol({
    name: 'Party & Designer',
    slug: 'party-designer-sarees',
    description: 'Contemporary georgettes, crepes, and fancy embroidered designer sarees.',
    parentId: sarees.id,
    order: 3,
    showInNav: true,
  });

  console.log('✓ Created 3 Curated Sections under Sarees: Pure Pattu, Cotton & Handlooms, Party & Designer');

  // 3. LEVEL-3 VARIETIES UNDER PURE PATTU
  const pattuVarieties = [
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

  for (let i = 0; i < pattuVarieties.length; i++) {
    await upsertCol({
      name: pattuVarieties[i].name,
      slug: pattuVarieties[i].slug,
      parentId: pattuSection.id,
      order: i + 1,
      showInNav: true,
    });
  }
  console.log(`✓ Linked ${pattuVarieties.length} varieties under Pure Pattu & Silk`);

  // 4. LEVEL-3 VARIETIES UNDER COTTON & HANDLOOMS
  const cottonVarieties = [
    { name: 'Cotton Sarees', slug: 'cotton-sarees' },
    { name: 'Mangalagiri Cotton Sarees', slug: 'mangalagiri-cotton-sarees' },
    { name: 'Venkatagiri Sarees', slug: 'venkatagiri-sarees' },
    { name: 'Gadwal Sarees', slug: 'gadwal-sarees' },
    { name: 'Kanchi Cotton Sarees', slug: 'kanchi-cotton-sarees' },
    { name: 'Coimbatore Cotton Sarees', slug: 'coimbatore-cotton-sarees' },
    { name: 'Kota Digital Sarees', slug: 'kota-digital-sarees' },
    { name: 'Semi Pattu', slug: 'semi-pattu' },
    { name: 'Ramango Sarees', slug: 'ramango-sarees' },
  ];

  for (let i = 0; i < cottonVarieties.length; i++) {
    await upsertCol({
      name: cottonVarieties[i].name,
      slug: cottonVarieties[i].slug,
      parentId: cottonSection.id,
      order: i + 1,
      showInNav: true,
    });
  }
  console.log(`✓ Linked ${cottonVarieties.length} varieties under Cotton & Handlooms`);

  // 5. LEVEL-3 VARIETIES UNDER PARTY & DESIGNER
  const partyVarieties = [
    { name: 'Fancy Sarees', slug: 'fancy-sarees' },
    { name: 'Work Sarees', slug: 'work-sarees' },
    { name: 'Jaipur Georgette Sarees', slug: 'jaipur-georgette-sarees' },
    { name: 'Surat Silk Sarees', slug: 'surat-silk-sarees' },
    { name: 'Surat Crepe Sarees', slug: 'surat-crepe-sarees' },
    { name: 'Surat Georgette Sarees', slug: 'surat-georgette-sarees' },
    { name: 'Ikkat Sarees', slug: 'ikkat-sarees' },
    { name: 'Dola Silk Sarees', slug: 'dola-silk-sarees' },
    { name: 'Soft Silk with Brocade Sarees', slug: 'soft-silk-brocade-sarees' },
    { name: 'Paithani Sarees', slug: 'paithani-sarees' },
  ];

  for (let i = 0; i < partyVarieties.length; i++) {
    await upsertCol({
      name: partyVarieties[i].name,
      slug: partyVarieties[i].slug,
      parentId: partySection.id,
      order: i + 1,
      showInNav: true,
    });
  }
  console.log(`✓ Linked ${partyVarieties.length} varieties under Party & Designer`);

  // 6. BRIDAL SUB-CATEGORIES
  const bridalVarieties = [
    { name: 'Bridal Pattu Sarees', slug: 'bridal-pattu-sarees' },
    { name: 'Bridal Kanchi Pattu', slug: 'bridal-kanchi-pattu' },
    { name: 'Bridal Kanchi Padia Pattu', slug: 'bridal-kanchi-padia-pattu' },
    { name: 'Bridal Kanchi Vintage Pattu', slug: 'bridal-kanchi-vintage-pattu' },
    { name: 'Bridal Kanchi Meenakari Pattu', slug: 'bridal-kanchi-meenakari-pattu' },
    { name: 'Bridal Kanchi Paithani Pattu', slug: 'bridal-kanchi-paithani-pattu' },
  ];

  for (let i = 0; i < bridalVarieties.length; i++) {
    await upsertCol({
      name: bridalVarieties[i].name,
      slug: bridalVarieties[i].slug,
      parentId: bridal.id,
      order: i + 1,
      showInNav: true,
    });
  }
  console.log(`✓ Linked ${bridalVarieties.length} varieties under Bridal`);

  // 7. WOMEN SECTIONS & VARIETIES
  const ethnicSection = await upsertCol({
    name: 'Ethnic & Festive',
    slug: 'women-ethnic-festive',
    description: 'Chudidars, sets, frocks, and ethnic dress materials.',
    parentId: women.id,
    order: 1,
    showInNav: true,
  });

  const westernSection = await upsertCol({
    name: 'Western & Casual',
    slug: 'women-western-casual',
    description: 'Tops, jeans, plazos, and everyday casual wear.',
    parentId: women.id,
    order: 2,
    showInNav: true,
  });

  const nightSection = await upsertCol({
    name: 'Nightwear & Loungewear',
    slug: 'women-nightwear',
    description: 'Comfortable nighties, night dresses, pants, and innerwear.',
    parentId: women.id,
    order: 3,
    showInNav: true,
  });

  const ethnicItems = [
    { name: 'Chudidars', slug: 'chudidars' },
    { name: '3-Piece Sets', slug: '3-piece-sets' },
    { name: 'Long Frocks', slug: 'long-frocks' },
    { name: 'Sharara', slug: 'sharara' },
    { name: 'Gagra', slug: 'gagra' },
    { name: 'Half Sarees', slug: 'half-sarees' },
    { name: 'Dress Materials', slug: 'dress-materials' },
  ];

  for (let i = 0; i < ethnicItems.length; i++) {
    await upsertCol({
      name: ethnicItems[i].name,
      slug: ethnicItems[i].slug,
      parentId: ethnicSection.id,
      order: i + 1,
      showInNav: true,
    });
  }

  const westernItems = [
    { name: 'Tops', slug: 'tops' },
    { name: 'Western Tops', slug: 'western-tops' },
    { name: 'Plazos', slug: 'plazos' },
    { name: 'Ladies Jeans', slug: 'ladies-jeans' },
    { name: 'Scarfs', slug: 'scarfs' },
  ];

  for (let i = 0; i < westernItems.length; i++) {
    await upsertCol({
      name: westernItems[i].name,
      slug: westernItems[i].slug,
      parentId: westernSection.id,
      order: i + 1,
      showInNav: true,
    });
  }

  const nightItems = [
    { name: 'Night Dresses', slug: 'night-dresses' },
    { name: 'Nighties', slug: 'nighties' },
    { name: 'Night Pants', slug: 'night-pants' },
    { name: 'Ladies Panties', slug: 'ladies-panties' },
    { name: 'Ladies Bras', slug: 'ladies-bras' },
  ];

  for (let i = 0; i < nightItems.length; i++) {
    await upsertCol({
      name: nightItems[i].name,
      slug: nightItems[i].slug,
      parentId: nightSection.id,
      order: i + 1,
      showInNav: true,
    });
  }

  console.log('✓ Linked all Women categories into 3 organized columns!');
  console.log('\n--- SUCCESS! Real E-Commerce Pattern A Complete ---');
}

main()
  .catch(console.error)
  .finally(() => pool.end());
