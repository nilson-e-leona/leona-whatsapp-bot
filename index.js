const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ZAPI_URL = process.env.ZAPI_URL;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const PORT = process.env.PORT || 3000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcularAtraso(texto) {
  const len = texto.length;
  if (len < 50) return 1000;
  if (len < 150) return 3000;
  return 5000;
}

app.post("/webhook", async (req, res) => {
  console.log("🔎 PAYLOAD COMPLETO:");
  console.log(JSON.stringify(req.body, null, 2));

  const telefone = req.body.telefone;
  const mensagem = req.body.texto?.mensagem;

  console.log("📱 Número do cliente:", telefone);
  console.log("✉️ Mensagem recebida:", mensagem);

  if (!telefone || !mensagem) {
    console.log("❌ Dados inválidos");
    return res.sendStatus(400);
  }

  try {
    const respostaIA = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é uma vendedora chamada Leona especializada em gesso e drywall. Seja simpática, objetiva e muito persuasiva."
          },
          {
            role: "user",
            content: mensagem
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const respostaTexto = respostaIA.data.choices[0].message.content;
    console.log("🤖 Resposta da IA:", respostaTexto);

    await delay(calcularAtraso(respostaTexto));

    const payloadZAPI = {
      phone: telefone.replace(/\D/g, ""),
      message: respostaTexto
    };

    const headersZAPI = {
      "Content-Type": "application/json",
      "Token": ZAPI_TOKEN
    };

    const envio = await axios.post(ZAPI_URL, payloadZAPI, { headers: headersZAPI });
    console.log("✅ Mensagem enviada via ZAPI:", envio.status);

    return res.sendStatus(200);
  } catch (error) {
    console.error("💥 Erro ao processar ou enviar:", error?.response?.data || error.message);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
