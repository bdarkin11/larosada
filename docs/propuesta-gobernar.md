# Propuesta: paso 6, gobernar (2026-11-07)

Lo que ya está: el presidente tiene país (inflación, actividad, reservas), 14
decisiones de Estado, promesas, la calle, dos mandatos como máximo y desgaste de
ex presidente. Lo que falta del paso 6 según `diseno.md`: **leyes**, **crisis**,
**fin anticipado** y que **intendentes y gobernadores** también gobiernen.

Idea rectora: hoy el presidente decide solo. Gobernar en serio es **depender de
otros** (el Congreso, los gobernadores, la calle) y que los errores **se acumulen**
hasta poder tumbarte.

Se implementa en cuatro partes, cada una con su prueba y su commit:
6a Congreso y leyes → 6b crisis → 6c fin anticipado → 6d gobernar abajo.

---

## 6a. El Congreso y las leyes

### Tu bloque

- Al ganar la presidencia se arma tu **bloque propio** en Diputados (257) y en el
  Senado (72). Sale de tu porcentaje de votos más el peso de tu partido, con ruido.
  Típico: entre 90 y 140 diputados y entre 25 y 40 senadores.
- **Legislativas de medio término** (a los dos años de cada mandato): el bloque
  sube o baja según tu Imagen, cómo está el país y la calle. Es el gran examen
  del gobierno, y aparece como un evento con escrutinio corto.
- En la cabecera, una fila nueva: `Diputados 112/129 · Senado 31/37`.

### La agenda: una ley por año

Cada año de presidencia, antes del armado, elegís **qué ley mandás** de una lista
de unas 12, por ejemplo:

- **Presupuesto** (obligatorio todos los años). Si no sale, gobernás con el del año
  anterior: Poder −3 y la gestión se traba (menos efecto de las decisiones de Estado).
- Reformas: laboral, tributaria, previsional, educativa, del Estado, de la Justicia.
- Coyuntura: emergencia económica, ley de alquileres, régimen penal juvenil,
  acuerdo con el Fondo, privatizaciones o estatizaciones.

Cada ley tiene, como las decisiones de Estado: efectos en el país, en la Imagen y en
la calle, una **postura** (cuenta para la coherencia) y **etiquetas** (puede cumplir
o romper promesas). Si sale, además suma al **Poder Histórico** (paso 7).

### Conseguir los votos (la rosca)

Pantalla de votación con un **contador**: arrancás con tu bloque y te faltan N.
Para sumar, comprás apoyos a la vista, cada uno con su precio:

| Apoyo | Votos | Precio |
|---|---|---|
| Gobernadores aliados | muchos | obras: Reservas −3 y te deben favor |
| Bloque aliado | algunos | Poder −3 |
| Díscolos de la oposición | pocos | un favor que te cobran después |
| Aguar la ley | varios | la ley rinde la mitad |
| Rosca personal | según tu Rosca | gratis, una vez |

- La **Rosca** del personaje abarata todo; el **Poder** alto trae votos solos.
- Al votar hay un poco de azar (ausencias, ±3 votos), así que ir justo es arriesgado.
- **Alternativa: decreto (DNU)**. Saltás al Congreso: sale seguro, pero Poder −4,
  calle +10 y la Corte puede voltearlo (chance según tu relación con la Justicia).

El paso 8 puede convertir la rosca en un minijuego; esta versión es la base.

---

## 6b. Crisis que duran

Hoy la corrida es un evento suelto. Pasa a ser una **crisis con estado**: empieza,
pesa todos los años y solo termina con una decisión o cuando el país mejora.

| Crisis | Se dispara con | Pesa cada año |
|---|---|---|
| Corrida y devaluación | Reservas < 20 | Inflación +30, Imagen −3 |
| Default | Reservas < 8 y deuda tomada | Actividad −8, Poder −4 |
| Hiperinflación | Inflación > 200 | Imagen −6, calle +20 |
| Estallido social | Calle ≥ 80 | Poder −6, paro cada año |

- Mientras dura, cada año te llega su **decisión de salida** (plan de
  estabilización, acuerdo con el Fondo, cambio de gabinete, represión o diálogo),
  con costos fuertes y chance de cortar la crisis según el país y tus atributos.
- Dos crisis a la vez es una espiral: el camino al fin anticipado.
- Salir de una crisis da un logro y Poder +5.

---

## 6c. Fin anticipado

Tres puertas, cada una con una alerta propia y una última decisión:

1. **Juicio político**: se abre si tu bloque en Diputados es menos de un tercio,
   la Imagen está por debajo de 25 y hay crisis o causas altas. Podés rosquear para
   frenarlo (como una ley, pero necesitás un tercio para bloquear).
2. **Renuncia**: con Poder por debajo de 20 y calle por encima de 85, te la
   piden. Renunciar o resistir; resistir puede terminar en crisis institucional.
3. **Crisis institucional**: estallido + resistir. Te vas igual, y peor.

Qué pasa si te vas antes (a definir, ver preguntas): ¿la carrera termina, o
seguís con un castigo enorme?

---

## 6d. Gobernar abajo: intendentes y gobernadores

Que ser intendente o gobernador no sea solo un cargo con sueldo:

- **Dos indicadores locales**: **Cuentas** (si te alcanza la plata) y **Gestión**
  (obras, servicios, seguridad). Se heredan al asumir y se entregan al irte, como el país.
- **Decisiones de gestión**, unas 8 por nivel: paro municipal, la basura, el
  colectivo, inundación, seguridad, endeudarse, salarios, la coparticipación.
- **La coparticipación**: si sos del partido del presidente, te llegan fondos
  (Cuentas +); si sos opositor, te ahogan, y pelearte con la Casa Rosada te da Fama.
- **El Concejo o la Legislatura**: versión corta de 6a, solo para el presupuesto anual.
- Cómo entregás la gestión pesa en la elección siguiente (+ o − fuerza), así
  que gobernar bien abajo es el camino lógico para subir.

---

## Equilibrio

- La simulación suma un perfil de presidente que gobierna con leyes, para medir:
  cuántos completan el mandato, cuántos son destituidos o renuncian, y cuántos
  reeligen. Meta orientativa: entre 10 % y 20 % de presidentes no terminan.
- La prueba de equilibrio cubre leyes y decisiones de crisis como a los eventos.
- Guardado: campos nuevos opcionales (`congreso`, `crisis`, `distrito`), sin
  cambiar de versión.

## Estado

Implementado completo: 6a, 6b, 6c (con más caídas) y 6d. El detalle final de cada parte está en `diseno.md`.

## Respuestas del usuario (2026-11-07)

1. Leyes: **chance simple**. Cada ley muestra su porcentaje según tu bloque, tu
   Rosca y tu Poder; no hay pantalla de apoyos. Se mantienen el decreto y guardarla.
2. Fin anticipado: **termina la carrera**, con final propio.
3. Intendente y gobernador: **indicadores locales** (Cuentas y Gestión).
4. Orden: **6a → 6b → 6c → 6d**, probando y commiteando cada parte.

## Preguntas

1. **Leyes**: ¿rosca con contador y apoyos a la vista (recomendado) o una chance
   simple de que salga?
2. **Fin anticipado**: ¿termina la carrera con un final propio ("Destituido",
   "Renunciaste") o seguís como ex presidente con un castigo enorme?
3. **Intendente y gobernador**: ¿indicadores locales propios (recomendado), solo
   decisiones de gestión sin indicadores, o dejarlo para después?
4. **Orden**: ¿las cuatro partes en orden, probando y commiteando cada una
   (recomendado), o cambiás la prioridad?
