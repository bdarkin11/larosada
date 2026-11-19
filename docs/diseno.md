# La Rosada — Documento de diseño

Versión 0.1 · 2026-11-06

## Idea en una línea

Una simulación seria de carrera política argentina en formato roguelike: empezás como militante a los 18 años y, decisión tras decisión, intentás llegar a la Casa Rosada, sostenerte en el poder y dejar un legado que te sobreviva.

Toma la estructura de una carrera de El Ídolo (arranque, atributos, cartas, eventos, mercado, finales con minijuegos, puntaje final) y la lleva a la política. Nombres, textos, arte y mecánicas concretas son propios.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Nombre | **La Rosada** |
| Tono | Serio, de simulación (como El Ídolo), sin humor de parodia |
| Personajes | Inspirados en figuras públicas argentinas, con otro nombre. El guion nunca les atribuye delitos |
| Proyecto | Repositorio propio, separado de Astrillón |

## Metas del jugador

1. **Llegar**: ganar la Presidencia de la Nación.
2. **Sostenerse**: completar el mandato, ganar la reelección, evitar el juicio político, la renuncia o la crisis.
3. **Trascender**: después de dejar el cargo, que tus delfines o tu ideología sigan ganando. El final máximo es que tu apellido se vuelva un "-ismo".

Además, el jugador decide **cómo** llega: transando con todos, pagando y recibiendo coimas, haciendo favores para frenar paros y piquetes, o siendo completamente honesto.

## 1. El arranque

Todas las carreras empiezan a los **18 años** en el año en curso (2027 en adelante). Los personajes basados en figuras reales ya están en la cancha y envejecen, se retiran o mueren durante la partida. Los reemplazan políticos generados por el juego.

- **El armado va en pasos, en este orden**: De dónde venís (origen) → Cómo jugás (estilo) → Carta de arranque → Qué pensás (ideología y nombre). Después empieza la carrera.
- **Provincia natal**: no se elige, se sortea según la población (Buenos Aires y la Ciudad salen casi la mitad de las veces). Define tu base inicial y los eventos regionales.
- **El centro del poder** (pedido del usuario, 2026-11-06): hacer política fuera de la Ciudad o la provincia de Buenos Aires es más difícil. Desde el interior, las cartas de fama rinden la mitad y la fama se pierde el doble de rápido. Se puede **mudar a Buenos Aires** cuando la caja llega a US$ 8.000: cuesta esa plata y la mitad del Territorio, y no pasa el año. En el paso 3, los cargos nacionales también van a costar más desde el interior.
- **Origen** (con ventajas y costos):
  - Militancia universitaria: oratoria, ideas, poca plata.
  - Sindicato: aparato y calle, mala imagen en los medios.
  - Empresario: mucha caja, poca base.
  - Outsider mediático: fama alta, sin estructura.
  - Puntero barrial: territorio fuerte, pocos contactos arriba.
  - Dinastía política: apellido y contactos, y las causas heredadas.
- **Ideología**: dos ejes, Estado ↔ Mercado y Conservador ↔ Progresista. Define a qué votantes llegás.
- **Estilo** (no se cambia después):
  - **Idealista**: no puede recibir coimas. Sube más lento, pero la Justicia casi no lo toca y su Poder Histórico tiene multiplicador.
  - **Pragmático**: puede transar, con límites.
  - **Transa**: todo vale. Caja rápida, riesgo judicial alto.
- **Carta de arranque**: elegís 1 entre 3 (por ejemplo "Pico de oro", "Amigo del intendente", "Contacto en Comodoro Py").

## 2. Atributos y medidores

Atributos (suben con cartas y experiencia, bajan con la edad). Desde el 2026-11-08 son tres: el Carisma pasó a la Fama y el Aguante al Territorio (ver "Menos estadísticas" abajo).

| Atributo | Para qué sirve |
|---|---|
| Rosca | Negociar, armar alianzas, conseguir votos en el Congreso |
| Territorio | Aparato, punteros, fiscales el día de la elección. También tu resistencia: con poco, la salud te saca antes |
| Gestión | Que tu gobierno funcione: inflación, empleo, obra pública |

Medidores, que se mueven todo el tiempo:

- **Imagen**: aprobación pública (0 a 100).
- **Caja**: plata propia, del partido y "en negro".
- **Causas**: riesgo judicial. Si sube, aparecen fiscal, indagatoria, desafuero, detención.
- **Favores**: libreta de quién te debe y a quién le debés. Cada favor se cobra algún día.

**Pretemporada → "Armado anual"**: antes de cada año elegís 1 de 3 cartas (común, rara, dorada, icónica) que suben atributos, imagen, caja o construcción.

**Desgaste político** (pedido del usuario, 2026-11-06): así como la edad baja los atributos, los años en política gastan. Desde los 15 años de carrera, la fama y la imagen bajan solas cada año, Etapas: Cara nueva (0–14), Desgaste leve (15–24: fama −1, imagen −1), Desgaste fuerte (25–34: fama −2, imagen −2), Quemado (35+: fama −3, imagen −3).

**Barra de arriba** (pedido del usuario, 2026-11-06): arriba de todo va la ficha, con el Poder (el promedio de los atributos) en un cuadrado de color, los cinco atributos y los cuatro medidores en recuadros. Cada uno lleva una flecha con lo que se movió en el último paso: verde si te conviene y roja si te resta. Abajo va la botonera: Tienda, Mudarte, Tu historia, Sector privado, Retirarte. Todo efecto se muestra como una etiqueta verde (te conviene) o roja (te resta). Bajar las causas cuenta como verde.

**Tienda** (pedido del usuario, 2026-11-06). Tiene cuatro secciones:

- **Prensa**: una entrevista por año (abajo).
- **Equipo**: se paga una vez y trabaja toda la carrera. Asesor de imagen (Imagen +1 por año), jefe de prensa (Fama +1), encuestador (+1 en cada entrevista), estudio jurídico (Causas −2 y más chance de zafar), médico personal (menos riesgo de salud), armador territorial (Construcción +1).
- **Por uno o dos años**: campaña en redes, spots, coaching de oratoria (+1 en las entrevistas), gira por los barrios.
- **Lujo**: auto, casa en un country, piso en Puerto Madero, yate. Dan fama al comprarlos, pero suben las causas: la gente pregunta de dónde salió la plata.

Lo que tenés activo se ve como íconos en la fila "Equipo" de la barra de arriba.

Las entrevistas:

| Medio | Costo | Preguntas | Pide |
|---|---|---|---|
| Radio AM de la mañana | US$ 2.500 | 3 | — |
| Streaming político | US$ 7.000 | 4 | 10 de Fama |
| Prime time en la TV abierta | US$ 18.000 | 5 | 25 de Fama |

La entrevista es un minijuego: preguntas con tres respuestas y 15 segundos para cada una. Si se acaba el tiempo, te quedaste en blanco y resta.

- Cada respuesta vale de −2 a +2.
- Las polémicas suman fama pero bajan la imagen.
- Si una respuesta toma partido, suma 1 cuando es coherente con tu ideología y resta 1 cuando te contradice.
- La fama alta suma (40 o más) y la muy baja resta (menos de 5).
- Fama ganada = base del medio + puntaje × multiplicador. Desde el interior, la fama que ganás rinde la mitad.

**Partidos** (pedido del usuario, 2026-11-06): cinco espacios ficticios, ubicados en los dos ejes: Frente Nacional y Popular, Unión Republicana, Movimiento Libertad, Coalición del Centro y Bloque de Izquierda. Arrancás en el más cercano a tu ideología.

**Cierre de listas** (adaptación del mercado de pases de El Ídolo): en cada año electoral (los impares), si tenés al menos 8 de Fama o 15 de Construcción, se frena el año y llegan ofertas.

- La primera siempre es **renovar** con tu partido: la lealtad suma construcción.
- Las otras son **pases** a dos o tres espacios distintos: plata, fama y a veces un cargo designado. A cambio bajan la construcción (más cuanto más lejos queda el espacio) y la imagen.
- Irte al espacio de enfrente es una **traición imperdonable**: Construcción hasta −30 e Imagen −6.

**Cargos designados**, mientras no haya elecciones: Asesor en el Concejo, Director municipal y Secretario municipal. Los da un partido según tu construcción, gestión y rosca, y cada uno paga más por año. Al asumir un cargo más alto hay **jura**: confeti celeste y blanco, la fórmula del juramento y tu firma escribiéndose sola.

**Balance del período**: cada cuatro años aparece una pantalla con los logros de esos años y cómo cambiaron Poder, Construcción, Fama, Imagen y Caja.

**Palmarés**: quedan registrados los logros:

- subir de etapa;
- asumir un cargo;
- una gran entrevista;
- una carta icónica;
- mudarte a Buenos Aires;
- zafar de una orden de detención;
- un pase;
- un lujo;
- ser delfín de alguien.

**Final**: además del motivo, se ven el palmarés y la trayectoria año por año (cargo, partido, Poder, Construcción, Fama, Imagen). Si terminaste vivo y libre (retiro, sector privado o salud), podés **seguir como armador**: apadrinás a un delfín, que arranca una carrera nueva en tu partido y hereda Rosca +5, un tercio de tu construcción y hasta US$ 20.000.

## 3. La escalera de cargos

Militante → Concejal → Intendente / Legislador provincial → Diputado nacional → Senador / Gobernador / Ministro → **Presidente**.

Reglas electorales reales:

- Legislativas cada 2 años, ejecutivas cada 4.
- PASO, generales y **balotaje** (gana en primera vuelta con 45 %, o 40 % con 10 puntos de ventaja).
- Antes de cada candidatura, la **interna**: ganarte la lapicera o romper y armar tu frente.
- Presidente: una sola **reelección consecutiva**. Después se espera un período y se puede volver.
- **Fueros** mientras ocupás un cargo legislativo o ejecutivo nacional.

### Implementado en el paso 3 (2026-11-06)

**Calendario**: hay elecciones los años impares. Intendente, gobernador y presidente se votan cada cuatro años (2027, 2031, 2035…); concejales, legisladores, diputados y senadores, en cualquier año impar.

| Cargo | Mandato | Cómo se gana | Pide Fama / Construcción / experiencia | Sueldo por año |
|---|---|---|---|---|
| Concejal | 4 | Tu lista pasa el 25 % | 8 / 15 / — | US$ 18.000 |
| Legislador provincial | 4 | Tu lista pasa el 26 % | 15 / 25 / un cargo | US$ 28.000 (fueros) |
| Intendente | 4 | Primero | 20 / 35 / concejal o director | US$ 40.000 |
| Diputado nacional | 4 | Tu lista pasa el 26 % | 30 / 30 / concejal o director | US$ 45.000 (fueros) |
| Senador nacional | 6 | Los dos primeros | 40 / 45 / legislador o secretario | US$ 55.000 (fueros) |
| Gobernador | 4 | Primero | 45 / 55 / intendente o diputado | US$ 60.000 (fueros) |
| Presidente | 4 | Primero, con balotaje | 60 / 50 / intendente o diputado | US$ 80.000 (fueros) |

**Requisitos de edad**: 21 años; para senador y presidente, 30. No te podés presentar al cargo que ya tenés con mandato vigente. El presidente tiene una sola reelección seguida. Si se te vence el mandato y no lo renovás, volvés al llano.

**El camino de una elección**:

1. **Candidatura**: elegís a qué te presentás, o no te presentás. Las encuestas te dan una sensación (Favorito, Competitivo, Difícil, Muy difícil). Con encuestador propio ves la intención de voto y la chance.
2. **Interna**, si alguien de tu partido también quiere ser candidato:
   - Si hay un personaje del elenco de tu partido para ese cargo, es tu rival (por ejemplo, la Jefa en el Frente Nacional).
   - **Negociar la lapicera**: depende de rosca y construcción. Si sale mal, no sos candidato.
   - **Ir a las PASO**: votan afiliados y simpatizantes, con su propio conteo animado.
   - **Romper y armar tu frente**: Construcción −8, Imagen −2 y sin el piso de votos del partido.
3. **Campaña**: austera (gratis), normal o fuerte (el triple). Cuanto más alto el cargo, más cara.
4. **Noche electoral** (pedido del usuario): los sobres caen en la urna mientras pasa el día y corre el contador de votantes; a las 18 cierran los comicios. Los sobres viajan a una computadora que carga telegramas. Después el tablero se llena mesa por mesa, desparejo al principio, con una pausa en "Faltan las últimas mesas…", y recién al 100 % aparece el sello: ¡Ganaste!, ¡Entraste!, Perdiste o ¡Hay balotaje! Se puede saltar. Durante el conteo no se muestran ni el historial ni las flechas, para no adelantar nada.

**Fuerza electoral**: se suman fama, territorio y construcción con pesos según dónde se vota (en el municipio pesan territorio y construcción; en la Nación, la fama). Además cuentan:

- la imagen;
- el piso del partido;
- la campaña;
- si vas por la reelección, la gestión;
- y, para presidente desde el interior, una penalidad.

Los votos se reparten según la fuerza elevada a 2,5, con un 30 % de azar de campaña. Los rivales generados mejoran si llegás muy fuerte, así ninguna elección es un trámite. Los personajes del elenco compiten en los cargos grandes según su perfil y se retiran a los 80.

**Al ganar**: jura, mandato, Fama y Construcción, y logros (el primer triunfo en cada cargo, "Llegaste a la Casa Rosada", reelecciones). Con un cargo electivo, un pase de partido no te saca la banca.

## 4. Construcción política (equivalente a la idolatría)

Se mide **por distrito**, en cinco niveles: Desconocido → Conocido → Referente → Caudillo → **Prócer**.

**Implementado (2026-11-06)**, por ahora como un solo número de 0 a 100 y sin separar por distrito:

- **Etapas**: Desconocido (0), Conocido (20), Referente (40), Caudillo (60) y Prócer (80). Subir de etapa se festeja con una medalla.
- **Arranque**: un cuarto de tu Territorio.
- **Por año suma**:
  - +1 con Territorio 30 o más, y +1 más con 60 o más;
  - +1 con Imagen 60 o más, y −1 con Imagen menor a 35;
  - +1 de lealtad después de 8 años en el mismo partido;
  - lo que sumen el armador territorial y la gira.
- **Arriba de Caudillo** crece a la mitad, y solo con Imagen 55 o más: para ser prócer te tienen que querer.
- **Renovar en el cierre de listas** suma 2 (arriba de Caudillo, 1 y solo si te quieren).

- Se construye con lealtad, gestión y triunfos electorales en ese distrito.
- Cambiarte de partido ("garrocha") te baja la construcción en todos lados.
- Prócer de un distrito: calle, escuela o estatua con tu nombre.

## 5. El Poder

Al principio había diez grupos de poder (sindicatos, movimientos, campo, empresarios, medios, Justicia, gobernadores, mercados, Iglesia y fuerzas). En la revisión del equilibrio (2026-11-06) se juntaron en un solo número, porque eran demasiado y pesaban poco.

**Poder**, de 0 a 100: cuánto pesás entre los que mandan, todos juntos.

- Es el cuadrado grande de arriba de la ficha (antes mostraba el promedio de los atributos).
- **Las decisiones lo suben o lo bajan**: los eventos dicen "Poder +2" o "Poder −3".
- **Se ejerce o se pierde**: cada año se acerca un 15 % al poder que te da tu lugar, que es el piso de tu cargo más un quinto de tu construcción.
  - Pisos: militante 5; asesor 12; concejal y director municipal 20; secretario municipal y legislador 30; intendente y diputado 40; senador y gobernador 55; presidente 75.
- **Arranque**: 10, más 10 si venís de una dinastía y más 5 si venís de un sindicato, una empresa o la puntería barrial.
- **Para qué sirve**:
  - en las elecciones suma (Poder − 25) × 0,2 de fuerza, de −5 a +15;
  - impunidad: tus causas avanzan entre × 1,3 (poder 0) y × 0,6 (poder 100);
  - ayuda en el desafuero, en la indagatoria y en la lapicera de las internas;
  - con 15 o menos estás solo: Imagen −1 por año y las amenazas llegan el doble;
  - con 60 o más todos te llaman: Fama +1 por año.
- Hay una carta del armado ("Un lugar en la mesa chica") y un miembro del equipo de la tienda ("Operador político") que lo suben.
- El panel **Poder** muestra una sola barra, de dónde sale tu poder y para qué te sirve, la libreta de favores y lo de por debajo de la mesa.

**Libreta de favores**: los eventos anotan favores que te deben y favores que debés, con un **quién** (Medrano, un contratista, Insúa).

- Los que te deben se cobran solos en la próxima campaña: +2 de fuerza cada uno, hasta tres.
- Los que debés te los vienen a cobrar: el evento especial "Te vienen a cobrar", con un 30 % por año.
- Cumplir cuesta plata e imagen. Si no cumplís: Poder −5 e Imagen −1.

### Implementado en el paso 4 (2026-11-06)

**Eventos**: 46 en total, uno cada año y medio en promedio.

- **15 especiales con alerta**, con 22 % por año, más si tenés fama:
  - coima de un contratista;
  - financiamiento por fuera;
  - la marcha de Grabovsky;
  - el paro de los camioneros de Medrano;
  - la carpeta de un operador;
  - la pauta del multimedio;
  - el presupuesto de Insúa;
  - la ley industrial de Rocchi;
  - los comedores de la parroquia;
  - el reclamo policial;
  - el arrepentido;
  - las retenciones;
  - la plata del barrio;
  - la investigación de Alcorta;
  - el cobro de favores.
- **31 comunes** ("Pasan cosas"):
  - figuras de la tele y el deporte: el almuerzo de Mirna Legrán, la imitación de Tirelli, la foto con Messina;
  - golpes y crisis: inundación, audio filtrado, corte de luz, paro docente, toma de tierras;
  - y más.

Cada evento tiene condiciones (cargo, fama, causas) y no se repite antes de seis años.

**La alerta** (pedido del usuario):

1. La pantalla se oscurece y tiembla, con un destello blanco y líneas de velocidad del color del tipo:
   - oferta, dorado;
   - propuesta, celeste;
   - amenaza, rojo;
   - carpetazo, violeta;
   - pedido, verde.
2. Entra el cartel en diagonal ("¡AMENAZA!") y después se achica arriba.
3. Se desliza el retrato con su placa de nombre y rol.
4. El globo de texto se escribe letra por letra; un toque lo completa.
5. Aparecen las opciones, con la consecuencia insinuada sin números.
6. Al elegir se ve qué pasó, con etiquetas en verde y rojo, y si una opción con azar salió bien o mal.

En los eventos comunes, en cambio, los números se ven antes de elegir.

**Retratos**: propios, dibujados en SVG a partir de una semilla (piel, pelo, peinado, anteojos, barba, saco y corbata). No representan a nadie: las figuras del elenco tienen siempre el mismo retrato, que sale de su nombre.

**Reglas**:

- El estilo idealista no puede aceptar coimas.
- El transa saca 50 % más plata de cada una.
- Las coimas suman Causas y quedan contadas para el paso 5.
- Las coimas y los carpetazos los hacen siempre personajes generados, nunca figuras del elenco. Alcorta investiga, pero de forma legítima.
- Hugo Medrano le pasa la conducción a Pablo cuando pasa la edad de retiro.

## 6. Corrupción y honestidad

- **Recibir coimas**: caja rápida para campañas. Sube Causas.
- **Pagar coimas**: votos en el Congreso, apoyos, silencio. Sube Causas y te expone a extorsiones.
- **Riesgos**: periodista de investigación, arrepentido, socio que traiciona, fiscal que espera que pierdas los fueros.
- **Honestidad**: sin caja negra se sube más lento, pero los carpetazos no prenden y el Poder Histórico se multiplica. Tiene que ser difícil pero viable.

### Implementado en el paso 5 (2026-11-06)

**Caja negra**:

- Las coimas no entran a la caja: van a una **caja negra** aparte, que aparece en la barra de arriba.
- Se usa para:
  - la **campaña con plata negra**: rinde más que la fuerte y suma Causas +6;
  - las **movidas por debajo de la mesa**;
  - pagar el **exilio** (se usa primero la negra).
- Si terminás preso, te la **decomisan**.

**Por debajo de la mesa** (panel Poder): son pagos en negro, una vez por año cada uno. El idealista no puede hacerlos.

| Movida | Costo | Efecto |
|---|---|---|
| Aceitar a un fiscal | US$ 20.000 × (1 + rango/2) | Sin causa abierta: Causas −8. Con causa: 55 % o más de que retroceda (Causas −10); si no, te denuncia por soborno (Causas +15, Justicia −15) |
| Comprar una tapa | US$ 15.000 | Medios +20, Fama +3, Causas +3 |
| Pagar a los punteros | US$ 10.000 | Territorio +3, Construcción +3, Causas +3 |
| Lavar plata | US$ 5.000 | Pasa hasta US$ 50.000 a la caja blanca, con el 70 %. Causas +4 |

**El rastro de las coimas**: las Causas bajan 2 por año, pero nunca por debajo de un piso: 10 por cada coima aceptada, más 5 si usaste plata negra, hasta 60. Las coimas se pagan tarde o temprano.

**La causa, por etapas** (reemplaza la orden de detención al azar):

1. **Denuncia**: con 30 de Causas o más, un fiscal puede abrirte una causa. Es más probable si la Justicia está en contra.
2. **Imputación**.
3. **Citación a indagatoria**, con alerta "¡CITACIÓN!". Opciones:
   - presentarte con los mejores abogados (si convencés al juez, la causa retrocede);
   - hablar de persecución en la puerta;
   - negarte a declarar;
   - **arrepentirte** y contar lo que sabés: archiva tu causa, pero cuesta Construcción −15, Imagen −4 y enemigos.
4. **Procesamiento**.
5. **Pedido de detención**:
   - Con **fueros**, antes se vota el **desafuero**, con alerta "¡DESAFUERO!". Podés rosquear para que no lo voten (rosca, gobernadores y construcción) o renunciar a los fueros y presentarte.
   - Sin fueros, va directo a la orden de detención. Cuando se te vence un cargo con fueros, el fiscal que te estaba esperando avanza.

Cada año la causa puede avanzar (más rápido con Causas altas y la Justicia en contra) o archivarse (si las Causas bajan de 20). Archivarla deja el logro "Sobreseído". Si zafás de una orden de detención, la causa vuelve a imputación.

**Extorsión**: con dos coimas o más, puede aparecer "Tu ex socio quiere más" (¡AMENAZA!). Podés pagarle en negro, dejar que hable (Causas +18 y la causa avanza) o apretarlo.

**Manos limpias**: si nunca aceptaste una coima ni usaste plata negra:

- aparece la marca 🤍 en la ficha;
- los carpetazos no prenden: no suman Causas y la Imagen cae un tercio;
- la Imagen vuelve sola hacia 55 en vez de 50.

El multiplicador del Poder Histórico llega en el paso 7.

**Equilibrio** (250 carreras simuladas por estilo): el honesto nunca termina preso. El que agarra todas las coimas junta unos US$ 50.000 en negro, recibe en promedio casi una citación por carrera y termina preso el 11 % de las veces (peleando siempre en la Justicia, sin usar el exilio ni las movidas).

## 7. Gobernar

En cargos ejecutivos aparecen los **indicadores**: inflación, desempleo, pobreza, reservas, seguridad. Tus decisiones los mueven y con ellos la Imagen.

- **Leyes**: hay que juntar los votos (129 en Diputados, 37 en el Senado).
- **Crisis**: devaluación, default, inundación, escándalo, paro general.
- **Fin anticipado**: juicio político, renuncia o crisis institucional.

## 8. Eventos

Tres tipos:

- **Golpe duro**: una adversidad (corrida, audio filtrado, inundación).
- **Decisión difícil**: un dilema sin opción obvia ("¿acuerdo con el FMI o default?", "¿bancás a tu ministro procesado?").
- **Pasan cosas**: la vida política cotidiana (almuerzo televisivo, asado con un gobernador, la Selección gana el Mundial).

Muchos dependen de la provincia y del cargo. Ninguna decisión es gratis.

### Eventos especiales con alerta (pedido del usuario, 2026-11-06)

Además de los eventos comunes, aparecen **al azar** eventos especiales que interrumpen el año:

- Te ofrecen una coima.
- Un movimiento te pide que aparezcas apoyándolo a cambio de votos.
- Un sindicato amenaza con un paro si no le hacés un favor.
- Un empresario te ofrece financiar la campaña "por fuera".
- Un periodista te avisa que tiene una carpeta tuya.

**Animación de entrada**, al estilo de las objeciones de los juicios de los juegos de abogados (como Ace Attorney), pero con arte y textos propios:

1. La pantalla se frena, se oscurece y tiembla.
2. Entra de golpe un cartel de alerta grande, en diagonal, con la palabra del evento ("¡OFERTA!", "¡PROPUESTA!", "¡AMENAZA!", "¡CARPETAZO!").
3. Se desliza desde un costado el retrato del personaje que te hace la oferta (el empresario, el representante del movimiento, el sindicalista), con su nombre y cargo.
4. El personaje "habla" en un globo de texto que se escribe letra por letra.
5. Aparecen las opciones (aceptar, rechazar, negociar, denunciar), cada una con su consecuencia oculta o insinuada.

Se implementa en el paso 4 (eventos) y el paso 5 (corrupción).

## 9. Momentos decisivos: los minijuegos

Las elecciones y los momentos clave se juegan:

- **Debate**: elegir respuestas contra reloj.
- **Cierre de campaña**: llenar la plaza.
- **Noche electoral**: fiscalizar mesas.
- **Rosca en el Congreso**: conseguir los votos de una ley.
- **Conferencia de prensa**: responder preguntas incómodas.

Según el estilo, pesan más la suerte o la habilidad.

## 10. El legado

- **Delfines**: discípulos que formás en la carrera, con atributos y lealtad propios.
- **Sucesión**: si tu delfín gana, tu ideología sigue sumando Poder Histórico. También te puede traicionar.
- **Después del cargo**: jefe del partido, senador (fueros), poder en las sombras, o volver.
- **Final máximo**: tu "-ismo" gana elecciones después de tu muerte.

## 11. Fin de la carrera y Poder Histórico

La carrera puede terminar de seis formas:

| Final | Cómo se llega |
|---|---|
| Retiro | Decisión propia, en cualquier momento |
| Sector privado | Decisión propia: dejás la política para trabajar en una empresa |
| Salud | El territorio y la edad te obligan a dejar |
| Muerte | Por edad, con más riesgo cuanto menos territorio |
| Preso | Te entregás ante una orden de detención, o peleás la causa y perdés |
| Exilio | Ante una orden de detención, te vas del país (cuesta plata) |

La **orden de detención** llega al azar cuando las Causas pasan de 60, con más chance cuanto más altas estén. Con fueros, la chance baja mucho. Al llegar se frena el año y hay tres salidas: pelear en la Justicia (cuesta abogados; si sale bien, bajan las Causas y seguís), irte del país o entregarte.

El **Poder Histórico** suma cargos, años en el poder, leyes, indicadores que dejaste, construcción política, legado y multiplicador de honestidad, y resta causas y condenas.

## 12. Modos (después del MVP)

Carrera libre, Carrera del Día (mismo arranque para todos), Duelo (misma partida, gana el de más Poder Histórico), Modo Ultra (de a un mandato) y Modo Historia (carreras de presidentes históricos).

## Regla para personajes basados en personas reales

- Los rasgos salen del **perfil público** de cada figura: estilo, ideología, base, trayectoria conocida, forma de hablar.
- Nombres cambiados y sin fotos reales.
- Las **causas, coimas y traiciones de los personajes las genera cada partida**: ningún personaje es corrupto "por guion". Así el juego no le atribuye delitos a nadie real y queda parejo para todas las ideologías.

## Equilibrio (revisión del 2026-11-06)

Detalle y números en `propuesta-balance.md`. Lo que quedó implementado:

- **La plata a escala**. Ninguna cifra es fija:
  - un costo es un porcentaje de tu caja, con un piso de 4 sueldos por cada 100 %;
  - una ganancia es un porcentaje de tu caja, con el mismo piso y un **tope de US$ 40.000** (también para las coimas, aunque con estilo transa rinden × 1,5);
  - en pantalla se ve el monto y qué parte de tu caja es: "−US$ 9.600 Caja · 8 % de tu caja".
- **La estructura cuesta**: US$ 4.500 más el 3 % de la caja por año. Las campañas cuestan el mínimo del cargo o un porcentaje de tu caja (normal 8 %, fuerte 20 %, negra 30 % de la caja negra), lo que sea más.
- **La tienda**: el equipo se paga una vez, a precio fijo. El precio sale de lo que da: puntos por año, por ocho años, a US$ 1.500 el punto. Los consumibles cuentan solo los años que duran. Los lujos siguen con su precio.
- **Rendimientos decrecientes**: subir Imagen, Fama o Poder rinde más si estás abajo y menos si estás arriba; perder duele más si estás arriba. La construcción, arriba de 50, crece cada vez menos, y arriba de Caudillo, con Imagen menor a 55, a la mitad.
- **Fama**: se apaga un 6 % por año (9 % lejos de Buenos Aires) y tener un cargo da visibilidad (+ la mitad del rango por año).
- **Eventos**: los 49 se reescribieron. Toda opción gana algo y cede algo, las opciones valen parecido en una escala común de puntos y se pagan con monedas distintas. Al rechazar una coima se ve "🤍 Mantenés las manos limpias", y al aceptarla, que perdés las manos limpias y que deja rastro.
- **Prueba de equilibrio** (`motor/balance.test.ts`): revisa los 49 eventos en tres momentos de una carrera típica y falla si:
  - hay una opción dominada;
  - una opción no cede casi nada;
  - las opciones se separan más de lo permitido;
  - un costo queda fuera del 3 % al 35 % de la caja.
- **Simulación** (`motor/simulacion.test.ts`, a pedido): 300 carreras honestas y 300 corruptas. Medianas del jugador honesto:

| Edad | Caja | Fama | Poder | Construcción |
|---|---|---|---|---|
| 25 | US$ 18.700 | 7 | 11 | 12 |
| 35 | US$ 70.100 | 14 | 20 | 43 |
| 45 | US$ 137.900 | 26 | 34 | 62 |
| 60 | US$ 205.000 | 29 | 46 | 71 |

Antes, la caja llegaba a US$ 521.000 a los 60, la fama vivía en 5 y la construcción, en 75 a los 55.

## Presidencia, promesas y la calle (2026-11-07)

Pedido del usuario: que terminar con plata no sea fácil, que cada decisión cuente y que llegar a presidente sea difícil si no decidís con lógica. Detalle en `propuesta-presidencia.md`.

- **Aporte a la agrupación**: cada año, una parte del sueldo va para tu gente.
  - Militante 0 %; asesor 10 %; concejal y director municipal 25 %; legislador y secretario municipal 40 %; intendente y diputado 50 %; senador y gobernador 55 %; presidente 60 %.
  - Se suma 5 % por etapa de construcción desde Referente (Referente 5 %, Caudillo 10 %, Prócer 15 %).
- **Tienda al doble**: el punto de las mejoras pasa de US$ 1.500 a US$ 3.000.
- **Peso de las decisiones**: con poca fama y poco poder te pasan pocas cosas. La chance de un evento por año crece con (Fama + Poder) / 2:
  - especiales, del 5 % al 40 %;
  - comunes, del 15 % al 60 %.
- **Coherencia**: muchas opciones tienen una postura (Estado ↔ Mercado, conservador ↔ progresista).
  - Si va con tus ideas: Imagen +1.
  - Si va en contra: Imagen −2, Poder −2 y calle +10. Además, durante ocho años cada incoherencia resta 2 de fuerza en las elecciones (hasta −8).
- **Promesas de campaña**: hasta dos por elección.
  - Suman +2 de fuerza; +3 si van con tus ideas, +1 si no te las creen.
  - Si ganás, quedan vigentes todo el mandato.
  - Se rompen al elegir algo que las contradice (lo ves antes de elegir) y cuesta Imagen −6, Poder −4 y calle +25. Además, durante ocho años resta 3 de fuerza por promesa rota.
  - Cumplidas al final del mandato: Imagen +3, Poder +2 y al palmarés.
- **La calle** (malestar, de 0 a 100):
  - **Sube** con promesas rotas, incoherencias, decisiones impopulares, un mal país e Imagen menor a 30.
  - **Se enfría** un cuarto por año.
  - **Paros y marchas**: con cargo, chance por año igual al malestar de un paro general (si sos ejecutivo) o una movilización. Todas las salidas bajan el poder.
  - **Con 50 o más**: Poder −3 por año y −3 de fuerza en las elecciones.
- **Presidencia**:
  - **El país**: al asumir heredás inflación, actividad y reservas sorteadas. Se mueven solos cada año, pegan en tu imagen y en la calle, y cómo lo entregás queda en el palmarés.
  - **Decisiones de Estado**: 14, con alerta propia ("¡DECISIÓN DE ESTADO!"), entre ellas:
    - recortar o cargar al privado;
    - retenciones;
    - emitir, pedir al Fondo o ajustar;
    - dólar, tarifas, reforma laboral, jubilados, aerolínea, Corte, provincia quebrada, gas, inseguridad;
    - el Fondo, y el sucesor en el segundo mandato.
  - Reemplazan a los eventos de todos los días. Siguen pudiendo caerte carpetazos, la extorsión, los cobros de favores y la Justicia.
  - Con reservas por debajo de 20, la corrida del dólar se fuerza.
- **Mandatos**: dos seguidos como máximo; se puede volver después de un período.
- **Pato rengo**: en el segundo mandato, el piso de poder de la presidencia baja de 75 a 55.
- **Ex presidente**:
  - durante ocho años, Fama −2, Imagen −2 y −1 en cada atributo por año;
  - durante cuatro años, las causas avanzan × 1,5 (salvo con las manos limpias);
  - −8 de fuerza en cualquier elección;
  - sin cargo, tu poder tiende a 35.
- **Edad**: Avellaneda, el presidente más joven de la historia, asumió con 37 años. Por debajo de esa edad, la candidatura presidencial resta 3 de fuerza por cada año que falta. La ley sigue pidiendo 30 años para presentarse.
- **Simulación** (300 carreras de un jugador razonable que no hace promesas):
  - caja típica de US$ 66.000 a los 60 (antes, US$ 205.000);
  - llegan a presidente 5 de 300 (antes, 19), con 47 años como mínimo y 51 de mediana.

## Gobernar: el Congreso y las leyes (paso 6a, 2026-11-07)

Detalle en `propuesta-gobernar.md`.

- **Tu bloque**: al ganar la presidencia, tus diputados (de 257) y senadores (de 72) salen de tus votos, con ruido. La mayoría es 129 y 37. Se ve en la fila del país.
- **Legislativas de medio término**: a dos años del final de cada mandato, el bloque crece o se achica según la Imagen, el país y la calle. Mayoría propia en las dos cámaras da un logro.
- **Presupuesto**: cada año se vota solo. Si no sale, Poder −3 e Imagen −1.
- **Un proyecto de ley por año** (11 en total), con alerta "¡PROYECTO DE LEY!", después de la decisión de Estado. Tres salidas:
  - mandarla al Congreso: la chance sale del bloque, la Rosca y el Poder, menos la dificultad de la ley; si la rechazan, Poder −3 e Imagen −1;
  - sacarla por decreto, si se puede (las de impuestos y las penales, no): sale seguro, pero Poder −3 y calle +8;
  - guardarla: Poder −1.
- Las leyes tienen postura y etiquetas como las decisiones de Estado: cuentan para la coherencia y pueden romper promesas. Las aprobadas quedan anotadas (la primera da un logro) para el Poder Histórico del paso 7.

## Gobernar: crisis que duran (paso 6b, 2026-11-07)

- Cuatro crisis, que empiezan al cerrar el año según el país y la calle:

| Crisis | Empieza con | Se termina sola con | Pesa cada año |
|---|---|---|---|
| Corrida cambiaria | Reservas < 20 | Reservas ≥ 30 | Inflación +20, Imagen −2 |
| Default | Reservas < 8 | Reservas ≥ 25 | Actividad −8, Poder −4 |
| Hiperinflación | Inflación > 200 | Inflación < 80 | Imagen −5, calle +15 |
| Estallido social | Calle ≥ 80 | Calle < 40 | Poder −5, Actividad −3 |

- Mientras haya una abierta, la decisión del año es cómo salir de la más vieja (alerta "¡CRISIS!"), en lugar de la decisión de Estado. Cada una tiene tres salidas: dos que, si salen bien, la terminan, y una segura que alivia sin terminarla (cepo, vivir con lo nuestro, congelar precios, reprimir).
- Salir de una crisis da Poder +5 y un logro. Dejar la presidencia en crisis queda anotado.
- Reemplaza a la corrida forzada de antes: el evento "El dólar se dispara" sigue como decisión de Estado común.
- En la prueba de equilibrio, terminar una crisis vale 8 puntos; las tres salidas de cada crisis quedan entre 1,2 y 3,1.
- Con un presidente neutral, el 7 % de los mandatos cae en alguna crisis, casi siempre una corrida.

## Gobernar: fin anticipado (paso 6c, 2026-11-07)

- **Juicio político** (alerta "¡JUICIO POLÍTICO!"): llega si se dan las tres cosas:
  - Imagen menor a 45;
  - menos de un tercio de diputados **leales** (86). Con la Imagen por debajo de 70 los tuyos te abandonan: tus leales son tu bloque × Imagen / 70;
  - algo de qué agarrarse: una crisis, Causas de 40 o más, la calle en 30 o más, o una promesa rota en este mandato.
  - Salidas: rosquear para frenarlo (tus leales, tu Rosca y tu Poder), defenderte en el Congreso (tu Fama y tu Imagen) o renunciar. Si sale mal, te destituyen.
- **Pedido de renuncia** (alerta "¡QUE SE VAYA!"): Imagen menor a 40 en medio del caos (estallido, dos crisis, o una crisis con la calle en 25 o más). Se mira la Imagen y no el Poder, porque el del presidente vuelve rápido al 75 del cargo.
  - Salidas: renunciar, resistir (tu Poder y tu Territorio; si sale mal, crisis institucional) o un gobierno de unidad (Poder −6, calle −30).
- Van antes que cualquier otro evento y no se repiten hasta dos años después.
- **Tres finales nuevos**: destituido, renuncia y caos (crisis institucional). La carrera termina ahí.
- En la prueba de equilibrio, terminar la carrera vale −40; estos dos eventos quedan exceptuados de la comparación entre opciones.
- Medición (300 primeros mandatos desde Imagen 52): no terminan el 12,3 % si se juega con criterio y el 16 % si se juega al azar (meta: entre 10 % y 20 %). Con la reelección, más.

## Gobernar abajo: intendentes y gobernadores (paso 6d, 2026-11-07)

- **Tu distrito**: al asumir una intendencia o una provincia heredás dos números de 0 a 100, **Cuentas** (si te alcanza la plata) y **Gestión** (obras, servicios, seguridad). Se ven en la cabecera, debajo de las estadísticas.
- **Cada año**:
  - **Coparticipación**: si sos del partido que gobierna la Nación, Cuentas +3; si no, −3. El gasto crece solo (−2). Quién gobierna la Nación se sortea cada cuatro años (si el presidente sos vos, sos vos).
  - **Presupuesto** en el Concejo o la Legislatura: depende de tu Rosca, tu Poder y si sos aliado. Si no sale, Gestión −4 y Poder −2.
  - **La gestión** se mueve con tu atributo Gestión, y se frena sin plata (Cuentas menor a 30: Gestión −5).
  - Gestión 65 o más: Imagen +2. Gestión 35 o menos: Imagen −2 y calle +5. Cuentas menor a 15: no alcanza para los sueldos (Imagen −2, calle +10).
- **Decisiones de gestión** (8): basura, aumento a estatales, la obra del siglo, tasas, inseguridad, colectivos, fondos de la Nación (solo si sos opositor) y un crédito para obras. Salen la mitad de las veces que te toca un evento común. Las que dependen de la Nación salen mejor si sos aliado.
- **Pesa en las elecciones**: tu nota de gestión ((Gestión − 50) / 8 + (Cuentas − 50) / 16, entre unos −9 y +9) suma o resta fuerza mientras gobernás y durante los cuatro años después de entregar. Entregar con Gestión 70 o más da un logro.
- En la prueba de equilibrio hay un perfil nuevo (E, intendente). Cuentas vale 0,2 por punto y Gestión 0,3.

## Legado: el Poder Histórico (paso 7a, 2026-11-07)

Detalle y respuestas en `propuesta-legado.md`. Cada carrera va aparte (sin linaje ni "-ismo").

- Al terminar, la pantalla final muestra el **Poder Histórico** con su desglose:
  - años en cargos × rango × 1,5 (un año de presidente, 9);
  - mandatos completos de presidente +80 (reelecto, +40 más); leyes aprobadas +15;
  - cómo dejaste el país (de −60 a +60) y tus distritos (nota de gestión × 5);
  - crisis superadas +25; promesas cumplidas +10 y rotas −15;
  - construcción final: Referente +20, Caudillo +50, Prócer +100; logros +5;
  - causas al final −1 por punto; destituido −100, crisis institucional −150, renuncia −50.
- **Multiplicador**: manos limpias × 1,25; cada coima × 0,9 (piso × 0,5); preso × 0,5; exilio × 0,6. Nunca da negativo.
- **Las mejores carreras**: las 10 de más Poder Histórico de este navegador (`larosada.historicos`), en la pantalla final (con la tuya resaltada y tu puesto) y en la de inicio.
- Simulación: una carrera honesta típica saca 321 (la mejor, 564); una corrupta, 167.

## Legado: tus delfines (paso 7b, 2026-11-07)

- Desde **Referente**, el botón 🐬 Delfín suma a alguien joven de tu espacio
  (US$ 5.000 y Poder −3, uno por año, hasta dos). Tiene nombre, edad,
  **talento** (25 a 90, su techo) y **lealtad** (55 a 85 al empezar).
- Cada año crece talento/25 + tu construcción/30, hasta su talento. Más allá,
  solo con tu apoyo (los eventos).
- La lealtad sube 1 si tu Imagen está en 55 o más; baja 2 si tu Imagen está
  abajo de 35, 2 si tu Poder está abajo de 25 y 1 si ya pesa más que vos.
  Abajo de 25, cada año tiene 35 % de chance de **traicionarte**: se va a otro
  partido y se lleva Construcción (2 + crecimiento/8, tope 8) y Poder −2.
- **En las elecciones**, los que tienen lealtad 40 o más suman crecimiento/20,
  y +2 si ganaron una banca; tope +6 (`ajustesDeHistoria`).
- **Eventos** (`datos/delfines.ts`, 25 % por año si alguno aplica; habla el delfín):
  - "quiere ser candidato": bancar su candidatura, que haga la suya, o frenarla;
  - "te critica en público", con lealtad baja y tu Imagen baja: arreglar,
    bajarle el precio o hacerte el distraído.
- **Poder Histórico**: crecimiento/4 por cada delfín que sigue con vos; −10 por
  cada traición.
- **Sucesión**: al terminar vivo y libre, le pasás la posta a uno de tus
  delfines o a alguien nuevo. El delfín hereda crecimiento/5 más de
  Construcción, talento/15 más de Rosca y la plata × (1 + lealtad/100). Su
  nombre queda propuesto en el armado.
- Simulación (300 carreras): honesta típica 358 de Poder Histórico, corrupta 201.
  Se van por traición el 7 % de los delfines honestos y el 20 % de los corruptos.

## 32 decisiones y 15 % de presidentes (2026-11-20)

Pedido del usuario: unas 32 decisiones por carrera y que llegue a presidente el 15 %.

- **Elecciones cada cuatro años**, todo junto: bancas, intendentes, gobernadores y presidente (`esAnioElectoral` = `esAnioEjecutivo`). Las legislativas de medio término del presidente siguen.
- **El turno llega hasta la próxima elección** (`aniosDelTurno`, cuatro años como mucho). Los eventos y las leyes se sortean solo al cerrar el turno, con más chance (especial: 15 % + peso/200, hasta 45 %; común: 60 % + peso/150, hasta 90 %).
- **Las cartas valen el triple** (`FACTOR_CARTA`) y **el cargo da visibilidad igual a su rango** por año (antes, la mitad).
- **Presidente**: 30 de Fama, 45 de Construcción y rivales de nivel 22.
- **Simulación** (300 carreras de cada tipo): 31 decisiones por carrera; presidentes 44 honestos (15 %) y 47 corruptos (16 %); duración estimada típica, 10 minutos (de 3 a 22).

## Recorte de pantallas (2026-11-20)

Segundo recorte, para acercarse a los 7 minutos:

- **Solo te presentás para subir de cargo.** La única reelección es la del presidente. Si al terminar tu mandato no subís, volvés al llano.
- **Si hay un solo cargo posible**, la elección arranca directo en la campaña (o la interna), con un botón para no presentarte.
- **Debate** solo para gobernador y presidente.
- **Eventos**: como mucho uno cada cuatro años (`ANIOS_ENTRE_EVENTOS`). No esperan las caídas, los cobros de favores, la calle, los delfines, las crisis ni las leyes.
- **Festejos**: solo la jura tiene pantalla. La etapa de construcción y el balance van a la bitácora.
- **Cierre de listas**: solo aparece si alguna oferta te sube de cargo; si no, renovás sin pantalla.
- **Presidente**: pide 45 de Fama (antes 60), porque en 30 años de carrera se llega con menos.
- **Simulación** (300 carreras, mismos segundos por pantalla): la partida típica baja de 24 a 15 minutos (de 5 a 24). Presidentes: 1 honesto y 1 corrupto cada 300, porque el jugador de la simulación solo se presenta con 30 % de chance o más.

## Partidas más cortas (2026-11-20)

Pedido del usuario: que una partida dure unos 7 minutos.

- **Años de militancia** (`datos/formacion.ts`, `motor/formacion.ts`): de los 18 a los 35 no hay cartas, elecciones ni eventos. Son 4 decisiones que mueven tus ideas y algo de tu ficha; al terminar, crecés lo que se crecía en esos años (Territorio +12, Rosca +8, Gestión +6, Construcción +25, US$ 25.000) y te pasás al partido que más se parece a lo que pensás.
- **Candidato desde los 35**: antes no se abren elecciones ni cierres de listas.
- **Jubilación a los 65**: la carrera termina con un retiro, tengas el cargo que tengas. Como mucho, 30 años de carrera.
- **Turnos de dos años**: cada carta pasa dos años, salvo que el primero deje algo para decidir (elección, evento, cierre de listas, detención). Las cartas valen el doble.
- **Menos pantallas**:
  - a mitad de mandato solo te presentás a un cargo más alto, y no hay cierre de listas;
  - la noche solo se fiscaliza si está peleada (a menos de 6 puntos de lo que define la elección), y dura 20 segundos;
  - el balance sale cada 8 años;
  - los eventos salen menos (especiales: 3 % + peso/300, hasta 25 %; comunes: 8 % + peso/240, hasta 30 %).
- **Simulación** (300 carreras, mismos segundos por pantalla que antes): la partida típica bajó de 46 a 24 minutos (de 15 a 39). Presidentes: 12 honestos y 9 corruptos (antes 5 y 6).

## Fiscalizar las mesas (paso 8c, 2026-11-20)

En toda general, después del debate y antes del escrutinio. Los votos se reparten primero (`votarGenerales`), se fiscalizan y recién ahí se define quién ganó. La lógica está en `motor/fiscalizacion.ts`.

- **La noche**: 30 segundos. De 9 a 16 mesas según el cargo; la Construcción pone fiscales fijos en el 20 % al 60 % de ellas.
- **Fiscales volantes**: 3, y 4 si tenés un delfín leal. Tardan 2 segundos en llegar y quedan ocupados 5.
- **Incidentes**: 15 + mesas/4, y 4 más si gobierna otro partido. Tienen de 4 a 6 segundos de plazo (3 más si la mesa tiene fiscal fijo). Los de las mesas sin fiscal pesan 1,5.
- **Votos**: de −6 (nada salvado) a +4 (todo salvado) puntos sobre tu porcentaje, que se les sacan o se les dan a los rivales en proporción. El balotaje recibe el mismo ajuste.
- **Saltearla**: −1,5. Jugada regular rinde entre −2 y 0; jugada bien, de +2 a +3.
- **Palmarés**: "La ganaste en las mesas" si ganás y sin fiscalizar habrías perdido.
- **Cuánto dura una partida** (simulación de 300 carreras): 57 años de juego, 27 eventos, 11 elecciones y 2 debates. Con tiempos estimados por pantalla, la mediana es de 46 minutos (entre 15 y 95).

## La rosca en el Congreso (paso 8b, 2026-11-09)

Si no tenés mayoría propia, los proyectos de ley suman "Rosquearla vos". La lógica está en `motor/rosca.ts`; los bloques, en `datos/rosca.ts`.

- **La mesa**: de 6 a 8 bloques indecisos que juntan una vez y media lo que te falta en cada cámara (como mínimo 24 diputados y 8 senadores). Una o dos parejas están peleadas: si arreglás con uno, el otro se ofende.
- **Presupuesto de rosca**: 8 + Rosca/20 + Poder/25. Arreglar con todos cuesta 9,5 + 24 × lo que te falta de la cámara más flaca (en proporción): cuanto más lejos estás, más te piden.
- **Lo que piden**, y se paga al votar, salga o no:
  - una obra: 3 % de la Caja;
  - un cargo: Poder −2;
  - un cambio en la ley: rinde 25 % menos por cada cambio, hasta un piso de 40 %;
  - una promesa: un favor cruzado (le debés uno y te debe uno).
- **La votación**: cada bloque puede faltar (5 % + la mitad de la dificultad de la ley, y la Rosca lo baja; entre 2 % y 20 %). Si no llegás a 129 y 37, te la rechazan.
- **Saltearla**: mandarla sin negociar y sin mayoría resta 10 puntos a `chanceLey`.
- **Calibración** (Rosca y Poder 50, 400 mesas): con 105/30 bancas, hoy 57 % y jugándola en orden 52 %; con 95/26, 39 % y 42 %. Lo que gana el que elige bien es margen y pagar menos.
- **Simulación** (300 carreras): presidentes 6 honestos y 4 corruptos; Poder Histórico mediano 360.

## El debate (paso 8a, 2026-11-08)

Antes de las generales a intendente, gobernador y presidente, después de elegir
la campaña. Lo que se juega está en `motor/debate.ts`; las preguntas, en `datos/debates.ts`.

- **Rondas**: 4, o 5 para presidente. Arranca una pregunta seria y después casi siempre se alternan con las chicanas del rival más fuerte.
- **Puntaje por ronda**:
  - acertarle (propuesta a la seria, contraataque a la chicana): +2;
  - errarle: −1;
  - evasiva: 0;
  - en blanco: −2;
  - si la respuesta toma partido: +1 si va con tus ideas, −1 si te contradice.
- **Fuerza en la general**: (promedio por ronda − 0,5) × 4, entre −10 y +10. Acertar todo da +6; acertar todo con tus ideas llega a +10. El coaching suma +1.
- **Saltearlo**: −2,5. Contestar todo con evasivas da −2.
- **Fama**: más segundos (de 10 a 16) y, con 40 o más, tu asesor te dice qué te tiraron. Ganarlo da de +1 a +4 según el cargo; un papelón (−5 o peor), −1.
- **Palmarés**: "Ganaste el debate" con +5 o más.
- **Elenco**: las chicanas y las respuestas hablan de ideas y gestión, nunca de delitos. Una prueba lo revisa.
- **Simulación** (300 carreras con un debate regular): presidentes 6 honestos y 4 corruptos; Poder Histórico mediano 361.

## Menos estadísticas (2026-11-08)

Pedido del usuario: menos números que cuidar. Detalle en `propuesta-estadisticas.md`.

- **Tres atributos**: Rosca, Territorio y Gestión. Los medidores no cambian.
- **La Fama absorbe al Carisma**:
  - en las elecciones, la Fama pesa 0,3 en el municipio, 0,45 en la provincia y 0,5 en la Nación;
  - donde se pedía Carisma (entrevista, defenderte en el juicio político, salidas de crisis y de gestión) se usa la Fama + 20 (`presencia`, en `datos/valor.ts`);
  - los eventos y el armado que daban Carisma dan Fama (el armado, la mitad);
  - el elenco junta su Carisma en su Fama.
- **El Territorio absorbe al Aguante**:
  - la salud depende del Territorio, pero desde los 50 cada año resta 2,5 de lo que protege (`DESGASTE_SALUD`);
  - los eventos que daban Aguante dan Territorio, escalados (mínimo 1 punto).
- **Cartas**: salen "Taller de oratoria", "Orador en un acto" y "Rutina y médico de cabecera".
- **Tienda**:
  - el médico solo baja el riesgo de salud;
  - el coaching de oratoria da +1 en las entrevistas por dos años;
  - salen las vacaciones;
  - la casa en un country pasa a US$ 45.000.
- **Partidas guardadas**: versión 9. Se pierden Carisma y Aguante sin compensar; las cartas que ya no existen pasan a sus parecidas.
- **Simulación** (300 carreras de cada tipo):
  - presidentes: 5 honestos (antes 5) y 3 corruptos (antes 7);
  - Poder Histórico mediano: 365 (antes 358);
  - Fama y Construcción por edad, parecidas a las de antes;
  - sigue en carrera a los 75 casi la misma cantidad.

## Tecnología

La misma base que Astrillón: TypeScript, Vite y Vitest, juego web publicado en Vercel. Contenido (eventos, personajes, cartas, provincias) en archivos de datos separados del código. Guardado local de la carrera en curso. Azar con semilla, para poder hacer la Carrera del Día y el Duelo.

## MVP y pasos

Se trabaja por pasos, con prueba y visto bueno al final de cada uno.

1. Base del proyecto y motor de carrera: el paso de los años, atributos y medidores, en pantallas simples.
2. Armado del personaje: provincia, origen, ideología, estilo, carta de arranque.
3. Escalera de cargos y elecciones: internas, PASO, generales, balotaje.
4. Poder, favores y los primeros eventos (los grupos de poder se juntaron en un solo Poder en la revisión del equilibrio).
5. Corrupción y Justicia: coimas, causas, fueros.
6. Gobernar: indicadores, leyes y crisis.
7. Legado, sucesión y pantalla final con Poder Histórico.
8. Minijuegos (los primeros tres).
9. Estética, compartir carrera y publicación.
