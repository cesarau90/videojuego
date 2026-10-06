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
    numero: 1, virusRequeridos: 10, tiempoAparicion: 1800, tiempoVidaVirus: 7000, probabilidadSeguro: 0.15,
    maxElementos: 2, probabilidadMovimiento: 0.15, probabilidadCritica: 0.08, probabilidadResistente: 0,
    velocidadMin: 0.4, velocidadMax: 0.7,
    probabilidadDuplicador: 0,
  },
  {
    numero: 2, virusRequeridos: 15, tiempoAparicion: 1100, tiempoVidaVirus: 6000, probabilidadSeguro: 0.25,
    maxElementos: 3, probabilidadMovimiento: 0.5, probabilidadCritica: 0.15, probabilidadResistente: 0.13,
    velocidadMin: 0.6, velocidadMax: 1.0,
    probabilidadDuplicador: 0.14,
  },
  {
    numero: 3, virusRequeridos: 25, tiempoAparicion: 800, tiempoVidaVirus: 5200, probabilidadSeguro: 0.3,
    maxElementos: 5, probabilidadMovimiento: 0.75, probabilidadCritica: 0.18, probabilidadResistente: 0.17,
    velocidadMin: 0.9, velocidadMax: 1.4,
    probabilidadDuplicador: 0.2,
  },
];

const VIDAS_INICIALES = 3;

/* ------------------------------------------------------------------
   1B. PREGUNTAS DE SEGURIDAD (banco de 5 por nivel, una al azar)
   Aparecen tras derrotar al jefe, antes de la tarjeta "Nivel superado"
   o "Victoria". No quitan vidas ni provocan derrota: solo dan un bono
   de puntos si se acierta dentro del tiempo. Ver mostrarPreguntaNivel().
   ------------------------------------------------------------------ */
const SEGUNDOS_PREGUNTA = 10;
const PUNTOS_POR_SEGUNDO_PREGUNTA = 5;

// Banco de preguntas: 5 por nivel (índice 0 = nivel 1). Al completar un nivel
// se elige una al azar y sus 4 opciones se mezclan (ver mostrarPreguntaNivel).
// "correcta" es el índice de la única respuesta válida dentro de "opciones";
// el orden escrito aquí no es el que ve el jugador.
const PREGUNTAS_NIVEL = [
  // ---------- Nivel 1: malware ----------
  [
    {
      pregunta: '¿Cuál de las siguientes es una señal común de que un dispositivo está infectado con malware?',
      opciones: [
        'El dispositivo funciona más lento de lo normal y aparecen ventanas emergentes inesperadas',
        'El antivirus se actualiza automáticamente',
        'El sistema operativo se actualiza sin errores',
        'El navegador recuerda tus marcadores favoritos',
      ],
      correcta: 0,
      explicacion: 'El malware suele consumir recursos del equipo y generar anuncios o ventanas emergentes no solicitadas; por eso el dispositivo se vuelve más lento de lo normal.',
    },
    {
      pregunta: '¿Qué tipo de malware cifra tus archivos y exige un pago para devolverte el acceso?',
      opciones: [
        'Spyware',
        'Adware',
        'Ransomware',
        'Un cortafuegos (firewall)',
      ],
      correcta: 2,
      explicacion: 'El ransomware secuestra la información cifrándola y pide un rescate a cambio de la clave; por eso es importante tener copias de seguridad.',
    },
    {
      pregunta: 'Recibes un correo con un archivo adjunto de un remitente que no conoces. ¿Qué es lo más seguro?',
      opciones: [
        'Abrirlo para ver qué contiene',
        'Reenviarlo a tus contactos para que lo revisen',
        'Desactivar el antivirus y abrirlo con calma',
        'No abrirlo y eliminarlo o reportarlo como sospechoso',
      ],
      correcta: 3,
      explicacion: 'Los adjuntos de remitentes desconocidos son una vía muy común para instalar malware. Lo más prudente es no abrirlos y reportarlos o eliminarlos.',
    },
    {
      pregunta: '¿Qué caracteriza a un troyano?',
      opciones: [
        'Se copia solo por la red sin necesitar ninguna acción del usuario',
        'Se hace pasar por un programa legítimo para que el usuario lo instale',
        'Es una pieza física que se conecta a la computadora',
        'Solo aparece cuando el equipo está apagado',
      ],
      correcta: 1,
      explicacion: 'Como el caballo de Troya, este malware se disfraza de algo útil o inofensivo para que el propio usuario lo ejecute y le abra la puerta al atacante.',
    },
    {
      pregunta: '¿Dónde es más seguro descargar aplicaciones y programas?',
      opciones: [
        'En enlaces enviados por mensaje por desconocidos',
        'En sitios que regalan versiones "gratis" de programas de pago',
        'En la tienda oficial o en el sitio web oficial del fabricante',
        'En ventanas emergentes que dicen "descarga ahora"',
      ],
      correcta: 2,
      explicacion: 'Las tiendas y sitios oficiales revisan el software que publican. Las copias "gratis" y los enlaces desconocidos suelen esconder malware.',
    },
  ],

  // ---------- Nivel 2: protección de cuentas ----------
  [
    {
      pregunta: '¿Cuál es la forma más segura de proteger una cuenta, además de usar una contraseña fuerte?',
      opciones: [
        'Usar la misma contraseña en todos los sitios para no olvidarla',
        'Activar la verificación en dos pasos (2FA)',
        'Compartir la contraseña solo con amigos de confianza',
        'Guardar la contraseña en un papel pegado a la pantalla',
      ],
      correcta: 1,
      explicacion: 'La verificación en dos pasos agrega una segunda prueba de identidad (como un código temporal), así que aunque alguien robe tu contraseña no podrá entrar solo con eso.',
    },
    {
      pregunta: '¿Cuál de estas contraseñas es la más segura?',
      opciones: [
        '123456',
        'password',
        'Mi nombre y mi año de nacimiento',
        'Una frase larga con letras, números y símbolos, como "Tren-Luna-Azul-98!"',
      ],
      correcta: 3,
      explicacion: 'La longitud y la variedad hacen que una contraseña sea muy difícil de adivinar. Las claves comunes o con datos personales se descubren en segundos.',
    },
    {
      pregunta: 'Te llega un correo "del banco" que dice que tu cuenta se bloqueará y te pide entrar desde un enlace. ¿Qué haces?',
      opciones: [
        'Entras desde el enlace lo antes posible para evitar el bloqueo',
        'No haces clic y accedes escribiendo tú mismo la dirección oficial, o llamas al banco',
        'Respondes el correo con tu contraseña para verificar tu identidad',
        'Reenvías el correo a tus amigos para avisarles',
      ],
      correcta: 1,
      explicacion: 'Es un intento de phishing: usa la urgencia para que entregues tus datos en un sitio falso. Siempre entra por la dirección oficial que tú escribas.',
    },
    {
      pregunta: '¿Para qué sirve un gestor de contraseñas?',
      opciones: [
        'Para usar una sola contraseña en todas las cuentas',
        'Para enviar tus contraseñas por correo a tus contactos',
        'Para que cualquiera pueda entrar a tus cuentas si lo necesita',
        'Para guardar de forma cifrada contraseñas distintas y fuertes para cada sitio',
      ],
      correcta: 3,
      explicacion: 'Un gestor recuerda por ti contraseñas largas y únicas, así que si una se filtra, las demás cuentas siguen protegidas.',
    },
    {
      pregunta: 'Sospechas que alguien entró a tu cuenta. ¿Qué debes hacer primero?',
      opciones: [
        'Esperar unos días a ver si vuelve a pasar',
        'Cambiar la contraseña de inmediato, activar 2FA y cerrar las sesiones abiertas',
        'Borrar la aplicación y olvidarte del asunto',
        'Publicar tu contraseña anterior para avisar a otros',
      ],
      correcta: 1,
      explicacion: 'Cambiar la contraseña, activar la verificación en dos pasos y cerrar sesiones activas le corta el acceso al atacante cuanto antes.',
    },
  ],

  // ---------- Nivel 3: copias de seguridad ----------
  [
    {
      pregunta: '¿Cuál es la mejor práctica al hacer copias de seguridad (backups) de información importante?',
      opciones: [
        'Guardar una sola copia en el mismo disco donde está el original',
        'Hacer una copia una sola vez y nunca volver a revisarla',
        'Mantener varias copias en lugares distintos, incluida una fuera del equipo principal',
        'Confiar únicamente en la memoria del dispositivo',
      ],
      correcta: 2,
      explicacion: 'Si el original y la copia están en el mismo lugar, un solo incidente (como un ransomware) puede destruir ambos; por eso conviene tener varias copias en medios distintos, con al menos una fuera del equipo principal.',
    },
    {
      pregunta: '¿En qué consiste la regla de respaldo 3-2-1?',
      opciones: [
        '3 copias de los datos, en 2 tipos de medios distintos, con 1 copia fuera del lugar principal',
        '3 contraseñas, 2 antivirus y 1 cortafuegos',
        '3 copias en el mismo disco, 2 veces al año, durante 1 día',
        '3 dispositivos, 2 usuarios y 1 clave compartida',
      ],
      correcta: 0,
      explicacion: 'Tener 3 copias en 2 tipos de medios y 1 fuera del sitio reduce mucho el riesgo de perder todo por una falla, un robo o un ataque.',
    },
    {
      pregunta: '¿Por qué conviene probar de vez en cuando que una copia de seguridad se puede restaurar?',
      opciones: [
        'Porque así se borra el original y ocupa menos espacio',
        'Porque restaurar una copia la hace más rápida',
        'Para comprobar que la copia funciona antes de necesitarla de verdad',
        'No es necesario: toda copia funciona siempre',
      ],
      correcta: 2,
      explicacion: 'Una copia dañada o incompleta solo se descubre al intentar restaurarla. Probarla a tiempo evita sorpresas cuando ocurre un incidente.',
    },
    {
      pregunta: 'Un ransomware cifra los archivos de tu equipo, pero tienes una copia reciente guardada aparte y desconectada. ¿Qué te permite hacer?',
      opciones: [
        'Pagar el rescate para recuperar los archivos',
        'Restaurar tus datos desde la copia sin depender del atacante',
        'Nada: los archivos ya no se pueden recuperar',
        'Volver a infectarte para deshacer el cifrado',
      ],
      correcta: 1,
      explicacion: 'Una copia reciente y aislada permite recuperar la información sin pagar el rescate; por eso los respaldos son la mejor defensa contra el ransomware.',
    },
    {
      pregunta: 'Si la información cambia todos los días, ¿cada cuánto deberían hacerse las copias?',
      opciones: [
        'Una vez al año',
        'Solo cuando el equipo falle',
        'Con regularidad y de forma automática, por ejemplo a diario',
        'Nunca: basta con la primera copia',
      ],
      correcta: 2,
      explicacion: 'Cuanto más seguido cambia la información, más frecuentes deben ser las copias; automatizarlas evita olvidos y limita cuánto trabajo se pierde.',
    },
  ],
];

// Devuelve una pregunta al azar del nivel indicado, con sus 4 opciones
// mezcladas (Fisher-Yates). La respuesta válida se identifica por el valor
// de cada opción (no por su posición original), así que sigue siendo
// correcta aunque el orden cambie: devuelve el nuevo índice de la correcta.
function elegirPreguntaAleatoria(indiceNivel) {
  const banco = PREGUNTAS_NIVEL[indiceNivel];
  const original = banco[Math.floor(Math.random() * banco.length)];
  const opciones = original.opciones.map((texto, indice) => ({ texto, esCorrecta: indice === original.correcta }));
  for (let i = opciones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
  }
  return {
    pregunta: original.pregunta,
    opciones: opciones.map((o) => o.texto),
    correcta: opciones.findIndex((o) => o.esCorrecta),
    explicacion: original.explicacion,
  };
}

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

// El color de cada elemento depende de su tipo (como en el juego original);
// la letra de ataque (A/B/X/Y) se muestra encima y se elige al azar.
const BOTONES_ATAQUE = {
  A: { color: PALETA.verde, nombre: 'VERDE' },
  B: { color: PALETA.peligro, nombre: 'ROJO' },
  X: { color: PALETA.azul, nombre: 'AZUL' },
  Y: { color: 0xffd34e, nombre: 'AMARILLO' },
};
// Jugadores del modo cooperativo: cada uno tiene su mira de color y su
// propio marcador. En modo de 1 jugador solo se usa el primero.
const JUGADORES = [
  { etiqueta: 'J1', color: PALETA.azul, colorTexto: PALETA.azulTexto },
  { etiqueta: 'J2', color: 0xffd34e, colorTexto: '#ffd34e' },
];
// En el modo 2 jugadores hay el doble de manos atacando, así que los jefes
// tienen 50% más de vida y cabe un elemento más en pantalla a la vez.
const FACTOR_VIDA_JEFE_2J = 1.5;
const ELEMENTOS_EXTRA_2J = 1;
// Teclas del jugador 2 para atacar (en el teclado de la PC).
const TECLAS_ATAQUE_J2 = { 7: 'A', 8: 'B', 9: 'X', 0: 'Y' };
const COMBINACIONES_JEFE = [['A', 'B'], ['X', 'Y', 'A'], ['B', 'X', 'A', 'Y']];
function colorElemento(elemento) {
  return colorPorTipo(elemento.tipo);
}

// Tamaño lógico fijo del tablero de escritorio (mínimo 1280x720, como pide
// el diseño). Todas las posiciones del HUD, el servidor y los elementos se
// calculan en este espacio fijo cuando NO se está en vista móvil.
const ANCHO_JUEGO = 1280;
const ALTO_JUEGO = 720;

/* ------------------------------------------------------------------
   1C. TABLERO RESPONSIVE PARA MÓVIL (≤768px)
   En vista móvil el tablero adapta su proporción al espacio real disponible
   para el canvas. En vertical conserva 1280 unidades de alto; en horizontal
   conserva 1280 de ancho y calcula el alto. Así el teléfono puede girarse
   sin estirar el dibujo ni convertir los círculos en óvalos.
   ------------------------------------------------------------------ */
const ALTO_JUEGO_MOVIL = 1280;
const ANCHO_JUEGO_MOVIL_MIN = 480;
const ANCHO_JUEGO_MOVIL_MAX = 900;
const ALTO_JUEGO_MOVIL_HORIZONTAL_MIN = 540;
const PUNTO_QUIEBRE_MOVIL = 768;

// true si la pantalla actual entra en el punto de quiebre móvil. Combina
// dos condiciones para no confundir un teléfono con una laptop:
// 1) La dimensión MÁS PEQUEÑA (ancho o alto) es angosta: así un teléfono
//    sigue tratándose como móvil sin importar su orientación (un
//    teléfono de 390x844 mide igual de "angosto" al rotarlo a 844x390,
//    ahora es el alto el que mide 390).
// 2) El dispositivo es táctil o se identifica como móvil. Se consulta
//    navigator.maxTouchPoints además de las media queries porque Safari en
//    iPhone/iPad puede reportar temporalmente un puntero fino al rotar.
//    Una laptop normal de pantalla corta sigue usando la vista de PC.
// Se reevalúa en cada llamada, así que responde a rotaciones y cambios de
// tamaño de ventana sin necesidad de recargar la página.
function esVistaMovil() {
  const ladoMenor = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  if (!(ladoMenor > 0 && ladoMenor <= PUNTO_QUIEBRE_MOVIL)) return false;
  const tactil = (navigator.maxTouchPoints || 0) > 0;
  const punteroTactil = window.matchMedia
    ? window.matchMedia('(hover: none), (pointer: coarse)').matches
    : false;
  const agenteMovil = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  return tactil || punteroTactil || agenteMovil;
}

// El CSS móvil se activa con esta clase en vez de repetir la detección con
// media queries. Así JavaScript y CSS nunca pueden elegir modos distintos,
// incluso si Safari cambia lo que informa sobre hover/pointer al rotar.
function sincronizarClaseVistaMovil() {
  document.documentElement.classList.toggle('vista-movil', esVistaMovil());
}

sincronizarClaseVistaMovil();
window.addEventListener('resize', sincronizarClaseVistaMovil);
window.addEventListener('orientationchange', sincronizarClaseVistaMovil);

// Calcula las dimensiones lógicas del tablero según el modo actual:
// - Escritorio: siempre 1280x720 fijo (sin cambios respecto al diseño
//   original).
// - Móvil vertical: alto fijo y ancho calculado con la proporción del área.
// - Móvil horizontal: ancho fijo y alto calculado con esa proporción. Se
//   conserva un mínimo de 540 unidades de alto para que HUD, área de juego,
//   jefes y servidores nunca se encimen en teléfonos muy panorámicos.
function calcularDimensionesLogicas() {
  if (!esVistaMovil()) return { ancho: ANCHO_JUEGO, alto: ALTO_JUEGO };

  // El botón del escáner vive fuera del canvas. Por eso usamos el tamaño
  // real de su contenedor flexible y no window.innerWidth/innerHeight: en
  // horizontal la barra del botón reduce la altura disponible del tablero.
  const contenedor = document.getElementById('contenedor-phaser');
  const anchoDisponible = contenedor?.clientWidth || window.innerWidth || ANCHO_JUEGO_MOVIL_MIN;
  const altoDisponible = contenedor?.clientHeight || window.innerHeight || ALTO_JUEGO_MOVIL;
  const proporcion = anchoDisponible / Math.max(altoDisponible, 1);

  if (proporcion > 1) {
    const ancho = ANCHO_JUEGO;
    const alto = Phaser.Math.Clamp(
      Math.round(ancho / proporcion),
      ALTO_JUEGO_MOVIL_HORIZONTAL_MIN,
      ALTO_JUEGO_MOVIL
    );
    return { ancho, alto };
  }

  const alto = ALTO_JUEGO_MOVIL;
  const ancho = Phaser.Math.Clamp(
    Math.round(alto * proporcion),
    ANCHO_JUEGO_MOVIL_MIN,
    ANCHO_JUEGO_MOVIL_MAX
  );
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
    tiempoAtaque: 10000,
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
    tiempoAtaque: 10000,
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
    tiempoAtaque: 12000,
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
  multijugador: false, // true en el modo cooperativo de 2 jugadores
  puntosJugadores: [0, 0], // puntos conseguidos por cada jugador
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
   4A. PREGUNTA DE SEGURIDAD (entre el jefe derrotado y "Nivel superado")
   Muestra la pregunta del nivel indicado, corre un contador de 10s y,
   al responder (clic/toque) o agotarse el tiempo, revela la respuesta
   correcta y una explicación breve. Acertar da un bono de puntos; fallar
   o agotar el tiempo desactiva un servidor al azar (igual que un falso
   positivo, ver desactivarServidorAleatorio en "escena"), lo que puede
   provocar una derrota si era el último servidor en línea. Llama a
   "callback(bono)" una sola vez, cuando el jugador pulsa "Continuar",
   con el bono de puntos ya calculado (0 si falló o se acabó el tiempo);
   quien llama a esta función es responsable de revisar estado.vidas
   después, por si hay que mostrar la derrota en vez de continuar (ver
   finalizarPorNivelCompletado).
   ------------------------------------------------------------------ */
// Opacidad con la que queda oscurecido el tablero mientras se muestra la
// pregunta de seguridad (la tarjeta HTML va encima)
const ALPHA_TABLERO_PREGUNTA = 0.85;

function mostrarPreguntaNivel(indiceNivel, escena, callback) {
  const datos = elegirPreguntaAleatoria(indiceNivel);

  const elementoTexto = document.getElementById('texto-pregunta');
  const elementoOpciones = document.getElementById('opciones-pregunta');
  const elementoContador = document.getElementById('contador-pregunta');
  const elementoBarra = document.getElementById('barra-tiempo-pregunta');
  const elementoExplicacion = document.getElementById('texto-explicacion-pregunta');
  const botonContinuar = document.getElementById('btn-continuar-pregunta');

  elementoTexto.textContent = datos.pregunta;
  elementoOpciones.innerHTML = '';
  elementoExplicacion.textContent = '';
  elementoExplicacion.hidden = true;
  botonContinuar.hidden = true;
  botonContinuar.onclick = null;

  let segundosRestantes = SEGUNDOS_PREGUNTA;
  elementoContador.textContent = segundosRestantes;

  // La barra queda llena y detenida hasta que todas las opciones estén
  // listas (ver iniciarRespuesta): los 10 segundos no corren durante la
  // animación de entrada.
  elementoBarra.classList.remove('en-marcha');
  elementoBarra.style.width = ''; // sin ancho en línea: manda la hoja de estilos (100%, o 0% con .en-marcha)

  // Las opciones entran una tras otra, con 50 ms de separación, cuando la
  // tarjeta ya empezó a aparecer (350 ms). Con movimiento reducido no hay
  // retardos: todo aparece a la vez.
  const reducido = prefiereMovimientoReducido();
  const DURACION_TARJETA_MS = reducido ? 0 : 350;
  const RETARDO_ENTRE_OPCIONES_MS = reducido ? 0 : 50;
  const DURACION_OPCION_MS = reducido ? 0 : 240;
  const inicioOpciones = reducido ? 0 : Math.round(DURACION_TARJETA_MS * 0.5);

  let respondida = false;
  let intervalo = null;
  let temporizadorListo = null;

  const botones = datos.opciones.map((textoOpcion, indice) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'opcion-pregunta';
    boton.textContent = textoOpcion;
    boton.style.animationDelay = `${inicioOpciones + indice * RETARDO_ENTRE_OPCIONES_MS}ms`;
    boton.addEventListener('click', () => {
      // Ignora cualquier toque anterior a que las opciones estén listas
      // (por ejemplo, el clic sobre el último golpe al jefe)
      if (boton.classList.contains('lista')) resolver(indice);
    });
    elementoOpciones.appendChild(boton);
    return boton;
  });

  // Se ejecuta cuando ya se ven las cuatro opciones: las habilita para
  // pulsarse y solo entonces arranca el contador y la barra de 10 s.
  function iniciarRespuesta() {
    if (respondida) return;
    botones.forEach((boton) => boton.classList.add('lista'));
    // Barra: transición de ancho a 0 en 10s (ver style.css), iniciada en
    // el siguiente frame para que parta del 100%
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!respondida) elementoBarra.classList.add('en-marcha');
      });
    });
    intervalo = setInterval(() => {
      segundosRestantes -= 1;
      elementoContador.textContent = Math.max(segundosRestantes, 0);
      if (segundosRestantes <= 0) resolver(null);
    }, 1000);
  }

  const esperaListo = inicioOpciones + (botones.length - 1) * RETARDO_ENTRE_OPCIONES_MS + DURACION_OPCION_MS;
  temporizadorListo = setTimeout(iniciarRespuesta, esperaListo);

  // Resuelve la pregunta una sola vez (clic en una opción o tiempo agotado
  // con indiceElegido = null), sin importar cuántas veces se llame después.
  function resolver(indiceElegido) {
    if (respondida) return;
    respondida = true;
    clearInterval(intervalo);
    clearTimeout(temporizadorListo);
    elementoBarra.classList.remove('en-marcha');
    elementoBarra.style.width = '0%';

    const acierto = indiceElegido === datos.correcta;
    const segundosParaBono = Math.max(segundosRestantes, 0);
    const bono = acierto
      ? Math.min(SEGUNDOS_PREGUNTA * PUNTOS_POR_SEGUNDO_PREGUNTA, segundosParaBono * PUNTOS_POR_SEGUNDO_PREGUNTA)
      : 0;

    // Fallar o agotar el tiempo apaga un servidor al azar, igual que un
    // falso positivo (nunca dos: solo se llama una vez por pregunta).
    if (!acierto) escena.desactivarServidorAleatorio();

    botones.forEach((boton, indice) => {
      boton.disabled = true;
      if (indice === datos.correcta) boton.classList.add('opcion-correcta');
      else if (indice === indiceElegido) boton.classList.add('opcion-incorrecta');
    });

    let prefijo;
    if (acierto) prefijo = `¡Correcto! +${bono} puntos.`;
    else if (indiceElegido === null) prefijo = 'Se acabó el tiempo. Un servidor quedó fuera de línea.';
    else prefijo = 'Respuesta incorrecta. Un servidor quedó fuera de línea.';

    elementoExplicacion.textContent = `${prefijo} ${datos.explicacion}`;
    elementoExplicacion.hidden = false;

    botonContinuar.hidden = false;
    botonContinuar.onclick = () => {
      // La capa de la pregunta se cierra antes de mostrar lo siguiente
      document.getElementById('pantalla-pregunta').classList.remove('activa');
      callback(bono);
    };
  }

  // La pregunta NO reemplaza al tablero: se muestra como capa encima de él
  // (que sigue visible y oscurecido), sin cambiar el tamaño de la página.
  // Se reinicia la animación de entrada de la tarjeta.
  const pantallaPregunta = document.getElementById('pantalla-pregunta');
  const panelPregunta = document.getElementById('panel-pregunta');
  panelPregunta.style.animation = 'none';
  pantallaPregunta.classList.add('activa');
  pantallaPregunta.scrollTop = 0;
  void panelPregunta.offsetWidth; // fuerza el reflujo para reiniciar la animación
  panelPregunta.style.animation = '';
}

/* ------------------------------------------------------------------
   4B. CLASIFICACIÓN GLOBAL CON SUPABASE
   La clave publicable identifica al cliente web y es segura para usarse
   en el navegador. Los permisos reales se limitan con las políticas RLS
   definidas en SUPABASE_SETUP.sql; nunca se usa una clave secreta aquí.
   ------------------------------------------------------------------ */
const SUPABASE_URL = 'https://msxptdklbdxeaheqcbmc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_g6XPAfwi05KqohaBm0uL3g_umR1yBIc';
const TABLA_PUNTUACIONES = 'puntuaciones';
const CLAVE_GAMERTAG_RECORDADO = 'eliminaMalware.gamertag';
const MAXIMO_REGISTROS_GLOBALES = 10;

let partidaGlobalGuardada = false;
let idPartidaVictoria = null;
let puntuacionVictoriaPendiente = 0;

function normalizarGamertag(valor) {
  return String(valor || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
}

function crearIdPartida() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caracter) => {
    const aleatorio = Math.floor(Math.random() * 16);
    const valor = caracter === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8;
    return valor.toString(16);
  });
}

function formatearFechaGlobal(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).format(valor);
}

function mostrarMensajeGamertag(texto, tipo = '') {
  const mensaje = document.getElementById('mensaje-gamertag');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje-gamertag${tipo ? ` ${tipo}` : ''}`;
}

function mostrarEstadoTabla(texto) {
  const cuerpo = document.getElementById('tabla-registros-cuerpo');
  if (!cuerpo) return;
  cuerpo.replaceChildren();
  const fila = document.createElement('tr');
  const celda = document.createElement('td');
  celda.colSpan = 4;
  celda.className = 'tabla-vacia';
  celda.textContent = texto;
  fila.appendChild(celda);
  cuerpo.appendChild(fila);
}

function dibujarTablaGlobal(registros) {
  const cuerpo = document.getElementById('tabla-registros-cuerpo');
  if (!cuerpo) return;
  cuerpo.replaceChildren();

  if (!registros.length) {
    mostrarEstadoTabla('Aún no hay puntuaciones');
    return;
  }

  registros.forEach((registro, indice) => {
    const fila = document.createElement('tr');
    if (registro.partida_id === idPartidaVictoria) fila.classList.add('registro-actual');
    [indice + 1, registro.gamertag, registro.puntuacion, formatearFechaGlobal(registro.creado_en)]
      .forEach((valor) => {
        const celda = document.createElement('td');
        celda.textContent = valor;
        fila.appendChild(celda);
      });
    cuerpo.appendChild(fila);
  });
}

async function cargarTablaGlobal() {
  mostrarEstadoTabla('Cargando clasificación…');
  const columnas = 'gamertag,puntuacion,creado_en,partida_id';
  const consulta = `select=${columnas}&order=puntuacion.desc,creado_en.asc&limit=${MAXIMO_REGISTROS_GLOBALES}`;

  try {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/${TABLA_PUNTUACIONES}?${consulta}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    });
    if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status}`);
    const registros = await respuesta.json();
    dibujarTablaGlobal(Array.isArray(registros) ? registros : []);
  } catch (error) {
    console.warn('No se pudo cargar la clasificación global:', error);
    mostrarEstadoTabla('Clasificación temporalmente no disponible');
  }
}

// Lee el gamertag guardado en este dispositivo ('' si no hay uno válido o si
// el navegador bloquea localStorage)
function leerGamertagGuardado() {
  try {
    const guardado = normalizarGamertag(localStorage.getItem(CLAVE_GAMERTAG_RECORDADO));
    return guardado.length >= 2 ? guardado : '';
  } catch (error) {
    return '';
  }
}

let guardandoPuntuacionGlobal = false;

// Prepara la pantalla de victoria. Hay dos modos:
// - Primera vez en este dispositivo (no hay gamertag guardado): se muestra
//   el formulario para escribirlo y guardarlo.
// - Dispositivo con gamertag guardado: el formulario NO se muestra, no se
//   puede cambiar el nombre, y la puntuación se envía automáticamente con
//   ese gamertag (solo reemplaza su récord si lo supera).
function prepararClasificacionVictoria() {
  const formulario = document.getElementById('formulario-gamertag');
  const campo = document.getElementById('campo-gamertag');
  const boton = document.getElementById('btn-guardar-gamertag');
  if (!formulario || !campo || !boton) return;

  partidaGlobalGuardada = false;
  guardandoPuntuacionGlobal = false;
  idPartidaVictoria = crearIdPartida();
  puntuacionVictoriaPendiente = estado.puntuacion;
  formulario.reset();
  formulario.classList.remove('gamertag-fijo', 'reintentar');
  delete formulario.dataset.gamertagFijo;

  campo.disabled = false;
  boton.disabled = false;
  boton.textContent = 'Guardar puntuación';
  cargarTablaGlobal();

  const gamertagGuardado = leerGamertagGuardado();
  if (gamertagGuardado) {
    campo.value = gamertagGuardado;
    formulario.dataset.gamertagFijo = gamertagGuardado;
    formulario.classList.add('gamertag-fijo');
    enviarPuntuacionGlobal(gamertagGuardado, true);
    return;
  }

  mostrarMensajeGamertag('El gamertag se guardará en este dispositivo y no podrá cambiarse después.');
  setTimeout(() => campo.focus({ preventScroll: true }), 500);
}

// Envía la puntuación de esta partida a Supabase con el gamertag indicado.
// "automatico" es true cuando el nombre viene del dispositivo (no hay campo
// que editar); en ese caso, si falla el envío, se ofrece solo "Reintentar".
async function enviarPuntuacionGlobal(gamertag, automatico) {
  if (partidaGlobalGuardada || guardandoPuntuacionGlobal) return;
  guardandoPuntuacionGlobal = true;

  const formulario = document.getElementById('formulario-gamertag');
  const campo = document.getElementById('campo-gamertag');
  const boton = document.getElementById('btn-guardar-gamertag');

  formulario.classList.remove('reintentar');
  boton.disabled = true;
  boton.textContent = 'Guardando…';
  mostrarMensajeGamertag(automatico ? `Guardando tu puntuación como "${gamertag}"…` : 'Enviando puntuación…');

  try {
    // Se llama a la función guardar_puntuacion() (ver SUPABASE_SETUP.sql)
    // en vez de insertar directamente: esa función conserva solo el mejor
    // puntaje de cada gamertag (sin distinguir mayúsculas), así que jugar de
    // nuevo con el mismo nombre nunca crea filas duplicadas y reemplaza el
    // registro anterior únicamente si esta partida lo supera.
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/guardar_puntuacion`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_gamertag: gamertag,
        p_puntuacion: puntuacionVictoriaPendiente,
        p_partida_id: idPartidaVictoria,
      }),
    });
    if (!respuesta.ok) throw new Error(`Supabase respondió ${respuesta.status}`);

    const [resultado] = await respuesta.json();
    const guardado = !!resultado?.guardado;
    const mejorPuntaje = resultado?.mejor_puntaje ?? puntuacionVictoriaPendiente;

    if (guardado) {
      // Solo se recuerda el gamertag cuando el servidor lo aceptó con esta
      // puntuación (primer registro o nuevo récord)
      try {
        localStorage.setItem(CLAVE_GAMERTAG_RECORDADO, gamertag);
      } catch (error) {
        // Recordar el nombre es opcional: el registro global ya se guardó.
      }
      partidaGlobalGuardada = true;
      campo.disabled = true;
      boton.textContent = 'Puntuación guardada';
      mostrarMensajeGamertag(
        automatico
          ? `Nuevo récord de ${puntuacionVictoriaPendiente} puntos guardado para "${gamertag}".`
          : 'Puntuación guardada: ya aparece en la clasificación global.',
        'exito'
      );
    } else if (automatico) {
      // El récord anterior se conserva; no hay nada más que hacer
      partidaGlobalGuardada = true;
      mostrarMensajeGamertag(
        `Tu récord con "${gamertag}" es de ${mejorPuntaje} puntos. Esta partida (${puntuacionVictoriaPendiente}) no lo superó, así que se conserva el anterior.`,
        'info'
      );
    } else {
      // Primera vez en este dispositivo y ese nombre ya tiene un récord
      // igual o mayor (por ejemplo, de otro jugador): no se guarda ni se
      // recuerda, y se deja escribir otro gamertag.
      boton.disabled = false;
      boton.textContent = 'Guardar puntuación';
      mostrarMensajeGamertag(
        `Con "${gamertag}" ya hay ${mejorPuntaje} puntos guardados, así que esta puntuación no lo reemplazó. Prueba con otro gamertag.`,
        'info'
      );
    }
    await cargarTablaGlobal();
  } catch (error) {
    console.warn('No se pudo guardar la puntuación global:', error);
    boton.disabled = false;
    boton.textContent = automatico ? 'Reintentar' : 'Guardar puntuación';
    if (automatico) formulario.classList.add('reintentar');
    mostrarMensajeGamertag('No se pudo guardar. Inténtalo nuevamente.', 'error');
  } finally {
    guardandoPuntuacionGlobal = false;
  }
}

// Envío del formulario: con gamertag fijo usa siempre el del dispositivo
// (ignora cualquier valor del campo); si no, valida el que escribió el jugador.
function guardarPuntuacionGlobal(evento) {
  evento.preventDefault();
  if (partidaGlobalGuardada) return;

  const formulario = document.getElementById('formulario-gamertag');
  const campo = document.getElementById('campo-gamertag');

  const fijo = formulario.dataset.gamertagFijo;
  if (fijo) {
    enviarPuntuacionGlobal(fijo, true);
    return;
  }

  const gamertag = normalizarGamertag(campo.value);
  campo.value = gamertag;
  if (gamertag.length < 2) {
    mostrarMensajeGamertag('Escribe un gamertag de al menos 2 caracteres.', 'error');
    campo.focus();
    return;
  }
  enviarPuntuacionGlobal(gamertag, false);
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
   5B. PANEL DE ESTADO DE RED (servidores inferiores)
   Íconos sencillos de cada servidor y colores de cada estado. Todos los
   íconos usan el mismo grosor de línea (2px) y se dibujan centrados en
   (0, 0) dentro de un cuadrado de lado 2*r.
   ------------------------------------------------------------------ */

// Estilo visual de cada estado posible de un servidor
const ESTILO_ESTADO_SERVIDOR = {
  linea: { color: PALETA.verde, colorTexto: PALETA.verdeTexto, etiqueta: 'EN LÍNEA', relleno: PALETA.superficie },
  ataque: { color: PALETA.naranja, colorTexto: PALETA.naranjaTexto, etiqueta: 'BAJO ATAQUE', relleno: 0x3a2408 },
  caido: { color: PALETA.peligro, colorTexto: PALETA.peligroTexto, etiqueta: 'FUERA DE LÍNEA', relleno: 0x1a0d10 },
};

// Media elipse inferior (usada para dar volumen al ícono de base de datos)
function trazarMediaElipseInferior(g, cx, cy, rx, ry) {
  g.beginPath();
  for (let i = 0; i <= 16; i++) {
    const angulo = (Math.PI * i) / 16;
    const px = cx + Math.cos(angulo) * rx;
    const py = cy + Math.sin(angulo) * ry;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
}

// Servidor web: globo terráqueo (meridiano + ecuador)
function dibujarIconoServidorWeb(g, color, r) {
  g.lineStyle(2, color, 1);
  g.strokeCircle(0, 0, r);
  g.strokeEllipse(0, 0, r, r * 2);
  g.lineBetween(-r, 0, r, 0);
}

// Base de datos: cilindro con dos anillos
function dibujarIconoBaseDatos(g, color, r) {
  const rx = r * 0.85;
  const ry = r * 0.3;
  g.lineStyle(2, color, 1);
  g.strokeEllipse(0, -r + ry, rx * 2, ry * 2);
  g.lineBetween(-rx, -r + ry, -rx, r - ry);
  g.lineBetween(rx, -r + ry, rx, r - ry);
  trazarMediaElipseInferior(g, 0, 0, rx, ry);
  trazarMediaElipseInferior(g, 0, r - ry, rx, ry);
}

// Servidor de respaldo: caja de archivo (tapa + cuerpo + asa)
function dibujarIconoRespaldo(g, color, r) {
  g.lineStyle(2, color, 1);
  g.strokeRoundedRect(-r, -r * 0.85, r * 2, r * 0.55, 2);
  g.strokeRoundedRect(-r * 0.82, -r * 0.3, r * 1.64, r * 1.15, 2);
  g.lineBetween(-r * 0.3, r * 0.12, r * 0.3, r * 0.12);
}

function dibujarIconoServidor(g, id, color, r) {
  if (id === 'web') dibujarIconoServidorWeb(g, color, r);
  else if (id === 'bd') dibujarIconoBaseDatos(g, color, r);
  else dibujarIconoRespaldo(g, color, r);
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
    // un tamaño adaptado a la orientación real en vista móvil
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
    // (Phaser 3.70, la versión cargada por CDN, no soporta una propiedad
    // "resolution" nativa en su configuración -verificado directamente en
    // su código fuente-, así que este es el método correcto y estándar
    // para lograr un canvas nítido en pantallas de alta densidad.)
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
    this.crearControlMira();

    // En vista móvil, reacciona a cambios de tamaño/orientación (rotar el
    // teléfono, etc.) reajustando el tablero en vivo en vez de recargarlo.
    if (this.esVistaMovilActual) {
      this.registrarListenerRedimension();
      programarAjusteCanvasMovil(0);
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

    // Intro de nivel ("NIVEL X"): bloquea clics y escáner hasta terminar
    this.introNivelActiva = false;
    this.introObjetos = null;
    this.introTimerEspera = null;

    this.actualizarHUD();
    this.actualizarBotonEscaner();
    this.iniciarNivelActual();

    registrarSincronizacionEntradaCanvas(this.game.canvas);

    if (!this.esVistaMovilActual) {
      registrarObservadorCanvasEscritorio(
        document.getElementById('contenedor-phaser')
      );
    }
  }

  // Cada jugador tiene su propia mira; ambos comparten las reglas de ataque.
  // Jugador 1: mouse, flechas, teclas A/B/X/Y o un teléfono.
  // Jugador 2 (solo en modo 2 jugadores): I/J/K/L, teclas 7/8/9/0 o un teléfono.
  crearControlMira() {
    this.jugadores = JUGADORES.map((config) => {
      const texto = this.add.text(0, 0, config.etiqueta, {
        fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold', color: config.colorTexto,
      }).setOrigin(0.5);
      const grafico = this.add.graphics();
      this.mundo.add(grafico);
      this.mundo.add(texto);
      return {
        ...config, grafico, texto,
        mira: { x: 0, y: 0 },
        ejes: { x: 0, y: 0, recibido: 0 },
        ultimoAtaque: -Infinity,
        feedback: '', feedbackHasta: 0,
      };
    });
    this.centrarMiras();
    this.jugadorAtacante = 0;
    this.flechasControl = this.input.keyboard.createCursorKeys();
    // Sin captura, para no bloquear esas letras al escribir el gamertag.
    this.teclasJugador2 = this.input.keyboard.addKeys('I,J,K,L', false);
    this.input.on('pointermove', (pointer) => {
      if (pointer.event?.pointerType === 'mouse') this.apuntarA(pointer.x / this.factorResolucion, pointer.y / this.factorResolucion);
    });
    this.input.on('pointerdown', (pointer) => this.apuntarA(pointer.x / this.factorResolucion, pointer.y / this.factorResolucion));
  }

  // Con dos jugadores, cada mira empieza en una mitad del tablero.
  centrarMiras() {
    const y = (this.areaJuego.yMin + this.areaJuego.yMax) / 2;
    this.jugadores.forEach((jugador, i) => {
      jugador.ejes = { x: 0, y: 0, recibido: 0 };
      jugador.mira.x = estado.multijugador ? this.anchoLogico * (i === 0 ? 0.35 : 0.65) : this.anchoLogico / 2;
      jugador.mira.y = y;
    });
  }

  jugadorActivo(indice) {
    return indice === 0 || (indice === 1 && estado.multijugador);
  }

  apuntarA(x, y, indice = 0) {
    if (!estado.juegoActivo || this.introNivelActiva || !this.jugadorActivo(indice)) return;
    const area = this.areaJuego;
    const mira = this.jugadores[indice].mira;
    mira.x = Phaser.Math.Clamp(x, area.xMin, area.xMax);
    mira.y = Phaser.Math.Clamp(y, area.yMin, area.yMax);
  }

  moverControl(x, y, indice = 0) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !this.jugadores?.[indice]) return;
    const longitud = Math.max(1, Math.hypot(x, y));
    this.jugadores[indice].ejes = { x: x / longitud, y: y / longitud, recibido: Date.now() };
  }

  actualizarControlMira(delta = 16) {
    const jugando = estado.juegoActivo && !this.introNivelActiva && document.getElementById('pantalla-juego').classList.contains('activa');
    const teclado = [
      [this.flechasControl.right, this.flechasControl.left, this.flechasControl.down, this.flechasControl.up],
      [this.teclasJugador2.L, this.teclasJugador2.J, this.teclasJugador2.K, this.teclasJugador2.I],
    ];
    this.jugadores.forEach((jugador, i) => {
      const visible = jugando && this.jugadorActivo(i);
      jugador.grafico.setVisible(visible);
      jugador.texto.setVisible(visible && estado.multijugador);
      if (!visible) return;
      // Caduca el movimiento si se pierde la conexión o el paquete de soltar.
      const remoto = Date.now() - jugador.ejes.recibido < 400;
      const [der, izq, abajo, arriba] = teclado[i];
      const x = (remoto ? jugador.ejes.x : 0) + Number(der.isDown) - Number(izq.isDown);
      const y = (remoto ? jugador.ejes.y : 0) + Number(abajo.isDown) - Number(arriba.isDown);
      const longitud = Math.max(1, Math.hypot(x, y));
      const paso = 650 * Math.min(delta, 50) / 1000;
      const mira = jugador.mira;
      this.apuntarA(mira.x + x / longitud * paso, mira.y + y / longitud * paso, i);
      const color = this.objetivoControl(i) ? PALETA.verde : jugador.color;
      const g = jugador.grafico;
      g.clear(); g.lineStyle(2, color, 1); g.strokeCircle(mira.x, mira.y, 18);
      g.lineBetween(mira.x - 27, mira.y, mira.x - 10, mira.y);
      g.lineBetween(mira.x + 10, mira.y, mira.x + 27, mira.y);
      g.lineBetween(mira.x, mira.y - 27, mira.x, mira.y - 10);
      g.lineBetween(mira.x, mira.y + 10, mira.x, mira.y + 27);
      jugador.texto.setPosition(mira.x + 26, mira.y + 26);
      this.mundo.bringToTop(g);
      this.mundo.bringToTop(jugador.texto);
    });
  }

  objetivoControl(indice = 0) {
    const mira = this.jugadores[indice].mira;
    const candidatos = estado.virusActivos.filter((e) => !e.procesado).map((e) => ({
      elemento: e, contenedor: e.contenedor, radio: 56 * Math.abs(e.contenedor.scaleX),
    }));
    if (this.jefe && !this.jefe.destruido) {
      candidatos.push({ jefe: this.jefe, contenedor: this.jefe.contenedor, radio: 90 });
      this.jefe.trampas.filter((t) => !t.procesado).forEach((t) =>
        candidatos.push({ trampa: t, contenedor: t.contenedor, radio: 48 * Math.abs(t.contenedor.scaleX) }));
    }
    return candidatos.map((c) => ({ ...c, distancia: Math.hypot(c.contenedor.x - mira.x, c.contenedor.y - mira.y) }))
      .filter((c) => c.distancia <= c.radio).sort((a, b) => a.distancia - b.distancia)[0];
  }

  avisarControl(texto) {
    const jugador = this.jugadores[this.jugadorAtacante];
    jugador.feedback = texto;
    jugador.feedbackHasta = Date.now() + 2200;
    this.mostrarTextoFlotante(jugador.mira.x, jugador.mira.y - 36, texto, PALETA.texto);
  }

  // Suma los puntos al total del equipo y al jugador que los consiguió.
  sumarPuntos(puntos, indice = this.jugadorAtacante) {
    estado.puntuacion += puntos;
    estado.puntosJugadores[indice] += puntos;
  }

  atacarControl(letra, indice = 0) {
    if (!BOTONES_ATAQUE[letra] || !estado.juegoActivo || this.introNivelActiva || !this.jugadorActivo(indice) ||
      !document.getElementById('pantalla-juego').classList.contains('activa')) return;
    const jugador = this.jugadores[indice];
    if (Date.now() - jugador.ultimoAtaque < 110) return;
    jugador.ultimoAtaque = Date.now();
    this.jugadorAtacante = indice;
    const objetivo = this.objetivoControl(indice);
    if (!objetivo) { this.avisarControl('APUNTA AL OBJETIVO'); return; }
    if (objetivo.trampa) { this.resolverTrampaJefe(objetivo.trampa, true); return; }
    if (objetivo.jefe) { this.pulsarCombinacionJefe(letra); return; }
    const e = objetivo.elemento;
    if (e.tipo !== 'seguro' && e.letra !== letra) {
      this.avisarControl('USA LA LETRA ' + e.letra); return;
    }
    if (e.tipo === 'reparacion') this.repararServidor(e);
    else if (e.tipo === 'duplicador') this.dividirDuplicador(e);
    else this.eliminarVirus(e, true);
  }

  actualizarCombinacionJefe() {
    if (!this.jefe?.textoCombinacion) return;
    this.jefe.textoCombinacion.setText(this.jefe.secuencia.map((letra, i) =>
      i < this.jefe.progresoCombinacion ? '✓' : letra).join(' → '));
  }

  pulsarCombinacionJefe(letra) {
    const jefe = this.jefe;
    if (!jefe || jefe.destruido || jefe.protegido || jefe.contenedor.alpha < 1) return;
    if (letra !== jefe.secuencia[jefe.progresoCombinacion]) {
      jefe.progresoCombinacion = 0; this.actualizarCombinacionJefe();
      this.avisarControl('COMBINACIÓN INCORRECTA: REINICIA'); return;
    }
    // Conserva el prefijo hasta que se abra el punto débil; la última
    // letra se pulsa con el punto visible para completar el golpe.
    if (jefe.progresoCombinacion === jefe.secuencia.length - 1 && jefe.puntoDebil && !jefe.puntoDebil.circulo.visible) {
      this.avisarControl('ESPERA EL PUNTO DÉBIL'); return;
    }
    jefe.progresoCombinacion += 1;
    if (jefe.progresoCombinacion === jefe.secuencia.length) {
      // En cooperativo la combinación es compartida: J1 puede pulsar A y J2 B.
      // El último golpe decide a quién se le anota la recompensa del jefe.
      jefe.progresoCombinacion = 0; this.ultimoGolpeadorJefe = this.jugadorAtacante; this.golpearJefe();
    }
    this.actualizarCombinacionJefe();
  }

  // Factor de lentitud aplicado por el escáner (2s) a elementos y, si
  // corresponde, al jefe. 1 = velocidad normal.
  get factorEscaner() {
    return this.escanerActivo ? 0.35 : 1;
  }

  // Cada elemento activo dibuja un anillo que se reduce con el tiempo
  // restante, se mueve si es móvil (rebotando en los bordes del área de
  // juego) y mantiene su línea de objetivo apuntando al servidor elegido.
  update(tiempo, delta) {
    this.actualizarControlMira(delta);
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
          elemento.servidorObjetivoX, this.servidorLineaY
        );
      }

      if (!elemento.temporizador || !elemento.anilloTiempo) return;
      const restante = 1 - elemento.temporizador.getProgress();
      const color = colorElemento(elemento);

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
    const horizontalMovil = this.esVistaMovilActual && ancho > alto;
    return {
      xMin: margenLateral,
      xMax: ancho - margenLateral,
      yMin: horizontalMovil ? 195 : 211,
      yMax: horizontalMovil ? alto - 150 : alto - 240,
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
      programarAjusteCanvasMovil(0);
      return; // el cambio es insignificante, no vale la pena reconstruir
    }

    const factor = Math.min(window.devicePixelRatio || 1, 2);
    dimensionesLogicasActuales = nuevasDimensiones;
    if (this.sys.game) {
      // El tamaño físico del canvas es el lógico multiplicado por el
      // mismo factor que usa "mundo" (this.mundo.setScale), para que las
      // coordenadas sigan siendo nítidas tras el reajuste.
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
    (this.servidores || []).forEach((s) => {
      this.detenerAnimacionesServidor(s);
      s.destruido = true;
    });

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
    programarAjusteCanvasMovil(0);
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

    // La leyenda de colores ya no vive aquí: ahora es una franja compacta
    // en la parte inferior, debajo de los servidores (ver crearLeyendaInferior)
  }

  /* ---------------- LEYENDA DE COLORES (franja inferior) ---------------- */

  // Entradas de la leyenda. "desdeNivel" indica a partir de qué nivel
  // (índice 0 = nivel 1) se muestra: la reparación existe desde el nivel 1
  // y el duplicador se agrega a partir del nivel 2.
  obtenerEntradasLeyenda(todas) {
    const entradas = [
      { colores: [PALETA.peligro, PALETA.naranja, PALETA.morado], etiqueta: 'Eliminar', desdeNivel: 0 },
      { colores: [PALETA.azul], etiqueta: 'Ignorar', desdeNivel: 0 },
      { colores: [PALETA.verde], etiqueta: 'Reparación', desdeNivel: 0 },
      { colores: [PALETA.magenta], etiqueta: 'Duplicador', desdeNivel: 1 },
    ];
    return todas ? entradas : entradas.filter((e) => estado.indiceNivel >= e.desdeNivel);
  }

  // Crea (dentro de "contenedor") los puntos de color y textos de la
  // leyenda, repartidos en filas centradas que nunca superan "anchoMaximo".
  // Devuelve cuántas filas ocupó, para reservar el alto de la franja.
  dibujarContenidoLeyenda(contenedor, entradas, anchoMaximo, tamano) {
    const radioPunto = 5;
    const separacionPuntos = 9;
    const separacionEntradas = 22;
    const altoFila = tamano + 8;

    // 1) Crea cada entrada en un subcontenedor y mide su ancho
    const piezas = entradas.map((entrada) => {
      const pieza = this.add.container(0, 0);
      entrada.colores.forEach((color, i) => {
        const punto = this.add.circle(radioPunto + i * separacionPuntos, 0, radioPunto, color, 1)
          .setStrokeStyle(1.5, PALETA.fondo, 1);
        pieza.add(punto);
      });
      const inicioTexto = radioPunto * 2 + (entrada.colores.length - 1) * separacionPuntos + 7;
      const texto = this.crearTexto(inicioTexto, 0, entrada.etiqueta, {
        tamano, color: PALETA.texto, origenX: 0, origenY: 0.5, contenedor: pieza,
      });
      contenedor.add(pieza);
      return { pieza, ancho: inicioTexto + texto.width };
    });

    // 2) Reparte las entradas en filas (se pasa a la siguiente fila solo
    //    si la actual ya no tiene espacio)
    const filas = [];
    piezas.forEach((p) => {
      const fila = filas[filas.length - 1];
      if (fila && fila.ancho + separacionEntradas + p.ancho <= anchoMaximo) {
        fila.piezas.push(p);
        fila.ancho += separacionEntradas + p.ancho;
      } else {
        filas.push({ piezas: [p], ancho: p.ancho });
      }
    });

    // 3) Centra cada fila horizontalmente y el bloque completo en vertical
    filas.forEach((fila, indiceFila) => {
      let x = -fila.ancho / 2;
      const y = (indiceFila - (filas.length - 1) / 2) * altoFila;
      fila.piezas.forEach((p) => {
        p.pieza.setPosition(x, y);
        x += p.ancho + separacionEntradas;
      });
    });
    return filas.length;
  }

  // Calcula cuántas filas necesita la leyenda en su versión más larga
  // (todas las entradas), para que la franja no cambie de alto al avanzar
  // de nivel.
  medirFilasLeyenda(anchoMaximo, tamano) {
    const temporal = this.add.container(0, 0);
    const filas = this.dibujarContenidoLeyenda(temporal, this.obtenerEntradasLeyenda(true), anchoMaximo, tamano);
    temporal.destroy();
    return filas;
  }

  // Franja de la leyenda: fondo discreto + contenido (rehecho en
  // actualizarLeyendaExtra según el nivel actual)
  crearLeyendaInferior(disposicion) {
    const { anchoUtil, leyendaY, altoLeyenda } = disposicion;
    const fondo = this.add.graphics();
    fondo.fillStyle(PALETA.superficie, 0.75);
    fondo.fillRoundedRect(32, leyendaY - altoLeyenda / 2, anchoUtil, altoLeyenda, 6);
    fondo.lineStyle(1, PALETA.borde, 1);
    fondo.strokeRoundedRect(32, leyendaY - altoLeyenda / 2, anchoUtil, altoLeyenda, 6);
    this.capaTablero.add(fondo);

    this.contenedorLeyenda = this.add.container(32 + anchoUtil / 2, leyendaY);
    this.capaTablero.add(this.contenedorLeyenda);
    this.configLeyenda = { anchoMaximo: anchoUtil - 24, tamano: disposicion.tamanoLeyenda };
  }

  // Rehace el contenido de la leyenda según las mecánicas disponibles en
  // el nivel actual (se llama al iniciar cada nivel y al reconstruir el
  // tablero)
  actualizarLeyendaExtra() {
    if (!this.contenedorLeyenda) return;
    this.contenedorLeyenda.removeAll(true);
    this.dibujarContenidoLeyenda(
      this.contenedorLeyenda,
      this.obtenerEntradasLeyenda(false),
      this.configLeyenda.anchoMaximo,
      this.configLeyenda.tamano
    );
  }

  /* ---------------- PANEL DE ESTADO DE RED (servidores = sistema de vidas) ---------------- */

  // Calcula la distribución de la zona inferior (encabezado, tarjetas de
  // servidores y franja de la leyenda) de abajo hacia arriba. Nunca invade
  // el área donde aparecen las amenazas: su límite es el borde inferior del
  // área de juego más el anillo de tiempo de una amenaza (56px). El área de
  // juego en sí no cambia.
  calcularDisposicionInferior(ancho, alto) {
    const horizontalMovil = this.esVistaMovilActual && ancho > alto;
    const area = this.calcularAreaJuego(ancho, alto);
    const limiteSuperior = area.yMax + 56 + 4;

    const anchoUtil = ancho - 64;
    const gap = 16;
    const anchoCaja = (anchoUtil - gap * 2) / 3;
    // Tarjetas angostas (teléfono en vertical): ícono arriba y texto debajo
    const vertical = anchoCaja < 200;
    const altoCaja = horizontalMovil ? 50 : vertical ? 96 : 96;

    // La franja de la leyenda reserva el alto de su versión más larga, para
    // no cambiar de tamaño al pasar de nivel
    const tamanoLeyenda = horizontalMovil ? 14 : 15;
    const filasLeyenda = this.medirFilasLeyenda(anchoUtil - 24, tamanoLeyenda);
    const altoLeyenda = filasLeyenda * (tamanoLeyenda + 8) + (horizontalMovil ? 2 : 10);

    const margenInferior = horizontalMovil ? 6 : 14;
    const separacion = horizontalMovil ? 6 : 14;
    const leyendaY = alto - margenInferior - altoLeyenda / 2;
    const cajaY = alto - margenInferior - altoLeyenda - separacion - altoCaja / 2;
    const bordeSuperiorCajas = cajaY - altoCaja / 2;

    // El encabezado "ESTADO DE RED" solo aparece si cabe sin tocar el área
    // de juego (en móvil horizontal no hay espacio y se omite)
    const encabezadoY = bordeSuperiorCajas - 14;
    const mostrarEncabezado = encabezadoY - 8 >= limiteSuperior;

    return {
      horizontalMovil, anchoUtil, gap, anchoCaja, vertical, altoCaja, cajaY, bordeSuperiorCajas,
      leyendaY, altoLeyenda, tamanoLeyenda, encabezadoY, mostrarEncabezado,
    };
  }

  crearServidoresInferior(ancho, alto) {
    const d = this.calcularDisposicionInferior(ancho, alto);
    this.servidorY = d.cajaY;
    // Las líneas de las amenazas apuntan al borde superior de la tarjeta
    this.servidorLineaY = d.bordeSuperiorCajas;

    const definiciones = [
      { id: 'web', nombre: 'SERVIDOR WEB', nombreCorto: 'SERVIDOR WEB' },
      { id: 'bd', nombre: 'BASE DE DATOS', nombreCorto: 'BASE DE DATOS' },
      { id: 'respaldo', nombre: 'SERVIDOR DE RESPALDO', nombreCorto: 'RESPALDO' },
    ];
    this.servidores = definiciones.map((def, indice) => {
      const x = 32 + d.anchoCaja / 2 + indice * (d.anchoCaja + d.gap);
      return this.crearTarjetaServidor(def, x, d);
    });

    this.textoResumenRed = null;
    if (d.mostrarEncabezado) this.crearEncabezadoRed(ancho, d.encabezadoY);
    this.crearLeyendaInferior(d);
    this.actualizarLeyendaExtra();
  }

  // Encabezado del panel: "ESTADO DE RED" a la izquierda, línea divisoria
  // y el resumen "3/3 EN LÍNEA" a la derecha
  crearEncabezadoRed(ancho, y) {
    const capa = this.capaTablero;
    const titulo = this.crearTexto(32, y, 'ESTADO DE RED', {
      tamano: 13, mono: true, negrita: true, color: PALETA.textoSecundario, origenX: 0, origenY: 0.5, contenedor: capa,
    });
    this.anchoTituloRed = titulo.width;
    this.lineaEncabezadoRed = this.add.graphics();
    capa.add(this.lineaEncabezadoRed);
    this.textoResumenRed = this.crearTexto(ancho - 32, y, '', {
      tamano: 13, mono: true, color: PALETA.verdeTexto, origenX: 1, origenY: 0.5, contenedor: capa,
    });
    this.actualizarResumenRed();
  }

  actualizarResumenRed() {
    if (!this.textoResumenRed || !this.servidores) return;
    const enLinea = this.servidores.filter((s) => s.activo).length;
    const total = this.servidores.length;
    this.textoResumenRed.setText(`${enLinea}/${total} EN LÍNEA`);
    let color = PALETA.verdeTexto;
    if (enLinea < total) color = enLinea > 1 ? PALETA.naranjaTexto : PALETA.peligroTexto;
    this.textoResumenRed.setColor(color);

    const g = this.lineaEncabezadoRed;
    const y = this.textoResumenRed.y;
    g.clear();
    g.lineStyle(1, PALETA.borde, 1);
    g.lineBetween(32 + this.anchoTituloRed + 14, y, this.textoResumenRed.x - this.textoResumenRed.width - 14, y);
  }

  // Crea la tarjeta de un servidor: fondo, ícono, nombre, estado (punto +
  // texto) y barra de integridad. Todo vive en un contenedor propio para
  // poder sacudirlo o escalarlo como una sola pieza.
  crearTarjetaServidor(def, x, d) {
    const W = d.anchoCaja;
    const H = d.altoCaja;
    const contenedor = this.add.container(x, d.cajaY);
    this.capaTablero.add(contenedor);

    const fondo = this.add.graphics();
    const icono = this.add.graphics();
    const barra = this.add.graphics();
    const punto = this.add.circle(0, 0, 4, PALETA.verde, 1);
    contenedor.add([fondo, icono, barra, punto]);

    const servidor = {
      id: def.id, nombre: def.nombre, x, contenedor, fondo, icono, barra, punto,
      ancho: W, alto: H, vertical: d.vertical,
      activo: true, parpadeando: false, destruido: false,
      estadoVisual: 'linea', destelloAtaque: false, integridad: 1,
      animaciones: [], pulsos: [], porcentajeTexto: null,
    };

    let tamanoNombre;
    let tamanoEstado;
    let nombreX;
    let nombreY;
    let anchoNombreMax;

    if (d.vertical) {
      // Tarjeta angosta: ícono arriba, nombre, estado y barra centrados
      const pad = 8;
      servidor.pad = pad;
      servidor.iconoLado = 28;
      icono.setPosition(0, -H / 2 + pad + 14);
      tamanoNombre = 13;
      tamanoEstado = 12;
      nombreX = 0;
      nombreY = -H / 2 + pad + 28 + 13;
      anchoNombreMax = W - pad * 2;
      servidor.alineacionEstado = 'centro';
      servidor.filaEstado = { x: 0, y: nombreY + 19 };
      servidor.barraGeo = { x: -W / 2 + pad, y: H / 2 - pad - 3, ancho: W - pad * 2 };
    } else {
      // Tarjeta ancha: ícono a la izquierda y columna de texto a la derecha
      const compacta = H < 70;
      const pad = compacta ? 8 : 12;
      servidor.pad = pad;
      const lado = Math.min(H - pad * 2, 44);
      servidor.iconoLado = lado;
      icono.setPosition(-W / 2 + pad + 3 + lado / 2, 0);
      const colX = -W / 2 + pad + 3 + lado + 12;
      const colFin = W / 2 - pad;
      nombreX = colX;
      tamanoNombre = compacta ? 15 : 15;
      tamanoEstado = compacta ? 13 : 14;
      const tamanoPorcentaje = compacta ? 13 : 13;
      const anchoPorcentaje = compacta ? 46 : 50;

      if (compacta) {
        // Dos filas: nombre + estado (a la derecha) / barra + porcentaje
        nombreY = -H / 2 + pad + 9;
        anchoNombreMax = colFin - colX - 125;
        servidor.alineacionEstado = 'derecha';
        servidor.filaEstado = { x: colFin, y: nombreY };
        const barraY = H / 2 - pad - 5;
        servidor.barraGeo = { x: colX, y: barraY, ancho: colFin - colX - anchoPorcentaje };
      } else {
        // Tres filas: nombre / estado / "INTEGRIDAD" + barra + porcentaje
        nombreY = -28;
        anchoNombreMax = colFin - colX;
        servidor.alineacionEstado = 'izquierda';
        servidor.filaEstado = { x: colX, y: -3 };
        const barraY = 29;
        const etiqueta = this.crearTexto(colX, barraY, 'INTEGRIDAD', {
          tamano: 13, mono: true, color: PALETA.textoSecundario, origenX: 0, origenY: 0.5, contenedor: contenedor,
        });
        let inicioBarra = colX + etiqueta.width + 10;
        // En tarjetas angostas la etiqueta dejaría la barra casi sin ancho:
        // se omite y la barra ocupa toda la fila
        if (colFin - inicioBarra - anchoPorcentaje < 70) {
          etiqueta.destroy();
          inicioBarra = colX;
        }
        servidor.barraGeo = { x: inicioBarra, y: barraY, ancho: colFin - inicioBarra - anchoPorcentaje };
      }
      servidor.porcentajeTexto = this.crearTexto(colFin, servidor.barraGeo.y, '100%', {
        tamano: tamanoPorcentaje, mono: true, color: PALETA.textoSecundario, origenX: 1, origenY: 0.5, contenedor: contenedor,
      });
    }

    servidor.nombreTexto = this.crearTexto(nombreX, nombreY, def.nombre, {
      tamano: tamanoNombre, mono: true, negrita: true, color: PALETA.texto,
      origenX: d.vertical ? 0.5 : 0, origenY: 0.5, alinear: d.vertical ? 'center' : 'left', contenedor: contenedor,
    });
    // Si el nombre completo no cabe, se usa el corto; si aun así no cabe,
    // se reduce un poco para que nunca se salga de la tarjeta
    if (servidor.nombreTexto.width > anchoNombreMax) servidor.nombreTexto.setText(def.nombreCorto);
    if (servidor.nombreTexto.width > anchoNombreMax) servidor.nombreTexto.setScale(anchoNombreMax / servidor.nombreTexto.width);

    servidor.estadoTexto = this.crearTexto(0, servidor.filaEstado.y, '', {
      tamano: tamanoEstado, mono: true, color: PALETA.verdeTexto, origenX: 0, origenY: 0.5, contenedor: contenedor,
    });

    this.dibujarTarjetaServidor(servidor);
    return servidor;
  }

  // Redibuja la tarjeta completa según servidor.estadoVisual
  // ('linea' | 'ataque' | 'caido') y servidor.integridad (0 a 1)
  dibujarTarjetaServidor(servidor) {
    if (servidor.destruido) return;
    const estilo = ESTILO_ESTADO_SERVIDOR[servidor.estadoVisual];
    const W = servidor.ancho;
    const H = servidor.alto;

    // Fondo y borde (durante un ataque el fondo alterna para parpadear)
    const fondo = servidor.fondo;
    const relleno = servidor.estadoVisual === 'ataque' && !servidor.destelloAtaque ? PALETA.superficie : estilo.relleno;
    fondo.clear();
    fondo.fillStyle(relleno, 0.95);
    fondo.fillRoundedRect(-W / 2, -H / 2, W, H, 8);
    fondo.lineStyle(servidor.estadoVisual === 'ataque' ? 2 : 1.5, estilo.color, servidor.estadoVisual === 'linea' ? 0.55 : 0.9);
    fondo.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    // Franja de acento con el color del estado (arriba en tarjetas
    // angostas, a la izquierda en las anchas)
    fondo.fillStyle(estilo.color, 1);
    if (servidor.vertical) fondo.fillRoundedRect(-16, -H / 2 + 4, 32, 3, 1.5);
    else fondo.fillRoundedRect(-W / 2 + Math.max(4, servidor.pad - 5), -H / 2 + 10, 3, H - 20, 1.5);

    // Ícono dentro de un cuadro teñido con el color del estado
    const icono = servidor.icono;
    const lado = servidor.iconoLado;
    icono.clear();
    icono.fillStyle(estilo.color, 0.1);
    icono.fillRoundedRect(-lado / 2, -lado / 2, lado, lado, 6);
    icono.lineStyle(1, estilo.color, 0.35);
    icono.strokeRoundedRect(-lado / 2, -lado / 2, lado, lado, 6);
    dibujarIconoServidor(icono, servidor.id, estilo.color, lado * 0.28);
    icono.setAlpha(servidor.estadoVisual === 'caido' ? 0.75 : 1);

    servidor.nombreTexto.setColor(servidor.estadoVisual === 'caido' ? PALETA.textoSecundario : PALETA.texto);

    // Estado: punto de color + texto, alineado según el tipo de tarjeta
    servidor.estadoTexto.setText(estilo.etiqueta);
    servidor.estadoTexto.setColor(estilo.colorTexto);
    servidor.punto.setFillStyle(estilo.color, 1);
    const fila = servidor.filaEstado;
    const anchoTexto = servidor.estadoTexto.width;
    let inicio = fila.x;
    if (servidor.alineacionEstado === 'derecha') inicio = fila.x - anchoTexto - 13;
    else if (servidor.alineacionEstado === 'centro') inicio = -(anchoTexto + 13) / 2;
    servidor.punto.setPosition(inicio + 4, fila.y);
    servidor.estadoTexto.setPosition(inicio + 13, fila.y);

    this.dibujarBarraIntegridad(servidor);
  }

  // Barra de integridad (solo visual: llena si está en línea, se vacía
  // durante un ataque y vuelve a llenarse al reparar el servidor)
  dibujarBarraIntegridad(servidor) {
    if (servidor.destruido) return;
    const estilo = ESTILO_ESTADO_SERVIDOR[servidor.estadoVisual];
    const { x, y, ancho } = servidor.barraGeo;
    const valor = Phaser.Math.Clamp(servidor.integridad, 0, 1);
    const barra = servidor.barra;
    barra.clear();
    barra.fillStyle(PALETA.borde, 1);
    barra.fillRoundedRect(x, y - 2.5, ancho, 5, 2.5);
    if (valor > 0.01) {
      barra.fillStyle(estilo.color, 1);
      barra.fillRoundedRect(x, y - 2.5, Math.max(5, ancho * valor), 5, 2.5);
    }
    if (servidor.porcentajeTexto) {
      servidor.porcentajeTexto.setText(`${Math.round(valor * 100)}%`);
      servidor.porcentajeTexto.setColor(servidor.estadoVisual === 'linea' ? PALETA.textoSecundario : estilo.colorTexto);
    }
  }

  // Dibuja el estado final del servidor según servidor.activo
  dibujarEstadoServidor(servidor) {
    servidor.estadoVisual = servidor.activo ? 'linea' : 'caido';
    servidor.integridad = servidor.activo ? 1 : 0;
    this.dibujarTarjetaServidor(servidor);
    this.actualizarResumenRed();
  }

  /* ---- Animaciones breves de las tarjetas (ataque, caída, reparación) ---- */

  // Detiene cualquier animación en curso de una tarjeta, para que dos
  // animaciones nunca peleen por el mismo objeto (por ejemplo, una
  // reparación que llega a mitad de un ataque) y deja la tarjeta en su
  // posición y escala originales.
  detenerAnimacionesServidor(servidor) {
    (servidor.animaciones || []).forEach((tween) => tween.stop());
    servidor.animaciones = [];
    (servidor.pulsos || []).forEach((pulso) => pulso.destroy());
    servidor.pulsos = [];
    if (!servidor.destruido) {
      servidor.contenedor.setPosition(servidor.x, this.servidorY);
      servidor.contenedor.setScale(1);
    }
  }

  // Contorno que se expande y se desvanece alrededor de la tarjeta
  crearPulsoTarjeta(servidor, color) {
    if (this.movimientoReducido) return;
    const W = servidor.ancho;
    const H = servidor.alto;
    const pulso = this.add.graphics();
    pulso.lineStyle(2, color, 1);
    pulso.strokeRoundedRect(-W / 2, -H / 2, W, H, 8);
    servidor.contenedor.add(pulso);
    servidor.pulsos.push(pulso);
    servidor.animaciones.push(this.tweens.add({
      targets: pulso,
      scaleX: 1 + 12 / W,
      scaleY: 1 + 12 / H,
      alpha: { from: 0.9, to: 0 },
      duration: 420,
      ease: 'Quad.Out',
      onComplete: () => {
        pulso.destroy();
        servidor.pulsos = servidor.pulsos.filter((p) => p !== pulso);
      },
    }));
  }

  // Ataque: la barra de integridad se vacía y la tarjeta tiembla un poco
  animarAtaqueServidor(servidor, duracion) {
    this.detenerAnimacionesServidor(servidor);
    if (this.movimientoReducido) {
      servidor.integridad = 0;
      this.dibujarBarraIntegridad(servidor);
      return;
    }
    servidor.animaciones.push(this.tweens.add({
      targets: servidor,
      integridad: 0,
      duration: duracion,
      ease: 'Quad.In',
      onUpdate: () => this.dibujarBarraIntegridad(servidor),
    }));
    // Sacudida horizontal de ±3px que se amortigua
    servidor.animaciones.push(this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 380,
      onUpdate: (tween) => {
        if (servidor.destruido) return;
        const t = tween.getValue();
        servidor.contenedor.x = servidor.x + Math.sin(t * Math.PI * 6) * 3 * (1 - t);
      },
      onComplete: () => {
        if (!servidor.destruido) servidor.contenedor.x = servidor.x;
      },
    }));
  }

  // Fuera de línea: un contorno rojo se expande y se apaga
  animarCaidaServidor(servidor) {
    this.crearPulsoTarjeta(servidor, PALETA.peligro);
  }

  // Reparación: la barra vuelve a llenarse, contorno verde y un leve "pop"
  animarReparacionServidor(servidor) {
    this.detenerAnimacionesServidor(servidor);
    if (this.movimientoReducido) return;
    servidor.integridad = 0;
    this.dibujarBarraIntegridad(servidor);
    servidor.animaciones.push(this.tweens.add({
      targets: servidor,
      integridad: 1,
      duration: 650,
      ease: 'Cubic.Out',
      onUpdate: () => this.dibujarBarraIntegridad(servidor),
    }));
    servidor.animaciones.push(this.tweens.add({
      targets: servidor.contenedor,
      scale: 1.03,
      duration: 140,
      yoyo: true,
      ease: 'Quad.Out',
    }));
    this.crearPulsoTarjeta(servidor, PALETA.verde);
  }

  // Parpadeo naranja ("bajo ataque") antes de asentarse en su estado final.
  // Si el tablero se reconstruye a mitad del parpadeo (reajustarTablero, al
  // rotar el teléfono o cambiar de tamaño), el servidor viejo queda
  // marcado "destruido" y el parpadeo se detiene sin tocar objetos ya
  // eliminados.
  parpadearServidorAtaque(servidor, callback) {
    servidor.parpadeando = true;
    const ciclos = this.movimientoReducido ? 1 : 3;
    const intervalo = this.movimientoReducido ? 30 : 110;
    this.animarAtaqueServidor(servidor, (ciclos * 2 - 1) * intervalo);
    let paso = 0;
    const alternar = () => {
      if (servidor.destruido) return;
      // Si una reparación recuperó este servidor a mitad del parpadeo, la
      // reparación ya dibujó su estado final: no se sobrescribe.
      if (servidor.activo) {
        servidor.parpadeando = false;
        return;
      }
      servidor.estadoVisual = 'ataque';
      servidor.destelloAtaque = paso % 2 === 0;
      this.dibujarTarjetaServidor(servidor);
      paso += 1;
      if (paso < ciclos * 2) {
        this.time.delayedCall(intervalo, alternar);
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
    this.actualizarResumenRed();
    this.parpadearServidorAtaque(objetivo, () => {
      this.dibujarEstadoServidor(objetivo);
      this.animarCaidaServidor(objetivo);
    });
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
    this.centrarMiras();
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

    // Muestra la pantalla "NIVEL X" (ver mostrarIntroNivel) y solo cuando
    // termina arranca el generador de elementos: las amenazas y sus
    // temporizadores no empiezan hasta que la animación de entrada acaba.
    this.introNivelActiva = true;
    this.mostrarIntroNivel(() => {
      this.introNivelActiva = false;
      this.iniciarGeneracionElementos();
    });
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
  // más uno mientras la sobrecarga de red está activa y uno más en 2 jugadores.
  maxElementosActual() {
    return NIVELES[estado.indiceNivel].maxElementos + (this.limiteElementosExtra || 0) +
      (estado.multijugador ? ELEMENTOS_EXTRA_2J : 0);
  }

  intentarGenerarElemento() {
    if (!estado.juegoActivo || estado.jefeActivo || this.introNivelActiva) return;
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

    // Cancela la animación "NIVEL X" si quedó a mitad de camino (por
    // ejemplo, al reiniciar la partida o cambiar de nivel muy rápido)
    this.cancelarIntroNivel();

    estado.virusActivos.forEach((elemento) => {
      if (elemento.temporizador) elemento.temporizador.remove();
      if (elemento.lineaObjetivo) elemento.lineaObjetivo.destroy();
      if (elemento.escudoGrafico) elemento.escudoGrafico.destroy();
      elemento.contenedor.destroy();
    });
    estado.virusActivos = [];
  }

  /* ---------------- INTRO DE NIVEL ("NIVEL X") ---------------- */

  // Pantalla oscura semitransparente con el nombre del nivel y una frase
  // breve, dentro del propio canvas (funciona igual en escritorio y en
  // móvil, en cualquier orientación, porque usa las dimensiones lógicas
  // actuales). Fade de entrada, pausa breve y fade de salida, ~1.5s en
  // total (mucho menos con movimiento reducido). El generador de
  // elementos no arranca hasta que el callback se ejecuta al terminar.
  mostrarIntroNivel(callback) {
    const nivel = NIVELES[estado.indiceNivel];
    const reducido = this.movimientoReducido;
    const duracionFade = reducido ? 60 : 350;
    const espera = reducido ? 80 : 800;

    const overlay = this.add.rectangle(
      this.anchoLogico / 2, this.altoLogico / 2, this.anchoLogico, this.altoLogico, 0x000000, 0.72
    ).setAlpha(0);
    this.mundo.add(overlay);
    const titulo = this.crearTexto(this.anchoLogico / 2, this.altoLogico / 2 - 22, `NIVEL ${nivel.numero}`, {
      tamano: this.esVistaMovilActual ? 34 : 42, mono: true, negrita: true,
      origenX: 0.5, origenY: 0.5, alinear: 'center',
    });
    const subtitulo = this.crearTexto(this.anchoLogico / 2, this.altoLogico / 2 + 32, 'Preparando defensa…', {
      tamano: this.esVistaMovilActual ? 15 : 18, color: PALETA.textoSecundario,
      origenX: 0.5, origenY: 0.5, alinear: 'center',
    });
    titulo.setAlpha(0);
    subtitulo.setAlpha(0);
    this.mundo.bringToTop(overlay);
    this.mundo.bringToTop(titulo);
    this.mundo.bringToTop(subtitulo);

    this.introObjetos = [overlay, titulo, subtitulo];

    const terminar = () => {
      this.introObjetos = null;
      this.introTimerEspera = null;
      overlay.destroy();
      titulo.destroy();
      subtitulo.destroy();
      callback();
    };

    this.tweens.add({
      targets: this.introObjetos,
      alpha: { from: 0, to: 1 },
      duration: duracionFade,
      ease: 'Quad.Out',
      onComplete: () => {
        this.introTimerEspera = this.time.delayedCall(espera, () => {
          this.introTimerEspera = null;
          this.tweens.add({
            targets: this.introObjetos,
            alpha: 0,
            duration: duracionFade,
            ease: 'Quad.In',
            onComplete: terminar,
          });
        });
      },
    });
  }

  // Corta la animación "NIVEL X" si está en curso (sin dejar objetos ni
  // temporizadores sueltos) y desactiva el bloqueo de clics/escáner.
  cancelarIntroNivel() {
    if (this.introTimerEspera) {
      this.introTimerEspera.remove();
      this.introTimerEspera = null;
    }
    if (this.introObjetos) {
      this.tweens.killTweensOf(this.introObjetos);
      this.introObjetos.forEach((objeto) => objeto.destroy());
      this.introObjetos = null;
    }
    this.introNivelActiva = false;
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
    const letra = tipo === 'seguro' ? null : tipo === 'reparacion' ? 'A'
      : opciones.letra || Phaser.Utils.Array.GetRandom(Object.keys(BOTONES_ATAQUE));
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
    const letraTexto = this.crearTexto(0, -34, letra || 'SEGURO', {
      tamano: letra ? 24 : 10, mono: true, negrita: true, origenX: .5, origenY: .5, contenedor,
    });

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
      escudoGrafico.setStrokeStyle(3, color, 0.9);
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
      contenedor, circuloFondo, anilloTiempo, icono, tipo, temporizador: null, tweenSacudida: null,
      escudoGrafico, letra, letraTexto,
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
      this.apuntarA(contenedor.x, contenedor.y);
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
    this.detenerSacudidaResistente(elemento);

    const indice = estado.virusActivos.indexOf(elemento);
    if (indice !== -1) estado.virusActivos.splice(indice, 1);

    const rotoEnFragmentos = elemento.tipo === 'resistente' && fueEliminadoPorClic;
    const duracionSalida = this.movimientoReducido ? 1 : rotoEnFragmentos ? 160 : 220;
    const color = colorElemento(elemento);

    if (esAmenazaReal(elemento.tipo) && fueEliminadoPorClic) {
      // Amenaza real eliminada a tiempo: suma puntos (con el multiplicador
      // de combo vigente) y cuenta para el objetivo del nivel
      estado.combo += 1;
      const multiplicador = calcularMultiplicadorCombo(estado.combo);
      const puntosGanados = PUNTOS_POR_TIPO[elemento.tipo] * multiplicador;
      this.sumarPuntos(puntosGanados);
      estado.virusEliminados += 1;

      if (elemento.tipo === 'critica') {
        reproducirSonido('eliminar');
        this.destelloNaranja(elemento.contenedor.x, elemento.contenedor.y);
      } else if (rotoEnFragmentos) {
        reproducirSonido('eliminar');
        this.crearFragmentos(elemento.contenedor.x, elemento.contenedor.y, PALETA.morado);
      } else {
        reproducirSonido('eliminar');
        this.crearParticulas(elemento.contenedor.x, elemento.contenedor.y, color);
      }
      this.animarComboHUD();

      this.tweens.add({
        targets: elemento.contenedor,
        scale: rotoEnFragmentos ? 1.12 : 1.5,
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
      this.animarReparacionServidor(servidorCaido);
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

    // Se comprime y se expande rápido antes de desaparecer (~260 ms)
    if (this.movimientoReducido) {
      elemento.contenedor.setAlpha(0);
      this.time.delayedCall(1, () => elemento.contenedor.destroy());
    } else {
      this.tweens.chain({
        targets: elemento.contenedor,
        tweens: [
          { scaleX: 0.7, scaleY: 1.18, duration: 100, ease: 'Quad.Out' },
          { scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 160, ease: 'Back.Out' },
        ],
        onComplete: () => elemento.contenedor.destroy(),
      });
    }

    const configuracionNivel = NIVELES[estado.indiceNivel];
    const grupo = { perdidoServidor: false };
    const duracionPequenas = Math.round(configuracionNivel.tiempoVidaVirus * 0.9);
    const area = this.areaJuego;

    // Las dos amenazas pequeñas salen en direcciones opuestas (un ángulo
    // aleatorio, más lateral que vertical) desde el punto de la duplicadora,
    // con una breve estela rosa. Nacen ya con su temporizador en marcha, así
    // que la duración y las reglas no cambian.
    const anguloBase = Phaser.Math.FloatBetween(-0.55, 0.55);
    const distancia = 78;
    [0, Math.PI].forEach((giro) => {
      const angulo = anguloBase + giro;
      const nx = Phaser.Math.Clamp(x + Math.cos(angulo) * distancia, area.xMin, area.xMax);
      const ny = Phaser.Math.Clamp(y + Math.sin(angulo) * distancia, area.yMin, area.yMax);
      const reducido = this.movimientoReducido;
      const pequeno = this.crearElementoVisual('duplicado_pequeno', reducido ? nx : x, reducido ? ny : y, {
        grupo,
        escalaVisual: 0.68,
        movilForzado: false,
        duracionVida: duracionPequenas,
        servidorObjetivo: this.elegirServidorObjetivo(),
      });
      if (!reducido) this.lanzarPequenaDuplicada(pequeno, nx, ny);
    });

    this.actualizarHUD();
  }

  // Desplaza una amenaza pequeña desde el centro hasta su destino en 260 ms
  // dejando una estela corta de partículas rosas.
  lanzarPequenaDuplicada(pequeno, destinoX, destinoY) {
    const contenedor = pequeno.contenedor;
    let ultimo = 0;
    this.tweens.add({
      targets: contenedor,
      x: destinoX,
      y: destinoY,
      duration: 260,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        if (!contenedor.active) return;
        const progreso = tween.progress;
        if (progreso - ultimo < 0.17) return;
        ultimo = progreso;
        const rastro = this.add.circle(contenedor.x, contenedor.y, 5, PALETA.magenta, 0.8);
        this.mundo.add(rastro);
        this.mundo.moveBelow(rastro, contenedor);
        this.tweens.add({
          targets: rastro,
          alpha: 0,
          scale: 0.3,
          duration: 240,
          ease: 'Quad.Out',
          onComplete: () => rastro.destroy(),
        });
      },
    });
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
    this.mostrarAvisoEvento('SOBRECARGA DE RED', PALETA.naranjaTexto, { parpadeos: 2 });
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
  // los servidores ni el botón del escáner, que ahora está fuera del canvas).
  // "parpadeos" (opciones.parpadeos, por defecto 1) repite el ciclo de
  // aparecer/desaparecer esa cantidad de veces, por ejemplo para que la
  // sobrecarga de red destaque más al aparecer.
  mostrarAvisoEvento(texto, color, opciones = {}) {
    const parpadeos = Math.max(1, opciones.parpadeos || 1);

    const aviso = this.crearTexto(this.anchoLogico / 2, this.areaJuego.yMin + 16, texto, {
      tamano: this.esVistaMovilActual ? 18 : 22, mono: true, negrita: true, color,
      origenX: 0.5, origenY: 0.5, alinear: 'center', anchoMaximo: this.anchoLogico - 32,
    });
    aviso.setAlpha(0);
    this.mundo.bringToTop(aviso);

    const duracionFade = this.movimientoReducido ? 30 : 260;
    // Con más de un parpadeo se acorta la pausa de cada ciclo, para que el
    // aviso completo no dure demasiado (nada exagerado ni muy largo).
    const espera = this.movimientoReducido ? 60 : parpadeos > 1 ? 420 : 1100;
    this.tweens.add({
      targets: aviso,
      alpha: { from: 0, to: 1 },
      duration: duracionFade,
      yoyo: true,
      hold: espera,
      repeat: parpadeos - 1,
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
    this.sacudirResistente(elemento);
    this.mostrarTextoFlotante(elemento.contenedor.x, elemento.contenedor.y, 'ESCUDO ROTO', PALETA.morado);
  }

  // Temblor visual del malware resistente tras el primer golpe: solo se
  // desplazan sus partes internas (círculo, ícono y anillo), nunca el
  // contenedor, para no pelear con el movimiento de los objetivos móviles.
  // Además dibuja un destello y una grieta sobre el escudo, que se
  // desvanecen junto con él (~280 ms en total).
  sacudirResistente(elemento) {
    if (this.movimientoReducido) return;
    const partes = [elemento.circuloFondo, elemento.icono, elemento.anilloTiempo].filter(Boolean);
    const contenedor = elemento.contenedor;

    // Destello de impacto + grieta en zigzag sobre el borde del escudo
    const impacto = this.add.graphics();
    impacto.lineStyle(3, 0xffffff, 0.95);
    impacto.beginPath();
    impacto.moveTo(30, -54);
    impacto.lineTo(20, -38);
    impacto.lineTo(31, -26);
    impacto.lineTo(18, -10);
    impacto.strokePath();
    impacto.lineStyle(2, PALETA.morado, 1);
    impacto.strokeCircle(0, 0, 60);
    contenedor.add(impacto);
    this.tweens.add({
      targets: impacto,
      alpha: 0,
      scale: 1.15,
      duration: 280,
      ease: 'Quad.Out',
      onComplete: () => impacto.destroy(),
    });

    // Vaivén lateral que se amortigua (3 idas y vueltas, ±6px)
    this.detenerSacudidaResistente(elemento);
    elemento.tweenSacudida = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 280,
      onUpdate: (tween) => {
        if (!contenedor.active) return;
        const t = tween.getValue();
        const desplazamiento = Math.sin(t * Math.PI * 6) * 6 * (1 - t);
        partes.forEach((parte) => { parte.x = desplazamiento; });
      },
      onComplete: () => {
        if (contenedor.active) partes.forEach((parte) => { parte.x = 0; });
        elemento.tweenSacudida = null;
      },
    });
  }

  // Detiene el temblor en curso (por ejemplo, si el segundo clic llega a
  // mitad de la animación) y deja las partes en su sitio.
  detenerSacudidaResistente(elemento) {
    if (!elemento.tweenSacudida) return;
    elemento.tweenSacudida.stop();
    elemento.tweenSacudida = null;
    [elemento.circuloFondo, elemento.icono, elemento.anilloTiempo].forEach((parte) => {
      if (parte && parte.active) parte.x = 0;
    });
  }

  // Rotura en fragmentos pequeños (rectángulos y puntos que salen girando
  // en todas direcciones), usada al eliminar el malware resistente.
  crearFragmentos(x, y, color) {
    if (this.movimientoReducido) return;
    const cantidad = 16;
    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distancia = Phaser.Math.Between(48, 92);
      const fragmento = i % 3 === 0
        ? this.add.circle(x, y, 3, color, 1)
        : this.add.rectangle(x, y, Phaser.Math.Between(4, 7), Phaser.Math.Between(6, 11), color, 1);
      fragmento.setRotation(Math.random() * Math.PI);
      this.mundo.add(fragmento);
      this.tweens.add({
        targets: fragmento,
        x: x + Math.cos(angulo) * distancia,
        y: y + Math.sin(angulo) * distancia,
        rotation: fragmento.rotation + Phaser.Math.FloatBetween(-2.5, 2.5),
        alpha: 0,
        scale: 0.3,
        duration: 360,
        ease: 'Cubic.Out',
        onComplete: () => fragmento.destroy(),
      });
    }
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

  // Marcador HTML bajo el tablero con los puntos de cada jugador.
  actualizarMarcadorJugadores() {
    const marcador = document.getElementById('marcador-jugadores');
    marcador.hidden = !estado.multijugador;
    if (!estado.multijugador) return;
    marcador.innerHTML = `<span class="j1">J1 ${estado.puntosJugadores[0]}</span> · <span class="j2">J2 ${estado.puntosJugadores[1]}</span>`;
  }

  actualizarHUD() {
    const configuracionNivel = NIVELES[estado.indiceNivel];

    this.textoPuntuacion.setText(`${estado.puntuacion}`);
    this.actualizarMarcadorJugadores();

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
    if (!estado.juegoActivo || this.escanerCargas <= 0 || this.escanerActivo || this.introNivelActiva) return;

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

    const mostrarPantallaDerrota = () => {
      document.getElementById('texto-puntaje-derrota').textContent =
        `Puntuación final: ${estado.puntuacion} puntos${textoPuntosJugadores()}`;
      mostrarPantalla('pantalla-derrota');
    };

    if (this.movimientoReducido) {
      mostrarPantallaDerrota();
      return;
    }

    // Destello rojo breve + vibración ligera del tablero antes de mostrar
    // la pantalla de derrota (no es exagerado: dura ~280ms en total)
    const destello = this.add
      .rectangle(this.anchoLogico / 2, this.altoLogico / 2, this.anchoLogico, this.altoLogico, 0xff1f3d, 0)
      .setAlpha(0);
    this.mundo.add(destello);
    this.mundo.bringToTop(destello);
    this.cameras.main.shake(220, 0.006);

    this.tweens.add({
      targets: destello,
      alpha: { from: 0, to: 0.55 },
      duration: 140,
      yoyo: true,
      ease: 'Quad.InOut',
      onComplete: () => {
        destello.destroy();
        mostrarPantallaDerrota();
      },
    });
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
      this.mundo.bringToTop(this.overlayOscurecer);
      this.overlayOscurecer.setAlpha(ALPHA_TABLERO_PREGUNTA);
      callback();
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

    // 4) Mensaje "NIVEL COMPLETADO" visible ~700 ms (150 entrada, 400
    //    fijo, 150 salida)
    const mensaje = this.crearTexto(this.anchoLogico / 2, this.altoLogico / 2 - 30, 'NIVEL COMPLETADO', {
      tamano: this.esVistaMovilActual ? 26 : 34, mono: true, negrita: true, color: PALETA.verdeTexto,
      origenX: 0.5, origenY: 0.5, alinear: 'center', anchoMaximo: this.anchoLogico - 48,
    });
    mensaje.setAlpha(0);
    this.mundo.bringToTop(mensaje);
    this.tweens.add({
      targets: mensaje,
      alpha: { from: 0, to: 1 },
      duration: 150,
      hold: 400,
      yoyo: true,
      ease: 'Sine.Out',
      onComplete: () => {
        mensaje.destroy();

        // 5) Oscurecer el tablero con suavidad (300 ms) y dejarlo así
        //    mientras se muestra la pregunta encima; se restablece al
        //    pulsar "Continuar" (ver finalizarPorNivelCompletado)
        this.mundo.bringToTop(this.overlayOscurecer);
        this.tweens.add({
          targets: this.overlayOscurecer,
          alpha: { from: 0, to: ALPHA_TABLERO_PREGUNTA },
          duration: 300,
          ease: 'Sine.InOut',
          onComplete: () => callback(),
        });
      },
    });
  }

  finalizarPorNivelCompletado() {
    estado.juegoActivo = false;
    this.limpiarVirusActivos();

    const esUltimoNivel = estado.indiceNivel === NIVELES.length - 1;
    const puntuacionInicial = this.puntuacionInicioNivel;

    this.reproducirSecuenciaLogro(() => {
      // Pregunta de seguridad del nivel: la generación ya está detenida
      // (sin elementos activos), pero fallarla sí puede apagar un
      // servidor (ver mostrarPreguntaNivel), así que hay que revisar las
      // vidas después de responder por si eso provoca una derrota.
      mostrarPreguntaNivel(estado.indiceNivel, this, (bonoPregunta) => {
        estado.puntuacion += bonoPregunta;
        this.overlayOscurecer.setAlpha(0);

        if (estado.vidas <= 0) {
          this.finalizarPorDerrota();
          return;
        }

        if (esUltimoNivel) {
          reproducirSonido('victoria');
          document.getElementById('texto-puntaje-victoria').textContent =
            `Puntuación final: ${estado.puntuacion} puntos${textoPuntosJugadores()}`;
          prepararClasificacionVictoria();
          mostrarPantalla('pantalla-victoria');
        } else {
          const configuracionNivel = NIVELES[estado.indiceNivel];
          document.getElementById('texto-nivel-completado').textContent =
            `Superaste el nivel ${configuracionNivel.numero} con ${estado.puntuacion} puntos.${textoPuntosJugadores()}`;
          animarConteoPuntos(puntuacionInicial, estado.puntuacion);
          mostrarPantalla('pantalla-nivel-completado');
        }
      });
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

    const factorVida = estado.multijugador ? FACTOR_VIDA_JEFE_2J : 1;
    const vidaJefe = Math.round(configuracionJefe.vidaMaxima * factorVida);
    this.jefe = {
      config: configuracionJefe,
      secuencia: COMBINACIONES_JEFE[estado.indiceNivel].slice(),
      progresoCombinacion: 0,
      vida: vidaJefe,
      vidaMaxima: vidaJefe,
      // Golpes que debe perder el Ransomware para entrar en su fase 2 (la mitad de su vida)
      faseCambioVida: Math.round((configuracionJefe.faseCambioVida || 0) * factorVida),
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

    this.jefe.textoCombinacion = this.crearTexto(0, 112, '', {
      tamano: 22, mono: true, negrita: true, origenX: .5, origenY: .5, contenedor,
    });
    this.actualizarCombinacionJefe();

    if (configuracionJefe.puntoDebil) {
      this.crearPuntoDebilJefe();
    } else {
      circuloBase.setInteractive({ useHandCursor: true });
      circuloBase.on('pointerdown', () => this.apuntarA(contenedor.x, contenedor.y));
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
    g.on('pointerdown', () => this.apuntarA(this.jefe.contenedor.x, this.jefe.contenedor.y));
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
      this.jefe.vida <= this.jefe.vidaMaxima - this.jefe.faseCambioVida
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
    circuloFondo.setStrokeStyle(3, colorPorTipo('seguro'), 1);
    const icono = this.add.graphics();
    dibujarIconoSeguro(icono, colorPorTipo('seguro'));

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
    circuloFondo.on('pointerdown', () => this.apuntarA(contenedor.x, contenedor.y));
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
    this.sumarPuntos(recompensa, this.ultimoGolpeadorJefe ?? 0);
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
// ese instante: 1280x720 fijo en escritorio, o el tamaño adaptado a la
// orientación por calcularDimensionesLogicas() en móvil. El canvas físico siempre
// es más grande que el mundo lógico (ancho/alto x factor); la escena
// compensa con el contenedor "mundo" escalado para que las coordenadas del
// juego no cambien, dando nitidez sin pixelado en pantallas de alta
// densidad. (Phaser 3.70 no soporta una propiedad "resolution" nativa en
// su configuración -verificado directamente en su código fuente-, así que
// este método manual es el correcto para esta versión.)
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
      // Phaser revisa cada "resizeInterval" ms (500 por defecto) si el
      // tamaño del contenedor padre cambió, y si es así reescribe el
      // ancho/alto del canvas con su propio cálculo (pensado para
      // box-sizing:border-box). Como ajustarCanvasEscritorio() ya
      // controla ese tamaño a mano (con box-sizing:content-box, para
      // evitar el desenfoque de subpíxel), ambos terminaban peleando por
      // el tamaño del canvas cada ~500ms: Phaser lo reescribía con su
      // propio valor, eso cambiaba el tamaño de "contenedor-phaser" (que
      // se ajusta a su contenido), lo que a su vez disparaba nuestro
      // ResizeObserver para corregirlo de nuevo, en un ciclo sin fin que
      // se veía como el tablero "brincando"/deformándose cada segundo.
      // Un intervalo enorme desactiva esa revisión periódica sin tocar
      // el redimensionamiento real por eventos de resize/orientación.
      resizeInterval: 1000 * 60 * 60,
    },
    scene: [EscenaJuego],
  };
}

let juegoPhaser = null;

// Puente pequeño para el receptor del mando, sin simular clics sobre el canvas.
// "jugador" es 1 o 2.
window.controlJuego = {
  mover(x, y, jugador = 1) { juegoPhaser?.scene.keys.EscenaJuego?.moverControl(x, y, jugador - 1); },
  atacar(letra, jugador = 1) { juegoPhaser?.scene.keys.EscenaJuego?.atacarControl(letra, jugador - 1); },
  estado() {
    const escena = juegoPhaser?.scene.keys.EscenaJuego;
    const jefe = escena?.jefe;
    return {
      charges: escena?.escanerCargas ?? 0,
      multi: estado.multijugador,
      points: estado.puntosJugadores,
      feedback: (escena?.jugadores || []).map((j) => (Date.now() < j.feedbackHasta ? j.feedback : '')),
      boss: jefe && !jefe.destruido ? {
        name: jefe.config.nombre, sequence: jefe.secuencia, progress: jefe.progresoCombinacion,
      } : null,
    };
  },
};

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
  estado.puntosJugadores = [0, 0];
}

// Texto con el reparto de puntos del equipo (solo en modo 2 jugadores).
function textoPuntosJugadores() {
  if (!estado.multijugador) return '';
  return ` (J1: ${estado.puntosJugadores[0]} · J2: ${estado.puntosJugadores[1]})`;
}

// Inicia una partida nueva. "multijugador" indica el modo elegido; si no se
// indica (por ejemplo, al reintentar) se conserva el modo de la partida anterior.
function iniciarJuegoDesdeCero(multijugador) {
  if (typeof multijugador === 'boolean') estado.multijugador = multijugador;
  reiniciarEstado();
  sincronizarClaseVistaMovil();
  mostrarPantalla('pantalla-juego');

  if (!juegoPhaser) {
    // Primera vez: se crea la instancia de Phaser con el tamaño lógico
// adecuado a la pantalla y orientación actuales (escritorio o móvil)
    juegoPhaser = new Phaser.Game(construirConfiguracionPhaser());
    registrarAjusteCanvasEscritorio();
  } else {
    // Ya existía una partida: reiniciamos la escena desde el principio
    juegoPhaser.scene.stop('EscenaJuego');
    juegoPhaser.scene.start('EscenaJuego');
  }

  if (esVistaMovil()) {
    programarAjusteCanvasMovil(120);
  } else {
    ajustarCanvasEscritorio();
    // Phaser termina de crear y estilizar el canvas de forma asíncrona. Este
    // segundo ajuste ocurre cuando sus medidas definitivas ya están listas.
    programarAjusteCanvasEscritorio(120);
  }
}

// Ajusta el canvas móvil dentro de su contenedor como "contain": calcula
// ancho y alto juntos a partir de la proporción física real. Esta garantía
// en JavaScript evita que Safari reduzca solo la altura y aplaste el tablero.
function ajustarCanvasMovil() {
  if (!juegoPhaser || !esVistaMovil()) return;
  const canvas = juegoPhaser.canvas;
  const contenedor = document.getElementById('contenedor-phaser');
  if (!canvas || !contenedor || !canvas.width || !canvas.height) return;

  const bordeTotal = 2;
  const anchoMaximo = Math.max(1, contenedor.clientWidth - bordeTotal);
  const altoMaximo = Math.max(1, contenedor.clientHeight - bordeTotal);
  const proporcion = canvas.width / canvas.height;

  let anchoContenido = anchoMaximo;
  let altoContenido = Math.round(anchoContenido / proporcion);
  if (altoContenido > altoMaximo) {
    altoContenido = altoMaximo;
    anchoContenido = Math.round(altoContenido * proporcion);
  }

  canvas.style.setProperty('box-sizing', 'content-box', 'important');
  canvas.style.setProperty('width', `${anchoContenido}px`, 'important');
  canvas.style.setProperty('height', `${altoContenido}px`, 'important');
  canvas.style.setProperty('margin', '0', 'important');

  sincronizarEntradaCanvas();
}

// En escritorio (no en vista móvil, que ya maneja su propio tamaño), fija
// el ancho y el alto del canvas en CSS a números enteros de píxel exactos.
// Además de respetar el ancho máximo del contenedor, limita el tablero por
// la altura de la ventana y reserva sitio para la barra del escáner. Así se
// puede mostrar más grande en monitores amplios sin ocultar el botón ni
// introducir medidas fraccionarias que desenfoquen texto e íconos.
// Se usa "important" en el propio estilo en línea para ganarle tanto al
// !important de style.css como a cualquier estilo que Phaser reaplique.
function ajustarCanvasEscritorio() {
  if (!juegoPhaser || esVistaMovil()) return;
  const canvas = juegoPhaser.canvas;
  const contenedor = document.getElementById('contenedor-phaser');
  const barraEscaner = document.querySelector('.barra-escaner');
  if (!canvas || !contenedor || !barraEscaner) return;

  // La causa real de la medida fraccionaria (p. ej. 540.875px): el canvas
  // tiene un borde de 1px y usa box-sizing:border-box (regla global), así
  // que al fijar su tamaño TOTAL (borde incluido) el navegador comprueba
  // la proporción intrínseca 1280x720 contra el ÁREA DE CONTENIDO (total
  // menos el borde), que ya no da una razón exacta, y ajusta el alto con
  // un resto de subpíxel. La solución es calcular sobre el área de
  // contenido (ya sin el borde) y fijar el tamaño en esos mismos términos
  // (box-sizing:content-box solo aquí, por estilo en línea): así el
  // navegador nunca tiene que repartir un borde no entero para cumplir la
  // proporción. La altura disponible se calcula antes de elegir el ancho,
  // de modo que el canvas y el botón siempre caben en la ventana.
  const bordeTotal = 2; // 1px arriba/abajo y 1px izquierda/derecha
  const estilosBarra = window.getComputedStyle(barraEscaner);
  const altoBarra = barraEscaner.offsetHeight
    + (parseFloat(estilosBarra.marginTop) || 0)
    + (parseFloat(estilosBarra.marginBottom) || 0);
  const margenVertical = 20;
  const altoMaximoContenido = Math.max(
    1,
    Math.floor(window.innerHeight - altoBarra - margenVertical - bordeTotal)
  );
  const anchoMaximoContenido = contenedor.clientWidth - bordeTotal;
  const anchoLimitadoPorAltura = Math.floor(
    altoMaximoContenido * (ANCHO_JUEGO / ALTO_JUEGO)
  );
  const anchoContenido = Math.min(anchoMaximoContenido, anchoLimitadoPorAltura);
  if (anchoContenido <= 0) return;
  const altoContenido = Math.round(anchoContenido * (ALTO_JUEGO / ANCHO_JUEGO));

  const anchoPx = `${anchoContenido}px`;
  const altoPx = `${altoContenido}px`;
  if (canvas.style.width !== anchoPx || canvas.style.height !== altoPx) {
    canvas.style.setProperty('box-sizing', 'content-box', 'important');
    canvas.style.setProperty('width', anchoPx, 'important');
    canvas.style.setProperty('height', altoPx, 'important');
    sincronizarEntradaCanvas();
  }
}

// Cuando el tamaño CSS se controla manualmente, Phaser puede conservar unos
// límites centrados calculados antes del ajuste. Se guardan aquí los límites
// reales del área de contenido para que mouse y toque coincidan exactamente
// con los gráficos, descontando el borde visual de 1px.
function sincronizarEntradaCanvas() {
  if (!juegoPhaser?.canvas || !juegoPhaser.scale) return;
  const canvas = juegoPhaser.canvas;
  const rect = canvas.getBoundingClientRect();
  const estilos = window.getComputedStyle(canvas);
  const bordeIzquierdo = parseFloat(estilos.borderLeftWidth) || 0;
  const bordeSuperior = parseFloat(estilos.borderTopWidth) || 0;
  const anchoContenido = canvas.clientWidth;
  const altoContenido = canvas.clientHeight;
  if (anchoContenido <= 0 || altoContenido <= 0) return;

  juegoPhaser.scale.canvasBounds.setTo(
    rect.left + bordeIzquierdo,
    rect.top + bordeSuperior,
    anchoContenido,
    altoContenido
  );
  juegoPhaser.scale.displayScale.set(
    canvas.width / anchoContenido,
    canvas.height / altoContenido
  );
}

let temporizadorAjusteCanvas = null;
let temporizadorAjusteCanvasMovil = null;
let listenerAjusteCanvasRegistrado = false;
let observadorCanvasEscritorio = null;
let canvasEntradaSincronizado = null;

// Actualiza los límites justo antes de que Phaser procese una pulsación.
// Safari puede recolocar el canvas después de ocultar/mostrar sus barras;
// la fase de captura garantiza que el evento use la posición más reciente.
function registrarSincronizacionEntradaCanvas(canvas) {
  if (!canvas || canvasEntradaSincronizado === canvas) return;
  canvasEntradaSincronizado = canvas;
  const sincronizarAntesDelToque = () => sincronizarEntradaCanvas();
  canvas.addEventListener('pointerdown', sincronizarAntesDelToque, true);
  canvas.addEventListener('mousedown', sincronizarAntesDelToque, true);
  canvas.addEventListener('touchstart', sincronizarAntesDelToque, { capture: true, passive: true });
}

function programarAjusteCanvasMovil(retraso = 120) {
  clearTimeout(temporizadorAjusteCanvasMovil);
  temporizadorAjusteCanvasMovil = setTimeout(() => {
    temporizadorAjusteCanvasMovil = null;
    ajustarCanvasMovil();
  }, retraso);
}

function programarAjusteCanvasEscritorio(retraso = 120) {
  clearTimeout(temporizadorAjusteCanvas);
  temporizadorAjusteCanvas = setTimeout(() => {
    temporizadorAjusteCanvas = null;
    ajustarCanvasEscritorio();
  }, retraso);
}

// Phaser puede volver a escribir width/height unos instantes después de
// arrancar. El observador detecta ese único cambio tardío y recupera el
// tamaño entero calculado; al quedar estable ya no realiza más escrituras.
// Importante: observa el CONTENEDOR, no el canvas. Si observara el canvas,
// como ajustarCanvasEscritorio() escribe el tamaño del propio canvas, cada
// corrección disparaba de nuevo el observador (y a la vez el ajuste interno
// de Phaser, que reescribe el canvas con su propio cálculo fraccionario),
// generando un ciclo infinito de ambos "peleando" por el tamaño y un
// parpadeo/deformación visible cada medio segundo aproximadamente.
function registrarObservadorCanvasEscritorio(contenedor) {
  if (observadorCanvasEscritorio || !contenedor) return;
  if (!window.ResizeObserver) {
    programarAjusteCanvasEscritorio(700);
    return;
  }

  observadorCanvasEscritorio = new ResizeObserver(() => {
    if (!esVistaMovil()) programarAjusteCanvasEscritorio(0);
  });
  observadorCanvasEscritorio.observe(contenedor);
}

// Registra un único listener de resize (con debounce) que recalcula el
// tamaño entero del canvas en escritorio. Se registra una sola vez por
// carga de página, sin importar cuántas veces se reinicie la partida.
function registrarAjusteCanvasEscritorio() {
  if (listenerAjusteCanvasRegistrado) return;
  listenerAjusteCanvasRegistrado = true;
  const alCambiarVentana = () => {
    sincronizarClaseVistaMovil();
    if (esVistaMovil()) {
      programarAjusteCanvasMovil(240);
    } else {
      programarAjusteCanvasEscritorio();
    }
  };
  window.addEventListener('resize', alCambiarVentana);
  window.addEventListener('orientationchange', alCambiarVentana);
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
document.getElementById('btn-jugar').addEventListener('click', () => iniciarJuegoDesdeCero(false));
document.getElementById('btn-jugar-2').addEventListener('click', () => iniciarJuegoDesdeCero(true));
document.getElementById('btn-siguiente-nivel').addEventListener('click', continuarAlSiguienteNivel);
document.getElementById('btn-reintentar').addEventListener('click', () => iniciarJuegoDesdeCero());
document.getElementById('btn-jugar-de-nuevo').addEventListener('click', () => iniciarJuegoDesdeCero());
document.getElementById('btn-escaner').addEventListener('click', activarEscanerDesdeUI);
document.getElementById('formulario-gamertag').addEventListener('submit', guardarPuntuacionGlobal);
// Botones A/B/X/Y en pantalla (vista móvil): atacan con la mira del jugador 1.
document.querySelectorAll('.ataque-pantalla').forEach((boton) => {
  boton.addEventListener('click', () => window.controlJuego.atacar(boton.dataset.letra, 1));
});

// Atajo de teclado: tecla "S" activa el escáner mientras se está jugando
window.addEventListener('keydown', (evento) => {
  if (evento.target?.matches('input, textarea, [contenteditable="true"]')) return;
  if (evento.repeat) return;
  const letra = evento.key.toUpperCase();
  if (BOTONES_ATAQUE[letra] && document.getElementById('pantalla-juego').classList.contains('activa')) {
    evento.preventDefault();
    window.controlJuego.atacar(letra, 1);
    return;
  }
  if (TECLAS_ATAQUE_J2[evento.key] && estado.multijugador &&
    document.getElementById('pantalla-juego').classList.contains('activa')) {
    evento.preventDefault();
    window.controlJuego.atacar(TECLAS_ATAQUE_J2[evento.key], 2);
    return;
  }
  if (evento.key.toLowerCase() !== 's') return;
  if (!document.getElementById('pantalla-juego').classList.contains('activa')) return;
  activarEscanerDesdeUI();
});
