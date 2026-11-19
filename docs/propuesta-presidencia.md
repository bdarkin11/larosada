# La Rosada: propuesta de plata, tienda y presidencia

Versión para discutir · 2026-11-07 · **Implementada el mismo día**, con tus respuestas:

1. Con indicadores del país.
2. El aporte suma también por construcción.
3. Dos mandatos seguidos, y se puede volver.

Sumé lo que pediste después: promesas de campaña con castigo, la calle (paros y marchas que bajan el poder), coherencia con tus ideas, menos decisiones al principio y la edad de Avellaneda (37). Cómo quedó, en `diseno.md`, sección «Presidencia, promesas y la calle».

Responde a tu pedido del 2026-11-07:

1. Todavía terminás con demasiada plata para lo que hay para gastar.
2. Las mejoras de la tienda tienen que costar más.
3. Cuanto más status ganás, más tenés que poner para tu agrupación.
4. De presidente, las decisiones comunes se cambian por decisiones de Estado.
5. Una sola reelección, y después de la presidencia, un desgaste que te cueste caro.

Los datos están en `analisis-balance/flujos-de-plata.txt` (300 carreras simuladas con la versión actual).

---

## 1. Lo que encontré

### 1.1 La plata

El problema es que **casi todo el sueldo se ahorra**. Por año, en promedio:

| Rango | Ejemplo | Sueldo | Estructura | Eventos y campañas | Caja típica |
|---|---|---|---|---|---|
| 0 | Militante | US$ 6.000 | −5.600 | +200 | US$ 16.500 (2,8 sueldos) |
| 2 | Concejal, director | US$ 18.800 | −8.600 | +700 | US$ 120.300 (6,4 sueldos) |
| 3 | Legislador, secretario | US$ 28.900 | −10.800 | +1.100 | US$ 192.600 (6,7 sueldos) |
| 4 | Intendente, diputado | US$ 42.400 | −10.800 | +1.000 | US$ 209.800 (4,9 sueldos) |
| 5 | Senador, gobernador | US$ 55.800 | −12.000 | +1.300 | US$ 253.000 (4,5 sueldos) |

- Un legislador ahorra el **62 % de su sueldo**, todos los años.
- **Eventos y campañas, en total, dan plata en vez de sacarla.** Los costos proporcionales se compensan con herencias, aportes y la carta de colecta.
- La estructura del 3 % frena poco: un legislador recién deja de juntar plata con US$ 600.000 en la caja.

### 1.2 La tienda

Cada mejora del equipo cuesta entre US$ 10.500 y US$ 19.000, y el equipo completo, US$ 95.500. Un legislador típico tiene US$ 190.000: **con la mitad de su caja se compra todo el equipo**, y cada mejora sola es el 6 % al 10 %.

### 1.3 La presidencia

- La regla actual solo prohíbe un **tercer mandato seguido**. Si dejás pasar un período, podés volver. En la simulación hubo presidentes con **4 y hasta 6 mandatos**.
- De presidente salen los mismos eventos que a un concejal: el club del barrio, el libro, el almuerzo.
- **Después de la presidencia no pasa nada**. Los ex presidentes siguen con Fama 70 a 80 y Poder 65 a 79, de senadores, por años.

---

## 2. La plata: el aporte a la agrupación

**Cada año, una parte de tu sueldo va para la agrupación**: los militantes, el local, los micros, la gente que te sigue. Cuanto más alto el cargo, más gente depende de vos y más ponés.

| Cargo | Aporte | Te queda de sueldo | Hoy te queda |
|---|---|---|---|
| Militante | 0 % | US$ 6.000 | igual |
| Asesor | 10 % | US$ 10.800 | US$ 12.000 |
| Concejal, director municipal | 25 % | US$ 14.000 | US$ 19.000 |
| Legislador, secretario municipal | 40 % | US$ 17.400 | US$ 29.000 |
| Intendente, diputado | 50 % | US$ 21.000 | US$ 42.000 |
| Senador, gobernador | 55 % | US$ 25.000 | US$ 56.000 |
| Presidente | 60 % | US$ 32.000 | US$ 80.000 |

- Se ve en el historial: "Sueldo +US$ 29.000, aporte a la agrupación −US$ 11.600, estructura −US$ 9.000".
- La estructura sigue igual: US$ 4.500 más el 3 % de la caja.
- **Estimación** (modelo de la economía, se confirma con la simulación al implementarlo): la caja típica a los 60 baja de US$ 205.000 a **unos US$ 110.000**, alrededor de 3 o 4 sueldos. Hasta los 30 casi no cambia, porque el militante no aporta.

**Por qué por cargo y no por construcción**: el cargo es lo que todos ven como tu status, y así el aporte crece con el sueldo. Si preferís que pese la construcción (Caudillo y Prócer bancan a más gente), se le puede sumar un 5 % por etapa.

---

## 3. La tienda más cara

El precio sigue saliendo de lo que da cada mejora, como pediste. Lo que cambia es **cuánto vale cada punto: de US$ 1.500 a US$ 3.000**.

| Mejora | Hoy | Con la propuesta |
|---|---|---|
| Asesor de imagen, Jefe de prensa, Operador político, Médico | US$ 12.000 | **US$ 24.000** |
| Encuestador propio | US$ 10.500 | US$ 21.000 |
| Armador territorial | US$ 18.000 | US$ 36.000 |
| Estudio jurídico | US$ 19.000 | US$ 38.000 |
| Gira por los barrios | US$ 13.000 | US$ 26.000 |
| Spots en radio y TV | US$ 9.000 | US$ 18.000 |
| Campaña en redes, Coaching | US$ 3.000 | US$ 6.000 |
| Vacaciones | US$ 1.500 | US$ 3.000 |

Con el aporte, un concejal de 35 años tiene unos US$ 50.000: **una sola mejora del equipo es casi la mitad de su caja**. Comprar el equipo completo (US$ 190.000) pasa a ser algo de toda una carrera.

Los lujos (auto, country, Puerto Madero, yate) quedan con su precio: ya son caros y su gracia es la fama a cambio de causas.

---

## 4. La presidencia: decisiones de Estado

### 4.1 Cómo funciona

- Siendo presidente, **ya no salen los eventos comunes ni los especiales de cargos chicos**. Siguen saliendo los de la Justicia, la extorsión y el cobro de favores: el poder no te salva de eso.
- **Todos los años hay una decisión de Estado**, con una alerta propia (**¡DECISIÓN DE ESTADO!**), retrato del ministro o del que te viene a ver, y tres opciones.
- Pesan más que los eventos comunes: mueven tu imagen y tu poder, y sobre todo **el país**.

### 4.2 El país: tres indicadores (el comienzo del paso 6)

Para que "emitir" o "recortar" signifiquen algo, la presidencia necesita números del país. Propongo **tres**, que solo aparecen mientras sos presidente:

| Indicador | Qué es | Qué hace si está mal |
|---|---|---|
| **Inflación** | Cuánto suben los precios | Imagen −2 por año desde 50 %, −4 desde 100 %. Desde 200 %, crisis. |
| **Actividad** | Trabajo y producción (0 a 100) | Por debajo de 40, Imagen −2 por año y paros más seguido. |
| **Reservas** | Los dólares del Banco Central (0 a 100) | Por debajo de 20, corrida cambiaria: alguna decisión se fuerza. |

- **Al asumir**, heredás el país: los tres se sortean, a veces bien y a veces en crisis.
- **Cada año** se mueven solos un poco, y tus decisiones los mueven mucho.
- **Al final del mandato**, cómo dejás el país define la imagen con la que te vas y queda en el palmarés ("Bajaste la inflación al 12 %").
- Es exactamente lo que el diseño llama paso 6 ("Gobernar"), empezando por la presidencia. Después se puede extender a gobernador e intendente con sus propios indicadores.

### 4.3 Las decisiones

Cada una tiene opciones que valen parecido pero cuestan cosas distintas. Las tres que pediste, con números de ejemplo:

**El Estado no cierra** (las cuentas no dan)
| Opción | Gana | Cede |
|---|---|---|
| Recortar la administración pública | Inflación −15, Reservas +10 | Actividad −8, Imagen −5, paro de estatales (Poder −4) |
| Cargar al sector privado con impuestos | Reservas +5, Imagen +2 | Actividad −10, Poder −3 (los empresarios se van) |
| Endeudarte afuera | Actividad +5, Imagen +2 | Reservas +15 hoy y −25 en cuatro años, la deuda la paga el que viene… o vos |

**Retenciones fuertes al campo**
| Opción | Gana | Cede |
|---|---|---|
| Subirlas para financiar a los jubilados | Imagen +4 en los barrios, Reservas +10 | Tractorazo: Actividad −8, Poder −5 |
| Subirlas a cambio de obras en las provincias | Poder +6 (los gobernadores te deben un favor) | Actividad −6, Imagen −2 |
| Bajarlas | Actividad +8, Poder +3 | Reservas −10, Imagen −3 |

**Emitir a gran escala en tiempos difíciles**
| Opción | Gana | Cede |
|---|---|---|
| Darle a la maquinita | Actividad +10, Imagen +4 este año | Inflación +40 |
| Pedirle al Fondo | Reservas +20 | Poder −6 (soberanía), condiciones: recorte obligado el año que viene |
| Ajuste de shock | Inflación −20 a la larga | Actividad −12, Imagen −8, paro general |

**Otras diez para completar el repertorio** (más de esa índole):

1. **El dólar se dispara**: cepo, liberarlo o desdoblarlo.
2. **Tarifas congeladas hace años**: descongelar, seguir subsidiando o segmentar por ingreso.
3. **Reforma laboral y paro general**, con Medrano enfrente: decreto, negociar o retirarla.
4. **El Congreso aprueba un aumento a los jubilados**: promulgarlo, vetarlo o vetarlo con un bono.
5. **La aerolínea de bandera pierde plata**: privatizarla, sostenerla o concesionarla.
6. **La Corte Suprema te frena una ley**: ampliar la Corte (mucho Poder y causas que se frenan, Imagen −8), acatar o impulsar un juicio político.
7. **Una provincia no paga sueldos**: rescatarla (te deben un favor), intervenirla o dejarla caer.
8. **Crisis energética en invierno**: importar gas caro, cortes programados o tarifazo.
9. **Inseguridad en las grandes ciudades**: fuerzas federales a la calle, reforma policial o plan social.
10. **El Fondo vuelve a pedir**: firmar con condiciones, patear la negociación o declarar el default.

Y dos que aparecen solo en el segundo mandato:

- **El sucesor**: ungir a alguien de tu espacio (te sigue cubriendo), dejar que se pelee en las PASO o elegir a alguien de afuera.
- **Una reforma para quedarte**: tantear una reforma constitucional. No te deja quedarte (la regla es una sola reelección), pero te cuesta mucho Poder e Imagen intentarlo. Es la tentación, con su castigo.

Todas pasan por la prueba de equilibrio, con las monedas nuevas: Inflación, Actividad y Reservas.

---

## 5. Una sola reelección, y el peso de haber sido presidente

### 5.1 La regla

- **Máximo dos mandatos de presidente en toda la carrera**, seguidos o no. Después no te podés volver a presentar.

### 5.2 Durante el segundo mandato: el "pato rengo"

- Todos saben que te vas: **el poder que te da la presidencia baja** de 75 a 55 a lo largo del segundo mandato.
- Los tuyos empiezan a mirar al que viene.

### 5.3 Después: el ex presidente

Cuando dejás la Rosada (por cumplir los dos mandatos o por perder la reelección):

- **Desgaste de ex presidente**, que se suma al desgaste político: **todos los años, Fama −2, Imagen −2 y −1 en cada atributo**. Es como envejecer de golpe en política.
- **Las causas se despiertan**: durante cuatro años, tus causas avanzan × 1,5 (sin el sillón, los jueces se animan). Con las manos limpias, no.
- **Te cuesta más volver arriba**: en cualquier elección, −8 de fuerza ("ya tuviste tu oportunidad"). Tu poder tiende a 35 si no tenés cargo, en vez de 5 más tu construcción.
- **Queda en el palmarés**, con cómo dejaste el país.
- **La salida natural es ser armador**: apadrinar a un delfín ya existe y recibe más herencia si fuiste presidente.

---

## 6. Cómo lo haría, si das el visto bueno

1. **Aporte a la agrupación y tienda más cara**. La simulación confirma la caja por edad y lo ajusto si hace falta.
2. **Reglas de la presidencia**: dos mandatos en total, pato rengo y ex presidente.
3. **Indicadores del país y decisiones de Estado**: las 13 decisiones con su alerta y la prueba de equilibrio.
4. Simulación final y prueba en el navegador.

## Preguntas para vos

1. **¿Indicadores del país (inflación, actividad, reservas) o versión simple?** La simple mueve solo tu imagen, poder y fama. Es más rápida, pero "emitir" no se siente como emitir.
2. **¿El aporte según el cargo te parece bien**, o querés que también sume la construcción?
3. **¿Dos mandatos en toda la carrera**, sin poder volver nunca? En la Argentina real se puede volver después de un período; vos pediste una sola reelección y así lo planteé.
