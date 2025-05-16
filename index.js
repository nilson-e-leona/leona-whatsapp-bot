const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();

app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ZAPI_URL = process.env.ZAPI_URL;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

app.post("/webhook", async (req, res) => {
  const message = req.body.message?.text?.body;
  const phone = req.body.contacts?.[0]?.wa_id;

  if (!message || !phone) {
    return res.status(400).send("Dados inválidos");
  }

  try {
    // Requisição para OpenAI
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Você é Leona, uma vendedora especialista da loja de gesso e drywall. Atenda com simpatia, rapidez e foco em fechar vendas. Responda como se fosse uma humana experiente no ramo, tirando dúvidas, ajudando na escolha dos materiais, e oferecendo orçamentos."
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

    // Envia a resposta pelo WhatsApp via Z-API
    await axios.post(
      `${ZAPI_URL}/sendMessage?token=${ZAPI_TOKEN}`,
      {
        phone: phone,
        body: reply
      }
    );

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
