const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const iconv = require('iconv-lite');

dotenv.config();

const app = express();
const port = process.env.PORT || 3366;

let pool;

const connectDB = async () => {
  try {
    console.log('Intentando conectar con la base de datos...');
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('Conexión al pool de base de datos exitosa.');
  } catch (err) {
    console.error('Error al conectar al pool de base de datos:', err);
    process.exit(1); // Termina la ejecución si no se puede conectar
  }
};

console.log('Mysql_host:', process.env.MYSQL_HOST);
console.log('Mysql_database:', process.env.MYSQL_DATABASE);
console.log('Port:', process.env.PORT);
console.log('Mysql_port:', process.env.MYSQL_PORT);

// Middleware para validar la API Key
const validateApiKey = (req, res, next) => {
  const apiKey = req.query.api_key;

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('API Key no válida');
  }
  next();
};

// Ruta para obtener los proyectos
app.get('/projects', validateApiKey, async (req, res) => {
  console.log('Solicitud recibida para obtener proyectos...');
  try {
    const [results] = await pool.query('SELECT * FROM projects');
    console.log('Datos de proyectos obtenidos:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener proyectos:', err);
    res.status(500).send('Error al obtener proyectos: ' + err.message);
  }
});

// Ruta para buscar universidades por sigla
app.get('/universidad', validateApiKey, async (req, res) => {
  const { sigla } = req.query;
  if (!sigla) {
    return res.status(400).send('Se requiere la sigla de la universidad');
  }

  console.log('Solicitud recibida para buscar universidad con sigla:', sigla);
  try {
    const [results] = await pool.query(
      'SELECT * FROM universidad WHERE LOWER(siglas) = LOWER(?)',
      [sigla]
    );
    if (results.length === 0) {
      console.log(`Universidad con sigla ${sigla} no encontrada.`);
      return res.status(404).send('Universidad no encontrada');
    }
    console.log('Universidad encontrada:', results[0]);
    const jsonResponse = JSON.stringify(results);
    const encodedResponse = iconv.encode(jsonResponse, 'ISO-8859-1');
    res.setHeader('Content-Type', 'application/json; charset=ISO-8859-1');
    res.send(encodedResponse);
  } catch (err) {
    console.error('Error al buscar universidades:', err);
    res.status(500).send('Error al buscar universidades: ' + err.message);
  }
});

// Ruta para obtener procesos según el código de proyecto
app.get('/proyecto', validateApiKey, async (req, res) => {
  const { codigo_proyecto } = req.query;
  if (!codigo_proyecto) {
    return res.status(400).send('Se requiere el código del proyecto');
  }

  console.log('Solicitud recibida para obtener proyecto con código:', codigo_proyecto);
  try {
    const [results] = await pool.query(
      'SELECT * FROM proyecto_condiciones_de_vida WHERE LOWER(codigo_proyecto) = LOWER(?)',
      [codigo_proyecto]
    );
    if (results.length === 0) {
      console.log(`Proyecto con código ${codigo_proyecto} no encontrado.`);
      return res.status(404).send('Proyecto no encontrado');
    }
    console.log('Proyecto encontrado:', results[0]);
    const jsonResponse = JSON.stringify(results);
    const encodedResponse = iconv.encode(jsonResponse, 'ISO-8859-1');
    res.setHeader('Content-Type', 'application/json; charset=ISO-8859-1');
    res.send(encodedResponse);
  } catch (err) {
    console.error('Error al buscar el proyecto:', err);
    res.status(500).send('Error al buscar el proyecto: ' + err.message);
  }
});

// Iniciar el servidor y conectar al pool de conexiones
app.listen(port, async () => {
  await connectDB();
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