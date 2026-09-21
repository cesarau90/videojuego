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
   - virusRequeridos: cuántos virus hay que eliminar para pasar de nivel
   - tiempoAparicion: cada cuántos milisegundos aparece un virus nuevo
   - tiempoVidaVirus: cuántos milisegundos dura un virus en pantalla
     antes de que, si no se elimina, el jugador pierda una vida
   ------------------------------------------------------------------ */
const NIVELES = [
  { numero: 1, virusRequeridos: 10, tiempoAparicion: 1800, tiempoVidaVirus: 2600 },
  { numero: 2, virusRequeridos: 15, tiempoAparicion: 1300, tiempoVidaVirus: 2100 },
  { numero: 3, virusRequeridos: 20, tiempoAparicion: 900, tiempoVidaVirus: 1700 },
];

const VIDAS_INICIALES = 3;
const PUNTOS_POR_VIRUS = 10;

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

// Colores posibles para el aro de cada virus (el verde se reserva para
// el logotipo, el botón principal y la retroalimentación de éxito)
const COLORES_VIRUS = [PALETA.azul, PALETA.peligro];

/* ------------------------------------------------------------------
   2. ESTADO GLOBAL DEL JUEGO
   Estas variables guardan lo que está pasando en la partida actual.
   ------------------------------------------------------------------ */
const estado = {
  puntuacion: 0,
  vidas: VIDAS_INICIALES,
  indiceNivel: 0, // 0 = nivel 1, 1 = nivel 2, 2 = nivel 3
  virusEliminados: 0,
  virusActivos: [], // lista de virus que están en pantalla ahora mismo
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
      // Sonido agudo y corto: virus eliminado con éxito
      oscilador.type = 'square';
      oscilador.frequency.setValueAtTime(880, ctx.currentTime);
      volumen.gain.setValueAtTime(0.12, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.15);
    } else if (tipo === 'perderVida') {
      // Sonido grave: el jugador perdió una vida
      oscilador.type = 'sawtooth';
      oscilador.frequency.setValueAtTime(180, ctx.currentTime);
      volumen.gain.setValueAtTime(0.15, ctx.currentTime);
      volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.35);
    } else if (tipo === 'nivelSuperado') {
      // Melodía corta ascendente
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

/* ------------------------------------------------------------------
   5. ESCENA PRINCIPAL DE PHASER
   Aquí ocurre toda la generación procedural de virus y el
   dibujo del "servidor" (el área de juego).
   ------------------------------------------------------------------ */
class EscenaJuego extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaJuego' });
  }

  create() {
    const ancho = this.scale.width;
    const alto = this.scale.height;

    // Fondo tipo "servidor" con líneas de circuito decorativas
    this.add.rectangle(ancho / 2, alto / 2, ancho, alto, PALETA.fondo);
    this.dibujarFondoCircuito(ancho, alto);

    // Representación del servidor en la parte inferior de la pantalla
    this.add.rectangle(ancho / 2, alto - 40, ancho - 40, 60, PALETA.superficie)
      .setStrokeStyle(1, PALETA.borde, 1);
    this.add.text(ancho / 2, alto - 40, 'SERVIDOR CENTRAL', {
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '15px',
      color: PALETA.textoSecundario,
      letterSpacing: 1,
    }).setOrigin(0.5);

    // Texto del HUD (parte superior): puntuación, vidas, nivel, progreso
    this.textoHUD = this.add.text(16, 12, '', {
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '15px',
      color: PALETA.texto,
      lineSpacing: 8,
    });

    // Guardamos las medidas útiles para calcular posiciones aleatorias de virus
    this.areaJuego = {
      xMin: 50,
      xMax: ancho - 50,
      yMin: 110, // debajo del HUD
      yMax: alto - 130, // arriba del servidor
    };

    this.temporizadorSiguienteVirus = null;

    this.actualizarHUD();
    this.iniciarNivelActual();
  }

  // Dibuja unas líneas simples de "circuito" para ambientar el fondo
  dibujarFondoCircuito(ancho, alto) {
    const graficos = this.add.graphics();
    graficos.lineStyle(1, PALETA.borde, 0.5);
    for (let x = 0; x < ancho; x += 60) {
      graficos.lineBetween(x, 0, x, alto);
    }
    for (let y = 0; y < alto; y += 60) {
      graficos.lineBetween(0, y, ancho, y);
    }
  }

  /* ---------------- CONTROL DE NIVELES ---------------- */

  iniciarNivelActual() {
    estado.virusEliminados = 0;
    this.limpiarVirusActivos();
    this.actualizarHUD();

    // El juego trabaja con UN virus a la vez: aparece el primero, y cada
    // vez que ese virus se resuelve (clic o tiempo agotado) se programa
    // automáticamente la aparición del siguiente.
    this.programarSiguienteVirus();
  }

  // Programa la aparición del próximo virus tras "tiempoAparicion" ms
  // (generación procedural: posición y apariencia aleatorias en generarVirus()).
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
    estado.virusActivos.forEach((virus) => {
      if (virus.temporizador) virus.temporizador.remove();
      virus.contenedor.destroy();
    });
    estado.virusActivos = [];
  }

  /* ---------------- GENERACIÓN PROCEDURAL DE VIRUS ---------------- */

  generarVirus() {
    if (!estado.juegoActivo) return;

    const configuracionNivel = NIVELES[estado.indiceNivel];
    const area = this.areaJuego;

    // Posición aleatoria dentro del área de juego (esto es la "generación procedural")
    const x = Phaser.Math.Between(area.xMin, area.xMax);
    const y = Phaser.Math.Between(area.yMin, area.yMax);

    // Color de aro aleatorio, para variar el aspecto de cada virus
    const colorAro = Phaser.Utils.Array.GetRandom(COLORES_VIRUS);

    // Un contenedor agrupa el círculo de fondo + el ícono, para moverlos/destruirlos juntos
    const contenedor = this.add.container(x, y);

    const circuloFondo = this.add.circle(0, 0, 30, PALETA.superficie, 0.95);
    circuloFondo.setStrokeStyle(2, colorAro, 1);

    // Ícono de amenaza dibujado como vector simple (una "X"), sin emojis ni imágenes
    const iconoAmenaza = this.add.graphics();
    iconoAmenaza.lineStyle(2.5, colorAro, 1);
    iconoAmenaza.beginPath();
    iconoAmenaza.moveTo(-8, -8);
    iconoAmenaza.lineTo(8, 8);
    iconoAmenaza.moveTo(8, -8);
    iconoAmenaza.lineTo(-8, 8);
    iconoAmenaza.strokePath();

    contenedor.add([circuloFondo, iconoAmenaza]);
    contenedor.setSize(60, 60);
    contenedor.setScale(0);

    // Animación de aparición
    this.tweens.add({
      targets: contenedor,
      scale: 1,
      duration: 200,
      ease: 'Back.Out',
    });

    // El círculo es interactivo: se puede hacer clic/tocar sobre él
    circuloFondo.setInteractive({ useHandCursor: true });

    const virus = { contenedor, circuloFondo, temporizador: null };

    circuloFondo.on('pointerdown', () => {
      this.eliminarVirus(virus, true);
    });

    // Temporizador: si el jugador no hace clic a tiempo, se pierde una vida
    virus.temporizador = this.time.delayedCall(configuracionNivel.tiempoVidaVirus, () => {
      this.eliminarVirus(virus, false);
    });

    estado.virusActivos.push(virus);
  }

  /* ---------------- ELIMINAR / EXPIRAR UN VIRUS ---------------- */

  eliminarVirus(virus, fueEliminadoPorClic) {
    // Evita procesar el mismo virus dos veces (por ejemplo, clic justo cuando expira)
    if (virus.procesado) return;
    virus.procesado = true;

    if (virus.temporizador) virus.temporizador.remove();

    const indice = estado.virusActivos.indexOf(virus);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    if (fueEliminadoPorClic) {
      // Retroalimentación visual: el virus "explota" y desaparece
      estado.puntuacion += PUNTOS_POR_VIRUS;
      estado.virusEliminados += 1;
      reproducirSonido('eliminar');

      this.tweens.add({
        targets: virus.contenedor,
        scale: 1.6,
        alpha: 0,
        duration: 220,
        onComplete: () => virus.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(virus.contenedor.x, virus.contenedor.y, '+10', PALETA.verde);
    } else {
      // El virus no fue eliminado a tiempo: el jugador pierde una vida
      estado.vidas -= 1;
      reproducirSonido('perderVida');
      this.cameras.main.shake(150, 0.01);

      this.tweens.add({
        targets: virus.contenedor,
        alpha: 0,
        duration: 300,
        onComplete: () => virus.contenedor.destroy(),
      });

      this.mostrarTextoFlotante(virus.contenedor.x, virus.contenedor.y, '-1 VIDA', PALETA.peligro);
    }

    this.actualizarHUD();
    this.verificarEstadoJuego();

    // Si el juego sigue activo (no hubo derrota ni se completó el nivel),
    // se genera automáticamente el siguiente virus.
    if (estado.juegoActivo) {
      this.programarSiguienteVirus();
    }
  }

  // Pequeño texto que sube y se desvanece, como retroalimentación visual
  mostrarTextoFlotante(x, y, mensaje, color) {
    const texto = this.add.text(x, y, mensaje, {
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '16px',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: texto,
      y: y - 50,
      alpha: 0,
      duration: 700,
      onComplete: () => texto.destroy(),
    });
  }

  /* ---------------- HUD ---------------- */

  actualizarHUD() {
    const configuracionNivel = NIVELES[estado.indiceNivel];
    const vidasActuales = Math.max(estado.vidas, 0);
    const vidasPerdidas = VIDAS_INICIALES - vidasActuales;

    this.textoHUD.setText(
      `PUNTOS    ${estado.puntuacion}\n` +
      `VIDAS     ${'●'.repeat(vidasActuales)}${'○'.repeat(vidasPerdidas)}\n` +
      `NIVEL     ${configuracionNivel.numero} / ${NIVELES.length}\n` +
      `AMENAZAS  ${estado.virusEliminados} / ${configuracionNivel.virusRequeridos}`
    );
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

  finalizarPorNivelCompletado() {
    estado.juegoActivo = false;
    this.limpiarVirusActivos();

    const esUltimoNivel = estado.indiceNivel === NIVELES.length - 1;

    if (esUltimoNivel) {
      reproducirSonido('victoria');
      document.getElementById('texto-puntaje-victoria').textContent =
        `Puntuación final: ${estado.puntuacion} puntos`;
      mostrarPantalla('pantalla-victoria');
    } else {
      reproducirSonido('nivelSuperado');
      const configuracionNivel = NIVELES[estado.indiceNivel];
      document.getElementById('texto-nivel-completado').textContent =
        `Superaste el nivel ${configuracionNivel.numero} con ${estado.puntuacion} puntos.`;
      mostrarPantalla('pantalla-nivel-completado');
    }
  }
}

/* ------------------------------------------------------------------
   6. CONFIGURACIÓN Y CREACIÓN DEL JUEGO PHASER
   ------------------------------------------------------------------ */
const configuracionPhaser = {
  type: Phaser.AUTO,
  parent: 'contenedor-phaser',
  width: 800,
  height: 600,
  backgroundColor: '#07110f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
  },
  scene: [EscenaJuego],
};

let juegoPhaser = null;

/* ------------------------------------------------------------------
   7. FUNCIONES DE CONTROL GENERAL DEL JUEGO (conectan HTML con Phaser)
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

function continuarAlSiguienteNivel() {
  estado.indiceNivel += 1;
  estado.juegoActivo = true;
  mostrarPantalla('pantalla-juego');

  const escena = juegoPhaser.scene.keys['EscenaJuego'];
  escena.iniciarNivelActual();
}

/* ------------------------------------------------------------------
   8. CONEXIÓN DE BOTONES DEL HTML
   ------------------------------------------------------------------ */
document.getElementById('btn-jugar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-siguiente-nivel').addEventListener('click', continuarAlSiguienteNivel);
document.getElementById('btn-reintentar').addEventListener('click', iniciarJuegoDesdeCero);
document.getElementById('btn-jugar-de-nuevo').addEventListener('click', iniciarJuegoDesdeCero);
