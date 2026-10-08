# Elimina el Malware

La versión principal está en la raíz de este repositorio. La carpeta
`videojuego-control-remoto/`, si está presente, es una copia anterior; no se
sincroniza ni debe usarse como fuente para publicar los cambios actuales.

## Modos de juego

En la portada hay cinco botones y un selector de dificultad:

- **Iniciar defensa — modo normal (el juego original):** se hace clic (o se toca,
  en el celular) directamente sobre las amenazas y el jefe. Sin mira ni letras,
  con los tiempos de la dificultad elegida.
- **Jugar con mando:** se mueve una mira y se ataca con la letra A, B, X o Y que
  lleva cada enemigo, usando el teléfono como mando o el teclado.
- **2 jugadores:** cooperativo con dos miras (ver más abajo). Al elegirlo aparece
  una **sala de espera** con el QR: la partida empieza sola (con una cuenta atrás
  de 3 s) cuando los dos teléfonos están conectados. Con **Empezar ya** se salta la
  espera y se juega con el teclado.
- **Teclado + mouse:** dos jugadores en la misma PC, sin teléfono: uno con el lado
  izquierdo del teclado y otro con el mouse (ver más abajo).
- **Mando + mouse:** uno usa un teléfono con joystick y A/B/X/Y; el otro hace
  clic en las amenazas desde la PC. La sala espera un solo teléfono.

## Dificultad

Antes de iniciar, elige **Fácil**, **Medio** o **Difícil**. La selección se guarda
si el navegador permite almacenamiento y se conserva al reintentar, en los cinco modos.

| Dificultad | Tiempo de las amenazas | Aparición | Velocidad | Elementos simultáneos | Vida del jefe | Tiempo para su ataque | Escáner por nivel |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fácil | +30% | Intervalo +20% | −25% | Uno menos (mínimo 1) | −25% | +25% | 3 |
| Medio | Original | Original | Original | Original | Original | Original | 2 |
| Difícil | −20% | Intervalo −15% | +25% | Uno más | +25% | −15% | 1 |

En fácil, los objetivos son **10, 15 y 20 amenazas** por nivel; en medio y
difícil siguen siendo **10, 15 y 25**. Al alcanzar el objetivo aparece el jefe.

Los valores se calculan sobre cada nivel; las vidas del jefe se redondean.
Los ajustes cooperativos se añaden a la dificultad elegida. En fácil, si solo
quedan archivos seguros azules, el siguiente turno de generación produce una
amenaza real. Para evitar que los azules bloqueen la partida, ese caso permite
un único espacio adicional; cuando ya hay una amenaza, rige el límite habitual.

**Sonido:** los navegadores solo dejan sonar el audio después de un clic o una
tecla en la página de la PC. Si vas a iniciar desde el teléfono, haz **un clic en
cualquier parte de la PC** antes: la portada avisa "Sonido desactivado" (con un
botón **Activar sonido**) y el mando mantiene INICIAR bloqueado, con la
indicación, hasta que el sonido esté activo. Así suena desde el primer segundo.
Si el navegador vuelve a pausarlo durante la partida, pulsa **Activar sonido**
bajo el tablero.

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
buscar el círculo, y la mira empieza a moverse solo cuando desplazas el dedo. Necesita menos
recorrido del pulgar para acelerar y responde mejor a inclinaciones medias.
La velocidad máxima del joystick es de 840 px/s (antes 600); al apuntar a un
enemigo conserva el 70% para afinar sin quedarse demasiado lenta. Las teclas
de movimiento mantienen su velocidad anterior.
El mando no hace zoom aunque se toque muchas veces o con dos dedos. Si aun así
la pantalla queda ampliada, se puede deshacer pellizcando, se corrige sola y,
como último recurso, aparece un botón **Quitar zoom**.
Al soltar, cancelar el toque, ocultar la página o perder la conexión,
el movimiento se detiene. También se detiene al girar o redimensionar el
teléfono. El mando incluye escáner, inicio,
continuación, reintento y respuestas 1–4 (visibles durante las preguntas).

El mando se adapta a vertical y horizontal. En teléfonos en horizontal
con hasta **600 px de alto**, el joystick queda a la izquierda, A/B/X/Y
a la derecha y los avisos, la combinación del jefe y las respuestas en
el centro. Las tabletas con mayor altura mantienen la distribución amplia
original. La cabecera y las acciones son compactas. En horizontal A/B/X/Y
se organizan en dos filas (Y/B arriba, X/A abajo), con botones de al menos
64×64 px; en 568×320 alcanzan 72×72 px y en 844×390, 106×106 px.
Las combinaciones
pueden ocupar varias filas. Se respeta el espacio de las muescas y la
barra del sistema (`safe-area-inset-*`) y el alto visible (`100dvh`, con
respaldo `100vh`). Si la pantalla es demasiado baja, se puede desplazar
verticalmente para acceder a todo.

Para revisar el diseño, probar 568×320, 667×375, 740×360, 844×390 y
932×430, además de vertical, con jefe, avisos largos, preguntas y 2
jugadores. Comprobar que no haya scroll horizontal y que girar mientras
se usa el joystick deje la mira en reposo.

Los elementos conservan los **colores del juego original** según su tipo
(amenaza roja, crítica naranja, resistente morada, duplicador magenta,
reparación verde y archivo seguro azul). La letra de ataque de cada amenaza se
elige al azar. Los archivos seguros no tienen letra: atacarlos con cualquier
botón cuesta un servidor. La reparación se activa con A. Los resistentes requieren dos ataques correctos; los duplicadores
se dividen al recibir su letra correcta y cada hijo tiene su propia letra.

Los jefes requieren una combinación **en orden**, con pulsaciones separadas:
el Troyano pide 2 letras, la Botnet 3 y el Ransomware 4. **Las letras se
sortean** cuando aparece el jefe y cambian después de cada golpe, así que no
se pueden memorizar (nunca hay dos letras iguales seguidas).
Cada combinación completa quita una vida al jefe; una letra incorrecta reinicia
el progreso de la misma combinación. Se muestra en la PC y el móvil, y cuando
cambia, las letras dan un pequeño latido. En Ransomware,
pulsa la última letra con el punto débil visible: si está cerrado, se conserva
el prefijo para que puedas esperar y completar el golpe apuntando al jefe.

En PC también puedes jugar con mouse o flechas para mover la mira y las teclas
**A, B, X, Y** para atacar. Un clic solo apunta, ya no elimina.
En dificultad media, los tiempos de vida normal son 7, 6 y 5.2 segundos por nivel para permitir
llegar con el joystick; los ciclos de los jefes son 10, 10 y 12 segundos.

La PC y el teléfono necesitan Internet. La conexión usa un canal temporal de
Supabase Realtime con un identificador aleatorio en el QR; se crea uno nuevo al
recargar la página de la PC. En el híbrido la sala admite un teléfono; en los demás modos, como máximo dos. Si
otro teléfono intenta entrar cuando está llena, muestra un aviso y sus controles quedan bloqueados.
Puede entrar automáticamente cuando se libere un puesto; los teléfonos que
dejan de enviar mensajes durante más de 7 segundos liberan su puesto.
En el proyecto de Supabase debe estar habilitado
**Realtime → Allow public access to channels**. El QR antiguo, que solo abría
otra copia del juego en el móvil, se reemplazó por el QR de control.

Archivos nuevos: `remote-host.js` recibe las pulsaciones en la PC;
`control.html`, `control.css` y `control.js` muestran el mando del teléfono;
`sin-zoom.js` evita y corrige el zoom accidental en el teléfono (mando y juego).
Si se publica en otro repositorio de GitHub Pages, el QR usa automáticamente
la dirección de esa nueva publicación.

Videojuego web de ciberseguridad hecho con HTML, CSS, JavaScript y Phaser 3
(cargado por CDN). El juego base no requiere instalación ni servidor de
aplicación. El mando remoto y la clasificación global usan Supabase.

## Historia y objetivo

Una red informática está siendo atacada por malware. El jugador forma parte
del equipo de respuesta: debe detectar y eliminar las amenazas reales antes
de que dañen los servidores, evitando los falsos positivos, y finalmente
derrotar al jefe de cada nivel para proteger el sistema.

## Modo 2 jugadores (cooperativo)

En la portada, el botón **2 jugadores** prepara una partida cooperativa en la
misma pantalla: aparecen dos miras (J1 azul y J2 amarilla) que defienden los
mismos servidores. Primero se abre una **sala de espera** con el QR, donde cada
jugador ve si su teléfono ya está conectado; cuando están los dos, una cuenta atrás
de 3 segundos y la partida empieza sola (si uno se va antes, la cuenta se cancela).
**Empezar ya** salta la espera y **Volver** regresa a la portada; "Volver a
intentar" no vuelve a esperar. Cada jugador puede usar un teléfono o el teclado:

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
más de vida** (en dificultad media: Troyano 5, Botnet 8, Ransomware 12; el Ransomware pasa a su fase
rápida a la mitad) y cabe **un elemento más** en pantalla a la vez. Estos ajustes se suman a la dificultad seleccionada.

## Modo mando + mouse (híbrido)

Elige la dificultad y pulsa **Mando + mouse**. Escanea el QR con un solo teléfono:
la partida comienza tras una cuenta atrás de tres segundos. **Empezar ya** permite
usar flechas y A/B/X/Y en lugar del teléfono.

- **MANDO:** mueve la mira con el joystick y pulsa la letra del enemigo. Contra el
  jefe, completa la combinación mostrada.
- **MOUSE:** hace clic directamente en las amenazas o en el jefe. El mouse no mueve
  la mira del mando. En Ransomware hay que pulsar su punto débil cuando esté visible.

Ambos pueden atacar las mismas amenazas; no toquen los archivos seguros. Comparten
servidores, objetivo, escáner y puntuación del equipo, con un marcador para cada uno.
El jefe tiene 50% más de vida y cabe un elemento más, como en el cooperativo de dos
mandos. La combinación se renueva tras cada golpe del jefe, también con mouse.
Su recompensa y el bono de la pregunta se reparten entre ambos.
Si el teléfono se desconecta, escanea de nuevo el QR o pulsa **Conectar teléfono**
en la PC. Reintentar conserva el modo y la dificultad.

## Modo teclado + mouse (2 jugadores en la misma PC)

Pensado para dos personas frente a una sola computadora, sin teléfono: una usa el
**lado izquierdo del teclado** y la otra el **mouse**. Los enemigos se reparten:

- Unos muestran una **tecla** encima (Q, W, E, R, A, D, F, Z, X, C o V). El jugador
  del teclado solo tiene que pulsarla; no hay que apuntar.
- Los que **no muestran tecla** (llevan un pequeño mouse dibujado) los elimina el
  jugador del mouse con un clic.
- Los archivos seguros (azules, marcados "SEGURO") no los toca nadie: un clic en uno
  cuesta un servidor, como siempre.
- En los **jefes**, el teclado abre el escudo completando una combinación de teclas y,
  mientras está abierto, el mouse tiene unos segundos para golpearlo con un clic.
  Hacen falta los dos en cada golpe.

Cada jugador lleva su marcador (TECLADO y MOUSE) y la recompensa del jefe se reparte a
partes iguales. La tecla **S** sigue siendo el escáner, y la pregunta de seguridad se
responde con el mouse o con las teclas **1-4**. Cabe un enemigo más a la vez y salen un
poco más seguido; "Volver a intentar" conserva el modo.

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
**S**. Cada nivel da **3 usos en fácil, 2 en medio y 1 en difícil**. Al activarlo, durante 2 segundos:

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
- **Teclado + mouse (2 jugadores en la PC):** el teclado pulsa la tecla (lado
  izquierdo) que muestra cada enemigo; el mouse hace clic en los enemigos sin tecla.
  Tecla **S** para el escáner, **1-4** para la pregunta de seguridad.

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
- `SUPABASE_SETUP.sql` — crea la tabla y limita su lectura/escritura.
- `tests/regressions.cjs` — pruebas locales con DOM, reloj y canal simulados.

## Preparar la clasificación global

1. Abre el proyecto en el panel de Supabase.
2. Entra a **SQL Editor → New query**.
3. Copia todo el contenido de `SUPABASE_SETUP.sql` y pulsa **Run**.
4. Confirma en **Table Editor** que exista la tabla `puntuaciones`.

El juego usa solamente la URL y la clave publicable del proyecto. Nunca se
debe incluir una clave `sb_secret_`, `service_role` ni la contraseña de la
base de datos en estos archivos.

### Alcance del ranking

La clasificación actual es recreativa. La función SQL valida el formato del
gamertag y el rango del puntaje, y conserva el mejor registro, pero acepta
datos enviados por el navegador: no demuestra que se haya jugado una partida
ni reserva el gamertag a una persona. La clave publicable y el UUID de partida
no son mecanismos contra trampas. Recordar el nombre en localStorage es una
preferencia de este dispositivo, no una comprobación de identidad.

Para una clasificación competitiva se necesita un servicio que valide las
acciones y calcule el puntaje en el servidor, además de identificar al jugador;
solo ese servicio debería poder guardar resultados. Agregar validaciones en
JavaScript u ocultar la clave publicable no resuelve esta limitación.

## Verificar las correcciones

Con Node.js instalado, desde la raíz:

```bash
node --test tests/regressions.cjs
```

Las pruebas cubren continuación repetida, límites de nivel, cancelación de
transiciones al reiniciar, límite de dos mandos, reconexión/cambio de puesto,
aviso de sala llena, respuestas obsoletas del ranking y respuesta del joystick
(inclinación media, soltar, pérdida de mensajes y velocidad del teclado).
No contactan Supabase.
Para probar los dispositivos reales, abre dos mandos y un tercero: este último
debe quedar bloqueado; tras cerrar uno y esperar más de 7 segundos, debe entrar.

## Ejecutar localmente

Abre `index.html` en el navegador, o sirve la carpeta con:

```bash
python -m http.server 8000
```

y visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Sube `index.html`, `style.css`, `game.js`, `remote-host.js`, `control.html`,
   `control.css`, `control.js`, `sin-zoom.js` y este `README.md` a la raíz de
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
