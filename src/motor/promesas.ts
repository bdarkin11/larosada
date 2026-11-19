import { CARGOS } from '../datos/cargos';
import { MAXIMO_PROMESAS, PROMESAS, buscarPromesa } from '../datos/promesas';
import type { DefPromesa, Etiqueta, Postura } from '../datos/promesas';
import { apoyoDeDelfines } from './delfines';
import { ANIOS_DE_LEGADO, notaDeGestion } from './distrito';
import { acotar, anotarHistorico, aplicar, registrarLogro } from './ficha';
import type { CargoId, Carrera } from './tipos';

/**
 * Las ideas, las promesas y la calle: lo que hace que decidir contra lo que
 * pensás, o contra lo que prometiste, te cueste caro.
 */

/* Coherencia con tus ideas */

/** Qué tanto una decisión va con lo que pensás: positivo, a favor; negativo, en contra. */
export function coherencia(carrera: Carrera, postura: Postura | undefined): number {
  if (!postura) return 0;
  return ((postura.economia ?? 0) * carrera.ideologia.economia + (postura.social ?? 0) * carrera.ideologia.social) / 100;
}

/** Desde acá una decisión cuenta como coherente, o como incoherente. */
export const UMBRAL_COHERENCIA = 0.34;

export type Sentido = 'coherente' | 'incoherente' | null;

export function sentido(carrera: Carrera, postura: Postura | undefined): Sentido {
  const c = coherencia(carrera, postura);
  if (c >= UMBRAL_COHERENCIA) return 'coherente';
  if (c <= -UMBRAL_COHERENCIA) return 'incoherente';
  return null;
}

export const EFECTO_COHERENTE = { imagen: 1 };
export const EFECTO_INCOHERENTE = { imagen: -2, poder: -2, malestar: 10 };

/** Lo que se recuerda: los años recientes pesan en las elecciones. */
export const MEMORIA = 8;
const recientes = (carrera: Carrera, anios: number[] | undefined) => (anios ?? []).filter((a) => carrera.anio - a < MEMORIA).length;

/* La calle */

export const subirMalestar = (carrera: Carrera, cantidad: number) => {
  carrera.malestar = acotar((carrera.malestar ?? 0) + cantidad, 0, 100);
};

/** Con esta bronca o más, el poder se te escurre todos los años. */
export const MALESTAR_ALTO = 50;

/* Las promesas */

/** Las que podés hacer para ese cargo. */
export const promesasDisponibles = (cargo: CargoId): DefPromesa[] => PROMESAS.filter((p) => !p.presidencial || cargo === 'presidente');

/** Lo que suma una promesa en la elección: más si va con tus ideas, menos si nadie te la cree. */
export function fuerzaDePromesa(carrera: Carrera, id: string): number {
  const c = coherencia(carrera, buscarPromesa(id).postura);
  if (c >= UMBRAL_COHERENCIA) return 3;
  if (c <= -UMBRAL_COHERENCIA) return 1;
  return 2;
}

export function motivoSinPromesas(cargo: CargoId, ids: string[]): string | null {
  if (ids.length > MAXIMO_PROMESAS) return `Como mucho, ${MAXIMO_PROMESAS} promesas.`;
  const posibles = promesasDisponibles(cargo).map((p) => p.id);
  if (ids.some((id) => !posibles.includes(id))) return 'Esa promesa no va para este cargo.';
  return null;
}

/** Lo que pasa al romper una promesa. */
export const CASTIGO_PROMESA = { imagen: -6, poder: -4, malestar: 25 };

/** Lo que te da cumplir una promesa al terminar el mandato. */
export const PREMIO_PROMESA = { imagen: 3, poder: 2 };

/** Qué promesas vigentes rompe una decisión, sin tocar nada. */
export function promesasQueRompe(carrera: Carrera, que: { etiquetas?: Etiqueta[]; coima?: boolean; pasiva?: boolean }): DefPromesa[] {
  return (carrera.promesas ?? [])
    .map((p) => buscarPromesa(p.id))
    .filter((def) => {
      if (def.rompe.etiqueta && que.etiquetas?.includes(def.rompe.etiqueta)) return true;
      if (def.rompe.coima && que.coima) return true;
      if (def.rompe.ausencias && que.pasiva) return (carrera.ausencias ?? 0) + 1 >= def.rompe.ausencias;
      return false;
    });
}

/** Rompe las promesas que corresponda, con su castigo. Devuelve las líneas para el historial. */
export function romperPromesas(carrera: Carrera, que: { etiquetas?: Etiqueta[]; coima?: boolean; pasiva?: boolean }): string[] {
  const rotas = promesasQueRompe(carrera, que);
  if (que.pasiva) carrera.ausencias = (carrera.ausencias ?? 0) + 1;
  if (!rotas.length) return [];
  const lineas: string[] = [];
  for (const def of rotas) {
    carrera.promesas = (carrera.promesas ?? []).filter((p) => p.id !== def.id);
    carrera.promesasRotas = [...(carrera.promesasRotas ?? []), carrera.anio];
    aplicar(carrera, 'imagen', CASTIGO_PROMESA.imagen);
    aplicar(carrera, 'poder', CASTIGO_PROMESA.poder);
    subirMalestar(carrera, CASTIGO_PROMESA.malestar);
    lineas.push(
      `💔 Rompiste tu promesa «${def.texto}»: Imagen −${-CASTIGO_PROMESA.imagen}, Poder −${-CASTIGO_PROMESA.poder}, y la calle se calienta.`,
    );
  }
  return lineas;
}

/** Al ganar: las promesas de la campaña quedan vigentes durante el mandato. */
export function asumirPromesas(carrera: Carrera, ids: string[], cargo: CargoId, hasta: number) {
  carrera.promesas = ids.map((id) => ({ id, cargo, hasta }));
  carrera.ausencias = 0;
}

/** Al terminar el mandato: las que sobrevivieron se cumplieron (si la meta se cumple). */
export function cerrarPromesas(carrera: Carrera, lineas: string[]) {
  const vigentes = carrera.promesas ?? [];
  if (!vigentes.length) return;
  for (const p of vigentes) {
    const def = buscarPromesa(p.id);
    const fallo = def.meta === 'inflacion' && carrera.pais && carrera.pais.inflacion >= carrera.pais.recibido.inflacion;
    if (fallo) {
      carrera.promesasRotas = [...(carrera.promesasRotas ?? []), carrera.anio];
      aplicar(carrera, 'imagen', CASTIGO_PROMESA.imagen);
      aplicar(carrera, 'poder', CASTIGO_PROMESA.poder);
      subirMalestar(carrera, CASTIGO_PROMESA.malestar);
      lineas.push(
        `💔 No cumpliste «${def.texto}»: la inflación terminó más alta que cuando llegaste (Imagen −${-CASTIGO_PROMESA.imagen}, Poder −${-CASTIGO_PROMESA.poder}).`,
      );
    } else {
      aplicar(carrera, 'imagen', PREMIO_PROMESA.imagen);
      aplicar(carrera, 'poder', PREMIO_PROMESA.poder);
      lineas.push(
        `🤝 Cumpliste «${def.texto}» como ${CARGOS[p.cargo].nombre}: Imagen +${PREMIO_PROMESA.imagen}, Poder +${PREMIO_PROMESA.poder}.`,
      );
      registrarLogro(carrera, '🤝', `Cumpliste: «${def.texto}»`);
      anotarHistorico(carrera, 'promesasCumplidas');
    }
  }
  carrera.promesas = [];
  carrera.ausencias = 0;
}

/* Lo que pesa en la próxima elección */

export interface Ajuste {
  texto: string;
  valor: number;
}

/** La edad de Avellaneda: antes de esto, nadie te ve como presidente. */
export const EDAD_PRESIDENCIAL = 37;
/** Haber sido presidente: la gente quiere caras nuevas. */
export const CASTIGO_EXPRESIDENTE = -8;

/** Lo que te suma o te resta tu historia en una elección, más allá de tus números. */
export function ajustesDeHistoria(carrera: Carrera, cargo: CargoId): Ajuste[] {
  const ajustes: Ajuste[] = [];
  const rotas = recientes(carrera, carrera.promesasRotas);
  if (rotas) ajustes.push({ texto: `💔 Promesas rotas (${rotas})`, valor: -Math.min(9, rotas * 3) });
  const incoherencias = recientes(carrera, carrera.incoherencias);
  if (incoherencias) ajustes.push({ texto: `🧭 Decisiones contra tus ideas (${incoherencias})`, valor: -Math.min(8, incoherencias * 2) });
  if ((carrera.malestar ?? 0) >= MALESTAR_ALTO) ajustes.push({ texto: '✊ La calle está caliente', valor: -3 });
  if (carrera.expresidente !== undefined)
    ajustes.push({ texto: '🏛️ Ya fuiste presidente: la gente quiere caras nuevas', valor: CASTIGO_EXPRESIDENTE });
  // Tu gestión: la que estás haciendo, o la que entregaste hace poco.
  const d = carrera.distrito;
  const legado = carrera.legadoGestion && carrera.anio - carrera.legadoGestion.anio <= ANIOS_DE_LEGADO ? carrera.legadoGestion : undefined;
  const nota = d ? notaDeGestion(d) : (legado?.valor ?? 0);
  if (nota) {
    const donde = (d?.cargo ?? legado?.cargo) === 'gobernador' ? 'la provincia' : 'la intendencia';
    ajustes.push({ texto: `${nota > 0 ? '🏗️' : '🕳️'} Tu gestión en ${donde}${d ? '' : ' (la que entregaste)'}`, valor: nota });
  }
  const delfines = apoyoDeDelfines(carrera);
  if (delfines) ajustes.push({ texto: '🐬 Tus delfines te arman el territorio', valor: delfines });
  if (cargo === 'presidente' && carrera.edad < EDAD_PRESIDENCIAL) {
    ajustes.push({ texto: `🧒 Te ven muy joven para la Rosada (${carrera.edad} años)`, valor: -3 * (EDAD_PRESIDENCIAL - carrera.edad) });
  }
  return ajustes;
}

export { MAXIMO_PROMESAS };
