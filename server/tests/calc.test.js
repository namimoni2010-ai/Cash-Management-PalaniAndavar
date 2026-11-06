const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../src/services/calc');

const tx = (paymentMode, type, amount, month = 10) => ({ paymentMode, type, amount, month });
const group = (list) => {
  const m = new Map();
  for (const t of list) {
    const k = `${t.month}|${t.paymentMode}|${t.type}`;
    m.set(k, (m.get(k) || 0) + t.amount);
  }
  return [...m].map(([k, total]) => { const [month, mode, type] = k.split('|'); return { month: +month, mode, type, total }; });
};

// Sample data mirrors the dashboard example in the brief: GPay 50,000 / 15,000 ; Cash 30,000 / 10,000
const SAMPLE = [
  tx('GPAY', 'RECEIVED', 30000), tx('GPAY', 'RECEIVED', 20000), tx('GPAY', 'EXPENSE', 10000), tx('GPAY', 'EXPENSE', 5000),
  tx('CASH', 'RECEIVED', 30000), tx('CASH', 'EXPENSE', 6000), tx('CASH', 'EXPENSE', 4000),
];

test('dashboard example: GPay, Cash and Combined', () => {
  const r = calc.buildReport(calc.openingFromHistory({ GPAY: 0, CASH: 0 }, calc.totalsFromTransactions([])), calc.totalsFromTransactions(SAMPLE));
  assert.deepEqual(r.GPAY, { opening: 0, received: 50000, expense: 15000, closing: 35000 });
  assert.deepEqual(r.CASH, { opening: 0, received: 30000, expense: 10000, closing: 20000 });
  assert.deepEqual(r.COMBINED, { opening: 0, received: 80000, expense: 25000, closing: 55000 });
});

test('combined balance always equals GPay + Cash', () => {
  const r = calc.buildReport({ GPAY: 123450, CASH: 6789 }, calc.totalsFromTransactions(SAMPLE));
  assert.equal(r.COMBINED.closing, r.GPAY.closing + r.CASH.closing);
});

test('opening balance is included: closing = opening + received - expenses', () => {
  const opening = calc.openingFromHistory({ GPAY: 1000, CASH: 500 }, calc.totalsFromTransactions([]));
  const r = calc.buildReport(opening, calc.totalsFromTransactions([tx('GPAY', 'RECEIVED', 200), tx('CASH', 'EXPENSE', 50)]));
  assert.equal(r.GPAY.closing, 1200);
  assert.equal(r.CASH.closing, 450);
});

test('no floating point drift (0.1 + 0.2)', () => {
  const r = calc.buildReport({ GPAY: 0, CASH: 0 }, calc.totalsFromTransactions([tx('GPAY', 'RECEIVED', 0.1), tx('GPAY', 'RECEIVED', 0.2)]));
  assert.equal(r.GPAY.received, 0.3);
  assert.equal(r.GPAY.closing, 0.3);
});

test('month-to-month carry-forward, GPay and Cash kept separate', () => {
  const list = [
    tx('GPAY', 'RECEIVED', 20000, 10), tx('GPAY', 'EXPENSE', 3500, 10), tx('CASH', 'RECEIVED', 12000, 10), tx('CASH', 'EXPENSE', 2000, 10),
    tx('GPAY', 'RECEIVED', 5000, 11), tx('GPAY', 'EXPENSE', 1000, 11), tx('CASH', 'EXPENSE', 450, 11),
  ];
  const year = calc.chainYear({ GPAY: 0, CASH: 0 }, group(list));
  const oct = year[9], nov = year[10], dec = year[11];
  assert.equal(oct.GPAY.closing, 16500);
  assert.equal(oct.CASH.closing, 10000);
  assert.equal(nov.GPAY.opening, oct.GPAY.closing); // November opening = October closing
  assert.equal(nov.CASH.opening, oct.CASH.closing);
  assert.equal(nov.GPAY.closing, 20500);
  assert.equal(nov.CASH.closing, 9550);
  assert.equal(dec.GPAY.opening, nov.GPAY.closing); // unused balance keeps carrying forward
  assert.equal(dec.COMBINED.closing, 30050);
  assert.equal(year[0].GPAY.opening, 0);
});

test('editing or deleting a transaction recalculates every balance (balances are derived)', () => {
  const before = [tx('GPAY', 'RECEIVED', 5000), tx('GPAY', 'EXPENSE', 1000)];
  const sum = (l) => calc.buildReport({ GPAY: 0, CASH: 0 }, calc.totalsFromTransactions(l)).GPAY.closing;
  assert.equal(sum(before), 4000);
  assert.equal(sum([tx('GPAY', 'RECEIVED', 5000), tx('GPAY', 'EXPENSE', 1500)]), 3500); // edit expense to 1,500
  assert.equal(sum([tx('GPAY', 'RECEIVED', 5000)]), 5000); // delete the expense
});

test('opening from history adds the net of earlier transactions', () => {
  const earlier = calc.totalsFromTransactions([tx('GPAY', 'RECEIVED', 100), tx('GPAY', 'EXPENSE', 30), tx('CASH', 'EXPENSE', 20)]);
  const o = calc.openingFromHistory({ GPAY: 10, CASH: 50 }, earlier);
  assert.equal(calc.toRupees(o.GPAY), 80);
  assert.equal(calc.toRupees(o.CASH), 30);
});

test('effectOf: received adds, expense subtracts', () => {
  assert.equal(calc.effectOf('RECEIVED', 12.5), 1250);
  assert.equal(calc.effectOf('EXPENSE', 12.5), -1250);
});
