# Interprete

## Calculadora de ascenso de rango

`calculadora-ascenso-rango.html` carga el progreso desde `api/progreso-rango.json`
en la rama `main` de `Rockstar19/Interprete`, mediante la API de GitHub.
Publica juntos el HTML, `rango-modelo.js`, `rango-repositorio.js` y el JSON inicial.
No requiere backend ni archivos elegidos desde el disco.

Para guardar desde la página:

1. Abre **Acceso para guardar** e introduce un token de GitHub limitado a este
   repositorio, con permiso **Contents: lectura y escritura**.
2. Modifica los datos y pulsa **Guardar en GitHub**. Cada guardado crea un commit.
3. En otro dispositivo, abre la página o pulsa **Recargar datos**.

El token permanece en memoria en la pestaña, no se escribe en el repositorio
ni en el almacenamiento del navegador. Los datos guardados tienen la visibilidad
del repositorio y permanecen en su historial. No se guardan automáticamente:
la página avisa si intentas salir con cambios pendientes.

El guardado usa el SHA leído para evitar sobrescribir cambios de otro dispositivo.
Ante un conflicto, conserva lo ingresado en pantalla. Anota lo que quieras mantener
antes de recargar; la recarga solicita confirmar el reemplazo de los datos locales.
Un token vencido, una rama protegida o un límite de la API pueden impedir guardar.
Los permisos y el formato de la API se describen en la
[documentación de GitHub](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents).

El archivo inicial conserva los valores que venían en el HTML; no son datos
verificados de Propio. Antes de guardar, revisa los minutos, el promedio y el
número del último ciclo cerrado. Este número se conserva para que un cambio de
fecha no reasigne silenciosamente los datos a otros ciclos.

El simulador de satisfacción está inspirado en
[esta guía de la comunidad](https://www.reddit.com/r/spanishinterpreters/comments/1xbr2h9/my_guide_to_how_propios_average_satisfaction/).
Usa cuatro períodos (tres anteriores y actual), pondera por número de valoraciones
y calcula el efecto de retirar el más antiguo y las valoraciones de cinco estrellas
necesarias para una meta. Es una hipótesis comunitaria, no una política oficial.
La ventana de minutos de tres ciclos y los umbrales/tarifas preexistentes son
supuestos independientes que debes contrastar con tu panel de Propio.

Verificación sin dependencias: `node --test tests/rango.test.cjs`.
