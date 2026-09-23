# Prompt consolidado — "Elimina el Malware"

Desarrolla un videojuego web completo llamado **"Elimina el Malware"**,
relacionado con la ciberseguridad y la carrera de Ingeniería en Sistemas y
Negocios Digitales (ISND). Debe funcionar directamente en el navegador y ser
compatible con GitHub Pages, usando HTML, CSS, JavaScript y **Phaser 3**
(cargado por CDN). Supabase se usa únicamente para la clasificación global;
no se requieren cuentas de jugador ni otros servicios externos.

Entrega el código en archivos separados: `index.html`, `style.css`,
`game.js` y `README.md`. Código sencillo, comentado en español, explicable
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
    servidor está bajo ataque", texto breve, botón "Iniciar defensa",
    indicadores (3 niveles / 3 vidas / 10 puntos por amenaza).
  - Derecha: ilustración de un servidor hecha con HTML/CSS (línea de
    escaneo animada, nodos con estado, indicador de red), sin imágenes.
- Tres tarjetas de instrucciones: Detecta / Elimina / Sobrevive.
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
- Fondo con cuadrícula tenue y una pequeña red decorativa de nodos
  animados, sin llenar la pantalla.
- El botón "ESCÁNER" vive **fuera del canvas**, en una barra propia
  centrada inmediatamente debajo del tablero (sin posición absoluta), para
  no cubrir el servidor de respaldo ni ningún elemento del juego. Conserva
  diseño, animaciones, contador de cargas y funcionamiento con clic, toque
  y tecla **S**.

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
- Cuatro tipos, cada uno con ícono, color y comportamiento propios:
  - **Malware normal** (rojo): 1 clic, 10 puntos.
  - **Malware crítico** (naranja, ícono de rayo): 1 clic, 20 puntos,
    desaparece más rápido (75% del tiempo de vida normal).
  - **Malware resistente** (morado, ícono de "bug" con escudo exterior):
    2 clics — el primero rompe el escudo (sin puntos ni penalización), el
    segundo lo elimina (15 puntos).
  - **Archivo seguro / falso positivo** (azul, escudo con marca): no debe
    tocarse. Si se le da clic, se pierde un servidor y aparece "Falso
    positivo". Si expira solo, no pasa nada.
- Cada amenaza real traza una línea tenue hacia el servidor al que
  "ataca".
- Tiempo de vida de una amenaza normal: **4.0 s (nivel 1) / 3.1 s (nivel
  2) / 2.7 s (nivel 3)**; la crítica dura el 75% de ese valor. Aparición de
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
  nivel**, y permanece ≈4 s. Un clic recupera un servidor caído; no
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

- **Nivel 1 — Troyano** (naranja, hexágono con flecha de infiltración): 3
  golpes, casi fijo en el centro (se desplaza un poco tras cada golpe),
  ciclo de ataque de 7 s, 50 puntos.
- **Nivel 2 — Botnet** (azul/morado, núcleo con nodos orbitando): 5
  golpes, cambia de posición tras cada golpe, genera hasta 1 falso
  positivo a la vez, ciclo de ataque de 6 s, 100 puntos.
- **Nivel 3 — Ransomware** (rojo/magenta, candado): 8 golpes, se desplaza
  lentamente, solo recibe daño en su punto débil (rojo, que aparece y
  desaparece), genera hasta 2 falsos positivos, entra en una fase más
  rápida y agresiva al perder 4 puntos de vida, ciclo de ataque de 5 s,
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
opciones y una sola respuesta correcta (`PREGUNTAS_NIVEL` en `game.js`).

- Al aparecer, arranca un contador visible de **10 segundos** (número +
  barra que se vacía) con `mostrarPreguntaNivel()`. El juego ya está
  completamente en pausa en este punto (sin generación ni elementos
  activos, ver `finalizarPorNivelCompletado()`), así que no hay riesgo
  de perder vidas ni servidores mientras el jugador responde.
- Acertar da un bono de **5 puntos por cada segundo restante en el
  momento del clic/toque** (máximo 50, con 10s completos). Fallar o
  agotar el tiempo da **0 puntos extra**; en ningún caso se pierde una
  vida ni se provoca derrota.
- Tras responder (o agotar el tiempo), se deshabilitan las opciones, se
  resalta en verde la correcta y —si aplica— en rojo la elegida, y se
  muestra una explicación breve antes de habilitar "Continuar". El bono
  se aplica una sola vez por pregunta (bandera `respondida` interna:
  clics repetidos tras responder no hacen nada).
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
- Funciona con mouse y con pantalla táctil (incluido el botón del
  escáner).
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
con un parámetro de versión (actualmente `style.css?v=11` y `game.js?v=14`). Cada vez
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

La aplicación utiliza únicamente la URL del proyecto y una clave publicable.
Row Level Security permite leer e insertar registros válidos, pero impide que
el navegador edite o borre puntuaciones existentes. Cada victoria genera un
identificador único y solo puede enviarse una vez desde la interfaz.

El último gamertag utilizado se conserva en `localStorage`, por lo que aparece
rellenado al volver a jugar desde el mismo navegador, incluso después de cerrar
y abrir la página. No se guarda ninguna contraseña ni clave secreta.

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
- Publicar los cambios en GitHub Pages (repositorio
  `cesarau90/videojuego`) después de cada entrega.
