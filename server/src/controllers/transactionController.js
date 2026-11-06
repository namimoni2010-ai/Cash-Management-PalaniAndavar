const Transaction = require('../models/Transaction');
const { transactionSchema } = require('../utils/validators');
const { ApiError, asyncHandler, escapeRegex, parseDay } = require('../utils/helpers');
const ledger = require('../services/ledgerService');
const calc = require('../services/calc');

const inr = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Negative-balance guard (rule 11). `changes` = [{ mode, delta }] in paise.
 * A change is blocked only if it makes a balance negative AND lowers it,
 * unless the administrator has enabled "allow negative balances".
 */
async function guardBalance(changes) {
  const { settings, balances } = await ledger.currentBalances();
  if (settings.allowNegative) return;
  const net = { GPAY: 0, CASH: 0 };
  for (const c of changes) net[c.mode] += c.delta;
  for (const mode of calc.MODES) {
    if (net[mode] < 0 && balances[mode] + net[mode] < 0) {
      const label = mode === 'GPAY' ? 'GPay' : 'Cash';
      throw new ApiError(
        422,
        `This would make the ${label} balance negative (available ${inr(balances[mode])}). Ask the administrator to allow negative balances in Settings, or correct the amount.`,
        'INSUFFICIENT_BALANCE'
      );
    }
  }
}

// Categories are no longer used; transactions are saved without one.
async function checkCategory() {
  return null;
}

// Older transactions may still carry a category, so keep populating it when present.
const populateCat = (q) => q.populate('category', 'name');

exports.list = asyncHandler(async (req, res) => {
  const { date, month, year, paymentMode, type, category, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
  const q = {};
  if (date) q.transactionDate = parseDay(date);
  else if (year && month) q.transactionDate = { $gte: ledger.monthRange(+year, +month)[0], $lt: ledger.monthRange(+year, +month)[1] };
  else if (year) q.transactionDate = { $gte: ledger.yearRange(+year)[0], $lt: ledger.yearRange(+year)[1] };
  else if (month) {
    // month without a year: use the current year
    const y = new Date().getUTCFullYear();
    q.transactionDate = { $gte: ledger.monthRange(y, +month)[0], $lt: ledger.monthRange(y, +month)[1] };
  }
  if (['GPAY', 'CASH'].includes(paymentMode)) q.paymentMode = paymentMode;
  if (['RECEIVED', 'EXPENSE'].includes(type)) q.type = type;
  if (category) q.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    q.$or = [{ description: rx }, { receivedFrom: rx }, { paidTo: rx }];
  }
  const [items, total] = await Promise.all([
    populateCat(Transaction.find(q).sort({ transactionDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Transaction.countDocuments(q),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

exports.create = asyncHandler(async (req, res) => {
  const data = transactionSchema.parse(req.body);

  // Idempotency: the same submission (same clientRequestId) returns the original record.
  if (data.clientRequestId) {
    const existing = await populateCat(Transaction.findOne({ clientRequestId: data.clientRequestId }));
    if (existing) return res.status(200).json({ transaction: existing, duplicate: true });
  }
  // Accidental double entry: identical transaction created in the last 30 seconds.
  const recent = await Transaction.findOne({
    transactionDate: parseDay(data.transactionDate),
    type: data.type,
    paymentMode: data.paymentMode,
    amount: data.amount,
    description: data.description,
    createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
  });
  if (recent) throw new ApiError(409, 'An identical transaction was just saved. Wait a moment if you really want to add it again', 'DUPLICATE');

  const category = await checkCategory(data);
  if (data.type === 'EXPENSE') await guardBalance([{ mode: data.paymentMode, delta: calc.effectOf('EXPENSE', data.amount) }]);

  try {
    const tx = await Transaction.create({ ...data, transactionDate: parseDay(data.transactionDate), category, createdBy: req.user._id });
    res.status(201).json({ transaction: await populateCat(Transaction.findById(tx._id)) });
  } catch (err) {
    if (err.code === 11000 && data.clientRequestId) {
      const existing = await populateCat(Transaction.findOne({ clientRequestId: data.clientRequestId }));
      return res.status(200).json({ transaction: existing, duplicate: true });
    }
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) throw new ApiError(404, 'Transaction not found');
  const data = transactionSchema.parse(req.body);
  const category = await checkCategory(data);

  // Remove the old effect, add the new one, then make sure no balance is pushed below zero.
  await guardBalance([
    { mode: tx.paymentMode, delta: -calc.effectOf(tx.type, tx.amount) },
    { mode: data.paymentMode, delta: calc.effectOf(data.type, data.amount) },
  ]);

  Object.assign(tx, { ...data, transactionDate: parseDay(data.transactionDate), category, clientRequestId: tx.clientRequestId });
  if (data.type === 'RECEIVED') tx.paidTo = '';
  if (data.type === 'EXPENSE') tx.receivedFrom = '';
  await tx.save();
  res.json({ transaction: await populateCat(Transaction.findById(tx._id)) });
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) throw new ApiError(404, 'Transaction not found');
  await guardBalance([{ mode: tx.paymentMode, delta: -calc.effectOf(tx.type, tx.amount) }]);
  await tx.deleteOne();
  res.json({ message: 'Transaction deleted' });
});