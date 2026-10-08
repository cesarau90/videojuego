(() => {
  'use strict';
  // El zoom accidental (pellizco, doble toque al apretar rápido) se evita en
  // sin-zoom.js, que también lo corrige si aun así ocurre; el resto está en
  // control.html y control.css.
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
  // Zona táctil del joystick: todo el lado izquierdo del mando, no solo el círculo.
  const zone = document.querySelector('.movement');
  const colors = { A: '#00d99b', B: '#ff5c70', X: '#38bdf8', Y: '#ffd34e' };
  let subscribed = false, lastHost = 0, lastHello = 0, pointer = null;
  let axes = { x: 0, y: 0 };
  let lastSentAxes = { x: 0, y: 0 };
  // Joystick flotante (ver más abajo): el centro es donde el dedo tocó primero.
  const STICK_GAP = 40;          // ms mínimos entre mensajes al mover (máx. 25 por segundo)
  const STICK_GAP_FAST = 16;     // ...y para un cambio grande (arrancar, invertir el sentido)
  const STICK_KEEPALIVE = 100;   // ms: con el dedo quieto se repite la posición
  const STICK_DEAD_IN = .05, STICK_DEAD_OUT = .10; // zona muerta (con histéresis)
  let lastSequence = '';         // combinación del jefe que se mostró la última vez
  let origin = { x: 0, y: 0 };
  let stickOn = false;
  let seq = Date.now();          // contador de mensajes: la PC descarta los más viejos
  let lastSendAt = 0, sendTimer = null;
  // Pantallas donde el joystick funciona: el juego (mover la mira) y la
  // pregunta de seguridad (elegir respuesta arriba/abajo).
  const joystickScreens = ['pantalla-juego', 'pantalla-pregunta'];
  const keys = new Set();
  let hostState = {};
  const controls = document.querySelectorAll('button');
  const hostAvailable = () => subscribed && Date.now() - lastHost < 7000;
  const connected = () => hostAvailable() && mySlot !== 0;
  function updateButtons() {
    controls.forEach((button) => {
      const action = button.dataset.action;
      // En la pregunta solo se usa A (confirmar respuesta / continuar).
      const normalMode = hostState.screen === 'pantalla-juego' && hostState.mando === false;
      button.disabled = !connected() || (button.dataset.letter && (normalMode || (hostState.screen !== 'pantalla-juego'
          && !(hostState.screen === 'pantalla-pregunta' && button.dataset.letter === 'A'))))
        || (action === 'scan' && (hostState.screen !== 'pantalla-juego' || hostState.charges <= 0))
        // Iniciar espera a que la PC tenga el sonido activo (hace falta un clic en la PC; ver renderState).
        || (['start', 'start2'].includes(action) && (hostState.screen !== 'pantalla-inicio' || hostState.audio === false))
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
    const previousSlot = mySlot;
    mySlot = payload.players?.[phoneId] || 0;
    if (previousSlot && !mySlot) reset();
    const full = !mySlot && Object.keys(payload.players || {}).length >= (payload.capacity || 2);
    status.textContent = mySlot ? 'Conectado a la PC'
      : full ? (payload.hybrid ? 'Mando ocupado: este modo usa un teléfono y un mouse.'
        : 'Sala llena: ya hay dos mandos. Espera a que se libere un puesto.')
      : 'Esperando un puesto en la PC…';
    status.classList.toggle('connected', !!mySlot);
    if (!mySlot && Date.now() - lastHello > 1500) { send('hello'); lastHello = Date.now(); }
    const player = payload.multi ? mySlot : 1;
    playerBadge.hidden = !mySlot;
    playerBadge.textContent = payload.hybrid ? 'MANDO · HÍBRIDO'
      : payload.multi ? 'JUGADOR ' + player : 'JUGADOR 1 · MODO 1 JUGADOR';
    playerBadge.className = 'player-badge j' + player;
    switchButton.hidden = !payload.multi || !mySlot;
    switchButton.textContent = 'Cambiar a J' + (mySlot === 1 ? 2 : 1);
    document.getElementById('answers').hidden = payload.screen !== 'pantalla-pregunta';
    const boss = payload.boss;
    const question = payload.screen === 'pantalla-pregunta';
    // En la portada, si el navegador de la PC aún no deja sonar el audio (falta un clic ahí), se pide antes de iniciar.
    const lobby = payload.screen === 'pantalla-inicio';
    const silent = lobby && payload.audio === false;
    // Sala de espera de 2 jugadores: la partida empieza cuando están los dos teléfonos.
    const waiting = payload.screen === 'pantalla-espera';
    const countdown = payload.espera?.cuenta;
    document.getElementById('combat-title').textContent = question ? 'PREGUNTA DE SEGURIDAD'
      : waiting ? (countdown ? '¡LISTOS!' : payload.hybrid ? 'ESPERANDO AL MANDO' : 'ESPERANDO A LOS 2 TELÉFONOS')
      : silent ? 'ANTES DE INICIAR' : lobby ? 'LISTO PARA DEFENDER'
      : boss ? boss.name + ' · COMBINACIÓN' : 'APUNTA Y ATACA';
    const feedback = Array.isArray(payload.feedback) ? payload.feedback[player - 1] : '';
    const normalMode = payload.mando === false && payload.screen === 'pantalla-juego';
    const hint = document.getElementById('combat-hint');
    hint.classList.toggle('warn', silent);
    hint.textContent = waiting
      ? (payload.hybrid
        ? (countdown ? `¡Mando y mouse listos! Empieza en ${countdown}…` : 'El jugador del mouse está listo en la PC. La partida empieza al conectar este mando.')
        : countdown ? `Los dos teléfonos están conectados. Empieza en ${countdown}…`
        : 'Falta el otro teléfono: que escanee el mismo QR que se ve en la PC. Cuando estén los dos, la partida empieza sola.')
      : normalMode
      ? (payload.duo
        ? 'Esta partida es de teclado + mouse en la PC: el mando no se usa. Para usar el mando, reinicia y pulsa INICIAR aquí.'
        : 'Esta partida está en modo normal (clic en la PC). Para usar el mando, reinicia y pulsa INICIAR aquí.')
      : question
      ? 'Mueve el joystick arriba o abajo para elegir y pulsa A para responder. Después, A para continuar.'
      : silent
      ? 'Haz clic en cualquier parte de la PC para activar el sonido. Después podrás iniciar desde aquí.'
      : lobby
      ? 'Pulsa INICIAR o 2 JUGADORES. Para jugar con mando + mouse, elige ese modo en la PC.'
      : feedback || (boss
      ? (payload.hybrid ? 'Completa la combinación apuntando al jefe. Tu compañero también puede golpearlo con el mouse; cada golpe cambia la combinación.'
        : 'Apunta al jefe y pulsa en orden. Cada combinación completa le quita una vida y la siguiente es distinta.')
      : payload.hybrid ? 'Tú apuntas y pulsas la letra; tu compañero hace clic con el mouse. No ataquen los archivos seguros (azules).'
      : 'Pulsa la letra que muestra el enemigo. No ataques los archivos seguros (azules).');
    const sequence = document.getElementById('boss-sequence');
    sequence.replaceChildren();
    // Las letras "laten" cuando el jefe pide una combinación distinta (cada golpe).
    const signature = boss && Array.isArray(boss.sequence) ? boss.sequence.join('') : '';
    const fresh = signature !== '' && signature !== lastSequence;
    lastSequence = signature;
    if (boss && Array.isArray(boss.sequence)) boss.sequence.forEach((letter, index) => {
      if (!colors[letter]) return;
      const badge = document.createElement('span');
      badge.className = 'sequence-letter' + (index < boss.progress ? ' done' : index === boss.progress ? ' next' : '')
        + (fresh ? ' fresh' : '');
      badge.style.color = colors[letter];
      badge.textContent = letter;
      sequence.append(badge);
    });
    updateButtons();
  }
  channel.on('broadcast', { event: 'state' }, ({ payload }) => {
    lastHost = Date.now();
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
    if (!hostAvailable()) {
      reset();
      status.textContent = 'Esperando la PC…';
      status.classList.remove('connected');
      updateButtons();
      if (Date.now() - lastHello > 2500) {
        send('hello');
        lastHello = Date.now();
      }
    }
    // Un mando en espera vuelve a pedir un puesto sin enviar órdenes de juego.
    if (hostAvailable() && !mySlot && Date.now() - lastHello > 2500) {
      send('hello');
      lastHello = Date.now();
    }
    send('ping');
  }, 2000);

  // ---- Joystick flotante ----
  // El centro no es fijo: es el punto donde el dedo toca primero. Así,
  // aterrizar un poco a un lado del círculo no mueve la mira hacia ese lado
  // (antes se iba al lado contrario del que querías), y se puede jugar
  // mirando la PC sin buscar el centro con el pulgar. Si el dedo se aleja más
  // que el radio, el centro lo sigue: al regresar el dedo la mira cambia de
  // sentido enseguida en vez de seguir de largo.
  // Los ejes se envían en cuanto cambian (máximo 25 mensajes por segundo, para
  // no saturar el canal) y se repiten cada 100 ms mientras sigan inclinados.
  // Cada mensaje lleva un número: la PC descarta los que lleguen desordenados.
  // Menos recorrido del pulgar para alcanzar la velocidad máxima, incluso en horizontal.
  const stickRadius = () => Math.min(48, Math.max(28, pad.offsetWidth * .20));
  // El joystick solo se envía donde la PC lo usa: el juego con mando y la pregunta.
  const canSteer = () => joystickScreens.includes(hostState.screen)
    && !(hostState.screen === 'pantalla-juego' && hostState.mando === false);

  function setAxes(x, y) {
    axes = { x, y };
    const reach = Math.min(stickRadius(), pad.offsetWidth * .29); // el pomo acompaña al dedo sin salirse del círculo
    knob.style.transform = 'translate(' + x * reach + 'px, ' + y * reach + 'px)';
    pad.classList.toggle('pressed', !!(x || y));
    if (x || y) {
      scheduleSend();
      if (keepAliveTimer === null) keepAliveTimer = setInterval(keepAlive, 20);
    } else sendStop();
  }
  function sendAxes() {
    if (!connected() || !canSteer()) return;
    const x = Math.round(axes.x * 100) / 100, y = Math.round(axes.y * 100) / 100;
    send('move', { x, y, n: ++seq });
    lastSentAxes = { x, y };
    lastSendAt = performance.now();
  }
  // Cuánto cambiaron los ejes desde el último mensaje enviado.
  const axesChange = () => Math.max(Math.abs(axes.x - lastSentAxes.x), Math.abs(axes.y - lastSentAxes.y));
  // Envía ya si pasó el intervalo mínimo; si no, deja uno pendiente que
  // llevará los ejes más recientes (sin acumular mensajes viejos). Un cambio
  // grande (arrancar, invertir el sentido) no espera el intervalo completo:
  // es justo lo que se nota si llega tarde.
  function scheduleSend() {
    const change = axesChange();
    if (change < .02) return;
    const wait = (change >= .25 ? STICK_GAP_FAST : STICK_GAP) - (performance.now() - lastSendAt);
    clearTimeout(sendTimer);
    sendTimer = null;
    if (wait <= 0) { sendAxes(); return; }
    sendTimer = setTimeout(() => { sendTimer = null; if (axesChange() >= .02) sendAxes(); }, wait);
  }
  // Al soltar, el alto se manda de inmediato, sin esperar el intervalo, y se
  // repite dos veces por si se pierde.
  function sendStop() {
    clearTimeout(sendTimer);
    sendTimer = null;
    if (!lastSentAxes.x && !lastSentAxes.y) return;
    sendAxes();
    [90, 240].forEach((ms) => setTimeout(() => { if (!axes.x && !axes.y) sendAxes(); }, ms));
  }
  // Latido: con el joystick inclinado y el dedo quieto se repite la posición.
  // Solo corre mientras hay inclinación (no despierta al teléfono con el dedo suelto).
  // (-10 ms de margen: el temporizador a veces despierta unas décimas antes y
  // el latido se iría al siguiente ciclo, 20 ms más tarde.)
  let keepAliveTimer = null;
  function keepAlive() {
    if (!axes.x && !axes.y) { clearInterval(keepAliveTimer); keepAliveTimer = null; return; }
    if (performance.now() - lastSendAt >= STICK_KEEPALIVE - 10) sendAxes();
  }
  // El círculo se desliza hasta el dedo (sin salirse de la zona táctil) para
  // que el pomo quede bajo el pulgar; al soltar vuelve a su lugar.
  function placeBase() {
    const area = zone.getBoundingClientRect();
    const half = pad.offsetWidth / 2;
    const homeX = area.left + pad.offsetLeft + half, homeY = area.top + pad.offsetTop + half;
    const x = Math.min(area.right - half, Math.max(area.left + half, origin.x));
    const y = Math.min(area.bottom - half, Math.max(area.top + half, origin.y));
    pad.style.transform = 'translate(' + (x - homeX) + 'px, ' + (y - homeY) + 'px)';
  }
  function steer(event) {
    const radius = stickRadius();
    let dx = event.clientX - origin.x, dy = event.clientY - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) { // el centro sigue al dedo
      const pull = (distance - radius) / distance;
      origin.x += dx * pull; origin.y += dy * pull;
      dx = event.clientX - origin.x; dy = event.clientY - origin.y;
      placeBase();
    }
    const tilt = Math.min(1, Math.hypot(dx, dy) / radius);
    stickOn = tilt > (stickOn ? STICK_DEAD_IN : STICK_DEAD_OUT);
    const power = stickOn ? (tilt - STICK_DEAD_IN) / (1 - STICK_DEAD_IN) : 0;
    const length = Math.hypot(dx, dy) || 1;
    setAxes(dx / length * power, dy / length * power);
  }
  function reset() {
    const captured = pointer;
    pointer = null;
    keys.clear();
    stickOn = false;
    pad.classList.remove('held');
    zone.classList.remove('held');
    pad.style.transform = '';
    setAxes(0, 0);
    if (captured !== null && zone.hasPointerCapture(captured)) zone.releasePointerCapture(captured);
  }
  zone.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (pointer !== null || !connected()) return;
    pointer = event.pointerId;
    // Si el navegador no puede capturar el puntero, el joystick sigue funcionando.
    try { zone.setPointerCapture(pointer); } catch (e) { /* el puntero ya terminó o no se admite */ }
    origin = { x: event.clientX, y: event.clientY };
    stickOn = false;
    pad.classList.add('held');
    zone.classList.add('held');
    placeBase();
    setAxes(0, 0); // tocar no mueve la mira: parte del reposo
  });
  zone.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) { event.preventDefault(); steer(event); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) =>
    zone.addEventListener(type, (event) => { if (event.pointerId === pointer) reset(); }));
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
  // Flechas del teclado (para probar el mando desde una computadora).
  function keyboardAxes() {
    const x = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
    const y = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
    const length = Math.hypot(x, y) || 1;
    setAxes(x / length, y / length);
  }
  window.addEventListener('keydown', (event) => {
    if (!connected() || !joystickScreens.includes(hostState.screen)) return;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault(); keys.add(event.key);
      keyboardAxes();
    } else if (colors[event.key.toUpperCase()] && !event.repeat) send('attack', { letter: event.key.toUpperCase() });
  });
  window.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow')) {
      event.preventDefault(); keys.delete(event.key);
      keyboardAxes();
    }
  });
  // Safari: evita el menú de "copiar/seleccionar" y la lupa al mantener el dedo.
  document.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('selectstart', (event) => event.preventDefault());
  window.addEventListener('blur', reset);
  // Al girar cambia la zona táctil: soltar evita conservar el centro anterior.
  window.addEventListener('resize', reset);
  window.addEventListener('orientationchange', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
})();
