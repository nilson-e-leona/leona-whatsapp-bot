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
  try {
    const data = req.body;

    // Compatível com estrutura Z-API
    const mensagem = data?.messages?.[0]?.text?.body;
    const numero = data?.messages?.[0]?.from;

    console.log("Mensagem recebida:", mensagem);
    console.log("Número do cliente:", numero);

    if (!mensagem || !numero) {
      console.log("Dados inválidos");
      return res.sendStatus(400);
    }

    const prompt = `Responda como uma vendedora experiente chamada Leona. Seja simpática, direta e boa de venda. O cliente disse: "${mensagem}"`;

    const respostaIA = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const resposta = respostaIA.data.choices[0].message.content;
    console.log("Resposta da IA:", resposta);

    await new Promise((r) => setTimeout(r, calcularDelay(resposta)));

    await axios.post(
      `${ZAPI_URL}`,
      {
        phone: numero,
        message: resposta,
      },
      {
        headers: {
          Authorization: `Bearer ${ZAPI_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
