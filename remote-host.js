/* Conexión temporal entre la PC y un teléfono mediante Supabase Realtime. */
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

  const client = supabase.createClient(url, key);
  const channel = client.channel(`control-${token}`);
  let subscribed = false;
  let lastPhone = 0;
  let lastAttack = 0;
  let lastState = '';
  let lastStateSent = 0;
  const gameState = () => ({ screen: currentScreen(), ...window.controlJuego?.estado() });
  const sendState = () => send('state', gameState());

  const send = (event, payload = {}) => {
    if (subscribed) channel.send({ type: 'broadcast', event, payload });
  };

  function currentScreen() {
    return document.querySelector('.pantalla.activa')?.id || 'pantalla-inicio';
  }

  const buttons = {
    start: 'btn-jugar', scan: 'btn-escaner', next: 'btn-siguiente-nivel',
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
    const allowed = { start: 'pantalla-inicio', scan: 'pantalla-juego', next: 'pantalla-nivel-completado', retry: 'pantalla-derrota', again: 'pantalla-victoria', continue: 'pantalla-pregunta' };
    if (allowed[action] !== currentScreen()) return;
    const id = buttons[action];
    if (id) document.getElementById(id)?.click();
  }

  channel
    .on('broadcast', { event: 'hello' }, () => {
      lastPhone = Date.now();
      showStatus('Teléfono conectado');
      sendState();
    })
    .on('broadcast', { event: 'ping' }, () => { lastPhone = Date.now(); })
    .on('broadcast', { event: 'move' }, ({ payload }) => {
      if (Date.now() - lastPhone >= 7000 || currentScreen() !== 'pantalla-juego') return;
      if (!Number.isFinite(payload?.x) || !Number.isFinite(payload?.y) || Math.abs(payload.x) > 1 || Math.abs(payload.y) > 1) return;
      window.controlJuego?.mover(payload.x, payload.y);
    })
    .on('broadcast', { event: 'attack' }, ({ payload }) => {
      if (Date.now() - lastPhone >= 7000 || currentScreen() !== 'pantalla-juego') return;
      if (!['A', 'B', 'X', 'Y'].includes(payload?.letter) || Date.now() - lastAttack < 110) return;
      lastAttack = Date.now();
      window.controlJuego?.atacar(payload.letter);
      sendState();
    })
    .on('broadcast', { event: 'button' }, ({ payload }) => {
      if (Date.now() - lastPhone < 7000) pressButton(payload?.action);
    })
    .subscribe((state) => {
      subscribed = state === 'SUBSCRIBED';
      if (subscribed) showStatus('Esperando al teléfono…');
      else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        showStatus('No se pudo conectar. Revisa Realtime en Supabase.');
      }
    });

  setInterval(() => {
    if (lastPhone && Date.now() - lastPhone > 7000) {
      lastPhone = 0;
      window.controlJuego?.mover(0, 0);
      showStatus('Teléfono desconectado. Vuelve a escanear el QR.');
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
