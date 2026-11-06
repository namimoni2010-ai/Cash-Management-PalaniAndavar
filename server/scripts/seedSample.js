// Inserts demo transactions (Oct-Nov 2026) so you can see the dashboard and carry-forward working.
// Usage: npm run seed:sample           (add data)   |   npm run seed:sample -- --reset   (wipe transactions first)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const seedDefaults = require('../src/services/seedDefaults');
const Transaction = require('../src/models/Transaction');
const Category = require('../src/models/Category');
const ledger = require('../src/services/ledgerService');

const SAMPLE = [
  ['2026-10-02', 'RECEIVED', 'GPAY', 20000, null, 'Showroom collection', 'Customer'],
  ['2026-10-03', 'RECEIVED', 'CASH', 12000, null, 'Cash sales', 'Walk-in customers'],
  ['2026-10-05', 'EXPENSE', 'GPAY', 3500, 'Electricity Bill', 'October EB bill', 'TNEB'],
  ['2026-10-08', 'EXPENSE', 'CASH', 1200, 'Food and Refreshments', 'Staff tea and snacks', 'Canteen'],
  ['2026-10-15', 'EXPENSE', 'CASH', 800, 'Transportation', 'Vehicle fuel', 'Fuel station'],
  ['2026-10-20', 'RECEIVED', 'GPAY', 15000, null, 'Booking advance', 'Customer'],
  ['2026-10-28', 'EXPENSE', 'GPAY', 6000, 'Staff Expenses', 'Part salary advance', 'Staff'],
  ['2026-11-01', 'RECEIVED', 'CASH', 8000, null, 'Cash collection', 'Customer'],
  ['2026-11-02', 'EXPENSE', 'CASH', 450, 'Cleaning', 'Cleaning supplies', 'Local shop'],
  ['2026-11-05', 'RECEIVED', 'GPAY', 5000, null, 'Showroom collection', 'Customer'],
  ['2026-11-06', 'EXPENSE', 'GPAY', 1000, 'Transportation', 'Vehicle fuel expense', 'Fuel station'],
];

(async () => {
  await connectDB();
  await seedDefaults();
  if (process.argv.includes('--reset')) await Transaction.deleteMany({});
  const cats = Object.fromEntries((await Category.find()).map((c) => [c.name, c._id]));
  for (const [date, type, mode, amount, cat, description, party] of SAMPLE) {
    await Transaction.create({
      transactionDate: new Date(`${date}T00:00:00Z`), type, paymentMode: mode, amount, description,
      category: cat ? cats[cat] : null, receivedFrom: type === 'RECEIVED' ? party : '', paidTo: type === 'EXPENSE' ? party : '',
    });
  }
  console.log('October 2026:', JSON.stringify(await ledger.monthlyReport(2026, 10)));
  console.log('November 2026:', JSON.stringify(await ledger.monthlyReport(2026, 11)));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
