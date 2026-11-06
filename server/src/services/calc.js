/**
 * Pure financial calculation logic (no database access, fully unit-tested).
 *
 * Rules
 *  - Balances are NEVER stored or hand-edited. They are always derived from the
 *    transaction records, so editing/deleting a transaction automatically
 *    corrects every balance and report.
 *  - All arithmetic is done in integer paise to avoid floating point drift
 *    (0.1 + 0.2 !== 0.3 in JavaScript). Values are converted back to rupees
 *    only when the result leaves this module.
 *  - GPAY and CASH are always calculated separately; COMBINED = GPAY + CASH.
 */
const MODES = ['GPAY', 'CASH'];

const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
const toRupees = (paise) => paise / 100;

const emptyTotals = () => ({ GPAY: { received: 0, expense: 0 }, CASH: { received: 0, expense: 0 } });

const add = (totals, mode, type, paise) => {
  if (!totals[mode]) return;
  if (type === 'RECEIVED') totals[mode].received += paise;
  else if (type === 'EXPENSE') totals[mode].expense += paise;
};

/** Sum raw transactions: [{ paymentMode, type, amount }] -> totals in paise */
function totalsFromTransactions(txns) {
  const totals = emptyTotals();
  for (const t of txns) add(totals, t.paymentMode, t.type, toPaise(t.amount));
  return totals;
}

/** Sum aggregated rows: [{ mode, type, total }] -> totals in paise */
function totalsFromGroups(rows) {
  const totals = emptyTotals();
  for (const r of rows) add(totals, r.mode, r.type, toPaise(r.total));
  return totals;
}

/** Opening balance (paise) = initial opening balance + net movement of earlier transactions */
function openingFromHistory(initialOpeningRupees, earlierTotals) {
  const out = {};
  for (const m of MODES) {
    out[m] = toPaise(initialOpeningRupees?.[m]) + earlierTotals[m].received - earlierTotals[m].expense;
  }
  return out;
}

/** Closing = Opening + Received - Expenses, per mode, plus COMBINED. Returns rupees. */
function buildReport(openingPaise, periodTotals) {
  const report = {};
  const combined = { opening: 0, received: 0, expense: 0, closing: 0 };
  for (const m of MODES) {
    const opening = openingPaise[m];
    const { received, expense } = periodTotals[m];
    const closing = opening + received - expense;
    report[m] = { opening: toRupees(opening), received: toRupees(received), expense: toRupees(expense), closing: toRupees(closing) };
    combined.opening += opening;
    combined.received += received;
    combined.expense += expense;
    combined.closing += closing;
  }
  report.COMBINED = Object.fromEntries(Object.entries(combined).map(([k, v]) => [k, toRupees(v)]));
  return report;
}

/**
 * Month-by-month chain for a year. Each month's opening is the previous
 * month's closing (carry-forward), separately for GPAY and CASH.
 * @param openingPaise  opening balances of January (paise, per mode)
 * @param rows          [{ month: 1-12, mode, type, total }]
 */
function chainYear(openingPaise, rows) {
  const perMonth = Array.from({ length: 12 }, () => emptyTotals());
  for (const r of rows) add(perMonth[r.month - 1], r.mode, r.type, toPaise(r.total));
  let opening = { ...openingPaise };
  return perMonth.map((totals, i) => {
    const report = buildReport(opening, totals);
    opening = { GPAY: toPaise(report.GPAY.closing), CASH: toPaise(report.CASH.closing) };
    return { month: i + 1, ...report };
  });
}

/** Current balance (paise) per mode from all-time totals */
function currentBalances(initialOpeningRupees, allTotals) {
  return openingFromHistory(initialOpeningRupees, allTotals);
}

/** The effect a transaction has on its mode's balance (paise) */
const effectOf = (type, amount) => (type === 'RECEIVED' ? toPaise(amount) : -toPaise(amount));

module.exports = {
  MODES,
  toPaise,
  toRupees,
  totalsFromTransactions,
  totalsFromGroups,
  openingFromHistory,
  buildReport,
  chainYear,
  currentBalances,
  effectOf,
};
