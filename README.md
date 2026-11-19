# La Rosada

Una carrera política argentina, del barrio a la Casa Rosada.

**Jugar:** https://larosada.vercel.app (beta)

La Rosada es un simulador de carrera política, por turnos. Arrancás como militante a los 18 años, formás tus ideas y, desde los 35, te presentás a elecciones. Podés llegar de concejal a presidente y retirarte alrededor de los 65. Al final te queda un Poder Histórico que mide lo que dejaste. El tono es serio, de simulación, y los textos están en castellano rioplatense.

## Cómo se juega

- **Armás tu personaje:** origen, estilo, carta de arranque, ideas y provincia.
- **Militancia (18 a 35 años):** cuatro decisiones que forman tu postura política.
- **Carrera:** cada carta te lleva hasta la próxima elección, que llega cada cuatro años. En el medio aparecen eventos, causas judiciales, favores, coimas y cierres de listas.
- **Elecciones:** interna, campaña y noche electoral. Hay tres minijuegos:
  - el debate, para gobernador y presidente;
  - la fiscalización de las mesas, cuando la elección está peleada;
  - la rosca en el Congreso, para sacar leyes sin mayoría.
- **Presidencia:** gobernás el país (inflación, actividad y reservas), enfrentás crisis y te pueden hacer juicio político.
- **Final:** retiro, salud, cárcel, exilio o destitución. Queda tu palmarés y un top 10 de tus mejores carreras.

Una carrera tiene unas 30 decisiones y dura alrededor de 10 minutos.

Los partidos y los bloques son ficticios. Algunos personajes están inspirados en figuras públicas, pero tienen otro nombre y el guion nunca les atribuye delitos: lo que pase con cada uno lo decide la partida.

## Tecnología

- TypeScript en modo estricto y [Vite](https://vite.dev).
- Sin frameworks: las pantallas son HTML armado desde TypeScript, con CSS propio y SVG hecho a mano. El sonido se genera con la Web Audio API.
- Todo corre en el navegador: no hay servidor, cuentas ni base de datos. La partida se guarda en el `localStorage` de cada jugador y no se junta ningún dato.
- El motor es inmutable y usa azar con semilla: la misma semilla da la misma partida.
- Pruebas con [Vitest](https://vitest.dev) y [Playwright](https://playwright.dev). Formato y reglas de código con [Biome](https://biomejs.dev).
- Publicado en Vercel como sitio estático, con encabezados de seguridad (CSP y otros) en `vercel.json`.

## Para correrlo

Hace falta Node.js 22 o más nuevo.

```sh
npm install
npm run dev          # servidor de desarrollo
npm run verificar    # tipos, reglas de código y pruebas del motor
npm run e2e          # pruebas en el navegador (la primera vez: npx playwright install chromium)
npm run build        # compila a dist/
```

## Documentación

- [Arquitectura](docs/arquitectura.md): las capas del código, cómo fluye el estado y dónde está cada cosa.
- [Diseño](docs/diseno.md): las reglas del juego, con sus números y el porqué.
- En `docs/` también están las propuestas y los análisis de equilibrio que llevaron a las reglas actuales.

## Estado

Beta. Las reglas y los números todavía se están ajustando.
