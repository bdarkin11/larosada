import type { Atributos, CargoId } from '../motor/tipos';

export type Ambito = 'municipal' | 'provincial' | 'nacional';

/** Cómo se gana una banca o un sillón. */
export type FormaDeGanar =
  /** Ejecutivo: gana el primero (el presidente, con las reglas del balotaje). */
  | { tipo: 'primero' }
  /** Lista proporcional: entrás si tu lista pasa este porcentaje. */
  | { tipo: 'umbral'; porcentaje: number }
  /** Senado: dos bancas para el primero, una para el segundo. */
  | { tipo: 'dos-primeros' };

export interface Eleccion {
  ambito: Ambito;
  /** Años de mandato. */
  duracion: number;
  /** Los ejecutivos solo se votan cada cuatro años (2027, 2031...). */
  ejecutivo: boolean;
  forma: FormaDeGanar;
  /** Lo mínimo para que te dejen ser candidato. */
  fama: number;
  construccion: number;
  /** Escalón al que tenés que haber llegado antes. */
  rangoPrevio: number;
  /** Fuerza típica de los rivales. */
  nivelRivales: number;
  /** Cuántos rivales de otros partidos. */
  rivales: number;
  /** Lo que cuesta una campaña normal; la fuerte cuesta el triple. */
  costoCampania: number;
  /** Electores, para el contador de la urna. */
  votantes: number;
}

export interface DefCargo {
  nombre: string;
  /** Lo que entra por año, en dólares (sueldo, aportes, changas). */
  ingresoAnual: number;
  /** Con fueros, una orden de detención necesita antes el desafuero. */
  fueros: boolean;
  /** Escalón: sirve para saber si un cargo es un ascenso. */
  rango: number;
  /** Cargos designados: lo mínimo para que un partido te lo ofrezca. */
  requisitos: { construccion?: number } & Partial<Atributos>;
  descripcion: string;
  /** Solo los cargos electivos. */
  eleccion?: Eleccion;
}

export const CARGOS: Record<CargoId, DefCargo> = {
  militante: {
    nombre: 'Militante',
    ingresoAnual: 6000,
    fueros: false,
    rango: 0,
    requisitos: {},
    descripcion: 'Sin cargo: pura militancia.',
  },

  // Designados: los da un partido en el cierre de listas.
  asesor: {
    nombre: 'Asesor en el Concejo',
    ingresoAnual: 12000,
    fueros: false,
    rango: 1,
    requisitos: { construccion: 15, rosca: 30 },
    descripcion: 'Un despacho chico, un sueldo y acceso a cómo se votan las cosas.',
  },
  funcionario: {
    nombre: 'Director municipal',
    ingresoAnual: 20000,
    fueros: false,
    rango: 2,
    requisitos: { construccion: 30, gestion: 45 },
    descripcion: 'Un área del municipio a tu cargo: presupuesto y gente.',
  },
  secretario: {
    nombre: 'Secretario municipal',
    ingresoAnual: 30000,
    fueros: false,
    rango: 3,
    requisitos: { construccion: 50, gestion: 60, rosca: 50 },
    descripcion: 'Mano derecha del intendente. Te ven como candidato.',
  },

  // Electivos: se ganan en las urnas.
  concejal: {
    nombre: 'Concejal',
    ingresoAnual: 18000,
    fueros: false,
    rango: 2,
    requisitos: {},
    descripcion: 'Una banca en el Concejo Deliberante. Ordenanzas, comisiones y vecinos.',
    eleccion: {
      ambito: 'municipal',
      duracion: 4,
      ejecutivo: false,
      forma: { tipo: 'umbral', porcentaje: 25 },
      fama: 8,
      construccion: 15,
      rangoPrevio: 0,
      nivelRivales: 26,
      rivales: 3,
      costoCampania: 2000,
      votantes: 180_000,
    },
  },
  legislador: {
    nombre: 'Legislador provincial',
    ingresoAnual: 28000,
    fueros: true,
    rango: 3,
    requisitos: {},
    descripcion: 'Una banca en la Legislatura de tu provincia.',
    eleccion: {
      ambito: 'provincial',
      duracion: 4,
      ejecutivo: false,
      forma: { tipo: 'umbral', porcentaje: 26 },
      fama: 15,
      construccion: 25,
      rangoPrevio: 1,
      nivelRivales: 33,
      rivales: 3,
      costoCampania: 5000,
      votantes: 900_000,
    },
  },
  intendente: {
    nombre: 'Intendente',
    ingresoAnual: 40000,
    fueros: false,
    rango: 4,
    requisitos: {},
    descripcion: 'El municipio entero a tu cargo: la basura, las calles, la seguridad.',
    eleccion: {
      ambito: 'municipal',
      duracion: 4,
      ejecutivo: true,
      forma: { tipo: 'primero' },
      fama: 20,
      construccion: 35,
      rangoPrevio: 2,
      nivelRivales: 38,
      rivales: 2,
      costoCampania: 10000,
      votantes: 240_000,
    },
  },
  diputado: {
    nombre: 'Diputado nacional',
    ingresoAnual: 45000,
    fueros: true,
    rango: 4,
    requisitos: {},
    descripcion: 'Una banca en el Congreso. Tu voto vale para todo el país.',
    eleccion: {
      ambito: 'nacional',
      duracion: 4,
      ejecutivo: false,
      forma: { tipo: 'umbral', porcentaje: 26 },
      fama: 30,
      construccion: 30,
      rangoPrevio: 2,
      nivelRivales: 42,
      rivales: 3,
      costoCampania: 12000,
      votantes: 2_400_000,
    },
  },
  senador: {
    nombre: 'Senador nacional',
    ingresoAnual: 55000,
    fueros: true,
    rango: 5,
    requisitos: {},
    descripcion: 'Seis años en el Senado. Los gobernadores te necesitan.',
    eleccion: {
      ambito: 'nacional',
      duracion: 6,
      ejecutivo: false,
      forma: { tipo: 'dos-primeros' },
      fama: 40,
      construccion: 45,
      rangoPrevio: 3,
      nivelRivales: 48,
      rivales: 3,
      costoCampania: 20000,
      votantes: 2_400_000,
    },
  },
  gobernador: {
    nombre: 'Gobernador',
    ingresoAnual: 60000,
    fueros: true,
    rango: 5,
    requisitos: {},
    descripcion: 'Tu provincia, su presupuesto y su policía. Un trampolín a la Rosada.',
    eleccion: {
      ambito: 'provincial',
      duracion: 4,
      ejecutivo: true,
      forma: { tipo: 'primero' },
      fama: 45,
      construccion: 55,
      rangoPrevio: 4,
      nivelRivales: 50,
      rivales: 2,
      costoCampania: 40000,
      votantes: 2_400_000,
    },
  },
  presidente: {
    nombre: 'Presidente de la Nación',
    ingresoAnual: 80000,
    fueros: true,
    rango: 6,
    requisitos: {},
    descripcion: 'La Casa Rosada. Todo el país te mira.',
    eleccion: {
      ambito: 'nacional',
      duracion: 4,
      ejecutivo: true,
      forma: { tipo: 'primero' },
      fama: 30,
      construccion: 45,
      rangoPrevio: 4,
      nivelRivales: 22,
      rivales: 3,
      costoCampania: 100000,
      votantes: 27_000_000,
    },
  },
};

/** Lo que cuesta vivir y hacer política por año, en dólares. */
export const GASTO_ANUAL = 4500;

/** Los cargos que se votan, de abajo hacia arriba. */
export const CARGOS_ELECTIVOS = (Object.keys(CARGOS) as CargoId[]).filter((id) => CARGOS[id].eleccion);
export const esElectivo = (id: CargoId) => !!CARGOS[id].eleccion;

/** Años de elecciones ejecutivas: 2027, 2031, 2035... */
export const esAnioEjecutivo = (anio: number) => (anio - 2027) % 4 === 0;

/** Presidente: una sola reelección seguida. */
export const MANDATOS_SEGUIDOS_PRESIDENTE = 2;
