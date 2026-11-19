import { CARGOS } from './datos/cargos';
import { cargoMaximo, poderHistorico } from './motor/historico';
import type { Carrera, MotivoFin } from './motor/tipos';

/** Las mejores carreras jugadas en este navegador, por Poder Histórico. */

const CLAVE = 'larosada.historicos';
export const LUGARES = 10;

export interface CarreraHistorica {
  /** Para no anotar dos veces la misma carrera. */
  id: string;
  nombre: string;
  desde: number;
  hasta: number;
  cargoMax: string;
  final: MotivoFin;
  puntos: number;
}

export function mejoresCarreras(): CarreraHistorica[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

const idDe = (c: Carrera) => `${c.semilla}-${c.anioInicio}-${c.nombre}`;

/** Anota una carrera terminada. Devuelve la tabla y el puesto que sacó (o null si no entró). */
export function registrarCarrera(c: Carrera): { tabla: CarreraHistorica[]; id: string; puesto: number | null } {
  const id = idDe(c);
  let tabla = mejoresCarreras();
  if (c.fin && !tabla.some((x) => x.id === id)) {
    tabla.push({
      id,
      nombre: c.nombre,
      desde: c.anioInicio,
      hasta: c.fin.anio,
      cargoMax: CARGOS[cargoMaximo(c)].nombre,
      final: c.fin.motivo,
      puntos: poderHistorico(c).total,
    });
    tabla = tabla.sort((a, b) => b.puntos - a.puntos).slice(0, LUGARES);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(tabla));
    } catch {
      // Sin almacenamiento: la tabla vale solo por esta vez.
    }
  }
  const i = tabla.findIndex((x) => x.id === id);
  return { tabla, id, puesto: i >= 0 ? i + 1 : null };
}
