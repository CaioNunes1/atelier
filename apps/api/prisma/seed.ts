import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await argon2.hash('Admin@123');
  await prisma.user.upsert({
    where: { email: 'admin@atelier.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@atelier.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Categories
  const categories = [
    { name: 'Bolsas', slug: 'bolsas' },
    { name: 'Necessaires', slug: 'necessaires' },
    { name: 'Carteiras', slug: 'carteiras' },
    { name: 'Acessórios', slug: 'acessorios' },
  ];

  const createdCategories = [] as any[];
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
      },
    });
    createdCategories.push(cat);
  }

  // Products (3 examples), each with one variant and an image
  const productsData = [
    {
      name: 'Bolsa Floripa',
      slug: 'bolsa-floripa',
      description: 'Bolsa artesanal em tecido floral',
      priceInCents: 18990,
      categorySlug: 'bolsas',
    },
    {
      name: 'Necessaire Listras',
      slug: 'necessaire-listras',
      description: 'Necessaire compacta, ideal para viagem',
      priceInCents: 4990,
      categorySlug: 'necessaires',
    },
    {
      name: 'Carteira Minimal',
      slug: 'carteira-minimal',
      description: 'Carteira pequena em tecido resistente',
      priceInCents: 7990,
      categorySlug: 'carteiras',
    },
  ];

  for (const p of productsData) {
    const category = createdCategories.find((c) => c.slug === p.categorySlug);
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceInCents: p.priceInCents,
        isFeatured: true,
        category: { connect: { id: category.id } },
        stock: 10,
      },
    });

    // Variant
    await prisma.productVariant.create({
      data: {
        product: { connect: { id: product.id } },
        name: 'Padrão',
        stock: 10,
        priceModifierInCents: 0,
      },
    });

    // Image placeholder
    await prisma.productImage.create({
      data: {
        product: { connect: { id: product.id } },
        url: 'https://via.placeholder.com/800x800.png?text=' + encodeURIComponent(product.name),
        position: 1,
      },
    });
  }

  console.log('Seed completo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
