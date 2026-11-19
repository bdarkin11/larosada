import { entero, siguiente } from './azar';
import type { EstadoAzar } from './azar';
import { LEALTAD_APOYO } from './delfines';
import { oficialismoNacional } from './distrito';
import { acotar } from './ficha';
import type { CargoId, Carrera, EnvioFiscal, FiscalizacionEnCurso, IncidenteMesa, TipoIncidente } from './tipos';

/** Lo que dura la noche, en segundos. */
export const DURACION_FISCALIZACION = 20;
/** Lo que tarda un fiscal en llegar a la mesa, y lo que queda ocupado. */
export const VIAJE_FISCAL = 2;
export const OCUPADO_FISCAL = 5;
/** Lo que mueve, en puntos de tu porcentaje: de −6 (todo perdido) a +4 (todo salvado). */
export const PEOR_FISCALIZACION = -6;
export const MEJOR_FISCALIZACION = 4;
/** No fiscalizar: lo hace el aparato del partido, con lo que haya. */
export const AJUSTE_SIN_FISCALIZAR = -1.5;
/** Las mesas sin fiscal pierden votos solas, de a poco: este es su peso extra en los incidentes. */
const PESO_SIN_FISCAL = 1.5;

const MESAS: Partial<Record<CargoId, number>> = {
  concejal: 9,
  legislador: 9,
  intendente: 12,
  diputado: 12,
  senador: 14,
  gobernador: 14,
  presidente: 16,
};

export const TIPOS_INCIDENTE: TipoIncidente[] = ['boletas', 'acta', 'cadena', 'urna'];
export const TEXTO_INCIDENTE: Record<TipoIncidente, string> = {
  boletas: 'Faltan tus boletas',
  acta: 'Un acta mal sumada',
  cadena: 'Voto en cadena',
  urna: 'Una urna que «se pierde»',
};

/** Tus fiscales volantes: tres, y uno más si tenés un delfín leal. La Construcción pone los fiscales fijos. */
export function fiscalesDe(carrera: Carrera): number {
  const leales = (carrera.delfines ?? []).filter((d) => d.lealtad >= LEALTAD_APOYO).length;
  return 3 + Math.min(1, leales);
}

/** Si el que gobierna es otro partido, su aparato fiscaliza más fuerte. */
export const aparatoRival = (carrera: Carrera) => {
  const gobierna = oficialismoNacional(carrera);
  return !!gobierna && gobierna !== carrera.partido;
};

/** Arma la noche: las mesas, cuáles tienen fiscal fijo y cuándo salta cada incidente. */
export function armarFiscalizacion(azar: EstadoAzar, carrera: Carrera, cargo: CargoId): FiscalizacionEnCurso {
  const mesas = MESAS[cargo] ?? 12;
  const parte = acotar(0.2 + carrera.construccion / 200, 0.2, 0.6);
  const cubiertas: number[] = [];
  const orden = Array.from({ length: mesas }, (_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = entero(azar, 0, i);
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  cubiertas.push(...orden.slice(0, Math.round(mesas * parte)).sort((a, b) => a - b));
  const cantidad = 10 + (aparatoRival(carrera) ? 4 : 0) + Math.floor(mesas / 4);
  const incidentes: IncidenteMesa[] = [];
  for (let k = 0; k < cantidad; k++) {
    const mesa = entero(azar, 0, mesas - 1);
    const conFiscal = cubiertas.includes(mesa);
    const aparece = Math.round(((k + siguiente(azar)) / cantidad) * (DURACION_FISCALIZACION - 6) * 10) / 10;
    incidentes.push({
      mesa,
      tipo: TIPOS_INCIDENTE[entero(azar, 0, TIPOS_INCIDENTE.length - 1)],
      aparece,
      plazo: entero(azar, 4, 6) + (conFiscal ? 3 : 0),
      peso: conFiscal ? 1 : PESO_SIN_FISCAL,
    });
  }
  return { mesas, cubiertas, fiscales: fiscalesDe(carrera), incidentes };
}

/**
 * Qué incidentes salvaste con tus envíos. Se recalcula acá, así no importa lo
 * que diga la pantalla: un envío sin fiscal libre, antes de que salte el
 * incidente o repetido no cuenta.
 */
export function salvados(f: FiscalizacionEnCurso, envios: EnvioFiscal[]): boolean[] {
  const ok = f.incidentes.map(() => false);
  const libres: number[] = Array(f.fiscales).fill(0);
  const atendidos = new Set<number>();
  for (const e of [...envios].sort((a, b) => a.segundo - b.segundo)) {
    const inc = f.incidentes[e.incidente];
    if (!inc || atendidos.has(e.incidente) || e.segundo < inc.aparece || e.segundo > DURACION_FISCALIZACION) continue;
    const fiscal = libres.findIndex((t) => t <= e.segundo);
    if (fiscal < 0) continue;
    libres[fiscal] = e.segundo + OCUPADO_FISCAL;
    atendidos.add(e.incidente);
    ok[e.incidente] = e.segundo + VIAJE_FISCAL <= inc.aparece + inc.plazo;
  }
  return ok;
}

/** De lo salvado (por peso) a los puntos sobre tu porcentaje. */
export function ajusteFiscalizacion(f: FiscalizacionEnCurso, envios: EnvioFiscal[]): number {
  const ok = salvados(f, envios);
  const total = f.incidentes.reduce((s, i) => s + i.peso, 0);
  const salvado = f.incidentes.reduce((s, i, k) => s + (ok[k] ? i.peso : 0), 0);
  const parte = total ? salvado / total : 1;
  return Math.round((PEOR_FISCALIZACION + (MEJOR_FISCALIZACION - PEOR_FISCALIZACION) * parte) * 10) / 10;
}

/** Mueve tus votos: lo que ganás se lo sacás a los rivales, en proporción, y al revés. */
export function moverVotos(votos: number[], tuyo: number, ajuste: number): number[] {
  const nuevo = acotar(votos[tuyo] + ajuste, 0.5, 99);
  const delta = nuevo - votos[tuyo];
  const resto = votos.reduce((s, v, i) => (i === tuyo ? s : s + v), 0);
  const movidos = votos.map((v, i) => (i === tuyo ? nuevo : Math.max(0, v - (resto ? (delta * v) / resto : 0))));
  const redondos = movidos.map((v) => Math.round(v * 10) / 10);
  const diferencia = Math.round((100 - redondos.reduce((s, v) => s + v, 0)) * 10) / 10;
  const mayorRival = redondos.reduce((m, v, i) => (i !== tuyo && v > redondos[m] ? i : m), tuyo === 0 ? 1 : 0);
  redondos[mayorRival] = Math.round((redondos[mayorRival] + diferencia) * 10) / 10;
  return redondos;
}
