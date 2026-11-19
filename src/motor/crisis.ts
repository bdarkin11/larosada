import { buscarCrisis, CRISIS } from '../datos/crisis';
import type { DefEvento } from '../datos/eventos';
import { buscarEvento } from '../datos/eventos';
import { anotarHistorico, aplicar, registrarLogro } from './ficha';
import { moverPais } from './pais';
import { subirMalestar } from './promesas';
import type { Carrera, CrisisId } from './tipos';

/** Cuánto Poder te da salir de una crisis. */
export const PREMIO_SALIDA = 5;

const abiertas = (c: Carrera) => c.crisis ?? [];

/** Al cerrar el año de un presidente: las crisis abiertas pesan, se cierran solas o empiezan nuevas. */
export function anioDeLasCrisis(carrera: Carrera): string[] {
  if (carrera.cargo !== 'presidente') {
    delete carrera.crisis;
    return [];
  }
  const lineas: string[] = [];
  for (const { id } of abiertas(carrera)) {
    const def = buscarCrisis(id);
    if (def.terminaSola(carrera)) {
      lineas.push(terminarCrisis(carrera, id, 'El país se recuperó solo'));
      continue;
    }
    const { pais, imagen, poder, malestar } = def.castigo;
    if (pais) moverPais(carrera, pais);
    if (imagen) aplicar(carrera, 'imagen', imagen);
    if (poder) aplicar(carrera, 'poder', poder);
    if (malestar) subirMalestar(carrera, malestar);
    lineas.push(`${def.icono} Sigue la crisis: ${def.nombre.toLowerCase()}.`);
  }
  for (const def of CRISIS) {
    if (abiertas(carrera).some((x) => x.id === def.id) || !def.empieza(carrera)) continue;
    carrera.crisis = [...abiertas(carrera), { id: def.id, desde: carrera.anio }];
    lineas.push(`${def.icono} Empezó una crisis: ${def.nombre.toLowerCase()}. Pesa todos los años hasta que salgas.`);
  }
  return lineas;
}

/** Se cierra una crisis: por una decisión de salida o porque el país se recuperó. */
export function terminarCrisis(carrera: Carrera, id: CrisisId, como = 'Saliste'): string {
  const def = buscarCrisis(id);
  carrera.crisis = abiertas(carrera).filter((x) => x.id !== id);
  if (!carrera.crisis.length) delete carrera.crisis;
  aplicar(carrera, 'poder', PREMIO_SALIDA);
  anotarHistorico(carrera, 'crisisSuperadas');
  registrarLogro(carrera, def.icono, `Saliste de la crisis: ${def.nombre}`);
  return `${def.icono} ${como}: se terminó la crisis (${def.nombre.toLowerCase()}). Poder +${PREMIO_SALIDA}.`;
}

/** La decisión de salida de la crisis más vieja, si hay alguna abierta. */
export function eventoDeCrisis(carrera: Carrera): DefEvento | null {
  const primera = abiertas(carrera)[0];
  return carrera.cargo === 'presidente' && primera ? buscarEvento(buscarCrisis(primera.id).salida) : null;
}

/** Para mostrar: las crisis abiertas, con su ícono. */
export function textoCrisis(carrera: Carrera): { icono: string; nombre: string; desde: number }[] {
  return abiertas(carrera).map(({ id, desde }) => ({ ...buscarCrisis(id), desde }));
}
