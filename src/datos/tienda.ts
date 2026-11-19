import type { Atributo, Medidor } from '../motor/tipos';
import { ANIOS_EQUIPO, DOLARES_POR_PUNTO, VALOR_CONSTRUCCION, VALOR_POR_UNIDAD } from './valor';

export type Efectos = Partial<Record<Atributo | Medidor, number>>;

export type SeccionTienda = 'equipo' | 'consumible' | 'lujo';

export interface ItemTienda {
  id: string;
  seccion: SeccionTienda;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Lo que cuesta. En el equipo y los consumibles sale de lo que dan (ver precioPorLoQueDa). */
  costo: number;
  /** Consumibles: cuántos años dura. */
  anios?: number;
  /** Lo que suma al pagar (lujos). */
  alComprar?: Efectos;
  /** Lo que suma cada año mientras lo tenés. */
  anual?: Efectos;
  /** Construcción política extra por año. */
  construccion?: number;
  /** Puntos extra en cada entrevista. */
  entrevista?: number;
  /** Chance extra de zafar en la Justicia. */
  zafar?: number;
  /** Multiplica el riesgo de que la salud termine la carrera. */
  salud?: number;
}

/** Lo que vale lo que no es un número de la ficha, en puntos. */
const VALOR_EXTRA = {
  /** Cada punto extra en las entrevistas, más ver las chances reales en las elecciones. */
  encuestador: 7,
  /** 10 % más de chance de zafar de una orden de detención. */
  zafar: 3,
  /** Menos riesgo de que la salud te saque. */
  salud: 4,
  /** Un punto más en cada entrevista, por año. */
  oratoria: 3,
};

/**
 * El precio de una mejora: lo que vale lo que da, en puntos, por los años que
 * dura (el equipo cuenta ocho), a US$ 1.500 el punto, redondeado a 500.
 */
export function precioPorLoQueDa(item: Omit<ItemTienda, 'costo'>, extra = 0): number {
  const anios = item.seccion === 'equipo' ? ANIOS_EQUIPO : (item.anios ?? 1);
  let puntos = extra;
  for (const [clave, cantidad] of Object.entries(item.anual ?? {})) {
    puntos += Math.abs(VALOR_POR_UNIDAD[clave as keyof typeof VALOR_POR_UNIDAD] * cantidad!) * anios;
  }
  puntos += (item.construccion ?? 0) * VALOR_CONSTRUCCION * anios;
  return Math.round((puntos * DOLARES_POR_PUNTO) / 500) * 500;
}

type Mejora = Omit<ItemTienda, 'costo'> & { extra?: number };

const MEJORAS: Mejora[] = [
  // Equipo: se paga una vez y trabaja para vos toda la carrera.
  {
    id: 'asesor-imagen',
    seccion: 'equipo',
    icono: '🪞',
    nombre: 'Asesor de imagen',
    descripcion: 'Te dice qué ponerte y qué no decir. Imagen +1 por año.',
    anual: { imagen: 1 },
  },
  {
    id: 'jefe-prensa',
    seccion: 'equipo',
    icono: '📰',
    nombre: 'Jefe de prensa',
    descripcion: 'Tus cosas salen en los diarios. Fama +1 por año.',
    anual: { fama: 1 },
  },
  {
    id: 'operador',
    seccion: 'equipo',
    icono: '🤝',
    nombre: 'Operador político',
    descripcion: 'Te consigue reuniones con los que mandan. Poder +1 por año.',
    anual: { poder: 1 },
  },
  {
    id: 'encuestador',
    seccion: 'equipo',
    icono: '📊',
    nombre: 'Encuestador propio',
    descripcion: 'Sabés qué quiere escuchar la gente: +1 en cada entrevista y tus chances reales en las elecciones.',
    entrevista: 1,
    extra: VALOR_EXTRA.encuestador,
  },
  {
    id: 'abogado',
    seccion: 'equipo',
    icono: '⚖️',
    nombre: 'Estudio jurídico de cabecera',
    descripcion: 'Causas −2 por año, y más chance de zafar si llega una orden.',
    anual: { causas: -2 },
    zafar: 0.1,
    extra: VALOR_EXTRA.zafar,
  },
  {
    id: 'medico',
    seccion: 'equipo',
    icono: '🩺',
    nombre: 'Médico personal',
    descripcion: 'Menos riesgo de que la salud te saque.',
    salud: 0.8,
    extra: VALOR_EXTRA.salud,
  },
  {
    id: 'armador',
    seccion: 'equipo',
    icono: '🗺️',
    nombre: 'Armador territorial',
    descripcion: 'Alguien que conoce cada barrio. Construcción +1 por año.',
    construccion: 1,
  },

  // Consumibles: duran uno o dos años.
  {
    id: 'redes',
    seccion: 'consumible',
    icono: '📱',
    nombre: 'Campaña en redes',
    descripcion: 'Fama +2 este año.',
    anios: 1,
    anual: { fama: 2 },
  },
  {
    id: 'spots',
    seccion: 'consumible',
    icono: '📺',
    nombre: 'Spots en radio y TV',
    descripcion: 'Fama +3 por año, durante dos años.',
    anios: 2,
    anual: { fama: 3 },
  },
  {
    id: 'coaching',
    seccion: 'consumible',
    icono: '🎙️',
    nombre: 'Coaching de oratoria',
    descripcion: 'Las entrevistas rinden más (+1 punto) durante dos años.',
    anios: 2,
    entrevista: 1,
    extra: VALOR_EXTRA.oratoria,
  },
  {
    id: 'gira',
    seccion: 'consumible',
    icono: '🚐',
    nombre: 'Gira por los barrios',
    descripcion: 'Territorio +1 y Construcción +2 por año, durante dos años.',
    anios: 2,
    anual: { territorio: 1 },
    construccion: 2,
  },
];

export const ITEMS: ItemTienda[] = [
  ...MEJORAS.map(({ extra, ...item }) => ({ ...item, costo: precioPorLoQueDa(item, extra) })),

  // Lujo: da fama, pero en política la gente pregunta de dónde salió la plata.
  {
    id: 'auto',
    seccion: 'lujo',
    icono: '🚘',
    nombre: 'Auto importado',
    descripcion: 'Fama +3. Causas +6: ¿con qué sueldo?',
    costo: 25000,
    alComprar: { fama: 3, causas: 6 },
  },
  {
    id: 'country',
    seccion: 'lujo',
    icono: '🏡',
    nombre: 'Casa en un country',
    descripcion: 'Fama +4. Causas +10.',
    costo: 45000,
    alComprar: { fama: 4, causas: 10 },
  },
  {
    id: 'madero',
    seccion: 'lujo',
    icono: '🏙️',
    nombre: 'Piso en Puerto Madero',
    descripcion: 'Fama +6. Causas +15.',
    costo: 120000,
    alComprar: { fama: 6, causas: 15 },
  },
  {
    id: 'yate',
    seccion: 'lujo',
    icono: '🛥️',
    nombre: 'Yate',
    descripcion: 'Fama +8. Causas +20 e Imagen −4: la foto en el yate no ayuda.',
    costo: 250000,
    alComprar: { fama: 8, causas: 20, imagen: -4 },
  },
];

export const NOMBRE_SECCION: Record<SeccionTienda, string> = {
  equipo: 'Equipo · trabaja para vos toda la carrera · el precio sale de lo que da',
  consumible: 'Por uno o dos años · el precio sale de lo que da',
  lujo: 'Lujo · da fama, pero suben las causas',
};

export function buscarItem(id: string): ItemTienda {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`Item desconocido: ${id}`);
  return item;
}
