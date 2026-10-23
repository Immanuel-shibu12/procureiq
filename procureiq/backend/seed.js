// Run: npm run seed  (clears and refills the database with SAMPLE data)
require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User, Supplier, Request } = require('./models');
const docs = (a, b, c) => [['Tax Certificate', a], ['Business License', b], ['Insurance', c]].map(([name, status]) => ({ name, status }));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  } catch {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
    console.log('Using in-memory MongoDB for seeding. Data is temporary.');
  }
}

async function doSeed() {
  await Promise.all([User.deleteMany(), Supplier.deleteMany(), Request.deleteMany()]);
  const pw = await bcrypt.hash('Password@123', 10);
  const [admin, req, off, app] = await User.create([
    { name: 'Alice Admin', email: 'admin@procureiq.com', password: pw, role: 'admin' },
    { name: 'Ravi Requester', email: 'requester@procureiq.com', password: pw, role: 'requester' },
    { name: 'Olivia Officer', email: 'officer@procureiq.com', password: pw, role: 'officer' },
    { name: 'Manu Manager', email: 'approver@procureiq.com', password: pw, role: 'approver' }]);
  const S = (name, cats, quotes, quality, onTimePct, delayed, d, status = 'active') => ({ name: `${name} [SAMPLE]`, email: `${name.split(' ')[0].toLowerCase()}@sample.test`, phone: '+91 90000 00000',
    categories: cats, quotes, quality, onTimePct, delayedDeliveries: delayed, documents: docs(...d), status, isSample: true });
  const sup = await Supplier.create([
    S('TechNova Traders', ['IT Equipment'], [{ category: 'IT Equipment', price: 52000 }], 4.5, 96, 0, ['valid', 'valid', 'valid']),
    S('Bright Systems', ['IT Equipment', 'Office Supplies'], [{ category: 'IT Equipment', price: 47000 }, { category: 'Office Supplies', price: 300 }], 3.4, 78, 4, ['valid', 'expired', 'valid'], 'under_review'),
    S('Orbit Supplies', ['IT Equipment', 'Office Supplies'], [{ category: 'IT Equipment', price: 49500 }, { category: 'Office Supplies', price: 260 }], 4.0, 88, 1, ['valid', 'valid', 'missing']),
    S('Zenith Furnishings', ['Furniture'], [{ category: 'Furniture', price: 8200 }], 2.6, 70, 5, ['expired', 'valid', 'missing'], 'suspended'),
    S('PaperPlus', ['Office Supplies', 'Stationery'], [{ category: 'Stationery', price: 40 }], null, null, 0, ['valid', 'valid', 'valid']), // no performance data
    S('Oldline Corp', ['Furniture'], [], 3.9, 90, 0, ['valid', 'valid', 'valid'], 'inactive')]);
  const mk = (i, c, q, p, status, m, sIdx) => {
    const at = m != null ? new Date(2026, m, 5) : new Date();
    const r = {
      itemName: i,
      category: c,
      quantity: q,
      unitPrice: p,
      requiredDate: new Date(Date.now() + 864e6 / 10),
      justification: 'Sample request for demonstration use.',
      requester: req._id,
      status,
      history: [{ status, byName: 'Seed', note: 'Sample data', at }]
    };
    if (sIdx != null) {
      r.order = {
        supplier: sup[sIdx]._id,
        poNumber: 'PO-S' + (m ?? 0) + i.length,
        value: q * p,
        orderedAt: m != null ? new Date(2026, m, 10) : new Date()
      };
    }
    return r;
  };
  for (const r of [mk('Laptops', 'IT Equipment', 10, 52000, 'delivered', 5, 0), mk('Printers', 'IT Equipment', 4, 25000, 'ordered', 7, 2),
    mk('Notebooks', 'Stationery', 500, 40, 'delivered', 8, 4), mk('Monitors', 'IT Equipment', 8, 12000, 'under_review'),
    mk('Desks', 'Furniture', 6, 8200, 'rejected'), mk('Chairs', 'Furniture', 12, 4500, 'submitted'), mk('Pens', 'Office Supplies', 200, 12, 'draft')]) await Request.create(r);
  console.log('Seeded. Login password for all demo users: Password@123');
}

module.exports = doSeed;

// When run directly: npm run seed
if (require.main === module) {
  (async () => { await connectDB(); await doSeed(); process.exit(0); })();
}
