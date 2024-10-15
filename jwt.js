const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Cargar variables de entorno

// Define un nombre y un estado
const userPayload = {
  name: process.env.TOKEN_NAME,  // Cambia esto al nombre deseado
  status: process.env.STATUS     // Cambia esto al estado deseado
};

// Genera el token usando el payload
const token = jwt.sign(userPayload, process.env.TOKEN_SECRET);  // Asegúrate de que TOKEN_SECRET esté en tu .env

// Imprime el token
console.log(token);
