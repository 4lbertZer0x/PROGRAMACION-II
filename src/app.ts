import express from "express";
import path from "path";
import session from 'express-session';
import flash from 'connect-flash';
import passport from './config/passport';
import router from './routes';
import { passUserToViews } from './middleware/auth';
import dotenv from 'dotenv';
import './seedTestData'; // Inicializar datos de prueba automáticamente

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

// Configuración de sesiones con mejoras de seguridad
app.use(session({
    secret: process.env.SESSION_SECRET || 'tu_clave_secreta_muy_segura_cambiala_en_produccion',
    resave: false,
    saveUninitialized: true, // Cambiado a true para OAuth
    rolling: true, // Renovar la sesión en cada petición para implementar expiración por inactividad
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure solo en producción
        httpOnly: true, // Prevenir acceso desde JavaScript del lado cliente
        maxAge: 15 * 60 * 1000, // 15 minutos de inactividad
        sameSite: 'lax' // Permitir redirecciones OAuth (cambiado de 'strict' a 'lax')
    },
    name: 'sessionId' // Cambiar nombre por defecto para mayor seguridad
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para mensajes flash
app.use(flash());

// Middleware para pasar usuario a las vistas
app.use(passUserToViews);

// Integrar las rutas
app.use('/', router);

// Ruta principal
app.get("/", (req, res) => {
  res.render("index", { 
    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
    RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
    title: '3D Print Lab - Servicios de Impresión 3D'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
