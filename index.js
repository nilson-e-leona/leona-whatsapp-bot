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
  const message = req.body.message?.text?.body;
  const phone = req.body.contacts?.[0]?.wa_id;

  if (!message || !phone) {
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
              "Você é Leona, vendedora da loja de gesso e drywall. Atenda com simpatia, naturalidade e inteligência. Seu objetivo é entender o perfil do cliente (nome, cidade ou CEP, se precisa de material ou serviço, e se é arquiteto, engenheiro ou cliente final), mas de forma sutil, como quem está puxando papo, sem parecer robô. Nunca diga que é uma IA. Responda como uma vendedora humana, rápida e experiente."
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

    const reply = openaiResponse.data.choices[0].message.content;
    const delay = calcularDelay(reply);

    // Aguarda o delay antes de enviar a resposta
    setTimeout(async () => {
      await axios.post(`${ZAPI_URL}/sendMessage?token=${ZAPI_TOKEN}`, {
        phone: phone,
        body: reply
      });
    }, delay);

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
