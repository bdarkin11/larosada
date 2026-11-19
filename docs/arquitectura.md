# Arquitectura de La Rosada

Índice corto para orientarse antes de un cambio estructural. Las reglas de juego
y su porqué están en `diseno.md`; acá solo va **dónde está cada cosa y cómo fluye**.

## Capas

```
src/datos     tablas fijas (qué existe y cuánto vale). Sin lógica de estado.
src/motor     reglas puras: reciben una Carrera y devuelven otra. Sin DOM.
src/pantallas HTML de cada panel o capa (strings) + sus listeners.
src/main.ts   orquesta: elige qué panel mostrar, conecta botones, guarda.
src/ui.ts, src/sonido.ts, src/guardado.ts   utilidades de interfaz, audio y localStorage.
```

Regla: `datos` no importa de `motor`; `motor` no toca el DOM; las pantallas
llaman al motor y le pasan el resultado a `main.ts` para que guarde y redibuje.

## Flujo del estado

1. **Todo el estado es un objeto `Carrera`** (`motor/tipos.ts`, al final).
   Incluye el azar con semilla (`carrera.azar`, mulberry32 en `motor/azar.ts`):
   misma semilla, misma partida.
2. **Las funciones públicas del motor son inmutables**: hacen
   `const carrera = structuredClone(anterior)`, la modifican y la devuelven
   (`elegirCarta`, `resolverEvento`, `elegirCampania`, `hacerMovida`, `comprar`,
   `mudarseABuenosAires`, `retirarse`, `resolverDetencion`, `responderEntrevista`, `decidirPase`…).
   Las auxiliares internas (`aplicar`, `pasarAnio`, `anioDelPais`…) mutan la copia que reciben.
3. `carrera.cambios = diferencias(anterior, carrera)` deja los deltas para animar números.
4. `main.ts` recibe la carrera nueva → `guardarCarrera()` (localStorage
   `larosada.carrera`, formato versión 8; los campos nuevos son opcionales) → `pantallaCarrera()` redibuja.

## Un año de juego

`elegirCarta(carrera, i)` (`motor/carrera.ts`) aplica la carta y llama a `pasarAnio` (dos veces, salvo que el primer año deje algo para decidir), que en orden:

edad mueve atributos → fama se apaga / cargo da visibilidad → imagen vuelve al medio →
desgaste político y de ex presidente → `anioDelPais` → `anioDelDistrito` → `anioDelCongreso` →
`anioDeLasCrisis` → `anioDeLaCalle` → `efectoAnualDelPoder` → `aplicarCompras` (tienda) → construcción (`construccionReal`) → `anioDeLosDelfines` →
sueldo − `aporteAgrupacion` − `gastoDeEstructura` → `vencerMandato` → historial →
salud / muerte → balance cada 4 años (`pendientes`) → `avanzarJusticia` →
`generarPases` (cierre de listas) → `abrirEleccion` → `sortearEvento` → `sortearLey`
(si ya hay evento, la ley queda en `carrera.cola` y `resolverEvento` la pasa a `evento` al cerrar el anterior).

Lo que frena el año queda como campo de la carrera y `contenidoPrincipal()` en
`main.ts` lo muestra en este orden de prioridad:
`entrevista` → `detencion` → `pases` → `eleccion` → `evento` → (si no hay nada) base + armado.
Mientras haya `rosca`, el proyecto de ley sigue en `evento` y se muestra la mesa en lugar de la alerta.
La elección pasa por las fases `candidatura` → `interna` → `campania` → `debate` (solo cargos ejecutivos) → `fiscalizacion` → `escrutinio`.
`pendientes` (jura, etapa, balance) salen como capas de festejo (`pantallas/celebraciones.ts`).

## Eventos

- Definidos en `datos/eventos.ts`: arrays `ESPECIALES` (con alerta), `COMUNES`,
  `ESTADO` (solo presidente) y `CALLE` (huelgas); `EVENTOS` los junta, más `LEYES` de `datos/leyes.ts`.
  Cada `Opcion` tiene `resultado` (o `azaroso`), y opcionalmente `postura`, `etiquetas`, `pasiva`.
- `motor/eventos.ts`:
  - `sortearEvento`: la probabilidad depende de `pesoPolitico`; el presidente recibe
    `ESTADO`, con 'dolar' forzado si hay corrida; las huelgas salen con chance malestar/100.
  - `preverResultado`: lo que muestran los chips antes de elegir.
  - `resolverEvento`: aplica el resultado, el país, el malestar, la coherencia
    (`motor/promesas.ts`) y las promesas rotas, y devuelve un `Desenlace`.
- Pantallas: `pantallas/evento.ts` (común y alerta especial).

## Módulos

### src/motor
| Archivo | Qué hace |
|---|---|
| `tipos.ts` | Todos los tipos: `Carrera`, `Pais`, `EleccionEnCurso`, `Proceso`, `Pendiente`… |
| `azar.ts` | RNG con semilla: `chance`, `elegir`, `elegirPonderado`, `ruido`. |
| `ficha.ts` | Mover números: `aplicar`, `aplicarEfectos`, rendimientos decrecientes, etapas, construcción, `diferencias`. |
| `carrera.ts` | Nueva carrera, cartas de armado, `elegirCarta` y `pasarAnio`, mudanza, retiro, detención, desgaste. |
| `escala.ts` | Escala de la plata: costos y ganancias proporcionales (tope 40.000), sueldo, aporte a la agrupación, gasto de estructura. |
| `poder.ts` | Medidor de Poder: pisos, tendencia anual, impunidad, favores. |
| `eventos.ts` | Sorteo, previsión y resolución de eventos. |
| `promesas.ts` | Coherencia ideológica, malestar, promesas de campaña, ajustes por historia (edad presidencial 37). |
| `pais.ts` | Inflación, actividad y reservas mientras sos presidente. |
| `historico.ts` | Poder Histórico: `poderHistorico` (desglose y multiplicador) y `cargoMaximo`. Lo que se registra en la carrera va en `carrera.historico` vía `anotarHistorico` (ficha.ts). |
| `distrito.ts` | Intendentes y gobernadores: Cuentas y Gestión, coparticipación, presupuesto local, entrega y `notaDeGestion` (pesa en `ajustesDeHistoria`). |
| `delfines.ts` | Tus delfines: formarlos (`formarDelfin`), el año (`anioDeLosDelfines`: crecen, lealtad, traición), `moverDelfin` (eventos), `apoyoDeDelfines` (elecciones). |
| `caida.ts` | Cuándo llegan el juicio político y el pedido de renuncia (`eventoDeCaida`, primero en `sortearEvento`). |
| `crisis.ts` | Crisis del presidente: empiezan, pesan cada año, se cortan solas o con su decisión de salida (`cortaCrisis`). |
| `congreso.ts` | Bloque del presidente, presupuesto anual, legislativas de medio término, leyes aprobadas y la `cola` de eventos. |
| `elecciones.ts` | Candidaturas, internas, campaña, reparto de votos, balotaje, fin de mandato. |
| `pases.ts` | Ofertas de otros partidos en el cierre de listas. |
| `justicia.ts` | Causas, denuncias, avance judicial, movidas, decomiso. |
| `entrevista.ts` | Entrevistas en medios (reloj por pregunta y puntaje). |
| `formacion.ts` | Los años de militancia (18 a 35): `empezarFormacion` y `elegirFormacion`. La pantalla de armado la arranca. |
| `fiscalizacion.ts` | La noche de la general: arma mesas e incidentes, puntúa los envíos de fiscales y mueve los votos. `fiscalizar` y `saltearFiscalizacion` están en `elecciones.ts`. |
| `rosca.ts` | Negociar una ley sin mayoría: arma la mesa de bloques, los arreglos y la votación. Termina con `cerrarEvento` (`eventos.ts`). |
| `debate.ts` | Debate antes de la general (rondas, puntaje, Fama). `responderDebate` y `saltearDebate` están en `elecciones.ts`, porque terminan votando. |
| `tienda.ts` | Compras vigentes y sus bonos. |
| `balance.ts` | Escala de valor por opción y perfiles A–D para la prueba de equilibrio. |
| `pruebas-util.ts` | `despejar`: resuelve todo de forma neutra (solo tests). |

Tests: `*.test.ts` al lado de cada módulo. `simulacion.test.ts` y la tabla de
`balance.test.ts` se saltean salvo con `SIM=archivo` / `TABLA=archivo`.

### src/datos
| Archivo | Qué hay |
|---|---|
| `eventos.ts` | Todos los eventos (es el archivo más grande del motor; editarlo por partes). |
| `gestion.ts` | Decisiones de gestión de intendentes y gobernadores (mueven `distrito`). |
| `delfines.ts` | Eventos de delfines; `DELFIN_DEL_EVENTO` dice de qué delfín trata cada uno. |
| `caida.ts` | Juicio político y pedido de renuncia, con sus chances; un `Resultado` con `fin` termina la carrera. |
| `crisis.ts` | Las 4 crisis (cuándo empiezan, castigo anual) y sus eventos de salida (alerta `crisis`). |
| `leyes.ts` | Proyectos de ley del presidente (eventos con alerta `ley`) y `chanceLey`. Se suman a `EVENTOS`. |
| `cargos.ts` | Cargos, ámbito, forma de ganar, sueldos, gasto anual. |
| `partidos.ts` | Partidos y su posición en los dos ejes. |
| `promesas.ts` | Promesas de campaña, etiquetas y posturas. |
| `cartas.ts` | Cartas de armado, rarezas y magnitudes. |
| `armado.ts` | Origen, estilo y cartas de arranque del personaje. |
| `entrevistas.ts` | Medios y preguntas. |
| `formacion.ts` | Las cuatro etapas de militancia, lo que crece solo hasta los 35, y las edades de candidato y jubilación. |
| `rosca.ts` | Los bloques que se pueden negociar y qué pide cada uno. |
| `debates.ts` | Preguntas del debate (serias y chicanas) y qué respuesta le gana a cada una. |
| `tienda.ts` | Ítems de la tienda; el precio sale de lo que dan (`precioPorLoQueDa`). |
| `valor.ts` | Escala común de valor (3.000 dólares por punto) y `presencia` (la Fama + 20, donde antes se pedía Carisma). |
| `personajes.ts` | Elenco de políticos (nunca corruptos por guion). |
| `provincias.ts` | Jurisdicciones, población, nombres. |

### src/pantallas
| Archivo | Qué muestra |
|---|---|
| `armado.ts` | Creación del personaje. |
| `evento.ts` | Evento común, alerta especial y desenlace (chips). |
| `elecciones.ts` | Panel de elección, promesas, veredicto. |
| `rosca.ts` | La mesa de negociación de una ley. |
| `formacion.ts` | Las decisiones de los años de militancia. |
| `fiscalizacion.ts` | Las mesas en tiempo real (30 segundos) y su resultado. |
| `debate.ts` | Presentación, rondas con reloj y resultado del debate. |
| `escrutinio.ts` | Animación de la noche electoral. |
| `pases.ts` | Cierre de listas. |
| `poder.ts` | Capa del Poder (fuentes, promesas, calle, movidas). |
| `tienda.ts` | Capa de la tienda. |
| `celebraciones.ts` | Capas de jura, etapa y balance, con papelitos. |
| `retrato.ts` | Retrato SVG que envejece. |

### Raíz de src
- `main.ts`: pantallas de inicio, carrera y fin; tablero superior; atajos 1–3; noche electoral.
- `ui.ts`: `escapar`, `dolares`, `chip`, `caja`, `brujula`, `contarNumeros`, textos de ayuda.
- `estilos.css`: solo `@import` de `src/estilos/NN-tema.css`, en orden (el orden
  importa: la "piel" de 21 en adelante pisa reglas anteriores). Vite los junta en uno.
  Para cambiar algo: `grep -n selector src/estilos/` y editar ese módulo.
- `sonido.ts`, `guardado.ts`, `historicos.ts` (las 10 mejores carreras en localStorage).

## Comandos

Reglas de trabajo (cómo editar, qué correr antes de terminar): `CLAUDE.md` en la raíz.

- `python herramientas/reemplazar.py cambios.json`: varios reemplazos de una; cada texto
  tiene que aparecer una sola vez o no se toca ningún archivo.

- `npx tsc --noEmit`: tipos.
- `npx vitest run`: tests.
- `npm run lint`: Biome (reglas en `biome.json`; apagadas las de puro estilo que este código usa a propósito).
- `npm run verificar`: tipos + lint + tests, en ese orden. Correrlo antes de dar algo por terminado.
- `npm run e2e`: Playwright (`e2e/*.e2e.ts`, config en `playwright.config.ts`). Levanta su
  propio Vite en el puerto 5181 y usa un navegador limpio (no toca la partida del usuario).
  Cubre el armado del personaje y los atajos 1, 2 y 3. Correrlo si cambia `main.ts` o una pantalla.
- `npm run dev`: Vite (la configuración `larosada` del panel usa el puerto 5180).
