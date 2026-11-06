const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { categorySchema } = require('../utils/validators');
const { ApiError, asyncHandler } = require('../utils/helpers');

exports.list = asyncHandler(async (_req, res) => {
  const [cats, usage] = await Promise.all([
    Category.find().sort({ isDefault: -1, name: 1 }).lean(),
    Transaction.aggregate([{ $match: { type: 'EXPENSE' } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const used = Object.fromEntries(usage.map((u) => [String(u._id), u.count]));
  res.json({ categories: cats.map((c) => ({ ...c, usageCount: used[String(c._id)] || 0 })) });
});

exports.create = asyncHandler(async (req, res) => {
  const { name } = categorySchema.parse(req.body);
  if (await Category.findOne({ nameKey: name.toLowerCase() })) throw new ApiError(409, 'This category already exists', undefined, { name: 'This category already exists' });
  const category = await Category.create({ name, nameKey: name.toLowerCase() });
  res.status(201).json({ category });
});

exports.update = asyncHandler(async (req, res) => {
  const { name } = categorySchema.parse(req.body);
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  const clash = await Category.findOne({ nameKey: name.toLowerCase(), _id: { $ne: cat._id } });
  if (clash) throw new ApiError(409, 'This category already exists', undefined, { name: 'This category already exists' });
  cat.name = name;
  cat.nameKey = name.toLowerCase();
  await cat.save();
  res.json({ category: cat });
});

exports.remove = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  if (cat.isDefault) throw new ApiError(400, 'Built-in categories cannot be deleted');
  const used = await Transaction.countDocuments({ category: cat._id });
  if (used) throw new ApiError(400, `This category is used by ${used} transaction(s). Edit those first, or rename the category instead`);
  await cat.deleteOne();
  res.json({ message: 'Category deleted' });
});
