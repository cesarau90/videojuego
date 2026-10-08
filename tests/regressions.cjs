'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const PHONE1 = '10000000-0000-4000-8000-000000000001';
const PHONE2 = '10000000-0000-4000-8000-000000000002';
const PHONE3 = '10000000-0000-4000-8000-000000000003';

function element() {
  const classes = new Set();
  const listeners = {};
  return {
    textContent: '', disabled: false, hidden: false, dataset: {}, style: {}, children: [],
    offsetWidth: 200, offsetLeft: 0, offsetTop: 0,
    classList: {
      add(...names) { names.forEach((n) => classes.add(n)); },
      remove(...names) { names.forEach((n) => classes.delete(n)); },
      contains(n) { return classes.has(n); },
      toggle(n, force) { const on = force === undefined ? !classes.has(n) : force; on ? classes.add(n) : classes.delete(n); return on; },
    },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    dispatch(type, event = {}) { (listeners[type] || []).forEach((fn) => fn(event)); },
    click() { if (!this.disabled) { this.clicks = (this.clicks || 0) + 1; this.dispatch('click'); this.onclick?.(); } },
    append(child) { this.children.push(child); },
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
    reset() {}, focus() { this.focused = true; },
    hasPointerCapture() { return false; }, releasePointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, right: 400, bottom: 400 }; },
  };
}

function environment() {
  let now = 100000;
  let timerId = 0;
  const timers = new Map();
  const intervals = new Map();
  const nodes = new Map();
  const get = (id) => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const screens = ['inicio', 'juego', 'pregunta', 'nivel-completado', 'transicion', 'victoria', 'derrota', 'espera'].map((id) => {
    const node = get('pantalla-' + id); node.id = 'pantalla-' + id; return node;
  });
  const screen = (id) => { screens.forEach((n) => n.classList.remove('activa')); get(id).classList.add('activa'); };
  screen('pantalla-inicio');
  const events = {};
  const storage = new Map();
  const context = vm.createContext({
    console: { log() {}, warn() {} }, URL, URLSearchParams,
    Date: class extends Date { static now() { return now; } },
    performance: { now: () => now },
    crypto: { randomUUID: () => PHONE1 },
    location: { href: 'https://example.test/index.html', protocol: 'https:', search: '?s=' + PHONE1 },
    navigator: { userAgent: 'Desktop', maxTouchPoints: 0 },
    innerWidth: 1280, innerHeight: 900, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false }),
    addEventListener(type, fn) { (events[type] ||= []).push(fn); },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { getItem: () => PHONE3 },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, due: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn) { const id = ++timerId; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    document: {
      getElementById: get, createElement: element, documentElement: element(),
      querySelector(selector) { if (selector === '.pantalla.activa') return screens.find((n) => n.classList.contains('activa')); return get(selector); },
      querySelectorAll: (selector) => selector === '.pantalla' ? screens : [],
      addEventListener() {},
    },
    Phaser: { Scene: class {} },
    fetch() { throw new Error('Unexpected network request'); },
  });
  context.window = context;
  const advance = (ms) => {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, t]) => t.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      now = next[1].due; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  };
  return { context, get, screen, advance, timers, intervals, storage, events, run: (code) => vm.runInContext(code, context) };
}

function gameEnvironment() {
  const env = environment();
  new vm.Script(read('game.js')).runInContext(env.context);
  env.context.started = 0;
  env.run('juegoPhaser = { scene: { keys: { EscenaJuego: { iniciarNivelActual() { started++; } } } } };');
  return env;
}

function channelEnvironment(script) {
  const env = environment();
  const handlers = {};
  const sent = [];
  const channel = {
    on(type, filter, fn) { handlers[filter.event] = fn; return this; },
    subscribe(fn) { fn('SUBSCRIBED'); return this; },
    send(message) { sent.push(message); return Promise.resolve(); },
  };
  env.context.supabase = { createClient: () => ({ channel: () => channel }) };
  env.context.QRCode = function () {};
  env.context.QRCode.CorrectLevel = { M: 0 };
  env.context.moves = [];
  env.context.attacks = [];
  env.context.controlJuego = {
    estado: () => ({ multi: true }), telefonos() {},
    mover: (...args) => env.context.moves.push(args),
    atacar: (...args) => env.context.attacks.push(args),
  };
  if (script === 'control.js') {
    env.buttons = ['A', 'B', 'X', 'Y'].map((letter) => { const button = element(); button.dataset.letter = letter; return button; });
    env.buttons.push(...['start', 'start2', 'scan', 'next', 'retry'].map((action) => { const button = element(); button.dataset.action = action; return button; }));
    env.context.document.querySelectorAll = (selector) => selector === 'button' ? env.buttons
      : selector === '[data-letter]' ? env.buttons.filter((b) => b.dataset.letter)
      : selector === '[data-action]' ? env.buttons.filter((b) => b.dataset.action) : [];
  }
  new vm.Script(read(script)).runInContext(env.context);
  return { ...env, sent, receive: (event, payload) => handlers[event]({ payload }) };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const response = (data) => ({ ok: true, json: async () => data });

// Estas pruebas ejecutan los scripts reales con DOM, reloj y canal simulados.
// No contactan Supabase ni requieren instalar paquetes.
test('Los cuatro scripts principales tienen sintaxis válida', () => {
  for (const file of ['game.js', 'remote-host.js', 'control.js', 'sin-zoom.js']) new vm.Script(read(file), { filename: file });
});

for (const reduced of [false, true]) {
  test('Continuar una sola vez aunque haya pulsaciones rápidas; movimiento reducido=' + reduced, () => {
    const env = gameEnvironment();
    env.context.matchMedia = () => ({ matches: reduced });
    for (const level of [0, 1]) {
      env.screen('pantalla-nivel-completado');
      env.run('continuarAlSiguienteNivel(); continuarAlSiguienteNivel(); continuarAlSiguienteNivel();');
      assert.equal(env.get('btn-siguiente-nivel').disabled, true);
      env.advance(2000);
      assert.equal(env.run('estado.indiceNivel'), level + 1);
      assert.equal(env.context.started, level + 1);
      assert.equal(env.get('btn-siguiente-nivel').disabled, false);
    }
  });
}

test('Continuar ignora otras pantallas y el último nivel', () => {
  const env = gameEnvironment();
  env.run('continuarAlSiguienteNivel();');
  assert.equal(env.run('transicionNivel.activa'), false);
  env.screen('pantalla-nivel-completado');
  env.run('estado.indiceNivel = 2; continuarAlSiguienteNivel();');
  env.advance(2000);
  assert.equal(env.run('estado.indiceNivel'), 2);
  assert.equal(env.context.started, 0);
});

for (const restartAt of [0, 250]) {
  test('Reiniciar cancela la transición pendiente a los ' + restartAt + ' ms', () => {
    const env = gameEnvironment();
    env.screen('pantalla-nivel-completado');
    env.run('continuarAlSiguienteNivel();');
    env.advance(restartAt);
    env.run('reiniciarEstado();');
    env.screen('pantalla-juego');
    env.advance(2000);
    assert.equal(env.run('estado.indiceNivel'), 0);
    assert.equal(env.context.started, 0);
    assert.equal(env.get('btn-siguiente-nivel').disabled, false);
  });
}

test('Solo dos mandos; reconectar no cambia el puesto y el tercero no puede enviar órdenes', () => {
  const env = channelEnvironment('remote-host.js');
  env.screen('pantalla-juego');
  for (const id of [PHONE1, PHONE2, PHONE3, PHONE1]) env.receive('hello', { id });
  const players = env.sent.filter((m) => m.event === 'state').at(-1).payload.players;
  assert.deepEqual(JSON.parse(JSON.stringify(players)), { [PHONE1]: 1, [PHONE2]: 2 });
  env.receive('move', { id: PHONE3, x: 1, y: 0, n: 1 });
  env.receive('attack', { id: PHONE3, letter: 'A' });
  env.receive('choose', { id: PHONE3, slot: 2 });
  env.receive('button', { id: PHONE3, action: 'scan' });
  assert.equal(env.context.moves.length, 0);
  assert.equal(env.context.attacks.length, 0);
  assert.equal(env.get('btn-escaner').clicks || 0, 0);
  env.receive('attack', { id: PHONE2, letter: 'A' });
  assert.deepEqual(env.context.attacks, [['A', 2]]);
});

test('Un puesto vencido se libera antes de admitir otro mando', () => {
  const env = channelEnvironment('remote-host.js');
  env.receive('hello', { id: PHONE1 }); env.receive('hello', { id: PHONE2 });
  env.advance(6000); env.receive('ping', { id: PHONE2 }); env.advance(1100);
  env.receive('hello', { id: PHONE3 });
  const players = env.sent.filter((m) => m.event === 'state').at(-1).payload.players;
  assert.deepEqual(JSON.parse(JSON.stringify(players)), { [PHONE2]: 2, [PHONE3]: 1 });
  assert.deepEqual(env.context.moves, [[0, 0, 1]]);
  env.receive('attack', { id: PHONE1, letter: 'A' });
  assert.equal(env.context.attacks.length, 0);
});

test('Cambiar de jugador intercambia los puestos sin duplicarlos', () => {
  const env = channelEnvironment('remote-host.js');
  env.receive('hello', { id: PHONE1 }); env.receive('hello', { id: PHONE2 });
  env.receive('choose', { id: PHONE1, slot: 2 });
  const players = env.sent.filter((m) => m.event === 'state').at(-1).payload.players;
  assert.deepEqual(JSON.parse(JSON.stringify(players)), { [PHONE1]: 2, [PHONE2]: 1 });
  assert.deepEqual(env.context.moves, [[0, 0, 1], [0, 0, 2]]);
});

test('El tercer mando muestra Sala llena, bloquea controles y puede entrar después', () => {
  const env = channelEnvironment('control.js');
  env.receive('state', { screen: 'pantalla-juego', mando: true, multi: true, players: { [PHONE1]: 1, [PHONE2]: 2 } });
  assert.match(env.get('connection').textContent, /Sala llena/);
  assert.ok(env.buttons.every((button) => button.disabled));
  const before = env.sent.length;
  env.buttons[0].dispatch('pointerdown', { preventDefault() {} });
  for (const fn of env.events.keydown) fn({ key: 'A', repeat: false });
  assert.equal(env.sent.length, before);
  env.advance(3000);
  for (const fn of env.intervals.values()) fn();
  assert.match(env.get('connection').textContent, /Sala llena/);
  assert.ok(env.sent.some((message) => message.event === 'hello'));
  env.receive('state', { screen: 'pantalla-juego', mando: true, multi: true, players: { [PHONE2]: 2, [PHONE3]: 1 } });
  assert.equal(env.get('connection').textContent, 'Conectado a la PC');
  assert.equal(env.buttons[0].disabled, false);
  env.buttons[0].dispatch('pointerdown', { preventDefault() {} });
  assert.equal(env.sent.at(-1).event, 'attack');
});

for (const failed of [false, true]) {
  test('Una respuesta vieja del ranking no altera el siguiente envío; error=' + failed, async () => {
    const env = gameEnvironment();
    const sends = [];
    env.context.fetch = (url, options) => {
      if (!options?.method) return Promise.resolve(response([]));
      const job = deferred(); sends.push({ ...job, body: JSON.parse(options.body) }); return job.promise;
    };
    env.run('idPartidaVictoria = "partida-A"; puntuacionVictoriaPendiente = 100;');
    const old = env.run('enviarPuntuacionGlobal("Anterior", false);');
    env.run('idPartidaVictoria = "partida-B"; puntuacionVictoriaPendiente = 400; guardandoPuntuacionGlobal = false;');
    const current = env.run('enviarPuntuacionGlobal("Actual", false);');
    assert.equal(sends[0].body.p_puntuacion, 100);
    assert.equal(sends[1].body.p_puntuacion, 400);
    failed ? sends[0].reject(new Error('late failure')) : sends[0].resolve(response([{ guardado: true, mejor_puntaje: 100 }]));
    await old;
    assert.equal(env.run('guardandoPuntuacionGlobal'), true);
    assert.equal(env.run('partidaGlobalGuardada'), false);
    assert.equal(env.get('btn-guardar-gamertag').textContent, 'Guardando…');
    assert.equal(env.storage.size, 0);
    sends[1].resolve(response([{ guardado: true, mejor_puntaje: 400 }]));
    await current;
    assert.equal(env.storage.get('eliminaMalware.gamertag'), 'Actual');
    assert.equal(env.run('partidaGlobalGuardada'), true);
  });
}

test('Reiniciar invalida el guardado pendiente de la victoria anterior', async () => {
  const env = gameEnvironment(); const job = deferred();
  env.context.fetch = () => job.promise;
  env.run('idPartidaVictoria = "partida-A"; puntuacionVictoriaPendiente = 100;');
  const saving = env.run('enviarPuntuacionGlobal("Anterior", false);');
  env.run('reiniciarEstado();');
  job.resolve(response([{ guardado: true, mejor_puntaje: 100 }]));
  await saving;
  assert.equal(env.run('idPartidaVictoria'), null);
  assert.equal(env.run('partidaGlobalGuardada'), false);
  assert.equal(env.storage.size, 0);
});

test('Solo la consulta más reciente actualiza la clasificación', async () => {
  const env = gameEnvironment(); const jobs = [];
  env.context.fetch = () => { const job = deferred(); jobs.push(job); return job.promise; };
  env.run('idPartidaVictoria = "partida-A"; dibujarTablaGlobal = (rows) => { globalThis.rows = rows; };');
  const first = env.run('cargarTablaGlobal();');
  const second = env.run('cargarTablaGlobal();');
  jobs[1].resolve(response([{ gamertag: 'Actual' }])); await second;
  jobs[0].resolve(response([{ gamertag: 'Anterior' }])); await first;
  assert.equal(env.context.rows[0].gamertag, 'Actual');
});

test('Un error vigente permite editar el gamertag y reintentar', async () => {
  const env = gameEnvironment();
  env.context.fetch = async () => { throw new Error('offline'); };
  env.run('idPartidaVictoria = "partida-A"; puntuacionVictoriaPendiente = 100;');
  await env.run('enviarPuntuacionGlobal("Jugador", false);');
  assert.equal(env.get('campo-gamertag').disabled, false);
  assert.equal(env.get('btn-guardar-gamertag').disabled, false);
  assert.equal(env.run('guardandoPuntuacionGlobal'), false);
});
