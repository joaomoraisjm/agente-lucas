// Servidor Lucas Krausche - Otimizado para menor custo
// Node.js + Express
// Deploy: Railway, Render ou Heroku

const express = require('express');
const app = express();
app.use(express.json());

// ─────────────────────────────────────────
// SYSTEM PROMPT - Cole o seu aqui
// O cache_control transforma esse bloco em cache permanente.
// Depois da primeira chamada, ele custa apenas 10% do valor normal.
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos masculinos.

Voce NAO aprofunda clinicamente neste canal. Voce orienta, interpreta e direciona com clareza, firmeza e calor humano.

SEU ESTILO
Mensagens curtas, ritmo de audio escrito no WhatsApp, no maximo 8 linhas.
Tom humano, direto e acolhedor.
No maximo 1 emoji por mensagem, so quando for muito natural.
Varia o inicio: as vezes "Entendi.", as vezes "Olha,", as vezes vai direto.
Nunca repete a mesma estrutura duas vezes seguidas.
NUNCA usa travessao. NUNCA usa bullet points. NUNCA usa listas.
Escreve como uma pessoa falando, nao como documento.
Nunca parece robo, nunca parece terapeuta de livro.

ESTRUTURA INTERNA DE TODA RESPOSTA
Primeiro faz um diagnostico leve em 1 ou 2 linhas.
Depois explica de forma simples o que esta acontecendo.
Depois da uma orientacao pratica e aplicavel agora.
Por ultimo faz uma pergunta leve para o proximo passo.
Nunca entregue tudo de uma vez. Sempre ofereca um caminho.

METODO LUCAS KRAUSCHE
Fases pos-termino feminino em ordem: Alivio, Racionalizacao, Curiosidade, Saudade, Arrependimento, Abertura.
Contato zero nao e manipulacao, e progresso psicologico para os dois lados.
A mulher termina quando para de se sentir escolhida, nao por falta de amor.
Correr atras ativa memorias negativas, nao o amor.
Silencio estrategico cria ausencia, ausencia cria valor.
O homem que precisa de validacao constante perde espaco emocional.

Nunca fazer: enviar textao, cobrar, pressionar, dar presente como compensacao, se justificar, pedir para voltar.

Como quebrar o contato zero: story com leveza, assunto aleatorio, memoria afetiva positiva, tom de conhecendo ela de novo.

Padroes de apego:
Ansioso: carencia, validacao constante, medo de abandono, corre atras.
Evitativo: foge do compromisso, se afasta quando a relacao fica intensa.
Ansioso controlador na mulher: ciumeira, cria historias na cabeca, precisa de previsibilidade.

Quando encaminhar para mentoria: casamento com filhos, traicao confirmada, trauma profundo ou padrao repetido ha mais de 10 anos, pensamentos de autolesao.

Script para encaminhar: "Aqui pelo WhatsApp eu consigo te ajudar a nao errar agora. Se quiser trabalhar isso de forma mais profunda, posso pedir para um dos administradores te explicar a mentoria."`;

// ─────────────────────────────────────────
// SESSÕES por usuário
// Em produção, substitua por Redis ou banco de dados
// para não perder histórico quando o servidor reiniciar
// ─────────────────────────────────────────
const sessions = {};

// Limite de mensagens no histórico por usuário
// 10 pares (20 mensagens) = contexto suficiente sem encarecer
const MAX_HISTORY = 20;

app.post('/webhook', async (req, res) => {
  const { subscriber_id, last_input_text, image_url } = req.body;
  const userText = (last_input_text || '').trim();

  if (!userText && !image_url) {
    return res.json({
      messages: [{ type: 'text', text: 'Pode me contar o que ta acontecendo.' }]
    });
  }

  // Monta o conteúdo da mensagem do usuário
  // Suporta texto puro ou texto + imagem
  let userContent;

  if (image_url) {
    // Caso o aluno mande uma imagem (print de conversa, por exemplo)
    userContent = [
      {
        type: 'image',
        source: { type: 'url', url: image_url }
      },
      {
        type: 'text',
        text: userText || 'O que voce acha disso?'
      }
    ];
  } else {
    userContent = userText;
  }

  // Inicializa ou recupera histórico do usuário
  if (!sessions[subscriber_id]) sessions[subscriber_id] = [];
  sessions[subscriber_id].push({ role: 'user', content: userContent });

  // Mantém histórico enxuto para economizar tokens
  if (sessions[subscriber_id].length > MAX_HISTORY) {
    sessions[subscriber_id] = sessions[subscriber_id].slice(-MAX_HISTORY);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31' // ATIVA o prompt caching
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Haiku 4.5 = mais barato
        max_tokens: 350, // Respostas curtas = menos custo de saída
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT_TEXT,
            cache_control: { type: 'ephemeral' } // CACHEIA o system prompt
            // Após a 1ª chamada, esse bloco custa apenas 10% do valor normal
          }
        ],
        messages: sessions[subscriber_id]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro da API:', data.error);
      return res.json({
        messages: [{ type: 'text', text: 'So um segundo, pode repetir?' }]
      });
    }

    const reply = data.content?.[0]?.text || 'Pode repetir isso pra mim?';

    // Salva resposta no histórico
    sessions[subscriber_id].push({ role: 'assistant', content: reply });

    // Log de uso de cache para acompanhar economia (opcional)
    if (data.usage) {
      const usage = data.usage;
      console.log(`[${subscriber_id}] tokens: input=${usage.input_tokens} | cache_hit=${usage.cache_read_input_tokens || 0} | output=${usage.output_tokens}`);
    }

    // Resposta no formato Manychat
    res.json({
      messages: [{ type: 'text', text: reply }]
    });

  } catch (err) {
    console.error('Erro no servidor:', err);
    res.json({
      messages: [{ type: 'text', text: 'So um segundo, pode repetir?' }]
    });
  }
});

// Health check para o Railway/Render saber que o servidor está vivo
app.get('/', (req, res) => res.send('Agente Lucas rodando!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));


// ═══════════════════════════════════════════════════════
// CONFIGURAÇÃO NO MANYCHAT (passo a passo)
// ═══════════════════════════════════════════════════════
//
// PARA MENSAGENS DE TEXTO:
// 1. Crie um Flow para mensagens recebidas no WhatsApp
// 2. Adicione ação "External Request" (POST)
// 3. URL: https://seu-servidor.railway.app/webhook
// 4. Body:
//    {
//      "subscriber_id": "{{user id}}",
//      "last_input_text": "{{last input text}}"
//    }
// 5. Salve a resposta no campo customizado: resposta_lucas
// 6. Adicione mensagem de texto com: {{resposta_lucas}}
// 7. Ative como Default Reply
//
// PARA IMAGENS (quando o aluno manda print de conversa):
// 1. Crie um Flow separado para "Image Received"
// 2. Salve a URL da imagem num campo customizado: ultima_imagem
// 3. No External Request, adicione ao body:
//    {
//      "subscriber_id": "{{user id}}",
//      "last_input_text": "{{last input text}}",
//      "image_url": "{{ultima_imagem}}"
//    }
//
// ═══════════════════════════════════════════════════════
// DEPLOY NO RAILWAY (mais fácil e gratuito para começar)
// ═══════════════════════════════════════════════════════
//
// 1. Acesse railway.app e crie conta com GitHub
// 2. Novo projeto > Deploy from GitHub repo
// 3. Selecione o repositório com esse arquivo
// 4. Em "Variables", adicione:
//    ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxx
// 5. Railway gera uma URL automática tipo:
//    https://seu-app.railway.app
// 6. Use essa URL no Manychat
// ═══════════════════════════════════════════════════════
