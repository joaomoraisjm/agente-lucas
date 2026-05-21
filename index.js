// Servidor Lucas Krausche v7.1 - Quebra em blocos automatica
// Arquitetura: Railway + Meta Cloud API
//
// MUDANCAS v7.1:
// - IA gera resposta com paragrafos naturais
// - Servidor quebra em ate 3 blocos
// - Envia cada bloco com delay realista (simula digitacao)
// - Mantem tudo da v7 (buffer 10s, anti-agressividade)

const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────
// CONFIGURACOES META CLOUD API
// ─────────────────────────────────────────
const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_ID;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_API_VERSION = 'v22.0';

// ─────────────────────────────────────────
// SYSTEM PROMPT v7.1 - Otimizado para quebra em blocos
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos masculinos. Voce ja atendeu centenas de homens em momentos de termino, traicao, crises de relacionamento e reconstrucao emocional.

Voce nao e terapeuta de livro, voce e alguem que entende na pratica. Voce fala como um cara que ja viveu isso, que sabe na pele o que ele esta sentindo, e que tem metodo pra ajudar.

═══════════════════════════════════════════
REGRAS ABSOLUTAS DE COMPORTAMENTO (NUNCA VIOLE)
═══════════════════════════════════════════

1. VOCE NUNCA OFENDE, AGRIDE OU DESRESPEITA O USUARIO.
   Mesmo que ele te corrija, mesmo que ele esteja errado no seu entender.
   Voce SEMPRE mantem postura de acolhimento e respeito.

2. VOCE NUNCA BRIGA COM O USUARIO.
   Se discordar, faz com respeito e firmeza, jamais agressividade.

3. SE VOCE NAO ENTENDEU OU NAO RECEBEU ALGO, A FALHA E SUA.
   Assume a falha tecnica e pede gentilmente para reenviar.
   NUNCA culpe o usuario.

4. SE O USUARIO TE CORRIGIR, VOCE RECONHECE E AGRADECE.

5. VOCE NUNCA REPETE O QUE JA DISSE SE O USUARIO RECLAMOU.

═══════════════════════════════════════════
FORMATO DE RESPOSTA (CRITICO)
═══════════════════════════════════════════

Voce SEMPRE estrutura sua resposta em 1 a 3 paragrafos curtos, separados por linha em branco.

Cada paragrafo deve ter de 1 a 3 frases curtas.
Cada paragrafo aborda UM aspecto especifico:
- Paragrafo 1: validacao do sentimento ou reconhecimento da situacao
- Paragrafo 2: diagnostico ou orientacao especifica
- Paragrafo 3: pergunta para avancar OU script pratico (se aplicavel)

Exemplo CORRETO:
"Po, cara, imagino o quanto isso ta pesando.

Olha, o que voce ta sentindo agora e normal. Acontece com todo cara que perde alguem importante.

Me conta: voces se falaram quando pela ultima vez?"

NUNCA use mais de 3 paragrafos.
NUNCA escreva um paragrafo que pareca um textao.
SEMPRE separe paragrafos com linha em branco.

═══════════════════════════════════════════
ESTILO
═══════════════════════════════════════════

Mensagens curtas, ritmo de audio escrito no WhatsApp.
Tom humano, direto, firme e acolhedor.
Max 1 emoji por mensagem, so quando natural.
Expressoes coloquiais brasileiras (po, irmao, mano, cara).
NUNCA travessao, bullet points ou listas numeradas.

VARIACAO de aberturas: "Entendi.", "Olha,", "Calma.", "Po, cara.", "Faz sentido.", "Para um segundo.", "Vou ser direto.", "Saca so." Ou comece direto.

PRINCIPIO 1 - VALIDACAO ANTES DE ORIENTACAO
Em 100% das respostas com emocao, VALIDE o sentimento ANTES de orientar.

PRINCIPIO 2 - AUTORIDADE COM RESPEITO
Conselheiro, nao bajulador. NUNCA agressivo, sarcastico ou debochado.

PRINCIPIO 3 - MENSAGENS LONGAS
Quando texto >300 chars:
1. CONFIRMA recebimento no primeiro paragrafo.
2. ANALISA conteudo no segundo paragrafo.
3. DA orientacao no terceiro paragrafo.
NUNCA peca pra reenviar mensagem ja recebida.

PRINCIPIO 4 - ANTI-REPETICAO
JAMAIS repete resposta ja enviada. Cada mensagem AVANCA a conversa.

═══════════════════════════════════════════
METODO LUCAS KRAUSCHE
═══════════════════════════════════════════

FASES POS-TERMINO: Alivio, Racionalizacao, Curiosidade, Saudade, Arrependimento, Abertura.

PRINCIPIOS:
Contato zero e progresso psicologico.
A mulher termina quando para de se sentir escolhida.
Correr atras ativa memorias negativas.
Silencio cria ausencia, ausencia cria valor.

NUNCA fazer: textao, cobrar, pressionar, dar presente como compensacao, se justificar, pedir para voltar.

PADROES DE APEGO:
Ansioso: carencia, validacao constante, medo de abandono.
Evitativo: foge do compromisso, afasta quando intensifica.

CRISIS: Ideacao suicida, violencia, vicios graves, traicao confirmada, casamento com filhos em crise -> encaminhar para mentoria.
Em ideacao suicida: CVV: 188.`;

// ─────────────────────────────────────────
// MEMORIA EM RAM
// ─────────────────────────────────────────
const sessions = {};
const MAX_HISTORY = 40;
const PRESERVE_INITIAL = 5;

function smartTruncate(history) {
  if (history.length <= MAX_HISTORY) return history;
  return [...history.slice(0, PRESERVE_INITIAL), ...history.slice(-(MAX_HISTORY - PRESERVE_INITIAL))];
}

const messageBuffers = {};
const BUFFER_WAIT_MS = 10000;

const userLogs = {};
function logToUser(phone, entry) {
  if (!userLogs[phone]) userLogs[phone] = [];
  userLogs[phone].push({ ...entry, timestamp: new Date().toISOString() });
  if (userLogs[phone].length > 50) userLogs[phone] = userLogs[phone].slice(-50);
}

// ─────────────────────────────────────────
// QUEBRAR RESPOSTA EM BLOCOS NATURAIS
// ─────────────────────────────────────────
function splitIntoBlocks(text) {
  // Divide por linhas em branco (paragrafos)
  let blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);

  // Se vier sem quebras, tenta dividir por pontuacao + maiuscula
  if (blocks.length === 1 && text.length > 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      blocks = [
        sentences.slice(0, mid).join(' ').trim(),
        sentences.slice(mid).join(' ').trim()
      ].filter(b => b.length > 0);
    }
  }

  // Limita a 3 blocos. Se tiver mais, junta os ultimos
  if (blocks.length > 3) {
    const lastBlocks = blocks.slice(2).join('\n\n');
    blocks = [blocks[0], blocks[1], lastBlocks];
  }

  return blocks;
}

// Calcula delay realista baseado no tamanho do bloco
function calculateTypingDelay(text) {
  // Velocidade media de digitacao: ~40 caracteres por segundo
  // Adiciona 800ms de "pensamento" antes
  const charsPerSecond = 40;
  const thinkingTime = 800;
  const typingTime = (text.length / charsPerSecond) * 1000;

  // Minimo 1.5s, maximo 5s
  const totalDelay = Math.min(Math.max(typingTime + thinkingTime, 1500), 5000);
  return Math.round(totalDelay);
}

// ─────────────────────────────────────────
// FUNCAO: ENVIAR MENSAGEM VIA META
// ─────────────────────────────────────────
async function sendWhatsAppMessage(toPhone, text) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: text }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error(`Erro enviando para ${toPhone}:`, data.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro sendWhatsAppMessage:', err);
    return false;
  }
}

// Envia varios blocos com delay realista entre eles
async function sendBlocksWithDelay(toPhone, blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Calcula e aguarda delay (exceto antes do primeiro bloco)
    if (i > 0) {
      const delay = calculateTypingDelay(block);
      console.log(`[${toPhone}] Aguardando ${delay}ms antes do bloco ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      // Pequeno delay antes do primeiro bloco
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const success = await sendWhatsAppMessage(toPhone, block);
    if (!success) {
      console.error(`[${toPhone}] Falha ao enviar bloco ${i + 1}`);
      break;
    }
    console.log(`[${toPhone}] Bloco ${i + 1}/${blocks.length} enviado (${block.length} chars)`);
  }
}

// ─────────────────────────────────────────
// PROCESSAMENTO
// ─────────────────────────────────────────
async function processBuffered(phone) {
  const buffer = messageBuffers[phone];
  if (!buffer || !buffer.messages.length) return;

  const combinedText = buffer.messages.join('\n\n');
  delete messageBuffers[phone];

  console.log(`[${phone}] Processando ${buffer.messages.length} msg(s). ${combinedText.length} chars.`);

  logToUser(phone, {
    type: 'combined_input',
    parts: buffer.messages.length,
    total_chars: combinedText.length,
    preview: combinedText.substring(0, 300)
  });

  if (!sessions[phone]) sessions[phone] = [];
  sessions[phone].push({ role: 'user', content: combinedText });
  sessions[phone] = smartTruncate(sessions[phone]);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: [{ type: 'text', text: SYSTEM_PROMPT_TEXT, cache_control: { type: 'ephemeral' } }],
        messages: sessions[phone]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro Claude API:', data.error);
      await sendWhatsAppMessage(phone, 'Po, deu um problema tecnico aqui. Pode reenviar?');
      return;
    }

    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar. Pode tentar de novo?';
    sessions[phone].push({ role: 'assistant', content: reply });

    if (data.usage) {
      const u = data.usage;
      const cost = (u.input_tokens / 1000000) * 1 +
                   ((u.cache_read_input_tokens || 0) / 1000000) * 0.10 +
                   (u.output_tokens / 1000000) * 5;
      console.log(`[${phone}] in=${u.input_tokens} out=${u.output_tokens} custo=$${cost.toFixed(5)}`);
    }

    // QUEBRA E ENVIA EM BLOCOS
    const blocks = splitIntoBlocks(reply);
    console.log(`[${phone}] Resposta quebrada em ${blocks.length} bloco(s)`);

    logToUser(phone, {
      type: 'response',
      blocks_count: blocks.length,
      total_chars: reply.length,
      preview: reply.substring(0, 200)
    });

    await sendBlocksWithDelay(phone, blocks);

  } catch (err) {
    console.error('Erro processBuffered:', err);
    await sendWhatsAppMessage(phone, 'So um segundo, pode repetir?');
  }
}

// ─────────────────────────────────────────
// WEBHOOK META - GET (verificacao)
// ─────────────────────────────────────────
app.get('/webhook/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('Webhook META verificado!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ─────────────────────────────────────────
// WEBHOOK META - POST (mensagens)
// ─────────────────────────────────────────
app.post('/webhook/meta', async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value.messages) continue;

        for (const message of value.messages) {
          const fromPhone = message.from;
          let userText = '';

          if (message.type === 'text') {
            userText = message.text?.body || '';
          } else if (message.type === 'audio') {
            userText = '[audio recebido - peca pra reenviar como texto]';
          } else if (message.type === 'image') {
            userText = message.image?.caption || '[imagem recebida]';
          } else {
            userText = `[mensagem ${message.type} recebida]`;
          }

          console.log(`[${fromPhone}] Recebido: ${userText.length} chars`);

          logToUser(fromPhone, {
            type: 'webhook_received',
            text_length: userText.length,
            message_type: message.type,
            preview: userText.substring(0, 300)
          });

          if (!userText.trim()) continue;

          if (!messageBuffers[fromPhone]) {
            messageBuffers[fromPhone] = { messages: [], lastUpdate: Date.now() };
          }
          messageBuffers[fromPhone].messages.push(userText);
          messageBuffers[fromPhone].lastUpdate = Date.now();

          setTimeout(async () => {
            if (!messageBuffers[fromPhone]) return;
            const timeSinceLast = Date.now() - messageBuffers[fromPhone].lastUpdate;
            if (timeSinceLast >= BUFFER_WAIT_MS - 500) {
              await processBuffered(fromPhone);
            }
          }, BUFFER_WAIT_MS);
        }
      }
    }
  } catch (err) {
    console.error('Erro webhook Meta:', err);
  }
});

// ─────────────────────────────────────────
// ENDPOINTS DE DEBUG
// ─────────────────────────────────────────
app.get('/debug/:phone', (req, res) => {
  const phone = req.params.phone;
  res.json({
    phone: phone,
    has_session: !!sessions[phone],
    session_messages: sessions[phone]?.length || 0,
    has_buffer: !!messageBuffers[phone],
    buffer_pending: messageBuffers[phone] || null,
    recent_logs: userLogs[phone] || [],
    session_preview: sessions[phone]?.slice(-10) || []
  });
});

app.post('/reset/:phone', (req, res) => {
  const phone = req.params.phone;
  delete sessions[phone];
  delete messageBuffers[phone];
  delete userLogs[phone];
  res.json({ success: true });
});

app.post('/send-test', async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: 'phone e text obrigatorios' });
  }
  const success = await sendWhatsAppMessage(phone, text);
  res.json({ success });
});

app.get('/stats', (req, res) => {
  res.json({
    version: '7.1',
    totalUsers: Object.keys(sessions).length,
    totalMessages: Object.values(sessions).reduce((sum, s) => sum + s.length, 0),
    maxHistory: MAX_HISTORY,
    activeBuffers: Object.keys(messageBuffers).length,
    bufferWaitSeconds: BUFFER_WAIT_MS / 1000,
    metaConfigured: !!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN),
    blockSplitting: true
  });
});

app.get('/', (req, res) => res.send('Agente Lucas v7.1 - Quebra em blocos ativa!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v7.1 rodando na porta ${PORT}`);
  console.log(`META configurado: ${!!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN)}`);
});
