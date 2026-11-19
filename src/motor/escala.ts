import { CARGOS } from '../datos/cargos';
import { etapaDe } from './ficha';
import type { CargoId, Carrera, EtapaId } from './tipos';

const redondear = (monto: number) => Math.round(monto / 100) * 100;

/**
 * La escala de la plata. Toda cifra se calcula con tu caja actual y el
 * sueldo de tu cargo, así un costo pesa lo mismo a los 25 años que a los 60.
 */

/** Ninguna ganancia proporcional pasa de esto, para que el rico no se haga más rico solo por serlo. */
export const TOPE_GANANCIA = 40000;

/** Los costos tienen un piso en sueldos: así también le duelen al que no tiene nada. Son 4 sueldos por cada 100 %. */
export const PISO_COSTO_EN_SUELDOS = 4;
/** Las ganancias tienen un piso en sueldos: 4 sueldos por cada 100 %. */
export const PISO_GANANCIA_EN_SUELDOS = 4;

/** Lo que se va cada año en sostener la estructura: local, militantes, viajes. */
export const ESTRUCTURA_FIJA = 4500;
export const ESTRUCTURA_PORCENTAJE = 0.03;

export const sueldo = (carrera: Carrera) => CARGOS[carrera.cargo].ingresoAnual;

/**
 * El aporte a la agrupación: la parte del sueldo que se va en tu gente, el
 * local y los micros. Cuanto más alto el cargo, más gente depende de vos.
 */
export const APORTE_POR_CARGO: Record<CargoId, number> = {
  militante: 0,
  asesor: 0.1,
  concejal: 0.25,
  funcionario: 0.25,
  secretario: 0.4,
  legislador: 0.4,
  intendente: 0.5,
  diputado: 0.5,
  senador: 0.55,
  gobernador: 0.55,
  presidente: 0.6,
};

/** Y cuanto más construcción, más gente que bancar: se suma por etapa. */
export const APORTE_POR_ETAPA: Record<EtapaId, number> = {
  desconocido: 0,
  conocido: 0,
  referente: 0.05,
  caudillo: 0.1,
  procer: 0.15,
};

export const tasaDeAporte = (carrera: Carrera) =>
  carrera.cargo === 'militante' ? 0 : APORTE_POR_CARGO[carrera.cargo] + APORTE_POR_ETAPA[etapaDe(carrera.construccion)];

/** Lo que ponés para la agrupación este año. */
export const aporteAgrupacion = (carrera: Carrera) => redondear(sueldo(carrera) * tasaDeAporte(carrera));

/** Un costo: el porcentaje de la caja (o de la caja negra), con un piso en sueldos. */
export function costoProporcional(carrera: Carrera, porcentaje: number, base = carrera.medidores.caja): number {
  return redondear(Math.max(porcentaje * Math.max(0, base), porcentaje * PISO_COSTO_EN_SUELDOS * sueldo(carrera)));
}

/** Una ganancia: el porcentaje de la caja, con un piso en sueldos y el tope. El multiplicador es para el estilo transa. */
export function gananciaProporcional(carrera: Carrera, porcentaje: number, multiplicador = 1): number {
  const base = Math.max(porcentaje * Math.max(0, carrera.medidores.caja), porcentaje * PISO_GANANCIA_EN_SUELDOS * sueldo(carrera));
  return redondear(Math.min(TOPE_GANANCIA, base * multiplicador));
}

/** Lo que cuesta sostener la estructura este año. */
export const gastoDeEstructura = (carrera: Carrera) =>
  redondear(ESTRUCTURA_FIJA + ESTRUCTURA_PORCENTAJE * Math.max(0, carrera.medidores.caja));

/** Qué porcentaje de la caja es un monto, para mostrarlo: "8 % de tu caja". */
export function porcentajeDeCaja(monto: number, caja: number): number | null {
  if (caja <= 0) return null;
  return Math.max(1, Math.round((Math.abs(monto) / caja) * 100));
}
