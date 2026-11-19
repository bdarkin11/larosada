/** Lo que marca una opción de un evento, para saber qué promesa rompe. */
export type Etiqueta = 'impuestos' | 'ajuste' | 'emision' | 'fondo' | 'rosca' | 'blando';

/** Hacia dónde tira una decisión: −1 Estado o conservador, +1 Mercado o progresista. */
export interface Postura {
  economia?: number;
  social?: number;
}

export interface DefPromesa {
  id: string;
  /** Lo que decís en la campaña. */
  texto: string;
  /** Cómo se rompe. */
  detalle: string;
  /** A quién le suena creíble: si va con tus ideas, rinde más. */
  postura?: Postura;
  /** Solo para la campaña presidencial. */
  presidencial?: boolean;
  rompe: { etiqueta?: Etiqueta; coima?: boolean; ausencias?: number };
  /** Se revisa al terminar el mandato. */
  meta?: 'inflacion';
}

export const PROMESAS: DefPromesa[] = [
  {
    id: 'manos-limpias',
    texto: 'Ni un peso sucio',
    detalle: 'Se rompe si aceptás una coima, usás plata negra o hacés una movida por debajo de la mesa.',
    rompe: { coima: true },
  },
  {
    id: 'cercania',
    texto: 'Voy a estar con la gente',
    detalle: 'Se rompe si en el mandato elegís dos veces no meterte.',
    rompe: { ausencias: 2 },
  },
  {
    id: 'no-rosca',
    texto: 'Nada de arreglos a espaldas de la gente',
    detalle: 'Se rompe si cerrás un arreglo con los poderosos: votos, leyes o plata a cambio de favores.',
    rompe: { etiqueta: 'rosca' },
  },
  {
    id: 'no-impuestos',
    texto: 'No voy a subir impuestos',
    detalle: 'Se rompe si subís impuestos o retenciones.',
    postura: { economia: 1 },
    presidencial: true,
    rompe: { etiqueta: 'impuestos' },
  },
  {
    id: 'no-ajuste',
    texto: 'No voy a ajustar a los que menos tienen',
    detalle: 'Se rompe si recortás, ajustás tarifas o vetás a los jubilados.',
    postura: { economia: -1 },
    presidencial: true,
    rompe: { etiqueta: 'ajuste' },
  },
  {
    id: 'inflacion',
    texto: 'Voy a bajar la inflación',
    detalle: 'Se rompe si emitís a gran escala, o si al terminar el mandato la inflación es más alta que cuando llegaste.',
    presidencial: true,
    rompe: { etiqueta: 'emision' },
    meta: 'inflacion',
  },
  {
    id: 'no-fondo',
    texto: 'No vamos a volver al Fondo',
    detalle: 'Se rompe si le pedís plata al Fondo o firmás con él.',
    postura: { economia: -0.6 },
    presidencial: true,
    rompe: { etiqueta: 'fondo' },
  },
  {
    id: 'mano-dura',
    texto: 'Mano dura contra el delito',
    detalle: 'Se rompe si respondés a la inseguridad sin las fuerzas.',
    postura: { social: -1 },
    presidencial: true,
    rompe: { etiqueta: 'blando' },
  },
];

export function buscarPromesa(id: string): DefPromesa {
  const p = PROMESAS.find((x) => x.id === id);
  if (!p) throw new Error(`Promesa desconocida: ${id}`);
  return p;
}

/** Cuántas promesas se pueden hacer en una campaña. */
export const MAXIMO_PROMESAS = 2;
