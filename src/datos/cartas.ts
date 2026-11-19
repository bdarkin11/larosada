import type { Atributo, Medidor, Rareza } from '../motor/tipos';

export type EfectoCarta = { tipo: 'atributo'; atributo: Atributo } | { tipo: 'medidor'; medidor: Medidor };

export interface DefCarta {
  id: string;
  nombre: string;
  descripcion: string;
  efecto: EfectoCarta;
}

/** Cartas del armado anual. Lo que suben depende de la rareza (ver MAGNITUDES). */
export const CARTAS: DefCarta[] = [
  {
    id: 'asado',
    nombre: 'Asado con dirigentes',
    descripcion: 'Escuchás más de lo que hablás. Se arman cosas.',
    efecto: { tipo: 'atributo', atributo: 'rosca' },
  },
  {
    id: 'congreso',
    nombre: 'Congreso del partido',
    descripcion: 'Votaciones, pasillos y acuerdos de madrugada.',
    efecto: { tipo: 'atributo', atributo: 'rosca' },
  },
  {
    id: 'unidad-basica',
    nombre: 'Abrir un local en el barrio',
    descripcion: 'Un lugar propio donde la gente sabe que te encuentra.',
    efecto: { tipo: 'atributo', atributo: 'territorio' },
  },
  {
    id: 'timbreo',
    nombre: 'Timbreo de todo el año',
    descripcion: 'Puerta por puerta, cuadra por cuadra.',
    efecto: { tipo: 'atributo', atributo: 'territorio' },
  },
  {
    id: 'diplomatura',
    nombre: 'Diplomatura en gestión pública',
    descripcion: 'Presupuestos, licitaciones y cómo funciona el Estado.',
    efecto: { tipo: 'atributo', atributo: 'gestion' },
  },
  {
    id: 'cooperativa',
    nombre: 'Coordinar una cooperativa',
    descripcion: 'Gestionar con poca plata y mucha necesidad.',
    efecto: { tipo: 'atributo', atributo: 'gestion' },
  },
  {
    id: 'radio',
    nombre: 'Columna en la radio local',
    descripcion: 'Todas las semanas, tu voz en el aire.',
    efecto: { tipo: 'medidor', medidor: 'fama' },
  },
  {
    id: 'redes',
    nombre: 'Un video que se viraliza',
    descripcion: 'De golpe te conoce gente que nunca te vio.',
    efecto: { tipo: 'medidor', medidor: 'fama' },
  },
  {
    id: 'comedor',
    nombre: 'Sostener un comedor',
    descripcion: 'El barrio ve que estás cuando hace falta.',
    efecto: { tipo: 'medidor', medidor: 'imagen' },
  },
  {
    id: 'colecta',
    nombre: 'Rifa y colecta para la agrupación',
    descripcion: 'Plata limpia para moverse.',
    efecto: { tipo: 'medidor', medidor: 'caja' },
  },
  {
    id: 'mesa-chica',
    nombre: 'Un lugar en la mesa chica',
    descripcion: 'Te invitan a donde se decide de verdad.',
    efecto: { tipo: 'medidor', medidor: 'poder' },
  },
  {
    id: 'abogado',
    nombre: 'Abogado de confianza',
    descripcion: 'Alguien que te avisa antes de firmar cualquier cosa.',
    efecto: { tipo: 'medidor', medidor: 'causas' },
  },
];

/** Cuánto mueve cada carta según su rareza: común, rara, dorada, icónica. */
export const MAGNITUDES: Record<Atributo | Medidor, Record<Rareza, number>> = {
  rosca: { comun: 2, rara: 4, dorada: 7, iconica: 12 },
  territorio: { comun: 2, rara: 4, dorada: 7, iconica: 12 },
  gestion: { comun: 2, rara: 4, dorada: 7, iconica: 12 },
  fama: { comun: 3, rara: 6, dorada: 10, iconica: 18 },
  imagen: { comun: 3, rara: 6, dorada: 10, iconica: 16 },
  caja: { comun: 3000, rara: 8000, dorada: 20000, iconica: 60000 },
  causas: { comun: -3, rara: -6, dorada: -10, iconica: -18 },
  poder: { comun: 3, rara: 5, dorada: 8, iconica: 14 },
};

/** La carta de plata da un porcentaje de tu caja (con el piso en sueldos y el tope), no una cifra fija. */
export const PORCENTAJE_CAJA: Record<Rareza, number> = { comun: 0.05, rara: 0.12, dorada: 0.25, iconica: 0.4 };

/** Probabilidad de cada rareza. La icónica no sale antes de los 25 años. */
export const PROBABILIDAD_RAREZA = { iconica: 0.015, dorada: 0.06, rara: 0.22 };
export const EDAD_MINIMA_ICONICA = 25;

export function buscarCarta(id: string): DefCarta {
  const carta = CARTAS.find((c) => c.id === id);
  if (!carta) throw new Error(`Carta desconocida: ${id}`);
  return carta;
}
