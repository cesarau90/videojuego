/* Conexión temporal entre la PC y hasta dos teléfonos mediante Supabase Realtime. */
(() => {
  'use strict';

  const url = 'https://msxptdklbdxeaheqcbmc.supabase.co';
  const key = 'sb_publishable_g6XPAfwi05KqohaBm0uL3g_umR1yBIc';
  const status = document.getElementById('estado-control');
  const dialogStatus = document.getElementById('estado-control-dialogo');
  const link = document.getElementById('enlace-control');
  const dialog = document.getElementById('dialogo-control');
  const token = crypto.randomUUID();
  const controlUrl = new URL('control.html', location.href);
  controlUrl.searchParams.set('s', token);
  link.href = controlUrl.href;
  link.textContent = controlUrl.href;

  function showStatus(message) {
    status.textContent = message;
    dialogStatus.textContent = message;
  }

  if (location.protocol === 'file:') {
    showStatus('Abre la PC desde GitHub Pages o un servidor HTTPS.');
    return;
  }
  if (!window.supabase?.createClient || !window.QRCode) {
    showStatus('No se cargaron las librerías de conexión. Revisa Internet.');
    return;
  }

  new QRCode(document.getElementById('qr-control'), {
    text: controlUrl.href, width: 192, height: 192,
    correctLevel: QRCode.CorrectLevel.M,
  });
  new QRCode(document.getElementById('qr-control-dialogo'), {
    text: controlUrl.href, width: 192, height: 192,
    correctLevel: QRCode.CorrectLevel.M,
  });

  document.getElementById('btn-ver-qr').addEventListener('click', () => dialog.showModal());
  document.getElementById('btn-cerrar-qr').addEventListener('click', () => dialog.close());

  const client = supabase.createClient(url, key, { realtime: { params: { eventsPerSecond: 30 } } });
  const channel = client.channel(`control-${token}`);
  let subscribed = false;
  let lastState = '';
  let lastStateSent = 0;
  // Teléfonos conectados: id del teléfono -> { slot: 1 | 2, last, lastAttack }.
  // Ambos escanean el mismo QR; el primero es J1 y el segundo J2.
  const phones = new Map();
  const PHONE_TIMEOUT = 7000;
  const multi = () => window.controlJuego?.estado().multi === true;
  // En modo de 1 jugador todos los teléfonos manejan al jugador 1.
  const playerOf = (phone) => (multi() ? phone.slot : 1);
  const gameState = () => ({
    screen: currentScreen(), ...window.controlJuego?.estado(),
    players: Object.fromEntries([...phones].map(([id, phone]) => [id, phone.slot])),
  });
  const sendState = () => send('state', gameState());

  const send = (event, payload = {}) => {
    if (subscribed) channel.send({ type: 'broadcast', event, payload });
  };

  // La pregunta es una capa sobre el tablero (ambas quedan activas), así que tiene prioridad.
  function currentScreen() {
    if (document.getElementById('pantalla-pregunta')?.classList.contains('activa')) return 'pantalla-pregunta';
    return document.querySelector('.pantalla.activa')?.id || 'pantalla-inicio';
  }

  function freeSlot(exceptId) {
    const used = new Set([...phones].filter(([id]) => id !== exceptId).map(([, phone]) => phone.slot));
    return [1, 2].find((slot) => !used.has(slot)) ?? 1;
  }

  function updateStatus() {
    const count = phones.size;
    showStatus(count === 0 ? 'Esperando al teléfono…'
      : count === 1 ? 'Teléfono conectado'
      : `${count} teléfonos conectados`);
  }

  // Devuelve el teléfono que envió el mensaje (si es válido y sigue activo).
  function phoneFrom(payload) {
    const phone = typeof payload?.id === 'string' ? phones.get(payload.id) : null;
    if (phone) phone.last = Date.now();
    return phone;
  }

  // ---- Pregunta de seguridad con el joystick ----
  // Arriba/abajo mueve el resaltado entre las 4 opciones (un paso por cada
  // movimiento, hay que regresar el joystick al centro para el siguiente) y
  // A responde la opción resaltada; después de responder, A continúa.
  let questionOptions = null;
  let selected = -1;

  function questionButtons() {
    const options = [...document.querySelectorAll('#opciones-pregunta button')];
    if (options[0] !== questionOptions?.[0]) { questionOptions = options; selected = -1; } // pregunta nueva
    return options;
  }

  function highlight(options) {
    options.forEach((option, i) => option.classList.toggle('seleccion-mando', i === selected));
  }

  function questionMove(phone, y) {
    const options = questionButtons();
    const ready = options.length && options[0].classList.contains('lista') && !options[0].disabled;
    const step = y > 0.6 ? 1 : y < -0.6 ? -1 : 0;
    if (!step) { phone.questionStep = 0; return; }
    if (!ready || phone.questionStep === step) return; // espera a que el joystick vuelva al centro
    phone.questionStep = step;
    selected = selected < 0 ? (step > 0 ? 0 : options.length - 1)
      : Math.min(options.length - 1, Math.max(0, selected + step));
    highlight(options);
  }

  function questionConfirm() {
    const options = questionButtons();
    const next = document.getElementById('btn-continuar-pregunta');
    if (next && !next.hidden) { next.click(); return; }
    if (selected >= 0 && options[selected] && !options[selected].disabled) options[selected].click();
  }

  const buttons = {
    start: 'btn-jugar', start2: 'btn-jugar-2', scan: 'btn-escaner', next: 'btn-siguiente-nivel',
    retry: 'btn-reintentar', again: 'btn-jugar-de-nuevo',
    continue: 'btn-continuar-pregunta',
  };

  function pressButton(action) {
    if (typeof action !== 'string') return;
    if (action.startsWith('answer-') && currentScreen() === 'pantalla-pregunta') {
      const index = Number(action.slice(7));
      if (Number.isInteger(index) && index >= 0 && index < 4) {
        document.querySelectorAll('#opciones-pregunta button')[index]?.click();
      }
      return;
    }
    if (action === 'retry' && currentScreen() === 'pantalla-victoria') action = 'again';
    if (action === 'next' && currentScreen() === 'pantalla-pregunta') action = 'continue';
    const allowed = { start: 'pantalla-inicio', start2: 'pantalla-inicio', scan: 'pantalla-juego', next: 'pantalla-nivel-completado', retry: 'pantalla-derrota', again: 'pantalla-victoria', continue: 'pantalla-pregunta' };
    if (allowed[action] !== currentScreen()) return;
    const id = buttons[action];
    if (id) document.getElementById(id)?.click();
  }

  channel
    .on('broadcast', { event: 'hello' }, ({ payload }) => {
      const id = payload?.id;
      if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id)) return;
      const phone = phones.get(id) || { slot: freeSlot(id), lastAttack: 0 };
      phone.last = Date.now();
      phones.set(id, phone);
      updateStatus();
      sendState();
    })
    .on('broadcast', { event: 'ping' }, ({ payload }) => {
      if (!phoneFrom(payload)) send('state', gameState()); // el teléfono volverá a presentarse
    })
    .on('broadcast', { event: 'choose' }, ({ payload }) => {
      // El teléfono pide cambiar de jugador; se intercambia con el otro si está ocupado.
      const phone = phoneFrom(payload);
      if (!phone || ![1, 2].includes(payload.slot) || phone.slot === payload.slot) return;
      const other = [...phones.values()].find((p) => p !== phone && p.slot === payload.slot);
      window.controlJuego?.mover(0, 0, phone.slot);
      if (other) other.slot = phone.slot;
      phone.slot = payload.slot;
      sendState();
    })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      const phone = phoneFrom(payload);
      if (!phone) return;
      if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y) || Math.abs(payload.x) > 1 || Math.abs(payload.y) > 1) return;
      if (currentScreen() === 'pantalla-pregunta') questionMove(phone, payload.y);
      else if (currentScreen() === 'pantalla-juego') window.controlJuego?.mover(payload.x, payload.y, playerOf(phone));
    })
    .on('broadcast', { event: 'attack' }, ({ payload }) => {
      const phone = phoneFrom(payload);
      if (!phone || !['A', 'B', 'X', 'Y'].includes(payload.letter) || Date.now() - phone.lastAttack < 110) return;
      if (currentScreen() === 'pantalla-pregunta') {
        if (payload.letter === 'A') { phone.lastAttack = Date.now(); questionConfirm(); }
        return;
      }
      if (currentScreen() !== 'pantalla-juego') return;
      phone.lastAttack = Date.now();
      window.controlJuego?.atacar(payload.letter, playerOf(phone));
      sendState();
    })
    .on('broadcast', { event: 'button' }, ({ payload }) => {
      if (phoneFrom(payload)) pressButton(payload.action);
    })
    .subscribe((state) => {
      subscribed = state === 'SUBSCRIBED';
      if (subscribed) updateStatus();
      else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        showStatus('No se pudo conectar. Revisa Realtime en Supabase.');
      }
    });

  setInterval(() => {
    let removed = false;
    phones.forEach((phone, id) => {
      if (Date.now() - phone.last > PHONE_TIMEOUT) {
        window.controlJuego?.mover(0, 0, phone.slot);
        phones.delete(id);
        removed = true;
      }
    });
    if (removed) {
      updateStatus();
      if (phones.size === 0) showStatus('Teléfono desconectado. Vuelve a escanear el QR.');
    }
    const nextState = gameState();
    const serialized = JSON.stringify(nextState);
    if (serialized !== lastState || Date.now() - lastStateSent > 2000) {
      send('state', nextState);
      lastState = serialized;
      lastStateSent = Date.now();
    }
  }, 200);
})();
