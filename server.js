require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');

const apiRoutes = require('./routes/api');

const app = express();

// Security headers (requerimientos FCC)
// 1. Only allow your site to be loaded in an iFrame on your own pages.
app.use(helmet.frameguard({ action: 'sameorigin' })); // X-Frame-Options: SAMEORIGIN

// 2. Do not allow DNS prefetching.
app.use((req, res, next) => {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
});

// 3. Only allow your site to send the referrer for your own pages.
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// Otros headers de seguridad recomendados
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

// CORS solo si lo necesitas (lo dejamos general)
app.use(cors());

// Body parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api', apiRoutes);

// Connect to DB (use env DB)
const DB = process.env.MONGO_URI;
console.log("DB STRING:", process.env.DB || process.env.MONGO_URI);

mongoose.set('strictQuery', false);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to DB');

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})
.catch(err => {
  console.error('DB connection error', err);
});

module.exports = app; // export for tests
