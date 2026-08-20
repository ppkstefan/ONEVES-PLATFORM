const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Începem introducerea datelor...');

  // 1. Creăm categoria
  const categoria = await prisma.category.create({
    data: {
      name: 'Laptopuri',
      slug: 'laptopuri',
      description: 'Laptopuri de performanță înaltă'
    }
  });
  console.log('✅ Categoria a fost creată cu ID-ul:', categoria.id);

  // 2. Creăm produsul
  const produs = await prisma.product.create({
    data: {
      name: 'Laptop ASUS',
      slug: 'laptop-asus',
      description: 'Acesta este un laptop de test pentru platforma Oneves.',
      price: 4500,
      stock: 23,
      imageUrl: 'https://dlcdnrog.asus.com/rog/media/1782860524430.webp',
      categoryId: categoria.id // Aici preia ID-ul corect automat!
    }
  });
  console.log('✅ Produsul a fost creat cu succes!');
}

main()
  .catch((e) => {
    console.error('❌ A apărut o eroare:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });