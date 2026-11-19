import type { Ambito } from './cargos';

/**
 * Las preguntas del debate. Las serias las hace el moderador y se ganan con
 * una propuesta; las chicanas las tira el rival y se ganan con un
 * contraataque. La evasiva no suma, pero tampoco te hunde.
 *
 * Las chicanas son sobre ideas y gestión, nunca sobre delitos: el rival puede
 * ser una persona real con el nombre cambiado.
 */

export type TipoPreguntaDebate = 'seria' | 'chicana';
export type TipoRespuestaDebate = 'propuesta' | 'contraataque' | 'evasiva';
export const TIPOS_RESPUESTA: TipoRespuestaDebate[] = ['propuesta', 'contraataque', 'evasiva'];

export interface RespuestaDebate {
  texto: string;
  /** Si toma partido: suma si va con lo que pensás y resta si te contradice. */
  postura?: { eje: 'economia' | 'social'; lado: 1 | -1 };
}

export interface PreguntaDebate {
  id: string;
  tipo: TipoPreguntaDebate;
  texto: string;
  /** Si solo sale en algunos debates (el barrio, la provincia, el país). Sin esto, sale en todos. */
  ambitos?: Ambito[];
  respuestas: Record<TipoRespuestaDebate, RespuestaDebate>;
}

const ECONOMIA_MERCADO = { eje: 'economia', lado: 1 } as const;
const ECONOMIA_ESTADO = { eje: 'economia', lado: -1 } as const;
const SOCIAL_PROGRESISTA = { eje: 'social', lado: 1 } as const;
const SOCIAL_CONSERVADOR = { eje: 'social', lado: -1 } as const;

export const PREGUNTAS_DEBATE: PreguntaDebate[] = [
  /* Serias: las hace el moderador. */
  {
    id: 'seguridad',
    tipo: 'seria',
    texto: 'La inseguridad es lo que más preocupa según todas las encuestas. ¿Qué vas a hacer el primer mes?',
    respuestas: {
      propuesta: { texto: 'Cámaras en cada esquina oscura, patrulleros por cuadrante y un mapa del delito abierto a todos.' },
      contraataque: { texto: 'Lo primero es dejar de hacer lo que hizo mi rival, que no hizo nada.' },
      evasiva: { texto: 'La seguridad es un tema de todos y hay que abordarlo de manera integral.' },
    },
  },
  {
    id: 'empleo',
    tipo: 'seria',
    texto: 'Cerraron dos fábricas este año. ¿Cómo se genera trabajo?',
    respuestas: {
      propuesta: { texto: 'Bajar impuestos a quien contrate y sacar trabas para abrir un comercio.', postura: ECONOMIA_MERCADO },
      contraataque: { texto: 'Pregúntenle a mi rival, que se sacó la foto en la fábrica y después desapareció.' },
      evasiva: { texto: 'El trabajo es dignidad, y en eso estamos todos de acuerdo.' },
    },
  },
  {
    id: 'salud-publica',
    tipo: 'seria',
    texto: 'En el hospital hay meses de espera para un turno. ¿Qué proponés?',
    respuestas: {
      propuesta: {
        texto: 'Más presupuesto para la salud pública, turnos por teléfono y médicos en los barrios.',
        postura: ECONOMIA_ESTADO,
      },
      contraataque: { texto: 'Mi rival se atiende en una clínica privada. ¿Qué va a saber de los turnos?' },
      evasiva: { texto: 'La salud no es un tema para usar en campaña.' },
    },
  },
  {
    id: 'educacion',
    tipo: 'seria',
    texto: 'Uno de cada dos chicos no entiende lo que lee al terminar la primaria. ¿Qué hacés?',
    respuestas: {
      propuesta: { texto: 'Una hora más de lectura por día y una evaluación anual con resultados públicos por escuela.' },
      contraataque: { texto: 'Ese número es la herencia de los que gobernaron antes, y mi rival estaba ahí.' },
      evasiva: { texto: 'La educación es el futuro, y el futuro se construye entre todos.' },
    },
  },
  {
    id: 'impuestos',
    tipo: 'seria',
    texto: '¿Vas a subir o a bajar los impuestos?',
    respuestas: {
      propuesta: { texto: 'Los voy a bajar, empezando por los que pagan los que menos tienen.', postura: ECONOMIA_MERCADO },
      contraataque: { texto: 'Mi rival los subió cada vez que pudo. Que lo explique primero.' },
      evasiva: { texto: 'No es momento de prometer números que después no se cumplen.' },
    },
  },
  {
    id: 'aborto-ley',
    tipo: 'seria',
    texto: '¿Qué pensás de la ley de interrupción del embarazo?',
    respuestas: {
      propuesta: { texto: 'Es un derecho conquistado y lo vamos a garantizar en todos los hospitales.', postura: SOCIAL_PROGRESISTA },
      contraataque: { texto: 'Mi rival cambió tres veces de opinión. Yo por lo menos tengo una.' },
      evasiva: { texto: 'Es un tema muy íntimo y respeto todas las posiciones.' },
    },
  },
  {
    id: 'familia',
    tipo: 'seria',
    texto: '¿Qué lugar le das a la familia en tu gobierno?',
    respuestas: {
      propuesta: {
        texto: 'El centro: asignación por hijo, guarderías en los barrios y la escuela con valores.',
        postura: SOCIAL_CONSERVADOR,
      },
      contraataque: { texto: 'Más que mi rival, que habla de la familia y vota en contra de los jardines.' },
      evasiva: { texto: 'Todas las familias son importantes, cada una a su manera.' },
    },
  },
  {
    id: 'ambiente',
    tipo: 'seria',
    texto: 'Las inundaciones son cada vez peores. ¿Qué vas a hacer?',
    respuestas: {
      propuesta: { texto: 'Obras de desagüe donde se inunda siempre y prohibir construir en los humedales.' },
      contraataque: { texto: 'La última inundación agarró a mi rival de vacaciones. Eso lo dice todo.' },
      evasiva: { texto: 'El clima está cambiando en todo el mundo, no solo acá.' },
    },
  },
  {
    id: 'vivienda',
    tipo: 'seria',
    texto: 'Los jóvenes no pueden alquilar ni comprar. ¿Cuál es tu plan?',
    respuestas: {
      propuesta: { texto: 'Créditos a tasa fija para la primera casa y lotes con servicios a precio de costo.', postura: ECONOMIA_ESTADO },
      contraataque: { texto: 'Con las ideas de mi rival los alquileres se fueron a las nubes.' },
      evasiva: { texto: 'La vivienda es un sueño de todos, y lo vamos a acompañar.' },
    },
  },
  {
    id: 'transparencia',
    tipo: 'seria',
    texto: '¿Cómo podemos saber en qué gastás la plata pública?',
    respuestas: {
      propuesta: { texto: 'Cada peso en una página abierta, con las licitaciones transmitidas en vivo.' },
      contraataque: { texto: 'Esa pregunta hay que hacérsela a los que gobiernan ahora, no a mí.' },
      evasiva: { texto: 'Siempre fui una persona transparente, y la gente lo sabe.' },
    },
  },
  {
    id: 'baches',
    tipo: 'seria',
    ambitos: ['municipal'],
    texto: 'Los vecinos se quejan de los baches y la basura. ¿Qué hacés primero?',
    respuestas: {
      propuesta: { texto: 'Un plan de cien cuadras por mes y una aplicación para avisar dónde hay un bache.' },
      contraataque: { texto: 'Los baches tienen nombre y apellido, y lo tengo sentado al lado.' },
      evasiva: { texto: 'Los servicios son importantes y los vamos a mirar con atención.' },
    },
  },
  {
    id: 'transporte-local',
    tipo: 'seria',
    ambitos: ['municipal', 'provincial'],
    texto: 'Los colectivos pasan cada cuarenta minutos. ¿Cómo lo arreglás?',
    respuestas: {
      propuesta: { texto: 'Carriles exclusivos, frecuencias fijas y el boleto controlado en tiempo real.' },
      contraataque: { texto: 'Mi rival no se tomó un colectivo en su vida. Por eso no le importa.' },
      evasiva: { texto: 'El transporte es un tema complejo que depende de muchos actores.' },
    },
  },
  {
    id: 'coparticipacion',
    tipo: 'seria',
    ambitos: ['provincial'],
    texto: 'La provincia depende de la plata que manda la Nación. ¿Cómo la vas a conseguir?',
    respuestas: {
      propuesta: { texto: 'Con una mesa con los demás gobernadores para cambiar el reparto, y sin pedir favores.' },
      contraataque: { texto: 'Mi rival se arrodilla ante la Rosada. Yo voy a pelear.' },
      evasiva: { texto: 'Vamos a dialogar con todos, como corresponde.' },
    },
  },
  {
    id: 'inflacion-pais',
    tipo: 'seria',
    ambitos: ['nacional'],
    texto: 'La inflación está en dos dígitos. ¿Cómo la bajás?',
    respuestas: {
      propuesta: {
        texto: 'Equilibrio fiscal desde el primer día y un Banco Central que no imprima para el gobierno.',
        postura: ECONOMIA_MERCADO,
      },
      contraataque: { texto: 'La inflación la generaron las mismas ideas que defiende mi rival.' },
      evasiva: { texto: 'La inflación es un fenómeno multicausal, y así hay que tratarla.' },
    },
  },
  {
    id: 'deuda',
    tipo: 'seria',
    ambitos: ['nacional'],
    texto: '¿Vas a pagar la deuda con el Fondo?',
    respuestas: {
      propuesta: { texto: 'Sí, pero renegociando los plazos para que no la pague el que menos tiene.', postura: ECONOMIA_ESTADO },
      contraataque: { texto: 'Esa deuda la tomaron los amigos de mi rival.' },
      evasiva: { texto: 'Vamos a honrar los compromisos, cuidando a los argentinos.' },
    },
  },

  /* Chicanas: las tira el rival. */
  {
    id: 'chicana-experiencia',
    tipo: 'chicana',
    texto: '«Con todo respeto, no tenés la experiencia para esto. Esto no es una práctica.»',
    respuestas: {
      propuesta: { texto: 'Les cuento mi plan de gobierno en tres puntos para que la gente decida.' },
      contraataque: { texto: 'Tu experiencia es justo lo que la gente no quiere repetir.' },
      evasiva: { texto: 'Cada uno tiene su recorrido, y la gente lo va a valorar.' },
    },
  },
  {
    id: 'chicana-promesas',
    tipo: 'chicana',
    texto: '«Prometés de todo. ¿Con qué plata lo vas a pagar?»',
    respuestas: {
      propuesta: { texto: 'Tengo el presupuesto calculado. Lo explico punto por punto.' },
      contraataque: { texto: 'Lo dice alguien que gastó todo y no hizo una sola obra.' },
      evasiva: { texto: 'Las cuentas las vamos a ordenar entre todos.' },
    },
  },
  {
    id: 'chicana-partido',
    tipo: 'chicana',
    texto: '«Tu partido gobernó y dejó todo peor. ¿Por qué ahora sería distinto?»',
    respuestas: {
      propuesta: { texto: 'Porque traigo un equipo nuevo y un plan de gestión distinto.' },
      contraataque: { texto: 'Hablás de los demás para no hablar de lo que hiciste vos.' },
      evasiva: { texto: 'Yo no vengo a hablar del pasado, vengo a hablar del futuro.' },
    },
  },
  {
    id: 'chicana-encuestas',
    tipo: 'chicana',
    texto: '«Las encuestas me dan diez puntos arriba. ¿Para qué seguís?»',
    respuestas: {
      propuesta: { texto: 'Sigo porque tengo un plan, y lo voy a contar hasta el último día.' },
      contraataque: { texto: 'Las mismas encuestas que te daban ganador la vez que perdiste.' },
      evasiva: { texto: 'Las encuestas no votan. Vota la gente.' },
    },
  },
  {
    id: 'chicana-ausente',
    tipo: 'chicana',
    texto: '«Nunca te vi en el barrio cuando la gente te necesitaba.»',
    respuestas: {
      propuesta: { texto: 'Voy a abrir una oficina en cada barrio, con atención todos los días.' },
      contraataque: { texto: 'Yo estuve. Vos aparecés solo cuando hay cámaras.' },
      evasiva: { texto: 'Todos tenemos distintas formas de estar cerca de la gente.' },
    },
  },
  {
    id: 'chicana-ideas',
    tipo: 'chicana',
    texto: '«Tus ideas ya fracasaron en todos lados donde se aplicaron.»',
    respuestas: {
      propuesta: { texto: 'Presento tres casos donde funcionaron y cómo los vamos a adaptar.' },
      contraataque: { texto: 'Las tuyas fracasaron acá mismo, y la gente todavía lo está pagando.' },
      evasiva: { texto: 'Yo no creo en las etiquetas ni en las ideologías.' },
    },
  },
  {
    id: 'chicana-equipo',
    tipo: 'chicana',
    texto: '«¿Quién es tu equipo? Nadie los conoce.»',
    respuestas: {
      propuesta: { texto: 'Presento hoy a mi equipo de gestión, con nombre y currículum.' },
      contraataque: { texto: 'Al tuyo lo conocen todos. Ese es el problema.' },
      evasiva: { texto: 'Mi equipo es la gente.' },
    },
  },
  {
    id: 'chicana-libro',
    tipo: 'chicana',
    texto: '«Hablás como un libro, pero nunca gestionaste nada.»',
    respuestas: {
      propuesta: { texto: 'Les voy a contar exactamente cómo va a ser mi primer día de gestión.' },
      contraataque: { texto: 'Mejor un libro que una gestión que nadie quiere recordar.' },
      evasiva: { texto: 'La gestión se aprende escuchando, y eso hago.' },
    },
  },
  {
    id: 'chicana-cambio',
    tipo: 'chicana',
    texto: '«Hace unos años decías lo contrario. ¿Cuál es la verdad?»',
    respuestas: {
      propuesta: { texto: 'Cambié de opinión con los datos, y les muestro cuáles fueron.' },
      contraataque: { texto: 'Lo dice alguien que cambió de partido tres veces.' },
      evasiva: { texto: 'Todos evolucionamos. Es parte de la vida.' },
    },
  },
  {
    id: 'chicana-valores',
    tipo: 'chicana',
    texto: '«Tus ideas van en contra de los valores de la gente de acá.»',
    respuestas: {
      propuesta: { texto: 'Mis ideas son ampliar derechos para que nadie quede afuera.', postura: SOCIAL_PROGRESISTA },
      contraataque: { texto: 'Los valores no se defienden con discursos: se defienden gobernando bien, y vos no lo hiciste.' },
      evasiva: { texto: 'Respeto todos los valores y todas las creencias.' },
    },
  },
  {
    id: 'chicana-orden',
    tipo: 'chicana',
    texto: '«Con vos, la calle va a ser un caos de piquetes todos los días.»',
    respuestas: {
      propuesta: { texto: 'Con diálogo y con la ley: se protesta, pero no se corta una avenida.', postura: SOCIAL_CONSERVADOR },
      contraataque: { texto: 'El caos lo viviste vos cuando gobernaste, no yo.' },
      evasiva: { texto: 'La protesta es un derecho, y el orden también.' },
    },
  },
  {
    id: 'chicana-mercado',
    tipo: 'chicana',
    texto: '«Querés regalar todo. El Estado no es un cajero automático.»',
    respuestas: {
      propuesta: { texto: 'Un Estado presente cuesta menos que un país roto. Les muestro los números.', postura: ECONOMIA_ESTADO },
      contraataque: { texto: 'Vos querés un Estado que solo aparezca para tus amigos.' },
      evasiva: { texto: 'No creo en un Estado grande ni en uno chico, sino en uno eficiente.' },
    },
  },
  {
    id: 'chicana-ajuste',
    tipo: 'chicana',
    texto: '«Tu plan es ajustar a los jubilados. Decilo de frente.»',
    respuestas: {
      propuesta: {
        texto: 'Mi plan es bajar el gasto de la política primero, empezando por los sueldos de los funcionarios.',
        postura: ECONOMIA_MERCADO,
      },
      contraataque: { texto: 'Los jubilados cobraron menos que nunca cuando gobernaste vos.' },
      evasiva: { texto: 'A los jubilados los respetamos todos.' },
    },
  },
  {
    id: 'chicana-interior',
    tipo: 'chicana',
    ambitos: ['nacional'],
    texto: '«No conocés el país. No sabés qué pasa más allá de la General Paz.»',
    respuestas: {
      propuesta: { texto: 'Recorrí las veintitrés provincias, y tengo un plan para cada región.' },
      contraataque: { texto: 'Lo dice alguien que hizo campaña sin salir de su despacho.' },
      evasiva: { texto: 'La Argentina es una sola, de punta a punta.' },
    },
  },
  {
    id: 'chicana-vecino',
    tipo: 'chicana',
    ambitos: ['municipal'],
    texto: '«Vos ni vivís acá. Venís a usar el distrito de trampolín.»',
    respuestas: {
      propuesta: { texto: 'Me comprometo a cumplir los cuatro años y a rendir cuentas cada mes en la plaza.' },
      contraataque: { texto: 'Vos vivís acá, y mirá cómo está el distrito.' },
      evasiva: { texto: 'Lo que importa es lo que se hace, no dónde se duerme.' },
    },
  },
  {
    id: 'chicana-gobernador',
    tipo: 'chicana',
    ambitos: ['provincial'],
    texto: '«Sos el candidato de Buenos Aires. Te mandan a manejar la provincia de lejos.»',
    respuestas: {
      propuesta: { texto: 'Mi gabinete va a ser todo de la provincia, y lo presento esta semana.' },
      contraataque: { texto: 'A vos te manejan desde mucho más cerca, y se nota.' },
      evasiva: { texto: 'Yo respondo solo a la gente de la provincia.' },
    },
  },
];

export function buscarPreguntaDebate(id: string): PreguntaDebate {
  const p = PREGUNTAS_DEBATE.find((x) => x.id === id);
  if (!p) throw new Error(`No existe la pregunta de debate ${id}`);
  return p;
}

/** Qué respuesta gana cada pregunta. */
export const LA_QUE_GANA: Record<TipoPreguntaDebate, TipoRespuestaDebate> = { seria: 'propuesta', chicana: 'contraataque' };
