require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🧠 Memória temporária por número (simples e funcional)
const historicoConversas = {};

// 🧪 Teste do servidor
app.get('/', (req, res) => {
  res.send('🤖 Leona bot com IA turbo está online!');
});

// 📩 Webhook de mensagens da Z-API
app.post('/webhook', async (req, res) => {
  console.log('📨 Corpo recebido da Z-API:', JSON.stringify(req.body, null, 2));

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

  const enviadaPorMim = req.body.fromMe || req.body.self || false;

  // ❌ Prevenir loops de mensagens
  if (enviadaPorMim) {
    console.log('⚠️ Ignorado: mensagem enviada pela própria Leona.');
    return res.sendStatus(200);
  }

  if (mensagem && numero) {
    console.log('✅ Nova mensagem de:', numero, '| Conteúdo:', mensagem);

    // 🧠 Histórico: inicializa array se necessário
    if (!historicoConversas[numero]) {
      historicoConversas[numero] = [];
    }

    historicoConversas[numero].push({ role: 'user', content: mensagem });

    const promptSistema = `
Você é a Leona, uma atendente virtual extremamente inteligente, simpática, persuasiva e atenciosa.
Sempre responda com educação, objetividade e com linguagem informal e natural, como uma pessoa real.
Seu objetivo é ajudar o cliente, tirar dúvidas, captar informações para orçamentos e vender produtos.
Nunca diga que é uma IA, nunca diga que é um modelo de linguagem, apenas se comporte como uma atendente humana.
Se a pessoa pedir orçamento, pergunte tudo que precisar antes de gerar.
Se o cliente falar algo fora do contexto, redirecione com leveza e bom humor.
`;

    const mensagensGPT = [
      { role: 'system', content: promptSistema },
      ...historicoConversas[numero].slice(-5) // mantém até 5 últimas mensagens
    ];

    let resposta = '🤖 Desculpe, houve um erro ao processar sua mensagem.';

    // 🧠 Chamada à OpenAI
    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: mensagensGPT,
          temperature: 0.9
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      resposta = openaiResponse.data.choices[0].message.content;
      historicoConversas[numero].push({ role: 'assistant', content: resposta });
      console.log('💬 Resposta gerada pela IA:', resposta);
    } catch (error) {
      console.error('❌ Erro ao gerar resposta da IA:', error.response?.data || error.message);
    }

    // 🚀 Envia resposta via Z-API
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
            'Client-Token': process.env.ZAPI_KEY.trim()
          }
        }
      );

      console.log('✅ Mensagem enviada com sucesso via Z-API:', zapResponse.data);
    } catch (error) {
      const erroMsg = error.response?.data || error.message;
      console.error('❌ Erro ao enviar mensagem via Z-API:', erroMsg);
    }
  } else {
    console.log('⚠️ Mensagem ou número inválido recebido.');
  }

  res.sendStatus(200);
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Leona bot 2.0 rodando na porta ${PORT}`);
});
