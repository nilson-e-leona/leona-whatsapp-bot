require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota de verificação
app.get('/', (req, res) => {
  res.send('🤖 Leona bot com IA está online!');
});

app.post('/webhook', async (req, res) => {
  console.log('📩 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

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

    let resposta = '🤖 Desculpe, houve um erro ao processar sua mensagem.';

    // 🔮 Consulta à IA OpenAI
    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é a Leona, uma atendente virtual simpática e prestativa.'
            },
            { role: 'user', content: mensagem }
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

    // 🚀 Envio para WhatsApp via Z-API com TOKEN FIXO
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
            'Client-Token': '3679A7289C5BB4A2EC5561A3' // TOKEN FIXO DIRETO AQUI
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

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Leona bot rodando na porta ${PORT}`);
});
