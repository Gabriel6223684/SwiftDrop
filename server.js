import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rota Principal (HTML)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SwiftDrop - Download</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            body {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #f8fafc;
                display: flex;
                flex-direction: column; /* Ajustado para empilhar os containers verticalmente */
                gap: 20px;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                text-align: center;
                padding: 20px;
            }

            .container {
                background: rgba(30, 41, 59, 0.7);
                padding: 3rem 2rem;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-width: 400px;
                width: 90%;
            }

            h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                background: linear-gradient(to right, #38bdf8, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            p {
                color: #94a3b8;
                margin-bottom: 2rem;
                font-size: 1rem;
            }

            .btn-download {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: #ffffff;
                border: none;
                padding: 0.75rem 2rem;
                font-size: 1.1rem;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-decoration: none;
                box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            }

            .btn-download:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
            }

            .btn-download:active {
                transform: translateY(1px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>SwiftDrop (Mobile)</h1>
            <p>Baixe a versão mais recente do nosso aplicativo para Android.</p>
            <a href="/download/mobile/app-debug.apk" class="btn-download">Baixar APK</a>
        </div>
    </body>
    </html>
  `);
});

// Rota de Download do APK (Android)
app.get("/download/mobile/app-debug.apk", (req, res) => {
  const filePath = path.join(
    __dirname,
    "android/app/build/outputs/apk/debug/app-release-unsigned.apk",
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("APK não encontrado.");
  }

  res.download(filePath, "SwiftDrop.apk");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
