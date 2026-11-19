import type { MedioId } from '../motor/tipos';

export interface Medio {
  id: MedioId;
  nombre: string;
  descripcion: string;
  costo: number;
  preguntas: number;
  /** Cuánto pesa cada punto de la entrevista en la fama. */
  multiplicador: number;
  /** Fama que da salir al aire, más allá de cómo te vaya. */
  base: number;
  /** Fama mínima para que te den el espacio. */
  famaMinima: number;
}

export const MEDIOS: Record<MedioId, Medio> = {
  radio: {
    id: 'radio',
    nombre: 'Radio AM de la mañana',
    descripcion: 'Diez minutos con el conductor del programa más escuchado de la zona.',
    costo: 2500,
    preguntas: 3,
    multiplicador: 1,
    base: 1,
    famaMinima: 0,
  },
  streaming: {
    id: 'streaming',
    nombre: 'Streaming político',
    descripcion: 'Una hora de charla en el canal que miran los pibes. Si va bien, se recorta y circula.',
    costo: 7000,
    preguntas: 4,
    multiplicador: 1.5,
    base: 2,
    famaMinima: 10,
  },
  television: {
    id: 'television',
    nombre: 'Prime time en la TV abierta',
    descripcion: 'El living más visto del país. Lo que digas acá lo repiten toda la semana.',
    costo: 18000,
    preguntas: 5,
    multiplicador: 2.5,
    base: 3,
    famaMinima: 25,
  },
};

export interface Respuesta {
  texto: string;
  /** De −2 (desastre) a +2 (la rompiste). */
  puntos: number;
  /** Las respuestas polémicas suman fama pero te bajan la imagen. */
  imagen?: number;
  /** Si la respuesta toma partido en un eje: suma si es coherente con lo que pensás, resta si te contradice. */
  postura?: { eje: 'economia' | 'social'; lado: 1 | -1 };
}

export interface Pregunta {
  id: string;
  texto: string;
  respuestas: Respuesta[];
}

export const PREGUNTAS: Pregunta[] = [
  {
    id: 'inflacion',
    texto: 'La inflación no afloja. ¿Qué le decís a la gente que no llega a fin de mes?',
    respuestas: [
      { texto: 'Que la culpa es del gobierno anterior.', puntos: 0 },
      { texto: 'Que la entiendo, y que tengo tres medidas concretas para empezar.', puntos: 2 },
      { texto: 'Que hay que ajustarse el cinturón, como todos.', puntos: -1, imagen: -2 },
    ],
  },
  {
    id: 'estado-mercado',
    texto: '¿Más Estado o más mercado?',
    respuestas: [
      { texto: 'Menos Estado: que la gente pueda trabajar en paz.', puntos: 1, postura: { eje: 'economia', lado: 1 } },
      { texto: 'Depende del tema. No creo en las recetas.', puntos: 0 },
      { texto: 'Un Estado presente que no deje a nadie afuera.', puntos: 1, postura: { eje: 'economia', lado: -1 } },
    ],
  },
  {
    id: 'derechos',
    texto: '¿Dónde estás en los temas de familia y derechos?',
    respuestas: [
      { texto: 'Hay que cuidar los valores de siempre.', puntos: 1, postura: { eje: 'social', lado: -1 } },
      { texto: 'Hay que ampliar derechos: la sociedad ya cambió.', puntos: 1, postura: { eje: 'social', lado: 1 } },
      { texto: 'No es el momento de hablar de eso.', puntos: -1 },
    ],
  },
  {
    id: 'denuncia',
    texto: 'Hay una denuncia contra un dirigente de tu espacio. ¿Lo defendés?',
    respuestas: [
      { texto: 'Es una operación de los medios.', puntos: 1, imagen: -3 },
      { texto: 'No conozco el caso.', puntos: -1 },
      { texto: 'Que la Justicia investigue. Nadie está por encima de la ley.', puntos: 2 },
    ],
  },
  {
    id: 'video-viejo',
    texto: 'El conductor te muestra un video tuyo de hace años diciendo lo contrario. ¿Qué hacés?',
    respuestas: [
      { texto: 'Me río y reconozco que cambié de opinión.', puntos: 2 },
      { texto: 'Niego que sea yo.', puntos: -2, imagen: -2 },
      { texto: 'Me levanto y me voy del estudio.', puntos: 2, imagen: -4 },
    ],
  },
  {
    id: 'dolar',
    texto: '¿Qué va a pasar con el dólar?',
    respuestas: [
      { texto: 'Va a explotar, y el gobierno lo sabe.', puntos: 2, imagen: -2 },
      { texto: 'No hago pronósticos: eso solo agrega nervios.', puntos: 1 },
      { texto: 'Que se dolaricen mientras puedan.', puntos: -2, imagen: -3 },
    ],
  },
  {
    id: 'presidente',
    texto: '¿Te ves de presidente algún día?',
    respuestas: [
      { texto: 'No, eso no es para mí.', puntos: -1 },
      { texto: 'Hoy me ocupo de mi lugar. Lo demás se verá.', puntos: 1 },
      { texto: 'Sí. Y no tengo miedo de decirlo.', puntos: 2, imagen: -2 },
    ],
  },
  {
    id: 'seguridad',
    texto: 'Hubo un robo violento en tu zona. ¿Qué proponés?',
    respuestas: [
      { texto: 'Prevención: luz, escuelas abiertas y trabajo.', puntos: 1, postura: { eje: 'social', lado: 1 } },
      { texto: 'Es un hecho aislado.', puntos: -2, imagen: -2 },
      { texto: 'Más policía en la calle y penas más duras.', puntos: 1, postura: { eje: 'social', lado: -1 } },
    ],
  },
  {
    id: 'jubilados',
    texto: '¿Cómo se paga una jubilación digna?',
    respuestas: [
      { texto: 'Con un impuesto a las grandes fortunas.', puntos: 1, postura: { eje: 'economia', lado: -1 } },
      { texto: 'Con crecimiento y empleo formal: más gente aportando.', puntos: 1, postura: { eje: 'economia', lado: 1 } },
      { texto: 'Ese número no lo tengo a mano.', puntos: -2 },
    ],
  },
  {
    id: 'sindicatos',
    texto: '¿Los sindicatos ayudan o traban?',
    respuestas: [
      { texto: 'Ni ayudan ni traban.', puntos: -1 },
      { texto: 'Muchos dirigentes cuidan más su sillón que al trabajador.', puntos: 2, imagen: -2, postura: { eje: 'economia', lado: 1 } },
      { texto: 'Defienden derechos que costaron mucho conseguir.', puntos: 1, postura: { eje: 'economia', lado: -1 } },
    ],
  },
  {
    id: 'interior',
    texto: '¿Qué le debe Buenos Aires al interior?',
    respuestas: [
      { texto: 'Un reparto federal de verdad. El país no termina en la General Paz.', puntos: 2 },
      { texto: 'No es un tema que me toque.', puntos: -2, imagen: -1 },
      { texto: 'Cada provincia tiene que hacerse cargo de sus cuentas.', puntos: 1, postura: { eje: 'economia', lado: 1 } },
    ],
  },
  {
    id: 'trolls',
    texto: 'Te acusan de pagar cuentas truchas en las redes. ¿Es cierto?',
    respuestas: [
      { texto: 'Todos lo hacen. Yo por lo menos lo digo.', puntos: 1, imagen: -3 },
      { texto: 'Sin comentarios.', puntos: -1 },
      { texto: 'No. Y si alguien de mi equipo lo hace, se va.', puntos: 2 },
    ],
  },
  {
    id: 'paro-docente',
    texto: 'Tercera semana de paro docente. ¿De qué lado estás?',
    respuestas: [
      { texto: 'De los docentes: con esos sueldos nadie puede enseñar.', puntos: 1, postura: { eje: 'economia', lado: -1 } },
      { texto: 'De los chicos: que se abran las escuelas ya.', puntos: 1, postura: { eje: 'economia', lado: 1 } },
      { texto: 'Hay que sentarse a negociar.', puntos: 0 },
    ],
  },
  {
    id: 'pan',
    texto: 'Pregunta rápida: ¿cuánto sale un kilo de pan?',
    respuestas: [
      { texto: 'Te digo la verdad: no lo sé.', puntos: 0, imagen: 1 },
      { texto: 'Tiro un número con seguridad, a ver si pasa.', puntos: -2, imagen: -2 },
      { texto: 'Lo que paga cualquier vecino: lo compro todas las mañanas.', puntos: 2 },
    ],
  },
  {
    id: 'oposicion',
    texto: '¿Te sentarías a hablar con la oposición?',
    respuestas: [
      { texto: 'Jamás.', puntos: -1 },
      { texto: 'Con los que piensan distinto, sí. Con los que fundieron el país, no.', puntos: 2, imagen: -2 },
      { texto: 'Con todos, para lo que haga falta.', puntos: 1 },
    ],
  },
];

/** Segundos para contestar cada pregunta antes de quedarte en blanco. */
export const SEGUNDOS_POR_PREGUNTA = 15;

export function buscarPregunta(id: string): Pregunta {
  const pregunta = PREGUNTAS.find((p) => p.id === id);
  if (!pregunta) throw new Error(`Pregunta desconocida: ${id}`);
  return pregunta;
}
