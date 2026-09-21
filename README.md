# 🛡️ Elimina el Malware

Videojuego web de ciberseguridad hecho con HTML, CSS, JavaScript y Phaser 3
(cargado por CDN). No requiere servidor, base de datos ni instalación.

## Historia y objetivo

Una red informática está siendo atacada por malware. El jugador debe eliminar
los virus antes de que dañen el servidor. El objetivo es superar los 3
niveles y proteger el sistema.

## Mecánica

- Los virus (🦠) aparecen en posiciones y momentos aleatorios.
- Clic o toque sobre un virus antes de que desaparezca = **+10 puntos**.
- Virus no eliminado a tiempo = **-1 vida**.
- El jugador inicia con **3 vidas**.
- La pantalla muestra siempre: puntuación, vidas, nivel y progreso de virus.

## Niveles

1. **Nivel 1:** eliminar 10 virus, aparición lenta.
2. **Nivel 2:** eliminar 15 virus, aparición más rápida.
3. **Nivel 3:** eliminar 20 virus, aparición todavía más rápida.

## Controles

Mouse (clic) en computadora, o toque directo en pantallas táctiles.

## Victoria y derrota

- **Derrota:** se pierden las 3 vidas → pantalla de derrota con puntuación y
  botón "Volver a Intentar".
- **Victoria:** se completan los 3 niveles → pantalla de victoria con
  puntuación final y botón "Volver a Intentar".

## Tecnologías

- HTML5 / CSS3 (diseño oscuro verde-azul-rojo, responsive, logo hecho solo
  con CSS).
- JavaScript (ES6) para la lógica del juego.
- **Phaser 3** (CDN): dibuja el área de juego, los virus, las animaciones y
  gestiona los clics sobre cada virus.
- **Web Audio API**: sonidos generados en el navegador (eliminar virus,
  perder vida, ganar nivel, victoria y derrota), sin archivos de audio.

## Generación procedural

Cada virus nuevo se genera con posición aleatoria (`Phaser.Math.Between`)
dentro del área de juego, y con un emoji/color aleatorio. El intervalo de
aparición y el tiempo de vida de cada virus dependen del nivel actual
(`NIVELES` en `game.js`), por lo que cada partida es distinta.

## Archivos

- `index.html` — estructura de las pantallas.
- `style.css` — estilos y diseño responsive.
- `game.js` — lógica del juego y escena de Phaser (comentado en español).

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
