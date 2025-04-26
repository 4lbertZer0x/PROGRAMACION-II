import express, { Request, Response } from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del motor de vistas EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "../")));

// Ruta principal
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});