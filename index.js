const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota padrão
app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

// Rota para receber mensagens da Z-API
app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  const mensagem = req.body.message?.text?.body || '';
  const numero = req.body.message?.from || '';

  // Verifica se tem mensagem e número
  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);

    const resposta = 'Olá! 👋 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    try {
      await axios.post(process.env.ZAPI_URL, {
        phone: numero,
        message: resposta
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          token: process.env.ZAPI_KEY
        }
      });

      console.log('✅ Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar a resposta:', error.message);
    }
  } else {
    console.log('⚠️ Mensagem ou número inválido');
  }

  // Sempre responde 200 para a Z-API
  res.sendStatus(200);
});

// Inicia servidor
app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
