const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const calc = require('./calc');

async function getSettings() {
  return Settings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { new: true, upsert: true, setDefaultsOnInsert: true });
}

const dateMatch = (start, end) => {
  const m = {};
  if (start) m.$gte = start;
  if (end) m.$lt = end;
  return Object.keys(m).length ? { transactionDate: m } : {};
};

async function totalsFor(match) {
  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: { mode: '$paymentMode', type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  return calc.totalsFromGroups(rows.map((r) => ({ mode: r._id.mode, type: r._id.type, total: r.total })));
}

const monthRange = (year, month) => [new Date(Date.UTC(year, month - 1, 1)), new Date(Date.UTC(year, month, 1))];
const yearRange = (year) => [new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1))];

/** Report for [start, end). start = null means "from the beginning". */
async function rangeReport(start, end) {
  const settings = await getSettings();
  const earlier = start ? await totalsFor({ transactionDate: { $lt: start } }) : calc.totalsFromTransactions([]);
  const opening = calc.openingFromHistory(settings.openingBalances, earlier);
  const period = await totalsFor(dateMatch(start, end));
  return calc.buildReport(opening, period);
}

/** Dashboard summary: month, whole year, or all time depending on the filter */
async function summary({ year, month }) {
  if (year && month) return rangeReport(...monthRange(year, month));
  if (year) return rangeReport(...yearRange(year));
  return rangeReport(null, null);
}

const monthlyReport = (year, month) => rangeReport(...monthRange(year, month));

/** Twelve linked monthly reports (closing of one month = opening of the next) */
async function yearlyReport(year) {
  const settings = await getSettings();
  const [start, end] = yearRange(year);
  const earlier = await totalsFor({ transactionDate: { $lt: start } });
  const opening = calc.openingFromHistory(settings.openingBalances, earlier);
  const rows = await Transaction.aggregate([
    { $match: dateMatch(start, end) },
    { $group: { _id: { month: { $month: '$transactionDate' }, mode: '$paymentMode', type: '$type' }, total: { $sum: '$amount' } } },
  ]);
  return calc.chainYear(opening, rows.map((r) => ({ month: r._id.month, mode: r._id.mode, type: r._id.type, total: r.total })));
}

/** Current all-time balances in paise: { GPAY, CASH } */
async function currentBalances() {
  const settings = await getSettings();
  const all = await totalsFor({});
  return { settings, balances: calc.currentBalances(settings.openingBalances, all) };
}

module.exports = { getSettings, summary, monthlyReport, yearlyReport, currentBalances, monthRange, yearRange, dateMatch };
