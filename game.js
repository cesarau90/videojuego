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

// Emojis usados para representar virus de forma sencilla (sin imágenes externas)
const EMOJIS_VIRUS = ['🦠', '🐛', '☣️', '💀'];

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
    this.add.rectangle(ancho / 2, alto / 2, ancho, alto, 0x0a1410);
    this.dibujarFondoCircuito(ancho, alto);

    // Representación del servidor en la parte inferior de la pantalla
    this.add.rectangle(ancho / 2, alto - 40, ancho - 40, 60, 0x0f2a22)
      .setStrokeStyle(2, 0x00ff9c, 0.6);
    this.add.text(ancho / 2, alto - 40, '🖥️ SERVIDOR CENTRAL', {
      fontFamily: 'Consolas, monospace',
      fontSize: '18px',
      color: '#00ff9c',
    }).setOrigin(0.5);

    // Texto del HUD (parte superior): puntuación, vidas, nivel, progreso
    this.textoHUD = this.add.text(16, 12, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '16px',
      color: '#d7f5e9',
      lineSpacing: 6,
    });

    // Guardamos las medidas útiles para calcular posiciones aleatorias de virus
    this.areaJuego = {
      xMin: 50,
      xMax: ancho - 50,
      yMin: 110, // debajo del HUD
      yMax: alto - 130, // arriba del servidor
    };

    this.temporizadorSpawn = null;

    this.actualizarHUD();
    this.iniciarNivelActual();
  }

  // Dibuja unas líneas simples de "circuito" para ambientar el fondo
  dibujarFondoCircuito(ancho, alto) {
    const graficos = this.add.graphics();
    graficos.lineStyle(1, 0x1e90ff, 0.15);
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

    const configuracionNivel = NIVELES[estado.indiceNivel];

    // Genera un virus nuevo cada "tiempoAparicion" milisegundos (generación procedural)
    this.temporizadorSpawn = this.time.addEvent({
      delay: configuracionNivel.tiempoAparicion,
      callback: this.generarVirus,
      callbackScope: this,
      loop: true,
    });
  }

  limpiarVirusActivos() {
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

    // Emoji y color de aro aleatorios, para variar el aspecto de cada virus
    const emoji = Phaser.Utils.Array.GetRandom(EMOJIS_VIRUS);
    const colorAro = Phaser.Utils.Array.GetRandom([0x00ff9c, 0x1e90ff, 0xff3b3b]);

    // Un contenedor agrupa el círculo de fondo + el emoji, para moverlos/destruirlos juntos
    const contenedor = this.add.container(x, y);

    const circuloFondo = this.add.circle(0, 0, 30, 0x102018, 0.9);
    circuloFondo.setStrokeStyle(3, colorAro, 1);

    const textoEmoji = this.add.text(0, 0, emoji, { fontSize: '34px' }).setOrigin(0.5);

    contenedor.add([circuloFondo, textoEmoji]);
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

      this.mostrarTextoFlotante(virus.contenedor.x, virus.contenedor.y, '+10', '#00ff9c');
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

      this.mostrarTextoFlotante(virus.contenedor.x, virus.contenedor.y, '-1 Vida', '#ff3b3b');
    }

    this.actualizarHUD();
    this.verificarEstadoJuego();
  }

  // Pequeño texto que sube y se desvanece, como retroalimentación visual
  mostrarTextoFlotante(x, y, mensaje, color) {
    const texto = this.add.text(x, y, mensaje, {
      fontFamily: 'Consolas, monospace',
      fontSize: '18px',
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
    this.textoHUD.setText(
      `🏆 Puntuación: ${estado.puntuacion}\n` +
      `❤️ Vidas: ${'❤️'.repeat(Math.max(estado.vidas, 0))}${'🖤'.repeat(VIDAS_INICIALES - Math.max(estado.vidas, 0))}\n` +
      `📶 Nivel: ${configuracionNivel.numero} / ${NIVELES.length}\n` +
      `🦠 Virus eliminados: ${estado.virusEliminados} / ${configuracionNivel.virusRequeridos}`
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
    if (this.temporizadorSpawn) this.temporizadorSpawn.remove();
    this.limpiarVirusActivos();
    reproducirSonido('derrota');

    document.getElementById('texto-puntaje-derrota').textContent =
      `Puntuación final: ${estado.puntuacion} puntos`;
    mostrarPantalla('pantalla-derrota');
  }

  finalizarPorNivelCompletado() {
    estado.juegoActivo = false;
    if (this.temporizadorSpawn) this.temporizadorSpawn.remove();
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
  backgroundColor: '#0a1410',
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
