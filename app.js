'use strict';

// Mini CTF de laboratorio. La validación y los tiempos viven en el servidor.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { LEVELS, validateCode } = require('./mobile-levels');

// Enrutador HTTP mínimo con APIs del núcleo de Node.js (sin paquetes externos).
// Solo sirve las rutas definidas aquí y los recursos permitidos de /public.
const routes = [];
const app = {
  get(pattern, ...handlers) { routes.push({ method: 'GET', pattern, handlers }); },
  post(pattern, ...handlers) { routes.push({ method: 'POST', pattern, handlers }); },
  listen(port, host, callback) { return http.createServer(handleRequest).listen(port, host, callback); },
};
function matchRoute(pattern, pathname) {
  const keys = [];
  const escaped = pattern.split('/').map(segment => {
    if (segment.startsWith(':')) { keys.push(segment.slice(1)); return '([^/]+)'; }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  const match = pathname.match(new RegExp('^' + escaped + '$'));
  if (!match) return null;
  return Object.fromEntries(keys.map((k, i) => [k, match[i + 1]]));
}
function appendCookie(res, header) {
  const old = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', old ? [...(Array.isArray(old) ? old : [old]), header] : [header]);
}
function decorateResponse(res) {
  res.status = function (code) { this.statusCode = code; return this; };
  res.send = function (value) {
    if (!this.hasHeader('Content-Type')) this.setHeader('Content-Type', 'text/html; charset=utf-8');
    this.end(String(value)); return this;
  };
  res.json = function (value) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.end(JSON.stringify(value)); return this;
  };
  res.sendFile = function (filepath) {
    fs.readFile(filepath, (err, contents) => {
      if (err) return this.status(404).send('Archivo no encontrado.');
      this.setHeader('Content-Type', 'text/html; charset=utf-8');
      this.end(contents);
    });
  };
  res.cookie = function (key, value, opts = {}) {
    let header = encodeURIComponent(key) + '=' + encodeURIComponent(value);
    header += '; Path=' + (opts.path || '/');
    if (opts.httpOnly) header += '; HttpOnly';
    if (opts.sameSite) header += '; SameSite=' + opts.sameSite;
    if (opts.secure) header += '; Secure';
    if (opts.maxAge !== undefined) header += '; Max-Age=' + Math.ceil(opts.maxAge / 1000);
    appendCookie(this, header);
  };
  res.clearCookie = function (key) { appendCookie(this, encodeURIComponent(key) + '=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'); };
}
async function handleRequest(req, res) {
  decorateResponse(res);
  req.ip = req.socket.remoteAddress || 'unknown';
  req.secure = Boolean(req.socket.encrypted);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/public/')) {
      if (req.method !== 'GET') return res.status(405).send('Método no permitido.');
      const name = pathname.slice('/public/'.length);
      if (!/^[a-z0-9_-]+\.(css|js|webp|png)$/.test(name)) return res.status(404).send('Archivo no encontrado.');
      const filepath = path.join(ROOT, 'public', name);
      const type = name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : name.endsWith('.webp') ? 'image/webp' : 'image/png';
      const data = await fs.promises.readFile(filepath).catch(() => null);
      if (!data) return res.status(404).send('Archivo no encontrado.');
      res.setHeader('Content-Type', type + '; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.end(data);
    }
    if (pathname.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString('utf8');
        if (body.length > 16000) return res.status(413).json({error:'Petición demasiado grande.'});
      }
      if (body && !(req.headers['content-type'] || '').startsWith('application/json')) {
        return res.status(415).json({error:'Se requiere JSON.'});
      }
      try { req.body = body ? JSON.parse(body) : {}; }
      catch { return res.status(400).json({error:'JSON inválido.'}); }
    }
    for (const route of routes) {
      if (req.method !== route.method) continue;
      const params = matchRoute(route.pattern, pathname);
      if (!params) continue;
      req.params = params;
      let index = 0;
      const next = () => {
        const handler = route.handlers[index++];
        if (handler) handler(req, res, next);
      };
      return next();
    }
    res.status(404).send('Ruta no encontrada.');
  } catch (err) {
    console.error('Error de petición:', err);
    if (!res.headersSent) res.status(500).json({error:'Error interno del servidor.'});
    else res.end();
  }
}

const PORT = Number(process.env.PORT) || 3011;
const ROOT = __dirname;
const DATA_DIR = process.env.CTF_DATA_DIR ? path.resolve(process.env.CTF_DATA_DIR) : path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'equipos.json');
const KEY_FILE = path.join(DATA_DIR, '.clave-servidor');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
const ADMIN_GENERATED = !process.env.ADMIN_PASSWORD;
const COOKIE_TEAM = 'ctf_equipo';
const COOKIE_ADMIN = 'ctf_docente';
const MAX_ANSWER_LENGTH = 12000;
const MAX_TEAM_NUMBER = 20;
const MAX_MISSION_MS = 45 * 60 * 1000;
// Clave PUBLICABLE, no es una clave secreta. También se puede sustituir con variables de entorno.
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://zgpfcmvjmjfaphtudmis.supabase.co').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_0uQxgvjB7S7eCSqssUlPnA_Brhj-zx7';
const SCORE_COLUMN = 'taller_3'; // Taller asignado a CODEXIA Mobile Challenge.


// Cada reto contiene un App.js inicial y reglas de verificación didáctica.

fs.mkdirSync(DATA_DIR, { recursive: true });
const serverKey = fs.existsSync(KEY_FILE)
  ? fs.readFileSync(KEY_FILE, 'utf8').trim()
  : crypto.randomBytes(32).toString('hex');
if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, serverKey + '\n', { mode: 0o600 });
let db = { version: 1, teams: [] };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!Array.isArray(db.teams)) throw new Error('La base de datos no contiene equipos válidos.');
}

function save() {
  const tmp = DB_FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DB_FILE);
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hmac(value) { return crypto.createHmac('sha256', serverKey).update(value).digest('hex'); }
function safeEqual(a, b) {
  const aa = Buffer.from(sha256(a), 'hex');
  const bb = Buffer.from(sha256(b), 'hex');
  return crypto.timingSafeEqual(aa, bb);
}
function getCookies(req) {
  const all = {};
  for (const item of (req.headers.cookie || '').split(';')) {
    const split = item.indexOf('=');
    if (split < 0) continue;
    const key = item.slice(0, split).trim();
    const value = item.slice(split + 1).trim();
    try { all[key] = decodeURIComponent(value); } catch { /* cookie malformada */ }
  }
  return all;
}
function setCookie(res, key, value, seconds, req) {
  res.cookie(key, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    path: '/',
    maxAge: seconds * 1000,
  });
}
function teamFromReq(req) {
  const token = getCookies(req)[COOKIE_TEAM];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const digest = sha256(token);
  return db.teams.find(t => t.tokenHash === digest) || null;
}
function adminFromReq(req) {
  const token = getCookies(req)[COOKIE_ADMIN];
  if (!token) return false;
  const chunks = token.split('.');
  if (chunks.length !== 4) return false;
  const [version, expiry, nonce, signature] = chunks;
  if (version !== 'v1' || !/^\d+$/.test(expiry) || Number(expiry) <= Date.now()) return false;
  if (!/^[a-f0-9]{24}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = hmac(version + '.' + expiry + '.' + nonce);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}
function requireAdmin(req, res, next) {
  if (!adminFromReq(req)) return res.status(401).json({ error: 'Acceso exclusivo del docente.' });
  next();
}
function htmlEsc(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function endedAt(t) { return t.completedAt || t.expiredAt || null; }
function elapsed(t, now = Date.now()) { return Math.max(0, Math.min(MAX_MISSION_MS, (endedAt(t) || now) - t.startedAt)); }
function scoreFromProgress(solvedCount) {
  // Cada minirreto vale 20 puntos. Sin bonos por rapidez, nunca más de 100.
  return Math.max(0, Math.min(100, Math.trunc(solvedCount) * 20));
}
function scoreForTeam(t) {
  return scoreFromProgress(t.solved.length);
}
// Solo se escribe scores.taller_3; se respetan las otras columnas.
// Peticiones equivalentes a supabase.from('scores').update({taller_3: puntos}).eq('equipo', n),
// con un filtro extra que impide reducir el mejor resultado.
async function supabaseRequest(method, endpoint, body, preference) {
  const response = await fetch(SUPABASE_URL + endpoint, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json',
      ...(body === undefined ? {} : {'Content-Type': 'application/json'}),
      ...(preference ? {Prefer: preference} : {}),
    },
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + text.slice(0, 240));
  return text ? JSON.parse(text) : null;
}
async function publishTaller3Score(equipo, score) {
  // La condición lt evita que un reintento o una petición tardía reduzca el score.
  const updateEndpoint = `/rest/v1/scores?equipo=eq.${equipo}&${SCORE_COLUMN}=lt.${score}&select=equipo,${SCORE_COLUMN}`;
  const write = () => supabaseRequest('PATCH', updateEndpoint, {[SCORE_COLUMN]: score}, 'return=representation');
  const read = () => supabaseRequest('GET', `/rest/v1/scores?select=equipo,${SCORE_COLUMN}&equipo=eq.${equipo}&limit=1`);
  const updated = await write();
  if (!Array.isArray(updated)) throw new Error('Supabase no confirmó la actualización del Taller 3.');
  if (updated.length) return;

  const existing = await read();
  if (!Array.isArray(existing)) throw new Error('No se pudo verificar el puntaje en Supabase.');
  if (existing.length) {
    if (Number(existing[0][SCORE_COLUMN]) >= score) return; // Ya había mejor nota.
    throw new Error('El registro existe, pero Supabase no permitió actualizar taller_3. Revisa RLS.');
  }

  // Si no existe el equipo en scores, créalo sin tocar puntajes de otros equipos.
  // ignore-duplicates evita sobrescribir una fila creada concurrentemente.
  await supabaseRequest('POST', '/rest/v1/scores?on_conflict=equipo',
    {equipo, [SCORE_COLUMN]:score}, 'resolution=ignore-duplicates,return=minimal');
  const afterInsert = await write(); // Resuelve carreras con otros intentos del mismo equipo.
  if (!Array.isArray(afterInsert)) throw new Error('Supabase no confirmó el puntaje.');
  if (afterInsert.length) return;
  const finalRows = await read();
  if (!Array.isArray(finalRows) || Number(finalRows[0]?.[SCORE_COLUMN]) < score) {
    throw new Error('No se pudo confirmar taller_3 después de crear el equipo.');
  }
}
const syncInFlight = new Set();
async function syncTeamScore(t) {
  if (!t.solved.length) return; // 0 puntos no modifica registros existentes.
  if (!Number.isInteger(t.teamNumber) || t.teamNumber < 1 || t.teamNumber > MAX_TEAM_NUMBER) return;
  const score = scoreForTeam(t);
  if ((t.syncedTaller3 || 0) >= score || syncInFlight.has(t.id)) return;
  syncInFlight.add(t.id);
  let succeeded = false;
  try {
    await publishTaller3Score(t.teamNumber, score);
    t.syncedTaller3 = Math.max(t.syncedTaller3 || 0, score);
    t.syncError = null;
    save();
    succeeded = true;
  } catch (error) {
    t.syncError = String(error.message || error);
    console.error('[Supabase] No se pudo actualizar taller_3 del Equipo ' + t.teamNumber + ' (' + score + '):', t.syncError);
    // La puntuación permanece en data/equipos.json y se reintenta en consultas posteriores.
  } finally {
    syncInFlight.delete(t.id);
    // No se pierden niveles completados mientras una petición estaba en curso.
    if (succeeded && (t.syncedTaller3 || 0) < scoreForTeam(t)) void syncTeamScore(t);
  }
}
function expireIfNeeded(t, now = Date.now()) {
  if (endedAt(t) || now - t.startedAt < MAX_MISSION_MS) return false;
  t.expiredAt = t.startedAt + MAX_MISSION_MS;
  save();
  void syncTeamScore(t);
  return true;
}
function createAttempt(teamNumber, res, req) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const t = {
    id: crypto.randomUUID(),
    name: 'Equipo ' + teamNumber,
    teamNumber,
    tokenHash: sha256(rawToken),
    startedAt: Date.now(),
    completedAt: null,
    expiredAt: null,
    currentLevel: 1,
    solved: [],
    syncedTaller3: 0,
  };
  db.teams.push(t);
  save();
  setCookie(res, COOKIE_TEAM, rawToken, 60 * 60 * 24 * 30, req);
  return t;
}
const wrongAttempts = new Map();
const adminAttempts = new Map();
function isRateLimited(map, key, max, windowMs) {
  const now = Date.now();
  const previous = (map.get(key) || []).filter(x => now - x < windowMs);
  if (previous.length >= max) { map.set(key, previous); return true; }
  previous.push(now);
  map.set(key, previous);
  return false;
}
function requireApiTeam(req, res, next) {
  const team = teamFromReq(req);
  if (!team) return res.status(401).json({ error: 'Primero inicia la misión con tu equipo.' });
  req.team = team;
  next();
}


app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

app.get('/api/state', (req, res) => {
  const team = teamFromReq(req);
  if (!team) return res.json({ started: false, serverNow: Date.now(), maxDurationMs: MAX_MISSION_MS });
  expireIfNeeded(team);
  if ((team.syncedTaller3 || 0) < scoreForTeam(team)) void syncTeamScore(team);
  const finishers = db.teams.filter(t => t.completedAt).sort((a, b) => elapsed(a) - elapsed(b) || a.completedAt - b.completedAt);
  const rank = team.completedAt ? finishers.findIndex(t => t.id === team.id) + 1 : null;
  res.json({
    started: true,
    serverNow: Date.now(),
    name: team.name,
    teamNumber: team.teamNumber,
    startedAt: team.startedAt,
    completedAt: team.completedAt,
    expiredAt: team.expiredAt || null,
    ended: Boolean(endedAt(team)),
    elapsedMs: elapsed(team),
    remainingMs: MAX_MISSION_MS - elapsed(team),
    maxDurationMs: MAX_MISSION_MS,
    currentLevel: team.currentLevel,
    solved: team.solved,
    score: scoreForTeam(team),
    syncedScore: team.syncedTaller3 || 0,
    syncError: team.syncError || null,
    pointsPerLevel: 20,
    maxScore: 100,
    rank,
  });
});

app.post('/api/start', (req, res) => {
  const existing = teamFromReq(req);
  if (existing) return res.json({ ok: true, alreadyStarted: true });
  // Number('') o Number(null) daría cero: la selección es obligatoria y explícita.
  const raw = req.body?.teamNumber;
  const number = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d{1,2}$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(number) || number < 1 || number > MAX_TEAM_NUMBER) {
    return res.status(400).json({ error: 'Selecciona un número de equipo del 1 al 20 para iniciar.' });
  }
  createAttempt(number, res, req);
  res.status(201).json({ ok: true });
});

app.post('/api/retry', requireApiTeam, (req, res) => {
  if (!endedAt(req.team)) return res.status(409).json({ error: 'Solo se puede repetir una misión terminada o vencida.' });
  createAttempt(req.team.teamNumber, res, req);
  res.status(201).json({ ok: true });
});

app.post('/api/answer', requireApiTeam, (req, res) => {
  const { team } = req;
  expireIfNeeded(team);
  const level = Number(req.body?.level);
  const code = req.body?.code;
  if (team.expiredAt) return res.status(409).json({ error: 'Se agotaron los 45 minutos de la misión.' });
  if (team.completedAt) return res.status(409).json({ error: 'Esta misión ya fue completada.' });
  if (!Number.isInteger(level) || level !== team.currentLevel) {
    return res.status(409).json({ error: 'Este reto no es el que tienes activo.' });
  }
  if (typeof code !== 'string' || code.length > MAX_ANSWER_LENGTH) {
    return res.status(400).json({ error: 'Envía el código App.js editado, de máximo 12 000 caracteres.' });
  }
  const attemptsKey = team.id;
  if (isRateLimited(wrongAttempts, attemptsKey, 25, 60_000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera un minuto antes de continuar.' });
  }
  const issue = validateCode(level, code, team.teamNumber);
  if (issue) return res.status(400).json({ error: issue });
  const solvedAt = Date.now();
  team.solved.push(solvedAt);
  team.currentLevel += 1;
  if (team.currentLevel === 6) team.completedAt = solvedAt;
  wrongAttempts.delete(attemptsKey);
  save();
  void syncTeamScore(team);
  res.json({ ok: true, completed: Boolean(team.completedAt), nextLevel: team.completedAt ? null : team.currentLevel, score: scoreForTeam(team) });
});

function challengeDocument(level, team) {
  const item = LEVELS[level - 1];
  const steps = item.steps.map((step, i) => `<li><span>${String(i+1).padStart(2, '0')}</span>${htmlEsc(step)}</li>`).join('');
  const hints = JSON.stringify(item.hints).replace(/</g, '\u003c');
  return `<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reto ${level} — ${htmlEsc(item.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/public/challenge.css">
</head><body>
<main class="challenge">
  <div class="eyebrow"><span class="live-led"></span> CODEXIA // REACT NATIVE <span class="challenge-no">RETO ${String(level).padStart(2, '0')} / 05 · +20 PTS</span></div>
  <h1>${htmlEsc(item.title)}</h1>
  <p class="story">${htmlEsc(item.story)}</p>
  <div class="mission-goal"><span class="objective-icon">⌁</span><div><strong>TU MISIÓN · ${item.minutes} MINUTOS SUGERIDOS</strong><p>${htmlEsc(item.goal.replace('tu número de equipo', 'Equipo ' + team.teamNumber))}</p></div></div>
  <div class="challenge-steps"><h2>PLAN DE ACCIÓN</h2><ol>${steps}</ol></div>
  <div class="editor-shell">
    <div class="editor-top"><div><span class="editor-indicator"></span> App.js <small>REACT NATIVE · CÓDIGO EDITABLE</small></div><span class="editor-ready">● LISTO PARA EDITAR</span></div>
    <label class="editor-label" for="codeEditor">EDITA EL CÓDIGO PARA REPARAR TU APP</label>
    <textarea id="codeEditor" spellcheck="false" aria-label="Código de la aplicación App.js" maxlength="12000" autocapitalize="off" autocomplete="off" autocorrect="off">${htmlEsc(item.starter)}</textarea>
    <div class="editor-bottom"><span id="editorStatus">Cambia solo las líneas indicadas.</span><button type="button" id="resetBtn">↺ RESTAURAR INICIO</button></div>
  </div>
  <div class="snack-info"><strong>01 · EDITA AQUÍ</strong><span>→</span><strong>02 · PRUÉBALO EN EXPO SNACK</strong><span>→</span><strong>03 · VALIDA Y GANA 20 PUNTOS</strong></div>
  <div class="code-actions"><a id="snackBtn" class="button-snack" href="https://snack.expo.dev/" target="_blank" rel="noopener noreferrer">↗ PROBAR MI APP EN EXPO SNACK</a><button type="button" id="copyBtn" class="button-copy">▣ COPIAR CÓDIGO</button></div>
  <p class="snack-caption">Se abre un Snack con <strong>tu código actual precargado</strong> y vista previa web. Prueba el resultado, regresa a esta pestaña y valida. No necesitas instalar nada.</p>
  <form id="answerForm" autocomplete="off"><div class="validate-label"><strong>¿TU APP YA FUNCIONA?</strong><span>20 PUNTOS DISPONIBLES</span></div><button type="submit" id="submitBtn" class="submit-validation">✓ VALIDAR MI CÓDIGO Y DESBLOQUEAR <span>↗</span></button><p class="feedback" id="feedback" role="status" aria-live="polite"></p></form>
  <div class="help-row"><button type="button" id="hintBtn">¿Necesitas una pista? <span>+</span></button><div id="hintText" class="hint-box" hidden></div></div>
  <div class="footer-meta">CÓDIGO REAL EN REACT NATIVE · VERIFICACIÓN DE CAMBIOS REQUERIDOS (NO COMPILACIÓN AUTOMÁTICA) · MÁX. 100 PUNTOS</div>
</main>
<script>
(function(){
  'use strict';
  const starter = document.getElementById('codeEditor').value;
  const editor = document.getElementById('codeEditor');
  const snackBtn = document.getElementById('snackBtn');
  const feedback = document.getElementById('feedback');
  const submitBtn = document.getElementById('submitBtn');
  const hints = ${hints};
  const key = 'codexia-mobile:${team.id}:${level}';
  let hintIndex = 0;
  try { const previous = sessionStorage.getItem(key); if (previous !== null) editor.value = previous; } catch (_) {}
  function updateSnack(){
    const params = new URLSearchParams({
      name: 'CODEXIA - Reto ${level} - ${htmlEsc(item.title)}',
      description: 'Reto CODEXIA Mobile Challenge ${level}/5',
      code: editor.value,
      platform: 'web', preview: 'true', theme: 'dark'
    });
    snackBtn.href = 'https://snack.expo.dev/?' + params.toString();
    document.getElementById('editorStatus').textContent = editor.value.length + ' caracteres · cambios listos para Expo Snack';
  }
  editor.addEventListener('input', function(){
    updateSnack();
    try { sessionStorage.setItem(key, editor.value); } catch (_) {}
  });
  updateSnack();
  document.getElementById('resetBtn').addEventListener('click', function(){
    if (!window.confirm('¿Restaurar el código inicial de este reto?')) return;
    editor.value = starter;
    try { sessionStorage.removeItem(key); } catch (_) {}
    updateSnack();
    feedback.textContent = 'Se restauró el código de inicio.';
    feedback.className = 'feedback';
  });
  document.getElementById('copyBtn').addEventListener('click', async function(){
    const button = this;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(editor.value);
      else { editor.focus(); editor.select(); if (!document.execCommand('copy')) throw new Error('Copia manual'); }
      button.textContent = '✓ CÓDIGO COPIADO';
    } catch (_) { editor.focus(); editor.select(); button.textContent = 'SELECCIONADO · CTRL+C'; }
    setTimeout(function(){ button.textContent = '▣ COPIAR CÓDIGO'; }, 2500);
  });
  document.getElementById('hintBtn').addEventListener('click', function(){
    const box = document.getElementById('hintText');
    if (hintIndex < hints.length) {
      hintIndex++;
      const p = document.createElement('p');
      p.textContent = 'PISTA ' + hintIndex + '/' + hints.length + ' · ' + hints[hintIndex-1];
      box.appendChild(p);
      box.hidden = false;
      this.querySelector('span').textContent = hintIndex === hints.length ? '✓' : '+';
      if (hintIndex === hints.length) this.disabled = true;
    }
  });
  document.getElementById('answerForm').addEventListener('submit', async function(event){
    event.preventDefault();
    submitBtn.disabled = true;
    feedback.textContent = 'Comprobando los cambios en tu App.js...';
    feedback.className = 'feedback';
    try {
      const response = await fetch('/api/answer', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ level: ${level}, code: editor.value })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al validar');
      feedback.textContent = result.completed ? '¡INCREÍBLE! 5 retos superados: 100/100 puntos.' : '¡RETO SUPERADO! +20 puntos. Abriendo el siguiente...';
      feedback.className = 'feedback good';
      editor.disabled = true;
      try { window.parent.postMessage({type:'cyberctf-updated'}, window.location.origin); } catch (_) {}
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'feedback bad';
      submitBtn.disabled = false;
    }
  });
})();
</script>
</body></html>`;
}

app.get('/reto/:level', (req, res) => {
  const team = teamFromReq(req);
  if (!team) return res.status(401).send('Primero inicia tu misión desde la página principal.');
  const level = Number(req.params.level);
  if (!Number.isInteger(level) || level < 1 || level > 5) return res.status(404).send('Reto inexistente.');
  expireIfNeeded(team);
  if (team.expiredAt) return res.status(410).send('La misión llegó al límite de 45 minutos. Puedes volver a intentar desde la portada.');
  if (level > team.currentLevel) return res.status(403).send('Este reto sigue bloqueado. Supera el anterior.');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.send(challengeDocument(level, team));
});

app.get('/api/scores', (req, res) => {
  (async () => {
    try {
      const url = SUPABASE_URL + '/rest/v1/scores?select=equipo,taller_1,taller_2,taller_3,taller_4,batalla_final,total&order=total.desc,equipo.asc';
      const response = await fetch(url, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      res.json({ scores: await response.json() });
    } catch (err) { res.status(502).json({ error: 'No se pudieron consultar los resultados de Supabase.' }); }
  })();
});
app.get('/resultados', (req, res) => res.sendFile(path.join(ROOT, 'public', 'resultados.html')));
app.get('/scores', (req, res) => res.sendFile(path.join(ROOT, 'public', 'resultados.html')));

app.get('/api/admin/session', (req, res) => res.json({ authenticated: adminFromReq(req) }));
app.post('/api/admin/login', (req, res) => {
  const address = req.ip || 'unknown';
  if (isRateLimited(adminAttempts, address, 12, 10 * 60_000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta nuevamente más tarde.' });
  }
  if (typeof req.body?.password !== 'string' || !safeEqual(req.body.password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Contraseña de docente incorrecta.' });
  }
  adminAttempts.delete(address);
  const expiry = String(Date.now() + 12 * 60 * 60 * 1000);
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = 'v1.' + expiry + '.' + nonce;
  setCookie(res, COOKIE_ADMIN, payload + '.' + hmac(payload), 12 * 60 * 60, req);
  res.json({ ok: true });
});
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  res.clearCookie(COOKIE_ADMIN, { path: '/' });
  res.json({ ok: true });
});
app.get('/api/admin/teams', requireAdmin, (req, res) => {
  const now = Date.now();
  for (const t of db.teams) expireIfNeeded(t, now);
  const finished = db.teams.filter(t => t.completedAt);
  const byTime = [...finished].sort((a, b) => elapsed(a) - elapsed(b) || a.completedAt - b.completedAt);
  const byArrival = [...finished].sort((a, b) => a.completedAt - b.completedAt || elapsed(a) - elapsed(b));
  const times = new Map(byTime.map((t, i) => [t.id, i + 1]));
  const arrivals = new Map(byArrival.map((t, i) => [t.id, i + 1]));
  const teams = db.teams.map(t => ({
    id: t.id,
    name: t.name,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    elapsedMs: elapsed(t, now),
    solvedCount: t.solved.length,
    currentLevel: t.currentLevel,
    expiredAt: t.expiredAt || null,
    score: scoreForTeam(t),
    rank: times.get(t.id) || null,
    arrival: arrivals.get(t.id) || null,
  })).sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return b.solvedCount - a.solvedCount || a.startedAt - b.startedAt;
  });
  res.json({ serverNow: now, total: teams.length, finished: finished.length, active: teams.length - finished.length, teams });
});
app.post('/api/admin/reset', requireAdmin, (req, res) => {
  if (req.body?.confirm !== 'REINICIAR') return res.status(400).json({ error: 'Debes confirmar escribiendo REINICIAR.' });
  db.teams = [];
  wrongAttempts.clear();
  save();
  res.clearCookie(COOKIE_TEAM, { path: '/' });
  res.json({ ok: true });
});


// Revisa vencimientos aun cuando un equipo deje de interactuar; reintenta
// publicar resultados guardados si Supabase estuvo momentáneamente inaccesible.
const maintenance = setInterval(() => {
  for (const team of db.teams) {
    expireIfNeeded(team);
    if ((team.solved.length || endedAt(team)) && (team.syncedTaller3 || 0) < scoreForTeam(team)) void syncTeamScore(team);
  }
}, 15_000);
maintenance.unref();

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    const addresses = Object.values(os.networkInterfaces()).flat()
      .filter(x => x && x.family === 'IPv4' && !x.internal).map(x => x.address);
    console.log('\n  CODEXIA MOBILE CHALLENGE / PREPARATORIA');
    console.log('  Alumnos: http://localhost:' + PORT);
    for (const address of [...new Set(addresses)]) console.log('  Red local: http://' + address + ':' + PORT);
    console.log('  Docente: http://localhost:' + PORT + '/admin');
    if (ADMIN_GENERATED) {
      console.log('\n  CONTRASEÑA TEMPORAL DEL DOCENTE: ' + ADMIN_PASSWORD);
      console.log('  (Para fijarla configura ADMIN_PASSWORD antes de iniciar.)');
    }
    console.log('  Datos: ' + DB_FILE + '\n');
  });
}
module.exports = app;
