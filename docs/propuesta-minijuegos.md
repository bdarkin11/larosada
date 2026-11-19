# Propuesta: paso 8, minijuegos (2026-11-08)

Hoy los momentos clave se resuelven con una cuenta y un sorteo. La campaña
suma fuerza según cuánto gastes, y la ley sale o no según `chanceLey`. La única
parte que se juega es la entrevista: preguntas con tres respuestas y 15
segundos para cada una.

Idea rectora: **los momentos decisivos se juegan**, y jugar bien pesa, pero
no tapa la carrera.

- **Cada minijuego mueve el resultado de la cuenta, no lo reemplaza.** La
  fuerza, el bloque y los atributos siguen pesando como hoy. El minijuego suma
  o resta un rango acotado.
- **Siempre se puede saltear** con "Que lo resuelva el equipo", pero **da
  menos**: rinde como haberlo jugado un poco peor que regular (un cuarto del
  rango por debajo del medio). Jugarlo conviene, y nadie queda trabado.
- **Pesa fuerte**: jugando bien podés dar vuelta una elección difícil o sacar
  una ley sin mayoría. Jugando mal podés perder una que tenías ganada.
- **Los atributos ayudan en el juego mismo**: más tiempo, más opciones, pistas.
  Así un personaje con mucha Fama juega con ventaja.
- **Funcionan en el celular** (tocar, sin teclado) y con movimiento reducido.
- **Lógica en el motor y con semilla.** El minijuego arma el desafío desde
  `carrera.azar`, la pantalla solo junta lo que hiciste y el motor lo puntúa.
  Así se puede probar sin navegador.

---

## 8a. El debate (antes de las generales)

**Estado**: hecho. Las reglas con sus números están en `diseno.md` ("El debate").

**Cuándo**: en las generales a intendente, gobernador y presidente, después
de elegir la campaña y antes de la fiscalización.

**Cómo se juega**:

- **Rondas**: 4 rondas, o 5 para presidente. En cada una, el moderador o el
  rival principal te tira un tema o una chicana.
- **Respuestas**: tres, con 12 segundos para elegir. Hay una propuesta, un
  contraataque y una evasiva.
- **Tus ideas**: las respuestas tienen postura. Si va con tus ideas suma, y si
  te contradice resta, como en la entrevista.
- **Las respuestas se cuentan entre sí**:
  - el contraataque le gana a la chicana;
  - la propuesta le gana a la pregunta seria;
  - la evasiva no suma nada, pero nunca pierde mucho.

  Hay que leer qué te tiran.
- **El rival** es el candidato principal de la general. Si es del elenco
  (persona real con nombre cambiado), sus chicanas son sobre ideas y gestión,
  nunca sobre delitos.
- **Fama**: con más Fama tenés más segundos, y con 40 o más, una pista
  de qué te van a tirar.

**Qué da**:

- En la elección: de −10 a +10 de fuerza.
- Fama: +1 a +4, según el cargo.
- Al palmarés: "Ganaste el debate".

Con Fama 30, jugarlo regular da 0, y saltearlo, −2,5.

Reusa la estructura de `entrevista.ts` y de `datos/entrevistas.ts`. Hacen
falta unas 30 preguntas de debate nuevas.

---

## 8b. Rosca en el Congreso (las leyes del presidente)

**Estado**: hecho. Las reglas con sus números están en `diseno.md` ("La rosca en el Congreso").

**Cuándo**: al elegir "Mandarla al Congreso" en un proyecto de ley. Si no
tenés mayoría propia, se agrega el botón "Rosquearla vos".

**Cómo se juega** (por turnos, sin reloj):

- Ves la cámara con tus leales, la oposición dura y 6 a 8 **bloques
  indecisos**: gobernadores, aliados y díscolos. Cada uno tiene sus bancas y
  lo que pide para darte los votos.
- Lo que piden:
  - una obra para su provincia (Caja);
  - un cargo (Poder);
  - un cambio en la ley (la ley rinde menos);
  - una promesa a futuro (te debe un favor y le debés uno).
- Tenés un **presupuesto de rosca** que sale de tu Rosca y tu Poder. Cada
  bloque cuesta distinto, y algunos se ofenden si negociás con su rival.
- Llegás a la mayoría (129 diputados y 37 senadores) o no llegás. La votación
  final tiene un poco de azar: un bloque que te prometió el voto puede faltar.

**Qué da**: el resultado de la ley, en lugar de la tirada de `chanceLey`, más
lo que hayas cedido.

- Si jugás regular, la chance queda parecida a la de hoy.
- Si jugás bien, sale más seguro y más barata, aunque no tengas mayoría.
- Si la salteás, va la tirada de hoy con −10 puntos de chance.

Usa los datos que ya existen: el bloque, `chanceLey` y los favores. No hace
falta texto nuevo, más allá de los nombres de los bloques.

---

## 8c. Noche electoral: fiscalizar las mesas

**Estado**: hecho. Las reglas con sus números están en `diseno.md` ("Fiscalizar las mesas"). Cambio: el balotaje no se juega de nuevo, se le aplica el mismo ajuste.

**Cuándo**: en cualquier general, después del debate y antes del escrutinio
que ya existe, que pasa a mostrar los votos ya fiscalizados.

**Cómo se juega** (30 segundos, a tocar):

- **El mapa**: ves las mesas de tu distrito, de 9 a 16 según el cargo. En
  algunas tenés fiscal y en otras no.
- **Cuántos fiscales tenés**: los da tu Construcción. Tus delfines leales y el
  equipo de la tienda suman más.
- **Incidentes**: van saltando en las mesas:
  - boletas tuyas que faltan;
  - un acta mal sumada;
  - voto en cadena;
  - una urna que "se pierde".

  Cada uno tiene un tiempo.
- **Atender un incidente**: tocás un incidente y después un fiscal libre para
  mandarlo. Si llega a tiempo, salvás esos votos. Si no, se pierden.
- **Mesas sin fiscal**: pierden votos solas, de a poco.
- **La otra fuerza**: los rivales también fiscalizan. Cuanto más fuerte es el
  aparato rival (su partido, si gobierna), más incidentes hay.

**Qué da**:

- **Votos**: de −6 a +4 puntos sobre tu porcentaje, antes de definir quién
  ganó. Si es en contra, se lo llevan los rivales.
- Dar vuelta una elección en la fiscalización va al palmarés: "La ganaste en
  las mesas".
- Saltearlo da −1,5 puntos.

**Cambio en el motor**: hoy `elegirCampania` reparte los votos y define quién
ganó de una vez. Hay que separarlo: primero se reparten, después se fiscaliza
y recién ahí se define. El balotaje se fiscaliza de nuevo.

---

## Lo que queda para después

La **conferencia de prensa**, que ya existe en parte con la entrevista, y el
**cierre de campaña** (llenar la plaza).

## Orden

8a debate → 8b rosca en el Congreso → 8c fiscalizar, cada uno con su prueba y
su commit.
