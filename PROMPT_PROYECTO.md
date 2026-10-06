# Prompt consolidado — "Elimina el Malware"

Desarrolla un videojuego web completo llamado **"Elimina el Malware"**,
relacionado con la ciberseguridad y la carrera de Ingeniería en Sistemas y
Negocios Digitales (ISND). Debe funcionar directamente en el navegador y ser
compatible con GitHub Pages, usando HTML, CSS, JavaScript y **Phaser 3**
(cargado por CDN). Supabase se usa para la clasificación global y, con
Supabase Realtime, para conectar el teléfono como mando (sección 12); no se
requieren cuentas de jugador ni otros servicios externos.

Entrega el código en archivos separados: `index.html`, `style.css`,
`game.js`, `remote-host.js` (receptor del mando en la PC), `control.html`,
`control.css` y `control.js` (el mando del teléfono), `sin-zoom.js` (evita y corrige el zoom
accidental en el teléfono, lo usan el mando y el juego) y `README.md`. Código sencillo, comentado en español, explicable
para estudiantes principiantes.

## 1. Identidad visual

Interfaz de **centro de ciberseguridad profesional**, no una plantilla
genérica de IA:

- Paleta: fondo `#07110F`, superficie `#0D1B18`, bordes `#19362F`, texto
  `#E7F5EF` / `#91A8A0`, verde `#00D99B`, azul `#38BDF8`, peligro `#FF5C70`.
- Tipografía: **Space Grotesk** para títulos, **Inter** para texto de
  interfaz, **JetBrains Mono** solo para cifras y etiquetas técnicas.
- Sin emojis ni imágenes: todos los íconos son SVG (en HTML) o dibujados
  con Phaser Graphics (en el canvas), con el mismo grosor de línea entre sí.
- El verde se reserva para el logotipo, el botón principal y elementos
  "activos"; se evita el exceso de brillos/neón.

## 2. Portada (no se debe volver a tocar una vez aprobada)

- Encabezado pequeño: logotipo tipo escudo (SVG), nombre del juego,
  etiqueta "Proyecto ISND".
- Sección principal en dos columnas:
  - Izquierda: etiqueta "Incidente 001 · Nivel crítico", título "El
    servidor está bajo ataque", texto breve, botón "Iniciar defensa" (modo normal) y
    a su lado los botones secundarios (contorno verde) "Jugar con mando",
    "2 jugadores" y "Teclado + mouse" (secciones 13, 14 y 15), indicadores (3 niveles / 3 vidas / 10 puntos por amenaza).
  - Derecha: ilustración de un servidor hecha con HTML/CSS (línea de
    escaneo animada, nodos con estado, indicador de red), sin imágenes.
- Tres tarjetas de instrucciones: Detecta / Elimina / Sobrevive.
- Bajo el pie, un bloque con el **QR del mando** (sección 12), su estado
  de conexión, el aviso/botón de **sonido** (sección 14) y el enlace al
  mando.
- Pie discreto con los nombres del equipo: **Cesar del Angel** y **Jean
  Barrera** (nunca cambiar estos nombres).
- Microanimaciones: entrada suave del contenido, aparición escalonada de
  tarjetas, botón principal con elevación/brillo/flecha al pasar el cursor
  (solo con `@media (hover: hover)`) y estado `:active`/`focus-visible`;
  todo debe respetar `prefers-reduced-motion`.

## 3. Tablero de juego

- Resolución lógica **1280×720** como mínimo; el canvas físico debe ser
  igual o mayor a su tamaño mostrado en CSS (nítido en pantallas normales
  y de alta densidad, nunca pixelado ni con `transform: scale`).
- HUD superior: puntuación (con ícono de actividad), nivel, cantidad de
  amenazas eliminadas/objetivo con barra de progreso, combo y
  multiplicador, cargas del escáner, leyenda de colores.
- Parte inferior: **tres servidores** en vez de un contador de vidas
  simple — Servidor Web, Base de Datos y Servidor de Respaldo — con
  estados verde (en línea), rojo (fuera de línea) y parpadeo naranja
  (bajo ataque). Internamente se mantiene una variable de vidas
  sincronizada para no romper la lógica de derrota.
- **Panel de estado de red** (zona inferior, ver sección 3C).
- Fondo con cuadrícula tenue y una pequeña red decorativa de nodos
  animados, sin llenar la pantalla.
- El botón "ESCÁNER" vive **fuera del canvas**, en una barra propia
  centrada inmediatamente debajo del tablero (sin posición absoluta), para
  no cubrir el servidor de respaldo ni ningún elemento del juego. Conserva
  diseño, animaciones, contador de cargas y funcionamiento con clic, toque
  y tecla **S**.

## 3C. Panel de estado de red (zona inferior del tablero)

- Encabezado "ESTADO DE RED" con línea divisoria y resumen "3/3 EN LÍNEA"
  (verde con todos, naranja con 2, rojo con 1). Solo se dibuja si cabe sin
  invadir el área de amenazas (en móvil horizontal se omite).
- Cada servidor es una tarjeta con ícono propio dibujado con Graphics
  (globo = Web, cilindro = Base de Datos, caja de archivo = Respaldo, todos
  con trazo de 2px), nombre, estado (punto + texto: EN LÍNEA / BAJO ATAQUE
  / FUERA DE LÍNEA) y una barra de **integridad** puramente visual (100% en
  línea, 0% fuera de línea). Tres disposiciones automáticas: ancha de tres
  filas (PC), ancha compacta de dos filas (móvil horizontal) y angosta con
  ícono arriba (móvil vertical); si el nombre no cabe se usa uno corto.
- Animaciones breves (desactivadas o casi instantáneas con
  `prefers-reduced-motion`): **ataque** = parpadeo naranja, barra que se
  vacía y sacudida amortiguada de ±3px; **fuera de línea** = contorno rojo
  que se expande y se apaga; **reparación** = barra que se rellena, contorno
  verde y un leve "pop" de escala (1.03). `detenerAnimacionesServidor()`
  evita que dos animaciones peleen (p. ej. reparar a mitad de un ataque) y
  se llama antes de reconstruir el tablero.
- La **leyenda de colores** salió del HUD superior y ahora es una franja
  compacta bajo las tarjetas (puntos de color + "Eliminar / Ignorar /
  Reparación / Duplicador"; el duplicador aparece desde el nivel 2). Se
  reparte en filas centradas si no cabe y reserva el alto de su versión
  más larga para no cambiar de tamaño entre niveles.
- `calcularDisposicionInferior()` coloca todo de abajo hacia arriba sin
  pasar nunca del borde inferior del área de juego + 56px (anillo de una
  amenaza). `calcularAreaJuego()` no cambió: mismas reglas, dificultad y
  área jugable. Las líneas de objetivo de las amenazas apuntan al borde
  superior de la tarjeta (`servidorLineaY`).

## 3B. Vista móvil responsive (≤768px, cualquier orientación)

En escritorio el tablero sigue siendo el mundo lógico fijo 1280×720 con
`Phaser.Scale.FIT` (sin cambios). En móvil, Phaser calcula un **mundo
lógico acorde con la orientación** y el espacio real disponible, en vez de
forzar el mismo tablero en cualquier pantalla:

- Detección de "vista móvil": la dimensión más chica del viewport
  (ancho o alto) es ≤768px **y** el dispositivo no tiene puntero fino
  (`(hover: none), (pointer: coarse)`), para no confundir una laptop de
  pantalla corta (p. ej. 1366×768) con un teléfono. Se reevalúa en cada
  `resize`/`orientationchange`, así que un teléfono sigue siendo "móvil"
  al rotarlo.
- En vertical se usa alto lógico fijo (1280) y ancho calculado a partir de
  la proporción real del área del canvas (acotado entre 480 y 900). En
  horizontal se usa ancho lógico fijo (1280) y alto calculado, con un
  mínimo de 540 para que el HUD, los jefes y los servidores tengan espacio.
  La proporción se obtiene del contenedor del canvas, ya descontando la
  barra HTML del escáner, para llenar el espacio sin estirar el dibujo.
- HUD, fondo, red decorativa y servidores viven en una capa
  reconstruible que se destruye y rearma en vivo al rotar o cambiar el
  tamaño de ventana, conservando puntuación, servidores caídos y
  elementos activos (reubicados con `Phaser.Math.Clamp()` dentro de la
  nueva área de juego).
- CSS: `#pantalla-juego.activa` usa `height: 100dvh` +
  `env(safe-area-inset-*)`; el canvas usa `width`/`height`/`max-*` al
  100% del contenedor sin deformarse (misma proporción lógica que la
  pantalla real); el botón "ESCÁNER" permanece debajo del canvas.
- Nada de esto cambia el escritorio: mismo mundo 1280×720, mismo modo
  `FIT`, mismas coordenadas.

## 4. Elementos y mecánicas normales de cada nivel

- Generación procedural, con **varios elementos simultáneos** en pantalla
  (máximo 2 en nivel 1, 3 en nivel 2, 5 en nivel 3), distribuidos sin tapar
  el HUD ni los servidores.
- **Objetivos móviles**: una fracción de los elementos se mueve lentamente
  y rebota dentro del área de juego (≈15% nivel 1, ≈50% nivel 2, ≈75%
  nivel 3).
- **Cuatro modos de juego** (`estado.modoMando` y `estado.modoDuo`, ver
  secciones 14 y 15):
  - **Modo normal (el original):** un clic/toque directo sobre el elemento
    lo ataca. Sin mira ni letras.
  - **Modo con mando:** el jugador mueve una **mira** y pulsa la letra
    **A, B, X o Y** que aparece encima del enemigo (como en un mando de
    consola); el clic/toque solo apunta. La letra de cada amenaza se elige
    al azar y se dibuja con el color de su botón (A verde, B rojo, X azul,
    Y amarillo) dentro de una pastilla; la letra incorrecta no la elimina y
    avisa "USA LA LETRA X".
  - **Modo teclado + mouse:** dos jugadores en la misma PC; unos enemigos
    llevan una tecla (los elimina el teclado) y el resto se elimina con clic
    (sección 15).
  - En todos los modos el **color de cada elemento es el de su tipo**, como en
    el juego original.
- Cuatro tipos, cada uno con ícono, color y comportamiento propios:
  - **Malware normal** (rojo): 1 ataque, 10 puntos.
  - **Malware crítico** (naranja, ícono de rayo): 1 ataque, 20 puntos,
    desaparece más rápido (75% del tiempo de vida normal).
  - **Malware resistente** (morado, ícono de "bug" con escudo exterior):
    2 ataques — el primero rompe el escudo (sin puntos ni penalización), el
    segundo lo elimina (15 puntos).
  - **Archivo seguro / falso positivo** (azul, escudo con marca, sin
    letra): no debe atacarse. Si se pulsa cualquier letra apuntándolo, se
    pierde un servidor y aparece "Falso positivo". Si expira solo, no pasa
    nada.
- Cada amenaza real traza una línea tenue hacia el servidor al que
  "ataca".
- Tiempo de vida de una amenaza normal: modo normal **4.0 s / 3.1 s /
  2.7 s** (`tiempoVidaVirus`, el original); modo con mando **7 s / 6 s /
  5.2 s** (`tiempoVidaVirusMando`, para dar tiempo a mover la mira con el
  joystick; `vidaVirusNivel()` elige el valor); la crítica dura el 75% de ese valor. Aparición de
  elementos nuevos cada 1.8 s (nivel 1) / 1.1 s (nivel 2) / 0.8 s (nivel 3).
- Probabilidades configuradas: nivel 1 (seguros 15%, críticos 8%, resistentes
  0%, duplicadores 0%); nivel 2 (seguros 25%, críticos 15%, resistentes 13%,
  duplicadores 14%); nivel 3 (seguros 30%, críticos 18%, resistentes 17%,
  duplicadores 20%). Primero se decide si aparece un archivo seguro; los
  porcentajes de crítico, resistente y duplicador se aplican después entre
  los elementos peligrosos, por lo que no se suman directamente al porcentaje
  de seguros.
- Al perder una amenaza real o tocar un falso positivo, se desactiva **un
  servidor activo al azar** (nunca uno ya caído) con un parpadeo naranja
  antes de quedar rojo. Si los tres quedan fuera de línea → derrota.
- **Sistema de combo**: cada amenaza real eliminada consecutivamente sube
  el combo; multiplicador x1 (0–2 aciertos), x2 (3–5), x3 (6+, máximo). Se
  reinicia si escapa una amenaza real o se toca un falso positivo. No se
  aplica a los puntos de los jefes. Se muestra en el HUD con una animación
  breve y sonido propio.
- **Escáner**: botón "ESCÁNER" (también con la tecla **S**), 2 usos por
  nivel, se restauran al iniciar cada nivel. Durante 2 segundos ralentiza
  el movimiento **y** los temporizadores de expiración de los elementos
  activos (y el del jefe si se está desplazando), y muestra una etiqueta
  "AMENAZA" o "SEGURO" sobre cada uno. No elimina nada ni da puntos.
- Al alcanzar el objetivo de amenazas reales del nivel: se detiene la
  generación, se retiran los elementos restantes sin penalizar, y comienza
  el combate contra el jefe.

## 4B. Mecánicas adicionales (reparación, duplicador, sobrecarga)

Usan el mismo círculo, íconos vectoriales y reglas de clic/toque que el
resto de elementos; ninguna sustituye ni modifica el escáner, el combo,
los servidores ni los jefes.

- **Reparación de servidor** (nivel 1, 2 y 3): elemento verde con ícono de
  cruz y etiqueta permanente "REPARACIÓN". Solo puede aparecer si al
  menos un servidor está fuera de línea, **como máximo una vez por
  nivel**, y se activa con la letra **A**. Recupera un servidor caído; no
  entrega puntos ni cuenta como amenaza eliminada. Si desaparece sin
  clic, no hay penalización.
- **Malware duplicador** (nivel 2 y 3, magenta, ícono de división; el
  escáner lo revela como "DUPLICADOR"): al hacer clic, en vez de
  eliminarse se **divide en dos amenazas pequeñas** (5 puntos cada una,
  con la misma duración de vida). Si una o ambas escapan sin ser
  eliminadas, se pierde **un solo servidor** por esa pareja, nunca dos.
  Probabilidad de aparición: 14% en nivel 2, 20% en nivel 3 (0% en nivel
  1).
- **Sobrecarga de red** (nivel 2 y 3): aviso "SOBRECARGA DE RED" que
  **parpadea dos veces** (aparece/desaparece dos ciclos cortos) en la
  parte superior del área de juego (sin cubrir el HUD, los servidores ni
  el escáner). Acelera la aparición de elementos y permite **un
  elemento simultáneo más** de lo normal durante 5 s; al terminar,
  restaura exactamente la velocidad y el máximo originales, sin dejar
  temporizadores duplicados. Se activa **una vez** en el nivel 2 (≈50% de
  progreso) y **dos veces** en el nivel 3 (≈40% y ≈75% de progreso).
  Nunca se activa durante el combate contra el jefe, y cualquier
  sobrecarga en curso se cancela automáticamente si el jefe aparece antes
  de que termine.
- El nivel 3 requiere **25 amenazas reales** (en vez de 20) para
  acompañar estas mecánicas adicionales; el juego debe seguir siendo
  completable en los tres niveles.
- La leyenda del HUD se extiende con una segunda línea compacta
  ("Verde: reparación" desde el nivel 1, sumando "Magenta: duplicador"
  desde el nivel 2) sin saturar la interfaz.

## 5. Jefes de nivel

Al llegar al objetivo del nivel no se muestra "Nivel superado" de
inmediato: se detiene la generación normal, se muestra una alerta animada
("Amenaza principal detectada"), se oscurece ligeramente el tablero y
aparece el jefe (entrada con escala 0.7→1 y una onda alrededor). El nivel
solo se completa al derrotarlo.

Cada golpe al jefe se da con una **combinación de letras en orden**,
pulsadas por separado con la mira sobre el jefe (solo en el modo con mando;
en el modo normal se hace clic). El largo depende del jefe —Troyano 2
letras, Botnet 3, Ransomware 4 (`LARGO_COMBINACION_JEFE`)— pero **las letras
se sortean**: al aparecer el jefe y de nuevo después de cada golpe
(`generarCombinacionJefe()`; con `COMBINACION_NUEVA_POR_GOLPE = false` se
sortearía solo una vez por jefe), así que no se puede memorizar. Antes eran
fijas (A → B, X → Y → A, B → X → A → Y). Nunca hay dos letras iguales
seguidas, la nueva combinación no repite la anterior ni empieza con la última
letra pulsada. Una letra incorrecta reinicia el progreso de la **misma**
combinación (no la cambia). El progreso se ve en la PC y en el mando, y al
cambiar de combinación el texto de la PC y las letras del mando dan un
pequeño latido para que se note (sin él, con el jefe sacudiéndose, se
seguiría pulsando la anterior); ambos latidos respetan `prefers-reduced-motion`.
En 2 jugadores la combinación sigue siendo compartida.

- **Nivel 1 — Troyano** (naranja, hexágono con flecha de infiltración): 3
  golpes, casi fijo en el centro (se desplaza un poco tras cada golpe),
  ciclo de ataque de 10 s, 50 puntos.
- **Nivel 2 — Botnet** (azul/morado, núcleo con nodos orbitando): 5
  golpes, cambia de posición tras cada golpe, genera hasta 1 falso
  positivo a la vez, ciclo de ataque de 10 s, 100 puntos.
- **Nivel 3 — Ransomware** (rojo/magenta, candado): 8 golpes, se desplaza
  lentamente, solo recibe daño si la última letra de la combinación se
  pulsa con el punto débil visible (si está cerrado se conserva el
  progreso), genera hasta 2 falsos positivos, entra en una fase más
  rápida y agresiva al perder 4 puntos de vida, ciclo de ataque de 12 s,
  200 puntos; al derrotarlo se muestra la victoria final.

Cada jefe tiene nombre y barra de vida visibles, anillo de tiempo
restante, 500 ms de protección tras cada golpe (sin reiniciar su vida),
partículas y vibración al recibir daño, y se rompe en partículas + onda
verde al ser derrotado. Si el jugador no llega a tiempo en un ciclo de
ataque, pierde un servidor pero el jefe conserva todo el daño recibido. Si
las vidas llegan a cero durante el combate, se detiene todo y aparece la
derrota. Tras derrotar al jefe se reproduce la animación existente de
"Nivel superado" y se habilita continuar.

## 5B. Pregunta de seguridad (tras derrotar a cada jefe)

Después de la secuencia de "jefe derrotado" (oscurecimiento del tablero)
y **antes** de la tarjeta "Nivel superado"/"Victoria final" (antes del
botón "Continuar"), aparece una pantalla HTML propia —mismo lenguaje
visual que el resto de tarjetas de resultado— con una pregunta de
opción múltiple sobre ciberseguridad, distinta por nivel y relacionada
con sus mecánicas: **nivel 1 → malware**, **nivel 2 → protección de
cuentas**, **nivel 3 → copias de seguridad**. Cada pregunta tiene 4
opciones y una sola respuesta correcta. `PREGUNTAS_NIVEL` en `game.js` es un
banco de **5 preguntas por nivel**; al completar el nivel
`elegirPreguntaAleatoria()` elige una al azar y mezcla el orden de las 4
opciones (Fisher-Yates), devolviendo el nuevo índice de la correcta. Tiempo y
puntos no cambian.

- Al aparecer, arranca un contador visible de **10 segundos** (número +
  barra que se vacía) con `mostrarPreguntaNivel()`. La generación de
  amenazas ya está completamente detenida en este punto (sin elementos
  activos, ver `finalizarPorNivelCompletado()`).
- Acertar da un bono de **5 puntos por cada segundo restante en el
  momento del clic/toque** (máximo 50, con 10s completos).
- Fallar o agotar el tiempo da **0 puntos extra** y además apaga **un
  servidor al azar** (igual que un falso positivo, mismo
  `desactivarServidorAleatorio()`; nunca dos por una sola pregunta). Si
  ese servidor era el último en línea, provoca una derrota normal (se
  revisa `estado.vidas` justo después de responder, antes de mostrar
  "Nivel superado"/"Victoria").
- Tras responder (o agotar el tiempo), se deshabilitan las opciones, se
  resalta en verde la correcta y —si aplica— en rojo la elegida, y se
  muestra una explicación breve (mencionando el servidor apagado si
  aplica) antes de habilitar "Continuar". El bono/penalización se aplica
  una sola vez por pregunta (bandera `respondida` interna: clics
  repetidos tras responder no hacen nada).
- Las opciones son botones reales (`<button>`), así que funcionan igual
  con clic y con toque en móvil, sin lógica táctil aparte.
- Nota de implementación: el atributo nativo `hidden` en el botón
  "Continuar" y en el texto de explicación necesita las reglas CSS
  `#btn-continuar-pregunta[hidden]` / `#texto-explicacion-pregunta[hidden]`
  porque `.boton-primario { display: inline-flex }` (regla de autor) le
  gana en cascada al `[hidden] { display: none }` nativo (de origen
  "user agent"). No quitar esas reglas ni el atributo `hidden` al tocar
  esta pantalla.

## 6. Pantallas y transiciones

- **Intro de nivel** ("NIVEL X"): al comenzar cada nivel (incluido el
  nivel 1), dentro del propio canvas, aparece una pantalla oscura
  semitransparente con el texto "NIVEL 1/2/3" y debajo una frase breve
  ("Preparando defensa…"). Fade de entrada, pausa breve y fade de salida,
  ~1.5 s en total (mucho menos con `prefers-reduced-motion`). Las
  amenazas y sus temporizadores **no arrancan hasta que termina** esta
  animación, y mientras dura, el jugador no puede pulsar amenazas
  (todavía no existen) ni usar el escáner (bloqueado explícitamente). Se
  cancela limpiamente (sin objetos ni timers sueltos) si se reinicia la
  partida o se cambia de nivel a mitad de la animación. Funciona igual en
  escritorio y en móvil, en cualquier orientación.
- Nivel superado: secuencia con barra de progreso resaltada, onda verde
  desde el servidor, partículas de "datos digitales" (no confeti),
  oscurecimiento de 250 ms, y la tarjeta entra con opacidad 0→1, escala
  0.85→1, `translateY` 24px→0, `Back.Out` (~450 ms); dentro, el círculo se
  dibuja, luego el check, luego el texto, luego el conteo de puntos
  animado (desde el puntaje al iniciar el nivel hasta el final), y por
  último el botón "Continuar".
- Al presionar "Continuar": la tarjeta se desvanece, aparece una pantalla
  breve con línea de escaneo y "Inicializando nivel X/3" (~1 s), se
  reinicia la barra de progreso y comienza el siguiente nivel (que a su
  vez muestra su propia intro "NIVEL X"). Todo en menos de 2 segundos.
- **Derrota**: primero un destello rojo breve (~280 ms, dentro del
  canvas) y una vibración ligera de cámara; luego aparece la pantalla
  HTML de "Derrota" con su propia animación de entrada: el ícono
  (círculo con X) se dibuja con un trazo, título/texto/puntaje aparecen
  de forma escalonada, y el panel se asienta con una leve sacudida y un
  destello rojo en el ícono. Termina con ícono de error, mensaje,
  puntuación final y botón "Volver a Intentar".
- **Victoria final**: misma idea que Derrota pero en verde — ícono de
  escudo con check que se dibuja con un trazo, textos escalonados, y el
  panel cierra con un pequeño "rebote" de triunfo (overshoot de escala)
  en vez de la sacudida. Puntuación final, formulario opcional de gamertag,
  clasificación global y botón "Volver a Intentar".
- Ambas respetan `prefers-reduced-motion` (fundido simple en vez de la
  secuencia completa) y se repiten correctamente cada vez que se pierde
  o se gana otra vez en la misma sesión.

## 7. Sonido

Generado con **Web Audio API** (osciladores), sin archivos de audio:
sonidos cortos y distintos para acierto, error/falso positivo, combo,
escudo roto, servidor perdido, alerta de jefe, nivel superado, victoria y
derrota.

## 8. Accesibilidad y requisitos técnicos

- Todo debe respetar `prefers-reduced-motion` (animaciones reducidas a
  simples cambios de opacidad o casi instantáneas).
- Funciona con mouse/teclado, con pantalla táctil (en la vista móvil hay
  botones A/B/X/Y bajo el tablero: se toca el enemigo y luego su letra) y
  con el teléfono como mando.
- Responsive en computadora y celular, sin scroll horizontal.
- Sin temporizadores, listeners ni objetos duplicados al reiniciar,
  cambiar de nivel o perder: todo se limpia explícitamente (`limpiarJefe`,
  `limpiarVirusActivos`, temporizador del escáner, etc.).
- Generación aleatoria/procedural en todo momento (posición, tipo,
  movimiento, trampas).
- README con historia, mecánica completa (amenazas, combo, servidores,
  escáner, jefes), niveles y dificultad, controles, tecnologías,
  instrucciones para ejecutar localmente y publicar en GitHub Pages, y los
  nombres del equipo.

## 9. Nitidez del canvas en escritorio

El canvas se ve nítido (sin desenfoque de subpíxel) también en pantallas
de alta densidad. La causa real de un desenfoque que llegó a aparecer no
era el `devicePixelRatio` en sí (ya se manejaba con el contenedor "mundo"
escalado): era que el canvas tiene un borde de 1px con
`box-sizing: border-box` (regla global del proyecto), y al fijar su
tamaño total el navegador comprobaba la proporción intrínseca 1280×720
contra el **área de contenido** (total menos el borde), que ya no daba
una razón exacta y producía medidas como `540.875px`. La solución:
calcular el tamaño del canvas en escritorio sobre el área de contenido
real (`clientWidth` del contenedor, siempre entero, menos el borde) y
fijarlo con `box-sizing: content-box` solo por estilo en línea (con
`important`, para ganarle a la regla `!important` de `style.css`), sin
tocar el CSS de la versión móvil ni las dimensiones del tablero. Se
reaplica en cada `resize` de la ventana (con debounce).

### Corrección posterior: tablero estirado y borroso en PC

La corrección del borde no resolvía otra causa independiente: el CSS
activaba la vista móvil con cualquier ventana de alto ≤768px, mientras
`esVistaMovil()` en JavaScript también exigía `(hover: none)` o
`(pointer: coarse)`. En Edge, con viewport 1920×768 y DPR 1, el canvas
1280×720 terminaba mostrado a 1900×694: se ampliaba y deformaba.

Las reglas móviles del CSS ahora exigen las mismas condiciones de tamaño
y dispositivo que JavaScript mediante la clase `html.vista-movil`. Así,
una PC conserva el modo de escritorio y la proporción 16:9 del tablero,
incluidos los círculos y textos.

### Tamaño del tablero en escritorio

El tablero puede crecer hasta 1120px de ancho en monitores con espacio.
`ajustarCanvasEscritorio()` también calcula el límite según la altura real
de la ventana, reservando el alto de la barra del escáner y 20px de margen.
El ancho y el alto visibles se fijan en píxeles enteros y con proporción
16:9, por lo que el aumento no introduce desenfoque ni oculta el botón.
Un `ResizeObserver` reaplica el cálculo si Phaser escribe sus propias
medidas después del arranque; una vez estabilizado no modifica el canvas.

### Corrección posterior: deformación al girar el teléfono

En móvil horizontal, el canvas conservaba internamente un mundo vertical,
pero el CSS combinaba `width: 100%` con `max-height: 100%`. El navegador
reducía solo la altura para dejar sitio al botón del escáner y estiraba el
dibujo a todo el ancho, convirtiendo círculos en óvalos.

Ahora las dos dimensiones CSS del canvas son automáticas y usan límites
máximos, por lo que siempre conservan su proporción. JavaScript calcula un
mundo horizontal a partir del tamaño real de `#contenedor-phaser`, usa un
alto lógico mínimo seguro y compacta la fila de servidores. La rotación
reconstruye el tablero y conserva el progreso, los elementos y los jefes.

### Corrección para Safari móvil al rotar

Safari puede informar valores inconsistentes para `hover` y `pointer` al
girar un iPhone o iPad, haciendo que CSS y JavaScript eligieran modos
distintos. `esVistaMovil()` ahora también comprueba
`navigator.maxTouchPoints` y el agente móvil, y sincroniza el resultado en
la clase `html.vista-movil`; los estilos ya no repiten su propia detección.

Además, `ajustarCanvasMovil()` calcula explícitamente el ancho y el alto
visibles con ajuste tipo `contain`, usando la proporción física del canvas.
Safari ya no puede reducir una sola dimensión ni convertir los círculos en
óvalos. Este ajuste se reaplica al iniciar y después de cada rotación.
Antes de cada `pointerdown`, `mousedown` o `touchstart`, también se actualizan
los límites de entrada de Phaser con la posición real del canvas, para que
el toque coincida con la amenaza aun cuando Safari mueva sus barras.

### Corrección posterior: parpadeo/deformación periódica del tablero en PC

Tras ampliar el tablero (sección "Tamaño del tablero en escritorio"), el
tablero se deformaba brevemente cada 1-3 segundos en escritorio (visible
como texto e íconos duplicados/desalineados en una captura). Se investigó
con Playwright, instrumentando cada escritura al `style.width/height` del
canvas: la causa real es que **Phaser revisa por su cuenta, cada
`resizeInterval` (500 ms por defecto), si el tamaño del contenedor padre
cambió**, y si es así reescribe el ancho/alto del canvas con su propio
cálculo (pensado para `box-sizing:border-box`, sin saber que aquí se usa
`content-box` para evitar el desenfoque de subpíxel). Esa reescritura
cambia el tamaño de `#contenedor-phaser` (que se ajusta a su contenido),
lo que dispara nuestro propio `ResizeObserver` para corregirlo de vuelta,
que a su vez vuelve a cambiar el tamaño del contenedor... un ciclo sin fin
entre Phaser y nuestro código, cada ~500 ms-3 s según el momento en que
cada revisión encontraba al otro a mitad de camino.

La solución es subir `resizeInterval` a un valor enorme (una hora) en la
configuración `scale` de `construirConfiguracionPhaser()`, para que esa
revisión periódica de Phaser prácticamente nunca se ejecute; el
redimensionamiento real (por eventos de `resize`/`orientationchange`)
sigue funcionando igual, tanto en escritorio como en móvil, porque esos
eventos siguen disparando el `dirty flag` de Phaser y nuestros propios
listeners, solo se desactivó el sondeo periódico redundante. No bajar ni
quitar `resizeInterval` al modificar este código: sin él, Phaser vuelve a
pelear por el tamaño del canvas con `ajustarCanvasEscritorio()`.

(De paso, se corrigió también que el `ResizeObserver` de
`ajustarCanvasEscritorio()` observe el **contenedor** `#contenedor-phaser`
en vez del propio canvas, para no auto-dispararse al escribir el tamaño
del canvas — necesario pero no suficiente por sí solo, la causa principal
era el `resizeInterval` de Phaser.)

## 10. Control de versiones de caché (evitar que Chrome cargue código viejo)

`index.html` referencia sus archivos locales (`style.css`, `game.js`)
con un parámetro de versión (actualmente `style.css?v=25`, `game.js?v=32`,
`sin-zoom.js?v=1` y `remote-host.js?v=8`; en `control.html`: `control.css?v=7`,
`control.js?v=10` y `sin-zoom.js?v=1`). Cada vez
que se sube una modificación a esos archivos, ese número debe
**incrementarse** (`v=4`, `v=5`, …) para forzar que el navegador
descargue la versión nueva en vez de servir una copia en caché con la
misma URL. **Nunca usar `Date.now()` ni un valor que cambie solo**, ya
que obligaría a descargar todo de nuevo en cada visita, incluso sin
cambios reales.

Esto no es una solución perfecta e instantánea por sí sola: GitHub
Pages envía `Cache-Control: max-age=600` (10 minutos) en **todos** los
archivos, incluido el propio `index.html`. Es decir:

- `style.css?v=N` y `game.js?v=N` **sí** se resuelven de forma
  confiable con este método: al cambiar el número, la URL es distinta
  a cualquier cosa que el navegador tenga guardada, así que siempre
  se descarga fresca, sin depender de esos 10 minutos.
- Pero si el propio `index.html` sigue en la caché del navegador (dentro
  de esa ventana de 10 minutos desde la última visita), el usuario
  seguirá viendo la referencia `?v=` **anterior** hasta que esa copia
  del HTML expire y el navegador la vuelva a pedir sola con una recarga
  normal. No hay manera de eliminar ese margen desde el lado del
  proyecto (es una cabecera que pone GitHub Pages, no algo configurable
  en este repositorio).
- En la práctica: tras publicar un cambio, esperar unos minutos (o
  hacer una sola recarga forzada tipo Ctrl+Shift+R) antes de probar
  garantiza ver la versión nueva; después de eso, recargas normales ya
  reflejan los cambios sin necesidad de forzar nada.

## 11. Clasificación global y gamertag recordado

Al completar el nivel 3, el jugador puede registrar un gamertag de 2 a 16
caracteres junto con su puntuación. La pantalla muestra los 10 mejores
resultados globales ordenados por puntuación y fecha. Los registros se guardan
en la tabla `puntuaciones` de Supabase, creada con `SUPABASE_SETUP.sql`.

**Cada gamertag guarda solo su mejor puntuación** (sin distinguir
mayúsculas/minúsculas): un índice único sobre `lower(gamertag)` hace que,
si vuelves a jugar y ganar con el mismo gamertag, tu fila existente se
reemplace únicamente si el puntaje nuevo es mayor; si es igual o menor,
no se toca la fila guardada y la interfaz lo indica ("ya tienes un mejor
puntaje guardado") dejando el formulario disponible por si se quiere
probar con otro gamertag. Esto se resuelve con una función de Postgres,
`guardar_puntuacion(gamertag, puntuacion, partida_id)`
(`security definer`, en `SUPABASE_SETUP.sql`), a la que el navegador
llama por RPC (`/rest/v1/rpc/guardar_puntuacion`) en vez de insertar
directamente en la tabla.

La aplicación utiliza únicamente la URL del proyecto y una clave
publicable. Row Level Security permite **leer** libremente, pero ya no
concede `insert`/`update` directos sobre la tabla al navegador: toda
escritura pasa por esa función (que sí puede escribir porque corre con
los permisos de quien la creó), así el navegador nunca puede insertar
filas fuera de esa regla ni editar/borrar puntuaciones ajenas. Cada
intento de guardado sigue usando un identificador de partida único para
que la interfaz nunca envíe el mismo resultado dos veces por accidente.

**Importante:** `SUPABASE_SETUP.sql` cambió de raíz (tabla con índice
único por gamertag + función `guardar_puntuacion` + permisos nuevos).
Hay que volver a ejecutar el archivo completo en el SQL Editor del
proyecto de Supabase para que este cambio tenga efecto; el archivo está
escrito para poder reejecutarse sin problema sobre una base ya
existente (limpia duplicados antes de crear el índice único).

**Gamertag fijo por dispositivo.** La primera vez que se completa el juego en
un dispositivo se muestra el formulario; cuando el servidor acepta el nombre
(`guardado = true`) se guarda en `localStorage` (`eliminaMalware.gamertag`). En
las partidas siguientes de ese dispositivo el formulario **no se muestra**, el
nombre no se puede cambiar desde la pantalla de resultados y la puntuación se
envía sola con ese gamertag (`prepararClasificacionVictoria()` /
`enviarPuntuacionGlobal()`): si supera el récord se actualiza conservando el
nombre; si no, se conserva el anterior y se informa. Si el envío automático
falla aparece solo un botón "Reintentar". No se crean filas duplicadas porque
siempre se usa el mismo nombre y `guardar_puntuacion` solo reemplaza si el
puntaje es mayor. Si el nombre escrito la primera vez ya tiene un récord igual
o mayor, no se guarda ni se recuerda y se puede probar con otro. No se guarda
ninguna contraseña ni clave secreta.

## 12. Teléfono como mando (control remoto)

- La portada muestra un **QR** (librería `qrcodejs` por CDN) con la
  dirección de `control.html?s=<id aleatorio>`; también hay un botón
  "Conectar teléfono" bajo el tablero que abre el mismo QR en un diálogo.
  La dirección se calcula a partir de la página actual, así que funciona en
  cualquier publicación de GitHub Pages.
- La PC (`remote-host.js`) y el teléfono (`control.js`) se comunican por un
  canal temporal de **Supabase Realtime** (`control-<id>`, mensajes
  `broadcast`), creado de nuevo al recargar la PC. En Supabase debe estar
  activado **Realtime → Allow public access to channels**. La PC debe
  abrirse por HTTPS (GitHub Pages o servidor), no como archivo local.
- El mando tiene joystick (mueve la mira), botones **A, B, X, Y**,
  escáner, iniciar, "2 jugadores", continuar, reintentar y respuestas 1–4
  (solo visibles durante la pregunta de seguridad). Muestra la combinación
  del jefe y los avisos del juego.
- Seguridad/robustez: la PC valida cada mensaje (letras permitidas, ejes
  entre -1 y 1, botones solo en su pantalla correspondiente), limita los
  ataques a uno cada 110 ms, y si el teléfono deja de enviar señal 7 s se
  considera desconectado y la mira se detiene. Al soltar el joystick,
  ocultar la página o perder la conexión, el movimiento se detiene.
- La pregunta de seguridad es una capa encima del tablero (ambas pantallas
  quedan con `.activa`); `currentScreen()` en `remote-host.js` le da
  prioridad a `pantalla-pregunta` para que el mando pueda responder y
  continuar.
- **Joystick flotante (teléfono, `control.js`):** el centro no es fijo, es
  el punto donde el dedo toca por primera vez, y la zona táctil es todo el
  lado izquierdo del mando (`.movement`), no solo el círculo; el círculo se
  desliza hasta el dedo (sin salirse del mando), la etiqueta "MOVER LA MIRA"
  se atenúa mientras tanto, y al soltar el pomo y el círculo vuelven con una
  animación corta (respeta `prefers-reduced-motion`). Motivo: antes el
  centro era el del círculo y, como se juega mirando la PC y no el teléfono,
  si el pulgar caía un poco a un lado la mira se iba **primero hacia ese
  lado** y luego hacia donde se quería ("se va al lado contrario"); además
  tocar el joystick se descartaba si la PC aún no había avisado su pantalla
  y había que soltar y volver a tocar ("se siente estático"). Ahora tocar
  siempre empieza en reposo y solo se deja de *enviar* donde la PC no lo
  usa (`canSteer()`). Si el dedo se aleja más que el radio
  (`stickRadius()`, ≈25% del ancho del círculo) el centro lo sigue, así que
  al regresar el dedo la mira cambia de sentido enseguida. Zona muerta con
  histéresis (8% / 14%) y reescalada: la inclinación sale de 0 sin saltos.
- **Envío del joystick:** se manda en cuanto cambian los ejes (como mucho
  25 mensajes por segundo; un cambio grande, como arrancar o invertir el
  sentido, espera solo 16 ms), con un latido cada 100 ms mientras siga
  inclinado (el temporizador solo corre con inclinación) y, al soltar, el
  alto va de inmediato y se repite dos veces. Antes se enviaba cada 80 ms
  fijos, lo que sumaba ~40 ms de retraso medio y escalonaba el movimiento.
  Cada mensaje lleva un número `n` (empieza en `Date.now()` para que siga
  creciendo si el teléfono se recarga) y `remote-host.js` descarta los que
  llegan desordenados, algo que el canal hace de vez en cuando; un salto
  grande hacia atrás se toma como teléfono reiniciado. Medido desde la PC
  del proyecto: el canal tarda ~65 ms de ida (p99 ≈ 80–130 ms) y no pierde
  mensajes hasta 40 por segundo, por lo que 25/s es seguro; no subir de ahí
  (el servidor limita los mensajes por segundo del proyecto, y con dos
  teléfonos se suman: cada mensaje llega a todos los demás suscriptores,
  también al otro teléfono). Medido con la PC y dos teléfonos al máximo de
  25/s cada uno (≈ 55 enviados y ≈ 110 entregas por segundo) llegaron 1100
  de 1100 mensajes, sin desorden y con ~65 ms de latencia; incluso a 40/s
  cada uno (≈ 170 entregas por segundo) no se perdió ninguno.
- **Movimiento de la mira en la PC (`actualizarControlMira()`):** la
  inclinación se convierte en velocidad (`MIRA_CURVA`, hasta
  `MIRA_VELOCIDAD` px/s: poca inclinación = movimiento lento para afinar) y
  se suaviza por eje: acelerar en el mismo sentido tarda ~25 ms
  (`MIRA_ACELERA_MS`, para que los escalones de la red no se vean a
  tirones), frenar o invertir el sentido ~15 ms (`MIRA_FRENA_MS`) y soltar
  es inmediato, para que la mira nunca siga hacia el lado que ya se soltó.
  Si dejan de llegar mensajes, la inclinación se desvanece linealmente entre
  250 y 650 ms (`MIRA_FRESCO_MS`, `MIRA_CADUCA_MS`) en vez de cortarse de
  golpe a los 300 ms, que se sentía como un congelamiento. El teclado se
  suma sin suavizar y sobre un objetivo la mira frena a la mitad (ese freno
  también se suaviza). Nota: en Phaser 3.70 el movimiento del mouse no trae
  `pointerType`, así que el `pointermove` de `crearControlMira()` en la
  práctica no mueve la mira; solo el clic (`pointerdown`) apunta.
- **Pregunta de seguridad con el mando:** joystick arriba/abajo resalta una
  opción (un paso por movimiento, hay que volver al centro), **A** responde
  y, ya respondida, **A** continúa. Los botones 1–4 siguen funcionando.
- **Safari/iPhone:** el mando desactiva la selección de texto, el menú de
  "copiar" al mantener presionado, el resaltado al tocar y el zoom
  (`user-select`, `-webkit-touch-callout`, `touch-action`).
- **Sin zoom accidental en el teléfono, y que SIEMPRE se pueda quitar** (el
  mando y el juego en vista móvil; se hacía zoom al apretar mucho y después
  no se podía deshacer): lo hace `sin-zoom.js`, cargado por `control.html` (con
  `data-siempre data-recargar`) y por `index.html` (solo actúa en pantallas
  táctiles de teléfono o tableta; en la PC no toca el zoom del navegador).
  Safari/iPhone ignora `user-scalable=no` y `maximum-scale` para el zoom del
  usuario y, en horizontal (iOS 15+), tampoco respeta siempre `touch-action`, así
  que se cierran varios caminos a la vez: (1) pellizco: se cancelan
  `gesturestart/gesturechange/gestureend` y los `touchmove` con dos dedos o
  `scale ≠ 1`; (2) doble toque —machacar botones cuenta como doble toque—: se
  cancela el segundo `touchend` rápido (<350 ms), salvo en lo que se activa con
  `click` (los A/B/X/Y del mando y los de la pantalla usan `pointerdown`, no
  necesitan el click); (3) CSS y viewport: `minimum-scale=1, maximum-scale=1,
  user-scalable=no` en las dos páginas; `control.css` pone `touch-action` en
  `<html>` y `<body>` (`pan-y`, se puede desplazar en teléfonos bajitos), `none`
  en `.gamepad` y `manipulation` en los botones, y el juego en vista móvil
  `manipulation`; el campo del gamertag usa 16 px en pantallas táctiles (con
  menos, Safari hace zoom al enfocarlo). **Lección:** bloquear TODO dejó el zoom
  imposible de quitar —con `touch-action: pan-y/none` Safari tampoco deja
  pellizcar para alejar—, y eso es peor que el zoom. Por eso (4) mientras
  `visualViewport.scale ≠ 1` el módulo no cancela nada y pone la clase `con-zoom`
  en `<html>`, que fuerza `touch-action: auto` en todo; (5) cuando el zoom deja de
  cambiar (350 ms) intenta volver a escala 1 cambiando un instante el
  `<meta viewport>` (escala mínima y máxima 1, otra escala inicial) y volviendo
  a dejar el de la página; (6) si sigue: el mando se abre de nuevo con `?r=<hora>`
  (como mucho una vez cada 10 s, guardado en `sessionStorage`; el juego no se
  recarga solo porque perdería la partida); (7) y si todavía sigue aparece el
  botón **Quitar zoom**, pegado a la esquina de lo que se ve y del mismo
  tamaño en pantalla aunque haya zoom (al tocarlo vuelve a abrir la página,
  también en el juego y sin el límite de 10 s). Pruebas: Chrome emulado no reproduce el zoom de iOS (ni con el viewport
  del mando ni con pellizcos sintéticos), así que el zoom se **falseó**
  (`visualViewport.scale/pageLeft/pageTop`) para probar todo el flujo, más toques
  reales por CDP (machacar A/B/X/Y, palanca y A a la vez, dos dedos moviéndose) y
  una auditoría de desbordes (12 tamaños × 7 estados del mando y 7 pantallas del
  juego, sin desbordes). **No se pudo probar en un iPhone real**: que el cambio
  del `<meta viewport>` devuelva la escala 1 y que cargar de nuevo la quite se
  basan en cómo funciona WebKit, no en una prueba; el botón y la salida con los
  dedos sí dependen solo de código propio. Si el zoom vuelve a ocurrir, preguntar:
  iPhone o Android, pellizco o doble toque, vertical u horizontal, mando o juego.
- La combinación del jefe en la PC toma el color de la siguiente letra que
  hay que pulsar.
- Puente con el juego: `window.controlJuego` en `game.js`
  (`mover(x, y, jugador)`, `atacar(letra, jugador)`, `estado()`), sin
  simular clics sobre el canvas.

## 13. Modo 2 jugadores (cooperativo en la misma pantalla)

- Botón "2 jugadores" en la portada (y en el mando). `estado.multijugador`
  indica el modo; "Volver a intentar" conserva el modo elegido.
- Dos miras en el tablero: **J1 azul** y **J2 amarilla**, con su etiqueta;
  empiezan en cada mitad del tablero. Defienden los mismos servidores y
  comparten escáner, combo y vidas.
- Controles: J1 con mouse/flechas + teclas A/B/X/Y o un teléfono; J2 con
  **I/J/K/L** + **7/8/9/0** (= A/B/X/Y) o un segundo teléfono. Las teclas
  I/J/K/L se registran sin captura para no bloquear la escritura del
  gamertag.
- Los dos teléfonos escanean el **mismo QR**: el primero es J1 y el segundo
  J2 (cada teléfono tiene un id propio en `sessionStorage`); el mando
  muestra "JUGADOR 1/2" y un botón "Cambiar a J2/J1" que intercambia los
  lugares. En modo de 1 jugador todos los teléfonos manejan a J1. Cada
  teléfono tiene su propio joystick flotante, su contador de mensajes `n`
  (`phone.lastMove` en `remote-host.js`) y su propio desvanecimiento si la
  red se detiene, así que uno no afecta al otro. Al cambiar de jugador se
  detienen las **dos** miras (`mover(0, 0, 1)` y `mover(0, 0, 2)`): si solo
  se detenía la del que pedía el cambio, el jugador que se quedaba sin
  teléfono seguía corriendo con la última orden hasta que se desvanecía
  (~140 px). Los dedos que siguen puestos reanudan en el siguiente mensaje
  (≤ 100 ms) ya con su nuevo jugador.
- La combinación del jefe es compartida (J1 puede pulsar A y J2 B); la
  recompensa del jefe se anota a quien da el golpe final.
- Dificultad en 2 jugadores: los jefes tienen **50% más de vida**
  (`FACTOR_VIDA_JEFE_2J`: Troyano 5, Botnet 8, Ransomware 12; la fase 2 del
  Ransomware se escala igual, a la mitad de su vida) y se permite **un
  elemento simultáneo más** (`ELEMENTOS_EXTRA_2J`, sumado en
  `maxElementosActual()`). Mismos 3 jefes y mismas amenazas por nivel. El
  modo de 1 jugador no cambia.
- Puntos: `estado.puntosJugadores` lleva el marcador de cada jugador
  (además del total del equipo). Se muestra bajo el tablero ("J1 · J2") y
  en las pantallas de nivel superado, derrota y victoria. La clasificación
  global guarda el total del equipo con el gamertag del dispositivo.
- Interpretación tomada: "multijugador" = cooperativo local en la misma
  pantalla. Si se pidiera multijugador en línea (cada jugador viendo su
  propia pantalla), habría que sincronizar el estado completo del juego
  entre dispositivos; queda pendiente de confirmar.

## 14. Modos de juego y sonido

- Portada con cuatro botones: **"Iniciar defensa"** (modo normal, el juego
  original), **"Jugar con mando"**, **"2 jugadores"** y **"Teclado + mouse"**
  (los tres últimos con contorno verde; el de teclado + mouse no aparece en la
  vista móvil). `iniciarJuegoDesdeCero(modo)` recibe `'normal'`,
  `'mando'`, `'2j'` o `'duo'`; "Volver a intentar" conserva el modo. INICIAR en el
  teléfono arranca el modo con mando.
- **Modo normal:** idéntico al original — clic/toque directo sobre
  amenazas, jefe, punto débil del Ransomware y falsos positivos del jefe;
  sin mira, sin letras ni etiquetas sobre los elementos, sin combinación del
  jefe; tiempos originales (vida 4.0/3.1/2.7 s, ciclos de jefe 7/6/5 s).
  No se muestra "Conectar teléfono" ni los botones A/B/X/Y del celular. Si
  hay un teléfono conectado, sus letras y joystick se desactivan y avisa
  que la partida está en modo normal.
- **Modo con mando:** mira, letras y combinaciones (secciones 4, 5, 12 y
  13); ciclos de jefe 10/10/12 s (`tiempoAtaqueMando`). La clase
  `html.modo-mando` muestra los botones A/B/X/Y en la vista móvil.
- **Sonido:** los navegadores solo dejan sonar el audio tras un clic, toque
  o tecla **real** en la página (`isTrusted`). El `button.click()` que hace
  `remote-host.js` cuando el teléfono pulsa INICIAR es por código y **no
  cuenta**: por eso, al iniciar desde el teléfono sin haber tocado la PC, el
  audio se quedaba en pausa (reloj del `AudioContext` detenido) hasta que
  alguien hacía clic en la PC —en la práctica, en la pregunta de seguridad—.
  No hay manera de saltarse esa regla (solo si el usuario da permiso de
  sonido al sitio en Chrome o si Chrome ya lo considera "frecuente"), así que
  el clic se pide **antes** de empezar:
  - `obtenerContextoAudio()` crea el contexto al cargar la página (queda en
    `running` solo si el navegador ya permite el audio) y
    `activarAudio()` lo reanuda con cualquier gesto real (`pointerdown`,
    `pointerup`, `mousedown`, `click`, `keydown`, `touchend`); las teclas
    Shift/Ctrl/Alt/Meta/CapsLock/Escape solas no cuentan porque Chrome no las
    acepta como gesto.
  - `audioDesbloqueado()` dice si ya puede sonar (contexto `running`; como
    respaldo, un gesto real hace más de 2 s por si el navegador no lo
    arranca, para no dejar el mando bloqueado para siempre). Se manda al
    mando en `window.controlJuego.estado().audio`.
  - **Portada:** en el bloque del QR, `#estado-sonido` muestra "Sonido
    desactivado: haz clic en cualquier parte de esta pantalla" (naranja) y
    un botón "Activar sonido" con ícono de bocina; durante el arranque dice
    "Activando sonido…" y al final "Sonido activado" (verde) sin botón. Si el
    navegador ya permite el audio, solo aparece "Sonido activado".
  - **Mando:** mientras la PC esté en la portada con `audio: false`, INICIAR y
    2 JUGADORES quedan deshabilitados y el panel dice "ANTES DE INICIAR: Haz
    clic en cualquier parte de la PC para activar el sonido. Después podrás
    iniciar desde aquí." (texto naranja, clase `.warn`); al activarse se
    habilitan solos. Una PC sin el campo `audio` (versión vieja) no bloquea.
  - Sigue existiendo el botón **"Activar sonido"** bajo el tablero para el
    caso de que el navegador vuelva a pausar el audio durante la partida.
  - Al probar con Playwright: `page.evaluate` y las funciones expuestas
    (`exposeFunction`) cuentan como gesto de usuario y desbloquean el audio
    de la PC sin querer; leer con CDP crudo (`Runtime.evaluate` con
    `userGesture: false`), entregar los mensajes del relevo de la misma
    forma y lanzar Chrome con `--autoplay-policy=document-user-activation-required`
    (el modo headless lo trae abierto por defecto).

## 15. Modo teclado + mouse (2 jugadores en la misma PC)

Cuarto modo de juego, pensado para dos personas frente a una sola PC, **sin
teléfono**: una usa el lado izquierdo del teclado y la otra, el mouse. Botón
"Teclado + mouse" en la portada (`iniciarJuegoDesdeCero('duo')`,
`estado.modoDuo`; "Volver a intentar" lo conserva). No aparece en la vista
móvil (`html.vista-movil #btn-jugar-duo`: un teléfono no tiene teclado). No usa
mira ni mando ni `estado.modoMando`/`estado.multijugador`, así que los otros
tres modos no cambian.

- **Reparto de enemigos:** cada amenaza real (normal, crítica, resistente,
  duplicadora y también la reparación) nace "de teclado" (50%,
  `PROBABILIDAD_TECLA_DUO`) o "de mouse" (`elemento.rol`). Los de teclado
  llevan una **tecla** dibujada como una tecla de teclado sobre el enemigo
  (`dibujarTeclaEnemigo`); los de mouse, un **ícono de mouse**
  (`dibujarIconoMouseEnemigo`); los archivos seguros (azules) no son de nadie y
  muestran "SEGURO" (un clic en uno cuesta un servidor, como siempre). Las dos
  amenazas pequeñas del duplicador heredan el rol de su padre.
- **Teclas:** `TECLAS_DUO` = Q W E R A D F Z X C V (lado izquierdo; **la S se
  queda para el escáner**). Dos enemigos en pantalla nunca comparten tecla
  (`elegirTeclaLibre`). Se compara `event.key` en mayúscula (lo que dice la
  tecla impresa). Con Ctrl/Alt/Cmd no se hace nada, para no pelear con los
  atajos del navegador, ni se captura nada si se escribe en un campo de texto
  (gamertag).
- **Quién elimina qué:** la tecla elimina al enemigo que la muestra, sin
  apuntar (`teclaDuo`); el clic solo vale en los enemigos sin tecla
  (`clicDuo`; en uno con tecla avisa "USA LA TECLA X"). La resistente pide dos
  pulsaciones o dos clics. Los puntos son del jugador que dio el golpe
  (`puntosJugadores[0]` = teclado, `[1]` = mouse) y se ven como "TECLADO n ·
  MOUSE n" bajo el tablero y en las pantallas de resultado. Combo, servidores y
  escáner son compartidos.
- **Jefes:** el jefe tiene un **escudo**. El teclado lo abre completando una
  combinación de teclas del lado izquierdo (2, 3 y 4 teclas según el jefe,
  sorteada de nuevo cada vez con `generarCombinacionJefe(..., TECLAS_DUO)`; una
  tecla equivocada reinicia el progreso de la misma combinación) y, mientras
  está abierto (3.5 / 3 / 2.5 s según el nivel, `VENTANA_ESCUDO_DUO_MS`; 20%
  menos en la fase 2 del Ransomware), el mouse puede golpearlo con un clic. Si
  el mouse no llega, el escudo se cierra sin daño y sale otra combinación. Con
  el escudo cerrado un clic solo avisa "ESCUDO CERRADO". El Ransomware muestra
  su punto débil solo mientras el escudo está abierto (no parpadea) y se golpea
  ahí. Así hacen falta los dos en cada golpe. La vida del jefe es la de siempre
  (3/5/8 golpes, sin el 50% extra del modo con mando) y usa los ciclos de
  ataque de ese modo (10/10/12 s) porque cada golpe necesita dos pasos. La
  recompensa del jefe se reparte a partes iguales; los falsos positivos que
  genera el jefe siguen siendo del mouse. Código: `prepararJefeDuo`,
  `pulsarTeclaJefeDuo`, `abrirEscudoJefe`, `cerrarEscudoJefe`, `clicJefeDuo`.
- **Dificultad (valores de partida, pendientes de ajustar jugando):** cabe un
  enemigo más a la vez (`ELEMENTOS_EXTRA_DUO`) y aparecen un 15% más seguido
  (`FACTOR_APARICION_DUO` = 0,85, también durante la sobrecarga de red); los
  tiempos de vida son los del modo normal.
- **Pregunta de seguridad:** se responde con el mouse o con las teclas 1-4
  (también del lado izquierdo del teclado).
- **Interfaz:** guía bajo el tablero (`#guia-duo`, solo con `html.modo-duo`):
  "Teclado (lado izquierdo) pulsa la tecla de cada enemigo · Mouse clic en los
  enemigos sin tecla", con el teclado en azul y el mouse en amarillo como en el
  marcador. Si hay un teléfono conectado, el mando avisa que la partida es de
  teclado + mouse y que no se usa (`estado().duo`).

## Reglas de trabajo durante todo el proyecto

- Inspeccionar siempre el código actual antes de modificarlo; nunca
  reconstruir desde cero.
- Cada cambio nuevo debe conservar la portada, el diseño, los niveles, los
  falsos positivos, los jefes y las mecánicas ya funcionando, salvo que se
  pida explícitamente lo contrario.
- Verificar cada entrega abriendo el juego en un navegador real (no solo
  revisar el código): nitidez del canvas, coordenadas de clic, combate
  completo de cada jefe, derrota a mitad de combate, reinicio limpio,
  combo, servidores, escáner y responsive en escritorio/móvil.
- Al medir algo sensible al tiempo (el joystick, la respuesta de la mira),
  usar el Chrome real (`channel: 'chrome'` en Playwright) y no el
  "Chromium headless shell": este dibuja la PC por software a ~13 fps y,
  como el juego limita `delta` a 50 ms, la mira se mueve en cámara lenta y
  todas las mediciones salen deformadas. El mando se probó con la PC y el
  teléfono en dos páginas, un relevo local que imita el retraso real
  (~65 ms de ida) en lugar de Supabase y gestos de dedo reproducidos dentro
  de la página del teléfono.
- Publicar los cambios en GitHub Pages (repositorio
  `cesarau90/videojuego`) después de cada entrega.
