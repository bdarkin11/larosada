import { CARGOS } from '../datos/cargos';
import { elPartido } from '../datos/partidos';
import { chance, elegir, entero, ruido } from './azar';
import { acotar, anotarHistorico, aplicar, registrarLogro } from './ficha';
import { subirMalestar } from './promesas';
import { PARTIDOS_IDS } from './tipos';
import type { Carrera, IndicadoresDistrito, PartidoId } from './tipos';

/**
 * Gobernar abajo: intendentes y gobernadores tienen Cuentas y Gestión. Se
 * heredan al asumir, se mueven cada año y cómo los entregás pesa en las
 * elecciones siguientes.
 */

export const NOMBRE_DISTRITO: Record<keyof IndicadoresDistrito, string> = { cuentas: 'Cuentas', gestion: 'Gestión' };
export const ICONO_DISTRITO: Record<keyof IndicadoresDistrito, string> = { cuentas: '💰', gestion: '🏗️' };

/** Lo que te llega (o te sacan) de la Nación cada año, según si sos aliado. */
export const COPARTICIPACION = { aliado: 3, opositor: -3 };
/** Lo que crece el gasto solo, cada año. */
export const GASTO_QUE_CRECE = 2;
/** Durante cuántos años, después de dejar el cargo, tu gestión pesa en las elecciones. */
export const ANIOS_DE_LEGADO = 4;

export const esEjecutivoLocal = (c: Pick<Carrera, 'cargo'>) => c.cargo === 'intendente' || c.cargo === 'gobernador';

/** Quién gobierna la Nación. Si sos presidente, vos. */
export function oficialismoNacional(c: Carrera): PartidoId | undefined {
  return c.cargo === 'presidente' ? c.partido : c.oficialismo;
}

export const esAliado = (c: Carrera) => oficialismoNacional(c) === c.partido;

/** Cuánto suma o resta tu gestión en las elecciones: Gestión pesa el doble que Cuentas. */
export function notaDeGestion(d: IndicadoresDistrito): number {
  return Math.round((d.gestion - 50) / 8 + (d.cuentas - 50) / 16);
}

export function recibirDistrito(c: Carrera) {
  const recibido = { cuentas: entero(c.azar, 25, 70), gestion: entero(c.azar, 30, 65) };
  c.distrito = { ...recibido, recibido, cargo: c.cargo };
}

export function moverDistrito(c: Carrera, cambio: Partial<IndicadoresDistrito>) {
  const d = c.distrito;
  if (!d) return;
  d.cuentas = Math.round(acotar(d.cuentas + (cambio.cuentas ?? 0), 0, 100));
  d.gestion = Math.round(acotar(d.gestion + (cambio.gestion ?? 0), 0, 100));
}

/** Al dejar el cargo: queda el legado para las elecciones que vienen. */
export function entregarDistrito(c: Carrera, lineas: string[]) {
  const d = c.distrito;
  if (!d) return;
  const { cargo } = d;
  const valor = notaDeGestion(d);
  c.legadoGestion = { cargo, anio: c.anio, valor };
  anotarHistorico(c, 'distritoNotas', valor);
  lineas.push(
    `Entregaste ${cargo === 'gobernador' ? 'la provincia' : 'la intendencia'} con Gestión ${d.gestion} y Cuentas ${d.cuentas} (la recibiste con ${d.recibido.gestion} y ${d.recibido.cuentas}).`,
  );
  if (d.gestion >= 70) registrarLogro(c, '🏗️', `Buena gestión: ${CARGOS[cargo].nombre}`);
  delete c.distrito;
}

/** Cada cuatro años cambia (o no) quién gobierna la Nación. */
function renovarOficialismo(c: Carrera) {
  if (!c.oficialismo || c.anio % 4 === 3) c.oficialismo = elegir(c.azar, PARTIDOS_IDS);
}

/** Al cerrar el año de un intendente o gobernador. */
export function anioDelDistrito(c: Carrera): string[] {
  if (c.cargo !== 'presidente') renovarOficialismo(c);
  if (!esEjecutivoLocal(c)) {
    // Si dejaste el cargo por otra vía (un pase, la Justicia), la entrega igual queda anotada.
    const lineas: string[] = [];
    if (c.distrito) entregarDistrito(c, lineas);
    return lineas;
  }
  // Si cambiaste de intendencia a provincia sin pasar por la entrega, se entrega ahora.
  if (c.distrito && c.distrito.cargo !== c.cargo) entregarDistrito(c, []);
  if (!c.distrito) recibirDistrito(c);
  const d = c.distrito!;
  const lineas: string[] = [];
  const aliado = esAliado(c);

  // La plata: la coparticipación, el gasto que crece solo y un poco de azar.
  const copa = aliado ? COPARTICIPACION.aliado : COPARTICIPACION.opositor;
  moverDistrito(c, { cuentas: copa - GASTO_QUE_CRECE + ruido(c.azar, 3) });
  lineas.push(
    aliado
      ? `🤝 Sos aliado de la Nación: llegan fondos (Cuentas +${copa}).`
      : `🥶 La Nación es ${elPartido(oficialismoNacional(c)!)}: te retacean fondos (Cuentas ${copa}).`,
  );

  // El presupuesto en el Concejo o la Legislatura.
  const apoyo = 0.6 + (c.atributos.rosca - 50) / 200 + (c.medidores.poder - 50) / 200 + (aliado ? 0.1 : 0);
  if (!chance(c.azar, Math.min(0.95, Math.max(0.1, apoyo)))) {
    moverDistrito(c, { gestion: -4 });
    aplicar(c, 'poder', -2);
    lineas.push(`${c.cargo === 'gobernador' ? 'La Legislatura' : 'El Concejo'} no te aprobó el presupuesto (Gestión −4, Poder −2).`);
  }

  // La gestión: tu Gestión como atributo empuja; sin plata, todo se para.
  const empuje = (c.atributos.gestion - 50) / 25 + (d.cuentas < 30 ? -5 : d.cuentas > 60 ? 2 : 0) + ruido(c.azar, 2);
  moverDistrito(c, { gestion: empuje });

  // Lo que la gente ve.
  if (d.gestion >= 65) {
    aplicar(c, 'imagen', 2);
    lineas.push(`🏗️ Se nota la gestión (${d.gestion}): Imagen +2.`);
  } else if (d.gestion <= 35) {
    aplicar(c, 'imagen', -2);
    subirMalestar(c, 5);
    lineas.push(`🕳️ La gestión no se ve (${d.gestion}): Imagen −2 y la calle se calienta.`);
  }
  if (d.cuentas < 15) {
    aplicar(c, 'imagen', -2);
    subirMalestar(c, 10);
    lineas.push('💸 No alcanza para pagar los sueldos: Imagen −2 y la calle se calienta.');
  }
  return lineas;
}
