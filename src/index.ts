import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Hola mundo</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 400px; margin: 80px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px; text-align: center; }
          h1 { color: #2d7be5; }
          p { font-size: 1.2em; margin: 12px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hola mundo</h1>
          <p><strong>Nombre:</strong> Albert Flores</p>
          <p><strong>Cédula:</strong> 31073300</p>
          <p><strong>Sección:</strong> 4</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});