import { CARGOS } from './datos/cargos';
import { partidoMasCercano } from './datos/partidos';
import { foto } from './motor/ficha';
import { PISO_PODER, PODER_INICIAL, poderDesdeGrupos } from './motor/poder';
import type { Carrera } from './motor/tipos';

const CLAVE = 'larosada.carrera';

/** La carrera en curso queda guardada en este navegador. */
export function cargarCarrera(): Carrera | null {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return null;
    const carrera = JSON.parse(texto) as Carrera;
    const version = carrera.version as number;
    if (version === 3) return migrarDesde8(migrarDesde7(migrarDesde6(migrarDesde5(migrarDesde4(migrarDesde3(carrera))))));
    if (version === 4) return migrarDesde8(migrarDesde7(migrarDesde6(migrarDesde5(migrarDesde4(carrera)))));
    if (version === 5) return migrarDesde8(migrarDesde7(migrarDesde6(migrarDesde5(carrera))));
    if (version === 6) return migrarDesde8(migrarDesde7(migrarDesde6(carrera)));
    if (version === 7) return migrarDesde8(migrarDesde7(carrera));
    if (version === 8) return migrarDesde8(carrera);
    return carrera.version === 9 ? carrera : null;
  } catch {
    return null;
  }
}

export function guardarCarrera(carrera: Carrera) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(carrera));
  } catch {
    // Sin almacenamiento (modo privado): se juega igual, sin guardar.
  }
}

export function borrarCarrera() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
}

/** Las carreras de antes de los partidos y la construcción siguen andando: se completan los datos nuevos. */
function migrarDesde3(carrera: Carrera): Carrera {
  carrera.partido = partidoMasCercano(carrera.ideologia);
  carrera.partidoDesde = carrera.anioInicio;
  carrera.construccion = Math.floor(carrera.atributos.territorio / 4);
  carrera.pendientes = [];
  carrera.palmares = [];
  carrera.trayectoria = [];
  carrera.compras = [];
  carrera.inicioPeriodo = { anio: carrera.anio, ...foto(carrera) };
  return carrera;
}

/** Antes de las elecciones: falta el escalón más alto alcanzado. */
function migrarDesde4(carrera: Carrera): Carrera {
  carrera.mejorRango = CARGOS[carrera.cargo].rango;
  return carrera;
}

/** Antes de los eventos. */
function migrarDesde5(carrera: Carrera): Carrera {
  carrera.favores = [];
  carrera.eventosVistos = {};
  return carrera;
}

/** Antes de la caja negra y las causas por etapas. */
function migrarDesde6(carrera: Carrera): Carrera {
  carrera.cajaNegra = 0;
  carrera.movidas = {};
  carrera.negroUsado = !!carrera.coimas;
  return carrera;
}

/** Cómo se llamaban los diez grupos de poder, para los favores viejos. */
const NOMBRE_GRUPO: Record<string, string> = {
  sindicatos: 'Los sindicatos',
  movimientos: 'Los movimientos sociales',
  campo: 'El campo',
  empresarios: 'Los empresarios',
  medios: 'Los medios',
  justicia: 'La Justicia',
  gobernadores: 'Los gobernadores',
  mercados: 'Los mercados',
  iglesia: 'La Iglesia',
  fuerzas: 'Las fuerzas de seguridad',
};

type Vieja = Carrera & { grupos?: Record<string, number>; favores: (Carrera['favores'][number] & { grupo?: string })[] };

/** Antes del Poder único: los diez grupos se juntan en un solo número. */
function migrarDesde7(vieja: Carrera): Carrera {
  const carrera = vieja as Vieja;
  (carrera as { version: number }).version = 8;
  carrera.medidores.poder = carrera.grupos
    ? poderDesdeGrupos(carrera.cargo, carrera.grupos)
    : Math.max(PODER_INICIAL, PISO_PODER[carrera.cargo]);
  delete carrera.grupos;
  for (const f of carrera.favores) {
    if (!f.quien) f.quien = NOMBRE_GRUPO[f.grupo ?? ''] ?? 'Alguien';
    delete f.grupo;
  }
  if (carrera.evento) {
    const e = carrera.evento as Carrera['evento'] & { grupo?: string };
    if (e.id === 'cobro-favor' && e.grupo) e.quien = NOMBRE_GRUPO[e.grupo];
    delete e.grupo;
  }
  for (const fila of carrera.trayectoria) fila.poder = Math.min(fila.poder, 100);
  carrera.inicioPeriodo.poder = carrera.medidores.poder;
  return carrera;
}

/** Antes de juntar estadísticas: el Carisma pasa a la Fama y el Aguante al Territorio, sin sumar. */
function migrarDesde8(carrera: Carrera): Carrera {
  const atributos = carrera.atributos as Carrera['atributos'] & { carisma?: number; aguante?: number };
  delete atributos.carisma;
  delete atributos.aguante;
  // Las cartas de oratoria y del gimnasio ya no existen: pasan a sus parecidas.
  const reemplazo: Record<string, string> = { oratoria: 'radio', acto: 'radio', gimnasio: 'timbreo' };
  for (const carta of carrera.cartas) carta.id = reemplazo[carta.id] ?? carta.id;
  // Las vacaciones ya no existen en la tienda.
  carrera.compras = carrera.compras.filter((c) => c.id !== 'descanso');
  carrera.version = 9;
  return carrera;
}
