// index.js - Modo Diagnóstico da Leona 🤖

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const ABRIR_CHAVE_API_AI = process.env.OPENAI_API_KEY;
const URL_ZAPI = process.env.ZAPI_URL;
const TOKEN_DO_CLIENTE = process.env.ZAPI_TOKEN;
const PORTA = process.env.PORT || 3000;

function calcularAtraso(texto) {
  const tamanho = texto.length;
  if (tamanho < 50) return 2000;
  if (tamanho < 150) return 4000;
  return 6000;
}

app.post("/webhook", async (req, res) => {
  // 👁️ Loga tudo o que chega
  console.log("🔥 PAYLOAD RECEBIDO DA Z-API:");
  console.log(JSON.stringify(req.body, null, 2));

  // Envia só um "ok" para a Z-API não acusar erro
  res.sendStatus(200);
});

app.listen(PORTA, () => {
  console.log(`🟢 Servidor rodando na porta ${PORTA}`);
});
