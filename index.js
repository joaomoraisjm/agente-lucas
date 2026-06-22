// ═══════════════════════════════════════════════════════════════
// AGENTE LUCAS KRAUSCHE - SERVIDOR v8
// Sistema de verificacao de assinatura com Supabase
//
// MUDANCAS v8:
// - Integracao com Supabase
// - Verificacao de assinante antes de responder (logica hibrida)
// - 3 avisos antes de bloquear (1 dia entre cada)
// - MODO de operacao controlado por env var (observation/enforce_soft/enforce_hard)
// - Webhook Hubla para sincronizacao automatica
// - Mantem TUDO da v7.4 (dossies, blocos, imagens, antiaggressividade)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────
// CONFIGURACOES
// ─────────────────────────────────────────
const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_ID;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_API_VERSION = 'v22.0';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const HUBLA_WEBHOOK_SECRET = process.env.HUBLA_WEBHOOK_SECRET || 'sem_secret_configurado';

// MODO DE OPERACAO - controla rigor do bloqueio
// 'observation'   = nao bloqueia, so loga (safe para testar)
// 'enforce_soft'  = avisa, mas continua respondendo
// 'enforce_hard'  = bloqueio total apos 3 avisos
const ENFORCEMENT_MODE = process.env.ENFORCEMENT_MODE || 'observation';

// Link de renovacao (configura no Hubla)
const RENEWAL_LINK = process.env.RENEWAL_LINK || 'https://pay.hubla.com.br/SEU_LINK_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`[INIT] Servidor v8 iniciando com MODE=${ENFORCEMENT_MODE}`);

// ─────────────────────────────────────────
// SYSTEM PROMPT v8 - Mantido da v7.4
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos masculinos. Voce ja atendeu centenas de homens em crises relacionais agudas.

Sua condução combina ACOLHIMENTO EMPATICO + RACIONALIDADE ESTRATEGICA + PROFUNDIDADE PSICANALITICA.

═══════════════════════════════════════════
REGRAS ABSOLUTAS (NUNCA VIOLE)
═══════════════════════════════════════════

1. NUNCA OFENDE, AGRIDE OU DESRESPEITA. Mesmo se corrigido.
2. NUNCA BRIGA. Discordancia se faz com firmeza e respeito.
3. SE NAO ENTENDEU, A FALHA E SUA. Assume falha tecnica gentilmente.
4. SE FOR CORRIGIDO, RECONHECE E AGRADECE.
5. NUNCA REPETE o que ja disse se o LEAD reclamou.

═══════════════════════════════════════════
LINGUAGEM ADAPTATIVA
═══════════════════════════════════════════

Por padrao, use LINGUAGEM SIMPLES. So aprofunde com termos tecnicos quando o LEAD demonstrar sofisticacao.

═══════════════════════════════════════════
3 ARQUETIPOS DO PUBLICO
═══════════════════════════════════════════

CUIDADOR/PROVEDOR - "Eu fiz tudo por ela"
"PAI" DA PARCEIRA - "Ela me ve como amigo"
DEPENDENTE EMOCIONAL - "Nao aguento ficar sozinho"

Identifique mentalmente, NAO ROTULE explicitamente.

═══════════════════════════════════════════
METODOLOGIA 3 ETAPAS
═══════════════════════════════════════════

1. CONHECER (idade, profissao, hobbies)
2. ENTENDER (relacionamento, ruptura)
3. PLANO DE ACAO (o que fazer HOJE)

═══════════════════════════════════════════
TERMOS-CHAVE
═══════════════════════════════════════════

"Imprevisibilidade", "Contato zero", "Reconquista da autoadmiracao",
"Ser a rocha", "Anular-se para caber na vida do outro",
"Distanciamento estrategico", "Evolucao visivel"

═══════════════════════════════════════════
3 PILARES
═══════════════════════════════════════════

PILAR 1 - DISTANCIAMENTO ESTRATEGICO
PILAR 2 - EVOLUCAO VISIVEL
PILAR 3 - ALINHAMENTO DE PROPOSITO

═══════════════════════════════════════════
FRASES ICONICAS
═══════════════════════════════════════════

Quer reatar: "A prioridade agora nao e a reconciliacao, mas construcao de um homem que ela nao consiga ignorar."

Culpado: "O erro foi tentar agradar excessivamente. Voce se anulou para caber na vida do outro."

Desespero: "Voce quer aliviar a SUA ansiedade. Nao tem a ver com ela voltar."

═══════════════════════════════════════════
NEUROCIENCIA E MASTERMIND
═══════════════════════════════════════════

21 dias para consolidar novo padrao (use quando aplicavel).
Raiva como combustivel para crescimento (Mastermind/Napoleon Hill).

═══════════════════════════════════════════
FORMATO E ESTILO
═══════════════════════════════════════════

- Mensagens curtas ou medias (1-3 paragrafos)
- Tom direto, firme E acolhedor
- Coloquial brasileiro: po, irmao, mano, cara
- NUNCA travessao, bullets, listas

═══════════════════════════════════════════
ANALISE DE IMAGENS
═══════════════════════════════════════════

Confirma recebimento, analisa microssinais (tom, emoji, tamanho), orienta.

═══════════════════════════════════════════
ENCAMINHAMENTO PARA MENTORIA
═══════════════════════════════════════════

Em casos graves (suicidio, violencia, vicios), sugerir mentoria 1:1 com Lucas em pessoa.
Em ideacao suicida: CVV 188.

═══════════════════════════════════════════
ENGAJAMENTO E RETENCAO
═══════════════════════════════════════════

Sempre termine com algo que provoca retorno (pergunta, update, tarefa).
Seja especifico, nao generico.`;

// ─────────────────────────────────────────
// SUPABASE HELPERS
// ─────────────────────────────────────────

async function findSubscriberByPhone(phone) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    console.error(`[DB] Erro buscando phone ${phone}:`, error.message);
    return null;
  }
  return data;
}

async function findSubscriberByEmail(email) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .ilike('email', email.toLowerCase().trim())
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0];
}

async function logEvent(phone, eventType, eventData = {}, source = 'system') {
  try {
    await supabase.from('events').insert({
      phone,
      event_type: eventType,
      event_data: eventData,
      source
    });
  } catch (err) {
    console.error('[DB] Erro logando evento:', err.message);
  }
}

async function updateSubscriberPhone(oldPhone, newPhone) {
  // Vincula novo telefone WhatsApp ao assinante encontrado por email
  const { error } = await supabase
    .from('subscribers')
    .update({ phone: newPhone, updated_at: new Date().toISOString() })
    .eq('phone', oldPhone);

  if (error) console.error('[DB] Erro atualizando phone:', error.message);
}

async function incrementWarningCount(phone) {
  const { data } = await supabase
    .from('subscribers')
    .select('warning_count')
    .eq('phone', phone)
    .single();

  const newCount = (data?.warning_count || 0) + 1;

  await supabase
    .from('subscribers')
    .update({
      warning_count: newCount,
      last_warning_sent_at: new Date().toISOString()
    })
    .eq('phone', phone);

  return newCount;
}

async function blockSubscriber(phone, reason) {
  await supabase
    .from('subscribers')
    .update({
      status: 'blocked',
      blocked_at: new Date().toISOString(),
      blocked_reason: reason
    })
    .eq('phone', phone);

  await logEvent(phone, 'blocked', { reason });
}

async function incrementMessageCount(phone) {
  const { data } = await supabase
    .from('subscribers')
    .select('total_messages')
    .eq('phone', phone)
    .single();

  await supabase
    .from('subscribers')
    .update({
      total_messages: (data?.total_messages || 0) + 1,
      last_message_at: new Date().toISOString()
    })
    .eq('phone', phone);
}

// ─────────────────────────────────────────
// VERIFICACAO DE ACESSO (LOGICA HIBRIDA)
// ─────────────────────────────────────────

// Estado em memoria de quem ja foi perguntado o email mas ainda nao respondeu
const pendingEmailRequest = {};

async function checkAccess(phone, messageText) {
  // 1. Tenta achar por telefone
  let subscriber = await findSubscriberByPhone(phone);

  // 2. Se nao encontrou, talvez seja resposta de email
  if (!subscriber && pendingEmailRequest[phone]) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = messageText.match(emailRegex);

    if (match) {
      const email = match[0];
      console.log(`[ACCESS] ${phone} forneceu email: ${email}`);

      const found = await findSubscriberByEmail(email);
      if (found) {
        // Vincula esse telefone ao assinante encontrado
        await updateSubscriberPhone(found.phone, phone);
        await logEvent(phone, 'phone_linked', { old_phone: found.phone, email });
        delete pendingEmailRequest[phone];
        return {
          status: 'allowed',
          subscriber: { ...found, phone },
          message: `Identifiquei voce, ${found.name?.split(' ')[0] || 'cara'}. Pode falar.`
        };
      } else {
        return {
          status: 'denied_no_match',
          message: `Nao encontrei assinatura ativa com esse email. Se voce e assinante, contata o suporte. Se quiser assinar agora: ${RENEWAL_LINK}`
        };
      }
    }
  }

  // 3. Se nao tem assinante nem pediu email ainda
  if (!subscriber) {
    pendingEmailRequest[phone] = Date.now();
    return {
      status: 'request_email',
      message: 'Antes de continuar, preciso confirmar seu acesso. Qual o email que voce usou pra assinar?'
    };
  }

  // 4. Achou assinante - verifica status
  const now = new Date();
  const expiresAt = subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : null;

  // 4a. Bloqueado explicitamente
  if (subscriber.status === 'blocked') {
    return {
      status: 'blocked',
      subscriber,
      message: `Olha, sua assinatura foi cancelada. Pra reativar: ${RENEWAL_LINK}`
    };
  }

  // 4b. Cancelado
  if (subscriber.status === 'canceled') {
    return {
      status: 'canceled',
      subscriber,
      message: `Seu acesso foi cancelado, cara. Sentindo falta? Reativar aqui: ${RENEWAL_LINK}`
    };
  }

  // 4c. Expirado (status active mas data passou) - sistema de 3 avisos
  if (expiresAt && expiresAt < now && subscriber.status === 'active') {
    const warnings = subscriber.warning_count || 0;
    const lastWarning = subscriber.last_warning_sent_at ? new Date(subscriber.last_warning_sent_at) : null;
    const hoursSinceLastWarning = lastWarning ? (now - lastWarning) / (1000 * 60 * 60) : Infinity;

    // Se ja passou 3 avisos -> bloqueia (so em enforce_hard)
    if (warnings >= 3 && ENFORCEMENT_MODE === 'enforce_hard') {
      await blockSubscriber(phone, 'expired_no_renewal');
      return {
        status: 'blocked',
        subscriber,
        message: `Cara, te avisei 3 vezes e voce nao renovou. Acesso bloqueado. Quando quiser voltar: ${RENEWAL_LINK}`
      };
    }

    // Aviso novo se passou 24h do anterior (ou for o primeiro)
    if (hoursSinceLastWarning >= 24) {
      const newCount = await incrementWarningCount(phone);
      await logEvent(phone, 'warning_sent', { warning_number: newCount });

      const warningMessages = [
        `Cara, sua assinatura venceu. Renova aqui pra a gente continuar conversando normalmente: ${RENEWAL_LINK}`,
        `Esse e o segundo aviso, irmao. Sua assinatura ta vencida. Renova aqui pra manter o acesso: ${RENEWAL_LINK}`,
        `Ultimo aviso, mano. Se nao renovar agora, vou ter que pausar nosso contato. Renova aqui: ${RENEWAL_LINK}`
      ];

      return {
        status: 'warning',
        subscriber,
        warningCount: newCount,
        message: warningMessages[Math.min(newCount - 1, 2)]
      };
    }

    // Se ainda nao passou 24h, deixa responder (mas marca como expirado nos logs)
    return {
      status: 'expired_grace',
      subscriber,
      message: null
    };
  }

  // 5. Tudo OK
  return { status: 'allowed', subscriber };
}

// ─────────────────────────────────────────
// CHAT MEMORY E BUFFER (mantido da v7.4)
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
// BLOCOS FLEXIVEIS
// ─────────────────────────────────────────
function splitIntoBlocks(text) {
  if (text.length < 150) return [text.trim()];

  let blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);

  if (blocks.length === 1 && text.length < 400) return [text.trim()];

  if (blocks.length === 1 && text.length >= 400) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      blocks = [
        sentences.slice(0, mid).join(' ').trim(),
        sentences.slice(mid).join(' ').trim()
      ].filter(b => b.length > 0);
    }
  }

  if (blocks.length > 3) {
    const lastBlocks = blocks.slice(2).join('\n\n');
    blocks = [blocks[0], blocks[1], lastBlocks];
  }

  return blocks;
}

function calculateTypingDelay(text) {
  const charsPerSecond = 40;
  const thinkingTime = 800;
  const typingTime = (text.length / charsPerSecond) * 1000;
  return Math.round(Math.min(Math.max(typingTime + thinkingTime, 1500), 5000));
}

// ─────────────────────────────────────────
// META API
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

async function sendBlocksWithDelay(toPhone, blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (i > 0) {
      const delay = calculateTypingDelay(block);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const success = await sendWhatsAppMessage(toPhone, block);
    if (!success) break;
    console.log(`[${toPhone}] Bloco ${i + 1}/${blocks.length} enviado`);
  }
}

async function getMediaUrl(mediaId) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${mediaId}`,
      { headers: { 'Authorization': `Bearer ${META_TOKEN}` } }
    );
    const data = await response.json();
    return data.url;
  } catch (err) { return null; }
}

async function downloadMediaAsBase64(mediaUrl) {
  try {
    const response = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { base64: buffer.toString('base64'), mediaType: contentType };
  } catch (err) { return null; }
}

// ─────────────────────────────────────────
// PROCESSAMENTO PRINCIPAL
// ─────────────────────────────────────────
async function processBuffered(phone) {
  const buffer = messageBuffers[phone];
  if (!buffer || (!buffer.messages.length && !buffer.images.length)) return;

  const combinedText = buffer.messages.join('\n\n');
  const images = buffer.images || [];
  delete messageBuffers[phone];

  console.log(`[${phone}] Processando: ${buffer.messages.length} msg(s), ${images.length} img(s).`);

  // ─── VERIFICACAO DE ACESSO ───
  const access = await checkAccess(phone, combinedText);
  console.log(`[ACCESS][${phone}] status=${access.status} mode=${ENFORCEMENT_MODE}`);

  logToUser(phone, {
    type: 'access_check',
    status: access.status,
    mode: ENFORCEMENT_MODE,
    subscriber_status: access.subscriber?.status
  });

  // Modo observacao: NUNCA bloqueia, so loga
  if (ENFORCEMENT_MODE === 'observation') {
    if (access.status !== 'allowed' && access.status !== 'expired_grace') {
      console.log(`[OBSERVATION] Em producao bloquearia: ${access.status}`);
      await logEvent(phone, 'would_block', { reason: access.status, mode: 'observation' });
    }
    // Continua normal sem bloquear
  }
  // Modo soft: avisa mas continua respondendo
  else if (ENFORCEMENT_MODE === 'enforce_soft') {
    if (access.status === 'request_email') {
      await sendWhatsAppMessage(phone, access.message);
      return;
    }
    if (access.status === 'warning' && access.message) {
      // Manda o aviso E continua respondendo
      await sendWhatsAppMessage(phone, access.message);
    }
    // Continua respondendo nos outros casos
  }
  // Modo hard: bloqueio total quando necessario
  else if (ENFORCEMENT_MODE === 'enforce_hard') {
    if (access.status === 'request_email') {
      await sendWhatsAppMessage(phone, access.message);
      return;
    }
    if (access.status === 'denied_no_match' ||
        access.status === 'blocked' ||
        access.status === 'canceled') {
      await sendWhatsAppMessage(phone, access.message);
      return;
    }
    if (access.status === 'warning' && access.message) {
      // Aviso bloqueia
      await sendWhatsAppMessage(phone, access.message);
      return;
    }
  }

  // ─── RESPOSTA NORMAL DA IA ───

  // Incrementa contador
  if (access.subscriber) {
    await incrementMessageCount(phone);
  }

  // Monta conteudo
  let userContent;
  if (images.length > 0) {
    const contentArray = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.base64 }
    }));
    contentArray.push({ type: 'text', text: combinedText || 'O que voce acha disso?' });
    userContent = contentArray;
  } else {
    userContent = combinedText;
  }

  if (!sessions[phone]) sessions[phone] = [];
  sessions[phone].push({ role: 'user', content: userContent });
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
      await sendWhatsAppMessage(phone, 'Po, deu um problema tecnico. Pode reenviar?');
      return;
    }

    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar.';
    sessions[phone].push({ role: 'assistant', content: reply });

    if (data.usage) {
      const u = data.usage;
      const cost = (u.input_tokens / 1000000) * 1 +
                   ((u.cache_read_input_tokens || 0) / 1000000) * 0.10 +
                   (u.output_tokens / 1000000) * 5;
      console.log(`[${phone}] in=${u.input_tokens} out=${u.output_tokens} custo=$${cost.toFixed(5)}`);
    }

    // Se teve mensagem de acesso pra mandar antes, ja foi enviada acima
    const blocks = splitIntoBlocks(reply);
    await sendBlocksWithDelay(phone, blocks);

  } catch (err) {
    console.error('Erro processBuffered:', err);
    await sendWhatsAppMessage(phone, 'So um segundo, pode repetir?');
  }
}

// ─────────────────────────────────────────
// WEBHOOK META
// ─────────────────────────────────────────
app.get('/webhook/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

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
          let imageData = null;

          if (message.type === 'text') {
            userText = message.text?.body || '';
          } else if (message.type === 'image') {
            userText = message.image?.caption || '';
            const mediaId = message.image?.id;
            if (mediaId) {
              const mediaUrl = await getMediaUrl(mediaId);
              if (mediaUrl) imageData = await downloadMediaAsBase64(mediaUrl);
            }
          } else if (message.type === 'audio') {
            userText = '[audio recebido - peca pra reenviar como texto]';
          }

          console.log(`[${fromPhone}] Recebido: ${message.type}`);

          if (!messageBuffers[fromPhone]) {
            messageBuffers[fromPhone] = { messages: [], images: [], lastUpdate: Date.now() };
          }
          if (userText.trim()) messageBuffers[fromPhone].messages.push(userText);
          if (imageData) messageBuffers[fromPhone].images.push(imageData);
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
// WEBHOOK HUBLA - Sincronizacao automatica
// ─────────────────────────────────────────
app.post('/webhook/hubla', async (req, res) => {
  res.sendStatus(200);

  try {
    const event = req.body;
    console.log('[HUBLA] Evento recebido:', event.type);

    // Estrutura do webhook do Hubla
    const eventType = event.type || event.event;
    const subscription = event.subscription || event.data;
    const customer = event.customer || subscription?.customer;

    if (!customer?.phone) {
      console.log('[HUBLA] Evento sem phone, ignorando');
      return;
    }

    const phone = customer.phone.replace(/[^0-9]/g, '');

    if (eventType === 'subscription.created' || eventType === 'NewSubscription') {
      // Nova assinatura
      await supabase.from('subscribers').upsert({
        phone,
        email: customer.email,
        name: customer.name,
        status: 'active',
        plan: 'monthly',
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'hubla',
        hubla_subscription_id: subscription.id,
        hubla_customer_id: customer.id,
        warning_count: 0
      }, { onConflict: 'phone' });

      await logEvent(phone, 'subscribed', { source: 'hubla', subscription_id: subscription.id });
    }

    else if (eventType === 'subscription.renewed' || eventType === 'SubscriptionRenewed') {
      // Renovacao
      await supabase
        .from('subscribers')
        .update({
          status: 'active',
          subscription_renewed_at: new Date().toISOString(),
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          warning_count: 0,
          last_warning_sent_at: null
        })
        .eq('phone', phone);

      await logEvent(phone, 'renewed', { source: 'hubla' });
    }

    else if (eventType === 'subscription.canceled' || eventType === 'SubscriptionCanceled') {
      // Cancelamento
      await supabase
        .from('subscribers')
        .update({ status: 'canceled' })
        .eq('phone', phone);

      await logEvent(phone, 'canceled', { source: 'hubla' });
    }

    else if (eventType === 'payment.failed' || eventType === 'PaymentFailed') {
      await logEvent(phone, 'payment_failed', { source: 'hubla' });
    }

  } catch (err) {
    console.error('[HUBLA] Erro processando webhook:', err);
  }
});

// ─────────────────────────────────────────
// ENDPOINTS DE DEBUG E ADMIN
// ─────────────────────────────────────────
app.get('/debug/:phone', async (req, res) => {
  const phone = req.params.phone;
  const subscriber = await findSubscriberByPhone(phone);

  res.json({
    phone,
    subscriber,
    has_session: !!sessions[phone],
    session_messages: sessions[phone]?.length || 0,
    has_buffer: !!messageBuffers[phone],
    pending_email: !!pendingEmailRequest[phone],
    recent_logs: userLogs[phone] || [],
    enforcement_mode: ENFORCEMENT_MODE
  });
});

app.post('/reset/:phone', (req, res) => {
  const phone = req.params.phone;
  delete sessions[phone];
  delete messageBuffers[phone];
  delete userLogs[phone];
  delete pendingEmailRequest[phone];
  res.json({ success: true });
});

app.get('/stats', async (req, res) => {
  const { data: dashStats } = await supabase
    .from('v_dashboard_stats')
    .select('*')
    .single();

  res.json({
    version: '8.0',
    enforcement_mode: ENFORCEMENT_MODE,
    metaConfigured: !!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN),
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_KEY),
    inMemoryUsers: Object.keys(sessions).length,
    activeBuffers: Object.keys(messageBuffers).length,
    pendingEmails: Object.keys(pendingEmailRequest).length,
    dashboard: dashStats
  });
});

app.get('/', (req, res) => res.send(`Agente Lucas v8 - mode=${ENFORCEMENT_MODE}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v8 rodando na porta ${PORT} | MODE=${ENFORCEMENT_MODE}`);
});
