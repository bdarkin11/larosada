# La Rosada: reglas de trabajo

Juego de carrera política argentina, en castellano rioplatense con voseo.
Las reglas de juego están en `docs/diseno.md`.

## Antes de tocar

- Ante un cambio estructural, leer primero `docs/arquitectura.md`: qué hace cada
  módulo y cómo fluye el estado. Si la estructura cambia, actualizarlo.
- Trabajar paso a paso, con el visto bueno del usuario. Los cambios grandes se
  proponen primero (en `docs/`) y se implementan después.
- No commitear ni subir nada sin que el usuario lo pida.

## Cómo editar

- **Prohibido reescribir entero un archivo de más de 100 líneas.** Solo ediciones
  quirúrgicas: la herramienta Edit, o `python herramientas/reemplazar.py cambios.json`
  para muchos cambios juntos (cada texto tiene que aparecer una sola vez o no se toca nada).
- Si un cambio es demasiado complejo para un parche, decirle al usuario qué
  modificar a mano en Cursor en vez de reescribir.
- Los estilos están en `src/estilos/NN-tema.css` y el orden importa: buscar el
  selector con grep y editar ese módulo.

## Antes de dar algo por terminado

- `npm run verificar`: tipos, Biome y los tests de Vitest.
- `npm run e2e`: Playwright, si se tocó `main.ts` o una pantalla.
- Al probar en el panel del navegador (puerto 5180), copiar antes
  `localStorage['larosada.carrera']` y restaurarla al terminar: es la partida del usuario.

## Contenido

- Los personajes basados en gente real nunca son corruptos por guion.
