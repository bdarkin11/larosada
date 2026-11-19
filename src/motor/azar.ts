/**
 * Azar con semilla (mulberry32). El estado vive dentro de la carrera, así
 * una misma semilla produce siempre la misma partida (Carrera del Día, Duelo).
 */
export interface EstadoAzar {
  s: number;
}

export function crearAzar(semilla: number): EstadoAzar {
  return { s: semilla >>> 0 };
}

/** Número entre 0 (incluido) y 1 (excluido). Avanza el estado. */
export function siguiente(azar: EstadoAzar): number {
  azar.s = (azar.s + 0x6d2b79f5) >>> 0;
  let t = azar.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Entero entre min y max, ambos incluidos. */
export function entero(azar: EstadoAzar, min: number, max: number): number {
  return min + Math.floor(siguiente(azar) * (max - min + 1));
}

export function chance(azar: EstadoAzar, probabilidad: number): boolean {
  return siguiente(azar) < probabilidad;
}

export function elegir<T>(azar: EstadoAzar, opciones: readonly T[]): T {
  return opciones[Math.floor(siguiente(azar) * opciones.length)];
}

/** Elige según pesos: una opción con el doble de peso sale el doble de veces. */
export function elegirPonderado<T extends string>(azar: EstadoAzar, pesos: Record<T, number>): T {
  const opciones = Object.entries(pesos) as [T, number][];
  const total = opciones.reduce((suma, [, peso]) => suma + peso, 0);
  let tirada = siguiente(azar) * total;
  for (const [opcion, peso] of opciones) {
    tirada -= peso;
    if (tirada < 0) return opcion;
  }
  return opciones[opciones.length - 1][0];
}

/** Ruido centrado en 0, entre -amplitud y +amplitud, más probable cerca de 0. */
export function ruido(azar: EstadoAzar, amplitud: number): number {
  return (siguiente(azar) + siguiente(azar) - 1) * amplitud;
}

export function semillaAleatoria(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
