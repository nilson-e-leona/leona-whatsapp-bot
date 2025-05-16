require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🌐 Endpoint de verificação
app.get('/', (req, res) => {
  res.send('🤖 Leona bot com IA está online!');
});

// 📩 Webhook que recebe mensagens da Z-API
app.post('/webhook', async (req, res) => {
  console.log('📦 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

  // 🧩 Captura de mensagem e número
  const mensagem =
    req.body.message ||
    req.body.text?.message ||
    req.body.body?.text ||
    '';

  const numero =
    req.body.from ||
    req.body.phone ||
    req.body.telefone ||
    req.body.body?.phone ||
    '';

  if (mensagem && numero) {
    console.log('✅ Mensagem recebida:', mensagem);
    console.log('📞 Número do remetente:', numero);

    let resposta = '🤖 Oi! Como posso te ajudar hoje?';

    // 🧠 Geração de resposta com OpenAI
    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é a Leona, uma atendente virtual simpática, cordial e eficiente.'
            },
            {
              role: 'user',
              content: mensagem
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      resposta = openaiResponse.data.choices[0].message.content;
      console.log('🧠 Resposta gerada pela IA:', resposta);
    } catch (error) {
      console.error('❌ Erro ao chamar a OpenAI:', error.response?.data || error.message);
    }

    // 🚀 Envio da resposta via Z-API com token de segurança da conta
    try {
      console.log('🔐 Enviando com Client-Token:', process.env.ZAPI_KEY);

      const zapResponse = await axios.post(
        process.env.ZAPI_URL,
        {
          phone: numero,
          message: resposta
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': process.env.ZAPI_KEY.trim()
          }
        }
      );

      console.log('✅ Mensagem enviada via Z-API:', zapResponse.data);
    } catch (error) {
      const erroMsg = error.response?.data || error.message;
      console.error('❌ ERRO ao enviar resposta via Z-API:', erroMsg);
    }
  } else {
    console.log('⚠️ Mensagem ou número inválido');
  }

  res.sendStatus(200);
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Leona bot rodando na porta ${PORT}`);
});
