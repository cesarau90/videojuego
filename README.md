# Elimina el Malware

## Modos de juego

En la portada hay tres botones:

- **Iniciar defensa — modo normal (el juego original):** se hace clic (o se toca,
  en el celular) directamente sobre las amenazas y el jefe. Sin mira ni letras,
  con los tiempos originales.
- **Jugar con mando:** se mueve una mira y se ataca con la letra A, B, X o Y que
  lleva cada enemigo, usando el teléfono como mando o el teclado.
- **2 jugadores:** cooperativo con dos miras (ver más abajo).

Si al iniciar desde el teléfono no hay sonido, haz clic en cualquier parte de la
PC o pulsa **Activar sonido** bajo el tablero: los navegadores solo dejan sonar el
audio después de una interacción en la página.

## Control desde el teléfono (modo con mando)

Esta versión permite jugar en la PC usando el teléfono como control. Pulsar
**INICIAR** en el teléfono arranca el modo con mando. Abre el
juego en la PC desde GitHub Pages (o desde un servidor HTTPS), escanea el QR de
la portada y espera a que ambos dispositivos indiquen que están conectados.
Mira el tablero en la PC y mueve la mira con el joystick del teléfono.
Apunta al enemigo y pulsa la letra (**A, B, X o Y**) que aparece encima de él.
La letra incorrecta no lo elimina. Puedes mantener el joystick con un dedo y atacar con otro.
El joystick es **flotante**: el centro es donde apoyas el pulgar (todo el lado
izquierdo del mando es zona táctil), así que no hace falta mirar el teléfono ni
buscar el círculo, y la mira empieza a moverse solo cuando desplazas el dedo.
Al soltar, cancelar el toque, ocultar la página o perder la conexión,
el movimiento se detiene. El mando también incluye escáner, inicio,
continuación, reintento y respuestas 1–4 (visibles durante las preguntas).

Los elementos conservan los **colores del juego original** según su tipo
(amenaza roja, crítica naranja, resistente morada, duplicador magenta,
reparación verde y archivo seguro azul). La letra de ataque de cada amenaza se
elige al azar. Los archivos seguros no tienen letra: atacarlos con cualquier
botón cuesta un servidor. La reparación se activa con A. Los resistentes requieren dos ataques correctos; los duplicadores
se dividen al recibir su letra correcta y cada hijo tiene su propia letra.

Los jefes requieren una combinación **en orden**, con pulsaciones separadas:
Troyano **A → B**, Botnet **X → Y → A**, Ransomware **B → X → A → Y**.
Cada combinación completa quita una vida al jefe; una letra incorrecta reinicia
la combinación. El progreso se muestra en la PC y el móvil. En Ransomware,
pulsa la última letra con el punto débil visible: si está cerrado, se conserva
el prefijo para que puedas esperar y completar el golpe apuntando al jefe.

En PC también puedes jugar con mouse o flechas para mover la mira y las teclas
**A, B, X, Y** para atacar. Un clic solo apunta, ya no elimina.
Los tiempos de vida normal son 7, 6 y 5.2 segundos por nivel para permitir
llegar con el joystick; los ciclos de los jefes son 10, 10 y 12 segundos.

La PC y el teléfono necesitan Internet. La conexión usa un canal temporal de
Supabase Realtime con un identificador aleatorio en el QR; se crea uno nuevo al
recargar la página de la PC. En el proyecto de Supabase debe estar habilitado
**Realtime → Allow public access to channels**. El QR antiguo, que solo abría
otra copia del juego en el móvil, se reemplazó por el QR de control.

Archivos nuevos: `remote-host.js` recibe las pulsaciones en la PC;
`control.html`, `control.css` y `control.js` muestran el mando del teléfono.
Si se publica en otro repositorio de GitHub Pages, el QR usa automáticamente
la dirección de esa nueva publicación.

Videojuego web de ciberseguridad hecho con HTML, CSS, JavaScript y Phaser 3
(cargado por CDN). No requiere servidor, base de datos ni instalación.

## Historia y objetivo

Una red informática está siendo atacada por malware. El jugador forma parte
del equipo de respuesta: debe detectar y eliminar las amenazas reales antes
de que dañen los servidores, evitando los falsos positivos, y finalmente
derrotar al jefe de cada nivel para proteger el sistema.

## Modo 2 jugadores (cooperativo)

En la portada, el botón **2 jugadores** inicia una partida cooperativa en la
misma pantalla: aparecen dos miras (J1 azul y J2 amarilla) que defienden los
mismos servidores. Cada jugador puede usar un teléfono o el teclado:

- **J1:** mouse o flechas para mover y teclas **A, B, X, Y** para atacar, o un teléfono.
- **J2:** teclas **I, J, K, L** para mover y **7, 8, 9, 0** (= A, B, X, Y) para
  atacar, o un teléfono.

Ambos teléfonos escanean el mismo QR: el primero que se conecta es J1 y el
segundo J2 (se puede cambiar con el botón "Cambiar a J2/J1" del mando). La
combinación de los jefes es compartida, así que J1 puede pulsar una letra y J2
la siguiente. Los puntos se suman al equipo y además se lleva el marcador de
cada jugador (se muestra bajo el tablero y al final de cada nivel). El escáner
y los servidores son compartidos. "Volver a intentar" conserva el modo elegido.

Para que dos jugadores sigan teniendo reto, en este modo los **jefes tienen 50%
más de vida** (Troyano 5, Botnet 8, Ransomware 12; el Ransomware pasa a su fase
rápida a la mitad) y cabe **un elemento más** en pantalla a la vez. El modo de
1 jugador no cambia.

## Amenazas y elementos

En el tablero pueden aparecer varios elementos a la vez (hasta 2, 3 o 4 según
el nivel), algunos quietos y otros en movimiento lento que rebota dentro del
área de juego. Cada tipo tiene su propio ícono, color y comportamiento; la letra
de ataque se elige al azar:

| Tipo | Color / letra | Ataques | Puntos | Detalle |
|---|---|---|---|---|
| Malware normal | Rojo · A / B / X / Y | 1 | 10 | Ícono de alerta (triángulo). |
| Malware crítico | Naranja · A / B / X / Y | 1 | 20 | Ícono de rayo; desaparece más rápido que el normal. |
| Malware resistente | Morado · A / B / X / Y | 2 | 15 | Ícono de "bug"; el primer ataque correcto rompe el escudo, el segundo lo elimina. |
| Archivo seguro (falso positivo) | Azul, sin letra | — | — | Escudo con marca; **no hay que atacarlo**. Si se pulsa cualquier letra apuntándolo, se pierde un servidor y aparece "Falso positivo". Si expira solo, no pasa nada. |

Cada amenaza real dibuja una línea tenue hacia el servidor que está
"atacando", para que el jugador sepa qué está en riesgo.

## Mecánicas adicionales

Desde el nivel 1 puede aparecer, además de las amenazas normales, un
elemento especial de **reparación**; desde el nivel 2 se suma el **malware
duplicador**. Ambos usan el mismo círculo y las reglas de apuntar y atacar
que el resto de elementos.

| Mecánica | Nivel | Color | Detalle |
|---|---|---|---|
| Reparación de servidor | 1, 2 y 3 | Verde / A (cruz, etiqueta "REPARACIÓN") | Solo aparece si al menos un servidor está fuera de línea, como máximo **una vez por nivel**. Apuntar y pulsar A recupera un servidor caído; no entrega puntos ni cuenta como amenaza eliminada. Si expira, no hay penalización. |
| Malware duplicador | 2 y 3 | Magenta · A / B / X / Y (ícono de división; el escáner revela "DUPLICADOR") | Al pulsar su letra correcta, se **divide en dos amenazas pequeñas** (5 puntos cada una, con la misma duración de vida). Si una o ambas escapan, solo se pierde **un servidor** por esa pareja. |
| Sobrecarga de red | 2 y 3 | Aviso "SOBRECARGA DE RED" | Se activa **una sola vez por nivel**, al llegar aproximadamente a la mitad del objetivo de amenazas. Durante 5 segundos los elementos aparecen con más frecuencia y se permite un elemento simultáneo más de lo normal; al terminar, todo vuelve exactamente a la velocidad y el máximo originales. Nunca se activa durante el combate contra el jefe, y se cancela automáticamente si el jefe aparece antes de que termine. |

## Combo

Eliminar amenazas reales de forma consecutiva aumenta un contador de combo
que multiplica los puntos obtenidos:

- 0 a 2 aciertos seguidos: multiplicador **x1**.
- 3 a 5 aciertos seguidos: multiplicador **x2**.
- 6 o más aciertos seguidos: multiplicador **x3** (máximo).

El combo se reinicia a 0 si una amenaza real escapa sin ser eliminada o si
el jugador ataca un archivo seguro. El multiplicador **no** se aplica
a los puntos que entregan los jefes de nivel.

## Sistema de vidas: tres servidores

En vez de un contador de vidas simple, el jugador protege tres servidores
mostrados en la parte inferior del tablero:

- **Servidor Web**
- **Base de Datos**
- **Servidor de Respaldo**

Cada uno puede estar **en línea** (verde), **bajo ataque** (parpadeo
naranja, el instante en que está por caer) o **fuera de línea** (rojo).
Cuando una amenaza real escapa o el jugador toca un falso positivo, se
desactiva un servidor activo al azar (nunca uno que ya esté caído). Si los
tres quedan fuera de línea, aparece la pantalla de derrota.

## Escáner

Botón "ESCÁNER" en la esquina del tablero, también activable con la tecla
**S**. Cada nivel da **2 usos**. Al activarlo, durante 2 segundos:

- Ralentiza el movimiento de los elementos activos (y el del jefe, si se
  está desplazando).
- Ralentiza también el tiempo que les queda antes de expirar.
- Muestra una etiqueta "AMENAZA" o "SEGURO" sobre cada elemento.

No elimina nada ni entrega puntos: es solo una ayuda para identificar qué
tocar. Las cargas se restauran al iniciar cada nivel.

## Jefes de nivel

Al eliminar la cantidad de amenazas reales requerida en el nivel, se
detiene la generación de elementos normales, se retiran los que queden en
pantalla (sin penalizar al jugador) y aparece el jefe. El nivel solo se
considera superado cuando el jefe es derrotado.

- **Nivel 1 — Troyano** (naranja): 3 golpes, casi fijo en el centro, ciclo
  de ataque de 10s, recompensa 50 pts.
- **Nivel 2 — Botnet** (azul/morado): 5 golpes, cambia de posición tras
  cada golpe, genera hasta 1 falso positivo a la vez, ciclo de ataque de
  10s, recompensa 100 pts.
- **Nivel 3 — Ransomware** (rojo/magenta): 8 golpes, se desplaza
  lentamente y solo recibe daño al completar la combinación mientras el
  punto débil esté visible, genera hasta 2 falsos positivos, entra en una fase más
  rápida y agresiva al perder 4 puntos de vida, ciclo de ataque de 12s,
  recompensa 200 pts. Al derrotarlo se muestra la victoria final.

Cada jefe tiene nombre, barra de vida, anillo de tiempo, un breve período de
protección tras cada golpe (para no registrar varias pulsaciones como si fueran
distintos) y, si el jugador no llega a tiempo en un ciclo de ataque, pierde
un servidor pero el jefe conserva todo el daño ya recibido.

## Niveles y dificultad progresiva

| Nivel | Amenazas | Aparición | Máximo | Movimiento | Vida normal | Seguros | Críticos | Resistentes | Duplicadores |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 10 | 1800 ms | 2 | 15% | 7000 ms | 15% | 8% | 0% | 0% |
| 2 | 15 | 1100 ms | 3 | 50% | 6000 ms | 25% | 15% | 13% | 14% |
| 3 | 25 | 800 ms | 5 | 75% | 5200 ms | 30% | 18% | 17% | 20% |

Primero se decide si el elemento es seguro. Los porcentajes de críticos,
resistentes y duplicadores se aplican después entre los elementos peligrosos;
por eso no se suman directamente al porcentaje de seguros.

Además, en niveles más altos aumenta la probabilidad de malware crítico y
resistente, y la velocidad de los elementos móviles. La dificultad sube de
forma progresiva pero el juego sigue siendo completable en los tres niveles.

## Controles

- **Modo normal (PC o celular):** clic o toque sobre la amenaza; tecla **S**
  para el escáner.
- **Modo con mando en la computadora:** mouse o flechas para mover la mira;
  **A, B, X, Y** para atacar con la letra del enemigo; tecla **S** para el escáner.
- **Modo con mando directo en el celular:** toca el enemigo para apuntarle y
  luego pulsa su letra en los botones **A, B, X, Y** que aparecen bajo el tablero.
- **Celular como mando:** escanea el QR de la PC y usa el joystick y los
  botones **A, B, X, Y**. Mira el juego en la PC.
- **Jugador 2 (modo 2 jugadores):** **I, J, K, L** para mover y **7, 8, 9, 0**
  para atacar, o un segundo teléfono.

## Victoria y derrota

- **Derrota:** los tres servidores quedan fuera de línea → pantalla de
  derrota con la puntuación y botón "Volver a Intentar".
- **Victoria:** se derrota al jefe del nivel 3 → pantalla de victoria con
  la puntuación final, registro opcional de gamertag, clasificación global
  con los 10 mejores resultados y botón "Volver a Intentar". El último
  gamertag se recuerda en el mismo navegador para las partidas siguientes.

## Tecnologías

- HTML5 / CSS3 (diseño oscuro verde-azul-rojo, responsive, logo hecho solo
  con CSS).
- JavaScript (ES6) para toda la lógica del juego.
- **Phaser 3** (CDN): dibuja el tablero, el HUD, los servidores, los
  elementos y los jefes (todo con formas vectoriales, sin emojis ni
  imágenes), y gestiona la mira y los ataques por letra.
- **Web Audio API**: sonidos generados en el navegador (acierto, error,
  combo, escudo roto, servidor perdido, alerta de jefe, nivel superado,
  victoria y derrota), sin archivos de audio externos.
- **Supabase REST API**: almacena y consulta la clasificación global usando
  una clave publicable y políticas Row Level Security.

## Generación procedural

Cada elemento nuevo se genera con posición aleatoria dentro del área de
juego, con su tipo decidido por las probabilidades del nivel actual
(`NIVELES` en `game.js`: probabilidad de falso positivo, de malware crítico
y de resistente), y con o sin movimiento según esas mismas probabilidades.
El intervalo de aparición, el tiempo de vida y el máximo de elementos
simultáneos también dependen del nivel, por lo que cada partida es distinta.

## Archivos

- `index.html` — estructura de las pantallas y el botón del escáner.
- `style.css` — estilos, animaciones y diseño responsive.
- `game.js` — lógica del juego, escena de Phaser, jefes, servidores, combo
  escáner y clasificación global (comentado en español).
- `SUPABASE_SETUP.sql` — crea la tabla de puntuaciones y sus permisos seguros.

## Preparar la clasificación global

1. Abre el proyecto en el panel de Supabase.
2. Entra a **SQL Editor → New query**.
3. Copia todo el contenido de `SUPABASE_SETUP.sql` y pulsa **Run**.
4. Confirma en **Table Editor** que exista la tabla `puntuaciones`.

El juego usa solamente la URL y la clave publicable del proyecto. Nunca se
debe incluir una clave `sb_secret_`, `service_role` ni la contraseña de la
base de datos en estos archivos.

## Ejecutar localmente

Abre `index.html` en el navegador, o sirve la carpeta con:

```bash
python -m http.server 8000
```

y visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Sube `index.html`, `style.css`, `game.js`, `remote-host.js`, `control.html`,
   `control.css`, `control.js` y este `README.md` a la raíz de
   un repositorio de GitHub.
2. En **Settings → Pages**, elige la rama `main` y la carpeta `/root`.
3. Guarda: GitHub generará una URL pública tipo
   `https://tu-usuario.github.io/tu-repositorio/`.

## Integrantes

| # | Nombre |
|---|--------|
| 1 | Cesar del Angel |
| 2 | Jean Barrera |

## Enlace público

https://cesarau90.github.io/videojuego/
