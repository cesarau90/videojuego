/* ------------------------------------------------------------------
   SIN ZOOM ACCIDENTAL EN EL TELÉFONO (mando y juego en vista móvil)

   En el iPhone, Safari hace zoom por varios caminos y varios ignoran el
   "user-scalable=no" de la página: un pellizco, un doble toque (al apretar
   botones rápido cuenta como doble toque), y a veces al girar el teléfono. En
   horizontal (iOS 15 o más) tampoco se respeta siempre "touch-action". Por
   eso aquí se cierran todos los caminos a la vez y, además, SIEMPRE se deja
   una salida (bloquearlo todo dejó el zoom imposible de quitar):

   1. Pellizco: se cancelan los eventos de gesto de Safari y los toques de dos
      dedos que se mueven.
   2. Doble toque: se cancela el segundo toque rápido (menos en los botones que
      funcionan con "click").
   3. Si aun así queda con zoom, MIENTRAS lo tenga no se bloquea nada (ni estos
      eventos ni el "touch-action" del CSS) para que se pueda deshacer con los
      dedos, y la página intenta volver sola a la escala normal.
   4. Si no lo logra, aparece un botón "Quitar zoom" que siempre se ve y se
      puede tocar, aunque la pantalla esté ampliada.

   Solo actúa en pantallas táctiles de teléfono o tableta; en la computadora
   no toca el zoom del navegador. Atributos del <script>:
     data-siempre   actúa aunque no parezca un teléfono (el mando)
     data-recargar  si el zoom sigue, abre la página de nuevo sin preguntar (el
                    mando; en el juego no, porque se perdería la partida: allí
                    solo se hace al tocar "Quitar zoom")
   ------------------------------------------------------------------ */
(() => {
  'use strict';
  const guion = document.currentScript;
  const siempre = !!guion?.hasAttribute('data-siempre');
  const recargar = !!guion?.hasAttribute('data-recargar');
  // Teléfono o tableta (el iPad nuevo se presenta como Mac pero tiene pantalla táctil)
  const esTactil = navigator.maxTouchPoints > 0
    && (/iPhone|iPad|iPod|Android|Mobi/i.test(navigator.userAgent) || /Macintosh/.test(navigator.userAgent));
  if (!siempre && !esTactil) return;

  const vista = window.visualViewport;
  // "Con zoom" = la pantalla no está a escala 1 (pellizco ya hecho)
  const conZoom = () => !!vista && Math.abs(vista.scale - 1) > 0.02;
  const contenidoViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');

  // Estilos propios: mientras hay zoom se suelta touch-action (pan-y, none...), que en
  // Safari también impide deshacer el zoom con los dedos; y el botón de salida.
  const estilo = document.createElement('style');
  estilo.textContent = [
    'html.con-zoom, html.con-zoom * { touch-action: auto !important; }',
    '.sin-zoom-salida { position: absolute; left: 0; top: 0; z-index: 2147483647; display: none; margin: 0;',
    '  transform-origin: 0 0; padding: 12px 18px; border: 2px solid #111; border-radius: 999px;',
    '  background: #ffd23f; color: #111; font: 700 16px/1.2 system-ui, -apple-system, sans-serif;',
    '  box-shadow: 0 4px 14px rgba(0, 0, 0, .5); user-select: none; -webkit-user-select: none; }',
  ].join('\n');
  document.head.appendChild(estilo);

  // 1) Pellizco ---------------------------------------------------------------
  const cancelarGesto = (evento) => { if (evento.cancelable && !conZoom()) evento.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((tipo) =>
    document.addEventListener(tipo, cancelarGesto, { passive: false }));
  // Safari también avisa del pellizco en los toques ("scale"); con dos dedos
  // moviéndose se cancela. Cancelar el movimiento no afecta a los eventos de
  // puntero que usan el joystick y los botones.
  document.addEventListener('touchmove', (evento) => {
    if (!evento.cancelable || conZoom()) return;
    if (evento.touches.length > 1 || (evento.scale !== undefined && evento.scale !== 1)) evento.preventDefault();
  }, { passive: false });

  // 2) Doble toque ------------------------------------------------------------
  // Los botones que se activan con "click" se dejan en paz (cancelar su toque
  // les quitaría el click); a esos los cubre touch-action. Los demás (fondo,
  // texto, palanca, botones A/B/X/Y del mando, tablero) sí se cubren aquí.
  const usaClick = (elemento) => !!elemento.closest?.('button, a, input, select, textarea, label, summary, [role="button"]')
    && !elemento.closest('[data-letter], [data-letra]');
  let ultimoToque = 0;
  document.addEventListener('touchend', (evento) => {
    const ahora = Date.now();
    const rapido = ahora - ultimoToque < 350;
    ultimoToque = ahora;
    if (rapido && evento.cancelable && !conZoom() && !usaClick(evento.target)) evento.preventDefault();
  }, { passive: false });

  // 3) Volver solo a la escala normal -----------------------------------------
  // Cambiar el "viewport" obliga a Safari a recalcular la escala: se pone un instante
  // uno con escala mínima = máxima = 1 (y otra escala inicial, para que cuente como
  // cambio) y se vuelve a dejar el de la página.
  function reiniciarEscala() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta || contenidoViewport === undefined) return;
    meta.setAttribute('content', 'width=device-width, initial-scale=1.01, minimum-scale=1, maximum-scale=1');
    setTimeout(() => meta.setAttribute('content', contenidoViewport), 150);
  }
  // Abrir la misma página de nuevo (una carga nueva empieza sin zoom). Sin preguntar,
  // como mucho una vez cada 10 s para no entrar en bucle.
  function puedeAbrirDeNuevo() {
    try {
      const ultimo = Number(sessionStorage.getItem('sin-zoom-reabrir') || 0);
      if (Date.now() - ultimo < 10000) return false;
      sessionStorage.setItem('sin-zoom-reabrir', String(Date.now()));
    } catch (e) { /* sin almacenamiento: se permite */ }
    return true;
  }
  function abrirDeNuevo() {
    const url = new URL(location.href);
    url.searchParams.set('r', String(Date.now()));
    location.replace(url.href);
  }

  // 4) Botón "Quitar zoom" -----------------------------------------------------
  // Con zoom, un elemento "fixed" puede quedar fuera de lo que se ve; este se coloca
  // en la esquina de la parte visible y se encoge para verse siempre del mismo tamaño.
  let salida = null;
  let salidaVisible = false;
  function colocarSalida() {
    if (!salida || !vista) return;
    const escala = vista.scale || 1;
    salida.style.transform = `translate(${vista.pageLeft + 12 / escala}px, ${vista.pageTop + 12 / escala}px) scale(${1 / escala})`;
  }
  function mostrarSalida(ver) {
    if (ver === salidaVisible) { if (ver) colocarSalida(); return; }
    salidaVisible = ver;
    if (ver && !salida) {
      salida = document.createElement('button');
      salida.type = 'button';
      salida.className = 'sin-zoom-salida';
      salida.textContent = 'Quitar zoom';
      salida.addEventListener('click', () => {
        reiniciarEscala();
        setTimeout(() => { if (conZoom()) abrirDeNuevo(); }, 700);
      });
      document.documentElement.appendChild(salida);
    }
    if (!salida) return;
    salida.style.display = ver ? 'block' : 'none';
    if (ver) colocarSalida();
  }

  // Seguimiento del zoom ----------------------------------------------------------
  let intentos = 0;
  let temporizador = null;
  function revisarZoom() {
    temporizador = null;
    if (!conZoom()) return;
    if (intentos >= 2) { mostrarSalida(true); return; }
    intentos += 1;
    reiniciarEscala();
    setTimeout(() => {
      if (!conZoom()) return;
      if (recargar && puedeAbrirDeNuevo()) abrirDeNuevo();
      else mostrarSalida(true);
    }, 900);
  }
  // Se revisa cuando el zoom deja de cambiar (si no, se pelearía con un pellizco en curso).
  const programar = () => { clearTimeout(temporizador); temporizador = setTimeout(revisarZoom, 350); };
  function actualizar() {
    const zoom = conZoom();
    document.documentElement.classList.toggle('con-zoom', zoom);
    if (zoom) { if (salidaVisible) colocarSalida(); programar(); return; }
    intentos = 0;
    clearTimeout(temporizador);
    temporizador = null;
    mostrarSalida(false);
  }
  vista?.addEventListener('resize', actualizar);
  vista?.addEventListener('scroll', () => { if (salidaVisible) colocarSalida(); });
  // Al girar el teléfono, al volver a la página y al cargarla
  window.addEventListener('orientationchange', () => setTimeout(actualizar, 400));
  window.addEventListener('pageshow', actualizar);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) actualizar(); });
  actualizar();
})();
