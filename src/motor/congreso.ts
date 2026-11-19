import { BLOQUE_TIPICO, chanceLey, DIPUTADOS, LEYES, MAYORIA_DIPUTADOS, MAYORIA_SENADO, SENADORES } from '../datos/leyes';
import { chance, ruido } from './azar';
import { acotar, aplicar, registrarLogro } from './ficha';
import type { Carrera } from './tipos';

/**
 * El Congreso del presidente: el bloque que te deja la elección, el presupuesto
 * de cada año, las legislativas de medio término y el proyecto de ley anual.
 */

/** Cuántos años le quedan al mandato cuando se votan las legislativas. */
export const ANIOS_RESTANTES_MEDIO_TERMINO = 2;
/** Si el presupuesto no sale, gobernás con el del año anterior. */
export const CASTIGO_SIN_PRESUPUESTO = { poder: -3, imagen: -1 };
/** El presupuesto es la ley más fácil: la oposición también lo necesita. */
export const DIFICULTAD_PRESUPUESTO = -0.15;

/** Al ganar la presidencia: tu bloque sale de tus votos, con ruido. */
export function armarCongreso(carrera: Carrera, votos: number) {
  const parte = (v: number) => acotar(v / 100 + ruido(carrera.azar, 6) / 100, 0.25, 0.62);
  carrera.congreso = {
    diputados: Math.round(DIPUTADOS * parte(votos - 4)),
    senadores: Math.round(SENADORES * parte(votos - 4)),
  };
}

export function textoBloque(carrera: Carrera): string {
  const b = carrera.congreso ?? BLOQUE_TIPICO;
  return `Diputados ${b.diputados}/${MAYORIA_DIPUTADOS} · Senado ${b.senadores}/${MAYORIA_SENADO}`;
}

/** El examen del gobierno: tu bloque crece o se achica según tu Imagen, el país y la calle. */
function medioTermino(carrera: Carrera, lineas: string[]) {
  const b = carrera.congreso ?? { ...BLOQUE_TIPICO };
  const p = carrera.pais;
  const pais = p ? (p.inflacion < 30 ? 3 : p.inflacion > 100 ? -4 : 0) + (p.actividad > 55 ? 3 : p.actividad < 40 ? -3 : 0) : 0;
  const calle = (carrera.malestar ?? 0) >= 50 ? -4 : 0;
  // Un punto de Imagen sobre 50 son 0,6 diputados más; lo mismo, proporcional, en el Senado.
  const viento = (carrera.medidores.imagen - 50) * 0.6 + pais * 2 + calle * 2 + ruido(carrera.azar, 6);
  const antes = b.diputados;
  b.diputados = Math.round(acotar(b.diputados + viento, 40, DIPUTADOS));
  b.senadores = Math.round(acotar(b.senadores + viento * (SENADORES / DIPUTADOS), 10, SENADORES));
  carrera.congreso = b;
  const cambio = b.diputados - antes;
  lineas.push(
    `Legislativas de medio término: ${cambio >= 0 ? 'ganaste' : 'perdiste'} ${Math.abs(cambio)} diputados. Tu bloque: ${textoBloque(carrera)}.`,
  );
  if (b.diputados >= MAYORIA_DIPUTADOS && b.senadores >= MAYORIA_SENADO) registrarLogro(carrera, '🏛️', 'Mayoría propia en las dos cámaras');
}

/** Lo que el Congreso hace solo, cada año de presidencia. */
export function anioDelCongreso(carrera: Carrera): string[] {
  if (carrera.cargo !== 'presidente') return [];
  const lineas: string[] = [];
  if (carrera.mandatoHasta !== undefined && carrera.mandatoHasta - carrera.anio === ANIOS_RESTANTES_MEDIO_TERMINO) {
    medioTermino(carrera, lineas);
  }
  if (chance(carrera.azar, chanceLey(carrera, DIFICULTAD_PRESUPUESTO))) {
    lineas.push('El Congreso te aprobó el presupuesto.');
  } else {
    aplicar(carrera, 'poder', CASTIGO_SIN_PRESUPUESTO.poder);
    aplicar(carrera, 'imagen', CASTIGO_SIN_PRESUPUESTO.imagen);
    lineas.push('No te aprobaron el presupuesto: gobernás con el del año pasado (Poder −3, Imagen −1).');
  }
  return lineas;
}

/** Los proyectos que pueden llegar este año: ni aprobados ni vistos en los últimos cuatro años. */
export function leyesPosibles(carrera: Carrera) {
  if (carrera.cargo !== 'presidente') return [];
  const vistos = carrera.eventosVistos;
  return LEYES.filter((l) => !carrera.leyes?.includes(l.id) && (vistos[l.id] === undefined || carrera.anio - vistos[l.id] >= 4));
}

/** Anota la ley aprobada. */
export function aprobarLey(carrera: Carrera, id: string) {
  carrera.leyes = [...(carrera.leyes ?? []), id];
  if (carrera.leyes.length === 1) registrarLogro(carrera, '📜', 'Tu primera ley');
}

/** Pasa al siguiente evento en cola, si hay. */
export function siguienteEnCola(carrera: Carrera) {
  const siguiente = carrera.cola?.shift();
  if (!carrera.cola?.length) delete carrera.cola;
  if (siguiente && !carrera.evento) carrera.evento = siguiente;
}
