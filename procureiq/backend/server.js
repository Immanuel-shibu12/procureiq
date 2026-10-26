// ProcureIQ API entry point
require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const app = express();
app.use(cors()); app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/engine', require('./routes/engine'));
app.use('/api/chat', require('./routes/chat'));
// Health check: reports actual MongoDB connection state
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  const ok = dbState === 1;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', db: ok ? 'connected' : 'disconnected', uptime: process.uptime() });
});
// Central error handler: Mongoose validation errors become HTTP 400
app.use((err, req, res, next) => {
  const status = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : err.status || 500;
  res.status(status).json({ message: err.message });
});
async function start() {
  const port = process.env.PORT || 5000;
  let uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected:', uri.replace(/\/\/[^@]+@/, '//***@'));
  } catch (e) {
    console.warn('Local MongoDB unavailable (' + e.message + '). Starting persistent standalone MongoDB…');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.join(__dirname, '.mongo_data');
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
      const mem = await MongoMemoryServer.create({ instance: { dbPath } });
      uri = mem.getUri();
      await mongoose.connect(uri);
      console.log('Standalone MongoDB running with disk persistence (.mongo_data).');
      // Auto-seed demo data if database is empty
      const { User } = require('./models');
      const count = await User.countDocuments();
      if (count === 0) {
        const doSeed = require('./seed');
        await doSeed();
      } else {
        console.log(`Database contains ${count} existing user(s). Preserving persisted data.`);
      }
    } catch (e2) { console.error('Cannot start any MongoDB:', e2.message); process.exit(1); }
  }
  return app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}
if (require.main === module) {
  start();
}
module.exports = { app, start };

