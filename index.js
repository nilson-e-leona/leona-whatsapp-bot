// index.js
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
  if (tamanho < 50) return 2000;
  if (tamanho < 150) return 4000;
  return 6000;
}

app.post("/webhook", async (req, res) => {
  try {
    const mensagem = req.body.mensagem;
    const numero = req.body.numero;

    console.log("Mensagem recebida:", mensagem);
    console.log("Número do cliente:", numero);

    if (!mensagem || !numero) {
      console.log("Dados inválidos");
      return res.sendStatus(400);
    }

    // Gera resposta com IA da OpenAI
    const respostaIA = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é uma vendedora especialista em gesso e drywall, muito simpática, se chama Leona." },
          { role: "user", content: mensagem }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const resposta = respostaIA.data.choices[0].message.content;
    console.log("Resposta gerada:", resposta);

    // Envia a resposta pelo WhatsApp via Z-API
    await axios.post(`${ZAPI_URL}/send-text`, {
      phone: numero,
      message: resposta
    }, {
      headers: {
        Authorization: `Bearer ${ZAPI_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const delay = calcularDelay(resposta);
    setTimeout(() => {
      console.log("Mensagem enviada com sucesso!");
    }, delay);

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
