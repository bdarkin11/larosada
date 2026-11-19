import type { Ideologia, PartidoId } from '../motor/tipos';

export interface DefPartido {
  id: PartidoId;
  nombre: string;
  /** Nombre corto para tablas y etiquetas. */
  corto: string;
  /** Dónde está parado el espacio en los dos ejes. */
  posicion: Ideologia;
  color: string;
  /** "el Frente", "la Coalición". */
  articulo: 'el' | 'la';
}

/** Espacios ficticios. Ninguno es un partido real con otro nombre: son posiciones del mapa político. */
export const PARTIDOS: Record<PartidoId, DefPartido> = {
  'frente-nacional': {
    id: 'frente-nacional',
    nombre: 'Frente Nacional y Popular',
    articulo: 'el',
    corto: 'Frente Nacional',
    posicion: { economia: -55, social: 20 },
    color: '#4aa3df',
  },
  'union-republicana': {
    id: 'union-republicana',
    nombre: 'Unión Republicana',
    articulo: 'la',
    corto: 'Unión Republicana',
    posicion: { economia: 45, social: -5 },
    color: '#f2c84b',
  },
  libertad: {
    id: 'libertad',
    nombre: 'Movimiento Libertad',
    articulo: 'el',
    corto: 'Movimiento Libertad',
    posicion: { economia: 90, social: -45 },
    color: '#a06cf0',
  },
  'coalicion-centro': {
    id: 'coalicion-centro',
    nombre: 'Coalición del Centro',
    articulo: 'la',
    corto: 'Coalición',
    posicion: { economia: 5, social: 35 },
    color: '#ff9a4a',
  },
  'bloque-izquierda': {
    id: 'bloque-izquierda',
    nombre: 'Bloque de Izquierda',
    articulo: 'el',
    corto: 'Bloque de Izquierda',
    posicion: { economia: -90, social: 75 },
    color: '#e8574f',
  },
};

/** Distancia entre dos posiciones: de 0 (iguales) a 283 (puntas opuestas). */
export const distancia = (a: Ideologia, b: Ideologia) => Math.hypot(a.economia - b.economia, a.social - b.social);

/** El espacio que mejor te representa: con el que empezás. */
export function partidoMasCercano(ideologia: Ideologia): PartidoId {
  return Object.values(PARTIDOS).reduce((mejor, p) => (distancia(p.posicion, ideologia) < distancia(mejor.posicion, ideologia) ? p : mejor))
    .id;
}

/** Desde esta distancia, irte a ese espacio es una traición imperdonable. */
export const DISTANCIA_IMPERDONABLE = 140;

/** "el Frente Nacional y Popular", "la Coalición del Centro". Con corto: "el Frente Nacional". */
export const elPartido = (id: PartidoId, corto = false) => `${PARTIDOS[id].articulo} ${corto ? PARTIDOS[id].corto : PARTIDOS[id].nombre}`;

/** "del Frente Nacional y Popular", "de la Coalición del Centro". */
export const delPartido = (id: PartidoId, corto = false) => {
  const nombre = corto ? PARTIDOS[id].corto : PARTIDOS[id].nombre;
  return PARTIDOS[id].articulo === 'el' ? `del ${nombre}` : `de la ${nombre}`;
};

/** "al Frente Nacional", "a la Coalición". */
export const alPartido = (id: PartidoId, corto = false) => {
  const nombre = corto ? PARTIDOS[id].corto : PARTIDOS[id].nombre;
  return PARTIDOS[id].articulo === 'el' ? `al ${nombre}` : `a la ${nombre}`;
};
