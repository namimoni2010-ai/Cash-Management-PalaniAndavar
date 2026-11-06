const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const { periodQuery } = require('../utils/validators');
const { ApiError, asyncHandler } = require('../utils/helpers');
const ledger = require('../services/ledgerService');
const calc = require('../services/calc');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const needYear = (q) => {
  const p = periodQuery.parse(q);
  if (!p.year) throw new ApiError(400, 'Choose a year');
  return p;
};
const needMonth = (q) => {
  const p = needYear(q);
  if (!p.month) throw new ApiError(400, 'Choose a month');
  return p;
};

exports.summary = asyncHandler(async (req, res) => res.json(await ledger.summary(periodQuery.parse(req.query))));

exports.monthly = asyncHandler(async (req, res) => {
  const { year, month } = needMonth(req.query);
  res.json(await ledger.monthlyReport(year, month));
});

exports.yearly = asyncHandler(async (req, res) => {
  const { year } = needYear(req.query);
  res.json({ year, months: await ledger.yearlyReport(year) });
});

exports.categories = asyncHandler(async (req, res) => {
  const { year, month } = needYear(req.query);
  const [start, end] = month ? ledger.monthRange(year, month) : ledger.yearRange(year);
  const rows = await Transaction.aggregate([
    { $match: { type: 'EXPENSE', transactionDate: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $project: { _id: 0, name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorised'] }, total: 1 } },
    { $sort: { total: -1 } },
  ]);
  res.json({ categories: rows.map((r) => ({ name: r.name, total: calc.toRupees(calc.toPaise(r.total)) })) });
});

exports.daily = asyncHandler(async (req, res) => {
  const { year, month } = needMonth(req.query);
  const [start, end] = ledger.monthRange(year, month);
  const rows = await Transaction.aggregate([
    { $match: { type: 'EXPENSE', transactionDate: { $gte: start, $lt: end } } },
    { $group: { _id: { day: { $dayOfMonth: '$transactionDate' }, mode: '$paymentMode' }, total: { $sum: '$amount' } } },
  ]);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const out = Array.from({ length: days }, (_, i) => ({ day: i + 1, GPAY: 0, CASH: 0, total: 0 }));
  for (const r of rows) out[r._id.day - 1][r._id.mode] = calc.toRupees(calc.toPaise(r.total));
  out.forEach((d) => (d.total = calc.toRupees(calc.toPaise(d.GPAY) + calc.toPaise(d.CASH))));
  res.json({ days: out });
});

exports.export = asyncHandler(async (req, res) => {
  const { year, month } = needMonth(req.query);
  const format = req.query.format === 'pdf' ? 'pdf' : 'xlsx';
  const [start, end] = ledger.monthRange(year, month);
  const [report, txns] = await Promise.all([
    ledger.monthlyReport(year, month),
    Transaction.find({ transactionDate: { $gte: start, $lt: end } }).sort({ transactionDate: 1, createdAt: 1 }).populate('category', 'name').lean(),
  ]);
  const title = `${MONTHS[month - 1]} ${year}`;
  const fileBase = `showroom-report-${year}-${String(month).padStart(2, '0')}`;
  const rows = txns.map((t) => ({
    date: t.transactionDate.toISOString().slice(0, 10),
    type: t.type === 'RECEIVED' ? 'Received' : 'Expense',
    mode: t.paymentMode === 'GPAY' ? 'GPay' : 'Cash',
    category: t.category?.name || '',
    description: t.description,
    party: t.type === 'RECEIVED' ? t.receivedFrom : t.paidTo,
    amount: t.amount,
  }));
  const sections = [['GPay', report.GPAY], ['Cash', report.CASH], ['Combined', report.COMBINED]];

  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    const s = wb.addWorksheet('Summary');
    s.addRow([`Showroom Expense Report - ${title}`]).font = { bold: true, size: 14 };
    s.addRow([]);
    s.addRow(['', 'Opening', 'Received', 'Expenses', 'Closing']).font = { bold: true };
    sections.forEach(([n, r]) => s.addRow([n, r.opening, r.received, r.expense, r.closing]));
    s.columns.forEach((c, i) => (c.width = i === 0 ? 14 : 16));
    ['B', 'C', 'D', 'E'].forEach((col) => s.getColumn(col).numFmt = '"₹"#,##0.00');
    const t = wb.addWorksheet('Transactions');
    t.addRow(['Date', 'Type', 'Mode', 'Category', 'Description', 'Received from / Paid to', 'Amount']).font = { bold: true };
    rows.forEach((r) => t.addRow([r.date, r.type, r.mode, r.category, r.description, r.party, r.amount]));
    [12, 10, 8, 22, 40, 24, 14].forEach((w, i) => (t.getColumn(i + 1).width = w));
    t.getColumn(7).numFmt = '"₹"#,##0.00';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  }

  // PDF
  const money = (n) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // built-in PDF fonts lack the ₹ glyph
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
  doc.pipe(res);
  doc.fontSize(18).text(`Showroom Expense Report - ${title}`);
  doc.moveDown();
  const cols = [40, 130, 240, 350, 460];
  const head = ['', 'Opening', 'Received', 'Expenses', 'Closing'];
  doc.fontSize(10).font('Helvetica-Bold');
  let y = doc.y;
  head.forEach((h, i) => doc.text(h, cols[i], y, { width: 105 }));
  doc.font('Helvetica');
  sections.forEach(([n, r]) => {
    y += 18;
    [n, money(r.opening), money(r.received), money(r.expense), money(r.closing)].forEach((v, i) => doc.text(v, cols[i], y, { width: 105 }));
  });
  y += 36;
  doc.font('Helvetica-Bold').fontSize(12).text('Transactions', 40, y);
  y += 20;
  const tc = [40, 100, 155, 195, 290, 520];
  const row = (vals, bold) => {
    if (y > 770) { doc.addPage(); y = 40; }
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    vals.forEach((v, i) => doc.text(String(v), tc[i], y, { width: (tc[i + 1] || 555) - tc[i] - 5, height: 12, ellipsis: true, align: i === 5 ? 'right' : 'left' }));
    y += 15;
  };
  row(['Date', 'Type', 'Mode', 'Category', 'Description', 'Amount'], true);
  rows.forEach((r) => row([r.date, r.type, r.mode, r.category, r.description, money(r.amount)]));
  if (!rows.length) row(['No transactions this month']);
  doc.end();
});
