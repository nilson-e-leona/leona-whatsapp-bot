require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const path = require('path');

app.use(express.json());

const historicoConversas = {};

app.get('/', (req, res) => {
  res.send('🤖 Leona IA multimídia está online!');
});

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));

  const mensagemTexto =
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
  const tipo = req.body.type || req.body.body?.type || '';

  if (enviadaPorMim) {
    console.log('⚠️ Ignorado: mensagem enviada pela Leona.');
    return res.sendStatus(200);
  }

  if (!numero) {
    console.log('⚠️ Número não encontrado.');
    return res.sendStatus(200);
  }

  let resposta = '🤖 Desculpe, não entendi sua mensagem. Pode tentar novamente?';

  // Inicializa histórico
  if (!historicoConversas[numero]) historicoConversas[numero] = [];

  try {
    if (tipo === 'image') {
      // 📷 INTERPRETAÇÃO DE IMAGEM
      const imageUrl = req.body.body?.url;
      if (imageUrl) {
        const visionPayload = {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analise a imagem e me diga o que vê (parece uma lista de materiais).' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 1000
        };

        const visionResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          visionPayload,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        resposta = visionResponse.data.choices[0].message.content;
      }

    } else if (tipo === 'ptt' || tipo === 'audio') {
      // 🎧 TRANSCRIÇÃO DE ÁUDIO
      const audioUrl = req.body.body?.url;
      const localPath = path.join(__dirname, 'audio.ogg');

      const writer = fs.createWriteStream(localPath);
      const audioStream = await new Promise((resolve) =>
        https.get(audioUrl, (stream) => resolve(stream.pipe(writer)))
      );

      await new Promise((resolve) => writer.on('finish', resolve));

      const formData = new FormData();
      formData.append('file', fs.createReadStream(localPath));
      formData.append('model', 'whisper-1');

      const whisperResp = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          }
        }
      );

      const transcricao = whisperResp.data.text;
      resposta = `Você disse: "${transcricao}"`;

      historicoConversas[numero].push({ role: 'user', content: transcricao });
    } else {
      // 💬 MENSAGEM DE TEXTO NORMAL
      historicoConversas[numero].push({ role: 'user', content: mensagemTexto });

      const mensagens = [
        {
          role: 'system',
          content: `
Você é a Leona, uma atendente virtual inteligente, simpática, prestativa e informal.
Seu trabalho é responder dúvidas, gerar orçamentos, identificar materiais, e conversar como uma pessoa real.
Nunca diga que é uma IA. Nunca peça desculpas por limitações técnicas.
Se alguém mandar imagens ou áudio, processe com sabedoria.
`
        },
        ...historicoConversas[numero].slice(-5)
      ];

      const openaiResp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: mensagens,
          temperature: 0.9
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      resposta = openaiResp.data.choices[0].message.content;
      historicoConversas[numero].push({ role: 'assistant', content: resposta });
    }

    // 🚀 Envia resposta pro WhatsApp via Z-API
    const zapResp = await axios.post(
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

    console.log('✅ Mensagem enviada com sucesso:', zapResp.data);
  } catch (err) {
    console.error('❌ ERRO:', err.response?.data || err.message);
  }

  res.sendStatus(200);
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Leona 2.5 (multimídia) rodando na porta ${PORT}`);
});
