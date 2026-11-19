import { diputadosLeales, TERCIO_DIPUTADOS } from '../datos/caida';
import type { DefEvento } from '../datos/eventos';
import { buscarEvento } from '../datos/eventos';
import type { Carrera } from './tipos';

/**
 * Cuándo se puede caer un presidente antes de tiempo. El juicio político y el
 * pedido de renuncia llegan como eventos; lo que se decide ahí puede terminar la carrera.
 */

/** Por debajo de esta Imagen, la oposición se anima al juicio político. */
export const IMAGEN_JUICIO = 45;
/** Con estas Causas, el juicio tiene de qué agarrarse aunque no haya crisis. */
export const CAUSAS_JUICIO = 40;
/** Con la calle así de caliente, también. */
export const MALESTAR_JUICIO = 30;
/**
 * Por debajo de esta Imagen, en medio del caos, te piden la renuncia. Se mira la
 * Imagen y no el Poder: el del presidente vuelve rápido al 75 que da el cargo.
 */
export const IMAGEN_RENUNCIA = 40;
/** Con una sola crisis, la calle tiene que estar así de caliente para que te pidan la renuncia. */
export const MALESTAR_RENUNCIA = 25;
/** Años antes de que el mismo intento pueda volver. */
export const ENFRIAMIENTO_CAIDA = 2;

const esPresidente = (c: Carrera) => c.cargo === 'presidente' && !c.fin;

/** Juicio político: sin un tercio de diputados leales, con la Imagen baja y algo de qué agarrarse. */
export function riesgoDeJuicio(c: Carrera): boolean {
  // Mal desempeño: una crisis, causas, la calle caliente o una promesa rota en este mandato.
  const rotaEnElMandato = (c.promesasRotas ?? []).some((anio) => c.mandatoHasta !== undefined && anio > c.mandatoHasta - 4);
  const motivo = !!c.crisis?.length || c.medidores.causas >= CAUSAS_JUICIO || (c.malestar ?? 0) >= MALESTAR_JUICIO || rotaEnElMandato;
  return esPresidente(c) && diputadosLeales(c) < TERCIO_DIPUTADOS && c.medidores.imagen < IMAGEN_JUICIO && motivo;
}

/** Pedido de renuncia: sin apoyo de la gente, con la calle estallada, dos crisis o una crisis con la calle caliente. */
export function riesgoDeRenuncia(c: Carrera): boolean {
  const crisis = c.crisis ?? [];
  const caos =
    crisis.some((x) => x.id === 'estallido') || crisis.length >= 2 || (crisis.length === 1 && (c.malestar ?? 0) >= MALESTAR_RENUNCIA);
  return esPresidente(c) && c.medidores.imagen < IMAGEN_RENUNCIA && caos;
}

/** El evento de caída que corresponde este año, si alguno. El pedido de renuncia va primero. */
export function eventoDeCaida(c: Carrera): DefEvento | null {
  const reciente = (id: string) => c.eventosVistos[id] !== undefined && c.anio - c.eventosVistos[id] < ENFRIAMIENTO_CAIDA;
  if (riesgoDeRenuncia(c) && !reciente('pedido-renuncia')) return buscarEvento('pedido-renuncia');
  if (riesgoDeJuicio(c) && !reciente('juicio-politico')) return buscarEvento('juicio-politico');
  return null;
}
