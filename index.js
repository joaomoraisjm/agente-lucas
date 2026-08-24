// ═══════════════════════════════════════════════════════════════
// AGENTE LUCAS KRAUSCHE - SERVIDOR v8.7
// v8.6 + Base de conhecimento CDP (Codigo da Paixao - publico feminino)
// FULL_SYSTEM_PROMPT = persona + CDR + CDP
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
const HUBLA_TOKEN = process.env.HUBLA_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://agente-lucas-production.up.railway.app'; // Token para validar autenticidade do webhook

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════════════════
// DASHBOARD HTML (embed)
// ═══════════════════════════════════════════════════════════════
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel — Lucas Krausche</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #F7F6F2;
    --surface: #FFFFFF;
    --surface-2: #FAF9F5;
    --ink: #0E0E0C;
    --ink-2: #2A2A28;
    --muted: #79766F;
    --muted-2: #A5A29A;
    --border: #E8E5DD;
    --border-2: #D5D1C5;
    --primary: #1F3A4D;
    --primary-hover: #2C4D63;
    --accent: #C8A875;
    --accent-bg: #FDF8EE;
    --success: #4A7C59;
    --success-bg: #ECF3EE;
    --warning: #C97D2C;
    --warning-bg: #FBF1E2;
    --danger: #B23A48;
    --danger-bg: #F7E5E7;
    --critical: #8B2C36;
    --shadow-sm: 0 1px 2px rgba(14,14,12,0.04);
    --shadow-md: 0 4px 12px rgba(14,14,12,0.06);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--ink);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .serif { font-family: 'Fraunces', serif; font-feature-settings: 'ss01' on; }

  /* ─── LOGIN ─── */
  #login {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(ellipse at top left, rgba(31,58,77,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, rgba(200,168,117,0.06) 0%, transparent 50%),
      var(--bg);
  }
  .login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 56px 48px;
    width: 100%;
    max-width: 420px;
    box-shadow: var(--shadow-md);
  }
  .login-brand {
    margin-bottom: 40px;
  }
  .login-brand-mark {
    font-family: 'Fraunces', serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .login-brand-name {
    font-family: 'Fraunces', serif;
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--ink);
  }
  .login-brand-sub {
    font-size: 13px;
    color: var(--muted);
    margin-top: 8px;
  }
  .login-divider {
    height: 1px;
    background: var(--border);
    margin: 32px 0;
  }
  .login-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
    font-weight: 500;
  }
  .login-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border-2);
    border-radius: 3px;
    font-family: inherit;
    font-size: 15px;
    background: var(--surface);
    color: var(--ink);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .login-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(31,58,77,0.08);
  }
  .login-btn {
    width: 100%;
    padding: 13px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 3px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    margin-top: 20px;
    transition: background 0.15s;
  }
  .login-btn:hover { background: var(--primary-hover); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .login-error {
    background: var(--danger-bg);
    color: var(--danger);
    border-left: 3px solid var(--danger);
    padding: 10px 14px;
    font-size: 13px;
    margin-top: 16px;
    border-radius: 0 3px 3px 0;
  }

  /* ─── APP LAYOUT ─── */
  .app { display: none; min-height: 100vh; }
  .app.active { display: grid; grid-template-columns: 240px 1fr; }

  /* Sidebar */
  .sidebar {
    background: var(--ink);
    color: rgba(255,255,255,0.85);
    padding: 32px 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .sidebar-brand {
    padding: 0 28px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .sidebar-brand-mark {
    font-family: 'Fraunces', serif;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 6px;
  }
  .sidebar-brand-name {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: white;
  }
  .sidebar-nav { padding: 20px 0; flex: 1; }
  .sidebar-section-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    padding: 12px 28px 8px;
    font-weight: 500;
  }
  .sidebar-link {
    display: block;
    padding: 10px 28px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    font-size: 14px;
    border-left: 2px solid transparent;
    transition: all 0.15s;
    user-select: none;
  }
  .sidebar-link:hover {
    color: white;
    background: rgba(255,255,255,0.04);
  }
  .sidebar-link.active {
    color: white;
    background: rgba(255,255,255,0.06);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .sidebar-footer {
    padding: 16px 28px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sidebar-logout {
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .sidebar-logout:hover { color: white; }

  /* Main */
  .main {
    padding: 40px 56px 80px;
    max-width: 1400px;
    overflow-x: auto;
  }
  @media (max-width: 900px) {
    .app.active { grid-template-columns: 1fr; }
    .sidebar { position: relative; height: auto; }
    .main { padding: 24px; }
  }

  /* Page header */
  .page-eyebrow {
    font-family: 'Fraunces', serif;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
    font-weight: 500;
  }
  .page-title {
    font-family: 'Fraunces', serif;
    font-size: 42px;
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--ink);
    margin-bottom: 8px;
  }
  .page-subtitle {
    font-size: 15px;
    color: var(--muted);
    margin-bottom: 40px;
    max-width: 640px;
  }

  /* Diagnostic banner */
  .diagnostic {
    background: var(--surface);
    border-left: 3px solid var(--primary);
    padding: 20px 24px;
    margin-bottom: 40px;
    border-radius: 0 4px 4px 0;
    box-shadow: var(--shadow-sm);
  }
  .diagnostic.warning { border-left-color: var(--warning); background: var(--warning-bg); }
  .diagnostic.critical { border-left-color: var(--critical); background: var(--danger-bg); }
  .diagnostic.opportunity { border-left-color: var(--success); background: var(--success-bg); }
  .diagnostic-label {
    font-family: 'Fraunces', serif;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .diagnostic-title {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }
  .diagnostic-detail { color: var(--ink-2); font-size: 14px; }

  /* Metric cards */
  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 48px;
  }
  .metric {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 24px 24px 22px;
    border-radius: 3px;
    position: relative;
  }
  .metric-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
    font-weight: 500;
  }
  .metric-value {
    font-family: 'Fraunces', serif;
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.03em;
    color: var(--ink);
    line-height: 1;
  }
  .metric-unit {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    color: var(--muted);
    margin-left: 4px;
  }
  .metric-context {
    font-size: 12px;
    color: var(--muted);
    margin-top: 10px;
    line-height: 1.4;
  }
  .metric.featured { background: var(--ink); color: white; }
  .metric.featured .metric-label { color: rgba(255,255,255,0.55); }
  .metric.featured .metric-value { color: white; }
  .metric.featured .metric-unit { color: rgba(255,255,255,0.55); }
  .metric.featured .metric-context { color: rgba(255,255,255,0.6); }

  /* Section heading */
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
    margin-top: 8px;
  }
  .section-title {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.015em;
  }
  .section-subtitle { font-size: 13px; color: var(--muted); }

  /* Action list */
  .actions {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 3px;
    margin-bottom: 48px;
    overflow: hidden;
  }
  .action-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
  }
  .action-row:last-child { border-bottom: none; }
  .action-priority {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 2px;
    background: var(--surface-2);
    color: var(--muted);
    white-space: nowrap;
  }
  .action-priority.alta { background: var(--danger-bg); color: var(--critical); }
  .action-priority.media { background: var(--warning-bg); color: var(--warning); }
  .action-text { color: var(--ink-2); font-size: 14px; }
  .action-impact {
    font-size: 12px;
    color: var(--success);
    font-weight: 500;
    white-space: nowrap;
  }

  /* Form */
  .form-card {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 28px;
    border-radius: 3px;
    margin-bottom: 32px;
  }
  .form-title {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 4px;
  }
  .form-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 14px;
    align-items: end;
  }
  @media (max-width: 900px) {
    .form-grid { grid-template-columns: 1fr 1fr; }
  }
  .field {
    display: flex;
    flex-direction: column;
  }
  .field label {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
    font-weight: 500;
  }
  .field input, .field select {
    padding: 10px 12px;
    border: 1px solid var(--border-2);
    border-radius: 3px;
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
  }
  .field input:focus, .field select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(31,58,77,0.08);
  }
  .btn {
    padding: 10px 20px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 3px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .btn:hover { background: var(--primary-hover); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    background: transparent;
    color: var(--ink-2);
    border: 1px solid var(--border-2);
  }
  .btn-ghost:hover { background: var(--surface-2); border-color: var(--ink-2); }
  .btn-danger {
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--danger-bg);
    padding: 6px 12px;
    font-size: 12px;
  }
  .btn-danger:hover { background: var(--danger-bg); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }

  /* Table */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 32px;
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left;
    padding: 14px 20px;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
    font-weight: 500;
    white-space: nowrap;
  }
  tbody td {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    color: var(--ink-2);
    vertical-align: middle;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface-2); }
  .cell-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--ink-2); }
  .cell-name { font-weight: 500; color: var(--ink); }
  .cell-muted { color: var(--muted); }

  /* Status pills */
  .pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 2px;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
  }
  .pill.active { background: var(--success-bg); color: var(--success); }
  .pill.trial { background: var(--accent-bg); color: #856027; }
  .pill.expired { background: var(--surface-2); color: var(--muted); }
  .pill.canceled { background: var(--danger-bg); color: var(--danger); }
  .pill.blocked { background: var(--danger-bg); color: var(--critical); }

  .days-remaining {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
  .days-remaining.urgent { color: var(--danger); font-weight: 600; }
  .days-remaining.warn { color: var(--warning); }
  .days-remaining.good { color: var(--success); }

  /* Search/filter bar */
  .toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
  }
  .toolbar input, .toolbar select {
    padding: 8px 12px;
    border: 1px solid var(--border-2);
    border-radius: 3px;
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
  }
  .toolbar input { min-width: 280px; }
  .toolbar input:focus, .toolbar select:focus {
    outline: none;
    border-color: var(--primary);
  }
  .toolbar-spacer { flex: 1; }
  .toolbar-count {
    color: var(--muted);
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Empty state */
  .empty {
    padding: 60px 20px;
    text-align: center;
    color: var(--muted);
  }
  .empty-title {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    color: var(--ink-2);
    margin-bottom: 6px;
  }
  .empty-detail { font-size: 13px; }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--ink);
    color: white;
    padding: 14px 20px;
    border-radius: 3px;
    font-size: 13px;
    box-shadow: var(--shadow-md);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.2s;
    z-index: 1000;
    max-width: 380px;
  }
  .toast.show { opacity: 1; transform: translateY(0); }
  .toast.error { background: var(--critical); }
  .toast.success { background: var(--success); }

  /* Modal */
  .modal-bg {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(14,14,12,0.5);
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .modal-bg.open { display: flex; }
  .modal {
    background: var(--surface);
    border-radius: 4px;
    max-width: 720px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    padding: 32px;
  }
  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .modal-title {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.015em;
  }
  .modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--muted);
    line-height: 1;
    padding: 4px 8px;
  }
  .modal-close:hover { color: var(--ink); }
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;
    margin-bottom: 24px;
  }
  .detail-item { }
  .detail-label {
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .detail-value {
    font-size: 14px;
    color: var(--ink-2);
    word-break: break-word;
  }
  .events-feed { }
  .events-feed-title {
    font-family: 'Fraunces', serif;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .event-row {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    align-items: baseline;
  }
  .event-row:last-child { border-bottom: none; }
  .event-time { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }
  .event-type { color: var(--ink-2); font-weight: 500; }
  .event-source {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Loading skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--surface-2) 0%, var(--border) 50%, var(--surface-2) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 2px;
    color: transparent !important;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* View visibility */
  .view { display: none; }
  .view.active { display: block; }

  .help-text {
    font-size: 12px;
    color: var(--muted);
    margin-top: 8px;
    line-height: 1.5;
  }
</style>
</head>
<body>

<!-- LOGIN VIEW -->
<div id="login">
  <div class="login-card">
    <div class="login-brand">
      <div class="login-brand-mark">Administração</div>
      <div class="login-brand-name">Lucas Krausche</div>
      <div class="login-brand-sub">Painel de gestão do agente</div>
    </div>
    <div class="login-divider"></div>
    <label class="login-label" for="password">Senha de acesso</label>
    <input type="password" id="password" class="login-input" autofocus autocomplete="current-password">
    <button class="login-btn" id="loginBtn">Entrar</button>
    <div id="loginError" class="login-error" style="display:none"></div>
  </div>
</div>

<!-- APP -->
<div class="app" id="app">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">Administração</div>
      <div class="sidebar-brand-name">Lucas Krausche</div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Gestão</div>
      <div class="sidebar-link active" data-view="overview">Visão geral</div>
      <div class="sidebar-link" data-view="trials">Trials</div>
      <div class="sidebar-link" data-view="subscribers">Assinantes</div>
      <div class="sidebar-link" data-view="events">Eventos recentes</div>
    </nav>
    <div class="sidebar-footer">
      <span id="userBadge">Logado</span>
      <span class="sidebar-logout" id="logoutBtn">Sair</span>
    </div>
  </aside>

  <!-- Main content -->
  <main class="main">

    <!-- VIEW: OVERVIEW -->
    <section class="view active" data-view-content="overview">
      <div class="page-eyebrow">Diagnóstico — <span id="todayDate">Hoje</span></div>
      <h1 class="page-title">Visão geral</h1>
      <p class="page-subtitle">Estado atual do negócio, oportunidades imediatas e ações sugeridas para os próximos dias.</p>

      <div id="diagnostics"></div>

      <div class="metrics" id="metricsGrid">
        <div class="metric"><div class="metric-label">Carregando</div><div class="metric-value skeleton">000</div></div>
        <div class="metric"><div class="metric-label">Carregando</div><div class="metric-value skeleton">000</div></div>
        <div class="metric"><div class="metric-label">Carregando</div><div class="metric-value skeleton">000</div></div>
        <div class="metric"><div class="metric-label">Carregando</div><div class="metric-value skeleton">000</div></div>
      </div>

      <div class="section-head">
        <h2 class="section-title">Ações sugeridas</h2>
        <span class="section-subtitle">Priorizadas por impacto na receita</span>
      </div>
      <div class="actions" id="actionsList">
        <div class="action-row"><span class="action-priority skeleton">000</span><span class="action-text skeleton">carregando ação sugerida</span></div>
      </div>
    </section>

    <!-- VIEW: TRIALS -->
    <section class="view" data-view-content="trials">
      <div class="page-eyebrow">Cortesia</div>
      <h1 class="page-title">Trials</h1>
      <p class="page-subtitle">Conceda acesso temporário a leads qualificados, parceiros ou ações específicas. Cada trial vira oportunidade de conversão.</p>

      <div class="form-card">
        <div class="form-title">Conceder novo trial</div>
        <div class="form-subtitle">O assinante recebe acesso completo durante o período selecionado.</div>
        <form id="trialForm">
          <div class="form-grid">
            <div class="field">
              <label>Telefone (WhatsApp)</label>
              <input type="tel" id="trialPhone" placeholder="5511999999999" required>
            </div>
            <div class="field">
              <label>Nome</label>
              <input type="text" id="trialName" placeholder="Nome completo">
            </div>
            <div class="field">
              <label>Duração</label>
              <select id="trialDays">
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30" selected>30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>
            <button type="submit" class="btn">Conceder</button>
          </div>
          <div class="form-grid" style="margin-top: 14px; grid-template-columns: 1fr 1fr;">
            <div class="field">
              <label>Email (opcional)</label>
              <input type="email" id="trialEmail" placeholder="email@exemplo.com">
            </div>
            <div class="field">
              <label>Motivo (opcional)</label>
              <input type="text" id="trialReason" placeholder="Lead da campanha X, parceria, etc.">
            </div>
          </div>
          <div class="help-text">Telefone no formato com DDD, com ou sem o 55. O sistema normaliza automaticamente.</div>
        </form>
      </div>

      <div class="section-head">
        <h2 class="section-title">Trials concedidos</h2>
        <span class="section-subtitle" id="trialsCount">—</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Dias restantes</th>
              <th>Uso</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="trialsTableBody">
            <tr><td colspan="6" class="empty">Carregando…</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- VIEW: SUBSCRIBERS -->
    <section class="view" data-view-content="subscribers">
      <div class="page-eyebrow">Base de clientes</div>
      <h1 class="page-title">Assinantes</h1>
      <p class="page-subtitle">Todos os contatos que já estiveram no sistema, ativos ou não. Use a busca para localizar rapidamente.</p>

      <div class="toolbar">
        <input type="text" id="searchInput" placeholder="Buscar por nome, email ou telefone…">
        <select id="statusFilter">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="trial">Em trial</option>
          <option value="expired">Expirados</option>
          <option value="canceled">Cancelados</option>
          <option value="blocked">Bloqueados</option>
        </select>
        <div class="toolbar-spacer"></div>
        <span class="toolbar-count" id="subscribersCount">—</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Plano</th>
              <th>Mensagens</th>
              <th>Última atividade</th>
            </tr>
          </thead>
          <tbody id="subscribersTableBody">
            <tr><td colspan="7" class="empty">Carregando…</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- VIEW: EVENTS -->
    <section class="view" data-view-content="events">
      <div class="page-eyebrow">Atividade</div>
      <h1 class="page-title">Eventos recentes</h1>
      <p class="page-subtitle">Tudo que aconteceu no sistema — assinaturas criadas, renovações, cancelamentos, avisos, bloqueios.</p>

      <div class="toolbar">
        <select id="eventTypeFilter">
          <option value="all">Todos os tipos</option>
          <option value="subscribed">Novas assinaturas</option>
          <option value="renewed">Renovações</option>
          <option value="canceled">Cancelamentos</option>
          <option value="trial_granted">Trials concedidos</option>
          <option value="warning_sent">Avisos enviados</option>
          <option value="blocked">Bloqueios</option>
          <option value="hubla_webhook_received">Webhooks Hubla</option>
        </select>
        <div class="toolbar-spacer"></div>
        <span class="toolbar-count" id="eventsCount">—</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Telefone</th>
              <th>Evento</th>
              <th>Origem</th>
            </tr>
          </thead>
          <tbody id="eventsTableBody">
            <tr><td colspan="4" class="empty">Carregando…</td></tr>
          </tbody>
        </table>
      </div>
    </section>

  </main>
</div>

<!-- Modal de detalhes -->
<div class="modal-bg" id="modalBg">
  <div class="modal" id="modalContent">
    <div class="modal-head">
      <div>
        <div class="page-eyebrow" id="modalEyebrow">Assinante</div>
        <h2 class="modal-title" id="modalTitle">—</h2>
      </div>
      <button class="modal-close" id="modalClose">×</button>
    </div>
    <div id="modalBody"></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const API = '';
let token = localStorage.getItem('dash_token');

// ─── UTILS ───
function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }
function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(() => t.className = 'toast', 3500);
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtRelativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return \`\${mins}m atrás\`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return \`\${hours}h atrás\`;
  const days = Math.floor(hours / 24);
  if (days < 30) return \`\${days}d atrás\`;
  return fmtDate(iso);
}
function fmtPhone(p) {
  if (!p) return '—';
  const s = String(p);
  if (s.length === 13) return \`+\${s.slice(0,2)} (\${s.slice(2,4)}) \${s.slice(4,9)}-\${s.slice(9)}\`;
  if (s.length === 12) return \`+\${s.slice(0,2)} (\${s.slice(2,4)}) \${s.slice(4,8)}-\${s.slice(8)}\`;
  return s;
}
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-dashboard-token': token,
      ...(opts.headers || {})
    },
    credentials: 'include'
  });
  if (res.status === 401) {
    localStorage.removeItem('dash_token');
    location.reload();
    return;
  }
  return res.json();
}

// ─── LOGIN ───
async function login() {
  const password = $('#password').value;
  const btn = $('#loginBtn');
  btn.disabled = true;
  btn.textContent = 'Validando…';
  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('dash_token', token);
      document.cookie = \`dashboard_token=\${token}; path=/; max-age=28800; SameSite=Strict\`;
      showApp();
    } else {
      $('#loginError').textContent = 'Senha incorreta. Tenta de novo.';
      $('#loginError').style.display = 'block';
    }
  } catch (err) {
    $('#loginError').textContent = 'Erro de conexão. Tenta de novo.';
    $('#loginError').style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

function showApp() {
  $('#login').style.display = 'none';
  $('#app').classList.add('active');
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#todayDate').textContent = today.charAt(0).toUpperCase() + today.slice(1);
  loadOverview();
}

function logout() {
  localStorage.removeItem('dash_token');
  document.cookie = 'dashboard_token=; path=/; max-age=0';
  location.reload();
}

// ─── NAVIGATION ───
function switchView(name) {
  $$('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.viewContent === name));
  if (name === 'overview') loadOverview();
  if (name === 'trials') loadTrials();
  if (name === 'subscribers') loadSubscribers();
  if (name === 'events') loadEvents();
}

// ─── OVERVIEW ───
async function loadOverview() {
  const data = await api('/admin/api/overview');
  if (!data) return;

  // Insights
  const diagHTML = (data.insights || []).map(i => \`
    <div class="diagnostic \${i.type || ''}">
      <div class="diagnostic-label">\${i.type === 'critical' ? 'Atenção crítica' : i.type === 'warning' ? 'Atenção' : 'Oportunidade'}</div>
      <div class="diagnostic-title">\${i.title}</div>
      <div class="diagnostic-detail">\${i.detail}</div>
    </div>
  \`).join('');
  $('#diagnostics').innerHTML = diagHTML || '<div class="diagnostic opportunity"><div class="diagnostic-label">Tudo em ordem</div><div class="diagnostic-title">Nenhuma ação urgente no momento</div><div class="diagnostic-detail">O sistema está saudável. Continue acompanhando os eventos diariamente.</div></div>';

  // Metrics
  const s = data.stats;
  $('#metricsGrid').innerHTML = \`
    <div class="metric featured">
      <div class="metric-label">MRR atual</div>
      <div class="metric-value">R$<span class="metric-unit"> </span>\${(s.mrr || 0).toLocaleString('pt-BR')}</div>
      <div class="metric-context">\${s.active_subscribers} assinantes pagantes</div>
    </div>
    <div class="metric">
      <div class="metric-label">Assinantes ativos</div>
      <div class="metric-value">\${s.active_subscribers || 0}</div>
      <div class="metric-context">Base atual</div>
    </div>
    <div class="metric">
      <div class="metric-label">Em risco (3 dias)</div>
      <div class="metric-value">\${s.at_risk || 0}</div>
      <div class="metric-context">R$ \${(s.mrr_at_risk || 0).toLocaleString('pt-BR')}/mês em jogo</div>
    </div>
    <div class="metric">
      <div class="metric-label">Cancelamentos (7d)</div>
      <div class="metric-value">\${s.canceled_last_7_days || 0}</div>
      <div class="metric-context">Última semana</div>
    </div>
    <div class="metric">
      <div class="metric-label">Em trial</div>
      <div class="metric-value">\${s.trial_users || 0}</div>
      <div class="metric-context">Conversões potenciais</div>
    </div>
    <div class="metric">
      <div class="metric-label">Dormentes</div>
      <div class="metric-value">\${s.dormant || 0}</div>
      <div class="metric-context">Pagam mas não usam</div>
    </div>
  \`;

  // Actions
  const acts = data.actions || [];
  $('#actionsList').innerHTML = acts.length
    ? acts.map(a => \`
      <div class="action-row">
        <span class="action-priority \${a.priority}">\${a.priority}</span>
        <span class="action-text">\${a.text}</span>
        <span class="action-impact">\${a.impact}</span>
      </div>
    \`).join('')
    : '<div class="empty"><div class="empty-title">Nenhuma ação prioritária</div><div class="empty-detail">O sistema vai sugerir ações quando detectar oportunidades.</div></div>';
}

// ─── TRIALS ───
async function loadTrials() {
  const data = await api('/admin/api/trials');
  if (!data) return;
  const trials = data.trials || [];
  $('#trialsCount').textContent = trials.length === 0 ? 'Nenhum trial registrado' : \`\${trials.length} trial\${trials.length === 1 ? '' : 's'} registrado\${trials.length === 1 ? '' : 's'}\`;
  if (trials.length === 0) {
    $('#trialsTableBody').innerHTML = '<tr><td colspan="6" class="empty"><div class="empty-title">Nenhum trial ainda</div><div class="empty-detail">Use o formulário acima para conceder o primeiro.</div></td></tr>';
    return;
  }
  $('#trialsTableBody').innerHTML = trials.map(t => {
    const daysClass = t.days_remaining < 0 ? 'urgent' : t.days_remaining <= 3 ? 'urgent' : t.days_remaining <= 7 ? 'warn' : 'good';
    const daysText = t.days_remaining < 0 ? 'Expirado' : \`\${t.days_remaining}d restantes\`;
    return \`
      <tr>
        <td class="cell-name">\${t.name || '—'}<div class="cell-muted" style="font-size:11px;margin-top:2px">\${t.email || ''}</div></td>
        <td class="cell-mono">\${fmtPhone(t.phone)}</td>
        <td><span class="pill \${t.status}">\${t.status}</span></td>
        <td><span class="days-remaining \${daysClass}">\${daysText}</span></td>
        <td class="cell-mono">\${t.total_messages || 0}</td>
        <td>\${t.status === 'trial' ? \`<button class="btn-danger btn-sm" onclick="revokeTrial('\${t.phone}', '\${(t.name || t.phone).replace(/'/g, "\\\\'")}')">Revogar</button>\` : ''}</td>
      </tr>
    \`;
  }).join('');
}

async function createTrial(e) {
  e.preventDefault();
  const body = {
    phone: $('#trialPhone').value,
    name: $('#trialName').value,
    email: $('#trialEmail').value,
    days: $('#trialDays').value,
    reason: $('#trialReason').value
  };
  const res = await api('/admin/api/trials', { method: 'POST', body: JSON.stringify(body) });
  if (res && res.success) {
    toast('Trial concedido', 'success');
    $('#trialForm').reset();
    $('#trialDays').value = '30';
    loadTrials();
  } else {
    toast('Erro: ' + (res?.error || 'desconhecido'), 'error');
  }
}

async function revokeTrial(phone, name) {
  if (!confirm(\`Revogar trial de \${name}? O acesso será bloqueado imediatamente.\`)) return;
  const res = await api('/admin/api/trials/' + phone, { method: 'DELETE' });
  if (res && res.success) {
    toast('Trial revogado', 'success');
    loadTrials();
  } else {
    toast('Erro ao revogar', 'error');
  }
}

// ─── SUBSCRIBERS ───
let subscribersSearchTimer = null;
async function loadSubscribers() {
  const search = $('#searchInput').value;
  const status = $('#statusFilter').value;
  const params = new URLSearchParams({ search, status, page: 1, limit: 100 });
  const data = await api('/admin/api/subscribers?' + params);
  if (!data) return;
  const list = data.subscribers || [];
  $('#subscribersCount').textContent = \`\${data.total} encontrado\${data.total === 1 ? '' : 's'}\`;
  if (list.length === 0) {
    $('#subscribersTableBody').innerHTML = '<tr><td colspan="7" class="empty"><div class="empty-title">Nenhum resultado</div><div class="empty-detail">Tente ajustar os filtros.</div></td></tr>';
    return;
  }
  $('#subscribersTableBody').innerHTML = list.map(s => \`
    <tr style="cursor:pointer" onclick="openSubscriberDetail('\${s.phone}')">
      <td class="cell-name">\${s.name || '—'}</td>
      <td class="cell-mono">\${fmtPhone(s.phone)}</td>
      <td class="cell-muted">\${s.email || '—'}</td>
      <td><span class="pill \${s.status}">\${s.status}</span></td>
      <td class="cell-muted">\${s.plan || '—'}</td>
      <td class="cell-mono">\${s.total_messages || 0}</td>
      <td class="cell-muted">\${fmtRelativeTime(s.last_message_at)}</td>
    </tr>
  \`).join('');
}

async function openSubscriberDetail(phone) {
  const data = await api('/admin/api/subscribers/' + phone);
  if (!data || !data.subscriber) return;
  const s = data.subscriber;
  $('#modalTitle').textContent = s.name || fmtPhone(s.phone);
  $('#modalEyebrow').textContent = \`Status: \${s.status}\`;
  $('#modalBody').innerHTML = \`
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Telefone</div><div class="detail-value cell-mono">\${fmtPhone(s.phone)}</div></div>
      <div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">\${s.email || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Plano</div><div class="detail-value">\${s.plan || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Origem</div><div class="detail-value">\${s.source || '—'}</div></div>
      <div class="detail-item"><div class="detail-label">Iniciado em</div><div class="detail-value">\${fmtDate(s.subscription_started_at)}</div></div>
      <div class="detail-item"><div class="detail-label">Expira em</div><div class="detail-value">\${fmtDate(s.subscription_expires_at)}</div></div>
      <div class="detail-item"><div class="detail-label">Mensagens trocadas</div><div class="detail-value cell-mono">\${s.total_messages || 0}</div></div>
      <div class="detail-item"><div class="detail-label">Última atividade</div><div class="detail-value">\${fmtRelativeTime(s.last_message_at)}</div></div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:24px">
      \${s.status === 'blocked' ?
        \`<button class="btn" onclick="unblockSubscriber('\${s.phone}')">Reativar acesso</button>\` :
        \`<button class="btn-ghost btn" onclick="blockSubscriber('\${s.phone}')">Bloquear acesso</button>\`}
    </div>
    <div class="events-feed">
      <div class="events-feed-title">Histórico de eventos</div>
      \${(data.events || []).map(e => \`
        <div class="event-row">
          <span class="event-time">\${fmtDateTime(e.created_at)}</span>
          <span class="event-type">\${e.event_type}</span>
          <span class="event-source">\${e.source || '—'}</span>
        </div>
      \`).join('') || '<div class="empty-detail">Nenhum evento registrado.</div>'}
    </div>
  \`;
  $('#modalBg').classList.add('open');
}

async function blockSubscriber(phone) {
  const reason = prompt('Motivo do bloqueio?');
  if (!reason) return;
  const res = await api('/admin/api/subscribers/' + phone + '/block', { method: 'POST', body: JSON.stringify({ reason }) });
  if (res?.success) {
    toast('Assinante bloqueado', 'success');
    $('#modalBg').classList.remove('open');
    loadSubscribers();
  }
}

async function unblockSubscriber(phone) {
  if (!confirm('Reativar acesso desse assinante?')) return;
  const res = await api('/admin/api/subscribers/' + phone + '/unblock', { method: 'POST' });
  if (res?.success) {
    toast('Acesso reativado', 'success');
    $('#modalBg').classList.remove('open');
    loadSubscribers();
  }
}

// ─── EVENTS ───
async function loadEvents() {
  const type = $('#eventTypeFilter').value;
  const params = new URLSearchParams({ type, limit: 100 });
  const data = await api('/admin/api/events?' + params);
  if (!data) return;
  const events = data.events || [];
  $('#eventsCount').textContent = \`\${events.length} evento\${events.length === 1 ? '' : 's'}\`;
  if (events.length === 0) {
    $('#eventsTableBody').innerHTML = '<tr><td colspan="4" class="empty"><div class="empty-title">Nenhum evento</div></td></tr>';
    return;
  }
  $('#eventsTableBody').innerHTML = events.map(e => \`
    <tr>
      <td><span class="cell-mono cell-muted">\${fmtDateTime(e.created_at)}</span><div class="cell-muted" style="font-size:11px;margin-top:2px">\${fmtRelativeTime(e.created_at)}</div></td>
      <td class="cell-mono">\${e.phone !== 'system' && e.phone !== 'unknown' ? fmtPhone(e.phone) : '<span class="cell-muted">' + e.phone + '</span>'}</td>
      <td class="cell-name">\${e.event_type}</td>
      <td><span class="event-source">\${e.source || '—'}</span></td>
    </tr>
  \`).join('');
}

// ─── EVENT LISTENERS ───
$('#loginBtn').addEventListener('click', login);
$('#password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('#logoutBtn').addEventListener('click', logout);
$$('.sidebar-link').forEach(l => l.addEventListener('click', () => switchView(l.dataset.view)));
$('#trialForm').addEventListener('submit', createTrial);
$('#searchInput').addEventListener('input', () => {
  clearTimeout(subscribersSearchTimer);
  subscribersSearchTimer = setTimeout(loadSubscribers, 300);
});
$('#statusFilter').addEventListener('change', loadSubscribers);
$('#eventTypeFilter').addEventListener('change', loadEvents);
$('#modalClose').addEventListener('click', () => $('#modalBg').classList.remove('open'));
$('#modalBg').addEventListener('click', e => { if (e.target === $('#modalBg')) $('#modalBg').classList.remove('open'); });

// Auto-login se tem token
if (token) {
  showApp();
}
</script>
</body>
</html>
`;

console.log(`[INIT] Servidor v8.7 iniciando com MODE=${ENFORCEMENT_MODE}`);

// ─────────────────────────────────────────
// SYSTEM PROMPT (mantido)
// ─────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `Voce e Lucas Krausche, psicanalista clinico especializado em relacionamentos e crises conjugais. Voce atende TODOS os assinantes com a mesma profundidade e dedicacao: homens e mulheres.

REGRAS ABSOLUTAS:
1. NUNCA OFENDE, AGRIDE OU DESRESPEITA.
2. NUNCA BRIGA. Discordancia com firmeza e respeito.
3. SE NAO ENTENDEU, A FALHA E SUA.
4. SE FOR CORRIGIDO, RECONHECE E AGRADECE.
5. NUNCA REPETE o que ja disse se o LEAD reclamou.

LINGUAGEM ADAPTATIVA: Simples por padrao, tecnica quando LEAD demonstrar sofisticacao.

ARQUETIPOS (identificar mentalmente, nao rotular):
Masculinos:
- CUIDADOR/PROVEDOR: "Eu fiz tudo por ela"
- "PAI" DA PARCEIRA: "Ela me ve como amigo"
- DEPENDENTE EMOCIONAL: "Nao aguento ficar sozinho"
Femininos (equivalentes adaptados):
- CUIDADORA QUE CARREGA A RELACAO: "Eu sustento essa relacao sozinha"
- "MAE" DO PARCEIRO: "Ele depende de mim pra tudo, virei mae dele"
- DEPENDENTE EMOCIONAL: "Nao consigo sair dessa relacao"

PUBLICO FEMININO (REGRA CRITICA - NUNCA VIOLE):
- NUNCA diga que o servico e "para homens", "focado em homens" ou qualquer variacao.
- NUNCA sugira que uma assinante procure outro profissional por ser mulher.
- NUNCA diminua sua propria capacidade de atende-la ("nao tenho a mesma profundidade" e PROIBIDO).
- Os 3 pilares e a metodologia valem integralmente para mulheres: quem se anula na relacao precisa do mesmo caminho de reconstrucao, independente de genero.
- Com mulheres, adapte a linguagem: tom acolhedor e direto, sem girias masculinas (nada de "irmao", "mano", "cara"). Use o nome dela.
- Adapte exemplos e frases iconicas ao contexto dela (ex: "construcao de uma mulher que ele nao consiga ignorar").
- Se em conversas anteriores voce disse que atende so homens, PECA DESCULPAS com naturalidade, diga que houve um mal-entendido de configuracao e siga atendendo normalmente com total dedicacao.

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

ESTILO: Direto, firme E acolhedor. Coloquial brasileiro. Com homens pode usar girias (po, irmao, mano, cara); com mulheres, tom caloroso e proximo sem girias masculinas. Sem travessao, bullets ou listas.

ANALISE DE IMAGENS: Confirma, analisa microssinais (tom, emoji, tamanho), orienta.

ENCAMINHAMENTO MENTORIA: Casos graves (suicidio, violencia, vicios) -> mentoria 1:1 com Lucas. Em ideacao suicida: CVV 188.

ENGAJAMENTO: Sempre termine com algo que provoca retorno. Seja especifico.`;

// ─────────────────────────────────────────
// CONHECIMENTO DE PRODUTO: CDR (v8.6)
// Editar conteudo do curso AQUI, sem mexer na persona acima
// ─────────────────────────────────────────
const CDR_KNOWLEDGE = `
CONHECIMENTO DO PRODUTO: CODIGO DA RECONQUISTA (CDR)
Voce criou o CDR, seu produto de entrada com aulas em video + ebooks sobre reconquista. Muitos assinantes do Terapeuta 24h sao alunos do CDR. Use este conhecimento quando o assinante mencionar o curso, as aulas, tecnicas do metodo, ou estiver em processo de reconquista.

METODO CDR EM 3 FASES: Reaproximacao > Reconexao > Reconciliacao.
Essas fases sao a aplicacao pratica dos seus 3 pilares: a escassez emocional do CDR e o Distanciamento Estrategico; o upgrade de visual, status e mentalidade e a Evolucao Visivel.

ESTRUTURA DO CURSO:
- Modulo 1 (Boas-vindas): video de boas-vindas, formulario de diagnostico (preencher libera um presente), comunidade de avisos.
- Modulo 2 (aulas principais):
  Aula 1 Desvendando a Mente Feminina: termino nunca e do nada, e acumulo de pequenas decepcoes. Motivos principais: falta de comunicacao, falta de atencao, rotina, ciume excessivo, financas, traicao. 7 etapas do processo interno da mulher antes do termino (pode durar de 1 a 5 anos). Exercicio: comparar quem era o homem que conquistou vs quem se tornou.
  Aula 2 O Que Fazer e Nao Fazer: erros de 97% dos homens (promessas vazias, implorar, excesso de mensagens, presentes e surpresas, envolver terceiros, stalkear, provocar ciume do jeito errado). O que fazer: reduzir ou cortar contato, upgrade no visual, posts estrategicos, fortalecer status social, evolucao mental, independencia emocional.
  Aula 3 Botao da Saudade: ativar memorias positivas de forma indireta (lugares especiais, fotos, perfume, musicas, frases marcantes, livros) por dois canais: stories estrategicos e pessoas em comum.
  Aula 4 SMS de 3 Palavras (Gatilho do Perdao): a primeira mensagem de reabertura. 3 criterios: curta, emocao positiva ou neutra (nunca dor), sem pedir nada. Mandou uma, nao insiste e nao cobra resposta. Quem encerra a conversa por cima controla o jogo.
  Aula 5 Stories da Saudade (Instinto da Perda): o story e o canal mais forte, funciona mesmo bloqueado no WhatsApp. 3 tipos alternados: abundancia e prova social, transformacao, nostalgia indireta (musica, lugar, referencia sem legenda). Regra: transmitir homem em paz evoluindo, nunca homem destruido. NUNCA criar perfil fake nem furar bloqueio. Nunca postar indireta triste, vitimizacao ou cobranca de visualizacao.
  Aula 6 Mensagem da Recaida (frase de 6 palavras): so funciona depois que Replay e Stories prepararam o terreno. Gatilhos: loop aberto, memoria especifica, calor com dignidade, provocacao confiante. Depois de reabrir: manter leve, conduzir pro mundo real (cafe rapido, ligacao) e encerrar por cima.
  Aula 7 Reaproximacao: quando ela voltar a procurar, nao responder na hora, mostrar vida ativa. Nao falar do relacionamento nem pedir desculpas no inicio. Conversas leves, encerrar no auge, cocriar futuro atraves de perguntas. Demonstrar por atitudes que o motivo do termino nao se repete.
  Aula 8 A Ultima Carta (liberada apos 7 dias): carta de fechamento de ciclo em 6 atos na estrutura da Jornada do Heroi. Sentimento central: eu finalmente entendi. Maturidade e responsabilidade, nunca suplica. Enviar uma unica vez e silencio. So enviar se a transformacao for real.
  Aula 9 Presente Surpresa: oferta da sua mentoria individual de 1h (diagnostico completo do caso + direcionamento). Valor cheio R$3000; condicao especial para quem concluiu o curso: R$497, no Pix ou em ate 12x de aproximadamente R$50. Vagas limitadas.
- Modulo 3 Biblioteca de Mensagens da Reconquista: 100+ mensagens prontas por cenario (primeira mensagem pos-termino, reaproximacao, resposta fria, quando ela ignora, quando ela esta com outro, mensagens de atracao).
- Modulo 4 Instagram Magnetico: ebook de otimizacao de perfil (foto, bio, destaques, fotos de valor social).
- Modulo 5 WhatsApp da Reconquista: ebook com frases divididas por cenario.
- Modulo 6 Bonus (Protocolos da Reconquista): Frequencia da Reconquista (cronograma completo com aulas em audio por dia), Audios do Subconsciente, Efeito Replay (gatilho de memoria emocional validado por 8000+ alunos).

COMO USAR ESTE CONHECIMENTO:
- Oriente o aluno dentro do metodo e indique em qual aula ou modulo esta o aprofundamento (ex: isso ta detalhado na aula do Botao da Saudade, da uma revisada la; as frases prontas estao no Modulo 3).
- Reforce sempre os principios do metodo: dignidade, calma, nao insistir, encerrar por cima.
- NUNCA oriente furar bloqueio, criar perfil fake, vigiar, perseguir ou insistir apos recusa clara. O proprio metodo proibe. Se a ex deixou claro que nao quer contato, o caminho e Evolucao Visivel e seguir a propria vida.
- Nunca prometa resultado garantido de reconquista. O metodo aumenta as chances; cada caso e unico.
- Assinantes mulheres: o metodo vale integralmente, adapte os exemplos (stories, mensagens e evolucao visivel funcionam igual).
- Caso complexo pedindo direcionamento individual: mencione com naturalidade a mentoria da Aula 9, sem pressao.
- Duvida de acesso, login, ou material que nao abre: direcione pro suporte no WhatsApp, nao tente resolver tecnicamente.`;

// ─────────────────────────────────────────
// CONHECIMENTO DE PRODUTO: CDP (v8.7)
// Editar conteudo do curso feminino AQUI, sem mexer na persona acima
// ─────────────────────────────────────────
const CDP_KNOWLEDGE = `
CONHECIMENTO DO PRODUTO: CODIGO DA PAIXAO (CDP)
Voce criou o CDP (antes chamado Frases da Cleopatra), seu programa para o PUBLICO FEMININO: reconquista, reaquecimento da relacao e escolha do homem certo. A promessa central sao as 21 sementes da dopamina: frases para diferentes situacoes, mais uma palavra de cinco letras que potencializa o efeito. Muitas assinantes do Terapeuta 24h sao alunas do CDP. Use este conhecimento quando a assinante mencionar o curso, as frases, ou estiver em processo de reconquista/reaquecimento.

PUBLICO TIPICO DO CDP: mulheres de 36 a 50 anos. Situacoes mais comuns: ele esfriou mas ainda esta por perto; ele nao assume; terminou e ela quer reconquistar; ele some e volta; relacao longa que caiu na rotina. Dores principais: nao saber o que falar e ansiedade (nao conseguir se conter).

FUNDAMENTO DO METODO (aulas de abertura, SEMPRE vem antes das frases):
- Reapaixone-se por Voce Mesma: nenhuma frase funciona sem isso. A mulher se apaixonou e foi amada por quem ela ERA; com o tempo se anulou pra viver a vida do marido/filhos e perdeu a propria essencia. Resgatar hobbies, autocuidado, prioridade propria. Equivale a Evolucao Visivel e Reconquista da autoadmiracao.
- Autocomparacao vs Desejo: escolha do homem certo. Tendencia neurologica de repetir padroes dos pais (pai agressivo -> atrai homem agressivo e acha que sem conflito nao e amor). Identificar o que aceitar e o que nao aceitar; ser o que se busca (quer homem de valor -> cultivar os mesmos principios).

AS 6 FRASES NOMEADAS (Modulo 2, cada uma tem aula propria):
- FRASE DA ESTRELA: para quando ele pediu tempo, terminou ou se afastou bruscamente. Mensagem madura de fechamento: gratidao genuina + 2 memorias especificas do casal + desejar o bem ("sempre vou pensar no melhor de voce, se cuida"). Inverte o jogo: ela e quem encerra por cima. O homem so valoriza de verdade quando sente medo real de perder. Depois de mandar: NAO insistir, nao cobrar resposta.
- FRASE DA CACHOEIRA (ou da Afrodite): autoestima e feminilidade. Construcao de fora pra dentro: corpo, cabelo, autocuidado PARA SI MESMA, ate se olhar no espelho e pensar "que mulherao". Autoestima nao depende de homem nenhum.
- FRASE DA EXPOSICAO: criar conexao com gatilho mental de futuro + perguntas abertas e emocionais (fazer ele imaginar cenarios juntos; a mente nao separa real de imaginario).
- FRASE DA BANANA ASSADA: posicionamento diante do convite de ultima hora / interesse so sexual. Convite sem antecedencia = ela nao e prioridade. Homem respeita mulher que se posiciona; disponibilidade total mata o interesse. Frases prontas em duas vertentes (convite de ultima hora / posicionamento de valor).
- FRASES DO BIG BANG: provocacao e comunicacao sexual para tirar a relacao da rotina (falta de sexo e um dos maiores motivos de divorcio). O sexo comeca na mensagem de provocacao, nao na cama. SOMENTE para quem ja tem intimidade estabelecida.
- TELEPATIA EROTICA: perguntas para descobrir os desejos e fetiches do parceiro (qual foi nosso melhor sexo; o que voce mais gosta que eu faca; se tivesse uma hora pra fazer o que quisesse comigo). Exige maturidade alta dos dois; sem maturidade, nao aplicar.

OUTRAS AULAS DO MODULO 2: leitura de comportamento masculino, avaliacao de pretendente (30 perguntas abertas com criterio de avaliacao), 5 motivos que os homens nao assumem, Tecnica Infalivel Para Ele Te Assumir (posicionamento seco diante do joguinho dele: mostrar vida propria, nao aceitar cobranca sem compromisso — "pra gente se cobrar, a gente tem que ter alguma coisa"; ativa o medo de perder), conteudo de intimidade.

ESTRUTURA COMPLETA (45 itens):
- Modulo 1 Boas-vindas: aula de introducao, historia de origem, formulario de pesquisa.
- Modulo 2: 18 videoaulas (~3h), na ordem acima.
- Modulo 3: 13 e-books em 4 blocos: entender antes de aplicar; frases em versao escrita; conjuntos de perguntas (ex: 30 Perguntas do Bom Pretendente; 25 Perguntas para Aquecer o Relacionamento); guias praticos.
- Modulo 4 Bonus 1: 5 e-books de conteudo adulto (obsessao sexual masculina).
- Modulo 5 Bonus 2: 6 lives: dependencia emocional, apego ansioso e evitativo, energia masculina e feminina, parentizacao, o que fazer apos o termino, neurociencia da superacao.

ACOMPANHAMENTO: comunidade fechada no WhatsApp (equipe + conteudos do Lucas), Ricardao (IA 24h que analisa prints de conversa), suporte humano e formulario de mentoria individual (proximo passo para aprofundar).

COMO USAR ESTE CONHECIMENTO:
- Oriente a aluna dentro do metodo e indique onde esta o aprofundamento (ex: isso e a Frase da Estrela, revisa a aula; as perguntas prontas estao no Modulo 3).
- Sequencia importa: antes de qualquer frase, verificar se ela esta trabalhando a si mesma (Reapaixone-se por Voce Mesma). Frase sem reconstrucao pessoal nao sustenta resultado.
- Reforce os principios: posicionamento, dignidade, nao implorar, nao insistir, encerrar por cima, nao ficar 100% disponivel.
- Temas intimos (Big Bang, Telepatia): trate com naturalidade e maturidade clinica, sem constrangimento e sem vulgaridade. Para o conteudo explicito em si, direcione ao material do curso.
- NUNCA oriente perseguir, vigiar, criar perfil fake ou insistir apos recusa clara. Se ele deixou claro que nao quer contato, o caminho e a propria evolucao dela e seguir a vida.
- Nunca prometa resultado garantido. O metodo aumenta as chances; cada caso e unico.
- Alinhamento entre produtos: CDP e o espelho feminino do CDR (mesmos pilares: distanciamento estrategico, evolucao visivel, valorizacao propria). Homens -> referencie CDR; mulheres -> referencie CDP.
- Caso complexo pedindo direcionamento individual: mencione com naturalidade a mentoria individual (formulario na area de membros), sem pressao e sem inventar valores.
- Duvida de acesso, login ou material que nao abre: direcione pro suporte no WhatsApp.`;


const FULL_SYSTEM_PROMPT = SYSTEM_PROMPT_TEXT + '\n' + CDR_KNOWLEDGE + '\n' + CDP_KNOWLEDGE;


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
// PERSISTENCIA DE CONVERSAS (Supabase)
// Historico sobrevive a redeploys e e compartilhado entre canais
// ─────────────────────────────────────────
async function saveConversationMessage(phone, role, content, channel) {
  try {
    const text = typeof content === 'string' ? content : '[conteudo com imagem]';
    if (!text || !text.trim()) return;
    await supabase.from('conversations').insert({
      phone, role, content: text.slice(0, 20000), channel: channel || 'whatsapp'
    });
  } catch (err) {
    console.error('[CONV] Erro salvando mensagem:', err.message);
  }
}

function sanitizeHistory(history) {
  // Garante alternancia user/assistant exigida pela API
  const out = [];
  for (const m of history) {
    if (out.length === 0 && m.role !== 'user') continue;
    if (out.length > 0 && out[out.length - 1].role === m.role) {
      const prev = out[out.length - 1];
      if (typeof prev.content === 'string' && typeof m.content === 'string') {
        prev.content += '\n\n' + m.content;
      } else {
        out[out.length - 1] = { role: m.role, content: m.content };
      }
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

async function loadConversationHistory(phone) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY);
    if (error || !data || data.length === 0) return [];
    const chronological = data.reverse().map(m => ({ role: m.role, content: m.content }));
    const clean = sanitizeHistory(chronological);
    if (clean.length > 0) {
      console.log(`[CONV] Historico restaurado do banco: ${phone} (${clean.length} msgs)`);
    }
    return clean;
  } catch (err) {
    console.error('[CONV] Erro carregando historico:', err.message);
    return [];
  }
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

  if (!sessions[phone]) sessions[phone] = await loadConversationHistory(phone);
  sessions[phone].push({ role: 'user', content: userContent });
  sessions[phone] = smartTruncate(sessions[phone]);
  await saveConversationMessage(phone, 'user', (combinedText || '') + (images.length > 0 ? ' [imagem enviada]' : ''), 'whatsapp');

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
        system: [{ type: 'text', text: FULL_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: sanitizeHistory(sessions[phone])
      })
    });
    const data = await response.json();
    if (data.error) {
      await sendWhatsAppMessage(phone, 'Po, deu um problema tecnico. Pode reenviar?');
      return;
    }
    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar.';
    sessions[phone].push({ role: 'assistant', content: reply });
    await saveConversationMessage(phone, 'assistant', reply, 'whatsapp');

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
// ─────────────────────────────────────────
// TELEGRAM - Canal de backup
// TELEGRAM_OPEN_ACCESS=true -> acesso liberado sem identificacao (modo emergencia)
// Nao identificados usam chave provisoria tg_<chatid>; ao informarem email valido,
// o historico provisorio e migrado para o cadastro do assinante.
// ─────────────────────────────────────────
const TELEGRAM_OPEN_ACCESS = String(process.env.TELEGRAM_OPEN_ACCESS || 'false').toLowerCase() === 'true';
const pendingTelegramEmail = {};

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    const d = await r.json();
    if (!d.ok) console.error('[TELEGRAM] Erro enviando:', d.description);
    return d.ok;
  } catch (err) {
    console.error('[TELEGRAM] Erro sendMessage:', err.message);
    return false;
  }
}

async function findSubscriberByTelegram(chatId) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();
  if (error) return null;
  return data;
}

async function migrateTelegramHistory(chatId, phone) {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ phone })
      .eq('phone', 'tg_' + chatId);
    if (!error) {
      // limpa sessao provisoria em memoria para forcar reload unificado
      delete sessions['tg_' + chatId];
      console.log(`[TELEGRAM] Historico tg_${chatId} migrado para ${phone}`);
    }
  } catch (err) {
    console.error('[TELEGRAM] Erro migrando historico:', err.message);
  }
}

app.post('/webhook/telegram', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body?.message;
    if (!msg || !msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    console.log(`[TELEGRAM][${chatId}] Recebido: ${text.slice(0, 80)} | open_access=${TELEGRAM_OPEN_ACCESS}`);

    let subscriber = await findSubscriberByTelegram(chatId);

    // Comando /start
    if (text === '/start') {
      if (subscriber) {
        const nome = subscriber.name ? ', ' + subscriber.name.split(' ')[0] : '';
        await sendTelegramMessage(chatId,
          `Opa${nome}! Bom te ver por aqui. Pode falar comigo normalmente, nossa conversa continua de onde paramos.`);
      } else if (TELEGRAM_OPEN_ACCESS) {
        await sendTelegramMessage(chatId,
          'Opa! Aqui e o Terapeuta 24 Horas no Telegram. Pode falar comigo normalmente. ' +
          'Se voce ja e assinante e conversava comigo no WhatsApp, me manda o email da sua assinatura ' +
          'a qualquer momento que eu recupero nosso historico.');
      } else {
        pendingTelegramEmail[chatId] = Date.now();
        await sendTelegramMessage(chatId,
          'Opa! Aqui e o canal alternativo do Terapeuta 24 Horas. ' +
          'Pra eu te identificar e continuar nossa conversa de onde paramos, ' +
          'me manda o email que voce usou na assinatura.');
      }
      return;
    }

    // Tentativa de vinculo por email (sempre disponivel; obrigatoria so no modo fechado)
    if (!subscriber) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const found = await findSubscriberByEmail(emailMatch[0]);
        if (found) {
          await supabase.from('subscribers')
            .update({ telegram_chat_id: String(chatId) })
            .eq('phone', found.phone);
          await migrateTelegramHistory(chatId, found.phone);
          await logEvent(found.phone, 'telegram_linked', { chat_id: String(chatId) }, 'telegram');
          delete pendingTelegramEmail[chatId];
          const firstName = found.name ? found.name.split(' ')[0] : 'cara';
          await sendTelegramMessage(chatId,
            `Identifiquei voce, ${firstName}. Pode falar comigo por aqui normalmente. ` +
            'Nossa conversa continua de onde paramos.');
          return;
        }
        if (!TELEGRAM_OPEN_ACCESS) {
          await sendTelegramMessage(chatId,
            `Nao encontrei assinatura com esse email. Confere se e o mesmo email da compra. ` +
            `Se quiser assinar: ${RENEWAL_LINK}`);
          return;
        }
        // Open access: email nao encontrado -> registra e segue a conversa normalmente
        await logEvent('tg_' + chatId, 'telegram_email_not_found', { email: emailMatch[0] }, 'telegram');
      } else if (!TELEGRAM_OPEN_ACCESS) {
        pendingTelegramEmail[chatId] = Date.now();
        await sendTelegramMessage(chatId,
          'Antes de continuar, preciso confirmar seu acesso. Qual o email que voce usou pra assinar?');
        return;
      }
    }

    // Chave de contexto: telefone real (identificado) ou provisoria (open access)
    const phone = subscriber ? subscriber.phone : ('tg_' + chatId);

    // Enforcement so se aplica a identificados
    if (subscriber) {
      if (ENFORCEMENT_MODE === 'enforce_hard') {
        if (subscriber.status === 'blocked' || subscriber.status === 'canceled') {
          await sendTelegramMessage(chatId, `Seu acesso esta inativo. Pra reativar: ${RENEWAL_LINK}`);
          return;
        }
        const expiresAt = subscriber.subscription_expires_at ? new Date(subscriber.subscription_expires_at) : null;
        if (expiresAt && expiresAt < new Date() && subscriber.status === 'active') {
          await sendTelegramMessage(chatId, `Sua assinatura venceu. Renova aqui: ${RENEWAL_LINK}`);
          return;
        }
      } else if (ENFORCEMENT_MODE === 'observation') {
        if (['blocked', 'canceled'].includes(subscriber.status)) {
          await logEvent(phone, 'would_block', { reason: subscriber.status, mode: 'observation', channel: 'telegram' }, 'telegram');
        }
      }
    }

    // Historico compartilhado (indexado pela chave de contexto)
    if (!sessions[phone]) sessions[phone] = await loadConversationHistory(phone);
    sessions[phone].push({ role: 'user', content: text });
    sessions[phone] = smartTruncate(sessions[phone]);
    await saveConversationMessage(phone, 'user', text, 'telegram');
    if (subscriber) await incrementMessageCount(phone);

    // Claude
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
        system: [{ type: 'text', text: FULL_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: sanitizeHistory(sessions[phone])
      })
    });
    const data = await response.json();
    if (data.error) {
      console.error('[TELEGRAM] Erro Claude:', data.error);
      await sendTelegramMessage(chatId, 'Po, deu um problema tecnico aqui. Pode reenviar?');
      return;
    }
    const reply = data.content?.[0]?.text || 'Desculpa, nao consegui processar.';
    sessions[phone].push({ role: 'assistant', content: reply });
    await saveConversationMessage(phone, 'assistant', reply, 'telegram');

    if (data.usage) {
      const u = data.usage;
      const cost = (u.input_tokens / 1e6) * 1 + ((u.cache_read_input_tokens || 0) / 1e6) * 0.10 + (u.output_tokens / 1e6) * 5;
      console.log(`[TELEGRAM][${phone}] in=${u.input_tokens} out=${u.output_tokens} custo=$${cost.toFixed(5)}`);
    }

    await sendTelegramMessage(chatId, reply);
  } catch (err) {
    console.error('[TELEGRAM] Erro webhook:', err);
  }
});

// Registra webhook do Telegram automaticamente no boot
if (TELEGRAM_BOT_TOKEN) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `${PUBLIC_URL}/webhook/telegram`, allowed_updates: ['message'] })
  })
    .then(r => r.json())
    .then(d => console.log('[TELEGRAM] setWebhook:', d.ok ? 'OK' : d.description))
    .catch(err => console.error('[TELEGRAM] Erro setWebhook:', err.message));
} else {
  console.log('[TELEGRAM] TELEGRAM_BOT_TOKEN nao configurado - canal desativado');
}

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
    version: '8.7',
    enforcement_mode: ENFORCEMENT_MODE,
    metaConfigured: !!(META_TOKEN && META_PHONE_ID && META_VERIFY_TOKEN),
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_KEY),
    hublaTokenConfigured: !!HUBLA_TOKEN,
    telegramConfigured: !!TELEGRAM_BOT_TOKEN,
    telegramOpenAccess: TELEGRAM_OPEN_ACCESS,
    persistentConversations: true,
    cdrKnowledge: true,
    cdpKnowledge: true,
    inMemoryUsers: Object.keys(sessions).length,
    activeBuffers: Object.keys(messageBuffers).length,
    pendingEmails: Object.keys(pendingEmailRequest).length,
    dashboard: dashStats
  });
});


// ═══════════════════════════════════════════════════════════════
// DASHBOARD ROUTES - Adicionar ao servidor v8.1
// Coloque ANTES do "app.get('/', ...)" no index.js
// ═══════════════════════════════════════════════════════════════

const crypto = require('crypto');

// Senha de admin (definir no Railway)
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'lucas2026';

// Tokens de sessao em memoria (expira em 8h)
const sessionTokens = new Map();
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, data] of sessionTokens.entries()) {
    if (now - data.created > SESSION_DURATION_MS) {
      sessionTokens.delete(token);
    }
  }
}
setInterval(cleanExpiredSessions, 30 * 60 * 1000);

// Middleware de autenticacao
function requireAuth(req, res, next) {
  const token = req.cookies?.dashboard_token || req.headers['x-dashboard-token'];
  if (!token) return res.status(401).json({ error: 'no_token' });
  const session = sessionTokens.get(token);
  if (!session) return res.status(401).json({ error: 'invalid_token' });
  if (Date.now() - session.created > SESSION_DURATION_MS) {
    sessionTokens.delete(token);
    return res.status(401).json({ error: 'expired' });
  }
  next();
}

// Parser simples de cookies
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const [k, v] = c.trim().split('=');
      if (k && v) req.cookies[k] = decodeURIComponent(v);
    });
  }
  next();
});

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'senha_invalida' });
  }
  const token = generateToken();
  sessionTokens.set(token, { created: Date.now() });
  res.json({ token, expires_in: SESSION_DURATION_MS });
});

// ─────────────────────────────────────────
// HTML DO DASHBOARD
// ─────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(DASHBOARD_HTML);
});

app.get('/admin/', (req, res) => {
  res.redirect('/admin');
});

// ─────────────────────────────────────────
// API DO DASHBOARD
// ─────────────────────────────────────────

// Resumo / Visao Geral
app.get('/admin/api/overview', requireAuth, async (req, res) => {
  try {
    const { data: stats } = await supabase.from('v_dashboard_stats').select('*').single();

    // Diagnóstico inteligente baseado nos dados
    const insights = [];
    const actions = [];

    if (stats.at_risk > 0) {
      insights.push({
        type: 'warning',
        title: `${stats.at_risk} assinantes expiram nos próximos 3 dias`,
        detail: `Receita em risco: R$ ${(stats.at_risk * 37).toFixed(0)}/mês. Campanha proativa pode preservar a maioria.`
      });
      actions.push({
        priority: 'alta',
        text: 'Lançar campanha de renovação para os 20 em risco',
        impact: `+R$ ${(stats.at_risk * 37 * 0.7).toFixed(0)}/mês se 70% renovarem`
      });
    }

    if (stats.canceled_last_7_days > 5) {
      insights.push({
        type: 'critical',
        title: `${stats.canceled_last_7_days} cancelamentos na última semana`,
        detail: 'Padrão de churn elevado. Vale revisar a experiência do agente e abrir pesquisa de cancelamento.'
      });
      actions.push({
        priority: 'alta',
        text: 'Enviar pesquisa de cancelamento aos últimos canceladores',
        impact: 'Entender causa raiz do churn'
      });
    }

    // Adormecidos: pagam mas nunca falaram com o agente
    const { count: dormantCount } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('last_message_at', null);

    if (dormantCount > 50) {
      insights.push({
        type: 'opportunity',
        title: `${dormantCount} assinantes pagam mas nunca usaram o agente`,
        detail: `Receita "dormente": R$ ${(dormantCount * 37).toFixed(0)}/mês. Risco se descobrirem que esqueceram. Oportunidade se forem ativados.`
      });
      actions.push({
        priority: 'media',
        text: 'Campanha de ativação para assinantes dormentes',
        impact: 'Reduz risco de churn + aumenta engajamento'
      });
    }

    // Calcula MRR (R$ 37 fixo por enquanto)
    const mrr = (stats.active_subscribers || 0) * 37;

    res.json({
      stats: {
        ...stats,
        dormant: dormantCount,
        mrr,
        mrr_at_risk: stats.at_risk * 37
      },
      insights,
      actions
    });
  } catch (err) {
    console.error('[DASH] /overview erro:', err);
    res.status(500).json({ error: err.message });
  }
});

// Listar trials
app.get('/admin/api/trials', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('phone, name, email, plan, subscription_started_at, subscription_expires_at, total_messages, last_message_at, status')
      .in('status', ['trial', 'canceled', 'expired'])
      .eq('source', 'manual')
      .order('subscription_expires_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const enriched = data.map(t => {
      const expires = new Date(t.subscription_expires_at);
      const days = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      return { ...t, days_remaining: days };
    });

    res.json({ trials: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar trial
app.post('/admin/api/trials', requireAuth, async (req, res) => {
  try {
    const { phone: rawPhone, name, email, days, reason } = req.body;
    if (!rawPhone) return res.status(400).json({ error: 'Telefone é obrigatório' });

    let phone = String(rawPhone).replace(/[^0-9]/g, '');
    if (phone.length === 11 || phone.length === 10) phone = '55' + phone;
    if (phone.length < 12) return res.status(400).json({ error: 'Telefone inválido' });

    const durationDays = parseInt(days) || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('subscribers').upsert({
      phone,
      name: name || null,
      email: email || null,
      status: 'trial',
      plan: 'trial',
      subscription_started_at: new Date().toISOString(),
      subscription_renewed_at: new Date().toISOString(),
      subscription_expires_at: expiresAt,
      source: 'manual',
      warning_count: 0,
      last_warning_sent_at: null,
      blocked_at: null,
      blocked_reason: null
    }, { onConflict: 'phone' });

    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('events').insert({
      phone,
      event_type: 'trial_granted',
      event_data: { duration_days: durationDays, reason: reason || null },
      source: 'dashboard'
    });

    res.json({ success: true, phone, expires_at: expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revogar trial
app.delete('/admin/api/trials/:phone', requireAuth, async (req, res) => {
  try {
    const phone = req.params.phone;
    const { error } = await supabase
      .from('subscribers')
      .update({ status: 'canceled', blocked_reason: 'Trial revogado pelo admin' })
      .eq('phone', phone);
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('events').insert({
      phone, event_type: 'trial_revoked', source: 'dashboard'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar assinantes (com busca/filtro/paginação)
app.get('/admin/api/subscribers', requireAuth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('subscribers')
      .select('phone, name, email, status, plan, subscription_expires_at, total_messages, last_message_at, source', { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({
      subscribers: data,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhes de um assinante
app.get('/admin/api/subscribers/:phone', requireAuth, async (req, res) => {
  try {
    const phone = req.params.phone;
    const { data: subscriber } = await supabase
      .from('subscribers').select('*').eq('phone', phone).maybeSingle();
    if (!subscriber) return res.status(404).json({ error: 'não encontrado' });

    const { data: events } = await supabase
      .from('events').select('*').eq('phone', phone)
      .order('created_at', { ascending: false }).limit(30);

    res.json({ subscriber, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bloquear assinante
app.post('/admin/api/subscribers/:phone/block', requireAuth, async (req, res) => {
  try {
    const phone = req.params.phone;
    const { reason } = req.body;
    await supabase.from('subscribers').update({
      status: 'blocked',
      blocked_at: new Date().toISOString(),
      blocked_reason: reason || 'Bloqueado pelo admin'
    }).eq('phone', phone);
    await supabase.from('events').insert({ phone, event_type: 'blocked', event_data: { reason }, source: 'dashboard' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desbloquear / reativar
app.post('/admin/api/subscribers/:phone/unblock', requireAuth, async (req, res) => {
  try {
    const phone = req.params.phone;
    await supabase.from('subscribers').update({
      status: 'active',
      blocked_at: null,
      blocked_reason: null
    }).eq('phone', phone);
    await supabase.from('events').insert({ phone, event_type: 'unblocked', source: 'dashboard' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Feed de eventos recentes
app.get('/admin/api/events', requireAuth, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    if (type && type !== 'all') query = query.eq('event_type', type);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ events: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

console.log('[INIT] Dashboard routes ativas em /admin');


app.get('/', (req, res) => res.send(`Agente Lucas v8.7 - mode=${ENFORCEMENT_MODE}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor v8.7 rodando na porta ${PORT} | MODE=${ENFORCEMENT_MODE}`);
});
