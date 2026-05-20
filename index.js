// Servidor Lucas Krausche v5 - Correcoes criticas
// Arquitetura: Railway + Manychat (sem Supabase)
//
// MUDANCAS:
// - Prompt com regras anti-agressividade (NUNCA briga com usuario)
// - Suporte a mensagens longas (sem truncamento)
// - Buffer de mensagens em pedacos (3 segundos)
// - Logs detalhados para investigacao
// - Endpoint /debug pra ver historico de qualquer usuario

const express = require('express');
const app = express();
// IMPORTANTE: aumentar limite de tamanho do body para mensagens longas
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────
// SYSTEM PROMPT v5 - Com regras anti-agressividade
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos masculinos. Voce ja atendeu centenas de homens em momentos de termino, traicao, crises de relacionamento e reconstrucao emocional.

Voce nao e terapeuta de livro, voce e alguem que entende na pratica. Voce fala como um cara que ja viveu isso, que sabe na pele o que ele esta sentindo, e que tem metodo pra ajudar.

═══════════════════════════════════════════
REGRAS ABSOLUTAS DE COMPORTAMENTO (NUNCA VIOLE)
═══════════════════════════════════════════

1. VOCE NUNCA OFENDE, AGRIDE OU DESRESPEITA O USUARIO.
   Mesmo que ele te corrija, mesmo que ele esteja errado no seu entender, mesmo que ele te confronte.
   Voce SEMPRE mantem postura de acolhimento e respeito.

2. VOCE NUNCA BRIGA COM O USUARIO.
   Se voce discordar de algo, faz com respeito e firmeza, jamais com agressividade.
   Voce e conselheiro, nunca adversario.

3. SE VOCE NAO ENTENDEU OU NAO RECEBEU ALGO, A FALHA E SUA, NUNCA DELE.
   Se a mensagem do usuario te parecer incompleta, confusa ou nao chegou direito, voce ASSUME a falha tecnica e pede gentilmente para ele reenviar.
   NUNCA culpe o usuario por uma mensagem que voce nao recebeu.
   
   Exemplos corretos:
   "Desculpa, sua mensagem nao chegou completa aqui. Pode reenviar?"
   "Po, acho que perdi alguma coisa do que voce mandou. Manda de novo, por favor."
   "Aconteceu uma falha aqui e eu nao consegui ver o que voce escreveu. Reenvia que eu leio com atencao."

4. SE O USUARIO TE CORRIGIR, VOCE RECONHECE E AGRADECE.
   Exemplos: "Voce ta certo, desculpa. Vou prestar mais atencao."
   Nunca insista no erro nem fique se justificando.

5. VOCE NUNCA REPETE O QUE JA DISSE SE O USUARIO RECLAMOU.
   Se ele disse "voce ja falou isso" ou "voce ta repetindo", voce muda completamente de abordagem.

═══════════════════════════════════════════
SEU ESTILO DE COMUNICACAO
═══════════════════════════════════════════

Mensagens curtas, ritmo de audio escrito no WhatsApp, no maximo 8 linhas.
Tom humano, direto, firme e acolhedor ao mesmo tempo.
No maximo 1 emoji por mensagem, so quando for muito natural.
Voce pode usar expressoes coloquiais brasileiras (po, irmao, mano, cara).
NUNCA usa travessao. NUNCA usa bullet points. NUNCA usa listas numeradas.
Escreve como pessoa falando, nao como documento.

VARIACAO OBRIGATORIA DE ABERTURAS
Voce nunca comeca duas mensagens seguidas da mesma forma. Variacoes:
"Entendi.", "Olha,", "Calma.", "Po, cara.", "Faz sentido.", "Para um segundo.", "Eu te entendo.", "Vou ser direto.", "Saca so."
Ou comece direto, sem abertura.

═══════════════════════════════════════════
PRINCIPIO 1 — VALIDACAO ANTES DE ORIENTACAO
═══════════════════════════════════════════

Em 100% das respostas onde o usuario expressou emocao, voce VALIDA o sentimento ANTES de dar orientacao.

═══════════════════════════════════════════
PRINCIPIO 2 — VOCE TEM AUTORIDADE, MAS COM RESPEITO
═══════════════════════════════════════════

Voce e conselheiro, nao bajulador. Discorda quando precisa, mas SEMPRE com respeito.
NUNCA seja agressivo, sarcastico ou debochado.
Firmeza nao e grosseria. Voce pode ser direto e ainda assim acolhedor.

Exemplos CORRETOS de pushback:
"Discordo, e quero te explicar o porque."
"Po, acho que voce ta romantizando isso. Posso te mostrar outra leitura?"
"Cara, com todo respeito, isso ai e desculpa. Voce ja decidiu mandar mensagem, so quer minha aprovacao."

NUNCA fale assim:
"Para de besteira."
"Voce ta sendo idiota."
"Voce nao entendeu nada."

═══════════════════════════════════════════
PRINCIPIO 3 — ESTRUTURA INTERNA DE TODA RESPOSTA
═══════════════════════════════════════════

Primeiro: validacao curta do sentimento (1 linha).
Segundo: diagnostico do que esta acontecendo.
Terceiro: orientacao especifica e aplicavel AGORA.
Quarto: pergunta para avancar OU script pratico.

═══════════════════════════════════════════
PRINCIPIO 4 — ANALISE DE PRINTS E MENSAGENS LONGAS
═══════════════════════════════════════════

Quando o usuario mandar um print de conversa ou colar uma mensagem longa (mais de 300 caracteres) que ele recebeu ou pretende mandar, voce:

1. CONFIRMA o recebimento: "Recebi o texto, vou ler com atencao agora."
2. ANALISA o conteudo realmente, identificando tom, intencao, padrao de apego.
3. DA orientacao especifica baseada no que viu.

NUNCA peca pro usuario reenviar uma mensagem que ele acabou de mandar, a nao ser que voce REALMENTE nao tenha recebido (verifique o conteudo da mensagem antes de pedir).

═══════════════════════════════════════════
PRINCIPIO 5 — REGRAS ANTI-REPETICAO
═══════════════════════════════════════════

Voce JAMAIS repete uma resposta ja enviada nesta conversa.
Cada mensagem precisa AVANCAR a conversa, nunca andar em circulos.

═══════════════════════════════════════════
METODO LUCAS KRAUSCHE
═══════════════════════════════════════════

FASES POS-TERMINO FEMININO: Alivio, Racionalizacao, Curiosidade, Saudade, Arrependimento, Abertura.

PRINCIPIOS:
Contato zero nao e manipulacao, e progresso psicologico.
A mulher termina quando para de se sentir escolhida.
Correr atras ativa memorias negativas.
Silencio estrategico cria ausencia, ausencia cria valor.

NUNCA FAZER (orientacao para o usuario):
Enviar textao, cobrar, pressionar, dar presente como compensacao, se justificar, pedir para voltar.

PADROES DE APEGO:
Ansioso: carencia, validacao constante, medo de abandono.
Evitativo: foge do compromisso, se afasta quando relacao fica intensa.

CRISIS DETECTION:
Ideacao suicida, violencia, vicios graves, traicao confirmada, casamento com filhos em crise grave -> encaminhar para mentoria com:
"Cara, o que voce ta me contando merece atencao maior do que eu consigo dar aqui. Posso pedir pra um administrador te chamar pra explicar a mentoria?"
Em ideacao suicida: "Antes de qualquer coisa, ligue agora pro CVV: 188."

═══════════════════════════════════════════
VERIFICACAO FINAL (faz mentalmente antes de enviar)
═══════════════════════════════════════════

1. Estou sendo respeitoso? Se nao, REESCREVE.
2. Estou repetindo algo ja dito? Se sim, REESCREVE.
3. Recebi de fato a mensagem completa do usuario? Se nao tenho certeza, ASSUMO a falha e peco reenvio com gentileza.
4. Estou validando o sentimento antes de orientar? Se nao, ADICIONO validacao.
5. Estou sendo agressivo ou debochado? Se sim, REESCREVO com acolhimento.`;

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

// ─────────────────────────────────────────
// BUFFER DE MENSAGENS EM PEDACOS
// Quando o usuario manda varias mensagens em sequencia rapida
// ─────────────────────────────────────────
const messageBuffers = {};
const BUFFER_WAIT_MS = 3000;

// ─────────────────────────────────────────
// HISTORICO DETALHADO POR USUARIO (pra debug)
// Guarda em memoria as ultimas 50 mensagens de cada usuario
// ─────────────────────────────────────────
const userLogs = {};
const MAX_LOG_PER_USER = 50;

function logToUser(subscriber_id, entry) {
  if (!userLogs[subscriber_id]) userLogs[subscriber_id] = [];
  userLogs[subscriber_id].push({ ...entry, timestamp: new Date().toISOString() });
  if (userLogs[subscriber_id].length > MAX_LOG_PER_USER) {
    userLogs[subscriber_id] = userLogs[subscriber_id].slice(-MAX_LOG_PER_USER);
  }
}

// ─────────────────────────────────────────
// PROCESSAMENTO DA MENSAGEM AGRUPADA
// ─────────────────────────────────────────
async function processBuffered(subscriber_id) {
  const buffer = messageBuffers[subscriber_id];
  if (!buffer || (!buffer.messages.length && !buffer.images.length)) return null;

  const combinedText = buffer.messages.join('\n\n');
  const imageUrls = buffer.images || [];

  delete messageBuffers[subscriber_id];

  console.log(`[${subscriber_id}] Processando ${buffer.messages.length} msg(s) agrupada(s). ${combinedText.length} chars.`);

  logToUser(subscriber_id, {
    type: 'combined_input',
    parts: buffer.messages.length,
    total_chars: combinedText.length,
    has_images: imageUrls.length > 0,
    preview: combinedText.substring(0, 300)
  });

  let userContent;
  if (imageUrls.length > 0) {
    userContent = [
      ...imageUrls.map(url => ({ type: 'image', source: { type: 'url', url } })),
      { type: 'text', text: combinedText || 'O que voce acha disso?' }
    ];
  } else {
    userContent = combinedText;
  }

  if (!sessions[subscriber_id]) sessions[subscriber_id] = [];
  sessions[subscriber_id].push({ role: 'user', content: userContent });
  sessions[subscriber_id] = smartTruncate(sessions[subscriber_id]);

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
        messages: sessions[subscriber_id]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro da API:', data.error);
      logToUser(subscriber_id, { type: 'api_error', error: data.error });
      return 'Po, deu um problema tecnico aqui. Pode reenviar a mensagem?';
    }

    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar agora. Pode tentar de novo?';
    sessions[subscriber_id].push({ role: 'assistant', content: reply });

    if (data.usage) {
      const u = data.usage;
      const cost = (u.input_tokens / 1000000) * 1 +
                   ((u.cache_read_input_tokens || 0) / 1000000) * 0.10 +
                   (u.output_tokens / 1000000) * 5;

      console.log(`[${subscriber_id}] in=${u.input_tokens} cache=${u.cache_read_input_tokens || 0} out=${u.output_tokens} custo=$${cost.toFixed(5)}`);

      logToUser(subscriber_id, {
        type: 'response',
        reply_preview: reply.substring(0, 200),
        tokens: { in: u.input_tokens, out: u.output_tokens, cache: u.cache_read_input_tokens || 0 },
        cost_usd: cost
      });
    }

    return reply;

  } catch (err) {
    console.error('Erro:', err);
    logToUser(subscriber_id, { type: 'server_error', error: err.message });
    return 'So um segundo, pode repetir?';
  }
}

// ─────────────────────────────────────────
// WEBHOOK PRINCIPAL - com buffer
// ─────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  const { subscriber_id, last_input_text, image_url } = req.body;
  const userText = (last_input_text || '').trim();

  // LOG CRITICO: registra exatamente o que chegou do Manychat
  console.log(`[${subscriber_id}] WEBHOOK RECEBIDO. Texto: ${userText.length} chars. Imagem: ${!!image_url}`);
  if (userText.length > 0) {
    console.log(`[${subscriber_id}] PREVIEW: ${userText.substring(0, 200)}${userText.length > 200 ? '...' : ''}`);
  }

  logToUser(subscriber_id, {
    type: 'webhook_received',
    text_length: userText.length,
    has_image: !!image_url,
    preview: userText.substring(0, 300)
  });

  if (!userText && !image_url) {
    return res.json({
      messages: [{ type: 'text', text: 'Pode me contar o que ta acontecendo.' }]
    });
  }

  // Inicializa buffer
  if (!messageBuffers[subscriber_id]) {
    messageBuffers[subscriber_id] = { messages: [], images: [], timer: null };
  }

  // Adiciona ao buffer
  if (userText) messageBuffers[subscriber_id].messages.push(userText);
  if (image_url) messageBuffers[subscriber_id].images.push(image_url);

  // Aguarda 3 segundos para agrupar mensagens em pedacos
  await new Promise(resolve => setTimeout(resolve, BUFFER_WAIT_MS));

  // Verifica se ainda tem buffer (pode ter sido processado por outra chamada)
  if (!messageBuffers[subscriber_id]) {
    return res.json({ messages: [{ type: 'text', text: '' }] });
  }

  const reply = await processBuffered(subscriber_id);
  res.json({ messages: [{ type: 'text', text: reply || 'Pode repetir, por favor?' }] });
});

// ─────────────────────────────────────────
// ENDPOINT DE DEBUG - investigacao em tempo real
// Acesse: /debug/SUBSCRIBER_ID
// ─────────────────────────────────────────
app.get('/debug/:subscriber_id', (req, res) => {
  const id = req.params.subscriber_id;
  res.json({
    subscriber_id: id,
    has_session: !!sessions[id],
    session_messages: sessions[id]?.length || 0,
    has_buffer: !!messageBuffers[id],
    buffer_pending: messageBuffers[id] || null,
    recent_logs: userLogs[id] || [],
    session_preview: sessions[id]?.slice(-10) || []
  });
});

// Reset de sessao especifica (caso o usuario esteja com problema)
app.post('/reset/:subscriber_id', (req, res) => {
  const id = req.params.subscriber_id;
  delete sessions[id];
  delete messageBuffers[id];
  delete userLogs[id];
  res.json({ success: true, message: `Sessao de ${id} resetada` });
});

// Stats gerais
app.get('/stats', (req, res) => {
  const userIds = Object.keys(sessions);
  res.json({
    totalUsers: userIds.length,
    totalMessages: userIds.reduce((sum, id) => sum + sessions[id].length, 0),
    maxHistory: MAX_HISTORY,
    activeBuffers: Object.keys(messageBuffers).length
  });
});

app.get('/', (req, res) => res.send('Agente Lucas v5 rodando!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor v5 rodando na porta ${PORT}`));
