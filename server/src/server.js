// Use public DNS servers so the mongodb+srv:// lookup works even when the
// default (router/ISP) DNS refuses SRV queries. Set USE_CUSTOM_DNS=false in .env to turn this off.
if (process.env.USE_CUSTOM_DNS !== 'false') {
  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
}
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const seedDefaults = require('./services/seedDefaults');

const PORT = process.env.PORT || 5000;

(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('JWT_SECRET must be set (at least 16 characters). See .env.example');
    process.exit(1);
  }
  await connectDB();
  await seedDefaults(); // default categories + settings document (safe to run on every start)
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
})().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});