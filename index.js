const express = require('express');
const mysql = require('mysql2/promise'); // Usar la versión basada en promesas
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config(); // Cargar variables de entorno

const app = express();
const port = process.env.PORT || 3366;

// Crear la conexión a la base de datos usando promesas
let db;

const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    console.log('Conexión a la base de datos exitosa.');
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1); // Termina la ejecución si no se puede conectar
  }
};

// Generar el token
const userPayload = {
  name: process.env.TOKEN_NAME,
  status: process.env.TOKEN_STATUS,
};

const token = jwt.sign(userPayload, process.env.TOKEN_SECRET);

// Middleware para validar el Bearer Token
const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraer el token

  if (!token) return res.status(403).send('Token es requerido');

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Token no válido');
    req.user = decoded; // Guardar la información del usuario decodificada
    next();
  });
};

// Ruta para obtener los proyectos (protección con Bearer Token y API Key en la URL)
app.get('/projects', validateToken, async (req, res) => {
  const apiKey = req.query.api_key; // Obtener la api_key desde la consulta

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('API Key no válida'); // Denegar acceso si no es válida
  }

  try {
    const [results] = await db.query('SELECT * FROM projects');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener proyectos:', err);
    res.status(500).send('Error al obtener proyectos');
  }
});

// Iniciar el servidor y conectar a la base de datos
app.listen(port, async () => {
  await connectDB(); // Conectar a la base de datos antes de iniciar el servidor
  console.log(`Servidor ejecutándose en el puerto ${port}`);
});
