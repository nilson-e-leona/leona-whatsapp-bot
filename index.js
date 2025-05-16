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
  let message;
  let phone = req.body.phone;

  // Verifica se a mensagem está dentro de um campo "body" ou "message"
  if (typeof req.body === "object") {
    if (typeof req.body.message === "string") {
      message = req.body.message;
    } else if (typeof req.body.body === "string") {
      message = req.body.body;
    } else if (typeof req.body.body === "object" && req.body.body.mensagem) {
      message = req.body.body.mensagem;
    } else if (typeof req.body.mensagem === "string") {
      message = req.body.mensagem;
    } else if (req.body.body && req.body.body.text) {
      message = req.body.body.text;
    }
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

    console.log("🧠 Resposta completa da OpenAI:", openaiResponse.data);

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
