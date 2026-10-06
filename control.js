(() => {
  'use strict';
  const token = new URLSearchParams(location.search).get('s');
  // Identificador de este teléfono, para que la PC distinga a J1 de J2.
  let phoneId = null;
  try { phoneId = sessionStorage.getItem('mando-id'); } catch (e) { /* sin almacenamiento */ }
  if (!phoneId) {
    phoneId = crypto.randomUUID();
    try { sessionStorage.setItem('mando-id', phoneId); } catch (e) { /* sin almacenamiento */ }
  }
  const playerBadge = document.getElementById('player-badge');
  const switchButton = document.getElementById('switch-player');
  let mySlot = 0;
  const status = document.getElementById('connection');
  const pad = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const colors = { A: '#00d99b', B: '#ff5c70', X: '#38bdf8', Y: '#ffd34e' };
  let subscribed = false, lastHost = 0, lastHello = 0, pointer = null;
  let axes = { x: 0, y: 0 };
  let lastSentAxes = { x: 0, y: 0 };
  // Pantallas donde el joystick funciona: el juego (mover la mira) y la
  // pregunta de seguridad (elegir respuesta arriba/abajo).
  const joystickScreens = ['pantalla-juego', 'pantalla-pregunta'];
  const keys = new Set();
  let hostState = {};
  const controls = document.querySelectorAll('button');
  const connected = () => subscribed && Date.now() - lastHost < 7000;
  function updateButtons() {
    controls.forEach((button) => {
      const action = button.dataset.action;
      // En la pregunta solo se usa A (confirmar respuesta / continuar).
      const normalMode = hostState.screen === 'pantalla-juego' && hostState.mando === false;
      button.disabled = !connected() || (button.dataset.letter && (normalMode || (hostState.screen !== 'pantalla-juego'
          && !(hostState.screen === 'pantalla-pregunta' && button.dataset.letter === 'A'))))
        || (action === 'scan' && (hostState.screen !== 'pantalla-juego' || hostState.charges <= 0))
        || (['start', 'start2'].includes(action) && hostState.screen !== 'pantalla-inicio')
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
    { realtime: { params: { eventsPerSecond: 30 } } },
  );
  const channel = client.channel('control-' + token);
  const send = (event, payload = {}) => {
    if (subscribed) channel.send({ type: 'broadcast', event, payload: { ...payload, id: phoneId } });
  };
  function renderState(payload = {}) {
    hostState = payload;
    // Si la PC no conoce este teléfono (por ejemplo, se recargó), se presenta otra vez.
    mySlot = payload.players?.[phoneId] || 0;
    if (!mySlot && Date.now() - lastHello > 1500) { send('hello'); lastHello = Date.now(); }
    const player = payload.multi ? mySlot : 1;
    playerBadge.hidden = !mySlot;
    playerBadge.textContent = payload.multi ? 'JUGADOR ' + player : 'JUGADOR 1 · MODO 1 JUGADOR';
    playerBadge.className = 'player-badge j' + player;
    switchButton.hidden = !payload.multi || !mySlot;
    switchButton.textContent = 'Cambiar a J' + (mySlot === 1 ? 2 : 1);
    document.getElementById('answers').hidden = payload.screen !== 'pantalla-pregunta';
    const boss = payload.boss;
    const question = payload.screen === 'pantalla-pregunta';
    document.getElementById('combat-title').textContent = question ? 'PREGUNTA DE SEGURIDAD'
      : boss ? boss.name + ' · COMBINACIÓN' : 'APUNTA Y ATACA';
    const feedback = Array.isArray(payload.feedback) ? payload.feedback[player - 1] : '';
    const normalMode = payload.mando === false && payload.screen === 'pantalla-juego';
    document.getElementById('combat-hint').textContent = normalMode
      ? 'Esta partida está en modo normal (clic en la PC). Para usar el mando, reinicia y pulsa INICIAR aquí.'
      : question
      ? 'Mueve el joystick arriba o abajo para elegir y pulsa A para responder. Después, A para continuar.'
      : feedback || (boss
      ? 'Apunta al jefe y pulsa en orden. Cada combinación completa le quita una vida.'
      : 'Pulsa la letra que muestra el enemigo. No ataques los archivos seguros (azules).');
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

  // move() solo actualiza el joystick; el envío va a ritmo fijo (sendAxes)
  // para no saturar el canal: si se mandaba un mensaje por cada movimiento
  // del dedo, algunos se perdían o llegaban tarde y la mira se pasaba.
  function move(x, y) {
    const length = Math.hypot(x, y);
    axes = length < .12 ? { x: 0, y: 0 } : { x: x / Math.max(1, length), y: y / Math.max(1, length) };
    const radius = pad.getBoundingClientRect().width * .28;
    knob.style.transform = 'translate(' + axes.x * radius + 'px, ' + axes.y * radius + 'px)';
    pad.classList.toggle('pressed', !!(axes.x || axes.y));
    // Al soltar, el alto se manda de inmediato (y se repite por si se pierde).
    if (!axes.x && !axes.y && (lastSentAxes.x || lastSentAxes.y)) {
      sendAxes();
      setTimeout(() => { if (!axes.x && !axes.y) send('move', axes); }, 120);
    }
  }
  function sendAxes() {
    if (!connected()) return;
    send('move', axes);
    lastSentAxes = axes;
  }
  setInterval(() => {
    if (axes.x || axes.y || axes.x !== lastSentAxes.x || axes.y !== lastSentAxes.y) sendAxes();
  }, 80);
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
    if (pointer !== null || !connected() || !joystickScreens.includes(hostState.screen)
      || (hostState.screen === 'pantalla-juego' && hostState.mando === false)) return;
    pointer = event.pointerId;
    pad.setPointerCapture(pointer);
    movePointer(event);
  });
  pad.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) { event.preventDefault(); movePointer(event); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) =>
    pad.addEventListener(type, (event) => { if (event.pointerId === pointer) reset(); }));
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
  switchButton.addEventListener('click', () => {
    if (connected() && mySlot) send('choose', { slot: mySlot === 1 ? 2 : 1 });
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => { if (connected()) send('button', { action: button.dataset.action }); });
  });
  window.addEventListener('keydown', (event) => {
    if (!connected() || !joystickScreens.includes(hostState.screen)) return;
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
  // Safari: evita el menú de "copiar/seleccionar" y la lupa al mantener el dedo.
  document.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('selectstart', (event) => event.preventDefault());
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
})();
