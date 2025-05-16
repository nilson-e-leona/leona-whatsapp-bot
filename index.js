// 🧠 Leona WhatsApp Bot - inicialização
require('dotenv').config(); // ← Carrega variáveis do .env
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('✅ Leona bot está online!');
});

// Rota de Webhook Z-API
app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  const mensagem = req.body.text?.message || '';
  const numero = req.body.from || '';

  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);
    console.log('📞 Número do remetente:', numero);

    const resposta = 'Olá! 🤖 Aqui é a Leona, sua atendente virtual. Como posso te ajudar?';

    try {
      const zapResponse = await axios.post(
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

      console.log('✅ Mensagem enviada com sucesso:', zapResponse.data);
    } catch (error) {
      const erroMsg = error.response?.data || error.message;
      console.error('❌ ERRO ao enviar uma resposta para o número:', numero);
      console.error('🛠️ Detalhes:', erroMsg);
    }
  } else {
    console.log('⚠️ Mensagem ou número inválido');
  }

  res.sendStatus(200);
});

// Servidor escutando na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Leona rodando na porta ${PORT}`);
});
