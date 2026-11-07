'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codexia-scores-test-'));
process.env.CTF_DATA_DIR = temporaryDir;
process.env.ADMIN_PASSWORD = 'ClaveDePrueba-2026';
const remoteScores = new Map();
const calls = [];
function seededRow(equipo, taller3 = 0) {
  return { equipo, taller_1:12, taller_2:34, taller_3:taller3, taller_4:56, batalla_final:78 };
}
remoteScores.set(3, seededRow(3)); // No perder columnas preexistentes.
function fullRow(r) {
  return { ...r, total:r.taller_1+r.taller_2+r.taller_3+r.taller_4+r.batalla_final };
}
const mockSupabase = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  assert.equal(req.headers.apikey, 'sb_publishable_test_only');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/rest/v1/scores') {
    const teamFilter = url.searchParams.get('equipo');
    const equipo = teamFilter?.startsWith('eq.') ? Number(teamFilter.slice(3)) : null;
    const requestBody = async () => {
      let data = '';
      for await (const chunk of req) data += chunk;
      return JSON.parse(data);
    };
    if (req.method === 'GET') {
      if (equipo !== null) {
        const row = remoteScores.get(equipo);
        return res.end(JSON.stringify(row ? [{equipo, taller_3:row.taller_3}] : []));
      }
      const rows = [...remoteScores.values()].map(fullRow)
        .sort((a,b) => b.total-a.total || a.equipo-b.equipo);
      return res.end(JSON.stringify(rows));
    }
    if (req.method === 'PATCH') {
      const body = await requestBody();
      const scoreFilter = url.searchParams.get('taller_3');
      assert.deepEqual(Object.keys(body), ['taller_3'], 'Solo se puede editar taller_3');
      assert.equal(scoreFilter, 'lt.' + body.taller_3, 'Evitar rebajar la mejor nota');
      const existing = remoteScores.get(equipo);
      const applied = Boolean(existing && existing.taller_3 < body.taller_3);
      calls.push({type:'update', equipo, score:body.taller_3, applied});
      if (applied) existing.taller_3 = body.taller_3;
      return res.end(JSON.stringify(applied ? [{equipo, taller_3:body.taller_3}] : []));
    }
    if (req.method === 'POST') {
      const body = await requestBody();
      assert.deepEqual(Object.keys(body).sort(), ['equipo','taller_3']);
      assert.equal(req.headers.prefer, 'resolution=ignore-duplicates,return=minimal');
      calls.push({type:'insert', equipo:body.equipo, score:body.taller_3});
      if (!remoteScores.has(body.equipo)) remoteScores.set(body.equipo, {
        equipo: body.equipo, taller_1:0, taller_2:0, taller_3:body.taller_3, taller_4:0, batalla_final:0,
      });
      res.statusCode = 201;
      return res.end('');
    }
  }
  res.statusCode = 404;
  res.end('{}');
});

function browser(host) {
  const cookies = new Map();
  return async (pathname, body) => {
    const headers = {};
    if (cookies.size) headers.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(host + pathname, {
      method: body === undefined ? 'GET' : 'POST', headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const cookieHeader = response.headers.get('set-cookie');
    if (cookieHeader) {
      const [key, ...parts] = cookieHeader.split(';')[0].split('=');
      if (parts.join('=')) cookies.set(key, parts.join('=')); else cookies.delete(key);
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return {status: response.status, data};
  };
}
async function waitFor(predicate, reason) {
  for (let n = 0; n < 80; n++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.fail(reason);
}
const { LEVELS, validateCode } = require('../mobile-levels');
function solution(level, teamNumber) {
  let code = LEVELS[level - 1].starter;
  if (level === 1) return code.replace('Hola, mundo', '¡Hola, CODEXIA!').replace('Equipo XX', 'Equipo ' + teamNumber);
  if (level === 2) return code.replace("backgroundColor: '#FFFFFF'", "backgroundColor: '#0F172A'")
    .replace("color: '#111827', fontSize: 20", "color: '#22D3EE', fontSize: 30");
  if (level === 3) return code.replace("avatar = '❔'", "avatar = '🚀'")
    .replace("nombre = 'SIN NOMBRE'", "nombre = 'Cosmo'").replace("poder = 'SIN PODER'", "poder = 'Velocidad'");
  if (level === 4) return code.replace("setMensaje('PENDIENTE')", "setMensaje('¡Poder desbloqueado!')");
  if (level === 5) return code.replace('actual + 1', 'actual + 5');
}

// Esta prueba usa un falso servidor de Supabase; nunca escribe en la base real.
test('Taller 3: penalización temporal, clave final, video y tabla global sin alterar otras columnas', async () => {
  await new Promise(resolve => mockSupabase.listen(0, '127.0.0.1', resolve));
  process.env.SUPABASE_URL = `http://127.0.0.1:${mockSupabase.address().port}/rest/v1/`;
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_only';
  const app = require('../app');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const host = `http://127.0.0.1:${server.address().port}`;
  const a = browser(host);
  const b = browser(host);
  const c = browser(host);
  const admin = browser(host);
  const originalNow = Date.now;
  try {
    const home = await fetch(host + '/');
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.match(html, /id="joinTeamNumber"/);
    assert.match(html, /id="startBtn" disabled/);
    assert.match(html, /EXPO SNACK/);
    assert.match(html, /YA CREAS/);
    assert.match(html, /MOBILE CHALLENGE/);
    assert.match(html, /id="scoresOpenBtn"/);
    assert.match(html, /id="scoresOverlay"/);
    assert.match(html, /id="scoresFilters"/);
    assert.match(html, /youtube-nocookie\.com\/embed\/C-SqjLy7K6Q/);
    assert.match(html, /https:\/\/youtu\.be\/C-SqjLy7K6Q/);
    assert.match(html, /id="secretPanel"/);
    assert.doesNotMatch(html, />1122</);
    assert.equal((await a('/api/state')).data.started, false);
    for (const teamNumber of [undefined, null, '', 0, 21, 2.5, 'abc', '99']) {
      assert.equal((await a('/api/start', {teamNumber})).status, 400);
    }
    assert.equal((await a('/reto/1')).status, 401);
    assert.equal((await a('/api/start', {name:'NO SE PERMITE NOMBRE LIBRE'})).status, 400);
    assert.equal((await a('/api/start', {teamNumber:3})).status, 201);
    assert.equal((await a('/api/state')).data.name, 'Equipo 3');
    assert.equal((await a('/api/state')).data.maxDurationMs, 2700000);
    assert.equal((await a('/api/state')).data.score, 0);
    assert.equal((await a('/api/state')).data.secretPassword, null);
    assert.equal((await a('/api/start', {teamNumber:4})).data.alreadyStarted, true);
    assert.equal((await a('/reto/5')).status, 403);
    assert.equal((await a('/api/answer', {level:1, code:'incorrecto'})).status, 400);
    for (let i = 1; i <= 5; i++) {
      const page = await a('/reto/' + i);
      assert.equal(page.status, 200);
      assert.match(page.data, /https:\/\/snack\.expo\.dev\//);
      assert.match(page.data, /id="codeEditor"/);
      assert.equal((await a('/api/answer', {level:i, code:LEVELS[i-1].starter})).status, 400);
      const answer = await a('/api/answer', {level:i, code:solution(i,3)});
      assert.equal(answer.status, 200);
      assert.equal(answer.data.score, i * 20); // Resueltos inmediatamente: 20, 40, 60, 80, 100
    }
    const completed = (await a('/api/state')).data;
    assert.equal(completed.ended, true);
    assert.ok(completed.completedAt);
    assert.equal(completed.expiredAt, null);
    assert.equal(completed.score, 100);
    assert.equal(completed.secretPassword, '1122', 'La clave solo aparece tras completar los 5 retos');
    await waitFor(() => remoteScores.get(3)?.taller_3 === 100, 'No se publicó calificación final');
    assert.equal((await a('/api/answer', {level:5, code:solution(5,3)})).status, 409);
    assert.equal((await a('/api/retry', {})).status, 201);
    const retryState = (await a('/api/state')).data;
    assert.equal(retryState.name, 'Equipo 3');
    assert.equal(retryState.solved.length, 0);
    assert.equal(retryState.ended, false);
    assert.equal(retryState.secretPassword, null, 'La clave se oculta al reintentar');
    assert.equal((await a('/api/retry', {})).status, 409);
    assert.equal((await a('/api/answer', {level:1, code:solution(1,3)})).status, 200);
    await waitFor(() => calls.some(r => r.type === "update" && r.equipo === 3 && r.score === 20), 'No se reenvió calificación inferior');
    assert.equal(remoteScores.get(3).taller_3, 100);
    // Simular el vencimiento de los 45 minutos sin esperar realmente.
    const baseTime = originalNow();
    Date.now = () => baseTime + 46 * 60000;
    const expired = (await a('/api/state')).data;
    assert.equal(expired.ended, true);
    assert.ok(expired.expiredAt);
    assert.equal(expired.elapsedMs, 2700000);
    assert.equal(expired.score, 20); // Se fija usando el instante del último reto resuelto.
    assert.equal(expired.secretPassword, null);
    assert.equal((await a('/api/answer', {level:2, code:solution(2,3)})).status, 409);
    Date.now = originalNow;
    assert.equal(remoteScores.get(3).taller_3, 100);

    assert.equal((await b('/api/start', {teamNumber:4})).status, 201);
    for (let i = 1; i <= 4; i++) assert.equal((await b('/api/answer', {level:i, code:solution(i,4)})).status, 200);
    const slowerBase = originalNow();
    Date.now = () => slowerBase + 44 * 60000 + 59 * 1000;
    const slower = await b('/api/answer', {level:5, code:solution(5,4)});
    assert.equal(slower.status, 200);
    assert.equal(slower.data.score, 81); // Cinco retos casi al minuto 45: banda 81-100, sin bono.
    assert.equal((await b('/api/state')).data.secretPassword, '1122');
    Date.now = originalNow;
    await waitFor(() => remoteScores.get(4)?.taller_3 === 81, 'No se publicó el score temporal de 81');

    assert.equal((await c('/api/start', {teamNumber:20})).status, 201);
    const blankStarted = originalNow();
    Date.now = () => blankStarted + 45 * 60000 + 1;
    const blankExpired = (await c('/api/state')).data;
    assert.equal(blankExpired.score, 0);
    assert.ok(blankExpired.expiredAt);
    assert.equal(blankExpired.secretPassword, null);
    assert.equal((await c('/reto/1')).status, 410);
    Date.now = originalNow;
    assert.equal(remoteScores.has(20), false, 'No se publica puntuación cero a Supabase');
    assert.equal((await c('/api/retry', {})).status, 201);

    const publicPage = await fetch(host + '/resultados');
    assert.equal(publicPage.status, 200);
    const publicMarkup = await publicPage.text();
    assert.match(publicMarkup, /Mobile Challenge/);
    assert.match(publicMarkup, /CLASIFICACIÓN FINAL/);
    assert.match(publicMarkup, /id="resultRows"/);
    assert.match(publicMarkup, /TALLER 3/);
    assert.match(publicMarkup, /BATALLA FINAL/);
    assert.match(publicMarkup, /\/public\/resultados\.js/);
    assert.equal((await fetch(host + '/public/resultados.js')).status, 200);
    const scorePage = await fetch(host + '/scores');
    assert.equal(scorePage.status, 200);
    assert.match(await scorePage.text(), /SCORES/);
    const scoreScript = await fetch(host + '/public/scores.js');
    assert.equal(scoreScript.status, 200);
    const scriptText = await scoreScript.text();
    for (const column of ['total', 'taller_1', 'taller_2', 'taller_3', 'taller_4', 'batalla_final']) {
      assert.ok(scriptText.includes("key:'" + column + "'"), 'Falta filtro: ' + column);
    }
    const ranking = await c('/api/scores');
    assert.equal(ranking.status, 200);
    assert.deepEqual(ranking.data.scores.map(x=>x.equipo), [3,4]);
    assert.equal(ranking.data.scores[0].taller_3, 100);
    assert.equal(ranking.data.scores[1].taller_3, 81);
    assert.equal(ranking.data.scores[0].batalla_final, 78, 'No alterar Batalla Final');
    assert.equal(ranking.data.scores[0].taller_1, 12, 'No alterar Taller 1');
    assert.equal(ranking.data.scores[0].taller_2, 34, 'No alterar Taller 2');
    assert.equal(ranking.data.scores[0].taller_4, 56, 'No alterar Taller 4');
    assert.deepEqual(calls.filter(c=>c.type==='insert').map(c=>c.equipo).sort((a,b)=>a-b),[4]);
    assert.match(scriptText, /TALLER 3 · MOBILE/);
    assert.equal((await admin('/api/admin/teams')).status, 401);
    assert.equal((await admin('/api/admin/login', {password:'ClaveDePrueba-2026'})).status, 200);
    const adminResponse = await admin('/api/admin/teams');
    assert.equal(adminResponse.status, 200);
    assert.ok(adminResponse.data.teams.length >= 5);
    assert.equal(validateCode(1, solution(1,4), 3) !== null, true, 'El reto 1 exige el equipo de la sesión');
    assert.equal(validateCode(2, LEVELS[1].starter, 3) !== null, true);
    assert.equal(validateCode(5, solution(5,3), 3), null); // Se guardan los intentos, no solo los equipos.
  } finally {
    Date.now = originalNow;
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => mockSupabase.close(resolve));
    fs.rmSync(temporaryDir, {recursive:true, force:true});
  }
});
