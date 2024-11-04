const express = require('express');
const mysql = require('mysql2/promise'); // Usar la versión basada en promesas
const dotenv = require('dotenv');

dotenv.config(); // Cargar variables de entorno

const app = express();
const port = process.env.PORT || 3366;

// Crear un pool de conexiones
let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10, // Límite de conexiones simultáneas
      queueLimit: 0 // Sin límite en la cola de conexiones
    });
    console.log('Conexión al pool de base de datos exitosa.');
  } catch (err) {
    console.error('Error al conectar al pool de base de datos:', err);
    process.exit(1); // Termina la ejecución si no se puede conectar
  }
};


console.log('Mysql_host:',process.env.MYSQL_HOST);
// console.log('Mysql_user:',process.env.MYSQL_USER);
// console.log('Mysql_root_password:',process.env.MYSQL_ROOT_PASSWORD);
console.log('Mysql_database:',process.env.MYSQL_DATABASE);
// console.log('Api_key:',process.env.API_KEY);
console.log('Port:',process.env.PORT);
console.log('Database:',process.env.MYSQL_DATABASE);



// Middleware para validar la API Key
const validateApiKey = (req, res, next) => {
  const apiKey = req.query.api_key; // Obtener la api_key desde la consulta

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('API Key no válida'); // Denegar acceso si no es válida
  }
  next(); // Si la API Key es válida, continua
};

// Ruta para obtener los proyectos (protección con API Key en la URL)
app.get('/projects', validateApiKey, async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM projects');
    res.json(results);
  } catch (err) {
    console.error('Error al obtener proyectos:', err);
    res.status(500).send('Error al obtener proyectos error:'+err);
  }
});

// Nueva ruta para buscar universidades usando la sigla como parámetro de consulta
app.get('/universidad', validateApiKey, async (req, res) => {
  const { sigla } = req.query; // Obtener la sigla desde la consulta
  if (!sigla) {
    return res.status(400).send('Se requiere la sigla de la universidad'); // Validar que se haya proporcionado la sigla
  }

  try {
    const [results] = await pool.query(
      'SELECT * FROM universidad WHERE LOWER(siglas) = LOWER(?)',
      [sigla] // Usar la sigla como variable en la consulta
    );
    if (results.length === 0) {
      return res.status(404).send('Universidad no encontrada'); // Manejar caso en que no se encuentre la universidad
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(results);
  } catch (err) {
    console.error('Error al buscar universidades:', err);
    res.status(500).send('Error al buscar universidades: ' + err);
  }
});


// Iniciar el servidor y conectar al pool de conexiones
app.listen(port, async () => {
  await connectDB(); // Conectar al pool de la base de datos antes de iniciar el servidor
  console.log(`Servidor ejecutándose en el puerto ${port}`);
});



/*

//Sistema con api_key en query y token en header

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

*/ 