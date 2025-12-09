require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');

const apiRoutes = require('./routes/api');

const app = express();


app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: "same-origin" }));


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
