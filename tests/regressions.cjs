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
  const descendants = new Map();
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
    querySelector(selector) { if (!descendants.has(selector)) descendants.set(selector, element()); return descendants.get(selector); },
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


function aimEnvironment(onTarget = false, keyboardRight = false) {
  const env = gameEnvironment();
  env.screen('pantalla-juego');
  env.context.onTarget = onTarget;
  env.context.keyboardRight = keyboardRight;
  env.run(
    'estado.modoMando = true; estado.juegoActivo = true; ' +
    'Phaser.Math = { Clamp: (value, min, max) => Math.min(max, Math.max(min, value)) }; ' +
    'globalThis.aimScene = new EscenaJuego(); ' +
    'aimScene.areaJuego = { xMin: 0, xMax: 5000, yMin: 0, yMax: 5000 }; ' +
    'const graphic = { setVisible() {}, clear() {}, lineStyle() {}, strokeCircle() {}, lineBetween() {} }; ' +
    'aimScene.jugadores = [{ mira: { x: 500, y: 500 }, ejes: { x: 0, y: 0, recibido: 0 }, velocidad: { x: 0, y: 0 }, grafico: graphic, texto: { setVisible() {}, setPosition() {} } }]; ' +
    'aimScene.flechasControl = { right: { isDown: keyboardRight }, left: { isDown: false }, up: { isDown: false }, down: { isDown: false } }; ' +
    'aimScene.teclasJugador2 = {}; aimScene.mundo = { bringToTop() {} }; ' +
    'aimScene.objetivoControl = () => onTarget ? {} : null;'
  );
  return env;
}

function travel(env, x, y = 0) {
  env.run('aimScene.moverControl(' + x + ', ' + y + ');');
  for (let frame = 0; frame < 10; frame++) {
    env.advance(20);
    env.run('aimScene.actualizarControlMira(20);');
  }
  return env.run('aimScene.jugadores[0].mira.x - 500');
}

test('El joystick responde a inclinación media y cruza el tablero más rápido', () => {
  const half = travel(aimEnvironment(), 0.5);
  const full = travel(aimEnvironment(), 1);
  assert.ok(full / 0.2 > 700, 'velocidad sostenida demasiado baja');
  assert.ok(half / full > 0.4, 'inclinación media demasiado lenta');
  const targeted = travel(aimEnvironment(true), 1);
  assert.ok(targeted / full > 0.6 && targeted / full < 0.8, 'freno al apuntar excesivo');
});

test('Soltar y perder mensajes detienen la mira; el teclado conserva su velocidad', () => {
  const env = aimEnvironment();
  travel(env, 1);
  const before = env.run('aimScene.jugadores[0].mira.x');
  env.run('aimScene.moverControl(0, 0); aimScene.actualizarControlMira(20);');
  assert.equal(env.run('aimScene.jugadores[0].mira.x'), before);
  env.run('aimScene.moverControl(1, 0);');
  env.advance(700);
  env.run('aimScene.actualizarControlMira(20);');
  assert.equal(env.run('aimScene.jugadores[0].mira.x'), before);
  assert.equal(travel(aimEnvironment(false, true), 0), 120);
});

test('El mando necesita menos recorrido del pulgar y envía reposo al soltar', () => {
  const env = channelEnvironment('control.js');
  env.receive('state', { screen: 'pantalla-juego', mando: true, multi: true, players: { [PHONE3]: 1 } });
  const zone = env.get('.movement');
  const pointer = (x) => ({ pointerId: 1, clientX: x, clientY: 200, preventDefault() {} });
  zone.dispatch('pointerdown', pointer(200));
  assert.equal(env.sent.filter((m) => m.event === 'move').length, 0, 'apoyar el dedo no debe mover');
  zone.dispatch('pointermove', pointer(202));
  assert.equal(env.sent.filter((m) => m.event === 'move').length, 0, 'mantener una zona muerta');
  zone.dispatch('pointermove', pointer(220));
  const move = env.sent.filter((m) => m.event === 'move').at(-1);
  assert.ok(move.payload.x >= 0.45 && move.payload.x <= 0.6);
  assert.equal(move.payload.y, 0);
  zone.dispatch('pointerup', pointer(220));
  assert.equal(env.sent.at(-1).payload.x, 0);
  env.advance(300);
  assert.equal(env.sent.at(-1).payload.x, 0);
});


test('Medio mantiene los niveles originales; fácil y difícil ajustan todos los niveles', () => {
  const env = gameEnvironment();
  for (let i = 0; i < 3; i++) {
    env.run('estado.dificultad = "medio";');
    const base = JSON.parse(env.run('JSON.stringify(NIVELES[' + i + '])'));
    assert.deepEqual(JSON.parse(env.run('JSON.stringify(obtenerConfiguracionNivel(' + i + '))')), base);
    const mediumBoss = JSON.parse(env.run('JSON.stringify(obtenerConfiguracionJefe(' + i + '))'));
    env.run('seleccionarDificultad("facil");');
    const easy = JSON.parse(env.run('JSON.stringify(obtenerConfiguracionNivel(' + i + '))'));
    const easyBoss = JSON.parse(env.run('JSON.stringify(obtenerConfiguracionJefe(' + i + '))'));
    env.run('seleccionarDificultad("dificil");');
    const hard = JSON.parse(env.run('JSON.stringify(obtenerConfiguracionNivel(' + i + '))'));
    const hardBoss = JSON.parse(env.run('JSON.stringify(obtenerConfiguracionJefe(' + i + '))'));
    assert.equal(easy.virusRequeridos, i === 2 ? 20 : base.virusRequeridos);
    assert.equal(hard.virusRequeridos, base.virusRequeridos);
    assert.ok(easy.tiempoVidaVirus > base.tiempoVidaVirus && hard.tiempoVidaVirus < base.tiempoVidaVirus);
    assert.ok(easy.tiempoVidaVirusMando > base.tiempoVidaVirusMando && hard.tiempoVidaVirusMando < base.tiempoVidaVirusMando);
    assert.ok(easy.tiempoAparicion > base.tiempoAparicion && hard.tiempoAparicion < base.tiempoAparicion);
    assert.ok(easy.velocidadMax < base.velocidadMax && hard.velocidadMax > base.velocidadMax);
    assert.ok(easy.maxElementos < base.maxElementos && hard.maxElementos > base.maxElementos);
    assert.ok(easyBoss.vidaMaxima < mediumBoss.vidaMaxima && hardBoss.vidaMaxima > mediumBoss.vidaMaxima);
    assert.ok(easyBoss.tiempoAtaqueMando > mediumBoss.tiempoAtaqueMando && hardBoss.tiempoAtaqueMando < mediumBoss.tiempoAtaqueMando);
    assert.deepEqual(JSON.parse(env.run('JSON.stringify(NIVELES[' + i + '])')), base, 'no mutar los niveles base');
  }
});

test('Selección inválida o durante la partida no altera la dificultad; reintentar la conserva', () => {
  const env = gameEnvironment();
  env.run('seleccionarDificultad("facil"); seleccionarDificultad("constructor");');
  assert.equal(env.run('estado.dificultad'), 'facil');
  assert.equal(env.storage.get('eliminaMalware.dificultad'), 'facil');
  env.screen('pantalla-juego');
  env.run('seleccionarDificultad("dificil"); reiniciarEstado();');
  assert.equal(env.run('estado.dificultad'), 'facil');
  assert.equal(env.run('dificultadActual().escaner'), 3);
  env.run('estado.dificultad = "dato-inválido";');
  assert.equal(env.run('dificultadActual().nombre'), 'Medio');
});

function prepareStart(env) {
  env.run('juegoPhaser.scene.stop = () => {}; juegoPhaser.scene.start = () => {}; ' +
    'sincronizarClaseVistaMovil = () => {}; ajustarCanvasEscritorio = () => {}; programarAjusteCanvasEscritorio = () => {}; esVistaMovil = () => false;');
}

test('Los cinco modos arrancan en la dificultad seleccionada y reintentar conserva el modo', () => {
  const env = gameEnvironment(); prepareStart(env);
  for (const difficulty of ['facil', 'medio', 'dificil']) {
    for (const mode of ['normal', 'mando', '2j', 'duo', 'hibrido']) {
      env.screen('pantalla-inicio'); env.run('seleccionarDificultad(' + JSON.stringify(difficulty) + ');');
      env.run('iniciarJuegoDesdeCero(' + JSON.stringify(mode) + ');');
      assert.equal(env.run('estado.dificultad'), difficulty);
      assert.equal(env.run('estado.modoMando'), ['mando','2j','hibrido'].includes(mode));
      assert.equal(env.run('estado.multijugador'), mode === '2j');
      assert.equal(env.run('estado.modoHibrido'), mode === 'hibrido');
      const scene = env.run('new EscenaJuego()');
      assert.equal(scene.jugadorActivo(1), mode === '2j');
      env.run('iniciarJuegoDesdeCero();');
      assert.equal(env.run('estado.modoHibrido'), mode === 'hibrido');
      assert.equal(env.run('estado.dificultad'), difficulty);
    }
  }
});

test('La sala híbrida espera un teléfono, cancela la cuenta al perderlo y arranca con mando + mouse', () => {
  const env = gameEnvironment();
  env.run('window.controlJuego.remoto = true; esVistaMovil = () => false; ' +
    'iniciarJuegoDesdeCero = (mode) => { globalThis.startedMode = mode; cerrarSalaEspera2j(); }; abrirSalaEsperaHibrida();');
  assert.equal(env.run('window.controlJuego.estado().hybrid'), true);
  assert.equal(env.run('window.controlJuego.estado().multi'), false);
  assert.equal(env.run('estado.cuentaEspera'), null);
  assert.equal(env.get('espera-j2').querySelector('.espera-estado').textContent, 'Listo en esta PC');
  env.run('window.controlJuego.telefonos([1]);'); env.advance(1500);
  env.run('window.controlJuego.telefonos([]);');
  assert.equal(env.run('estado.cuentaEspera'), null);
  env.advance(2000); env.run('actualizarSalaEspera();');
  assert.equal(env.context.startedMode, undefined);
  env.run('window.controlJuego.telefonos([1]);'); env.advance(3000); env.run('actualizarSalaEspera();');
  assert.equal(env.context.startedMode, 'hibrido');
});

test('La sala de dos teléfonos sigue requiriendo ambos después de jugar híbrido', () => {
  const env = gameEnvironment();
  env.run('estado.modoHibrido = true; window.controlJuego.remoto = true; esVistaMovil = () => false; ' +
    'iniciarJuegoDesdeCero = (mode) => { globalThis.startedMode = mode; cerrarSalaEspera2j(); }; abrirSalaEspera2j(); window.controlJuego.telefonos([1]);');
  assert.equal(env.run('window.controlJuego.estado().hybrid'), false);
  assert.equal(env.run('window.controlJuego.estado().multi'), true);
  env.advance(4000); env.run('actualizarSalaEspera();'); assert.equal(env.context.startedMode, undefined);
  env.run('window.controlJuego.telefonos([1,2]);'); env.advance(3000); env.run('actualizarSalaEspera();');
  assert.equal(env.context.startedMode, '2j');
});

test('Híbrido reserva un solo mando y bloquea los ataques de otro teléfono', () => {
  const env = channelEnvironment('remote-host.js');
  env.context.controlJuego.estado = () => ({ multi: false, hybrid: true });
  env.screen('pantalla-juego');
  env.receive('hello', { id: PHONE1 }); env.receive('hello', { id: PHONE2 });
  const state = env.sent.filter((m) => m.event === 'state').at(-1).payload;
  assert.equal(state.capacity, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(state.players)), { [PHONE1]: 1 });
  env.receive('attack', { id: PHONE2, letter: 'A' });
  env.receive('move', { id: PHONE2, x: 1, y: 0 });
  assert.equal(env.context.attacks.length, 0); assert.equal(env.context.moves.length, 0);
  env.receive('attack', { id: PHONE1, letter: 'A' }); assert.deepEqual(env.context.attacks, [['A',1]]);
});

test('Un teléfono conectado antes del híbrido queda en espera y puede tomar el puesto al desconectar J1', () => {
  const env = channelEnvironment('remote-host.js');
  env.receive('hello', { id: PHONE1 }); env.receive('hello', { id: PHONE2 });
  env.context.controlJuego.estado = () => ({ multi: false, hybrid: true }); env.screen('pantalla-juego');
  env.receive('attack', { id: PHONE2, letter: 'A' }); assert.equal(env.context.attacks.length, 0);
  env.advance(6000); env.receive('ping', { id: PHONE2 }); env.advance(1100);
  env.receive('ping', { id: PHONE1 });
  const state = env.sent.filter((m) => m.event === 'state').at(-1).payload;
  assert.deepEqual(JSON.parse(JSON.stringify(state.players)), { [PHONE2]: 1 });
  env.receive('attack', { id: PHONE2, letter: 'A' }); assert.deepEqual(env.context.attacks, [['A',1]]);
});

test('El mando ocupado en híbrido muestra la explicación y bloquea los controles', () => {
  const env = channelEnvironment('control.js');
  env.receive('state', { screen: 'pantalla-juego', mando: true, hybrid: true, capacity: 1, players: { [PHONE1]: 1 } });
  assert.match(env.get('connection').textContent, /Mando ocupado/); assert.ok(env.buttons.every((b) => b.disabled));
  env.receive('state', { screen: 'pantalla-espera', mando: true, hybrid: true, capacity: 1, players: { [PHONE3]: 1 }, espera: { cuenta: 3 } });
  assert.match(env.get('combat-hint').textContent, /Mando y mouse listos/);
  assert.equal(env.get('switch-player').hidden, true);
});

test('El mouse elimina con clic, el mando con su letra y los puntos se asignan al jugador correcto', () => {
  const env = aimEnvironment();
  env.run('estado.modoHibrido = true; delete aimScene.objetivoControl; aimScene.jugadores[0].ultimoAtaque = -Infinity; ' +
    'aimScene.avisarControl = () => {}; aimScene.eliminarVirus = function(e) { e.procesado = true; this.sumarPuntos(10); }; ' +
    'globalThis.target = { tipo: "normal", letra: "A", procesado: false, contenedor: { x: 500, y: 500, scaleX: 1 } }; ' +
    'estado.virusActivos = [target]; aimScene.clicHibrido(target); aimScene.clicHibrido(target);');
  assert.deepEqual(JSON.parse(env.run('JSON.stringify(estado.puntosJugadores)')), [0,10]);
  env.run('target = { tipo: "normal", letra: "A", procesado: false, contenedor: { x: 500, y: 500, scaleX: 1 } }; estado.virusActivos = [target]; aimScene.atacarControl("B", 0);');
  assert.equal(env.run('target.procesado'), false);
  env.advance(120); env.run('aimScene.atacarControl("A", 0);');
  assert.deepEqual(JSON.parse(env.run('JSON.stringify(estado.puntosJugadores)')), [10,10]);
  assert.equal(env.run('estado.puntuacion'), 20);
});

test('El clic del mouse respeta protección y punto débil del jefe y renueva la combinación', () => {
  const env = aimEnvironment();
  env.run('estado.modoHibrido = true; aimScene.jefe = { vida: 3, protegido: false, destruido: false, secuencia: ["A","B"], progresoCombinacion: 1, contenedor: { alpha: 1 }, puntoDebil: { circulo: { visible: false } } }; ' +
    'aimScene.actualizarCombinacionJefe = () => {}; aimScene.golpearJefe = function() { this.jefe.vida--; this.jefe.protegido = true; }; aimScene.clicJefeHibrido();');
  assert.equal(env.run('aimScene.jefe.vida'), 3);
  env.run('aimScene.jefe.puntoDebil.circulo.visible = true; aimScene.clicJefeHibrido();');
  assert.equal(env.run('aimScene.jefe.vida'), 2);
  assert.equal(env.run('aimScene.jefe.progresoCombinacion'), 0);
  assert.notEqual(env.run('aimScene.jefe.secuencia.join("")'), 'AB');
  assert.equal(env.run('aimScene.ultimoGolpeadorJefe'), 1);
  env.run('aimScene.clicJefeHibrido();'); assert.equal(env.run('aimScene.jefe.vida'), 2);
});


test('La bonificación compartida mantiene la suma de los marcadores en todos los modos', () => {
  const env = gameEnvironment();
  for (const mode of ['normal', 'mando', '2j', 'duo', 'hibrido']) {
    env.run('estado.multijugador = '+(mode === '2j')+'; estado.modoDuo = '+(mode === 'duo')+'; estado.modoHibrido = '+(mode === 'hibrido')+'; estado.puntuacion = 0; estado.puntosJugadores = [0, 0]; var constBonusScene = new EscenaJuego(); constBonusScene.jugadorAtacante = 1; constBonusScene.sumarBonoPregunta(25);');
    const points = JSON.parse(env.run('JSON.stringify(estado.puntosJugadores)'));
    assert.equal(points[0]+points[1], env.run('estado.puntuacion'));
    assert.deepEqual(points, ['2j','duo','hibrido'].includes(mode) ? [12,13] : [25,0]);
  }
});


function spawnEnvironment() {
  const env = gameEnvironment();
  env.run([
    'estado.juegoActivo = true; estado.jefeActivo = false;',
    'var spawnScene = new EscenaJuego(); spawnScene.introNivelActiva = false;',
    'spawnScene.contadorElementosNivel = 5;',
    'spawnScene.areaJuego = { xMin: 100, xMax: 1000, yMin: 200, yMax: 450 };',
    'spawnScene.intentarGenerarReparacion = () => false;',
    'spawnScene.elegirServidorObjetivo = () => null;',
    'spawnScene.crearElementoVisual = (tipo) => estado.virusActivos.push({ tipo });',
    'Phaser.Math = { Between: (min) => min }; Math.random = () => 0;'
  ].join('\n'));
  return env;
}

test('En fácil un azul no bloquea nuevas amenazas en los tres niveles y cinco modos', () => {
  const env = spawnEnvironment();
  for (let level = 0; level < 3; level++) {
    for (const mode of ['normal', 'mando', '2j', 'duo', 'hibrido']) {
      env.run('estado.dificultad = "facil"; estado.indiceNivel = '+level+'; estado.virusEliminados = 0; estado.multijugador = '+(mode==='2j')+'; estado.modoDuo = '+(mode==='duo')+'; estado.modoHibrido = '+(mode==='hibrido')+'; estado.modoMando = '+(['mando','2j','hibrido'].includes(mode))+';');
      // Reproduce el bloqueo con todos los espacios ocupados por azules.
      env.run('estado.virusActivos = Array.from({length:spawnScene.maxElementosActual()}, () => ({tipo:"seguro"}));');
      const cap = env.run('spawnScene.maxElementosActual()');
      env.run('spawnScene.intentarGenerarElemento();');
      assert.equal(env.run('estado.virusActivos.length'), cap+1);
      assert.equal(env.run('estado.virusActivos.at(-1).tipo === "seguro"'), false);
      env.run('spawnScene.intentarGenerarElemento();');
      assert.equal(env.run('estado.virusActivos.length'), cap+1, 'no acumular amenazas por encima del límite');
    }
  }
});

test('El espacio extra no aumenta la presión si ya hay amenaza ni altera medio o difícil', () => {
  const env = spawnEnvironment();
  for (const difficulty of ['facil','medio','dificil']) {
    for (const type of ['amenaza','critica','resistente','duplicador','duplicado_pequeno']) {
      env.run('estado.dificultad = '+JSON.stringify(difficulty)+'; estado.virusActivos = Array.from({length:spawnScene.maxElementosActual()}, () => ({tipo:"seguro"})); estado.virusActivos[0].tipo = '+JSON.stringify(type)+';');
      const count = env.run('estado.virusActivos.length');
      env.run('spawnScene.intentarGenerarElemento();');
      assert.equal(env.run('estado.virusActivos.length'), count);
    }
    if (difficulty !== 'facil') {
      env.run('estado.virusActivos = Array.from({length:spawnScene.maxElementosActual()}, () => ({tipo:"seguro"}));');
      const count = env.run('estado.virusActivos.length');
      env.run('spawnScene.intentarGenerarElemento();');
      assert.equal(env.run('estado.virusActivos.length'), count);
    }
  }
});

test('La excepción de los azules respeta pausa, intro, jefe y objetivo completado', () => {
  const env = spawnEnvironment();
  env.run('estado.dificultad = "facil";');
  for (const setup of ['estado.juegoActivo = false', 'estado.jefeActivo = true', 'spawnScene.introNivelActiva = true', 'estado.virusEliminados = obtenerConfiguracionNivel().virusRequeridos']) {
    env.run('estado.juegoActivo = true; estado.jefeActivo = false; spawnScene.introNivelActiva = false; estado.virusEliminados = 0; estado.virusActivos = [{tipo:"seguro"}]; '+setup+'; spawnScene.intentarGenerarElemento();');
    assert.equal(env.run('estado.virusActivos.length'), 1);
  }
});


test('Un único azul en el segundo nivel fácil genera una amenaza sin esperar su expiración', () => {
  const env = spawnEnvironment();
  env.run('estado.dificultad = "facil"; estado.indiceNivel = 1; estado.virusActivos = [{tipo:"seguro"}]; spawnScene.intentarGenerarElemento();');
  assert.equal(env.run('estado.virusActivos.length'), 2);
  assert.equal(env.run('estado.virusActivos[0].tipo'), 'seguro', 'el azul permanece para aprender a ignorarlo');
  assert.equal(env.run('esAmenazaReal(estado.virusActivos[1].tipo) || estado.virusActivos[1].tipo === "duplicador"'), true);
});
