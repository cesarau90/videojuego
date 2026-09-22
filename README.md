# Elimina el Malware

Videojuego web de ciberseguridad hecho con HTML, CSS, JavaScript y Phaser 3
(cargado por CDN). No requiere servidor, base de datos ni instalación.

## Historia y objetivo

Una red informática está siendo atacada por malware. El jugador forma parte
del equipo de respuesta: debe detectar y eliminar las amenazas reales antes
de que dañen los servidores, evitando los falsos positivos, y finalmente
derrotar al jefe de cada nivel para proteger el sistema.

## Amenazas y elementos

En el tablero pueden aparecer varios elementos a la vez (hasta 2, 3 o 4 según
el nivel), algunos quietos y otros en movimiento lento que rebota dentro del
área de juego. Cada tipo tiene su propio ícono, color y comportamiento:

| Tipo | Color | Clics | Puntos | Detalle |
|---|---|---|---|---|
| Malware normal | Rojo | 1 | 10 | Ícono de alerta (triángulo). |
| Malware crítico | Naranja | 1 | 20 | Ícono de rayo; desaparece más rápido que el normal. |
| Malware resistente | Morado | 2 | 15 | Ícono de "bug"; el primer clic rompe su escudo exterior, el segundo lo elimina. |
| Archivo seguro (falso positivo) | Azul | — | — | Escudo con marca; **no hay que tocarlo**. Si se le da clic, se pierde un servidor y aparece "Falso positivo". Si expira solo, no pasa nada. |

Cada amenaza real dibuja una línea tenue hacia el servidor que está
"atacando", para que el jugador sepa qué está en riesgo.

## Mecánicas adicionales

Desde el nivel 1 puede aparecer, además de las amenazas normales, un
elemento especial de **reparación**; desde el nivel 2 se suma el **malware
duplicador**. Ambos usan el mismo círculo y las mismas reglas de clic/toque
que el resto de elementos.

| Mecánica | Nivel | Color | Detalle |
|---|---|---|---|
| Reparación de servidor | 1, 2 y 3 | Verde (ícono de cruz, etiqueta "REPARACIÓN") | Solo aparece si al menos un servidor está fuera de línea, como máximo **una vez por nivel**. Un clic recupera un servidor caído; no entrega puntos ni cuenta como amenaza eliminada. Si expira sin que le den clic, no hay penalización. |
| Malware duplicador | 2 y 3 | Magenta (ícono de división; el escáner revela "DUPLICADOR") | Al hacer clic, en vez de eliminarse se **divide en dos amenazas pequeñas** (5 puntos cada una, con la misma duración de vida). Si una o ambas escapan sin ser eliminadas, solo se pierde **un servidor** por esa pareja, nunca dos. |
| Sobrecarga de red | 2 y 3 | Aviso "SOBRECARGA DE RED" | Se activa **una sola vez por nivel**, al llegar aproximadamente a la mitad del objetivo de amenazas. Durante 5 segundos los elementos aparecen con más frecuencia y se permite un elemento simultáneo más de lo normal; al terminar, todo vuelve exactamente a la velocidad y el máximo originales. Nunca se activa durante el combate contra el jefe, y se cancela automáticamente si el jefe aparece antes de que termine. |

## Combo

Eliminar amenazas reales de forma consecutiva aumenta un contador de combo
que multiplica los puntos obtenidos:

- 0 a 2 aciertos seguidos: multiplicador **x1**.
- 3 a 5 aciertos seguidos: multiplicador **x2**.
- 6 o más aciertos seguidos: multiplicador **x3** (máximo).

El combo se reinicia a 0 si una amenaza real escapa sin ser eliminada o si
el jugador hace clic en un archivo seguro. El multiplicador **no** se aplica
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
  de ataque de 7s, recompensa 50 pts.
- **Nivel 2 — Botnet** (azul/morado): 5 golpes, cambia de posición tras
  cada golpe, genera hasta 1 falso positivo a la vez, ciclo de ataque de
  6s, recompensa 100 pts.
- **Nivel 3 — Ransomware** (rojo/magenta): 8 golpes, se desplaza
  lentamente y solo recibe daño en su punto débil (que aparece y
  desaparece), genera hasta 2 falsos positivos, entra en una fase más
  rápida y agresiva al perder 4 puntos de vida, ciclo de ataque de 5s,
  recompensa 200 pts. Al derrotarlo se muestra la victoria final.

Cada jefe tiene nombre, barra de vida, anillo de tiempo, un breve período de
protección tras cada golpe (para no registrar varios clics como si fueran
distintos) y, si el jugador no llega a tiempo en un ciclo de ataque, pierde
un servidor pero el jefe conserva todo el daño ya recibido.

## Niveles y dificultad progresiva

| Nivel | Amenazas reales | Elementos simultáneos | Se mueven | Vida de una amenaza normal | Vida de una crítica |
|---|---|---|---|---|---|
| 1 | 10 | hasta 2 | ~15% | 4.0 s | 3.0 s (75%) |
| 2 | 15 | hasta 3 | ~45% | 3.2 s | 2.4 s (75%) |
| 3 | 25 | hasta 5 | ~75% | 2.7 s | 2.025 s (75%) |

Además, en niveles más altos aumenta la probabilidad de malware crítico y
resistente, y la velocidad de los elementos móviles. La dificultad sube de
forma progresiva pero el juego sigue siendo completable en los tres niveles.

## Controles

- **Computadora:** clic del mouse sobre el elemento; tecla **S** para el
  escáner.
- **Celular / táctil:** toque directo sobre el elemento y sobre el botón
  "ESCÁNER".

## Victoria y derrota

- **Derrota:** los tres servidores quedan fuera de línea → pantalla de
  derrota con la puntuación y botón "Volver a Intentar".
- **Victoria:** se derrota al jefe del nivel 3 → pantalla de victoria con
  la puntuación final, registro opcional de gamertag, tabla con los 10
  mejores resultados y botón "Volver a Intentar". La tabla se conserva en
  el navegador mediante `localStorage`, sin cuentas ni servicios externos.

## Tecnologías

- HTML5 / CSS3 (diseño oscuro verde-azul-rojo, responsive, logo hecho solo
  con CSS).
- JavaScript (ES6) para toda la lógica del juego.
- **Phaser 3** (CDN): dibuja el tablero, el HUD, los servidores, los
  elementos y los jefes (todo con formas vectoriales, sin emojis ni
  imágenes), y gestiona los clics y toques.
- **Web Audio API**: sonidos generados en el navegador (acierto, error,
  combo, escudo roto, servidor perdido, alerta de jefe, nivel superado,
  victoria y derrota), sin archivos de audio externos.

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
  y escáner (comentado en español).

## Ejecutar localmente

Abre `index.html` en el navegador, o sirve la carpeta con:

```bash
python -m http.server 8000
```

y visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Sube `index.html`, `style.css`, `game.js` y este `README.md` a la raíz de
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
