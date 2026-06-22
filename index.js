// ═══════════════════════════════════════════════════════════════
// AGENTE LUCAS KRAUSCHE - SERVIDOR v8.1
// Webhook Hubla 100% mapeado (todos eventos)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json({ limit: '10mb' }));

const META_TOKEN = process.env.META_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_ID;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_API_VERSION = 'v22.0';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const ENFORCEMENT_MODE = process.env.ENFORCEMENT_MODE || 'observation';
const RENEWAL_LINK = process.env.RENEWAL_LINK || 'https://pay.hubla.com.br/SEU_LINK';
const HUBLA_TOKEN = process.env.HUBLA_TOKEN; // Token para validar autenticidade do webhook

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`[INIT] Servidor v8.1 iniciando com MODE=${ENFORCEMENT_MODE}`);

// ─────────────────────────────────────────
// SYSTEM PROMPT (mantido)
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos masculinos.

REGRAS ABSOLUTAS:
1. NUNCA OFENDE, AGRIDE OU DESRESPEITA.
2. NUNCA BRIGA. Discordancia com firmeza e respeito.
3. SE NAO ENTENDEU, A FALHA E SUA.
4. SE FOR CORRIGIDO, RECONHECE E AGRADECE.
5. NUNCA REPETE o que ja disse se o LEAD reclamou.

LINGUAGEM ADAPTATIVA: Simples por padrao, tecnica quando LEAD demonstrar sofisticacao.

3 ARQUETIPOS (identificar mentalmente, nao rotular):
- CUIDADOR/PROVEDOR: "Eu fiz tudo por ela"
- "PAI" DA PARCEIRA: "Ela me ve como amigo"
- DEPENDENTE EMOCIONAL: "Nao aguento ficar sozinho"

METODOLOGIA 3 ETAPAS: Conhecer > Entender > Plano de Acao.

TERMOS-CHAVE: Imprevisibilidade, Contato zero, Reconquista da autoadmiracao, Ser a rocha, Anular-se para caber na vida do outro, Distanciamento estrategico, Evolucao visivel.

3 PILARES: Distanciamento Estrategico, Evolucao Visivel, Alinhamento de Proposito.

FRASES ICONICAS:
- Quer reatar: "A prioridade nao e a reconciliacao, mas construcao de um homem que ela nao consiga ignorar."
- Culpado: "O erro foi tentar agradar excessivamente. Voce se anulou para caber na vida do outro."
- Desespero: "Voce quer aliviar a SUA ansiedade. Nao tem a ver com ela voltar."

NEUROCIENCIA: 21 dias para consolidar novo padrao.
MASTERMIND: Raiva como combustivel para crescimento.

FORMATO: 1-3 paragrafos, sem forcar. Curto pra curto, profundo pra profundo.

ESTILO: Direto, firme E acolhedor. Coloquial brasileiro (po, irmao, mano, cara). Sem travessao, bullets ou listas.

ANALISE DE IMAGENS: Confirma, analisa microssinais (tom, emoji, tamanho), orienta.

ENCAMINHAMENTO MENTORIA: Casos graves (suicidio, violencia, vicios) -> mentoria 1:1 com Lucas. Em ideacao suicida: CVV 188.

ENGAJAMENTO: Sempre termine com algo que provoca retorno. Seja especifico.`;

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
    console.error(`[DB] Erro: ${error.message}`);
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
      phone, event_type: eventType, event_data: eventData, source
    });
  } catch (err) {
    console.error('[DB] Erro logando evento:', err.message);
  }
}

async function updateSubscriberPhone(oldPhone, newPhone) {
  await supabase
    .from('subscribers')
    .update({ phone: newPhone, updated_at: new Date().toISOString() })
    .eq('phone', oldPhone);
}

async function incrementWarningCount(phone) {
  const { data } = await supabase
    .from('subscribers').select('warning_count')
    .eq('phone', phone).single();
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
    .from('subscribers').select('total_messages')
    .eq('phone', phone).single();
  await supabase
    .from('subscribers')
    .update({
      total_messages: (data?.total_messages || 0) + 1,
      last_message_at: new Date().toISOString()
    })
    .eq('phone', phone);
}

// ─────────────────────────────────────────
// HELPER: Normaliza telefone do Hubla
// ─────────────────────────────────────────
function normalizeHublaPhone(rawPhone) {
  if (!rawPhone) return null;
  let phone = String(rawPhone).replace(/[^0-9]/g, '');
  // Hubla manda sem o "55" no Brasil
  if (phone.length === 11 || phone.length === 10) {
    phone = '55' + phone;
  }
  return phone;
}

// ─────────────────────────────────────────
// VERIFICACAO DE ACESSO (hibrida)
// ─────────────────────────────────────────
const pendingEmailRequest = {};

async function checkAccess(phone, messageText) {
  let subscriber = await findSubscriberByPhone(phone);

  if (!subscriber && pendingEmailRequest[phone]) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = messageText.match(emailRegex);
    if (match) {
      const email = match[0];
      const found = await findSubscriberByEmail(email);
      if (found) {
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
          message: `Nao encontrei assinatura ativa com esse email. Pra assinar: ${RENEWAL_LINK}`
        };
      }
    }
  }

  if (!subscriber) {
    pendingEmailRequest[phone] = Date.now();
    return {
      status: 'request_email',
      message: 'Antes de continuar, preciso confirmar seu acesso. Qual o email que voce usou pra assinar?'
    };
  }

  const now = new Date();
  const expiresAt = subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : null;

  if (subscriber.status === 'blocked') {
    return { status: 'blocked', subscriber, message: `Sua assinatura foi cancelada. Reativar: ${RENEWAL_LINK}` };
  }

  if (subscriber.status === 'canceled') {
    return { status: 'canceled', subscriber, message: `Seu acesso foi cancelado. Reativar: ${RENEWAL_LINK}` };
  }

  if (expiresAt && expiresAt < now && subscriber.status === 'active') {
    const warnings = subscriber.warning_count || 0;
    const lastWarning = subscriber.last_warning_sent_at ? new Date(subscriber.last_warning_sent_at) : null;
    const hoursSinceLastWarning = lastWarning ? (now - lastWarning) / (1000 * 60 * 60) : Infinity;

    if (warnings >= 3 && ENFORCEMENT_MODE === 'enforce_hard') {
      await blockSubscriber(phone, 'expired_no_renewal');
      return {
        status: 'blocked',
        subscriber,
        message: `Te avisei 3 vezes e voce nao renovou. Acesso bloqueado. Reativar: ${RENEWAL_LINK}`
      };
    }

    if (hoursSinceLastWarning >= 24) {
      const newCount = await incrementWarningCount(phone);
      await logEvent(phone, 'warning_sent', { warning_number: newCount });

      const warningMessages = [
        `Cara, sua assinatura venceu. Renova aqui pra continuar: ${RENEWAL_LINK}`,
        `Segundo aviso. Sua assinatura ta vencida. Renova: ${RENEWAL_LINK}`,
        `Ultimo aviso. Se nao renovar, vou pausar nosso contato. Renova: ${RENEWAL_LINK}`
      ];

      return {
        status: 'warning',
        subscriber,
        warningCount: newCount,
        message: warningMessages[Math.min(newCount - 1, 2)]
      };
    }

    return { status: 'expired_grace', subscriber, message: null };
  }

  return { status: 'allowed', subscriber };
}

// ─────────────────────────────────────────
// CHAT MEMORY E BUFFER
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

function splitIntoBlocks(text) {
  if (text.length < 150) return [text.trim()];
  let blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);
  if (blocks.length === 1 && text.length < 400) return [text.trim()];
  if (blocks.length === 1 && text.length >= 400) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length >= 2) {
      const mid = Math.ceil(sentences.length / 2);
      blocks = [sentences.slice(0, mid).join(' ').trim(), sentences.slice(mid).join(' ').trim()].filter(b => b.length > 0);
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
  const typingTime = (text.length / charsPerSecond) * 1000;
  return Math.round(Math.min(Math.max(typingTime + 800, 1500), 5000));
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${META_TOKEN}` },
        body: JSON.stringify({
          messaging_product: 'whatsapp', to: toPhone, type: 'text', text: { body: text }
        })
      }
    );
    const data = await response.json();
    if (data.error) {
      console.error(`Erro enviando para ${toPhone}:`, data.error);
      return false;
    }
    return true;
  } catch (err) { return false; }
}

async function sendBlocksWithDelay(toPhone, blocks) {
  for (let i = 0; i < blocks.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, calculateTypingDelay(blocks[i])));
    else await new Promise(r => setTimeout(r, 1000));
    const ok = await sendWhatsAppMessage(toPhone, blocks[i]);
    if (!ok) break;
    console.log(`[${toPhone}] Bloco ${i + 1}/${blocks.length} enviado`);
  }
}

async function getMediaUrl(mediaId) {
  try {
    const response = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    return (await response.json()).url;
  } catch (err) { return null; }
}

async function downloadMediaAsBase64(mediaUrl) {
  try {
    const response = await fetch(mediaUrl, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      base64: buffer.toString('base64'),
      mediaType: response.headers.get('content-type') || 'image/jpeg'
    };
  } catch (err) { return null; }
}

// ─────────────────────────────────────────
// PROCESSAMENTO
// ─────────────────────────────────────────
async function processBuffered(phone) {
  const buffer = messageBuffers[phone];
  if (!buffer || (!buffer.messages.length && !buffer.images.length)) return;

  const combinedText = buffer.messages.join('\n\n');
  const images = buffer.images || [];
  delete messageBuffers[phone];

  console.log(`[${phone}] Processando: ${buffer.messages.length} msg(s), ${images.length} img(s).`);

  const access = await checkAccess(phone, combinedText);
  console.log(`[ACCESS][${phone}] status=${access.status} mode=${ENFORCEMENT_MODE}`);
  logToUser(phone, { type: 'access_check', status: access.status, mode: ENFORCEMENT_MODE });

  if (ENFORCEMENT_MODE === 'observation') {
    if (access.status !== 'allowed' && access.status !== 'expired_grace') {
      console.log(`[OBSERVATION] Em producao bloquearia: ${access.status}`);
      await logEvent(phone, 'would_block', { reason: access.status, mode: 'observation' });
    }
  } else if (ENFORCEMENT_MODE === 'enforce_soft') {
    if (access.status === 'request_email') { await sendWhatsAppMessage(phone, access.message); return; }
    if (access.status === 'warning' && access.message) await sendWhatsAppMessage(phone, access.message);
  } else if (ENFORCEMENT_MODE === 'enforce_hard') {
    if (access.status === 'request_email') { await sendWhatsAppMessage(phone, access.message); return; }
    if (['denied_no_match', 'blocked', 'canceled'].includes(access.status)) {
      await sendWhatsAppMessage(phone, access.message); return;
    }
    if (access.status === 'warning' && access.message) {
      await sendWhatsAppMessage(phone, access.message); return;
    }
  }

  if (access.subscriber) await incrementMessageCount(phone);

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
      await sendWhatsAppMessage(phone, 'Po, deu um problema tecnico. Pode reenviar?');
      return;
    }
    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar.';
    sessions[phone].push({ role: 'assistant', content: reply });

    if (data.usage) {
      const u = data.usage;
      const cost = (u.input_tokens / 1e6) * 1 + ((u.cache_read_input_tokens || 0) / 1e6) * 0.10 + (u.output_tokens / 1e6) * 5;
      console.log(`[${phone}] in=${u.input_tokens} out=${u.output_tokens} custo=$${cost.toFixed(5)}`);
    }

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
// WEBHOOK HUBLA - v8.1 com TODOS eventos mapeados
// ─────────────────────────────────────────
app.post('/webhook/hubla', async (req, res) => {
  res.sendStatus(200);

  try {
    const payload = req.body;
    const eventType = payload.type;
    const event = payload.event || {};
    const version = payload.version || 'unknown';

    console.log(`[HUBLA] Recebido: ${eventType} | v${version}`);

    // Validacao de token (opcional)
    if (HUBLA_TOKEN && req.headers['x-hubla-token'] !== HUBLA_TOKEN) {
      console.warn('[HUBLA] Token invalido, ignorando');
      return;
    }

    // ───── EXTRAI DADOS conforme estrutura ─────
    let phone, email, fullName, customerId, subscriptionId, billingCycleMonths;

    // v1.0.0: CanceledSubscription (estrutura flat)
    if (version === '1.0.0' || eventType === 'CanceledSubscription') {
      phone = normalizeHublaPhone(event.userPhone);
      email = event.userEmail;
      fullName = event.userName;
      customerId = event.userId;
      subscriptionId = null;
    }
    // v2.0.0: estrutura nested
    else {
      const subscription = event.subscription || {};
      const user = event.user || subscription.payer || {};
      phone = normalizeHublaPhone(user.phone || subscription.payer?.phone);
      email = user.email || subscription.payer?.email;
      fullName = (user.firstName && user.lastName)
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || null;
      customerId = user.id || subscription.payerId;
      subscriptionId = subscription.id;
      billingCycleMonths = subscription.billingCycleMonths || 1;
    }

    if (!phone) {
      console.log(`[HUBLA] ${eventType}: sem telefone, ignorando`);
      await logEvent('unknown', 'hubla_no_phone', { eventType, payload }, 'hubla');
      return;
    }

    // Log evento bruto
    await logEvent(phone, 'hubla_webhook_received', {
      eventType, version, subscription_id: subscriptionId
    }, 'hubla');

    // ───── PROCESSA POR TIPO DE EVENTO ─────

    // CRIAR ASSINATURA / ATIVAR
    if (eventType === 'subscription.created' || eventType === 'subscription.activated') {
      const months = billingCycleMonths || 1;
      const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
      const planName = months === 1 ? 'monthly' : months === 12 ? 'annual' : `${months}_months`;

      const { error } = await supabase.from('subscribers').upsert({
        phone, email, name: fullName,
        status: 'active',
        plan: planName,
        subscription_started_at: new Date().toISOString(),
        subscription_renewed_at: new Date().toISOString(),
        subscription_expires_at: expiresAt,
        source: 'hubla',
        hubla_subscription_id: subscriptionId,
        hubla_customer_id: customerId,
        warning_count: 0,
        last_warning_sent_at: null,
        blocked_at: null,
        blocked_reason: null
      }, { onConflict: 'phone' });

      if (error) console.error('[HUBLA] Erro upsert subscriber:', error.message);
      else console.log(`[HUBLA] ✅ ${eventType}: ${phone} (${fullName}) ativo até ${expiresAt}`);

      await logEvent(phone, eventType === 'subscription.created' ? 'subscribed' : 'activated', {
        subscription_id: subscriptionId, plan: planName, expires_at: expiresAt
      }, 'hubla');
    }

    // DESATIVAR (expirou ou foi desativada)
    else if (eventType === 'subscription.deactivated') {
      const { error } = await supabase
        .from('subscribers')
        .update({ status: 'expired' })
        .eq('phone', phone);

      if (error) console.error('[HUBLA] Erro desativando:', error.message);
      else console.log(`[HUBLA] ⚠️  Desativado: ${phone}`);

      await logEvent(phone, 'deactivated', { subscription_id: subscriptionId }, 'hubla');
    }

    // EXPIRING (aviso preventivo, próximo de expirar)
    else if (eventType === 'subscription.expiring') {
      console.log(`[HUBLA] 🔔 Expirando em breve: ${phone}`);
      await logEvent(phone, 'expiring_warning', { subscription_id: subscriptionId }, 'hubla');
    }

    // RENEWAL ENABLED (auto-renovação ativada)
    else if (eventType === 'subscription.renewal_enabled') {
      console.log(`[HUBLA] 🔄 Auto-renovacao ativada: ${phone}`);
      await logEvent(phone, 'renewal_enabled', { subscription_id: subscriptionId }, 'hubla');
    }

    // RENEWAL DISABLED (auto-renovação desligada - sinal de potencial cancelamento)
    else if (eventType === 'subscription.renewal_disabled') {
      console.log(`[HUBLA] ⚠️  Auto-renovacao desativada: ${phone}`);
      await logEvent(phone, 'renewal_disabled', { subscription_id: subscriptionId }, 'hubla');
    }

    // CANCELAMENTO (v1)
    else if (eventType === 'CanceledSubscription' || eventType === 'subscription.canceled') {
      const { error } = await supabase
        .from('subscribers')
        .update({ status: 'canceled' })
        .eq('phone', phone);

      if (error) console.error('[HUBLA] Erro cancelando:', error.message);
      else console.log(`[HUBLA] ❌ Cancelado: ${phone}`);

      await supabase.from('cancellations').insert({
        phone, email, canceled_at: new Date().toISOString()
      });

      await logEvent(phone, 'canceled', { subscription_id: subscriptionId }, 'hubla');
    }

    // EVENTO DESCONHECIDO
    else {
      console.log(`[HUBLA] ❓ Evento nao mapeado: ${eventType}`);
      await logEvent(phone, 'hubla_unknown_event', { eventType, payload }, 'hubla');
    }

  } catch (err) {
    console.error('[HUBLA] Erro processando webhook:', err);
  }
});

// ─────────────────────────────────────────
// DEBUG E STATS
// ─────────────────────────────────────────
app.get('/debug/:phone', async (req, res) => {
  const phone = req.params.phone;
  const subscriber = await findSubscriberByPhone(phone);
  res.json({
    phone, subscriber,
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
  delete sessions[phone]; delete messageBuffers[phone];
  delete userLogs[phone]; delete pendingEmailRequest[phone];
  res.json({ success: true });
});

app.get('/stats', async (req, res) => {
  const { data: dashStats } = await supabase
    .from('v_dashboard_stats').select('*').single();
  res.json({
    version: '8.1',
    enforcement_mode: ENFORCEMENT_MODE,
    metaConfigured: !!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN),
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_KEY),
    hublaTokenConfigured: !!HUBLA_TOKEN,
    inMemoryUsers: Object.keys(sessions).length,
    activeBuffers: Object.keys(messageBuffers).length,
    pendingEmails: Object.keys(pendingEmailRequest).length,
    dashboard: dashStats
  });
});

app.get('/', (req, res) => res.send(`Agente Lucas v8.1 - mode=${ENFORCEMENT_MODE}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v8.1 rodando na porta ${PORT} | MODE=${ENFORCEMENT_MODE}`);
});
