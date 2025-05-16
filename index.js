const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

// Rota que recebe mensagens da Z-API
app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  const mensagem = req.body.text?.message || '';
  const numero = req.body.phone || '';

  if (!mensagem || !numero) {
    console.log('⚠️ Mensagem ou número inválido');
    return res.sendStatus(400);
  }

  console.log('✅ Mensagem recebida:', mensagem);
  console.log('📞 Número do remetente:', numero);

  const resposta = 'Olá! 🤖 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

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

  res.sendStatus(200);
});

// Inicializa servidor
app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
