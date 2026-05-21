// Servidor Lucas Krausche v7 - WhatsApp Cloud API direta
// Arquitetura: Railway + Meta Cloud API (sem Manychat)
//
// MUDANCAS v7:
// - Recebe webhooks da Meta diretamente
// - Envia mensagens via Cloud API
// - Mantem tudo da v5.1 (buffer 10s, anti-agressividade)
// - Validacao de webhook da Meta

const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────
// CONFIGURACOES META CLOUD API
// (variaveis de ambiente do Railway)
// ─────────────────────────────────────────
const META_TOKEN = process.env.META_TOKEN;              // Token de acesso
const META_PHONE_ID = process.env.META_PHONE_ID;        // Phone Number ID
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN; // Token criado por voce para validar webhook
const META_API_VERSION = 'v22.0';

// ─────────────────────────────────────────
// SYSTEM PROMPT (mesmo da v5.1)
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
   Exemplos: "Desculpa, sua mensagem nao chegou completa. Pode reenviar?"

4. SE O USUARIO TE CORRIGIR, VOCE RECONHECE E AGRADECE.

5. VOCE NUNCA REPETE O QUE JA DISSE SE O USUARIO RECLAMOU.

═══════════════════════════════════════════
ESTILO
═══════════════════════════════════════════

Mensagens curtas, ritmo de audio escrito no WhatsApp, max 8 linhas.
Tom humano, direto, firme e acolhedor.
Max 1 emoji por mensagem, so quando natural.
Expressoes coloquiais brasileiras (po, irmao, mano, cara).
NUNCA travessao, bullet points ou listas numeradas.

VARIACAO de aberturas: "Entendi.", "Olha,", "Calma.", "Po, cara.", "Faz sentido.", "Para um segundo.", "Vou ser direto.", "Saca so." Ou comece direto.

PRINCIPIO 1 - VALIDACAO ANTES DE ORIENTACAO
Em 100% das respostas com emocao, VALIDE o sentimento ANTES de orientar.

PRINCIPIO 2 - AUTORIDADE COM RESPEITO
Conselheiro, nao bajulador. NUNCA agressivo, sarcastico ou debochado.

PRINCIPIO 3 - ESTRUTURA
1. Validacao curta do sentimento.
2. Diagnostico do que acontece.
3. Orientacao especifica aplicavel agora.
4. Pergunta para avancar OU script pratico.

PRINCIPIO 4 - MENSAGENS LONGAS
Quando texto >300 chars:
1. CONFIRMA recebimento: "Recebi o texto, vou ler com atencao agora."
2. ANALISA conteudo.
3. DA orientacao especifica.
NUNCA peca pra reenviar mensagem ja recebida.

PRINCIPIO 5 - ANTI-REPETICAO
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

// Buffer de 10 segundos
const messageBuffers = {};
const BUFFER_WAIT_MS = 10000;

// Logs detalhados
const userLogs = {};
function logToUser(phone, entry) {
  if (!userLogs[phone]) userLogs[phone] = [];
  userLogs[phone].push({ ...entry, timestamp: new Date().toISOString() });
  if (userLogs[phone].length > 50) userLogs[phone] = userLogs[phone].slice(-50);
}

// ─────────────────────────────────────────
// FUNCAO: ENVIAR MENSAGEM VIA META CLOUD API
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
    console.log(`[${toPhone}] Mensagem enviada com sucesso. ID: ${data.messages?.[0]?.id}`);
    return true;
  } catch (err) {
    console.error('Erro sendWhatsAppMessage:', err);
    return false;
  }
}

// ─────────────────────────────────────────
// PROCESSAMENTO DA MENSAGEM AGRUPADA
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
      await sendWhatsAppMessage(phone, 'Po, deu um problema tecnico aqui. Pode reenviar a mensagem?');
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

    // Envia a resposta para o WhatsApp do usuario
    await sendWhatsAppMessage(phone, reply);

  } catch (err) {
    console.error('Erro processBuffered:', err);
    await sendWhatsAppMessage(phone, 'So um segundo, pode repetir?');
  }
}

// ─────────────────────────────────────────
// WEBHOOK META - VERIFICACAO INICIAL (GET)
// A Meta envia GET com challenge para validar
// ─────────────────────────────────────────
app.get('/webhook/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('Webhook META verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  console.error('Falha na verificacao do webhook META');
  return res.sendStatus(403);
});

// ─────────────────────────────────────────
// WEBHOOK META - RECEBE MENSAGENS (POST)
// ─────────────────────────────────────────
app.post('/webhook/meta', async (req, res) => {
  // Responder rapido pra Meta nao retentar
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

          // Extrai texto baseado no tipo da mensagem
          if (message.type === 'text') {
            userText = message.text?.body || '';
          } else if (message.type === 'audio') {
            userText = '[audio recebido - peca pra reenviar como texto]';
          } else if (message.type === 'image') {
            userText = message.image?.caption || '[imagem recebida]';
          } else {
            userText = `[mensagem ${message.type} recebida]`;
          }

          console.log(`[${fromPhone}] Mensagem recebida. ${userText.length} chars. Tipo: ${message.type}`);

          logToUser(fromPhone, {
            type: 'webhook_received',
            text_length: userText.length,
            message_type: message.type,
            preview: userText.substring(0, 300)
          });

          if (!userText.trim()) continue;

          // Adiciona ao buffer
          if (!messageBuffers[fromPhone]) {
            messageBuffers[fromPhone] = { messages: [], lastUpdate: Date.now() };
          }
          messageBuffers[fromPhone].messages.push(userText);
          messageBuffers[fromPhone].lastUpdate = Date.now();

          // Agenda processamento depois de 10s
          // Se chegar outra mensagem, lastUpdate atualiza
          setTimeout(async () => {
            if (!messageBuffers[fromPhone]) return;
            const timeSinceLast = Date.now() - messageBuffers[fromPhone].lastUpdate;
            // Se passou pelo menos 10s desde a ultima mensagem, processa
            if (timeSinceLast >= BUFFER_WAIT_MS - 500) {
              await processBuffered(fromPhone);
            }
          }, BUFFER_WAIT_MS);
        }
      }
    }
  } catch (err) {
    console.error('Erro processando webhook Meta:', err);
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

// Endpoint pra enviar mensagem manualmente (teste)
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
    totalUsers: Object.keys(sessions).length,
    totalMessages: Object.values(sessions).reduce((sum, s) => sum + s.length, 0),
    maxHistory: MAX_HISTORY,
    activeBuffers: Object.keys(messageBuffers).length,
    bufferWaitSeconds: BUFFER_WAIT_MS / 1000,
    metaConfigured: !!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN)
  });
});

app.get('/', (req, res) => res.send('Agente Lucas v7 - Cloud API direta!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v7 rodando na porta ${PORT}`);
  console.log(`META configurado: ${!!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN)}`);
});
