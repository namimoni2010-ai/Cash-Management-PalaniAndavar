const Category = require('../models/Category');
const Settings = require('../models/Settings');

const DEFAULT_CATEGORIES = [
  'Transportation',
  'Food and Refreshments',
  'Electricity Bill',
  'Maintenance',
  'Staff Expenses',
  'Office Supplies',
  'Cleaning',
  'Miscellaneous',
];

module.exports = async function seedDefaults() {
  for (const name of DEFAULT_CATEGORIES) {
    await Category.updateOne({ nameKey: name.toLowerCase() }, { $setOnInsert: { name, nameKey: name.toLowerCase(), isDefault: true } }, { upsert: true });
  }
  await Settings.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true });
};
