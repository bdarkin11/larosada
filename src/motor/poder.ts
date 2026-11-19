import { acotar, aplicar, registrarLogro } from './ficha';
import type { CargoId, Carrera } from './tipos';

/**
 * El Poder: cuánto pesás entre los que mandan. Un solo número, de 0 a 100.
 * Las decisiones lo suben o lo bajan, y cada año se acerca al poder que te
 * da tu lugar: el poder se ejerce o se pierde.
 */

/** Lo que te da cada cargo, aunque no hagas nada. */
export const PISO_PODER: Record<CargoId, number> = {
  militante: 5,
  asesor: 12,
  concejal: 20,
  funcionario: 20,
  secretario: 30,
  legislador: 30,
  intendente: 40,
  diputado: 40,
  senador: 55,
  gobernador: 55,
  presidente: 75,
};

/** Con qué poder arranca cualquiera. El origen suma (ver datos/armado). */
export const PODER_INICIAL = 10;

/** Cuánto se acerca cada año el poder al de tu lugar. */
export const TENDENCIA_PODER = 0.15;

/** Con esto o menos estás solo; con esto o más, todos te llaman. */
export const PODER_SOLO = 15;
export const PODER_ALTO = 60;
/** Desde acá queda en el palmarés. */
export const PODER_LOGRO = 80;

/** Un ex presidente sin cargo sigue pesando algo: lo llaman, aunque menos. */
export const PISO_EXPRESIDENTE = 35;
/** En el segundo mandato todos saben que te vas: el piso baja hasta acá. */
export const PISO_PATO_RENGO = 55;

/** El piso de tu cargo hoy: en el segundo mandato presidencial se va achicando. */
export function pisoDePoder(carrera: Carrera): number {
  if (carrera.cargo === 'presidente' && (carrera.mandatosSeguidos ?? 0) >= 2 && carrera.mandatoHasta !== undefined) {
    const anios = carrera.anio - (carrera.mandatoHasta - 4);
    return Math.max(PISO_PATO_RENGO, PISO_PODER.presidente - 5 * anios);
  }
  if (carrera.cargo === 'militante' && carrera.expresidente !== undefined) return PISO_EXPRESIDENTE;
  return PISO_PODER[carrera.cargo];
}

/** El poder que te da tu lugar: el piso del cargo y un quinto de tu construcción. */
export const poderDeTuLugar = (carrera: Carrera) => Math.round(pisoDePoder(carrera) + carrera.construccion / 5);

/** Lo que suma o resta el poder en una elección: de −5 a +15. */
export const apoyoDelPoder = (carrera: Carrera) => Math.round((carrera.medidores.poder - 25) * 0.2);

/** Impunidad: con mucho poder, las causas avanzan más lento. De × 1,3 (poder 0) a × 0,6 (poder 100). */
export const factorImpunidad = (carrera: Carrera) => acotar(1.3 - carrera.medidores.poder * 0.007, 0.6, 1.3);

export type Postura = 'solo' | 'normal' | 'alto';

export function posturaPoder(poder: number): Postura {
  if (poder <= PODER_SOLO) return 'solo';
  if (poder >= PODER_ALTO) return 'alto';
  return 'normal';
}

export const NOMBRE_POSTURA: Record<Postura, string> = {
  solo: 'Estás solo',
  normal: 'Te atienden',
  alto: 'Todos te llaman',
};

/**
 * Al cerrar el año: el poder se acerca al de tu lugar, y se hace sentir.
 * Devuelve las líneas para el historial.
 */
export function efectoAnualDelPoder(carrera: Carrera): string[] {
  const lineas: string[] = [];
  const m = carrera.medidores;
  const antes = m.poder;
  const objetivo = poderDeTuLugar(carrera);
  const paso = Math.round((objetivo - antes) * TENDENCIA_PODER);
  if (paso) {
    m.poder = acotar(antes + paso, 0, 100);
    lineas.push(
      paso > 0
        ? `Tu lugar te da peso: Poder +${paso} (tiende a ${objetivo}).`
        : `El poder que no se ejerce se pierde: Poder −${-paso} (tiende a ${objetivo}).`,
    );
  }
  if (m.poder <= PODER_SOLO) {
    aplicar(carrera, 'imagen', -1);
    lineas.push('Estás solo: nadie sale a defenderte (Imagen −1).');
  } else if (m.poder >= PODER_ALTO) {
    aplicar(carrera, 'fama', 1);
    lineas.push('Todos te llaman: estás en todas las mesas (Fama +1).');
  }
  if (antes < PODER_LOGRO && m.poder >= PODER_LOGRO) registrarLogro(carrera, '🏛️', 'Todos te atienden el teléfono');
  return lineas;
}

/* La libreta de favores */

/** Favores que te deben: se cobran en la próxima campaña, dos puntos cada uno, hasta tres. */
export const MAXIMO_FAVORES_EN_CAMPANIA = 3;
export const PUNTOS_POR_FAVOR = 2;

export const favoresACobrar = (carrera: Carrera) => carrera.favores.filter((f) => !f.debes).slice(0, MAXIMO_FAVORES_EN_CAMPANIA);
export const favoresQueDebes = (carrera: Carrera) => carrera.favores.filter((f) => f.debes);

export function anotarFavor(carrera: Carrera, quien: string, debes: boolean, motivo: string) {
  carrera.favores.push({ quien, debes, anio: carrera.anio, motivo });
}

/** Saca de la libreta los favores que cobraste en una campaña. */
export function cobrarFavores(carrera: Carrera): number {
  const cobrados = favoresACobrar(carrera);
  for (const f of cobrados) carrera.favores.splice(carrera.favores.indexOf(f), 1);
  return cobrados.length;
}

/** El poder de una partida vieja, a partir de los diez grupos que tenía. */
export function poderDesdeGrupos(cargo: CargoId, grupos: Record<string, number> | undefined): number {
  const valores = Object.values(grupos ?? {});
  const promedio = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : 0;
  return acotar(Math.round(PISO_PODER[cargo] + promedio / 5), 0, 100);
}
