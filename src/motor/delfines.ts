import { PARTIDOS, elPartido } from '../datos/partidos';
import { APELLIDOS, NOMBRES } from '../datos/provincias';
import { chance, elegir, entero } from './azar';
import { acotar, anotar, aplicar, diferencias, ETAPA, moverConstruccion, registrarLogro } from './ficha';
import type { Carrera, Delfin, PartidoId } from './tipos';

/**
 * Tus delfines: gente joven de tu espacio que formás durante la carrera.
 * Crecen con tu construcción y su talento, te arman el territorio en las
 * elecciones y, al final, uno puede heredar tu lugar. Si los descuidás, se van.
 */

export const MAXIMO_DELFINES = 2;
export const COSTO_DELFIN = 5000;
export const PODER_DELFIN = 3;
/** Con lealtad por debajo de esto, puede irse a otro partido. */
export const LEALTAD_TRAICION = 25;
export const CHANCE_TRAICION = 0.35;
/** Con lealtad desde esto, te arma el territorio en las elecciones. */
export const LEALTAD_APOYO = 40;
export const TOPE_APOYO = 6;
/** Crecimiento desde el que "ya tiene gente propia": queda en el palmarés. */
export const NIVEL_FIGURA = 60;

export const delfinesDe = (c: Carrera): Delfin[] => c.delfines ?? [];

/** Por qué no podés formar un delfín ahora, o null si podés. */
export function motivoSinDelfin(c: Carrera): string | null {
  if (c.fin || c.detencion || c.entrevista || c.pases || c.eleccion || c.evento) return 'Ahora no: primero resolvé lo que tenés enfrente.';
  if (c.construccion < ETAPA.referente.desde) return `Hace falta ser ${ETAPA.referente.nombre} (Construcción ${ETAPA.referente.desde}).`;
  if (delfinesDe(c).length >= MAXIMO_DELFINES) return `Ya tenés ${MAXIMO_DELFINES} delfines: no da para más.`;
  if (c.delfinFormado === c.anio) return 'Ya sumaste a alguien este año.';
  if (c.medidores.caja < COSTO_DELFIN) return `Necesitás US$ ${COSTO_DELFIN.toLocaleString('es-AR')} en la caja.`;
  return null;
}

/** Sumás a alguien joven de tu espacio. Cuesta Poder y plata. No pasa el año. */
export function formarDelfin(anterior: Carrera): Carrera {
  const motivo = motivoSinDelfin(anterior);
  if (motivo) throw new Error(motivo);
  const c = structuredClone(anterior);
  const d: Delfin = {
    id: c.anio * 10 + delfinesDe(c).length,
    nombre: `${elegir(c.azar, NOMBRES)} ${elegir(c.azar, APELLIDOS)}`,
    edad: entero(c.azar, 22, 32),
    talento: entero(c.azar, 25, 90),
    lealtad: entero(c.azar, 55, 85),
    nivel: 5,
    desde: c.anio,
  };
  c.delfines = [...delfinesDe(c), d];
  c.delfinFormado = c.anio;
  c.medidores.caja -= COSTO_DELFIN;
  aplicar(c, 'poder', -PODER_DELFIN);
  anotar(c, [
    `🐬 Sumaste a ${d.nombre} (${d.edad} años) como tu delfín: talento ${d.talento}, lealtad ${d.lealtad} (US$ −${COSTO_DELFIN.toLocaleString('es-AR')}, Poder −${PODER_DELFIN}).`,
  ]);
  c.cambios = diferencias(anterior, c);
  return c;
}

/** Cuánto crece por año: su talento y tu construcción. */
export const crecimientoAnual = (c: Carrera, d: Delfin) => Math.max(1, Math.round(d.talento / 25 + c.construccion / 30));

/** Cuánto se mueve su lealtad por año: te bancan si te va bien, te dejan si te ven perdido. */
export function cambioDeLealtad(c: Carrera, d: Delfin): number {
  let cambio = 0;
  if (c.medidores.imagen >= 55) cambio += 1;
  if (c.medidores.imagen < 35) cambio -= 2;
  if (c.medidores.poder < 25) cambio -= 2;
  // Cuando ya pesa más que vos, empieza a pensar en sí mismo.
  if (d.nivel > c.construccion) cambio -= 1;
  return cambio;
}

/** Un partido que no es el tuyo, para el que se va. */
function otroPartido(c: Carrera): PartidoId {
  const otros = (Object.keys(PARTIDOS) as PartidoId[]).filter((p) => p !== c.partido);
  return elegir(c.azar, otros);
}

/** Lo que te llevás si se va: parte de tu gente. */
export const construccionQueSeLleva = (d: Delfin) => Math.min(8, 2 + Math.round(d.nivel / 8));

/** El año de tus delfines: crecen, cambia su lealtad y, si está muy baja, alguno se va. */
export function anioDeLosDelfines(c: Carrera): string[] {
  const lineas: string[] = [];
  const quedan: Delfin[] = [];
  for (const d of delfinesDe(c)) {
    d.edad += 1;
    const antes = d.nivel;
    // Solo crece hasta su talento: más allá, solo con tu apoyo (los eventos).
    if (d.nivel < d.talento) d.nivel = Math.min(d.talento, d.nivel + crecimientoAnual(c, d));
    d.lealtad = acotar(d.lealtad + cambioDeLealtad(c, d), 0, 100);
    if (antes < NIVEL_FIGURA && d.nivel >= NIVEL_FIGURA) {
      registrarLogro(c, '🐬', `Tu delfín ${d.nombre} ya tiene gente propia`);
      lineas.push(`🐬 ${d.nombre} ya tiene gente propia: camina sin vos.`);
    }
    if (d.lealtad < LEALTAD_TRAICION && chance(c.azar, CHANCE_TRAICION)) {
      const lleva = construccionQueSeLleva(d);
      moverConstruccion(c, -lleva);
      aplicar(c, 'poder', -2);
      c.traiciones = (c.traiciones ?? 0) + 1;
      lineas.push(
        `🐍 ${d.nombre} te traicionó: se fue a ${elPartido(otroPartido(c))} y se llevó parte de tu gente (Construcción −${lleva}, Poder −2).`,
      );
      continue;
    }
    quedan.push(d);
  }
  if (c.delfines) c.delfines = quedan;
  return lineas;
}

/** Lo que un evento le hace a tu delfín. Devuelve el texto para el desenlace. */
export function moverDelfin(c: Carrera, id: number | undefined, cambio: { lealtad?: number; nivel?: number; cargo?: boolean }): string {
  const d = delfinesDe(c).find((x) => x.id === id) ?? delfinesDe(c)[0];
  if (!d) return '';
  if (cambio.lealtad) d.lealtad = acotar(d.lealtad + cambio.lealtad, 0, 100);
  if (cambio.nivel) d.nivel = acotar(d.nivel + cambio.nivel, 0, 100);
  if (cambio.cargo) d.cargo = true;
  const partes = [
    cambio.lealtad ? `lealtad ${cambio.lealtad > 0 ? '+' : '−'}${Math.abs(cambio.lealtad)}` : '',
    cambio.nivel ? `crecimiento ${cambio.nivel > 0 ? '+' : '−'}${Math.abs(cambio.nivel)}` : '',
  ].filter(Boolean);
  return partes.length ? `${d.nombre}: ${partes.join(', ')}.` : '';
}

/** Lo que te suman en una elección: los leales te arman el territorio; si tienen cargo, más. */
export function apoyoDeDelfines(c: Carrera): number {
  const suma = delfinesDe(c)
    .filter((d) => d.lealtad >= LEALTAD_APOYO)
    .reduce((s, d) => s + Math.round(d.nivel / 20) + (d.cargo ? 2 : 0), 0);
  return Math.min(TOPE_APOYO, suma);
}

/** El delfín del que habla un evento de delfines: el que cumple la condición. */
export function delfinParaEvento(c: Carrera, condicion: (d: Delfin) => boolean): Delfin | null {
  return delfinesDe(c).find(condicion) ?? null;
}
