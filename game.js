/* ==================================================================
   ELIMINA EL MALWARE - LÓGICA DEL JUEGO
   Hecho con Phaser 3 (cargado por CDN en index.html)
   Todo el código está comentado en español para que sea
   fácil de entender y modificar por estudiantes principiantes.
   ================================================================== */

/* ------------------------------------------------------------------
   1. CONFIGURACIÓN DE LOS NIVELES
   Aquí se define la dificultad de cada nivel. Para cambiar la
   dificultad del juego, solo hay que modificar estos números.
   - virusRequeridos: cuántas amenazas reales hay que eliminar para
     pasar de nivel (los elementos "seguros" no cuentan)
   - tiempoAparicion: cada cuántos milisegundos aparece un elemento nuevo
   - tiempoVidaVirus: cuántos milisegundos dura un elemento en pantalla
     antes de expirar solo
   - probabilidadSeguro: probabilidad (0 a 1) de que el elemento
     generado sea un "falso positivo" (elemento seguro) en vez de
     una amenaza real
   ------------------------------------------------------------------ */
const NIVELES = [
  { numero: 1, virusRequeridos: 10, tiempoAparicion: 1800, tiempoVidaVirus: 2600, probabilidadSeguro: 0.15 },
  { numero: 2, virusRequeridos: 15, tiempoAparicion: 1300, tiempoVidaVirus: 2100, probabilidadSeguro: 0.25 },
  { numero: 3, virusRequeridos: 20, tiempoAparicion: 900, tiempoVidaVirus: 1700, probabilidadSeguro: 0.35 },
];

const VIDAS_INICIALES = 3;
const PUNTOS_POR_VIRUS = 10;

// Fuentes: Inter para etiquetas de interfaz, JetBrains Mono solo para
// cifras y etiquetas técnicas (según la identidad visual del proyecto)
const FUENTE_INTERFAZ = "'Inter', Arial, sans-serif";
const FUENTE_MONO = "'JetBrains Mono', Consolas, monospace";

// Paleta visual (debe coincidir con las variables de style.css)
const PALETA = {
  fondo: 0x07110f,
  superficie: 0x0d1b18,
  borde: 0x19362f,
  texto: '#e7f5ef',
  textoSecundario: '#91a8a0',
  verde: 0x00d99b,
  azul: 0x38bdf8,
  peligro: 0xff5c70,
};

// Tamaño lógico fijo del tablero (mínimo 1280x720, como pide el diseño).
// Todas las posiciones del HUD, el servidor y los elementos se calculan
// en este espacio fijo, sin importar la resolución física de la pantalla.
const ANCHO_JUEGO = 1280;
const ALTO_JUEGO = 720;

/* ------------------------------------------------------------------
   2. ESTADO GLOBAL DEL JUEGO
   Estas variables guardan lo que está pasando en la partida actual.
   ------------------------------------------------------------------ */
const estado = {
  puntuacion: 0,
  vidas: VIDAS_INICIALES,
  indiceNivel: 0, // 0 = nivel 1, 1 = nivel 2, 2 = nivel 3
  virusEliminados: 0, // cuenta solo amenazas reales eliminadas a tiempo
  virusActivos: [], // lista de elementos que están en pantalla ahora mismo
  juegoActivo: false,
};

/* ------------------------------------------------------------------
   3. SONIDOS SENCILLOS GENERADOS CON WEB AUDIO API
   No se descarga ningún archivo de audio: los sonidos se crean
   directamente en el navegador con osciladores.
   ------------------------------------------------------------------ */
let contextoAudio = null;

function obtenerContextoAudio() {
  if (!contextoAudio) {
    const AudioContextClase = window.AudioContext || window.webkitAudioContext;
    contextoAudio = new AudioContextClase();
  }
  return contextoAudio;
}

function reproducirSonido(tipo) {
  try {
    const ctx = obtenerContextoAudio();
    const oscilador = ctx.createOscillator();
    const volumen = ctx.createGain();
    oscilador.connect(volumen);
    volumen.connect(ctx.destination);

    if (tipo === 'eliminar') {
      // Sonido agudo y corto: amenaza eliminada con éxito
      oscilador.type = 'square';
      oscilador.frequency.setValueAtTime(880, ctx.currentTime);
      volumen.gain.setValueAtTime(0.12, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.15);
    } else if (tipo === 'perderVida') {
      // Sonido grave: una amenaza no fue eliminada a tiempo
      oscilador.type = 'sawtooth';
      oscilador.frequency.setValueAtTime(180, ctx.currentTime);
      volumen.gain.setValueAtTime(0.15, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.35);
    } else if (tipo === 'trampa') {
      // Sonido de error distinto: el jugador hizo clic en un falso positivo
      oscilador.type = 'square';
      oscilador.frequency.setValueAtTime(320, ctx.currentTime);
      oscilador.frequency.setValueAtTime(200, ctx.currentTime + 0.09);
      volumen.gain.setValueAtTime(0.13, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.22);
    } else if (tipo === 'nivelSuperado') {
      // Sonido corto de éxito: melodía ascendente al completar un nivel
      oscilador.type = 'triangle';
      oscilador.frequency.setValueAtTime(440, ctx.currentTime);
      oscilador.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      oscilador.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
      volumen.gain.setValueAtTime(0.12, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.45);
    } else if (tipo === 'victoria') {
      // Melodía alegre de varias notas ascendentes
      oscilador.type = 'triangle';
      [440, 554, 659, 880].forEach((frecuencia, indice) => {
        oscilador.frequency.setValueAtTime(frecuencia, ctx.currentTime + indice * 0.15);
      });
      volumen.gain.setValueAtTime(0.14, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.7);
    } else if (tipo === 'derrota') {
      // Sonido grave y descendente de fin de juego
      oscilador.type = 'sawtooth';
      oscilador.frequency.setValueAtTime(300, ctx.currentTime);
      oscilador.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
      volumen.gain.setValueAtTime(0.16, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.6);
    }
  } catch (error) {
    // Si el navegador bloquea el audio (por ejemplo, sin interacción previa), lo ignoramos
    console.warn('No se pudo reproducir el sonido:', error);
  }
}

/* ------------------------------------------------------------------
   4. MANEJO DE PANTALLAS (HTML)
   Muestra una pantalla y oculta las demás.
   ------------------------------------------------------------------ */
function mostrarPantalla(idPantalla) {
  const todasLasPantallas = document.querySelectorAll('.pantalla');
  todasLasPantallas.forEach((pantalla) => pantalla.classList.remove('activa'));
  document.getElementById(idPantalla).classList.add('activa');
}

function prefiereMovimientoReducido() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Anima el contador de puntos de la tarjeta "Nivel superado" desde el
// puntaje que tenía el jugador al iniciar el nivel hasta el resultado final
function animarConteoPuntos(desde, hasta, duracion = 650) {
  const elemento = document.getElementById('conteo-puntos-nivel');
  if (!elemento) return;

  if (prefiereMovimientoReducido() || desde === hasta) {
    elemento.textContent = hasta;
    return;
  }

  const inicio = performance.now();
  function paso(ahora) {
    const progreso = Math.min((ahora - inicio) / duracion, 1);
    elemento.textContent = Math.round(desde + (hasta - desde) * progreso);
    if (progreso < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

/* ------------------------------------------------------------------
   5. ÍCONOS VECTORIALES (dibujados con Phaser Graphics, sin emojis
   ni imágenes). Todos usan el mismo grosor de línea.
   ------------------------------------------------------------------ */

// Amenaza real: triángulo de alerta con signo de exclamación
function dibujarIconoAmenaza(g, color) {
  g.lineStyle(3.5, color, 1);
  g.beginPath();
  g.moveTo(0, -18);
  g.lineTo(16, 13);
  g.lineTo(-16, 13);
  g.closePath();
  g.strokePath();
  g.lineBetween(0, -5, 0, 4);
  g.fillStyle(color, 1);
  g.fillCircle(0, 9, 2);
}

// Elemento seguro: escudo con marca de verificación
function dibujarIconoSeguro(g, color) {
  g.lineStyle(3.5, color, 1);
  g.beginPath();
  g.moveTo(0, -18);
  g.lineTo(14, -11);
  g.lineTo(14, 3);
  g.lineTo(0, 18);
  g.lineTo(-14, 3);
  g.lineTo(-14, -11);
  g.closePath();
  g.strokePath();
  g.beginPath();
  g.moveTo(-6, 1);
  g.lineTo(-2, 6);
  g.lineTo(9, -6);
  g.strokePath();
}

// Segmento de escudo para representar una vida en el HUD
function dibujarEscudoVida(g, cx, cy, color, relleno) {
  const puntos = [
    [0, -14], [11, -10], [11, 3], [0, 16], [-11, 3], [-11, -10],
  ];
  g.lineStyle(3, color, 1);
  g.beginPath();
  puntos.forEach(([dx, dy], i) => {
    const px = cx + dx;
    const py = cy + dy;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
  if (relleno) {
    g.fillStyle(color, 0.22);
    g.fillPath();
  }
  g.strokePath();
}

/* ------------------------------------------------------------------
   6. ESCENA PRINCIPAL DE PHASER
   Aquí ocurre toda la generación procedural de elementos y el
   dibujo del tablero (HUD, servidor y fondo de red).
   ------------------------------------------------------------------ */
class EscenaJuego extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaJuego' });
  }

  create() {
    // El "mundo" del juego siempre mide 1280x720 unidades lógicas: todas
    // las posiciones (HUD, servidor, elementos) se calculan en este
    // espacio fijo, sin importar la resolución física de la pantalla.
    const ancho = ANCHO_JUEGO;
    const alto = ALTO_JUEGO;

    // Todo el tablero se dibuja dentro de un contenedor escalado según
    // devicePixelRatio (máx. 2): el canvas físico tiene más píxeles que
    // el mundo lógico, así que este contenedor "amplía" el dibujo para
    // llenarlo, dando nitidez sin cambiar ninguna coordenada del juego.
    this.factorResolucion = Math.min(window.devicePixelRatio || 1, 2);
    this.mundo = this.add.container(0, 0);
    this.mundo.setScale(this.factorResolucion);

    // Detecta si el usuario prefiere menos movimiento, para atenuar
    // las animaciones decorativas (partículas, sacudidas, destellos)
    this.movimientoReducido = prefiereMovimientoReducido();

    // Fondo oscuro + cuadrícula tenue + red decorativa de nodos
    this.mundo.add(this.add.rectangle(ancho / 2, alto / 2, ancho, alto, PALETA.fondo));
    this.dibujarFondoCircuito(ancho, alto);
    this.dibujarRedDecorativa(ancho, alto);

    this.crearHUD(ancho, alto);
    this.crearServidor(ancho, alto);

    // Rectángulo negro para oscurecer el tablero al completar un nivel
    this.overlayOscurecer = this.add.rectangle(ancho / 2, alto / 2, ancho, alto, 0x000000, 0.6).setAlpha(0);
    this.mundo.add(this.overlayOscurecer);

    // Área donde pueden aparecer los elementos (entre el HUD y el servidor)
    this.areaJuego = {
      xMin: 96,
      xMax: ancho - 96,
      yMin: 211,
      yMax: alto - 240,
    };

    this.contadorElementosNivel = 0;
    this.temporizadorSiguienteVirus = null;
    this.puntuacionInicioNivel = 0;

    this.actualizarHUD();
    this.iniciarNivelActual();
  }

  // Cada elemento activo dibuja un anillo que se reduce con el tiempo restante
  update() {
    estado.virusActivos.forEach((elemento) => {
      if (!elemento.temporizador || !elemento.anilloTiempo) return;
      const restante = 1 - elemento.temporizador.getProgress();
      const color = elemento.tipo === 'amenaza' ? PALETA.peligro : PALETA.azul;

      elemento.anilloTiempo.clear();
      elemento.anilloTiempo.lineStyle(4, color, 0.55);
      elemento.anilloTiempo.beginPath();
      const inicioAngulo = -Math.PI / 2;
      const finAngulo = inicioAngulo + Math.PI * 2 * restante;
      elemento.anilloTiempo.arc(0, 0, 56, inicioAngulo, finAngulo, false);
      elemento.anilloTiempo.strokePath();
    });
  }

  /* ---------------- TEXTO (helper con fuente e resolución consistentes) ---------------- */

  // Crea un Phaser.Text dentro del mundo escalado, con resolución alta
  // (setResolution) para que se vea nítido. Usa Inter para interfaz
  // general y JetBrains Mono solo para cifras/etiquetas técnicas.
  crearTexto(x, y, texto, opciones = {}) {
    const estiloTexto = this.add.text(x, y, texto, {
      fontFamily: opciones.mono ? FUENTE_MONO : FUENTE_INTERFAZ,
      fontSize: `${opciones.tamano || 16}px`,
      color: opciones.color || PALETA.texto,
      fontStyle: opciones.negrita ? 'bold' : 'normal',
      align: opciones.alinear || 'left',
    });
    estiloTexto.setResolution(this.factorResolucion);
    if (opciones.origenX !== undefined || opciones.origenY !== undefined) {
      estiloTexto.setOrigin(opciones.origenX ?? 0, opciones.origenY ?? 0);
    }
    this.mundo.add(estiloTexto);
    return estiloTexto;
  }

  // Etiqueta (Inter) + valor (JetBrains Mono) alineados a la izquierda.
  // Devuelve el texto del VALOR, que es el que se actualiza después.
  crearParEtiquetaValor(x, y, etiqueta, tamano) {
    const label = this.crearTexto(x, y, etiqueta, { tamano: tamano - 2, color: PALETA.textoSecundario });
    return this.crearTexto(x + label.width + 10, y, '', { tamano, mono: true, color: PALETA.texto });
  }

  /* ---------------- FONDO Y AMBIENTACIÓN ---------------- */

  // Dibuja unas líneas simples de cuadrícula para ambientar el fondo
  dibujarFondoCircuito(ancho, alto) {
    const graficos = this.add.graphics();
    graficos.lineStyle(1, PALETA.borde, 0.5);
    for (let x = 0; x < ancho; x += 96) {
      graficos.lineBetween(x, 0, x, alto);
    }
    for (let y = 0; y < alto; y += 96) {
      graficos.lineBetween(0, y, ancho, y);
    }
    this.mundo.add(graficos);
  }

  // Nodos y conexiones de red muy tenues, algunos con un pulso lento,
  // solo para ambientar el tablero sin llenar la pantalla
  dibujarRedDecorativa(ancho, alto) {
    const lineas = this.add.graphics();
    lineas.lineStyle(1, PALETA.azul, 0.1);
    this.mundo.add(lineas);

    const nodos = [];
    for (let i = 0; i < 6; i++) {
      nodos.push({
        x: Phaser.Math.Between(80, ancho - 80),
        y: Phaser.Math.Between(224, alto - 256),
      });
    }
    for (let i = 0; i < nodos.length - 1; i++) {
      lineas.lineBetween(nodos[i].x, nodos[i].y, nodos[i + 1].x, nodos[i + 1].y);
    }

    nodos.forEach((nodo, indice) => {
      const punto = this.add.circle(nodo.x, nodo.y, 3.5, PALETA.azul, 0.25);
      this.mundo.add(punto);
      if (!this.movimientoReducido && indice % 2 === 0) {
        this.tweens.add({
          targets: punto,
          alpha: 0.06,
          duration: 2400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    });
  }

  /* ---------------- HUD SUPERIOR ---------------- */

  crearHUD(ancho) {
    // Ícono simple de actividad/datos junto a la puntuación
    const iconoActividad = this.add.graphics();
    iconoActividad.lineStyle(3, PALETA.azul, 1);
    iconoActividad.beginPath();
    iconoActividad.moveTo(22, 42);
    iconoActividad.lineTo(30, 42);
    iconoActividad.lineTo(35, 29);
    iconoActividad.lineTo(42, 51);
    iconoActividad.lineTo(46, 38);
    iconoActividad.lineTo(53, 38);
    iconoActividad.strokePath();
    this.mundo.add(iconoActividad);

    this.textoPuntuacion = this.crearParEtiquetaValor(64, 27, 'PUNTOS', 24);

    // Nivel, alineado a la derecha: se crea el valor primero (para medir
    // su ancho) y la etiqueta se ubica justo antes, ambos con origen derecho
    this.textoNivel = this.crearTexto(ancho - 32, 27, '', {
      tamano: 24, mono: true, origenX: 1, origenY: 0,
    });
    this.etiquetaNivel = this.crearTexto(ancho - 32, 27, 'NIVEL', {
      tamano: 20, origenX: 1, origenY: 0, color: PALETA.textoSecundario,
    });

    this.textoAmenazas = this.crearParEtiquetaValor(32, 78, 'AMENAZAS', 19);

    // Barra de progreso de amenazas eliminadas
    this.barraProgresoX = 32;
    this.barraProgresoY = 107;
    this.barraProgresoAncho = ancho - 64;
    this.graficosProgreso = this.add.graphics();
    this.mundo.add(this.graficosProgreso);

    // Escudos de vida
    this.escudosX = 45;
    this.escudosY = 154;
    this.graficosEscudos = this.add.graphics();
    this.mundo.add(this.graficosEscudos);

    // Leyenda de colores
    this.crearTexto(ancho - 32, 142, 'Rojo: eliminar · Azul: ignorar', {
      tamano: 17, origenX: 1, origenY: 0, color: PALETA.textoSecundario,
    });
  }

  /* ---------------- SERVIDOR INFERIOR ---------------- */

  crearServidor(ancho, alto) {
    this.integridadX = 32;
    this.integridadY = alto - 186;
    this.integridadAncho = ancho - 64;
    this.graficosIntegridad = this.add.graphics();
    this.mundo.add(this.graficosIntegridad);

    this.servidorY = alto - 106;
    const rectServidor = this.add.rectangle(ancho / 2, this.servidorY, ancho - 64, 90, PALETA.superficie)
      .setStrokeStyle(1, PALETA.borde, 1);
    const textoServidor = this.crearTexto(ancho / 2, this.servidorY, 'SERVIDOR CENTRAL', {
      tamano: 22, mono: true, color: PALETA.textoSecundario, origenX: 0.5, origenY: 0.5,
    });

    // Rectángulo superpuesto, invisible por defecto, para el destello rojo
    this.overlayServidor = this.add
      .rectangle(ancho / 2, this.servidorY, ancho - 64, 90, PALETA.peligro, 0.5)
      .setAlpha(0);

    this.mundo.add([rectServidor, this.overlayServidor]);
    this.mundo.bringToTop(textoServidor);
  }

  // Breve destello rojo del servidor (error: amenaza escapada o falso positivo)
  destelloServidor() {
    if (this.movimientoReducido) {
      this.overlayServidor.setAlpha(0.45);
      this.time.delayedCall(120, () => this.overlayServidor.setAlpha(0));
      return;
    }
    this.tweens.add({
      targets: this.overlayServidor,
      alpha: { from: 0, to: 0.45 },
      duration: 130,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  /* ---------------- CONTROL DE NIVELES ---------------- */

  iniciarNivelActual() {
    estado.virusEliminados = 0;
    this.contadorElementosNivel = 0;
    this.puntuacionInicioNivel = estado.puntuacion;
    this.limpiarVirusActivos();
    this.actualizarHUD();

    // El juego trabaja con UN elemento a la vez: aparece el primero, y
    // cada vez que ese elemento se resuelve (clic o tiempo agotado) se
    // programa automáticamente la aparición del siguiente.
    this.programarSiguienteVirus();
  }

  // Programa la aparición del próximo elemento tras "tiempoAparicion" ms
  // (generación procedural: posición y tipo aleatorios en generarVirus()).
  programarSiguienteVirus() {
    if (!estado.juegoActivo) return;

    const configuracionNivel = NIVELES[estado.indiceNivel];
    this.temporizadorSiguienteVirus = this.time.delayedCall(
      configuracionNivel.tiempoAparicion,
      this.generarVirus,
      [],
      this
    );
  }

  limpiarVirusActivos() {
    if (this.temporizadorSiguienteVirus) {
      this.temporizadorSiguienteVirus.remove();
      this.temporizadorSiguienteVirus = null;
    }
    estado.virusActivos.forEach((elemento) => {
      if (elemento.temporizador) elemento.temporizador.remove();
      elemento.contenedor.destroy();
    });
    estado.virusActivos = [];
  }

  /* ---------------- GENERACIÓN PROCEDURAL DE ELEMENTOS ---------------- */

  generarVirus() {
    if (!estado.juegoActivo) return;

    const configuracionNivel = NIVELES[estado.indiceNivel];
    const area = this.areaJuego;

    // Posición aleatoria dentro del área de juego (generación procedural)
    const x = Phaser.Math.Between(area.xMin, area.xMax);
    const y = Phaser.Math.Between(area.yMin, area.yMax);

    // Decide si es una amenaza real o un falso positivo ("elemento seguro").
    // En el nivel 1, las primeras 3 amenazas nunca son falsos positivos.
    let tipo = 'amenaza';
    const protegerInicioNivel1 = estado.indiceNivel === 0 && this.contadorElementosNivel < 3;
    if (!protegerInicioNivel1 && Math.random() < configuracionNivel.probabilidadSeguro) {
      tipo = 'seguro';
    }
    this.contadorElementosNivel += 1;

    const color = tipo === 'amenaza' ? PALETA.peligro : PALETA.azul;

    // Un contenedor agrupa el círculo, el anillo de tiempo y el ícono
    const contenedor = this.add.container(x, y);
    this.mundo.add(contenedor);

    const circuloFondo = this.add.circle(0, 0, 48, PALETA.superficie, 0.95);
    circuloFondo.setStrokeStyle(3, color, 1);

    const anilloTiempo = this.add.graphics();

    const icono = this.add.graphics();
    if (tipo === 'amenaza') {
      dibujarIconoAmenaza(icono, color);
    } else {
      dibujarIconoSeguro(icono, color);
    }

    contenedor.add([circuloFondo, anilloTiempo, icono]);
    contenedor.setSize(96, 96);
    contenedor.setScale(0);

    // Animación de aparición: aumenta de tamaño suavemente
    this.tweens.add({
      targets: contenedor,
      scale: 1,
      duration: this.movimientoReducido ? 1 : 180,
      ease: 'Sine.Out',
    });

    // El círculo es interactivo: se puede hacer clic/tocar sobre él
    circuloFondo.setInteractive({ useHandCursor: true });

    const elemento = { contenedor, circuloFondo, anilloTiempo, tipo, temporizador: null };

    circuloFondo.on('pointerdown', () => {
      this.eliminarVirus(elemento, true);
    });

    // Temporizador: si expira sin clic, se resuelve como "no atendido"
    elemento.temporizador = this.time.delayedCall(configuracionNivel.tiempoVidaVirus, () => {
      this.eliminarVirus(elemento, false);
    });

    estado.virusActivos.push(elemento);
  }

  /* ---------------- RESOLVER UN ELEMENTO (clic o expiración) ---------------- */

  eliminarVirus(elemento, fueEliminadoPorClic) {
    // Evita procesar el mismo elemento dos veces (por ejemplo, clic justo cuando expira)
    if (elemento.procesado) return;
    elemento.procesado = true;

    if (elemento.temporizador) elemento.temporizador.remove();

    const indice = estado.virusActivos.indexOf(elemento);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    const duracionSalida = this.movimientoReducido ? 1 : 220;

    if (elemento.tipo === 'amenaza' && fueEliminadoPorClic) {
      // Amenaza real eliminada a tiempo: suma puntos y cuenta para el nivel
      estado.puntuacion += PUNTOS_POR_VIRUS;
      estado.virusEliminados += 1;
      reproducirSonido('eliminar');
      this.crearParticulas(elemento.contenedor.x, elemento.contenedor.y, PALETA.verde);

      this.tweens.add({
        targets: elemento.contenedor,
        scale: 1.5,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, '+10', PALETA.verde);
    } else if (elemento.tipo === 'amenaza' && !fueEliminadoPorClic) {
      // Amenaza real no eliminada a tiempo: se pierde una vida
      estado.vidas -= 1;
      reproducirSonido('perderVida');
      this.destelloServidor();

      this.tweens.add({
        targets: elemento.contenedor,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, '-1 VIDA', PALETA.peligro);
    } else if (elemento.tipo === 'seguro' && fueEliminadoPorClic) {
      // Falso positivo: el jugador hizo clic en un elemento seguro
      estado.vidas -= 1;
      reproducirSonido('trampa');
      if (!this.movimientoReducido) this.cameras.main.shake(110, 0.005);
      this.destelloServidor();

      this.tweens.add({
        targets: elemento.contenedor,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(
        elemento.contenedor.x,
        elemento.contenedor.y,
        [
          { texto: 'Falso positivo', fuente: FUENTE_INTERFAZ, tamano: 20 },
          { texto: '-1 vida', fuente: FUENTE_MONO, tamano: 20 },
        ],
        PALETA.peligro
      );
    } else {
      // Elemento seguro ignorado correctamente: no ocurre nada
      this.tweens.add({
        targets: elemento.contenedor,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });
    }

    this.actualizarHUD();
    this.verificarEstadoJuego();

    // Si el juego sigue activo (no hubo derrota ni se completó el nivel),
    // se genera automáticamente el siguiente elemento.
    if (estado.juegoActivo) {
      this.programarSiguienteVirus();
    }
  }

  // Pequeño estallido de partículas (círculos que se alejan y se desvanecen)
  crearParticulas(x, y, color) {
    if (this.movimientoReducido) return;

    const cantidad = 8;
    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + Phaser.Math.FloatBetween(-0.15, 0.15);
      const distancia = Phaser.Math.Between(42, 67);
      const particula = this.add.circle(x, y, 5, color, 1);
      this.mundo.add(particula);

      this.tweens.add({
        targets: particula,
        x: x + Math.cos(angulo) * distancia,
        y: y + Math.sin(angulo) * distancia,
        alpha: 0,
        scale: 0.4,
        duration: 420,
        ease: 'Quad.Out',
        onComplete: () => particula.destroy(),
      });
    }
  }

  // Estallido de "datos digitales" (pequeños bloques rectangulares verdes y
  // azules, no confeti) usado al completar un nivel
  crearParticulasDatos(x, y) {
    const cantidad = 14;
    for (let i = 0; i < cantidad; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const distancia = Phaser.Math.Between(60, 160);
      const color = i % 2 === 0 ? PALETA.verde : PALETA.azul;
      const bit = this.add.rectangle(x, y, 6, 11, color, 1);
      bit.setRotation(angulo);
      this.mundo.add(bit);

      this.tweens.add({
        targets: bit,
        x: x + Math.cos(angulo) * distancia,
        y: y + Math.sin(angulo) * distancia,
        alpha: 0,
        duration: 650,
        ease: 'Quad.Out',
        onComplete: () => bit.destroy(),
      });
    }
  }

  // Onda que se expande desde un punto (usada en el servidor al superar un nivel)
  crearOndaExpansiva(x, y, color) {
    const onda = this.add.graphics();
    this.mundo.add(onda);
    const estadoOnda = { radio: 14, alpha: 0.8 };

    this.tweens.add({
      targets: estadoOnda,
      radio: 260,
      alpha: 0,
      duration: 550,
      ease: 'Quad.Out',
      onUpdate: () => {
        onda.clear();
        onda.lineStyle(4, color, estadoOnda.alpha);
        onda.strokeCircle(x, y, estadoOnda.radio);
      },
      onComplete: () => onda.destroy(),
    });
  }

  // Pequeño texto que sube y se desvanece, como retroalimentación visual.
  // "contenido" puede ser un string (una sola línea, JetBrains Mono) o un
  // arreglo de { texto, fuente, tamano } para mensajes de varias líneas.
  mostrarTextoFlotante(x, y, contenido, color) {
    const lineas = Array.isArray(contenido) ? contenido : [{ texto: contenido, fuente: FUENTE_MONO, tamano: 26 }];

    const contenedor = this.add.container(x, y);
    this.mundo.add(contenedor);

    const alturaLinea = 24;
    const inicioY = -((lineas.length - 1) * alturaLinea) / 2;

    const textos = lineas.map((linea, indice) => {
      const t = this.add.text(0, inicioY + indice * alturaLinea, linea.texto, {
        fontFamily: linea.fuente || FUENTE_MONO,
        fontSize: `${linea.tamano || 26}px`,
        color: color,
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      t.setResolution(this.factorResolucion);
      return t;
    });
    contenedor.add(textos);

    this.tweens.add({
      targets: contenedor,
      y: y - 80,
      alpha: 0,
      duration: this.movimientoReducido ? 400 : 700,
      onComplete: () => contenedor.destroy(),
    });
  }

  /* ---------------- HUD (actualización de valores) ---------------- */

  dibujarBarraProgreso(proporcion) {
    this.graficosProgreso.clear();
    this.graficosProgreso.fillStyle(PALETA.borde, 1);
    this.graficosProgreso.fillRoundedRect(
      this.barraProgresoX, this.barraProgresoY, this.barraProgresoAncho, 13, 6
    );
    if (proporcion > 0) {
      this.graficosProgreso.fillStyle(PALETA.verde, 1);
      this.graficosProgreso.fillRoundedRect(
        this.barraProgresoX, this.barraProgresoY,
        Math.max(this.barraProgresoAncho * proporcion, 13), 13, 6
      );
    }
  }

  actualizarHUD() {
    const configuracionNivel = NIVELES[estado.indiceNivel];
    const vidasActuales = Math.max(estado.vidas, 0);

    this.textoPuntuacion.setText(`${estado.puntuacion}`);

    this.textoNivel.setText(`${configuracionNivel.numero}/${NIVELES.length}`);
    this.etiquetaNivel.x = this.textoNivel.x - this.textoNivel.width - 10;

    this.textoAmenazas.setText(`${estado.virusEliminados}/${configuracionNivel.virusRequeridos}`);

    // Barra de progreso (amenazas eliminadas / objetivo del nivel)
    const proporcion = Phaser.Math.Clamp(
      estado.virusEliminados / configuracionNivel.virusRequeridos, 0, 1
    );
    this.dibujarBarraProgreso(proporcion);

    // Escudos de vida (3 segmentos)
    this.graficosEscudos.clear();
    for (let i = 0; i < VIDAS_INICIALES; i++) {
      const cx = this.escudosX + i * 38;
      const activo = i < vidasActuales;
      dibujarEscudoVida(this.graficosEscudos, cx, this.escudosY, activo ? PALETA.verde : PALETA.borde, activo);
    }

    // Barra de integridad del servidor (según las vidas restantes)
    const proporcionIntegridad = vidasActuales / VIDAS_INICIALES;
    this.graficosIntegridad.clear();
    this.graficosIntegridad.fillStyle(PALETA.borde, 1);
    this.graficosIntegridad.fillRoundedRect(
      this.integridadX, this.integridadY, this.integridadAncho, 10, 5
    );
    if (proporcionIntegridad > 0) {
      this.graficosIntegridad.fillStyle(
        proporcionIntegridad > 0.34 ? PALETA.verde : PALETA.peligro, 1
      );
      this.graficosIntegridad.fillRoundedRect(
        this.integridadX, this.integridadY, this.integridadAncho * proporcionIntegridad, 10, 5
      );
    }
  }

  /* ---------------- VERIFICAR VICTORIA / DERROTA / NIVEL COMPLETADO ---------------- */

  verificarEstadoJuego() {
    if (estado.vidas <= 0) {
      this.finalizarPorDerrota();
      return;
    }

    const configuracionNivel = NIVELES[estado.indiceNivel];
    if (estado.virusEliminados >= configuracionNivel.virusRequeridos) {
      this.finalizarPorNivelCompletado();
    }
  }

  finalizarPorDerrota() {
    estado.juegoActivo = false;
    this.limpiarVirusActivos();
    reproducirSonido('derrota');

    document.getElementById('texto-puntaje-derrota').textContent =
      `Puntuación final: ${estado.puntuacion} puntos`;
    mostrarPantalla('pantalla-derrota');
  }

  // Secuencia visual que se reproduce en el canvas antes de mostrar la
  // tarjeta HTML de "Nivel superado": no se generan más elementos (los
  // clics ya están bloqueados porque no hay nada que clickear), se
  // resalta la barra de progreso, una onda sale del servidor con
  // partículas de datos, y el tablero se oscurece antes de cambiar de
  // pantalla.
  reproducirSecuenciaLogro(callback) {
    reproducirSonido('nivelSuperado');

    if (this.movimientoReducido) {
      // Con movimiento reducido, solo un breve cambio de opacidad
      this.tweens.add({
        targets: this.overlayOscurecer,
        alpha: { from: 0, to: 1 },
        duration: 1,
        onComplete: () => {
          callback();
          this.overlayOscurecer.setAlpha(0);
        },
      });
      return;
    }

    const cx = ANCHO_JUEGO / 2;
    const cy = this.servidorY;

    // 2) Resaltar la barra de progreso (ya está completa)
    this.tweens.add({
      targets: this.graficosProgreso,
      alpha: { from: 1, to: 0.35 },
      duration: 150,
      yoyo: true,
      ease: 'Quad.InOut',
    });

    // 3) Onda expandiéndose desde el servidor + partículas de datos
    this.crearOndaExpansiva(cx, cy, PALETA.verde);
    this.crearParticulasDatos(cx, cy);

    // 5) Oscurecer el tablero antes de mostrar la tarjeta
    this.time.delayedCall(350, () => {
      this.mundo.bringToTop(this.overlayOscurecer);
      this.tweens.add({
        targets: this.overlayOscurecer,
        alpha: { from: 0, to: 1 },
        duration: 250,
        onComplete: () => {
          callback();
          this.overlayOscurecer.setAlpha(0);
        },
      });
    });
  }

  finalizarPorNivelCompletado() {
    estado.juegoActivo = false;
    this.limpiarVirusActivos();

    const esUltimoNivel = estado.indiceNivel === NIVELES.length - 1;
    const puntuacionInicial = this.puntuacionInicioNivel;

    this.reproducirSecuenciaLogro(() => {
      if (esUltimoNivel) {
        reproducirSonido('victoria');
        document.getElementById('texto-puntaje-victoria').textContent =
          `Puntuación final: ${estado.puntuacion} puntos`;
        mostrarPantalla('pantalla-victoria');
      } else {
        const configuracionNivel = NIVELES[estado.indiceNivel];
        document.getElementById('texto-nivel-completado').textContent =
          `Superaste el nivel ${configuracionNivel.numero} con ${estado.puntuacion} puntos.`;
        animarConteoPuntos(puntuacionInicial, estado.puntuacion);
        mostrarPantalla('pantalla-nivel-completado');
      }
    });
  }
}

/* ------------------------------------------------------------------
   7. CONFIGURACIÓN Y CREACIÓN DEL JUEGO PHASER
   ------------------------------------------------------------------ */

// Factor de nitidez: más píxeles físicos en pantallas de alta densidad
// (Retina, etc.), limitado a 2x para no exigir demasiado a equipos modestos.
const FACTOR_RESOLUCION = Math.min(window.devicePixelRatio || 1, 2);

const configuracionPhaser = {
  type: Phaser.AUTO,
  parent: 'contenedor-phaser',
  // El canvas físico es más grande que el mundo lógico (1280x720); la
  // escena compensa con el contenedor "mundo" escalado para que las
  // coordenadas del juego no cambien. Así el tablero se ve nítido y no
  // pixelado, tanto en pantallas normales como de alta densidad.
  width: Math.round(ANCHO_JUEGO * FACTOR_RESOLUCION),
  height: Math.round(ALTO_JUEGO * FACTOR_RESOLUCION),
  backgroundColor: '#07110f',
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [EscenaJuego],
};

let juegoPhaser = null;

/* ------------------------------------------------------------------
   8. FUNCIONES DE CONTROL GENERAL DEL JUEGO (conectan HTML con Phaser)
   ------------------------------------------------------------------ */

function reiniciarEstado() {
  estado.puntuacion = 0;
  estado.vidas = VIDAS_INICIALES;
  estado.indiceNivel = 0;
  estado.virusEliminados = 0;
  estado.virusActivos = [];
  estado.juegoActivo = true;
}

function iniciarJuegoDesdeCero() {
  reiniciarEstado();
  mostrarPantalla('pantalla-juego');

  if (!juegoPhaser) {
    // Primera vez: se crea la instancia de Phaser
    juegoPhaser = new Phaser.Game(configuracionPhaser);
  } else {
    // Ya existía una partida: reiniciamos la escena desde el principio
    juegoPhaser.scene.stop('EscenaJuego');
    juegoPhaser.scene.start('EscenaJuego');
  }
}

// Se ejecuta al presionar "Continuar" en la tarjeta de nivel superado:
// 1) desvanece la tarjeta, 2) muestra una pantalla breve de transición
// con una línea de escaneo, 3) comienza el siguiente nivel. Todo dura
// menos de dos segundos (o casi nada con movimiento reducido).
function continuarAlSiguienteNivel() {
  const panel = document.getElementById('panel-nivel-completado');
  const reducido = prefiereMovimientoReducido();
  const duracionSalida = reducido ? 30 : 200;
  const duracionTransicion = reducido ? 350 : 900;

  panel.classList.add('saliendo');

  setTimeout(() => {
    estado.indiceNivel += 1;
    const siguienteNivel = NIVELES[estado.indiceNivel];
    document.getElementById('texto-transicion').textContent =
      `Inicializando nivel ${siguienteNivel.numero}/${NIVELES.length}`;
    mostrarPantalla('pantalla-transicion');

    setTimeout(() => {
      panel.classList.remove('saliendo');
      estado.juegoActivo = true;
      mostrarPantalla('pantalla-juego');

      const escena = juegoPhaser.scene.keys['EscenaJuego'];
      escena.iniciarNivelActual();
    }, duracionTransicion);
  }, duracionSalida);
}

/* ------------------------------------------------------------------
   9. CONEXIÓN DE BOTONES DEL HTML
   ------------------------------------------------------------------ */
document.getElementById('btn-jugar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-siguiente-nivel').addEventListener('click', continuarAlSiguienteNivel);
document.getElementById('btn-reintentar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-jugar-de-nuevo').addEventListener('click', iniciarJuegoDesdeCero);
