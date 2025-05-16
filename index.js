const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota para checar se o bot está online
app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

// Rota correta para receber as mensagens da Z-API
app.post('/webhook', async (req, res) => {
  const mensagem = req.body.message?.text?.body || '';
  const numero = req.body.message?.from;

  // Verifica se a mensagem e o número existem
  if (mensagem && numero) {
    console.log('📩 Mensagem recebida:', mensagem);

    // Mensagem de resposta da Leona
    const resposta = 'Olá! 👋 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    try {
      // Envia resposta pela API da Z-API
      await axios.post(
        process.env.ZAPI_URL,
        {
          phone: numero,
          message: resposta
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            token: process.env.ZAPI_KEY
          }
        }
      );
      console.log('✅ Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar a resposta:', error.message);
    }
  }

  res.sendStatus(200);
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
