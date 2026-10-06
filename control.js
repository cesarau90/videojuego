(() => {
  'use strict';
  const token = new URLSearchParams(location.search).get('s');
  const status = document.getElementById('connection');
  const pad = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const colors = { A: '#00d99b', B: '#ff5c70', X: '#38bdf8', Y: '#ffd34e' };
  let subscribed = false, lastHost = 0, lastHello = 0, pointer = null;
  let axes = { x: 0, y: 0 };
  const keys = new Set();
  let hostState = {};
  const controls = document.querySelectorAll('button');
  const connected = () => subscribed && Date.now() - lastHost < 7000;
  function updateButtons() {
    controls.forEach((button) => {
      const action = button.dataset.action;
      button.disabled = !connected() || (button.dataset.letter && hostState.screen !== 'pantalla-juego')
        || (action === 'scan' && (hostState.screen !== 'pantalla-juego' || hostState.charges <= 0))
        || (action === 'start' && hostState.screen !== 'pantalla-inicio')
        || (action === 'next' && !['pantalla-pregunta', 'pantalla-nivel-completado'].includes(hostState.screen))
        || (action === 'retry' && !['pantalla-derrota', 'pantalla-victoria'].includes(hostState.screen));
    });
  }
  updateButtons();
  if (!token || !/^[a-f0-9-]{36}$/i.test(token)) {
    status.textContent = 'Enlace inválido. Escanea el QR de la PC.';
    return;
  }
  if (!window.supabase?.createClient) {
    status.textContent = 'No se pudo cargar la conexión. Revisa Internet.';
    return;
  }
  const client = supabase.createClient(
    'https://msxptdklbdxeaheqcbmc.supabase.co',
    'sb_publishable_g6XPAfwi05KqohaBm0uL3g_umR1yBIc',
  );
  const channel = client.channel('control-' + token);
  const send = (event, payload = {}) => {
    if (subscribed) channel.send({ type: 'broadcast', event, payload });
  };
  function renderState(payload = {}) {
    hostState = payload;
    document.getElementById('answers').hidden = payload.screen !== 'pantalla-pregunta';
    const boss = payload.boss;
    document.getElementById('combat-title').textContent = boss ? boss.name + ' · COMBINACIÓN' : 'APUNTA Y ATACA';
    document.getElementById('combat-hint').textContent = payload.feedback || (boss
      ? 'Apunta al jefe y pulsa en orden. Cada combinación completa le quita una vida.'
      : 'A verde · B rojo · X azul · Y amarillo. Evita los escudos grises.');
    const sequence = document.getElementById('boss-sequence');
    sequence.replaceChildren();
    if (boss && Array.isArray(boss.sequence)) boss.sequence.forEach((letter, index) => {
      if (!colors[letter]) return;
      const badge = document.createElement('span');
      badge.className = 'sequence-letter' + (index < boss.progress ? ' done' : index === boss.progress ? ' next' : '');
      badge.style.color = colors[letter];
      badge.textContent = letter;
      sequence.append(badge);
    });
    updateButtons();
  }
  channel.on('broadcast', { event: 'state' }, ({ payload }) => {
    lastHost = Date.now();
    status.textContent = 'Conectado a la PC';
    status.classList.add('connected');
    renderState(payload);
  }).subscribe((state) => {
    subscribed = state === 'SUBSCRIBED';
    if (subscribed) {
      status.textContent = 'Buscando la PC…';
      send('hello');
      lastHello = Date.now();
    } else {
      reset();
      status.classList.remove('connected');
      if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
        status.textContent = 'Sin conexión. Revisa Internet y vuelve a escanear el QR.';
      }
    }
    updateButtons();
  });
  setInterval(() => {
    if (!subscribed) return;
    if (!connected()) {
      reset();
      status.textContent = 'Esperando la PC…';
      status.classList.remove('connected');
      updateButtons();
      if (Date.now() - lastHello > 2500) {
        send('hello');
        lastHello = Date.now();
      }
    }
    send('ping');
  }, 2000);

  function move(x, y) {
    const length = Math.hypot(x, y);
    axes = length < .12 ? { x: 0, y: 0 } : { x: x / Math.max(1, length), y: y / Math.max(1, length) };
    const radius = pad.getBoundingClientRect().width * .28;
    knob.style.transform = 'translate(' + axes.x * radius + 'px, ' + axes.y * radius + 'px)';
    pad.classList.toggle('pressed', !!(axes.x || axes.y));
    if (connected()) send('move', axes);
  }
  function reset() {
    const captured = pointer;
    pointer = null;
    keys.clear();
    move(0, 0);
    if (captured !== null && pad.hasPointerCapture(captured)) pad.releasePointerCapture(captured);
  }
  function movePointer(event) {
    const rect = pad.getBoundingClientRect();
    const radius = rect.width * .28;
    move((event.clientX - rect.left - rect.width / 2) / radius,
      (event.clientY - rect.top - rect.height / 2) / radius);
  }
  pad.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (pointer !== null || !connected() || hostState.screen !== 'pantalla-juego') return;
    pointer = event.pointerId;
    pad.setPointerCapture(pointer);
    movePointer(event);
  });
  pad.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) { event.preventDefault(); movePointer(event); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) =>
    pad.addEventListener(type, (event) => { if (event.pointerId === pointer) reset(); }));
  setInterval(() => { if (connected() && (axes.x || axes.y)) send('move', axes); }, 100);
  document.querySelectorAll('[data-letter]').forEach((button) => {
    function attack() {
      if (button.disabled || !connected()) return;
      send('attack', { letter: button.dataset.letter });
      button.classList.add('pressed');
      setTimeout(() => button.classList.remove('pressed'), 100);
    }
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); attack(); });
    button.addEventListener('click', (event) => { if (event.detail === 0) attack(); });
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => { if (connected()) send('button', { action: button.dataset.action }); });
  });
  window.addEventListener('keydown', (event) => {
    if (!connected() || hostState.screen !== 'pantalla-juego') return;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault(); keys.add(event.key);
      move(Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')), Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')));
    } else if (colors[event.key.toUpperCase()] && !event.repeat) send('attack', { letter: event.key.toUpperCase() });
  });
  window.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow')) {
      event.preventDefault(); keys.delete(event.key);
      move(Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')), Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')));
    }
  });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
})();
