const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authSchema } = require('../utils/validators');
const { ApiError, asyncHandler } = require('../utils/helpers');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Registration is open only until the first (administrator) account exists.
exports.status = asyncHandler(async (_req, res) => {
  res.json({ registrationOpen: (await User.countDocuments()) === 0 });
});

exports.register = asyncHandler(async (req, res) => {
  if ((await User.countDocuments()) > 0) throw new ApiError(403, 'An administrator account already exists. Please sign in');
  const data = authSchema.register.parse(req.body);
  const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 12), role: 'admin' });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = authSchema.login.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(401, 'Incorrect email or password');
  res.json({ token: sign(user), user: publicUser(user) });
});

exports.me = (req, res) => res.json({ user: publicUser(req.user) });
