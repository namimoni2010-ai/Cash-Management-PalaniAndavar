const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, adminOnly } = require('../middleware/auth');
const auth = require('../controllers/authController');
const tx = require('../controllers/transactionController');
const cat = require('../controllers/categoryController');
const settings = require('../controllers/settingsController');
const report = require('../controllers/reportController');

router.get('/health', (_req, res) => res.json({ ok: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
router.get('/auth/status', auth.status);
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);

router.use(protect);

router.route('/transactions').get(tx.list).post(tx.create);
router.route('/transactions/:id').put(tx.update).delete(tx.remove);

router.route('/categories').get(cat.list).post(cat.create);
router.route('/categories/:id').put(cat.update).delete(cat.remove);

router.get('/settings', settings.get);
router.put('/settings', adminOnly, settings.update);

router.get('/summary', report.summary);
router.get('/reports/monthly', report.monthly);
router.get('/reports/yearly', report.yearly);
router.get('/reports/categories', report.categories);
router.get('/reports/daily', report.daily);
router.get('/reports/export', report.export);

module.exports = router;
