require('dotenv').config(); // Crucial: citește link-ul din fișierul .env
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg'); // Noul adaptor

// 1. Configurarea motorului Prisma pentru versiunea 7.9+
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();

// 2. Middleware-uri
app.use(cors());
app.use(express.json());

// 3. Ruta de Test
app.get('/', (req, res) => {
  res.json({ message: "Serverul Oneves funcționează perfect!" });
});

// 4. Ruta pentru afișarea produselor pe Frontend
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error("Eroare baza de date:", error);
    res.status(500).json({ error: "Eroare la extragerea produselor." });
  }
});

// Ruta pentru ADAUGAREA unui produs nou din panoul de Admin
app.post('/api/products', async (req, res) => {
  try {
    const { name, slug, description, price, stock, imageUrl } = req.body;
    
    // Găsim automat prima categorie creată anterior (ex: Laptopuri) pentru a lega produsul de ea
    const category = await prisma.category.findFirst();

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        categoryId: category.id
      }
    });
    
    res.json(newProduct);
  } catch (error) {
    console.error("Eroare la salvare:", error);
    res.status(500).json({ error: "Eroare la adăugarea produsului." });
  }
});
// 1. Înregistrare (Sign Up)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    // Setăm primul cont ca ADMIN automat sau pe baza unui email de admin, restul USER
    const role = email.includes('admin') ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { email, password, name, role }
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: "Emailul este deja folosit sau date invalide." });
  }
});

// 2. Autentificare (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Email sau parolă incorectă." });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Eroare la autentificare." });
  }
});

// 3. Ștergere Produs (Pentru Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: "Produs șters cu succes!" });
  } catch (error) {
    res.status(500).json({ error: "Nu s-a putut șterge produsul." });
  }
});

// Ruta pentru extragerea comenzilor unui anumit utilizator
app.get('/api/users/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' } // Le ordonăm descrescător (cele mai noi primele)
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Nu am putut încărca istoricul comenzilor." });
  }
});
// Ruta pentru CĂUTARE produse
app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query; // Preluăm cuvântul căutat din link
    if (!q) return res.json([]);

    const products = await prisma.product.findMany({
      where: {
        OR: [
          // "mode: 'insensitive'" face ca "laptop" să găsească și "Laptop"
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      }
    });
    res.json(products);
  } catch (error) {
    console.error("Eroare la căutare:", error);
    res.status(500).json({ error: "Eroare la căutarea produselor." });
  }
});
// Ruta pentru detaliile unui SINGUR produs
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: id }
    });
    
    if (!product) return res.status(404).json({ error: "Produsul nu a fost găsit." });
    
    res.json(product);
  } catch (error) {
    console.error("Eroare la produs:", error);
    res.status(500).json({ error: "Eroare la extragerea produsului." });
  }
});
// 5. Pornirea serverului
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serverul rulează la adresa: http://localhost:${PORT}`);
});