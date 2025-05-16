const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('✅ Leona bot está online!');
});

// Rota de webhook
app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  const mensagem = req.body.text?.message || '';
  const numero = req.body.phone || '';

  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);
    console.log('📞 Número do remetente:', numero);

    const resposta = 'Olá! 👋 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    try {
      await axios.post(
        process.env.ZAPI_URL,
        {
          phone: numero,
          message: resposta
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': process.env.ZAPI_KEY
          }
        }
      );
      console.log('✅ Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar uma resposta:', error.response?.data || error.message);
    }
  } else {
    console.log('⚠️ Mensagem ou número inválido');
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('🚀 Servidor Leona rodando na porta 3000');
});
