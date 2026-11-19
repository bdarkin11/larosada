import { CARGOS } from '../datos/cargos';
import { PARTIDOS } from '../datos/partidos';
import { ATRIBUTOS, ETAPAS, MEDIDORES } from './tipos';
import type { Atributo, CargoId, Carrera, EtapaId, Foto, Medidor, MotivoFin, RegistroHistorico } from './tipos';

/** Lo básico para mover números: atributos y medidores. */
export type Ficha = Pick<Carrera, 'atributos' | 'medidores'>;

export const NOMBRE_ATRIBUTO: Record<Atributo, string> = {
  rosca: 'Rosca',
  territorio: 'Territorio',
  gestion: 'Gestión',
};

export const NOMBRE_MEDIDOR: Record<Medidor, string> = {
  fama: 'Fama',
  imagen: 'Imagen',
  caja: 'Caja',
  causas: 'Causas',
  poder: 'Poder',
};

export const acotar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));

export function textoCantidad(clave: Atributo | Medidor, cantidad: number): string {
  if (cantidad === 0) return '0';
  const signo = cantidad > 0 ? '+' : '−';
  const absoluto = Math.abs(cantidad);
  return clave === 'caja' ? `${signo}US$ ${absoluto.toLocaleString('es-AR')}` : `${signo}${absoluto}`;
}

export function nombreDe(clave: Atributo | Medidor): string {
  return clave in NOMBRE_ATRIBUTO ? NOMBRE_ATRIBUTO[clave as Atributo] : NOMBRE_MEDIDOR[clave as Medidor];
}

/** "Fama +2, Causas −3": para el historial. */
export const textoEfectos = (efectos: Partial<Record<Atributo | Medidor, number>>) =>
  Object.entries(efectos)
    .map(([clave, cantidad]) => `${nombreDe(clave as Atributo | Medidor)} ${textoCantidad(clave as Atributo | Medidor, cantidad!)}`)
    .join(', ');

/** Suma líneas a la entrada del año en curso, o abre una nueva. */
export function anotar(carrera: Carrera, lineas: string[]) {
  const ultima = carrera.historial[0];
  if (ultima && ultima.anio === carrera.anio) ultima.lineas.push(...lineas);
  else carrera.historial.unshift({ anio: carrera.anio, edad: carrera.edad, lineas: [...lineas] });
}

/** Cuánto se movió cada número entre dos momentos de la carrera. */
export function diferencias(antes: Ficha, despues: Ficha): Partial<Record<Atributo | Medidor, number>> {
  const cambios: Partial<Record<Atributo | Medidor, number>> = {};
  for (const a of ATRIBUTOS) {
    const d = despues.atributos[a] - antes.atributos[a];
    if (d) cambios[a] = d;
  }
  for (const m of MEDIDORES) {
    const d = despues.medidores[m] - antes.medidores[m];
    if (d) cambios[m] = d;
  }
  return cambios;
}

/** Si subir este número es bueno para vos. Las causas son lo único que conviene bajar. */
export const esBueno = (clave: Atributo | Medidor, cantidad: number) => (clave === 'causas' ? cantidad < 0 : cantidad > 0);

export function aplicar(carrera: Ficha, clave: Atributo | Medidor, cantidad: number) {
  if ((ATRIBUTOS as readonly string[]).includes(clave)) {
    const atributo = clave as Atributo;
    carrera.atributos[atributo] = acotar(carrera.atributos[atributo] + cantidad, 1, 99);
  } else if (clave === 'caja') {
    carrera.medidores.caja += cantidad;
  } else {
    const medidor = clave as Exclude<Medidor, 'caja'>;
    carrera.medidores[medidor] = acotar(carrera.medidores[medidor] + cantidad, 0, 100);
  }
}

export function aplicarEfectos(carrera: Ficha, efectos: Partial<Record<Atributo | Medidor, number>>) {
  for (const [clave, cantidad] of Object.entries(efectos)) aplicar(carrera, clave as Atributo | Medidor, cantidad!);
}

/**
 * Rendimientos decrecientes: subir lo que tenés bajo rinde más que subir lo
 * que ya tenés alto, y perder cuando estás arriba duele más. Para Imagen,
 * Fama, Poder y Construcción.
 */
export function conRendimiento(actual: number, base: number): number {
  if (!base) return 0;
  const factor = base > 0 ? acotar((110 - actual) / 60, 0.3, 1.5) : acotar((actual + 30) / 80, 0.4, 1.5);
  const real = Math.round(base * factor);
  return real === 0 ? Math.sign(base) : real;
}

/** Los números que tienen rendimientos decrecientes. */
export const CON_RENDIMIENTO = ['imagen', 'fama', 'poder'] as const;

export const foto = (carrera: Carrera): Foto => ({
  poder: carrera.medidores.poder,
  fama: carrera.medidores.fama,
  imagen: carrera.medidores.imagen,
  caja: carrera.medidores.caja,
  construccion: carrera.construccion,
});

/* Construcción política */

export const ETAPA: Record<EtapaId, { nombre: string; desde: number; descripcion: string }> = {
  desconocido: { nombre: 'Desconocido', desde: 0, descripcion: 'Fuera de tu cuadra, nadie sabe quién sos.' },
  conocido: { nombre: 'Conocido', desde: 20, descripcion: 'En el barrio te saludan y te piden cosas.' },
  referente: { nombre: 'Referente', desde: 40, descripcion: 'Cuando hay un problema, te llaman a vos.' },
  caudillo: { nombre: 'Caudillo', desde: 60, descripcion: 'Movés gente. Sin vos, en tu distrito no se gana.' },
  procer: { nombre: 'Prócer', desde: 80, descripcion: 'Tu nombre ya es parte de la historia del lugar.' },
};

export function etapaDe(construccion: number): EtapaId {
  return [...ETAPAS].reverse().find((e) => construccion >= ETAPA[e].desde)!;
}

export function siguienteEtapa(construccion: number): EtapaId | null {
  return ETAPAS.find((e) => ETAPA[e].desde > construccion) ?? null;
}

type Contador = 'mandatosPresidente' | 'crisisSuperadas' | 'promesasCumplidas';

/** Anota algo para el Poder Histórico: suma uno a un contador o agrega una nota a una lista. */
export function anotarHistorico(carrera: Carrera, clave: Contador | 'paisNotas' | 'distritoNotas', nota?: number) {
  carrera.historico ??= {};
  const h: Partial<RegistroHistorico> = carrera.historico;
  if (clave === 'paisNotas' || clave === 'distritoNotas') h[clave] = [...(h[clave] ?? []), nota ?? 0];
  else h[clave] = (h[clave] ?? 0) + 1;
}

/** Se termina la carrera: queda el motivo y se cierra todo lo pendiente. */
export function terminar(carrera: Carrera, motivo: MotivoFin) {
  carrera.fin = { motivo, anio: carrera.anio, edad: carrera.edad };
  carrera.cartas = [];
  delete carrera.pases;
  delete carrera.entrevista;
  delete carrera.eleccion;
  delete carrera.evento;
  delete carrera.cola;
}

export function registrarLogro(carrera: Carrera, icono: string, texto: string) {
  carrera.palmares.push({ anio: carrera.anio, icono, texto });
}

/** Desde acá, crecer en construcción cuesta cada vez más. */
export const CONSTRUCCION_DIFICIL = 50;
/** Arriba de Caudillo, si no te quieren, crecés a la mitad. */
export const IMAGEN_PARA_CRECER = 55;

/**
 * Lo que rinde de verdad una suba de construcción: arriba de 50 cuesta cada
 * vez más, y arriba de Caudillo, si la gente no te quiere, la mitad. Las
 * bajas no cambian.
 */
export function construccionReal(carrera: Carrera, cantidad: number): number {
  if (cantidad <= 0 || carrera.construccion < CONSTRUCCION_DIFICIL) return cantidad;
  let factor = (110 - carrera.construccion) / 60;
  if (carrera.construccion >= ETAPA.caudillo.desde && carrera.medidores.imagen < IMAGEN_PARA_CRECER) factor /= 2;
  return Math.floor(cantidad * factor);
}

/** Mueve la construcción. Si subís de etapa, se festeja y queda en el palmarés. */
export function moverConstruccion(carrera: Carrera, cantidad: number) {
  const antes = etapaDe(carrera.construccion);
  carrera.construccion = acotar(carrera.construccion + cantidad, 0, 100);
  const despues = etapaDe(carrera.construccion);
  if (ETAPAS.indexOf(despues) > ETAPAS.indexOf(antes)) {
    // Va a la bitácora y al palmarés: sin pantalla de festejo, para que la partida corra.
    anotar(carrera, [`⭐ Construcción política: ahora sos ${ETAPA[despues].nombre}.`]);
    registrarLogro(carrera, '⭐', `Llegaste a ${ETAPA[despues].nombre}`);
  }
}

/** Cambia el cargo. Si es un ascenso (o lo ganaste en las urnas), hay jura. */
export function cambiarCargo(carrera: Carrera, cargo: CargoId, electo = false) {
  if (cargo === carrera.cargo && !electo) return;
  const asciende = CARGOS[cargo].rango > CARGOS[carrera.cargo].rango;
  carrera.cargo = cargo;
  carrera.mejorRango = Math.max(carrera.mejorRango ?? 0, CARGOS[cargo].rango);
  if (!CARGOS[cargo].eleccion) {
    delete carrera.mandatoHasta;
    carrera.mandatosSeguidos = 0;
  }
  if (asciende || electo) {
    carrera.pendientes.push({ tipo: 'jura', cargo, partido: carrera.partido });
    if (!electo) registrarLogro(carrera, '🏛️', `Asumiste como ${CARGOS[cargo].nombre} (${PARTIDOS[carrera.partido].corto})`);
  }
}
