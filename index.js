const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Teste básico da API
app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

// Webhook que recebe mensagens da Z-API
app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  const mensagem = req.body.message?.text?.body || '';
  const numero = req.body.message?.from;

  // Verifica se há número e mensagem
  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);

    // Mensagem de resposta da Leona
    const resposta = 'Olá! 👋 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    try {
      // Envia a resposta usando a API da Z-API
      await axios.post(process.env.ZAPI_URL, {
        phone: numero,
        message: resposta,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          token: process.env.ZAPI_KEY,
        },
      });

      console.log('✅ Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar a resposta:', error.message);
    }
  }

  // Sempre responde 200 para a Z-API não tentar reenviar
  res.sendStatus(200);
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
