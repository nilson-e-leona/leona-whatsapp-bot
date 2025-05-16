const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Leona bot está online!');
});

app.post('/', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  // CAPTURA CORRETA com base no seu log real
  const mensagem = req.body.text?.message || '';
  const numero = req.body.phone || '';

  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);

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
            'Content-Type': 'application/json'
          },
          params: {
            token: process.env.ZAPI_KEY
          }
        }
      );

      console.log('✅ Resposta enviada para:', numero);
    } catch (erro) {
      console.error('❌ Erro ao enviar resposta:', erro.message);
    }
  } else {
    console.warn('⚠️ Mensagem ou número inválido (vazios)');
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('🚀 Servidor Leona rodando na porta 3000');
});
