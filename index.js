const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

app.post('/', async (req, res) => {
  const mensagem = req.body.message?.text?.body || '';
  const numero = req.body.message?.from;

  if (mensagem && numero) {
    console.log('Mensagem recebida:', mensagem);

    const resposta = 'Olá! 🤖 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    await axios.post(
      process.env.ZAPI_URL,
      {
        phone: numero,
        message: resposta,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          token: process.env.ZAPI_KEY,
        },
      }
    );
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
}); 
