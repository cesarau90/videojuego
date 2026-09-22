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
  {
    numero: 1, virusRequeridos: 10, tiempoAparicion: 1800, tiempoVidaVirus: 4000, probabilidadSeguro: 0.15,
    maxElementos: 2, probabilidadMovimiento: 0.15, probabilidadCritica: 0.08, probabilidadResistente: 0,
    velocidadMin: 0.4, velocidadMax: 0.7,
    probabilidadDuplicador: 0,
  },
  {
    numero: 2, virusRequeridos: 15, tiempoAparicion: 1300, tiempoVidaVirus: 3400, probabilidadSeguro: 0.25,
    maxElementos: 3, probabilidadMovimiento: 0.4, probabilidadCritica: 0.12, probabilidadResistente: 0.1,
    velocidadMin: 0.6, velocidadMax: 1.0,
    probabilidadDuplicador: 0.12,
  },
  {
    numero: 3, virusRequeridos: 25, tiempoAparicion: 900, tiempoVidaVirus: 3000, probabilidadSeguro: 0.35,
    maxElementos: 4, probabilidadMovimiento: 0.7, probabilidadCritica: 0.15, probabilidadResistente: 0.15,
    velocidadMin: 0.9, velocidadMax: 1.4,
    probabilidadDuplicador: 0.18,
  },
];

const VIDAS_INICIALES = 3;

// Probabilidad de que aparezca el elemento de reparación cuando hay al
// menos un servidor fuera de línea (máximo una vez por nivel)
const PROBABILIDAD_REPARACION = 0.22;

// Umbrales de progreso (proporción de amenazas eliminadas) en los que se
// activa la sobrecarga de red, por nivel: el nivel 1 no la tiene, el nivel 2
// la activa una vez a la mitad, y el nivel 3 la activa dos veces.
const UMBRALES_SOBRECARGA = [[], [0.5], [0.4, 0.75]];

// Puntos base por tipo de amenaza real (antes de aplicar el multiplicador de combo)
const PUNTOS_POR_TIPO = {
  amenaza: 10, critica: 20, resistente: 15,
  duplicado_pequeno: 5,
};

// Una amenaza "real" es cualquier tipo que cuenta para el objetivo del nivel
// y que, si escapa, cuesta un servidor. Los archivos seguros y los elementos
// especiales que no se "eliminan" directamente (reparación, duplicador) no lo son.
function esAmenazaReal(tipo) {
  return tipo === 'amenaza' || tipo === 'critica' || tipo === 'resistente' || tipo === 'duplicado_pequeno';
}

// Multiplicador de combo: x1 (0-2 aciertos), x2 (3-5), x3 (6 o más)
function calcularMultiplicadorCombo(combo) {
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

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
  // Colores adicionales usados solo por los jefes de nivel
  naranja: 0xff9f45,
  morado: 0xa855f7,
  magenta: 0xec4899,
  // Versiones en texto (CSS) de los mismos colores, para usarlas en
  // Phaser.Text (que espera cadenas de color, no números)
  verdeTexto: '#00d99b',
  azulTexto: '#38bdf8',
  peligroTexto: '#ff5c70',
  naranjaTexto: '#ff9f45',
  moradoTexto: '#a855f7',
  magentaTexto: '#ec4899',
};

// Color de cada tipo de elemento (usado en el aro, el ícono, la línea
// de objetivo y las partículas de retroalimentación)
function colorPorTipo(tipo) {
  if (tipo === 'amenaza' || tipo === 'duplicado_pequeno') return PALETA.peligro;
  if (tipo === 'duplicador') return PALETA.magenta;
  if (tipo === 'reparacion') return PALETA.verde;
  if (tipo === 'critica') return PALETA.naranja;
  if (tipo === 'resistente') return PALETA.morado;
  return PALETA.azul; // 'seguro'
}

// Tamaño lógico fijo del tablero de escritorio (mínimo 1280x720, como pide
// el diseño). Todas las posiciones del HUD, el servidor y los elementos se
// calculan en este espacio fijo cuando NO se está en vista móvil.
const ANCHO_JUEGO = 1280;
const ALTO_JUEGO = 720;

/* ------------------------------------------------------------------
   1C. TABLERO RESPONSIVE PARA MÓVIL (≤768px)
   En vista móvil el tablero deja de usar el mundo fijo 1280x720 y en su
   lugar usa un mundo lógico VERTICAL cuya proporción se calcula a partir
   del ancho y alto reales de la pantalla del teléfono (para llenar el
   espacio disponible sin estirar ni recortar nada). La altura lógica se
   mantiene fija (para que las fuentes y márgenes absolutos sigan viendose
   igual de bien) y solo el ancho lógico varía según la proporción real.
   ------------------------------------------------------------------ */
const ALTO_JUEGO_MOVIL = 1280;
const ANCHO_JUEGO_MOVIL_MIN = 480;
const ANCHO_JUEGO_MOVIL_MAX = 900;
const PUNTO_QUIEBRE_MOVIL = 768;

// true si la pantalla actual entra en el punto de quiebre móvil. Combina
// dos condiciones para no confundir un teléfono con una laptop:
// 1) La dimensión MÁS PEQUEÑA (ancho o alto) es angosta: así un teléfono
//    sigue tratándose como móvil sin importar su orientación (un
//    teléfono de 390x844 mide igual de "angosto" al rotarlo a 844x390,
//    ahora es el alto el que mide 390).
// 2) El dispositivo es principalmente táctil (sin mouse/trackpad de
//    precisión), para no activar la vista móvil en laptops de pantalla
//    corta (por ejemplo, 1366x768, muy comunes) que sí tienen un puntero
//    fino.
// Se reevalúa en cada llamada, así que responde a rotaciones y cambios de
// tamaño de ventana sin necesidad de recargar la página.
function esVistaMovil() {
  const ladoMenor = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  if (!(ladoMenor > 0 && ladoMenor <= PUNTO_QUIEBRE_MOVIL)) return false;
  if (!window.matchMedia) return true;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

// Calcula las dimensiones lógicas del tablero según el modo actual:
// - Escritorio: siempre 1280x720 fijo (sin cambios respecto al diseño
//   original).
// - Móvil: alto fijo (ALTO_JUEGO_MOVIL) y ancho calculado a partir de la
//   proporción real ancho/alto de la ventana, para que el tablero llene la
//   pantalla vertical sin deformarse (se limita a un rango razonable).
function calcularDimensionesLogicas() {
  if (!esVistaMovil()) return { ancho: ANCHO_JUEGO, alto: ALTO_JUEGO };
  const vw = window.innerWidth || ANCHO_JUEGO_MOVIL_MIN;
  const vh = window.innerHeight || ALTO_JUEGO_MOVIL;
  const alto = ALTO_JUEGO_MOVIL;
  const anchoCalculado = Math.round(alto * (vw / vh));
  const ancho = Phaser.Math.Clamp(anchoCalculado, ANCHO_JUEGO_MOVIL_MIN, ANCHO_JUEGO_MOVIL_MAX);
  return { ancho, alto };
}

// Dimensiones lógicas usadas para construir el juego (se fija una vez al
// crear la instancia de Phaser y se actualiza en cada reajuste de tablero)
let dimensionesLogicasActuales = { ancho: ANCHO_JUEGO, alto: ALTO_JUEGO };

/* ------------------------------------------------------------------
   1B. CONFIGURACIÓN DE LOS JEFES (uno por nivel)
   Aparecen al alcanzar el objetivo de amenazas reales del nivel.
   El nivel no se considera superado hasta derrotarlos.
   ------------------------------------------------------------------ */
const JEFES = [
  {
    id: 'troyano',
    nombre: 'TROYANO',
    subtitulo: 'ACCESO NO AUTORIZADO',
    vidaMaxima: 3,
    tiempoAtaque: 7000,
    colorPrincipal: PALETA.naranja,
    colorSecundario: PALETA.naranja,
    puntosRecompensa: 50,
    movimiento: 'fijo', // casi fijo, pequeño desplazamiento tras cada golpe
    generaTrampas: false,
    maxTrampas: 0,
    puntoDebil: false,
  },
  {
    id: 'botnet',
    nombre: 'BOTNET',
    subtitulo: 'CONTROLADOR CENTRAL',
    vidaMaxima: 5,
    tiempoAtaque: 6000,
    colorPrincipal: PALETA.azul,
    colorSecundario: PALETA.morado,
    puntosRecompensa: 100,
    movimiento: 'salto', // cambia de posición tras cada golpe
    generaTrampas: true,
    maxTrampas: 1,
    puntoDebil: false,
  },
  {
    id: 'ransomware',
    nombre: 'RANSOMWARE',
    subtitulo: 'NÚCLEO PRINCIPAL',
    vidaMaxima: 8,
    tiempoAtaque: 5000,
    colorPrincipal: PALETA.peligro,
    colorSecundario: PALETA.magenta,
    puntosRecompensa: 200,
    movimiento: 'lento', // se desplaza continuamente por el tablero
    generaTrampas: true,
    maxTrampas: 2,
    puntoDebil: true,
    faseCambioVida: 4, // al perder esta cantidad de vida entra en fase 2
  },
];

// ---- Formas vectoriales de cada jefe (Phaser Graphics, sin emojis) ----

function dibujarFormaTroyano(g, color) {
  g.lineStyle(4, color, 1);
  const radio = 40;
  const puntos = [];
  for (let i = 0; i < 6; i++) {
    const angulo = (Math.PI / 3) * i - Math.PI / 2;
    puntos.push([Math.cos(angulo) * radio, Math.sin(angulo) * radio]);
  }
  g.beginPath();
  puntos.forEach(([px, py], i) => (i === 0 ? g.moveTo(px, py) : g.lineTo(px, py)));
  g.closePath();
  g.strokePath();
  // Flecha de infiltración (metáfora del troyano entrando al sistema)
  g.lineBetween(0, -34, 0, 6);
  g.beginPath();
  g.moveTo(-10, -4);
  g.lineTo(0, 8);
  g.lineTo(10, -4);
  g.strokePath();
}

function dibujarFormaBotnet(g, colorNucleo, colorNodo) {
  g.lineStyle(4, colorNucleo, 1);
  g.strokeCircle(0, 0, 26);
  const radioOrbita = 46;
  for (let i = 0; i < 5; i++) {
    const angulo = ((Math.PI * 2) / 5) * i - Math.PI / 2;
    const nx = Math.cos(angulo) * radioOrbita;
    const ny = Math.sin(angulo) * radioOrbita;
    g.lineStyle(1.5, colorNodo, 0.6);
    g.lineBetween(0, 0, nx, ny);
    g.fillStyle(colorNodo, 1);
    g.fillCircle(nx, ny, 7);
  }
}

function dibujarFormaRansomware(g, colorCuerpo, colorAcento) {
  g.lineStyle(4, colorAcento, 1);
  g.beginPath();
  g.arc(0, -14, 16, Math.PI, 0, false);
  g.strokePath();
  g.fillStyle(colorCuerpo, 1);
  g.fillRoundedRect(-24, -10, 48, 38, 8);
  g.lineStyle(3, colorAcento, 1);
  g.strokeRoundedRect(-24, -10, 48, 38, 8);
}

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
  jefeActivo: false, // true durante el combate contra el jefe del nivel
  combo: 0, // aciertos consecutivos sobre amenazas reales (parte normal del nivel)
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
    } else if (tipo === 'alertaJefe') {
      // Alarma corta: aparece la amenaza principal (jefe) del nivel
      oscilador.type = 'sawtooth';
      oscilador.frequency.setValueAtTime(500, ctx.currentTime);
      oscilador.frequency.setValueAtTime(350, ctx.currentTime + 0.15);
      oscilador.frequency.setValueAtTime(500, ctx.currentTime + 0.3);
      volumen.gain.setValueAtTime(0.14, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.5);
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
    } else if (tipo === 'combo') {
      // Nota corta cuando el combo sube de nivel
      oscilador.type = 'triangle';
      oscilador.frequency.setValueAtTime(660, ctx.currentTime);
      oscilador.frequency.setValueAtTime(990, ctx.currentTime + 0.08);
      volumen.gain.setValueAtTime(0.11, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.18);
    } else if (tipo === 'escudo') {
      // Golpe metálico corto: se rompió el escudo de una amenaza resistente
      oscilador.type = 'square';
      oscilador.frequency.setValueAtTime(700, ctx.currentTime);
      volumen.gain.setValueAtTime(0.1, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.12);
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

// Malware crítico: rayo (representa un ataque rápido y de alto impacto)
function dibujarIconoCritico(g, color) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(4, -18);
  g.lineTo(-10, 2);
  g.lineTo(-1, 2);
  g.lineTo(-4, 18);
  g.lineTo(10, -4);
  g.lineTo(1, -4);
  g.closePath();
  g.fillPath();
}

// Malware resistente: "bug" con patas (representa malware persistente,
// que necesita dos golpes: el primero rompe su escudo exterior)
function dibujarIconoResistente(g, color) {
  g.lineStyle(3.5, color, 1);
  g.strokeEllipse(0, 2, 20, 26);
  for (let signo = -1; signo <= 1; signo += 2) {
    g.lineBetween(signo * 9, -6, signo * 19, -12);
    g.lineBetween(signo * 10, 2, signo * 21, 2);
    g.lineBetween(signo * 9, 10, signo * 19, 16);
  }
  g.fillStyle(color, 1);
  g.fillCircle(0, -14, 3);
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

// Malware duplicador: un punto se divide en dos (representa su división al recibir el clic)
function dibujarIconoDuplicador(g, color) {
  g.lineStyle(3.5, color, 1);
  g.lineBetween(0, -17, 0, -3);
  g.lineBetween(0, -3, -13, 15);
  g.lineBetween(0, -3, 13, 15);
  g.fillStyle(color, 1);
  g.fillCircle(0, -17, 3.2);
  g.fillCircle(-13, 15, 3.2);
  g.fillCircle(13, 15, 3.2);
}

// Reparación de servidor: cruz de herramienta/mantenimiento
function dibujarIconoReparacion(g, color) {
  g.lineStyle(4, color, 1);
  g.lineBetween(0, -15, 0, 15);
  g.lineBetween(-15, 0, 15, 0);
}

// Selecciona la función de dibujo según el tipo de elemento (usada tanto al
// crearlo como al redibujarlo, por ejemplo al recuperar su color original)
function dibujarIconoPorTipo(g, tipo, color) {
  if (tipo === 'amenaza' || tipo === 'duplicado_pequeno') dibujarIconoAmenaza(g, color);
  else if (tipo === 'critica') dibujarIconoCritico(g, color);
  else if (tipo === 'resistente') dibujarIconoResistente(g, color);
  else if (tipo === 'duplicador') dibujarIconoDuplicador(g, color);
  else if (tipo === 'reparacion') dibujarIconoReparacion(g, color);
  else dibujarIconoSeguro(g, color);
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
    // El "mundo" del juego mide 1280x720 unidades lógicas en escritorio, o
    // un tamaño vertical calculado según la pantalla real en vista móvil
    // (ver calcularDimensionesLogicas). Todas las posiciones (HUD,
    // servidores, elementos) se calculan en este espacio lógico, sin
    // importar la resolución física de la pantalla.
    this.esVistaMovilActual = esVistaMovil();
    this.anchoLogico = dimensionesLogicasActuales.ancho;
    this.altoLogico = dimensionesLogicasActuales.alto;

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

    // Fondo, cuadrícula, red decorativa, HUD y servidores viven dentro de
    // "capaTablero": un contenedor que se puede reconstruir por completo
    // (ver construirTablero/reajustarTablero) cuando cambia el tamaño de
    // pantalla o la orientación en vista móvil, sin afectar el resto.
    this.construirTablero(this.anchoLogico, this.altoLogico);

    // Rectángulo negro para oscurecer el tablero al completar un nivel
    this.overlayOscurecer = this.add
      .rectangle(this.anchoLogico / 2, this.altoLogico / 2, this.anchoLogico, this.altoLogico, 0x000000, 0.6)
      .setAlpha(0);
    this.mundo.add(this.overlayOscurecer);

    // Área donde pueden aparecer los elementos (entre el HUD y el servidor)
    this.areaJuego = this.calcularAreaJuego(this.anchoLogico, this.altoLogico);

    // En vista móvil, reacciona a cambios de tamaño/orientación (rotar el
    // teléfono, etc.) reajustando el tablero en vivo en vez de recargarlo.
    if (this.esVistaMovilActual) {
      this.registrarListenerRedimension();
    }

    this.contadorElementosNivel = 0;
    this.temporizadorSpawn = null;
    this.puntuacionInicioNivel = 0;
    this.jefe = null;
    this.escanerCargas = 2;
    this.escanerActivo = false;
    this.escanerActivoHasta = 0;
    this.temporizadorEscaner = null;

    // Mecánicas nuevas: reparación de servidor, malware duplicador y
    // sobrecarga de red (se reinician también en iniciarNivelActual)
    this.reparacionUsadaNivel = false;
    this.sobrecargaIndice = 0;
    this.sobrecargaActiva = false;
    this.limiteElementosExtra = 0;
    this.temporizadorSobrecarga = null;

    this.actualizarHUD();
    this.actualizarBotonEscaner();
    this.iniciarNivelActual();
  }

  // Factor de lentitud aplicado por el escáner (2s) a elementos y, si
  // corresponde, al jefe. 1 = velocidad normal.
  get factorEscaner() {
    return this.escanerActivo ? 0.35 : 1;
  }

  // Cada elemento activo dibuja un anillo que se reduce con el tiempo
  // restante, se mueve si es móvil (rebotando en los bordes del área de
  // juego) y mantiene su línea de objetivo apuntando al servidor elegido.
  update() {
    estado.virusActivos.forEach((elemento) => {
      if (elemento.movil) {
        const factor = this.factorEscaner;
        elemento.contenedor.x += elemento.velX * factor;
        elemento.contenedor.y += elemento.velY * factor;
        const area = this.areaJuego;
        const margen = 60;
        if (elemento.contenedor.x < area.xMin + margen || elemento.contenedor.x > area.xMax - margen) {
          elemento.velX *= -1;
        }
        if (elemento.contenedor.y < area.yMin + margen || elemento.contenedor.y > area.yMax - margen) {
          elemento.velY *= -1;
        }
      }

      if (elemento.lineaObjetivo) {
        elemento.lineaObjetivo.clear();
        elemento.lineaObjetivo.lineStyle(1.5, elemento.colorLinea, 0.28);
        elemento.lineaObjetivo.lineBetween(
          elemento.contenedor.x, elemento.contenedor.y,
          elemento.servidorObjetivoX, this.servidorY
        );
      }

      if (!elemento.temporizador || !elemento.anilloTiempo) return;
      const restante = 1 - elemento.temporizador.getProgress();
      const color = colorPorTipo(elemento.tipo);

      elemento.anilloTiempo.clear();
      elemento.anilloTiempo.lineStyle(4, color, 0.55);
      elemento.anilloTiempo.beginPath();
      const inicioAngulo = -Math.PI / 2;
      const finAngulo = inicioAngulo + Math.PI * 2 * restante;
      elemento.anilloTiempo.arc(0, 0, 56, inicioAngulo, finAngulo, false);
      elemento.anilloTiempo.strokePath();
    });

    // Anillo de tiempo del jefe y, si corresponde, su desplazamiento continuo
    if (this.jefe && !this.jefe.destruido) {
      if (this.jefe.temporizadorAtaque && this.jefe.anilloTiempo) {
        const restante = 1 - this.jefe.temporizadorAtaque.getProgress();
        this.jefe.anilloTiempo.clear();
        this.jefe.anilloTiempo.lineStyle(5, this.jefe.config.colorPrincipal, 0.5);
        this.jefe.anilloTiempo.beginPath();
        const inicioAngulo = -Math.PI / 2;
        const finAngulo = inicioAngulo + Math.PI * 2 * restante;
        this.jefe.anilloTiempo.arc(0, 0, 92, inicioAngulo, finAngulo, false);
        this.jefe.anilloTiempo.strokePath();
      }

      if (this.jefe.config.movimiento === 'lento' && !this.movimientoReducido) {
        // El escáner también puede ralentizar al jefe durante 2s, sin
        // tocar su vida, temporizadores de ataque ni punto débil.
        const velocidad = (this.jefe.fase === 2 ? 1 : 0.6) * this.factorEscaner;
        const area = this.areaJuego;
        const margen = 100;
        this.jefe.contenedor.x += this.jefe.velX * velocidad;
        this.jefe.contenedor.y += this.jefe.velY * velocidad;
        if (this.jefe.contenedor.x < area.xMin + margen || this.jefe.contenedor.x > area.xMax - margen) {
          this.jefe.velX *= -1;
        }
        if (this.jefe.contenedor.y < area.yMin + margen || this.jefe.contenedor.y > area.yMax - margen) {
          this.jefe.velY *= -1;
        }
      }
    }
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
      // Envuelve el texto si se indica un ancho máximo (por ejemplo, las
      // etiquetas de los servidores en pantallas angostas), en vez de
      // dejarlo desbordar fuera de su recuadro o del canvas.
      wordWrap: opciones.anchoMaximo ? { width: opciones.anchoMaximo, useAdvancedWrap: true } : undefined,
    });
    estiloTexto.setResolution(this.factorResolucion);
    if (opciones.origenX !== undefined || opciones.origenY !== undefined) {
      estiloTexto.setOrigin(opciones.origenX ?? 0, opciones.origenY ?? 0);
    }
    (opciones.contenedor || this.mundo).add(estiloTexto);
    return estiloTexto;
  }

  // Etiqueta (Inter) + valor (JetBrains Mono) alineados a la izquierda.
  // Devuelve el texto del VALOR, que es el que se actualiza después.
  crearParEtiquetaValor(x, y, etiqueta, tamano, contenedor) {
    const label = this.crearTexto(x, y, etiqueta, { tamano: tamano - 2, color: PALETA.textoSecundario, contenedor });
    return this.crearTexto(x + label.width + 10, y, '', { tamano, mono: true, color: PALETA.texto, contenedor });
  }

  /* ---------------- TABLERO (fondo + HUD + servidores) ---------------- */

  // Construye todo el "tablero" (fondo, cuadrícula, red decorativa, HUD y
  // servidores) dentro de "capaTablero", un contenedor propio que puede
  // destruirse y reconstruirse por completo cuando cambia el tamaño de
  // pantalla en vista móvil (ver reajustarTablero), sin tocar el resto de
  // objetos del juego (elementos activos, jefe, overlays).
  construirTablero(ancho, alto) {
    this.capaTablero = this.add.container(0, 0);
    this.mundo.add(this.capaTablero);

    const fondo = this.add.rectangle(ancho / 2, alto / 2, ancho, alto, PALETA.fondo);
    this.capaTablero.add(fondo);

    this.dibujarFondoCircuito(ancho, alto);
    this.dibujarRedDecorativa(ancho, alto);
    this.crearHUD(ancho, alto);
    this.crearServidoresInferior(ancho, alto);
  }

  // Área donde pueden aparecer los elementos (entre el HUD y los
  // servidores). El margen lateral siempre es mayor al radio de una
  // amenaza (48px) más un pequeño respiro, para que ninguna amenaza
  // aparezca cortada ni fuera del recuadro del tablero.
  calcularAreaJuego(ancho, alto) {
    const margenLateral = Math.max(60, Math.round(ancho * 0.075));
    return {
      xMin: margenLateral,
      xMax: ancho - margenLateral,
      yMin: 211,
      yMax: alto - 240,
    };
  }

  // Activa el reajuste en vivo del tablero para vista móvil: al girar el
  // teléfono o cambiar el tamaño de la ventana, se recalculan las
  // dimensiones lógicas y se reconstruye el tablero sin perder el progreso
  // de la partida. Quita cualquier listener anterior antes de registrar
  // uno nuevo, para no acumular listeners duplicados entre reinicios.
  registrarListenerRedimension() {
    this.quitarListenerRedimension();
    this.listenerRedimension = () => this.programarReajusteTablero();
    window.addEventListener('resize', this.listenerRedimension);
    window.addEventListener('orientationchange', this.listenerRedimension);
    this.events.once('shutdown', () => this.quitarListenerRedimension());
  }

  quitarListenerRedimension() {
    if (!this.listenerRedimension) return;
    window.removeEventListener('resize', this.listenerRedimension);
    window.removeEventListener('orientationchange', this.listenerRedimension);
    this.listenerRedimension = null;
  }

  // Espera un instante antes de reajustar (debounce): evita reconstruir el
  // tablero decenas de veces mientras el navegador todavía está animando
  // la rotación o el cambio de tamaño.
  programarReajusteTablero() {
    if (this.temporizadorReajuste) {
      clearTimeout(this.temporizadorReajuste);
    }
    this.temporizadorReajuste = setTimeout(() => {
      this.temporizadorReajuste = null;
      this.reajustarTablero();
    }, 200);
  }

  // Reconstruye el tablero (fondo, HUD y servidores) con las nuevas
  // dimensiones lógicas, conservando el estado real de cada servidor
  // (activo/caído), y reubica dentro del nuevo recuadro tanto los
  // elementos activos como el jefe (si lo hay) con Phaser.Math.Clamp,
  // para que nada quede fuera del canvas ni se pierda el progreso.
  reajustarTablero() {
    if (!esVistaMovil()) return; // el modo de escritorio no se reajusta en vivo
    const nuevasDimensiones = calcularDimensionesLogicas();
    if (
      Math.abs(nuevasDimensiones.ancho - this.anchoLogico) < 6 &&
      Math.abs(nuevasDimensiones.alto - this.altoLogico) < 6
    ) {
      return; // el cambio es insignificante, no vale la pena reconstruir
    }

    const factor = Math.min(window.devicePixelRatio || 1, 2);
    dimensionesLogicasActuales = nuevasDimensiones;
    if (this.sys.game) {
      this.sys.game.scale.resize(
        Math.round(nuevasDimensiones.ancho * factor),
        Math.round(nuevasDimensiones.alto * factor)
      );
    }

    // Guarda el estado real de cada servidor antes de reconstruirlos, y los
    // marca como "destruidos" para que cualquier parpadeo de ataque en
    // curso (parpadearServidorAtaque) se detenga sin tocar objetos que
    // están a punto de eliminarse.
    const estadosServidores = (this.servidores || []).map((s) => ({ id: s.id, activo: s.activo }));
    (this.servidores || []).forEach((s) => { s.destruido = true; });

    // Destruye explícitamente cada hijo antes que el contenedor, para no
    // dejar gráficos ni textos sueltos del tablero anterior
    this.capaTablero.removeAll(true);
    this.capaTablero.destroy();
    this.anchoLogico = nuevasDimensiones.ancho;
    this.altoLogico = nuevasDimensiones.alto;
    this.construirTablero(this.anchoLogico, this.altoLogico);

    // Restaura qué servidores estaban caídos (su estado es parte de la
    // partida, no solo un detalle visual)
    this.servidores.forEach((servidor) => {
      const previo = estadosServidores.find((s) => s.id === servidor.id);
      if (previo && !previo.activo) {
        servidor.activo = false;
        this.dibujarEstadoServidor(servidor);
      }
    });
    estado.vidas = this.servidores.filter((s) => s.activo).length;

    // Recalcula el área de juego y reubica dentro de ella los elementos
    // activos y al jefe, para que ninguno quede fuera del nuevo tablero
    this.areaJuego = this.calcularAreaJuego(this.anchoLogico, this.altoLogico);
    this.reposicionarElementosEnNuevaArea();

    if (this.overlayOscurecer) {
      this.overlayOscurecer.setPosition(this.anchoLogico / 2, this.altoLogico / 2);
      this.overlayOscurecer.setSize(this.anchoLogico, this.altoLogico);
    }

    // Refresca los valores del HUD (los objetos de texto son nuevos tras
    // reconstruir el tablero, pero los datos de la partida no cambiaron)
    this.actualizarHUD();
    this.actualizarBotonEscaner();
    this.actualizarLeyendaExtra();
  }

  // Reubica con Phaser.Math.Clamp los elementos activos y al jefe dentro
  // de los nuevos límites del área de juego, y corrige la línea de
  // objetivo de cada elemento hacia la posición actual de su servidor.
  reposicionarElementosEnNuevaArea() {
    const area = this.areaJuego;
    estado.virusActivos.forEach((elemento) => {
      elemento.contenedor.x = Phaser.Math.Clamp(elemento.contenedor.x, area.xMin, area.xMax);
      elemento.contenedor.y = Phaser.Math.Clamp(elemento.contenedor.y, area.yMin, area.yMax);
      if (elemento.servidorObjetivoId) {
        const servidor = this.servidores.find((s) => s.id === elemento.servidorObjetivoId);
        if (servidor) elemento.servidorObjetivoX = servidor.x;
      }
    });

    if (this.jefe && this.jefe.contenedor) {
      this.jefe.contenedor.x = Phaser.Math.Clamp(this.jefe.contenedor.x, area.xMin + 90, area.xMax - 90);
      this.jefe.contenedor.y = Phaser.Math.Clamp(this.jefe.contenedor.y, area.yMin + 90, area.yMax - 90);
    }
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
    this.capaTablero.add(graficos);
  }

  // Nodos y conexiones de red muy tenues, algunos con un pulso lento,
  // solo para ambientar el tablero sin llenar la pantalla
  dibujarRedDecorativa(ancho, alto) {
    const lineas = this.add.graphics();
    lineas.lineStyle(1, PALETA.azul, 0.1);
    this.capaTablero.add(lineas);

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
      this.capaTablero.add(punto);
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
    const capa = this.capaTablero;

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
    capa.add(iconoActividad);

    this.textoPuntuacion = this.crearParEtiquetaValor(64, 27, 'PUNTOS', 24, capa);

    // Nivel, alineado a la derecha: se crea el valor primero (para medir
    // su ancho) y la etiqueta se ubica justo antes, ambos con origen derecho
    this.textoNivel = this.crearTexto(ancho - 32, 27, '', {
      tamano: 24, mono: true, origenX: 1, origenY: 0, contenedor: capa,
    });
    this.etiquetaNivel = this.crearTexto(ancho - 32, 27, 'NIVEL', {
      tamano: 20, origenX: 1, origenY: 0, color: PALETA.textoSecundario, contenedor: capa,
    });

    this.textoAmenazas = this.crearParEtiquetaValor(32, 78, 'AMENAZAS', 19, capa);

    // Combo, alineado a la derecha (mismo patrón que NIVEL)
    this.textoCombo = this.crearTexto(ancho - 32, 78, '', {
      tamano: 19, mono: true, origenX: 1, origenY: 0, contenedor: capa,
    });
    this.etiquetaCombo = this.crearTexto(ancho - 32, 78, 'COMBO', {
      tamano: 16, origenX: 1, origenY: 0, color: PALETA.textoSecundario, contenedor: capa,
    });

    // Barra de progreso de amenazas eliminadas
    this.barraProgresoX = 32;
    this.barraProgresoY = 107;
    this.barraProgresoAncho = ancho - 64;
    this.graficosProgreso = this.add.graphics();
    capa.add(this.graficosProgreso);

    // Cargas del escáner
    this.textoEscaner = this.crearParEtiquetaValor(32, 140, 'ESCÁNER', 15, capa);

    // Leyenda de colores (una entrada por tipo de elemento)
    this.crearTexto(ancho - 32, 140, 'Rojo·Naranja·Morado: eliminar · Azul: ignorar', {
      tamano: 14, origenX: 1, origenY: 0, color: PALETA.textoSecundario, contenedor: capa,
    });

    // Segunda línea de leyenda para las mecánicas nuevas (se completa en
    // actualizarLeyendaExtra según el nivel, sin saturar el HUD)
    this.textoLeyendaExtra = this.crearTexto(ancho - 32, 164, '', {
      tamano: 13, origenX: 1, origenY: 0, color: PALETA.textoSecundario, contenedor: capa,
    });
  }

  // Actualiza la segunda línea de leyenda según las mecánicas disponibles
  // en el nivel actual (la reparación existe desde el nivel 1, el
  // duplicador se agrega a partir del nivel 2)
  actualizarLeyendaExtra() {
    let texto = 'Verde: reparación';
    if (estado.indiceNivel >= 1) texto += ' · Magenta: duplicador';
    this.textoLeyendaExtra.setText(texto);
  }

  /* ---------------- SERVIDORES INFERIORES (sistema de vidas) ---------------- */

  crearServidoresInferior(ancho, alto) {
    const capa = this.capaTablero;
    this.servidorY = alto - 106;
    const gap = 16;
    const anchoCaja = (ancho - 64 - gap * 2) / 3;
    // En pantallas angostas se reduce un poco el texto y se permite que se
    // envuelva en dos líneas en vez de desbordar fuera de su recuadro.
    const tamanoNombre = anchoCaja < 170 ? 11 : 13;
    const definiciones = [
      { id: 'web', nombre: 'SERVIDOR WEB' },
      { id: 'bd', nombre: 'BASE DE DATOS' },
      { id: 'respaldo', nombre: 'SERVIDOR DE RESPALDO' },
    ];

    this.servidores = definiciones.map((def, indice) => {
      const x = 32 + anchoCaja / 2 + indice * (anchoCaja + gap);
      const rect = this.add.rectangle(x, this.servidorY, anchoCaja, 90, PALETA.superficie, 0.95)
        .setStrokeStyle(2, PALETA.verde, 1);
      const nombreTexto = this.crearTexto(x, this.servidorY - 16, def.nombre, {
        tamano: tamanoNombre, mono: true, color: PALETA.texto, origenX: 0.5, origenY: 0.5, alinear: 'center',
        anchoMaximo: anchoCaja - 10, contenedor: capa,
      });
      const estadoTexto = this.crearTexto(x, this.servidorY + 16, 'EN LÍNEA', {
        tamano: 12, mono: true, color: PALETA.verdeTexto, origenX: 0.5, origenY: 0.5, alinear: 'center',
        contenedor: capa,
      });
      capa.add(rect);
      capa.bringToTop(nombreTexto);
      capa.bringToTop(estadoTexto);
      return { id: def.id, nombre: def.nombre, x, rect, nombreTexto, estadoTexto, activo: true, parpadeando: false };
    });
  }

  dibujarEstadoServidor(servidor) {
    if (servidor.activo) {
      servidor.rect.setStrokeStyle(2, PALETA.verde, 1);
      servidor.rect.setFillStyle(PALETA.superficie, 0.95);
      servidor.estadoTexto.setText('EN LÍNEA');
      servidor.estadoTexto.setColor(PALETA.verdeTexto);
    } else {
      servidor.rect.setStrokeStyle(2, PALETA.peligro, 1);
      servidor.rect.setFillStyle(0x1a0d10, 0.95);
      servidor.estadoTexto.setText('FUERA DE LÍNEA');
      servidor.estadoTexto.setColor(PALETA.peligroTexto);
    }
  }

  // Parpadeo naranja ("bajo ataque") antes de asentarse en su estado final.
  // Si el tablero se reconstruye a mitad del parpadeo (reajustarTablero, al
  // rotar el teléfono o cambiar de tamaño), el servidor viejo queda
  // marcado "destruido" y el parpadeo se detiene sin tocar objetos ya
  // eliminados.
  parpadearServidorAtaque(servidor, callback) {
    servidor.parpadeando = true;
    const ciclos = this.movimientoReducido ? 1 : 3;
    let paso = 0;
    const alternar = () => {
      if (servidor.destruido) return;
      const encendido = paso % 2 === 0;
      servidor.rect.setStrokeStyle(3, PALETA.naranja, 1);
      servidor.rect.setFillStyle(encendido ? 0x3a2408 : PALETA.superficie, 0.95);
      servidor.estadoTexto.setText('BAJO ATAQUE');
      servidor.estadoTexto.setColor(PALETA.naranjaTexto);
      paso += 1;
      if (paso < ciclos * 2) {
        this.time.delayedCall(this.movimientoReducido ? 30 : 110, alternar);
      } else {
        servidor.parpadeando = false;
        callback();
      }
    };
    alternar();
  }

  // Desactiva un servidor ACTIVO al azar (nunca uno que ya esté fuera de
  // línea). Mantiene estado.vidas sincronizado para no romper el resto
  // del código (derrota, HUD, etc. siguen leyendo estado.vidas).
  desactivarServidorAleatorio() {
    const activos = this.servidores.filter((s) => s.activo);
    if (activos.length === 0) return;
    const objetivo = Phaser.Utils.Array.GetRandom(activos);
    objetivo.activo = false;
    estado.vidas = this.servidores.filter((s) => s.activo).length;
    this.parpadearServidorAtaque(objetivo, () => this.dibujarEstadoServidor(objetivo));
  }

  // Elige a qué servidor "apunta" una amenaza real recién generada:
  // preferentemente uno que siga activo (si ya no quedan, cualquiera).
  elegirServidorObjetivo() {
    if (!this.servidores) return null;
    const activos = this.servidores.filter((s) => s.activo);
    return Phaser.Utils.Array.GetRandom(activos.length ? activos : this.servidores);
  }

  /* ---------------- CONTROL DE NIVELES ---------------- */

  iniciarNivelActual() {
    estado.virusEliminados = 0;
    estado.jefeActivo = false;
    estado.combo = 0;
    this.contadorElementosNivel = 0;
    this.puntuacionInicioNivel = estado.puntuacion;
    this.escanerCargas = 2;
    this.escanerActivo = false;

    // Reinicia las mecánicas nuevas al comenzar cada nivel
    this.reparacionUsadaNivel = false;
    this.sobrecargaIndice = 0;
    this.sobrecargaActiva = false;
    this.limiteElementosExtra = 0;

    this.limpiarVirusActivos();
    this.limpiarJefe();
    this.actualizarHUD();
    this.actualizarBotonEscaner();
    this.actualizarLeyendaExtra();

    // Arranca el generador de elementos (ver iniciarGeneracionElementos).
    this.iniciarGeneracionElementos();
  }

  // Temporizador repetitivo: en cada intervalo ("tiempoAparicion") trata
  // de agregar un elemento nuevo, sin superar el máximo simultáneo del
  // nivel. Si el tablero ya está lleno, simplemente lo intenta de nuevo
  // en el siguiente intervalo (generación procedural continua).
  iniciarGeneracionElementos() {
    const configuracionNivel = NIVELES[estado.indiceNivel];
    this.reiniciarTemporizadorSpawn(configuracionNivel.tiempoAparicion);
  }

  // Sustituye el temporizador de generación por uno nuevo con otro
  // intervalo (usado por la sobrecarga de red), sin dejar timers duplicados:
  // siempre elimina el anterior antes de crear el nuevo.
  reiniciarTemporizadorSpawn(delay) {
    if (this.temporizadorSpawn) {
      this.temporizadorSpawn.remove();
      this.temporizadorSpawn = null;
    }
    this.temporizadorSpawn = this.time.addEvent({
      delay,
      loop: true,
      callback: this.intentarGenerarElemento,
      callbackScope: this,
    });
  }

  // Máximo de elementos simultáneos permitido ahora mismo: el del nivel,
  // más uno mientras la sobrecarga de red está activa.
  maxElementosActual() {
    return NIVELES[estado.indiceNivel].maxElementos + (this.limiteElementosExtra || 0);
  }

  intentarGenerarElemento() {
    if (!estado.juegoActivo || estado.jefeActivo) return;
    const configuracionNivel = NIVELES[estado.indiceNivel];
    // Ya se alcanzó el objetivo del nivel: se detiene la generación
    // (el jefe se encarga de retirar lo que quede en pantalla).
    if (estado.virusEliminados >= configuracionNivel.virusRequeridos) return;

    // La reparación de servidor tiene prioridad y no cuenta contra el
    // máximo de elementos simultáneos (aparece como mucho una vez por nivel).
    if (this.intentarGenerarReparacion()) return;

    if (estado.virusActivos.length >= this.maxElementosActual()) return;
    this.generarVirus();
  }

  limpiarVirusActivos() {
    if (this.temporizadorSpawn) {
      this.temporizadorSpawn.remove();
      this.temporizadorSpawn = null;
    }
    // Evita que el escáner quede "a medias" o reaparezca en el nivel
    // siguiente con temporizadores de otra partida
    if (this.temporizadorEscaner) {
      this.temporizadorEscaner.remove();
      this.temporizadorEscaner = null;
    }
    this.escanerActivo = false;

    // Cancela cualquier sobrecarga de red pendiente (por ejemplo, al
    // iniciar el jefe, perder o cambiar de nivel) sin dejar timers activos
    if (this.temporizadorSobrecarga) {
      this.temporizadorSobrecarga.remove();
      this.temporizadorSobrecarga = null;
    }
    this.sobrecargaActiva = false;
    this.limiteElementosExtra = 0;

    estado.virusActivos.forEach((elemento) => {
      if (elemento.temporizador) elemento.temporizador.remove();
      if (elemento.lineaObjetivo) elemento.lineaObjetivo.destroy();
      if (elemento.escudoGrafico) elemento.escudoGrafico.destroy();
      elemento.contenedor.destroy();
    });
    estado.virusActivos = [];
  }

  /* ---------------- GENERACIÓN PROCEDURAL DE ELEMENTOS ---------------- */

  generarVirus() {
    if (!estado.juegoActivo || estado.jefeActivo) return;

    const configuracionNivel = NIVELES[estado.indiceNivel];
    const area = this.areaJuego;

    // Posición aleatoria dentro del área de juego (generación procedural)
    const x = Phaser.Math.Between(area.xMin, area.xMax);
    const y = Phaser.Math.Between(area.yMin, area.yMax);

    // Decide el tipo de elemento. En el nivel 1, las primeras 3 amenazas
    // nunca son falsos positivos. Entre las amenazas reales, se sortea
    // además si es crítica, resistente o duplicadora según el nivel.
    let tipo = 'amenaza';
    const protegerInicioNivel1 = estado.indiceNivel === 0 && this.contadorElementosNivel < 3;
    if (!protegerInicioNivel1 && Math.random() < configuracionNivel.probabilidadSeguro) {
      tipo = 'seguro';
    } else {
      const sorteo = Math.random();
      const pResistente = configuracionNivel.probabilidadResistente;
      const pCritica = pResistente + configuracionNivel.probabilidadCritica;
      const pDuplicador = pCritica + (configuracionNivel.probabilidadDuplicador || 0);
      if (sorteo < pResistente) tipo = 'resistente';
      else if (sorteo < pCritica) tipo = 'critica';
      else if (sorteo < pDuplicador) tipo = 'duplicador';
    }
    this.contadorElementosNivel += 1;

    const servidorObjetivo = esAmenazaReal(tipo) || tipo === 'duplicador' ? this.elegirServidorObjetivo() : null;
    const tiempoVida = tipo === 'critica'
      ? Math.round(configuracionNivel.tiempoVidaVirus * 0.75)
      : tipo === 'resistente'
        ? Math.round(configuracionNivel.tiempoVidaVirus * 1.15)
        : configuracionNivel.tiempoVidaVirus;

    this.crearElementoVisual(tipo, x, y, { duracionVida: tiempoVida, servidorObjetivo });
  }

  // Construye la parte visual e interactiva de un elemento (círculo, anillo
  // de tiempo, ícono, línea de objetivo, temporizador de expiración) y lo
  // registra en estado.virusActivos. La usan tanto la generación normal
  // (generarVirus) como las mecánicas nuevas: reparación de servidor y las
  // dos amenazas pequeñas en las que se divide el malware duplicador.
  crearElementoVisual(tipo, x, y, opciones = {}) {
    const configuracionNivel = NIVELES[estado.indiceNivel];
    const escalaVisual = opciones.escalaVisual || 1;
    const color = colorPorTipo(tipo);

    // Un contenedor agrupa el círculo, el anillo de tiempo y el ícono
    const contenedor = this.add.container(x, y);
    this.mundo.add(contenedor);

    const circuloFondo = this.add.circle(0, 0, 48, PALETA.superficie, 0.95);
    circuloFondo.setStrokeStyle(3, color, 1);

    const anilloTiempo = this.add.graphics();

    const icono = this.add.graphics();
    dibujarIconoPorTipo(icono, tipo, color);

    contenedor.add([circuloFondo, anilloTiempo, icono]);

    // Etiqueta permanente "REPARACIÓN" (a diferencia del resto de tipos,
    // que solo revelan su identidad al usar el escáner)
    if (tipo === 'reparacion') {
      const etiquetaFija = this.add.text(0, 36, 'REPARACIÓN', {
        fontFamily: FUENTE_MONO,
        fontSize: '11px',
        color: PALETA.verdeTexto,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      etiquetaFija.setResolution(this.factorResolucion);
      contenedor.add(etiquetaFija);
    }

    // El malware resistente muestra además un escudo exterior: el primer
    // golpe solo lo rompe, el segundo elimina el elemento.
    let escudoGrafico = null;
    if (tipo === 'resistente') {
      escudoGrafico = this.add.circle(0, 0, 60, 0, 0);
      escudoGrafico.setStrokeStyle(3, PALETA.morado, 0.9);
      contenedor.add(escudoGrafico);
    }

    contenedor.setSize(96, 96);
    contenedor.setScale(0);

    // Animación de aparición: aumenta de tamaño suavemente
    this.tweens.add({
      targets: contenedor,
      scale: escalaVisual,
      duration: this.movimientoReducido ? 1 : 180,
      ease: 'Sine.Out',
    });

    // El círculo es interactivo: se puede hacer clic/tocar sobre él
    circuloFondo.setInteractive({ useHandCursor: true });

    // Objetivo móvil: una fracción de los elementos (según el nivel) se
    // desplaza lentamente y rebota dentro del área de juego.
    const movil = opciones.movilForzado !== undefined
      ? opciones.movilForzado
      : !this.movimientoReducido && Math.random() < configuracionNivel.probabilidadMovimiento;
    const velocidad = Phaser.Math.FloatBetween(configuracionNivel.velocidadMin, configuracionNivel.velocidadMax);
    const anguloMovimiento = Math.random() * Math.PI * 2;

    const elemento = {
      contenedor, circuloFondo, anilloTiempo, tipo, temporizador: null,
      escudoGrafico,
      golpesRestantes: tipo === 'resistente' ? 2 : 1,
      movil,
      velX: movil ? Math.cos(anguloMovimiento) * velocidad : 0,
      velY: movil ? Math.sin(anguloMovimiento) * velocidad : 0,
      lineaObjetivo: null,
      servidorObjetivoX: null,
      servidorObjetivoId: null,
      colorLinea: color,
      grupo: opciones.grupo || null,
    };

    // Línea/etiqueta que indica a qué servidor apunta una amenaza real
    // (también se muestra para el malware duplicador, antes de dividirse).
    // Se guarda también el id del servidor para poder corregir la línea
    // si el tablero se reajusta (ver reposicionarElementosEnNuevaArea).
    if (opciones.servidorObjetivo) {
      elemento.servidorObjetivoX = opciones.servidorObjetivo.x;
      elemento.servidorObjetivoId = opciones.servidorObjetivo.id;
      const linea = this.add.graphics();
      this.mundo.add(linea);
      this.mundo.moveBelow(linea, contenedor);
      elemento.lineaObjetivo = linea;
    }

    // El comportamiento al hacer clic depende del tipo de elemento
    circuloFondo.on('pointerdown', () => {
      if (tipo === 'reparacion') this.repararServidor(elemento);
      else if (tipo === 'duplicador') this.dividirDuplicador(elemento);
      else this.eliminarVirus(elemento, true);
    });

    // Temporizador: si expira sin clic, se resuelve como "no atendido"
    const duracionVida = opciones.duracionVida || configuracionNivel.tiempoVidaVirus;
    elemento.temporizador = this.time.delayedCall(duracionVida, () => {
      this.eliminarVirus(elemento, false);
    });

    estado.virusActivos.push(elemento);

    // Si el escáner está activo, el elemento recién aparecido también
    // muestra su etiqueta y su temporizador queda ralentizado durante
    // el tiempo que le quede al escaneo.
    if (this.escanerActivo) {
      const restante = this.escanerActivoHasta - this.time.now;
      if (restante > 0) {
        this.mostrarEtiquetaEscaner(elemento, restante);
        elemento.temporizador.timeScale = this.factorEscaner;
      }
    }

    return elemento;
  }

  /* ---------------- RESOLVER UN ELEMENTO (clic o expiración) ---------------- */

  eliminarVirus(elemento, fueEliminadoPorClic) {
    // Evita procesar el mismo elemento dos veces (por ejemplo, clic justo cuando expira)
    if (elemento.procesado) return;

    // Malware resistente: el primer clic solo rompe el escudo exterior,
    // no elimina el elemento ni reinicia su temporizador.
    if (fueEliminadoPorClic && elemento.tipo === 'resistente' && elemento.golpesRestantes > 1) {
      elemento.golpesRestantes -= 1;
      this.romperEscudoResistente(elemento);
      return;
    }

    elemento.procesado = true;
    if (elemento.temporizador) elemento.temporizador.remove();
    if (elemento.lineaObjetivo) elemento.lineaObjetivo.destroy();

    const indice = estado.virusActivos.indexOf(elemento);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    const duracionSalida = this.movimientoReducido ? 1 : 220;
    const color = colorPorTipo(elemento.tipo);

    if (esAmenazaReal(elemento.tipo) && fueEliminadoPorClic) {
      // Amenaza real eliminada a tiempo: suma puntos (con el multiplicador
      // de combo vigente) y cuenta para el objetivo del nivel
      estado.combo += 1;
      const multiplicador = calcularMultiplicadorCombo(estado.combo);
      const puntosGanados = PUNTOS_POR_TIPO[elemento.tipo] * multiplicador;
      estado.puntuacion += puntosGanados;
      estado.virusEliminados += 1;

      if (elemento.tipo === 'critica') {
        reproducirSonido('eliminar');
        this.destelloNaranja(elemento.contenedor.x, elemento.contenedor.y);
      } else {
        reproducirSonido('eliminar');
        this.crearParticulas(elemento.contenedor.x, elemento.contenedor.y, color);
      }
      this.animarComboHUD();

      this.tweens.add({
        targets: elemento.contenedor,
        scale: 1.5,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, `+${puntosGanados}`, color);
    } else if (esAmenazaReal(elemento.tipo) && !fueEliminadoPorClic) {
      // Amenaza real no eliminada a tiempo: se pierde un servidor y el combo.
      // Si el elemento pertenece a un grupo (las dos amenazas pequeñas del
      // duplicador), solo se descuenta un servidor por todo el grupo,
      // aunque las dos escapen.
      estado.combo = 0;
      reproducirSonido('perderVida');
      if (!elemento.grupo || !elemento.grupo.perdidoServidor) {
        this.desactivarServidorAleatorio();
        if (elemento.grupo) elemento.grupo.perdidoServidor = true;
      }
      this.animarComboHUD();

      this.tweens.add({
        targets: elemento.contenedor,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, '-1 SERVIDOR', PALETA.peligro);
    } else if (elemento.tipo === 'duplicador' && !fueEliminadoPorClic) {
      // El malware duplicador expiró sin que le dieran clic: se pierde un
      // servidor, pero no entrega puntos ni cuenta para el objetivo (nunca
      // llegó a "eliminarse", solo se hubiera dividido con un clic).
      estado.combo = 0;
      reproducirSonido('perderVida');
      this.desactivarServidorAleatorio();
      this.animarComboHUD();

      this.tweens.add({
        targets: elemento.contenedor,
        alpha: 0,
        duration: duracionSalida,
        onComplete: () => elemento.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, '-1 SERVIDOR', PALETA.peligro);
    } else if (elemento.tipo === 'seguro' && fueEliminadoPorClic) {
      // Falso positivo: el jugador hizo clic en un archivo seguro
      estado.combo = 0;
      reproducirSonido('trampa');
      if (!this.movimientoReducido) this.cameras.main.shake(110, 0.005);
      this.desactivarServidorAleatorio();
      this.animarComboHUD();

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
          { texto: '-1 servidor', fuente: FUENTE_MONO, tamano: 20 },
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
    this.verificarSobrecargaPorProgreso();
  }

  /* ---------------- REPARACIÓN DE SERVIDOR ---------------- */

  // Intenta generar el elemento de reparación: solo si hay al menos un
  // servidor fuera de línea, como máximo una vez por nivel, y con una
  // probabilidad moderada en cada intento de generación.
  intentarGenerarReparacion() {
    if (this.reparacionUsadaNivel) return false;
    if (!this.servidores.some((s) => !s.activo)) return false;
    if (estado.virusActivos.some((e) => e.tipo === 'reparacion')) return false;
    if (Math.random() >= PROBABILIDAD_REPARACION) return false;

    this.reparacionUsadaNivel = true;
    const area = this.areaJuego;
    const x = Phaser.Math.Between(area.xMin, area.xMax);
    const y = Phaser.Math.Between(area.yMin, area.yMax);
    this.crearElementoVisual('reparacion', x, y, { duracionVida: 4000, movilForzado: false });
    return true;
  }

  // Clic sobre el elemento de reparación: recupera un servidor fuera de
  // línea (si ya no queda ninguno, no hace nada más que desaparecer) y no
  // entrega puntos ni cuenta como amenaza eliminada.
  repararServidor(elemento) {
    if (elemento.procesado) return;
    elemento.procesado = true;
    if (elemento.temporizador) elemento.temporizador.remove();
    if (elemento.lineaObjetivo) elemento.lineaObjetivo.destroy();

    const indice = estado.virusActivos.indexOf(elemento);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    const servidorCaido = this.servidores.find((s) => !s.activo);
    if (servidorCaido) {
      servidorCaido.activo = true;
      estado.vidas = this.servidores.filter((s) => s.activo).length;
      this.dibujarEstadoServidor(servidorCaido);
      this.crearOndaExpansiva(servidorCaido.rect.x, this.servidorY, PALETA.verde);
      reproducirSonido('combo');
      this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, 'SERVIDOR RESTAURADO', PALETA.verde);
    }

    const duracionSalida = this.movimientoReducido ? 1 : 220;
    this.tweens.add({
      targets: elemento.contenedor,
      scale: 1.15,
      alpha: 0,
      duration: duracionSalida,
      onComplete: () => elemento.contenedor.destroy(),
    });

    this.actualizarHUD();
  }

  /* ---------------- MALWARE DUPLICADOR ---------------- */

  // Clic sobre el malware duplicador: en vez de eliminarse, se divide en
  // dos amenazas pequeñas (5 puntos cada una) con la misma duración de
  // vida. Si una o las dos escapan, solo se pierde un servidor entre las
  // dos (ver el grupo compartido y la rama de escape en eliminarVirus).
  dividirDuplicador(elemento) {
    if (elemento.procesado) return;
    elemento.procesado = true;
    if (elemento.temporizador) elemento.temporizador.remove();
    if (elemento.lineaObjetivo) elemento.lineaObjetivo.destroy();

    const indice = estado.virusActivos.indexOf(elemento);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    const x = elemento.contenedor.x;
    const y = elemento.contenedor.y;
    reproducirSonido('eliminar');
    this.crearParticulas(x, y, PALETA.magenta);

    const duracionSalida = this.movimientoReducido ? 1 : 200;
    this.tweens.add({
      targets: elemento.contenedor,
      scale: 1.3,
      alpha: 0,
      duration: duracionSalida,
      onComplete: () => elemento.contenedor.destroy(),
    });

    const configuracionNivel = NIVELES[estado.indiceNivel];
    const grupo = { perdidoServidor: false };
    const duracionPequenas = Math.round(configuracionNivel.tiempoVidaVirus * 0.9);
    const area = this.areaJuego;
    const offsets = [[-46, -18], [46, 18]];
    offsets.forEach(([dx, dy]) => {
      const nx = Phaser.Math.Clamp(x + dx, area.xMin, area.xMax);
      const ny = Phaser.Math.Clamp(y + dy, area.yMin, area.yMax);
      this.crearElementoVisual('duplicado_pequeno', nx, ny, {
        grupo,
        escalaVisual: 0.68,
        movilForzado: false,
        duracionVida: duracionPequenas,
        servidorObjetivo: this.elegirServidorObjetivo(),
      });
    });

    this.actualizarHUD();
  }

  /* ---------------- SOBRECARGA DE RED ---------------- */

  // Se activa en los umbrales de progreso definidos en UMBRALES_SOBRECARGA
  // (una vez en el nivel 2, dos veces en el nivel 3): acelera la aparición
  // de elementos durante 5s y permite un elemento simultáneo más de lo
  // normal. Al terminar, restaura exactamente la velocidad y el máximo
  // originales. Nunca se activa durante el combate contra el jefe, ni
  // mientras ya hay una sobrecarga en curso.
  verificarSobrecargaPorProgreso() {
    if (estado.jefeActivo || this.sobrecargaActiva) return;
    const umbrales = UMBRALES_SOBRECARGA[estado.indiceNivel] || [];
    if (this.sobrecargaIndice >= umbrales.length) return;
    const configuracionNivel = NIVELES[estado.indiceNivel];
    const progreso = estado.virusEliminados / configuracionNivel.virusRequeridos;
    if (progreso < umbrales[this.sobrecargaIndice]) return;
    this.activarSobrecarga(configuracionNivel);
  }

  activarSobrecarga(configuracionNivel) {
    this.sobrecargaIndice += 1;
    this.sobrecargaActiva = true;
    this.limiteElementosExtra = 1;
    this.mostrarAvisoEvento('SOBRECARGA DE RED', PALETA.naranjaTexto);
    this.reiniciarTemporizadorSpawn(Math.round(configuracionNivel.tiempoAparicion * 0.55));

    this.temporizadorSobrecarga = this.time.delayedCall(5000, () => {
      this.temporizadorSobrecarga = null;
      this.sobrecargaActiva = false;
      this.limiteElementosExtra = 0;
      if (estado.juegoActivo && !estado.jefeActivo) {
        this.reiniciarTemporizadorSpawn(configuracionNivel.tiempoAparicion);
      }
    });
  }

  // Aviso breve en la parte superior del área de juego (no cubre el HUD,
  // los servidores ni el botón del escáner, que ahora está fuera del canvas)
  mostrarAvisoEvento(texto, color) {
    const aviso = this.crearTexto(this.anchoLogico / 2, this.areaJuego.yMin + 16, texto, {
      tamano: this.esVistaMovilActual ? 18 : 22, mono: true, negrita: true, color,
      origenX: 0.5, origenY: 0.5, alinear: 'center', anchoMaximo: this.anchoLogico - 32,
    });
    aviso.setAlpha(0);
    this.mundo.bringToTop(aviso);

    const duracionFade = this.movimientoReducido ? 30 : 260;
    const espera = this.movimientoReducido ? 60 : 1100;
    this.tweens.add({
      targets: aviso,
      alpha: { from: 0, to: 1 },
      duration: duracionFade,
      yoyo: true,
      hold: espera,
      onComplete: () => aviso.destroy(),
    });
  }

  // Breve efecto de escudo roto: la amenaza resistente pierde su anillo
  // exterior tras el primer golpe, pero sigue activa para el segundo.
  romperEscudoResistente(elemento) {
    reproducirSonido('escudo');
    if (elemento.escudoGrafico) {
      const escudo = elemento.escudoGrafico;
      elemento.escudoGrafico = null;
      this.tweens.add({
        targets: escudo,
        scale: 1.4,
        alpha: 0,
        duration: this.movimientoReducido ? 1 : 240,
        onComplete: () => escudo.destroy(),
      });
    }
    this.crearParticulas(elemento.contenedor.x, elemento.contenedor.y, PALETA.morado);
    this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, 'ESCUDO ROTO', PALETA.morado);
  }

  // Destello naranja al eliminar una amenaza crítica (además de las
  // partículas ya usadas para el malware normal)
  destelloNaranja(x, y) {
    if (this.movimientoReducido) return;
    const destello = this.add.circle(x, y, 30, PALETA.naranja, 0.55);
    this.mundo.add(destello);
    this.tweens.add({
      targets: destello,
      scale: 2.4,
      alpha: 0,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => destello.destroy(),
    });
  }

  // Pulso breve del combo en el HUD cada vez que cambia (sube o se reinicia)
  animarComboHUD() {
    const objetivos = [this.textoCombo, this.etiquetaCombo];
    if (estado.combo > 0) reproducirSonido('combo');
    this.tweens.add({
      targets: objetivos,
      scale: { from: 1.28, to: 1 },
      duration: this.movimientoReducido ? 1 : 180,
      ease: 'Quad.Out',
    });
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

    this.textoPuntuacion.setText(`${estado.puntuacion}`);

    this.textoNivel.setText(`${configuracionNivel.numero}/${NIVELES.length}`);
    this.etiquetaNivel.x = this.textoNivel.x - this.textoNivel.width - 10;

    this.textoAmenazas.setText(`${estado.virusEliminados}/${configuracionNivel.virusRequeridos}`);

    const multiplicador = calcularMultiplicadorCombo(estado.combo);
    this.textoCombo.setText(`${estado.combo} (x${multiplicador})`);
    this.etiquetaCombo.x = this.textoCombo.x - this.textoCombo.width - 10;

    this.textoEscaner.setText(`${this.escanerCargas}/2`);

    // Barra de progreso (amenazas eliminadas / objetivo del nivel)
    const proporcion = Phaser.Math.Clamp(
      estado.virusEliminados / configuracionNivel.virusRequeridos, 0, 1
    );
    this.dibujarBarraProgreso(proporcion);
  }

  /* ---------------- ESCÁNER (2 usos por nivel) ---------------- */

  // Activa el escáner: ralentiza el movimiento y los temporizadores de
  // expiración de los elementos activos (y el movimiento del jefe, si
  // corresponde) durante 2s, y revela una etiqueta "AMENAZA"/"SEGURO"
  // sobre cada uno. No elimina nada ni entrega puntos.
  activarEscaner() {
    if (!estado.juegoActivo || this.escanerCargas <= 0 || this.escanerActivo) return;

    this.escanerCargas -= 1;
    this.actualizarHUD();
    this.actualizarBotonEscaner();

    this.escanerActivo = true;
    this.escanerActivoHasta = this.time.now + 2000;

    estado.virusActivos.forEach((elemento) => {
      this.mostrarEtiquetaEscaner(elemento, 2000);
      // Ralentiza también el tiempo que le queda antes de expirar
      if (elemento.temporizador) elemento.temporizador.timeScale = this.factorEscaner;
    });

    this.temporizadorEscaner = this.time.delayedCall(2000, () => {
      this.escanerActivo = false;
      this.temporizadorEscaner = null;
      // Restaura la velocidad normal de los temporizadores que sigan activos
      estado.virusActivos.forEach((elemento) => {
        if (elemento.temporizador) elemento.temporizador.timeScale = 1;
      });
    });
  }

  mostrarEtiquetaEscaner(elemento, duracion) {
    // La reparación ya muestra su etiqueta "REPARACIÓN" de forma permanente
    if (elemento.tipo === 'reparacion') return;

    let texto = 'AMENAZA';
    let color = PALETA.peligroTexto;
    if (elemento.tipo === 'seguro') {
      texto = 'SEGURO';
      color = PALETA.azulTexto;
    } else if (elemento.tipo === 'duplicador') {
      texto = 'DUPLICADOR';
      color = PALETA.magentaTexto;
    }

    const etiqueta = this.add.text(0, -74, texto, {
      fontFamily: FUENTE_MONO,
      fontSize: '14px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    etiqueta.setResolution(this.factorResolucion);
    elemento.contenedor.add(etiqueta);
    this.time.delayedCall(duracion, () => etiqueta.destroy());
  }

  // Sincroniza el botón HTML del escáner (texto y estado deshabilitado)
  actualizarBotonEscaner() {
    const boton = document.getElementById('btn-escaner');
    if (!boton) return;
    boton.querySelector('.boton-escaner-texto').textContent = `ESCÁNER · ${this.escanerCargas}`;
    boton.disabled = this.escanerCargas <= 0;
  }

  /* ---------------- VERIFICAR VICTORIA / DERROTA / NIVEL COMPLETADO ---------------- */

  verificarEstadoJuego() {
    if (estado.vidas <= 0) {
      this.finalizarPorDerrota();
      return;
    }

    // Mientras el jefe está en combate, el nivel se completa cuando lo
    // derrotan (ver derrotarJefe()), no por volver a alcanzar el objetivo.
    if (estado.jefeActivo) return;

    const configuracionNivel = NIVELES[estado.indiceNivel];
    if (estado.virusEliminados >= configuracionNivel.virusRequeridos) {
      this.iniciarCombateJefe();
    }
  }

  finalizarPorDerrota() {
    estado.juegoActivo = false;
    estado.jefeActivo = false;
    this.limpiarVirusActivos();
    this.limpiarJefe();
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

    const cx = this.anchoLogico / 2;
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

  /* ================================================================
     JEFE DE NIVEL
     Aparece al alcanzar el objetivo de amenazas del nivel. El nivel
     solo se considera superado cuando el jefe es derrotado.
     ================================================================ */

  // 1-2-3-4-5-6: detiene la generación normal (ya lo hace el guard de
  // estado.jefeActivo), muestra la alerta, oscurece el tablero y hace
  // aparecer al jefe. El combate arranca al terminar la animación.
  iniciarCombateJefe() {
    estado.jefeActivo = true;
    this.limpiarVirusActivos();

    const configuracionJefe = JEFES[estado.indiceNivel];
    reproducirSonido('alertaJefe');
    this.mostrarAlertaJefe(() => this.crearJefe(configuracionJefe));
  }

  mostrarAlertaJefe(callback) {
    this.mundo.bringToTop(this.overlayOscurecer);
    const duracionOscurecer = this.movimientoReducido ? 1 : 300;
    this.tweens.add({
      targets: this.overlayOscurecer,
      alpha: { from: 0, to: 0.5 },
      duration: duracionOscurecer,
    });

    const alerta = this.crearTexto(this.anchoLogico / 2, this.altoLogico / 2 - 30, 'AMENAZA PRINCIPAL DETECTADA', {
      tamano: this.esVistaMovilActual ? 24 : 32, mono: true, negrita: true, color: '#ff5c70',
      origenX: 0.5, origenY: 0.5, alinear: 'center', anchoMaximo: this.anchoLogico - 48,
    });
    alerta.setAlpha(0);
    this.mundo.bringToTop(alerta);

    this.tweens.add({
      targets: alerta,
      alpha: { from: 0, to: 1 },
      duration: this.movimientoReducido ? 150 : 250,
      yoyo: true,
      hold: this.movimientoReducido ? 100 : 550,
      onComplete: () => {
        alerta.destroy();
        callback();
      },
    });
  }

  // Construye al jefe (visual + estado de combate) y anima su entrada:
  // escala 0.7 -> 1, con una onda alrededor al terminar.
  crearJefe(configuracionJefe) {
    const area = this.areaJuego;
    const cx = this.anchoLogico / 2;
    const cy = (area.yMin + area.yMax) / 2;
    const radioJefe = 78;

    const contenedor = this.add.container(cx, cy);
    this.mundo.add(contenedor);

    const circuloBase = this.add.circle(0, 0, radioJefe, PALETA.superficie, 0.95);
    circuloBase.setStrokeStyle(4, configuracionJefe.colorPrincipal, 1);

    const graficoForma = this.add.graphics();
    if (configuracionJefe.id === 'troyano') {
      dibujarFormaTroyano(graficoForma, configuracionJefe.colorPrincipal);
    } else if (configuracionJefe.id === 'botnet') {
      dibujarFormaBotnet(graficoForma, configuracionJefe.colorPrincipal, configuracionJefe.colorSecundario);
    } else {
      dibujarFormaRansomware(graficoForma, configuracionJefe.colorPrincipal, configuracionJefe.colorSecundario);
    }

    const anilloTiempo = this.add.graphics();

    const placaY = -radioJefe - 46;
    const nombreTexto = this.add.text(0, placaY, `${configuracionJefe.nombre} · ${configuracionJefe.subtitulo}`, {
      fontFamily: FUENTE_MONO,
      fontSize: '15px',
      color: PALETA.texto,
      align: 'center',
    }).setOrigin(0.5);
    nombreTexto.setResolution(this.factorResolucion);

    const graficosVida = this.add.graphics();

    contenedor.add([circuloBase, graficoForma, anilloTiempo, graficosVida, nombreTexto]);
    contenedor.setScale(0.7);
    contenedor.setAlpha(0);

    this.jefe = {
      config: configuracionJefe,
      vida: configuracionJefe.vidaMaxima,
      vidaMaxima: configuracionJefe.vidaMaxima,
      contenedor,
      circuloBase,
      graficosVida,
      barraVidaAncho: 210,
      placaY,
      anilloTiempo,
      protegido: false,
      fase: 1,
      trampas: [],
      temporizadorAtaque: null,
      temporizadorTrampa: null,
      temporizadorPuntoDebil: null,
      destruido: false,
      puntoDebil: null,
      proporcionVidaVisual: 1,
      velX: Phaser.Math.FloatBetween(0.5, 1) * (Math.random() < 0.5 ? -1 : 1),
      velY: Phaser.Math.FloatBetween(0.4, 0.8) * (Math.random() < 0.5 ? -1 : 1),
    };

    if (configuracionJefe.puntoDebil) {
      this.crearPuntoDebilJefe();
    } else {
      circuloBase.setInteractive({ useHandCursor: true });
      circuloBase.on('pointerdown', () => this.golpearJefe());
    }

    this.actualizarBarraVidaJefe(true);

    const duracionEntrada = this.movimientoReducido ? 1 : 380;
    this.tweens.add({
      targets: contenedor,
      scale: 1,
      alpha: 1,
      duration: duracionEntrada,
      ease: 'Back.Out',
      onComplete: () => {
        if (!this.jefe) return; // el jugador pudo perder durante la animación
        this.crearOndaExpansiva(contenedor.x, contenedor.y, configuracionJefe.colorPrincipal);
        this.iniciarCicloAtaqueJefe();
        if (configuracionJefe.generaTrampas) this.programarTrampaJefe();
      },
    });
  }

  /* ---------------- PUNTO DÉBIL (solo ransomware) ---------------- */

  crearPuntoDebilJefe() {
    const g = this.add.circle(0, 0, 24, PALETA.peligro, 1);
    g.setStrokeStyle(3, 0xffffff, 0.6);
    this.jefe.contenedor.add(g);
    this.jefe.puntoDebil = { circulo: g };
    g.on('pointerdown', () => this.golpearJefe());
    this.reposicionarPuntoDebil();
    this.iniciarParpadeoPuntoDebil();
  }

  reposicionarPuntoDebil() {
    if (!this.jefe || !this.jefe.puntoDebil) return;
    const angulo = Math.random() * Math.PI * 2;
    const distancia = Phaser.Math.Between(20, 46);
    this.jefe.puntoDebil.circulo.x = Math.cos(angulo) * distancia;
    this.jefe.puntoDebil.circulo.y = Math.sin(angulo) * distancia;
  }

  mostrarPuntoDebil(visible) {
    if (!this.jefe || !this.jefe.puntoDebil) return;
    this.jefe.puntoDebil.circulo.setVisible(visible);
    if (visible) {
      this.jefe.puntoDebil.circulo.setInteractive({ useHandCursor: true });
    } else {
      this.jefe.puntoDebil.circulo.disableInteractive();
    }
  }

  // El punto débil parpadea: solo se puede dañar cuando está visible.
  // En la fase 2 dura menos tiempo visible y aparece con más frecuencia.
  iniciarParpadeoPuntoDebil() {
    const ciclo = () => {
      if (!this.jefe || this.jefe.destruido) return;
      const duracionVisible = this.jefe.fase === 2 ? 700 : 1100;
      const duracionOculto = this.jefe.fase === 2 ? 900 : 700;

      this.mostrarPuntoDebil(true);
      this.jefe.temporizadorPuntoDebil = this.time.delayedCall(duracionVisible, () => {
        if (!this.jefe || this.jefe.destruido) return;
        this.mostrarPuntoDebil(false);
        this.jefe.temporizadorPuntoDebil = this.time.delayedCall(duracionOculto, ciclo);
      });
    };
    ciclo();
  }

  /* ---------------- CICLO DE ATAQUE (tiempo límite del jefe) ---------------- */

  iniciarCicloAtaqueJefe() {
    if (!this.jefe || this.jefe.destruido) return;
    this.jefe.temporizadorAtaque = this.time.delayedCall(this.jefe.config.tiempoAtaque, () => {
      this.onCicloAtaqueJefeTerminado();
    });
  }

  onCicloAtaqueJefeTerminado() {
    if (!this.jefe || this.jefe.destruido) return;

    // El jugador pierde un servidor, pero el jefe conserva el daño recibido
    reproducirSonido('perderVida');
    this.desactivarServidorAleatorio();
    this.mostrarTextoFlotante(this.jefe.contenedor.x, this.jefe.contenedor.y - 100, '-1 SERVIDOR', PALETA.peligro);
    this.actualizarHUD();
    this.verificarEstadoJuego();

    if (estado.vidas > 0 && this.jefe && !this.jefe.destruido) {
      this.iniciarCicloAtaqueJefe();
    }
  }

  /* ---------------- RECIBIR GOLPE ---------------- */

  golpearJefe() {
    if (!this.jefe || this.jefe.destruido || this.jefe.protegido) return;
    this.jefe.protegido = true;

    this.jefe.vida -= 1;
    reproducirSonido('eliminar');
    this.crearParticulas(this.jefe.contenedor.x, this.jefe.contenedor.y, this.jefe.config.colorPrincipal);
    this.mostrarTextoFlotante(this.jefe.contenedor.x, this.jefe.contenedor.y - 100, '-1', PALETA.texto);
    this.destelloProteccionJefe();

    if (!this.movimientoReducido) {
      this.cameras.main.shake(90, 0.004);
      this.tweens.add({
        targets: this.jefe.contenedor,
        angle: { from: -2, to: 2 },
        duration: 45,
        yoyo: true,
        repeat: 3,
        onComplete: () => { if (this.jefe) this.jefe.contenedor.setAngle(0); },
      });
    }

    this.actualizarBarraVidaJefe();
    this.reposicionarJefeTrasGolpe();

    // Ya no puede volver a recibir clics durante 500ms (evita registrar
    // varios clics/toques como si fueran golpes distintos)
    this.time.delayedCall(500, () => {
      if (this.jefe) this.jefe.protegido = false;
    });

    if (this.jefe.vida <= 0) {
      this.derrotarJefe();
      return;
    }

    if (
      this.jefe.config.id === 'ransomware' &&
      this.jefe.fase === 1 &&
      this.jefe.vida <= this.jefe.vidaMaxima - this.jefe.config.faseCambioVida
    ) {
      this.activarFaseDosRansomware();
    }
  }

  // Breve destello blanco que marca la ventana de protección tras un golpe
  destelloProteccionJefe() {
    if (!this.jefe) return;
    const destello = this.add.circle(0, 0, 82, 0xffffff, 0.5);
    this.jefe.contenedor.add(destello);
    this.tweens.add({
      targets: destello,
      alpha: 0,
      scale: 1.15,
      duration: this.movimientoReducido ? 1 : 220,
      onComplete: () => destello.destroy(),
    });
  }

  reposicionarJefeTrasGolpe() {
    if (!this.jefe) return;
    const cfg = this.jefe.config;
    const area = this.areaJuego;

    if (cfg.movimiento === 'fijo') {
      const cx = this.anchoLogico / 2;
      const cy = (area.yMin + area.yMax) / 2;
      const nx = Phaser.Math.Clamp(cx + Phaser.Math.Between(-40, 40), area.xMin + 90, area.xMax - 90);
      const ny = Phaser.Math.Clamp(cy + Phaser.Math.Between(-30, 30), area.yMin + 90, area.yMax - 90);
      this.moverJefeA(nx, ny);
    } else if (cfg.movimiento === 'salto') {
      const nx = Phaser.Math.Between(area.xMin + 90, area.xMax - 90);
      const ny = Phaser.Math.Between(area.yMin + 90, area.yMax - 90);
      this.moverJefeA(nx, ny);
    }
    // 'lento' (ransomware) ya se mueve solo, de forma continua, en update()

    if (cfg.puntoDebil) {
      this.reposicionarPuntoDebil();
    }
  }

  moverJefeA(x, y) {
    if (!this.jefe) return;
    this.tweens.add({
      targets: this.jefe.contenedor,
      x,
      y,
      duration: this.movimientoReducido ? 1 : 260,
      ease: 'Quad.Out',
    });
  }

  actualizarBarraVidaJefe(inicial = false) {
    const jefe = this.jefe;
    if (!jefe) return;
    const objetivo = Phaser.Math.Clamp(jefe.vida / jefe.vidaMaxima, 0, 1);

    const dibujar = (proporcion) => {
      jefe.graficosVida.clear();
      const anchoBarra = jefe.barraVidaAncho;
      const x0 = -anchoBarra / 2;
      const y0 = jefe.placaY + 22;
      jefe.graficosVida.fillStyle(PALETA.borde, 1);
      jefe.graficosVida.fillRoundedRect(x0, y0, anchoBarra, 10, 5);
      if (proporcion > 0) {
        jefe.graficosVida.fillStyle(jefe.config.colorPrincipal, 1);
        jefe.graficosVida.fillRoundedRect(x0, y0, Math.max(anchoBarra * proporcion, 10), 10, 5);
      }
    };

    if (inicial || this.movimientoReducido) {
      dibujar(objetivo);
      jefe.proporcionVidaVisual = objetivo;
      return;
    }

    const estadoBarra = { valor: jefe.proporcionVidaVisual };
    this.tweens.add({
      targets: estadoBarra,
      valor: objetivo,
      duration: 300,
      ease: 'Quad.Out',
      onUpdate: () => dibujar(estadoBarra.valor),
      onComplete: () => { jefe.proporcionVidaVisual = objetivo; },
    });
  }

  activarFaseDosRansomware() {
    if (!this.jefe || this.jefe.fase === 2) return;
    this.jefe.fase = 2;
    this.mostrarTextoFlotante(this.jefe.contenedor.x, this.jefe.contenedor.y - 100, 'FASE 2', PALETA.peligro);
    if (!this.movimientoReducido) this.cameras.main.shake(150, 0.006);
  }

  /* ---------------- TRAMPAS GENERADAS POR EL JEFE ---------------- */
  /* (mismo comportamiento que un elemento "seguro" normal: clic = -1
     vida y "Falso positivo"; expira sola sin consecuencias) */

  programarTrampaJefe() {
    if (!this.jefe || this.jefe.destruido) return;
    const cfg = this.jefe.config;
    if (!cfg.generaTrampas) return;

    const intervalo = this.jefe.fase === 2
      ? Phaser.Math.Between(2200, 3400)
      : Phaser.Math.Between(3200, 4800);

    this.jefe.temporizadorTrampa = this.time.delayedCall(intervalo, () => {
      if (!this.jefe || this.jefe.destruido) return;
      if (this.jefe.trampas.length < cfg.maxTrampas) {
        this.generarTrampaJefe();
      }
      this.programarTrampaJefe();
    });
  }

  generarTrampaJefe() {
    const area = this.areaJuego;
    const x = Phaser.Math.Between(area.xMin, area.xMax);
    const y = Phaser.Math.Between(area.yMin, area.yMax);

    const contenedor = this.add.container(x, y);
    this.mundo.add(contenedor);

    const circuloFondo = this.add.circle(0, 0, 48, PALETA.superficie, 0.95);
    circuloFondo.setStrokeStyle(3, PALETA.azul, 1);
    const icono = this.add.graphics();
    dibujarIconoSeguro(icono, PALETA.azul);

    contenedor.add([circuloFondo, icono]);
    contenedor.setSize(96, 96);
    contenedor.setScale(0);
    this.tweens.add({
      targets: contenedor,
      scale: 1,
      duration: this.movimientoReducido ? 1 : 180,
      ease: 'Sine.Out',
    });

    circuloFondo.setInteractive({ useHandCursor: true });

    const trampa = { contenedor, temporizador: null, procesado: false };
    circuloFondo.on('pointerdown', () => this.resolverTrampaJefe(trampa, true));
    const vida = Phaser.Math.Between(2600, 3400);
    trampa.temporizador = this.time.delayedCall(vida, () => this.resolverTrampaJefe(trampa, false));

    this.jefe.trampas.push(trampa);
  }

  resolverTrampaJefe(trampa, fueClic) {
    if (trampa.procesado) return;
    trampa.procesado = true;
    if (trampa.temporizador) trampa.temporizador.remove();

    if (this.jefe) {
      const indice = this.jefe.trampas.indexOf(trampa);
      if (indice !== -1) this.jefe.trampas.splice(indice, 1);
    }

    const duracionSalida = this.movimientoReducido ? 1 : 220;

    if (fueClic) {
      reproducirSonido('trampa');
      if (!this.movimientoReducido) this.cameras.main.shake(110, 0.005);
      this.desactivarServidorAleatorio();
      this.mostrarTextoFlotante(
        trampa.contenedor.x,
        trampa.contenedor.y,
        [
          { texto: 'Falso positivo', fuente: FUENTE_INTERFAZ, tamano: 20 },
          { texto: '-1 servidor', fuente: FUENTE_MONO, tamano: 20 },
        ],
        PALETA.peligro
      );
      this.actualizarHUD();
      this.verificarEstadoJuego();
    }

    this.tweens.add({
      targets: trampa.contenedor,
      alpha: 0,
      duration: duracionSalida,
      onComplete: () => trampa.contenedor.destroy(),
    });
  }

  /* ---------------- DERROTA DEL JEFE ---------------- */

  derrotarJefe() {
    if (!this.jefe || this.jefe.destruido) return;
    this.jefe.destruido = true;

    // 1) Detener todos sus temporizadores y entradas
    if (this.jefe.temporizadorAtaque) this.jefe.temporizadorAtaque.remove();
    if (this.jefe.temporizadorTrampa) this.jefe.temporizadorTrampa.remove();
    if (this.jefe.temporizadorPuntoDebil) this.jefe.temporizadorPuntoDebil.remove();
    this.jefe.circuloBase.disableInteractive();
    if (this.jefe.puntoDebil) this.jefe.puntoDebil.circulo.disableInteractive();
    this.jefe.trampas.forEach((t) => {
      if (t.temporizador) t.temporizador.remove();
      t.contenedor.destroy();
    });
    this.jefe.trampas = [];

    const x = this.jefe.contenedor.x;
    const y = this.jefe.contenedor.y;
    const colorRotura = this.jefe.config.colorPrincipal;
    const recompensa = this.jefe.config.puntosRecompensa;
    const contenedorJefe = this.jefe.contenedor;

    // 2) Romper visualmente el jefe en partículas
    this.crearParticulas(x, y, colorRotura);
    this.crearParticulasDatos(x, y);
    this.tweens.add({
      targets: contenedorJefe,
      scale: 1.3,
      alpha: 0,
      duration: this.movimientoReducido ? 1 : 350,
      onComplete: () => contenedorJefe.destroy(),
    });

    // 3) Onda verde desde el servidor
    this.crearOndaExpansiva(this.anchoLogico / 2, this.servidorY, PALETA.verde);

    // 4) Puntos adicionales
    estado.puntuacion += recompensa;
    this.mostrarTextoFlotante(x, y, `+${recompensa}`, PALETA.verde);
    this.actualizarHUD();

    this.jefe = null;
    estado.jefeActivo = false;

    // 5) Esperar un momento y 6-7) reproducir la animación existente de
    // "Nivel superado", que además habilita continuar al siguiente nivel
    this.time.delayedCall(this.movimientoReducido ? 60 : 700, () => {
      this.finalizarPorNivelCompletado();
    });
  }

  // Detiene y destruye todo lo relacionado con el jefe (temporizadores,
  // trampas y el propio objeto). Se usa al reiniciar/cambiar de nivel o
  // ante una derrota, para no dejar eventos ni listeners sueltos.
  limpiarJefe() {
    if (!this.jefe) return;
    if (this.jefe.temporizadorAtaque) this.jefe.temporizadorAtaque.remove();
    if (this.jefe.temporizadorTrampa) this.jefe.temporizadorTrampa.remove();
    if (this.jefe.temporizadorPuntoDebil) this.jefe.temporizadorPuntoDebil.remove();
    this.jefe.trampas.forEach((t) => {
      if (t.temporizador) t.temporizador.remove();
      t.contenedor.destroy();
    });
    this.jefe.trampas = [];
    if (this.jefe.contenedor) this.jefe.contenedor.destroy();
    this.jefe = null;
  }
}

/* ------------------------------------------------------------------
   7. CONFIGURACIÓN Y CREACIÓN DEL JUEGO PHASER
   ------------------------------------------------------------------ */

// Construye la configuración de Phaser en el momento de crear el juego (no
// antes), para que el tamaño lógico del canvas refleje la pantalla real en
// ese instante: 1280x720 fijo en escritorio, o el tamaño vertical calculado
// por calcularDimensionesLogicas() en vista móvil. El canvas físico siempre
// es más grande que el mundo lógico; la escena compensa con el contenedor
// "mundo" escalado para que las coordenadas del juego no cambien, dando
// nitidez sin pixelado tanto en pantallas normales como de alta densidad.
function construirConfiguracionPhaser() {
  dimensionesLogicasActuales = calcularDimensionesLogicas();
  const factor = Math.min(window.devicePixelRatio || 1, 2);
  return {
    type: Phaser.AUTO,
    parent: 'contenedor-phaser',
    width: Math.round(dimensionesLogicasActuales.ancho * factor),
    height: Math.round(dimensionesLogicasActuales.alto * factor),
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
}

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
  estado.jefeActivo = false;
  estado.combo = 0;
}

function iniciarJuegoDesdeCero() {
  reiniciarEstado();
  mostrarPantalla('pantalla-juego');

  if (!juegoPhaser) {
    // Primera vez: se crea la instancia de Phaser con el tamaño lógico
    // adecuado a la pantalla actual (escritorio o móvil)
    juegoPhaser = new Phaser.Game(construirConfiguracionPhaser());
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

// Activa el escáner de la escena actual (si el juego está en curso).
// Se usa tanto desde el botón "ESCÁNER" como desde la tecla "S".
function activarEscanerDesdeUI() {
  if (!juegoPhaser || !estado.juegoActivo) return;
  const escena = juegoPhaser.scene.keys['EscenaJuego'];
  if (escena) escena.activarEscaner();
}

/* ------------------------------------------------------------------
   9. CONEXIÓN DE BOTONES DEL HTML
   ------------------------------------------------------------------ */
document.getElementById('btn-jugar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-siguiente-nivel').addEventListener('click', continuarAlSiguienteNivel);
document.getElementById('btn-reintentar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-jugar-de-nuevo').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-escaner').addEventListener('click', activarEscanerDesdeUI);

// Atajo de teclado: tecla "S" activa el escáner mientras se está jugando
window.addEventListener('keydown', (evento) => {
  if (evento.key.toLowerCase() !== 's') return;
  if (!document.getElementById('pantalla-juego').classList.contains('activa')) return;
  activarEscanerDesdeUI();
});
