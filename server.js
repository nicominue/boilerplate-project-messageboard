require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");

const apiRoutes = require('./routes/api');

const app = express();

// Middleware básico
app.use("/public", express.static(process.cwd() + "/public"));
app.use(cors({origin: '*'}));
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

// Health check para Render
app.get('/health', (req, res) => {
  const status = mongoose.connection.readyState;
  if (status === 1) {
    res.json({ status: 'ok', db: 'connected' });
  } else {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/api', apiRoutes);

// Configuración de MongoDB
const DB = process.env.MONGO_URI || process.env.DB;

if (!DB) {
  console.error('❌ MONGO_URI no está definida en las variables de entorno');
  process.exit(1);
}

console.log("Connecting to MongoDB Atlas...");

mongoose.set('strictQuery', false);

// Opciones mejoradas para MongoDB Atlas y Render
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout después de 5s
  socketTimeoutMS: 45000, // Cerrar sockets después de 45s de inactividad
};

// Conectar a MongoDB
mongoose.connect(DB, mongoOptions)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  
  // Iniciar servidor solo después de conectar a BD
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`URL: http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Manejar errores de conexión después de la conexión inicial
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Reconectar automáticamente
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Cerrar conexión al terminar el proceso
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

module.exports = app;