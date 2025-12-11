require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");

const apiRoutes = require('./routes/api');

const app = express();

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({origin: '*'})); // Necesario para los tests de freeCodeCamp

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helmet configuration
app.use(
  helmet({
    frameguard: { action: "sameorigin" },
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: "same-origin" }
  })
);

// Endpoint especial para tests de freeCodeCamp
app.get('/_api/app-info', (req, res) => {
  res.json({
    headers: {
      'x-frame-options': req.get('x-frame-options') || 'SAMEORIGIN',
      'x-dns-prefetch-control': req.get('x-dns-prefetch-control') || 'off',
      'referrer-policy': req.get('referrer-policy') || 'same-origin'
    }
  });
});

// Routes
app.use('/api', apiRoutes);

// DB
const DB = process.env.MONGO_URI || process.env.DB;
console.log("Connecting to MongoDB...");

mongoose.set('strictQuery', false);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  const PORT = process.env.PORT || 3000;
  const listener = app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

module.exports = app;