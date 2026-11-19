import type { Ajustes } from './armado';

/**
 * Los años de militancia, de los 18 a los 35: antes de que el electorado te
 * tenga en cuenta. Se resumen en cuatro decisiones que forman lo que pensás.
 * Cada una mueve tus ideas y algo de tu ficha.
 */

export interface OpcionFormacion {
  texto: string;
  /** Hacia dónde te corre: puntos en cada eje (−100 a 100). */
  ideas: { economia?: number; social?: number };
  ajustes: Ajustes;
  construccion?: number;
}

export interface EtapaFormacion {
  /** Cuántos años cubre. */
  anios: number;
  titulo: string;
  texto: string;
  opciones: OpcionFormacion[];
}

export const ETAPAS_FORMACION: EtapaFormacion[] = [
  {
    anios: 4,
    titulo: 'La facultad',
    texto: 'En la facultad se arma la lista para el centro de estudiantes. Te ofrecen un lugar.',
    opciones: [
      {
        texto: 'Con los que piden más presupuesto para la universidad pública',
        ideas: { economia: -15 },
        ajustes: { territorio: 3, fama: 2 },
      },
      {
        texto: 'Con los que quieren menos política y más becas por mérito',
        ideas: { economia: 15 },
        ajustes: { gestion: 3, fama: 2 },
      },
      {
        texto: 'Con los que arman la marcha por la ampliación de derechos',
        ideas: { social: 15 },
        ajustes: { fama: 4 },
      },
    ],
  },
  {
    anios: 4,
    titulo: 'El primer trabajo político',
    texto: 'Ya tenés nombre en la agrupación. Te ofrecen tres lugares para seguir.',
    opciones: [
      {
        texto: 'Coordinar el comedor del barrio',
        ideas: { economia: -15 },
        ajustes: { territorio: 5 },
        construccion: 4,
      },
      {
        texto: 'Asesorar a un concejal en presupuesto',
        ideas: { economia: 10 },
        ajustes: { gestion: 4, rosca: 2 },
      },
      {
        texto: 'Ser la voz de una ONG por la seguridad del barrio',
        ideas: { social: -15 },
        ajustes: { fama: 3, territorio: 2 },
      },
    ],
  },
  {
    anios: 4,
    titulo: 'La pelea interna',
    texto: 'El partido se parte en dos. Todos esperan para qué lado vas a tirar.',
    opciones: [
      {
        texto: 'Con el ala que quiere un Estado fuerte y presente',
        ideas: { economia: -15 },
        ajustes: { rosca: 3, poder: 3 },
      },
      {
        texto: 'Con los que quieren abrir la economía y modernizar',
        ideas: { economia: 15 },
        ajustes: { rosca: 3, gestion: 2 },
      },
      {
        texto: 'Mediar entre los dos: que no se rompa nada',
        ideas: {},
        ajustes: { rosca: 6 },
      },
    ],
  },
  {
    anios: 5,
    titulo: 'Tu primera bandera',
    texto: 'Antes de largarte, tenés que elegir con qué te van a reconocer.',
    opciones: [
      {
        texto: 'La familia y el orden: los valores de siempre',
        ideas: { social: -20 },
        ajustes: { territorio: 3, fama: 3 },
      },
      {
        texto: 'Los derechos nuevos: que nadie quede afuera',
        ideas: { social: 20 },
        ajustes: { fama: 5 },
      },
      {
        texto: 'La gestión: hablar de obras y no de ideas',
        ideas: {},
        ajustes: { gestion: 5 },
        construccion: 3,
      },
    ],
  },
];

/** Lo que crece solo en esos años de militancia, haya elegido lo que haya elegido. */
export const CRECIMIENTO_FORMACION = {
  territorio: 12,
  rosca: 8,
  gestion: 6,
  construccion: 25,
  caja: 25000,
  /** Fama y Poder con los que llegás a los 35, como piso. */
  famaMinima: 10,
  poderMinimo: 12,
};

/** Desde esta edad el electorado te tiene en cuenta: arranca la carrera de verdad. */
export const EDAD_CANDIDATO = 35;
/** A esta edad te jubilás, tengas el cargo que tengas. */
export const EDAD_JUBILACION = 65;
