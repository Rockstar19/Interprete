# Estilo del portal

Guía breve para mantener el mismo aspecto en el Centro de Interpretación.
Todo el texto visible de la interfaz va en español. No invente datos,
credenciales, testimonios ni contactos: use solo lo que ya existe.

## Principios

- Fondo de papel cálido, tinta azul noche y un solo acento verde profundo.
- Títulos en serif (`Fraunces`, con reserva Georgia). Texto de lectura y
  controles en sans (`Source Sans 3`, con reserva de sistema).
- Mucho aire, bordes suaves y sombras cortas.
- Contraste de texto al nivel AA de WCAG. El foco del teclado se ve siempre.
- Si el sistema pide menos movimiento, no hay desplazamientos al pasar el cursor.
- Rutas relativas (`css/estilo.css`, `index.html`) para que GitHub Pages siga sirviendo el sitio.

Los tokens viven en `:root` dentro de `css/estilo.css`. Llevan prefijo
(`--color-`, `--font-`, `--text-`, `--space-`, `--radius-`, `--shadow-`)
para no chocar con las variables de cada herramienta.

## Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-ink` | `#1a2332` | Tinta, encabezado |
| `--color-ink-soft` | `#3e4c5e` | Texto secundario |
| `--color-muted` | `#4e5d6c` | Notas y flechas en reposo |
| `--color-paper` | `#f3eee6` | Fondo de página |
| `--color-paper-raised` | `#fffcf8` | Tarjetas, campos, menú |
| `--color-line` | `#e3d9cb` | Bordes suaves |
| `--color-line-strong` | `#cdbfae` | Bordes de controles |
| `--color-accent` | `#0c5852` | Acento, enlaces, acción principal |
| `--color-accent-hover` | `#084640` | Estado hover del acento |
| `--color-accent-soft` | `#e4f2f0` | Fondo suave del acento |
| `--color-on-accent` | `#f7f4ee` | Texto sobre el acento |

## Tipografía

| Token | Valor |
| --- | --- |
| `--font-display` | Fraunces, luego Georgia y serif del sistema |
| `--font-body` | Source Sans 3, luego Segoe UI, Helvetica, Arial |
| `--text-xs` … `--text-display` | De 0.75rem al título de página |
| `--leading-tight` / `--leading-snug` / `--leading-body` | 1.08 / 1.35 / 1.6 |

Clases: `.portal-sobrelinea` (rótulo en versalitas), `.portal-titulo` (h1),
`.portal-muted` (texto más suave).

## Espacio, radio y sombra

| Token | Valor |
| --- | --- |
| `--space-1` … `--space-9` | 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4.5rem, 6rem |
| `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-pill` | 0.375rem, 0.75rem, 1.25rem, píldora |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | reposo, tarjeta elevada, acción principal |
| `--contenedor` | 70rem |
| `--duracion` | 180ms |

## Componentes

### Encabezado y pie

Mismo marcado en todas las páginas. El encabezado lleva la marca
«Centro de Interpretación», el enlace Inicio y el menú Herramientas.
El pie repite el título del portal y «Volver al inicio».

Clases: `.portal-header`, `.portal-footer`, `.portal-marca`, `.portal-nav`,
`.portal-menu`. En las herramientas, estos bloques se aíslan de los estilos
internos (`all: unset` y selectores con la clase del bloque).

### Botones

- `.btn` — base (enlace o `button`).
- `.btn-primario` — acción sólida, tamaño normal.
- `.btn-secundario` — acción con borde, sobre papel.
- `.btn-primario--destacado` — modificador de la acción principal.

`.btn-primario--destacado` se suma a `.btn` y `.btn-primario`. Ensancha el
control al 100% del contenedor, sube el título a la escala de display y lo
pinta con el acento. Es el botón más grande de la página. En el inicio lo
usa el enlace **Medidor de Ciclo** (`medidor-ciclo-interprete.html`),
colocado antes que el resto. Los demás enlaces de herramientas usan
`.btn-secundario`.

`.btn`, `.btn-primario` y `.btn-secundario` solo actúan dentro de
`body.portal` (el inicio y la plantilla). Así no cambian los botones que
ya usan la clase `.btn` en la Consola 911 y en el Panel MBIC. La clase
`.btn-primario--destacado` sí puede usarse en cualquier página.

```html
<a class="btn btn-primario btn-primario--destacado" href="medidor-ciclo-interprete.html">
  <span class="btn-primario__cuerpo">
    <span class="btn-primario__etiqueta">Principal</span>
    <span class="btn-primario__titulo">Medidor de Ciclo</span>
  </span>
  <span class="btn-primario__flecha" aria-hidden="true">→</span>
</a>
```

La etiqueta «Principal» puede llevar `aria-hidden="true"` si el nombre
accesible debe ser solo el título del enlace.

Dentro de `.portal-rejilla`, cada `.btn-secundario` se comporta como una
tarjeta menor: más baja, sin relleno de acento.

### Tarjetas, formulario y utilidades

- `.portal-tarjeta` — bloque con borde y sombra corta.
- `.portal-campo` — etiqueta que envuelve un `input`, `select` o `textarea`.
- `.portal-entrada` — campo suelto, con el mismo aspecto.
- `.portal-container` — ancho de lectura centrado.
- `.portal-pagina` — aire vertical del contenido.
- `.portal-stack` — columna con separación uniforme.
- `.portal-rejilla` — una columna en el móvil, dos desde 40rem, tres desde 64rem.
- `.portal-sr` — texto solo para lector de pantalla.
- `.portal-saltar` — enlace «Saltar al contenido», visible al recibir el foco.

## Nueva subpágina

1. Copie `plantilla.html` con un nombre en minúsculas y guiones, en la raíz del repositorio.
2. Cambie `<title>`, el `h1` y el contenido de `<main id="contenido">`.
3. Deje el `<link>` a `css/estilo.css` y el encabezado y el pie como están.
4. Si la página debe aparecer en el portal, añada el enlace en `index.html`
   y en la lista del menú Herramientas (encabezado de cada página y de la plantilla).
5. No use rutas que empiecen por `/`. Un archivo en la raíz se enlaza así:
   `href="css/estilo.css"`.
6. Las herramientas que ya existían conservan su contenido y su CSS interno.
   La hoja compartida se enlaza primero; el marco (encabezado y pie) usa
   clases propias para no cambiar los controles de cada herramienta.
   Si esa herramienta limita el ancho del `body`, el marco queda dentro
   de ese ancho.
