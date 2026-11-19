# La Rosada: propuesta de equilibrio

Versión para discutir · 2026-11-06 · **Implementada el mismo día**, con tus respuestas:

1. Las ganancias son un porcentaje de la caja, **hasta US$ 40.000**.
2. El cuadrado grande pasa a ser el **Poder** y se va el promedio de atributos.
3. El equipo de la tienda **no cobra sueldo**: tiene un precio fijo que sale de lo que da.

Lo que cambió respecto de esta propuesta al implementarla está en `diseno.md`, sección «Equilibrio».

## En una línea

Hoy la plata deja de importar a los 30 años, muchas opciones no cuestan nada y los grupos de poder complican sin aportar. La propuesta tiene cinco partes:

1. Medir todo en una sola escala.
2. Cobrar y pagar en proporción a tu caja y a tu sueldo.
3. Hacer que cada opción ceda algo de verdad.
4. Juntar los diez grupos en un único **Poder**.
5. Agregar una prueba automática que no deje pasar opciones dominadas.

---

## 1. Lo que encontré (con números)

Hice dos análisis. Los datos y los scripts quedaron en `docs/analisis-balance/`.

### 1.1 La plata se vuelve infinita

Simulé 300 carreras de un jugador razonable: se presenta cuando tiene chance, hace campaña normal y no agarra coimas. Esta es su caja típica (la mediana):

| Edad | Caja mediana | Sueldo del cargo | Lo que cuesta un evento típico |
|---|---|---|---|
| 20 | US$ 12.000 | US$ 6.000 | 25 % de la caja |
| 25 | US$ 27.500 | US$ 6.000 | **18 %** |
| 35 | US$ 106.500 | US$ 12.000 | 4 % |
| 45 | US$ 230.000 | US$ 20.000 | **2 %** |
| 60 | US$ 521.000 | US$ 30.000 | **1 %** |
| 80 | US$ 1.050.000 | US$ 30.000 | 0,4 % |

- **La caja crece sin freno**: entra el sueldo, salen US$ 4.500 fijos y casi no hay en qué gastar.
- **La tienda queda regalada**:
  - el equipo completo (US$ 65.000) es el 236 % de la caja a los 25, pero el 28 % a los 45 y el 12 % a los 60;
  - una campaña normal cuesta entre el 3 % y el 5 % de la caja cuando te presentás, así que la fuerte se elige siempre;
  - la única excepción es la presidencial.
- **Consecuencia inesperada: la corrupción no tienta.** Como la plata no vale nada, la coima del contratista da **valor negativo** a mitad de carrera: las causas pesan más que la plata. El camino transa, que está en el diseño, no tiene sentido económico.

### 1.2 Las opciones de los eventos

Pasé las 122 opciones de los 49 eventos por un modelo de valor (ver 1.3), a los 25, 45 y 60 años:

| Problema | Cuántos |
|---|---|
| Opciones **dominadas** (hay otra en el mismo evento igual o mejor en todo) | **14** opciones, en 13 eventos |
| Opciones que **no ceden nada** (todo ganancia) | **26** |
| Opciones que **no ganan nada** (el típico "no hacer nada") | **31** |
| Diferencia de valor entre la mejor y la peor opción de un evento | mediana 3, máximo 20 |

Ejemplos de opciones dominadas:

- **Los comedores de la parroquia**: "Mandar ayuda sin ir" cuesta lo mismo que "Ir y ayudar" y da menos de todo. Es tu caso.
- **La marcha**: "No ir" pierde contra "Mandar un mensaje de apoyo", que además es gratis.
- **Un compañero te serrucha el piso**: "Enfrentarlo" pierde contra "Sumarlo a tu equipo", que es gratis y siempre gana.
- **Un almuerzo televisivo**: "Ir y ser prudente" (+3 Fama, +2 Imagen) no cuesta nada.
- **Una herencia**: las dos opciones son puro regalo.
- **Inundación, ola de gripe, toma de tierras**: hay siempre una opción obvia.

Los eventos con más distancia entre opciones:

- **Tu ex socio quiere más**: pagarle vale −1; las otras dos, −17 y −21. Siempre se paga.
- **Citación a indagatoria**: los abogados valen +8; las demás, entre −2 y +2.
- **La marcha**: ir vale +8,3; las otras, menos de 1.

### 1.3 Cuánto vale cada cosa (la escala común)

Para comparar peras con manzanas usé una unidad: **1 punto ≈ 1 punto de voto en una elección**, sumado sobre las próximas cinco elecciones. Sale de cómo el motor convierte cada número en fuerza electoral y de cuánto dura:

| Cosa | Valor por unidad | Por qué |
|---|---|---|
| Imagen | 0,9 | Pesa 0,3 de fuerza, pero vuelve sola hacia 50 un 15 % por año |
| Fama | 0,7 | Pesa entre 0,15 y 0,4, pero **la mediana de los jugadores vive en el piso (5)**: lo que ganás se va al año |
| Construcción | 1,4 | Pesa entre 0,2 y 0,35 y no se pierde |
| Carisma / Territorio | 1,0 / 1,3 | Pesan en todas las elecciones y no se pierden |
| Gestión / Rosca | 0,6 / 0,5 | Reelección, cargos designados, internas, desafuero |
| Aguante | 0,4 | Alarga la carrera |
| Causas | −0,5 | Riesgo judicial |
| Grupo de poder | entre 0,04 y 0,15 | Pesa poco y se enfría un 8 % por año |
| Plata | casi 0 después de los 30 | Ver 1.1 |

Dos hallazgos de paso, que también conviene arreglar:

- **La Fama está rota**: la mediana es 5 toda la carrera, porque baja 1 o 2 por año y casi nada la sube.
- **La Construcción se dispara**: la mediana llega a 75 a los 55 años, así que Prócer termina siendo común.

---

## 2. Reglas nuevas

### Regla 1 · La escala de la plata: tu sueldo y tu caja

Toda cifra de plata deja de ser fija y se calcula con dos cosas:

- **S** = el sueldo anual de tu cargo (militante: US$ 6.000; presidente: US$ 80.000);
- **C** = tu caja actual.

**Costos**: un porcentaje de tu caja, con un piso en sueldos para que también le duela al que no tiene nada.

> costo = máx(p × C, k × S)

**Ganancias**: también proporcionales, pero con un **tope** para que el rico no se haga más rico solo por serlo.

> ganancia = entre(k₁ × S, p × C, k₂ × S)

Así se ven en pantalla: "−8 % de tu caja (US$ 18.400)" o "+20 % de tu caja (US$ 46.000)". Siempre con el número también.

| Tamaño | Costo | Ganancia |
|---|---|---|
| Chico | 4 % de la caja (mín. ¼ de sueldo) | 5 % de la caja (entre ½ y 2 sueldos) |
| Mediano | 8 % (mín. ½ sueldo) | 12 % (entre 1 y 4 sueldos) |
| Grande | 15 % (mín. 1 sueldo) | 25 % (entre 2 y 8 sueldos) |
| Enorme (lujos, coimas grandes) | 30 % o más (mín. 3 sueldos) | 40 % (entre 3 y 12 sueldos) |

### Regla 2 · Que la plata se gaste: la estructura cuesta

Hoy el único gasto es US$ 4.500 fijos por año. Propongo:

- **Sostener la estructura** (local, militantes, viajes): US$ 4.500 + **3 % de la caja por año**. Aparece en el historial.
- **El equipo de la tienda cobra sueldo**: cada miembro cuesta el **25 % de su precio por año**. Si no lo pagás, se va.

Con el modelo de economía de la carrera típica:

| Edad | Caja hoy | Caja con la propuesta (estructura más eventos proporcionales) |
|---|---|---|
| 35 | US$ 66.000 | US$ 47.000 |
| 45 | US$ 189.000 | US$ 118.000 |
| 60 | US$ 471.000 | US$ 229.000 |
| 80 | US$ 981.000 | US$ 333.000 |

La caja sigue creciendo, pero se aplana. Lo más importante es que **un costo del 8 % pesa lo mismo a los 25 que a los 60**.

Probé también descontar un 30 % del sueldo para la estructura y quedó demasiado duro: a los 25 años la caja quedaba en cero. Lo descarto.

### Regla 3 · La escala de cada número: rendimientos decrecientes

Subir la imagen de 20 a 26 no debería valer lo mismo que de 80 a 86. Para Imagen, Fama, Poder y Construcción:

- ganancia real = base × entre(0,3; (110 − actual) / 60; 1,5)
- pérdida real = base × entre(0,4; (actual + 30) / 80; 1,5)

| Tu imagen | +6 de base se vuelve | −6 de base se vuelve |
|---|---|---|
| 20 | **+9** | −4 |
| 50 | +6 | −6 |
| 80 | **+3** | **−8** |

Esto hace que **la mejor opción dependa de cómo estás**. Si tenés la imagen por el piso, la opción de imagen rinde el triple. Si la tenés alta, ya rinde poco y conviene otra cosa. Además frena sola la Construcción que se dispara.

### Regla 4 · Toda opción cede algo, y ninguna gana siempre

Para escribir y revisar cada evento:

1. **Cada evento tiene un tamaño** (chico, mediano o grande) y, según eso, un "valor" de referencia (3, 5 o 9 puntos de la escala).
2. **Cada opción gana algo y cede algo**. Lo que cede tiene que valer por lo menos el 30 % de lo que gana.
3. **Las opciones de un evento valen lo mismo, ±1 punto**, pero en **monedas distintas**: una cuesta plata, otra imagen, otra poder, otra aguante o tiempo, otra causas. Elegís según lo que hoy te sobra y lo que te falta.
4. **"No meterse" también tiene precio y premio**: cuesta algo chico (Poder −2, Fama −1) y da algo chico (+1 Aguante, conservás la plata). Puede valer hasta 2 puntos menos que las otras, porque no arriesga nada.
5. **Las de azar valen lo mismo en promedio**: la chance se ve, y la ganancia si sale bien compensa el riesgo, con un premio de hasta 10 %.
6. **Los beneficios ocultos se muestran**: por ejemplo, "🤍 Mantenés las manos limpias" al rechazar una coima.

### Regla 5 · Una prueba automática de equilibrio

El análisis que hice pasa a ser una prueba del proyecto. Si alguien escribe un evento desbalanceado, falla y no se puede commitear. Revisa los 49 eventos a los 25, 45 y 60 años y falla si:

- hay una opción dominada;
- una opción no cede nada (salvo excepciones anotadas);
- la distancia de valor entre opciones supera lo permitido para el tamaño del evento;
- un costo en plata queda fuera del rango del 3 % al 35 % de la caja en alguna de las tres edades.

---

## 3. Un solo Poder en lugar de diez grupos

### Qué es

**Poder** va de 0 a 100: cuánto pesás entre los que mandan (sindicatos, empresarios, medios, jueces, gobernadores, todos juntos). Los diez grupos desaparecen.

### En la ficha

- **El cuadrado grande de arriba pasa a ser el Poder.** Hoy dice "Poder", pero muestra el promedio de tus atributos, que confunde: ese promedio se va.
- El botón **Poder** abre un panel más simple:
  - una sola barra;
  - de dónde viene tu poder (el cargo y tu construcción);
  - la libreta de favores;
  - lo que hacés por debajo de la mesa.

### Cómo se mueve

- **Las decisiones suman o restan Poder** directamente.
- **El poder se ejerce o se pierde**: cada año se acerca un 15 % al poder que te da tu lugar, que es el piso del cargo más un quinto de tu construcción. El piso de cada cargo es:

| Cargo | Piso |
|---|---|
| Militante | 5 |
| Asesor | 12 |
| Concejal, Director municipal | 20 |
| Secretario municipal, Legislador | 30 |
| Intendente, Diputado | 40 |
| Senador, Gobernador | 55 |
| Presidente | 75 |

- **Arranque**: 10, más 10 si venís de una dinastía y más 5 si venís de un sindicato, una empresa o la puntería barrial.

### Qué hace

| Antes (con grupos) | Ahora (con Poder) |
|---|---|
| En una elección, los grupos sumaban entre −20 y +20 (en la práctica, casi nada) | Fuerza + (Poder − 25) × 0,2: de −5 a +15 |
| Medios en contra: Imagen −2 por año | Poder 15 o menos ("estás solo"): Imagen −1 por año y las amenazas salen el doble |
| Medios a favor: Fama +1 por año | Poder 60 o más ("todos te llaman"): Fama +1 por año |
| La Justicia en contra aceleraba las causas | Con mucho Poder las causas avanzan más lento: entre × 1,3 (poder 0) y × 0,6 (poder 100). Impunidad, tal cual |
| Gobernadores, para el desafuero | Poder, para el desafuero: + Poder / 250 |
| Rosca y construcción, para la lapicera | También pesa el Poder: + (Poder − 30) / 200 |
| Grupo en contra: amenazas más seguido | Poder bajo: amenazas más seguido |

### Qué pasa con la libreta de favores

Se queda, pero sin grupos. Cada favor tiene un **quién** (Medrano, un contratista, Insúa), solo como color.

- **Te deben**: se cobra en la próxima campaña (+2 de fuerza) o en un desafuero (+10 % de chance).
- **Debés**: te lo vienen a cobrar. Si no cumplís: **Poder −8 e Imagen −2**.

### En los eventos

Las etiquetas "🏭 Empresarios −10" pasan a ser una sola: "Poder −3". Los números se reescriben con las reglas de la sección 2, sin traducir uno por uno.

### Partidas guardadas

Al cargar una partida vieja:

> Poder = piso del cargo + (promedio de los diez grupos) / 5

---

## 4. Antes y después

Uso dos momentos de la carrera:

- **A**: 25 años, militante, caja de US$ 27.500, sueldo de US$ 6.000;
- **B**: 45 años, director municipal, caja de US$ 230.000, sueldo de US$ 20.000.

Para escribir eventos uso una versión simplificada de la escala de la sección 1.3, que es la que aplicaría la regla 4:

| Cosa | Puntos |
|---|---|
| Imagen, Fama o Poder | 1 |
| Construcción | 1,5 |
| Aguante | 0,5 |
| Causas | −0,6 |
| Un favor | 2 |
| Mantener las manos limpias (los carpetazos no prenden) | 2 |
| 10 % de la caja | 3 |
| Plata negra | × 0,7 |

### Los comedores de la parroquia (mediano, 3 puntos)

| Opción | Antes | Después | Puntos |
|---|---|---|---|
| Ir y ayudar | −US$ 3.000 · +3 Imagen, Iglesia +12, Movimientos +5 | **−6 % de tu caja** (A: 3.000 · B: 13.800) · **−2 Aguante** · +4 Imagen · +2 Poder | +3,2 |
| Mandar una donación grande *(antes "Mandar ayuda sin ir")* | −US$ 3.000 · Iglesia +6 ← *dominada* | **−14 % de tu caja** (A: 3.850 · B: 32.200) · +3 Imagen · +4 Poder | +2,8 |
| Mantener distancia | Iglesia −8 | **−2 Poder** · +1 Aguante · conservás la plata | −1,5 |

Ahora "ir" te cuesta el cuerpo y "mandar plata" te cuesta más plata pero da más poder. Si estás juntando para una campaña, vas en persona; si tenés 60 años y el aguante justo, mandás la donación.

### Un sobre por un pliego: la coima (grande, 9 puntos, momento B)

| Opción | Antes | Después | Puntos |
|---|---|---|---|
| Aceptar el sobre | +US$ 30.000 en negro (13 % de la caja) · +12 Causas · Empresarios +10 → **valía −4** | **+4 sueldos en negro** (US$ 80.000; con estilo transa, 120.000) · +10 Causas · deja rastro · +2 Poder | +3,3 (sin contar el rastro, que es el riesgo de largo plazo) |
| Rechazarlo | Empresarios −5 | **🤍 Mantenés las manos limpias** · −1 Poder | +1 |
| Denunciarlo | Bien: +6 Imagen +4 Fama · Mal: −2 Imagen | Chance según rosca, alrededor del 55 %. Bien: +7 Imagen, +5 Fama, −3 Poder (te hacés enemigos). Mal: −3 Imagen, −4 Poder | +1,8 en promedio |

La coima por fin tienta: es mucha plata en negro, y esa plata sirve para la campaña negra, las movidas y el exilio. Pero deja rastro.

### Un almuerzo televisivo (chico, 3 puntos)

| Opción | Antes | Después | Puntos |
|---|---|---|---|
| Ir y ser prudente | +3 Fama, +2 Imagen, gratis ← *no cede nada* | +3 Fama · +1 Imagen · **−1 Poder** (tu espacio esperaba que dijeras algo) | +3 |
| Ir y polemizar | +6 Fama, −3 Imagen | +6 Fama · **−4 Imagen** · +1 Poder | +3 |
| No ir | nada | +1 Aguante · −1 Fama (te ven esquivo) | −0,5 |

Con la regla 3, si tu imagen está alta, polemizar duele más; si tu fama está en el piso, cualquiera de las dos rinde el doble.

### O firmás, o paramos (grande, un "mal menor")

| Opción | Después | Puntos |
|---|---|---|
| Firmar el aumento | −2 Imagen (cediste) · −2 Poder · 📒 Medrano te debe un favor | −2 |
| Aguantar el paro | Chance según aguante, alrededor del 55 %. Bien: +5 Imagen, +5 Poder, −3 Aguante. Mal: −6 Imagen, −5 Poder, −3 Aguante | −1 en promedio |
| Sentarte a negociar | Chance según rosca, alrededor del 60 %. Bien: +2 Poder, +1 Rosca, −2 Aguante. Mal: −3 Imagen, −2 Poder, −2 Aguante | −1,4 en promedio |

Es un evento de crisis: todas las opciones restan, pero restan parecido. La diferencia está en el riesgo.

### Una herencia (mediano)

| Opción | Antes | Después | Puntos |
|---|---|---|---|
| Venderla | +US$ 15.000, sin costo | **+20 % de tu caja** (entre 1 y 5 sueldos: A: 6.000 · B: 46.000) · −1 Imagen ("¿y la familia?") | +5 a +5,5 |
| Donarla a una escuela | +4 Imagen, +2 Fama, sin costo | +3 Imagen · +2 Fama · +1 Poder · no entra plata | +6 |

### Tu ex socio quiere más

| Opción | Antes | Después |
|---|---|---|
| Pagarle en negro | −US$ 20.000 en negro (siempre conviene) | **−25 % de tu caja negra** (mín. 2 sueldos) · y vuelve a pedir: queda un favor que le debés |
| Que haga lo que quiera | +18 Causas y la causa avanza | +12 Causas · la causa avanza · **+2 Imagen** (no te dejás apretar) |
| Apretarlo vos | Chance según rosca | Igual que antes, pero el fracaso baja de +25 a +15 Causas |

Las tres quedan dentro de ±2 puntos según tu caja negra y tus causas.

### La tienda y las campañas (momento B, caja de US$ 230.000)

| Cosa | Antes | Después |
|---|---|---|
| Asesor de imagen | US$ 9.000 de una vez (4 % de la caja) | **1 sueldo** (US$ 20.000) + **25 % por año** (US$ 5.000) |
| Spots en radio y TV | US$ 9.000 | **1 sueldo** |
| Yate | US$ 250.000 | **60 % de la caja** (mín. 10 sueldos) |
| Entrevista en TV abierta | US$ 18.000 | **2 sueldos** (mín. US$ 18.000) |
| Campaña normal (intendente) | US$ 10.000 (4 % de la caja) | **máx(US$ 10.000; 8 % de la caja)** = US$ 18.400 |
| Campaña fuerte (intendente) | US$ 30.000 (13 %) | **máx(US$ 30.000; 20 % de la caja)** = US$ 46.000 |
| Comprar una tapa (movida) | US$ 15.000 en negro | **15 % de la caja negra** (mín. 1 sueldo) |

---

## 5. Otros dos arreglos que salieron del análisis

- **Fama**: hoy baja 1 o 2 por año sin importar cuánta tengas, y casi nada la sube. Propongo:
  - que baje un **6 % por año** (mínimo 1);
  - que **tener un cargo dé visibilidad**: + la mitad del rango, redondeado para arriba, por año. Un concejal gana +1 y un gobernador +3.
- **Construcción**: con la regla 3 deja de dispararse. Si igual hace falta, el triunfo electoral baja de +4 a +3.

---

## 6. Cómo lo haría, si das el visto bueno

1. **Economía**: escala S y C, costos y ganancias proporcionales, estructura del 3 %, sueldo del equipo, tienda y campañas. Las simulaciones vuelven a medir la caja por edad.
2. **Poder único**: el medidor, la ficha, el panel, la libreta, las elecciones y la Justicia. Partidas guardadas en versión 8, con migración.
3. **Los 49 eventos reescritos** con las reglas 3 y 4 (la parte más grande). Los muestro antes de dar el paso por cerrado.
4. **La prueba automática de equilibrio** (regla 5), en verde.
5. Los arreglos de Fama y Construcción, y una simulación final de honestos y corruptos.

## Preguntas para vos

1. **Las ganancias proporcionales llevan tope** (en sueldos) para que el rico no se haga más rico solo por serlo. ¿Te parece bien, o preferís que sean un porcentaje puro de la caja?
2. **El cuadrado grande de arriba pasa a ser el Poder** y desaparece el promedio de atributos. ¿Estás de acuerdo?
3. **¿Le ponemos sueldo anual al equipo de la tienda (25 % del precio)?** Es lo que más cambia la sensación de la tienda.
