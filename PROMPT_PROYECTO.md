# Prompt consolidado — "Elimina el Malware"

Desarrolla un videojuego web completo llamado **"Elimina el Malware"**,
relacionado con la ciberseguridad y la carrera de Ingeniería en Sistemas y
Negocios Digitales (ISND). Debe funcionar directamente en el navegador y ser
compatible con GitHub Pages, usando solo HTML, CSS, JavaScript y **Phaser 3**
(cargado por CDN). No uses bases de datos, cuentas, registro, servicios
externos ni tecnologías adicionales innecesarias.

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
lógico vertical** acorde a la pantalla real, en vez de forzar el mismo
16:9 horizontal dentro de una pantalla angosta:

- Detección de "vista móvil": la dimensión más chica del viewport
  (ancho o alto) es ≤768px **y** el dispositivo no tiene puntero fino
  (`(hover: none), (pointer: coarse)`), para no confundir una laptop de
  pantalla corta (p. ej. 1366×768) con un teléfono. Se reevalúa en cada
  `resize`/`orientationchange`, así que un teléfono sigue siendo "móvil"
  al rotarlo.
- Alto lógico fijo (1280) y ancho lógico calculado a partir de la
  proporción real ancho/alto de la pantalla (acotado entre 480 y 900),
  para llenar el espacio disponible sin estirar ni recortar nada.
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
  (máximo 2 en nivel 1, 3 en nivel 2, 4 en nivel 3), distribuidos sin tapar
  el HUD ni los servidores.
- **Objetivos móviles**: una fracción de los elementos se mueve lentamente
  y rebota dentro del área de juego (≈15% nivel 1, ≈40% nivel 2, ≈70%
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
- Tiempo de vida de una amenaza normal: **4.0 s (nivel 1) / 3.4 s (nivel
  2) / 3.0 s (nivel 3)**; la crítica dura el 75% de ese valor.
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
  Probabilidad de aparición: 12% en nivel 2, 18% en nivel 3 (0% en nivel
  1).
- **Sobrecarga de red** (nivel 2 y 3): aviso breve "SOBRECARGA DE RED" en
  la parte superior del área de juego (sin cubrir el HUD, los servidores
  ni el escáner). Acelera la aparición de elementos y permite **un
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
  canvas) y una vibración ligera de cámara, y solo después aparece la
  pantalla HTML de "Derrota" con ícono de error, mensaje, puntuación
  final y botón "Volver a Intentar". Nada de esto se muestra si
  `prefers-reduced-motion` está activo (va directo a la pantalla).
- Victoria final: ícono de escudo con check, puntuación final, botón
  "Volver a Intentar".

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
