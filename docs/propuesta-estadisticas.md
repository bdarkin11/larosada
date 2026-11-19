# Propuesta: menos estadísticas (2026-11-08)

**Estado**: hecho. Lo que quedó, con los números calibrados, está en `diseno.md`
("Menos estadísticas"). Cambios respecto de esta propuesta: se sacaron las tres
cartas de Carisma y Aguante, y la salud resta 2,5 por año desde los 50.

Pedido del usuario: sacar las dos estadísticas que menos influyen, para que
gestionar las mejoras sea más fácil.

- **Territorio** absorbe **Aguante**.
- **Fama** absorbe **Carisma**.
- Se hace antes del paso 8.

Quedan tres atributos (Rosca, Territorio y Gestión) y los cinco medidores de
siempre (Fama, Imagen, Caja, Causas y Poder).

## Territorio (absorbe Aguante)

"Tu base en el barrio y tu resistencia."

- **Elecciones y construcción**: sigue pesando como hoy.
- **Salud**: el riesgo de que la salud termine la carrera pasa a depender del
  Territorio, que arranca más bajo que el Aguante (10 a 30 contra 60 a 80). La
  cuenta se ajusta para que se muera y se enferme a edades parecidas a las de
  hoy. Esto se calibra con la simulación.
- **Edad**: se gasta más tarde y más despacio que el Aguante:
  - antes de los 50, +0 a +1 por año;
  - de 50 a 65, se queda igual;
  - desde los 65, −1 a 0 por año.
- **Juicio político**: "Resistir" usa el Territorio en lugar del Aguante.
- **Eventos y cartas** que daban Aguante: pasan a dar Territorio, escalados
  por lo que vale cada uno. El Aguante valía 0,5 por punto y el Territorio,
  1,3, así que +5 de Aguante pasa a +2 de Territorio.

## Fama (absorbe Carisma)

- **Elecciones**: el peso del Carisma se suma al de la Fama. La simulación
  ajusta los números para que lleguen a presidente más o menos los mismos que
  hoy (5 de 300).
- **Donde pedía Carisma**, pasa a pedir Fama, con umbrales nuevos porque la
  Fama suele estar más baja:
  - la entrevista (el bonus por Carisma 60 o más, el castigo por menos de 25);
  - "Defenderte en el Congreso" en el juicio político;
  - las salidas de crisis y las decisiones de gestión que se jugaban con
    Carisma;
  - el debate del paso 8.
- **Desgaste por años en política**: deja de restar Carisma. Ya resta Fama e
  Imagen.
- **Eventos, cartas y armado** que daban Carisma: dan Fama, y como valen lo
  mismo (1 punto), van a la par.

## Las mejoras (tienda)

| Mejora | Hoy | Queda |
|---|---|---|
| 🩺 Médico personal | Aguante +1 por año y menos riesgo de salud | Solo menos riesgo de salud |
| 🎙️ Coaching de oratoria | Carisma +1 por año, durante dos años | Las entrevistas y el debate rinden más mientras dura |
| 🚐 Gira por los barrios | Territorio +1 y Construcción +2 | Igual |
| 🏖️ Vacaciones de verdad | Aguante +2 este año | Se saca: la salud ya la cubre el médico |
| 🏡 Casa en un country | Fama +4, Aguante +3, Causas +10 | Fama +4, Causas +10, precio más bajo |

Los precios del equipo y de los consumibles se recalculan solos con
`precioPorLoQueDa`.

## Rivales y perfiles de prueba

- **Rivales del elenco**: pierden Carisma y Aguante. Su Fama se ajusta para
  que lleguen a las elecciones con la misma fuerza que hoy.
- **Perfiles A a E de la prueba de equilibrio**: se actualizan, y la escala de
  valor (`valor.ts`) pierde las dos estadísticas.

## Partidas guardadas

El formato pasa a la versión 9. Las partidas en curso pierden el Carisma y el
Aguante sin compensación: ninguna de las dos se suma a otra estadística, para
no inflar ninguna. La tuya de Carolina Ojeda sigue andando.

## Cómo se verifica

- La prueba de equilibrio de los eventos tiene que pasar.
- La simulación de 300 carreras tiene que dar valores parecidos a los de hoy:
  - presidentes por cada 300 carreras;
  - edad típica al final por salud;
  - Poder Histórico típico;
  - Fama y Construcción por edad.
- `npm run verificar` y `npm run e2e`, y una prueba en el navegador.
