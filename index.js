// index.js - Leona IA Vendedora Ativada 🚀

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

function calcularAtraso(texto) {
  const tamanho = texto.length;
  if (tamanho < 50) return 2000;
  if (tamanho < 150) return 4000;
  return 6000;
}

app.post("/webhook", async (req, res) => {
  try {
    const mensagem = req.body.texto?.mensagem || "";
    const numero = req.body.telefone || "";

    console.log("📨 Mensagem recebida:", mensagem);
    console.log("📱 Número do cliente:", numero);

    if (!mensagem || !numero) {
      console.log("❌ Dados inválidos");
      return res.sendStatus(400);
    }

    // Chamada pra OpenAI
    const resposta = await axios.post(
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

    const respostaIA = resposta.data.choices[0].message.content;
    console.log("🤖 Resposta da IA:", respostaIA);

    // Delay opcional
    await new Promise(resolve => setTimeout(resolve, calcularAtraso(respostaIA)));

    // Envio via Z-API
    await axios.post(
      ZAPI_URL,
      {
        phone: numero.replace(/\D/g, ""), // Remove símbolos
        message: respostaIA
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Token": ZAPI_TOKEN
        }
      }
    );

    res.sendStatus(200);
  } catch (erro) {
    console.error("💥 Erro ao processar:", erro?.response?.data || erro.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
