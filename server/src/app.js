const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1); // Render/Vercel sit behind a proxy
app.use(helmet());
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({ origin: origins, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('tiny'));
app.get('/', (_req, res) => res.json({ name: 'Showroom Expense Tracker API', status: 'running' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
