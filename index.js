const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();

app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ZAPI_URL = process.env.ZAPI_URL;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const PORT = process.env.PORT || 3000;

function calcularDelay(texto) {
  const tamanho = texto.length;
  if (tamanho < 50) return 2000;
  if (tamanho < 150) return 4000;
  return 6000;
}

app.post("/webhook", async (req, res) => {
  try {
    const mensagem = req.body?.mensagem;
    const numero = req.body?.numero;

    console.log("Mensagem recebida:", mensagem);
    console.log("Número do cliente:", numero);

    if (!mensagem || !numero) {
      console.log("Dados inválidos");
      return res.sendStatus(400);
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é a Leona, uma vendedora especializada em gesso e drywall. Atenda com simpatia, tire dúvidas e sempre colete as seguintes informações do cliente: nome, se é engenheiro/arquiteto ou cliente final, se quer apenas o material ou também o serviço, e o endereço ou CEP. Nunca forneça preço sem antes gerar valor."
          },
          {
            role: "user",
            content: mensagem
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const resposta = response.data.choices[0].message.content;
    const delay = calcularDelay(resposta);

    setTimeout(async () => {
      await axios.post(
        `${ZAPI_URL}/send-text`,
        {
          phone: numero,
          message: resposta
        },
        {
          headers: {
            Authorization: `Bearer ${ZAPI_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }, delay);

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao processar a mensagem:", error?.response?.data || error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
