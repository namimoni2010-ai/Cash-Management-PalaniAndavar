const { settingsSchema } = require('../utils/validators');
const { asyncHandler } = require('../utils/helpers');
const ledger = require('../services/ledgerService');

const shape = (s) => ({ openingBalances: { GPAY: s.openingBalances.GPAY, CASH: s.openingBalances.CASH }, allowNegative: s.allowNegative });

exports.get = asyncHandler(async (_req, res) => res.json({ settings: shape(await ledger.getSettings()) }));

exports.update = asyncHandler(async (req, res) => {
  const data = settingsSchema.parse(req.body);
  const s = await ledger.getSettings();
  s.openingBalances = data.openingBalances;
  s.allowNegative = data.allowNegative;
  await s.save();
  res.json({ settings: shape(s) });
});
