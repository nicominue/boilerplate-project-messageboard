require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const apiRoutes = require('./routes/api');

const app = express();

const helmet = require("helmet");

app.use(
  helmet({
    frameguard: { action: 'sameorigin' },
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: 'same-origin' },
  })
);


// CORS
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api', apiRoutes);

// DB
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
.catch(err => console.error('DB connection error', err));

module.exports = app;
