const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();

app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ZAPI_URL = process.env.ZAPI_URL;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

function calcularDelay(texto) {
  const tamanho = texto.length;
  if (tamanho <= 50) return 2000;
  if (tamanho <= 150) return 4000;
  return 6000;
}

app.post("/webhook", async (req, res) => {
  console.log("🕵️ Dados recebidos do webhook:", JSON.stringify(req.body, null, 2));

  let message;
  let phone;

  // Exemplo de parsing genérico. Ajuste conforme o payload exato da Z-API.
  if (req.body?.message) {
    message = req.body.message?.text || req.body.message?.body || req.body.message;
    phone = req.body.phone;
  } else if (req.body?.body?.text) {
    message = req.body.body.text;
    phone = req.body.phone;
  } else if (req.body?.body?.mensagem) {
    message = req.body.body.mensagem;
    phone = req.body.phone;
  } else if (req.body?.mensagem) {
    message = req.body.mensagem;
    phone = req.body.phone;
  }

  console.log("👉 Mensagem recebida:", message);
  console.log("👉 Número do cliente:", phone);

  if (!message || !phone) {
    console.log("❌ Dados inválidos");
    return res.status(400).send("Dados inválidos");
  }

  try {
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Você é Leona, vendedora da loja de gesso e drywall. Atenda com simpatia, naturalidade e inteligência. Seu objetivo é entender o perfil do cliente (nome, cidade ou CEP, se precisa de material ou serviço, e se é arquiteto, engenheiro ou cliente final), mas de forma sutil, como quem está puxando papo. Nunca diga que é uma IA."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const reply = openaiResponse.data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.log("❌ A resposta da IA veio vazia ou com erro.");
      return res.status(500).send("Erro ao gerar resposta");
    }

    const delay = calcularDelay(reply);

    console.log("🗨️ Resposta da IA:", reply);

    setTimeout(async () => {
      await axios.post(`${ZAPI_URL}/sendMessage?token=${ZAPI_TOKEN}`, {
        phone: phone,
        body: reply
      });
      console.log("✅ Mensagem enviada ao cliente.");
    }, delay);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro ao processar:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
