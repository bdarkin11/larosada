import type { Atributo, Medidor } from '../motor/tipos';

/**
 * Cuánto vale cada cosa, en "puntos": la escala común para comparar peras con
 * manzanas (ver docs/propuesta-balance.md, sección 1.3). La usan la prueba de
 * equilibrio de los eventos y los precios de la tienda.
 */
export const VALOR_POR_UNIDAD: Record<Exclude<Atributo | Medidor, 'caja'>, number> = {
  imagen: 1,
  fama: 1,
  poder: 1,
  territorio: 1.3,
  gestion: 0.6,
  rosca: 0.5,
  causas: -0.6,
};

/**
 * La Fama hace de lo que antes era el Carisma: cómo caés en público. Se corre
 * 20 puntos porque la Fama suele estar más baja (ver docs/propuesta-estadisticas.md).
 */
export const presencia = (c: { medidores: { fama: number } }) => Math.min(100, Math.max(0, c.medidores.fama + 20));

export const VALOR_CONSTRUCCION = 1.5;
/** Un favor anotado en la libreta, a favor o en contra. */
export const VALOR_FAVOR = 2;
/** Conservar las manos limpias: los carpetazos no prenden. */
export const VALOR_MANOS_LIMPIAS = 2;
/** El rastro que deja cada coima: un piso de causas que no se borra. */
export const VALOR_RASTRO = -1;
/** 10 % de tu caja vale 3 puntos. */
export const PUNTOS_POR_CAJA = 30;
/** La plata negra vale un poco menos que la blanca: no se puede usar en todo. */
export const VALOR_NEGRA = 0.8;
export const VALOR_PROCESO = { retroceder: 4, archivar: 8, avanzar: -4, detencion: -12 } as const;

/** El país, mientras sos presidente: 10 puntos de inflación valen −1. */
export const VALOR_PAIS = { inflacion: -0.1, actividad: 0.3, reservas: 0.2 } as const;
/** Salir de una crisis: Poder +5 y te ahorrás lo que cuesta cada año que sigue abierta. */
export const VALOR_SALIDA_CRISIS = 8;
/** Que se termine la carrera antes de tiempo: lo peor que te puede pasar. */
export const VALOR_FIN = -40;
/** Cuentas y Gestión de tu intendencia o provincia: la Gestión se ve y pesa en las elecciones. */
export const VALOR_DISTRITO = { cuentas: 0.2, gestion: 0.3 } as const;
/** Tu delfín: su lealtad, cuánto crece y que gane una banca. */
export const VALOR_DELFIN = { lealtad: 0.1, nivel: 0.15, cargo: 2 } as const;
/** Bronca en la calle. */
export const VALOR_MALESTAR = -0.1;

/** Lo que vale cada punto en la tienda, en dólares. El precio de una mejora sale de lo que da. */
export const DOLARES_POR_PUNTO = 3000;
/** Cuántos años de uso se cuentan para el equipo, que dura toda la carrera. */
export const ANIOS_EQUIPO = 8;
