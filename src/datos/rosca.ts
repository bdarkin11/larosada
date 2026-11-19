import type { PedidoRosca } from '../motor/tipos';

/** Los bloques con los que se puede negociar una ley. Son genéricos: ninguno es un espacio real. */

export interface DefBloqueRosca {
  nombre: string;
  /** Cuánto pesa en cada cámara, en relación con los otros. */
  diputados: number;
  senadores: number;
  pide: PedidoRosca;
}

export const BLOQUES_ROSCA: DefBloqueRosca[] = [
  { nombre: 'Gobernadores del Norte', diputados: 0.7, senadores: 1.7, pide: 'obra' },
  { nombre: 'Gobernadores patagónicos', diputados: 0.4, senadores: 1.6, pide: 'obra' },
  { nombre: 'Gobernadores de Cuyo', diputados: 0.5, senadores: 1.3, pide: 'cargo' },
  { nombre: 'Bloque del Litoral', diputados: 0.8, senadores: 1.1, pide: 'promesa' },
  { nombre: 'Aliados de centro', diputados: 1.2, senadores: 0.9, pide: 'cambio' },
  { nombre: 'Radicales disidentes', diputados: 1, senadores: 0.8, pide: 'cargo' },
  { nombre: 'Interbloque federal', diputados: 1.3, senadores: 0.7, pide: 'promesa' },
  { nombre: 'Díscolos de la oposición', diputados: 1.4, senadores: 0.3, pide: 'cambio' },
  { nombre: 'Bancada sindical', diputados: 1.2, senadores: 0.2, pide: 'cargo' },
  { nombre: 'Monobloques sueltos', diputados: 0.7, senadores: 0.4, pide: 'obra' },
];

export const TEXTO_PEDIDO: Record<PedidoRosca, { nombre: string; costo: string }> = {
  obra: { nombre: 'Una obra para su provincia', costo: 'Sale de tu Caja' },
  cargo: { nombre: 'Un cargo para los suyos', costo: 'Poder −2' },
  cambio: { nombre: 'Un cambio en la ley', costo: 'La ley rinde menos' },
  promesa: { nombre: 'Una promesa a futuro', costo: 'Un favor cruzado' },
};
