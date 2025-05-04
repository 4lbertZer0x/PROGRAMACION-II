import express from "express";
import path from "path";
import router from './routes';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del motor de vistas EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Middleware para procesar datos del formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../")));

// Configurar trust proxy para obtener la IP real del cliente
app.set('trust proxy', true);

// Integrar las rutas
app.use('/', router);

// Ruta principal
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});