import { CARGOS, CARGOS_ELECTIVOS, MANDATOS_SEGUIDOS_PRESIDENTE, esAnioEjecutivo } from '../datos/cargos';
import type { Ambito, Eleccion } from '../datos/cargos';
import { EDAD_RETIRO_PERSONAJES, PERSONAJES } from '../datos/personajes';
import { EDAD_CANDIDATO } from '../datos/formacion';
import type { Personaje } from '../datos/personajes';
import { delPartido, elPartido } from '../datos/partidos';
import { APELLIDOS, CENTRO_DEL_PODER, NOMBRES } from '../datos/provincias';
import { chance, crearAzar, elegir, entero, siguiente } from './azar';
import type { EstadoAzar } from './azar';
import {
  acotar,
  anotar,
  anotarHistorico,
  aplicar,
  cambiarCargo,
  construccionReal,
  diferencias,
  moverConstruccion,
  registrarLogro,
} from './ficha';
import { PUNTOS_POR_FAVOR, apoyoDelPoder, cobrarFavores, favoresACobrar } from './poder';
import { armarCongreso } from './congreso';
import { AJUSTE_SIN_DEBATE, armarDebate, calcularDebate, hayDebate } from './debate';
import { AJUSTE_SIN_FISCALIZAR, ajusteFiscalizacion, armarFiscalizacion, moverVotos, salvados } from './fiscalizacion';
import { entregarDistrito, recibirDistrito } from './distrito';
import { entregarPais, recibirPais } from './pais';
import { ajustesDeHistoria, asumirPromesas, cerrarPromesas, fuerzaDePromesa, motivoSinPromesas, romperPromesas } from './promesas';
import { tiene } from './tienda';
import { PARTIDOS_IDS } from './tipos';
import type { CargoId, Carrera, Candidato, EnvioFiscal, NivelCampania, OpcionInterna, PartidoId, ResultadoVotacion } from './tipos';

/** Hay elecciones cada cuatro años, y se vota todo junto: bancas y ejecutivos. */
export const esAnioElectoral = (anio: number) => esAnioEjecutivo(anio);

/** Cuánto pesa cada cosa según dónde se vota: en el barrio, el territorio; en el país, la fama. */
const PESOS: Record<Ambito, { fama: number; territorio: number; construccion: number }> = {
  municipal: { fama: 0.3, territorio: 0.35, construccion: 0.35 },
  provincial: { fama: 0.45, territorio: 0.25, construccion: 0.3 },
  nacional: { fama: 0.5, territorio: 0.1, construccion: 0.2 },
};

/** El piso de votos que pone cada sello. */
export const PESO_PARTIDO: Record<PartidoId, number> = {
  'frente-nacional': 6,
  'union-republicana': 5,
  libertad: 5,
  'coalicion-centro': 2,
  'bloque-izquierda': -4,
};

const PESO_FRENTE_PROPIO = -4;

/**
 * Lo que cuesta cada campaña: el mínimo del cargo por el multiplicador, o un
 * porcentaje de tu caja (de la negra, en la campaña negra), lo que sea más.
 */
export const CAMPANIA: Record<
  NivelCampania,
  { nombre: string; descripcion: string; multiplicador: number; porcentaje: number; fuerza: number }
> = {
  austera: {
    nombre: 'Campaña austera',
    descripcion: 'Timbreo, redes y voluntarios. No gastás nada.',
    multiplicador: 0,
    porcentaje: 0,
    fuerza: 0,
  },
  normal: { nombre: 'Campaña normal', descripcion: 'Afiches, actos y algo de publicidad.', multiplicador: 1, porcentaje: 0.08, fuerza: 4 },
  fuerte: {
    nombre: 'Campaña fuerte',
    descripcion: 'Spots en todos lados, caravanas y un cierre a lo grande.',
    multiplicador: 3,
    porcentaje: 0.2,
    fuerza: 8,
  },
  negra: {
    nombre: 'Campaña con plata negra',
    descripcion: 'Micros, punteros y aparato pagados por debajo de la mesa. Rinde más que la fuerte, pero deja rastro.',
    multiplicador: 2,
    porcentaje: 0.3,
    fuerza: 10,
  },
};

/** Causas que suma una campaña pagada en negro. */
export const CAUSAS_CAMPANIA_NEGRA = 6;

/** Por qué no podés elegir ese nivel de campaña, o null. */
export function motivoSinCampania(carrera: Carrera, cargo: CargoId, nivel: NivelCampania): string | null {
  const costo = costoCampania(carrera, cargo, nivel);
  if (nivel === 'negra') {
    if (carrera.estilo === 'idealista') return 'Tu estilo idealista no te deja.';
    return carrera.cajaNegra >= costo ? null : 'No te alcanza la caja negra.';
  }
  return carrera.medidores.caja >= costo ? null : 'No te alcanza la caja.';
}

export function costoCampania(carrera: Carrera, cargo: CargoId, nivel: NivelCampania): number {
  const c = CAMPANIA[nivel];
  const base = nivel === 'negra' ? carrera.cajaNegra : carrera.medidores.caja;
  const proporcional = Math.round((c.porcentaje * Math.max(0, base)) / 100) * 100;
  return Math.max(CARGOS[cargo].eleccion!.costoCampania * c.multiplicador, proporcional);
}

const datos = (cargo: CargoId): Eleccion => CARGOS[cargo].eleccion!;

/** Dónde se vota ese cargo, para los textos: "Concejal en Salta", "Presidente de la Nación". */
export function nombreCargoEn(carrera: Carrera, cargo: CargoId): string {
  if (cargo === 'presidente') return CARGOS.presidente.nombre;
  const lugar = carrera.base;
  if (cargo === 'gobernador') return lugar === 'Ciudad de Buenos Aires' ? 'Jefe de Gobierno porteño' : `Gobernador de ${lugar}`;
  if (cargo === 'diputado' || cargo === 'senador' || cargo === 'legislador') return `${CARGOS[cargo].nombre} por ${lugar}`;
  return `${CARGOS[cargo].nombre} en ${lugar}`;
}

/** Qué tan fuerte llegás vos a la elección. */
export function fuerzaJugador(
  carrera: Carrera,
  cargo: CargoId,
  opciones: { campania?: NivelCampania; frentePropio?: boolean; promesas?: string[] } = {},
): number {
  const e = datos(cargo);
  const p = PESOS[e.ambito];
  const { atributos: a, medidores: m } = carrera;
  let fuerza = p.fama * m.fama + p.territorio * a.territorio + p.construccion * carrera.construccion;
  fuerza += (m.imagen - 50) * 0.3;
  fuerza += opciones.frentePropio ? PESO_FRENTE_PROPIO : PESO_PARTIDO[carrera.partido];
  fuerza += CAMPANIA[opciones.campania ?? 'austera'].fuerza;
  // El poder empuja o frena, y los favores que te deben se cobran en la campaña.
  fuerza += apoyoDelPoder(carrera);
  fuerza += favoresACobrar(carrera).length * PUNTOS_POR_FAVOR;
  // Tu historia: promesas rotas, decisiones contra tus ideas, la calle, la edad, haber sido presidente.
  for (const a of ajustesDeHistoria(carrera, cargo)) fuerza += a.valor;
  // Lo que prometés en esta campaña.
  for (const id of opciones.promesas ?? []) fuerza += fuerzaDePromesa(carrera, id);
  // Ir por la reelección: pesa cómo gestionaste.
  if (carrera.cargo === cargo) fuerza += 3 + (a.gestion - 50) * 0.15;
  // Para la Rosada, desde el interior cuesta más instalarte en todo el país.
  if (cargo === 'presidente' && !CENTRO_DEL_PODER.includes(carrera.base)) fuerza -= 6;
  return acotar(Math.round(fuerza), 1, 100);
}

/** La fuerza de un personaje del elenco: llegan con nombre hecho, pero también envejecen. */
export function fuerzaPersonaje(personaje: Personaje, cargo: CargoId, anio: number): number {
  const p = PESOS[datos(cargo).ambito];
  const a = personaje.atributos;
  let fuerza = p.fama * personaje.fama + p.territorio * a.territorio + p.construccion * a.territorio;
  fuerza = fuerza * 0.75 + PESO_PARTIDO[personaje.partido];
  if (anio - personaje.nacimiento > 70) fuerza *= 0.9;
  return acotar(Math.round(fuerza), 1, 100);
}

/** Los personajes del elenco que se presentan a ese cargo, en ese lugar y ese año. */
export function personajesEnCarrera(carrera: Carrera, cargo: CargoId): Personaje[] {
  return PERSONAJES.filter(
    (p) =>
      p.compite.includes(cargo) &&
      carrera.anio - p.nacimiento <= EDAD_RETIRO_PERSONAJES &&
      (!p.provincia || p.provincia === carrera.base || cargo === 'presidente'),
  );
}

/**
 * Un rival de la estructura. Si vos llegás fuerte, los otros partidos también
 * ponen a alguien mejor: la elección nunca es un trámite.
 */
function rivalGenerado(azar: EstadoAzar, cargo: CargoId, partido: PartidoId, referencia = 0): Candidato {
  const nivel = datos(cargo).nivelRivales;
  const base = nivel + Math.max(0, referencia - nivel) * AJUSTE_RIVALES;
  return {
    nombre: `${elegir(azar, NOMBRES)} ${elegir(azar, APELLIDOS)}`,
    partido,
    fuerza: acotar(Math.round(base + entero(azar, -8, 8) + PESO_PARTIDO[partido]), 1, 100),
  };
}

/** Cuánto de tu ventaja sobre el nivel del cargo achican los rivales. */
export const AJUSTE_RIVALES = 0.8;

const desdePersonaje = (p: Personaje, cargo: CargoId, anio: number): Candidato => ({
  nombre: p.nombre,
  apodo: p.apodo,
  partido: p.partido,
  fuerza: fuerzaPersonaje(p, cargo, anio),
});

/** Los rivales de otros partidos. En los cargos grandes, aparecen los del elenco. */
export function armarRivales(carrera: Carrera, cargo: CargoId, azar: EstadoAzar, partidoPropio: PartidoId | null): Candidato[] {
  const referencia = fuerzaJugador(carrera, cargo);
  const otros = PARTIDOS_IDS.filter((p) => p !== partidoPropio);
  const famosos = personajesEnCarrera(carrera, cargo).filter((p) => p.partido !== partidoPropio);
  const rivales: Candidato[] = [];
  const usados = new Set<PartidoId>();
  // Un personaje por partido, como mucho.
  for (const p of famosos) {
    if (rivales.length >= datos(cargo).rivales || usados.has(p.partido)) continue;
    rivales.push(desdePersonaje(p, cargo, carrera.anio));
    usados.add(p.partido);
  }
  const libres = otros.filter((p) => !usados.has(p));
  while (rivales.length < datos(cargo).rivales && libres.length) {
    const [partido] = libres.splice(entero(azar, 0, libres.length - 1), 1);
    rivales.push(rivalGenerado(azar, cargo, partido, referencia));
  }
  return rivales;
}

/** Qué tanto pesa ser más fuerte, y cuánto puede sorprender la campaña. */
export const EXPONENTE = 2.5;
export const VARIACION = 0.3;

/** Reparte los votos: cuanto más fuerte, más votos, con algo de azar. Devuelve porcentajes que suman 100. */
export function repartirVotos(azar: EstadoAzar, fuerzas: number[], variacion = VARIACION): number[] {
  const pesos = fuerzas.map((f) => Math.max(1, f) ** EXPONENTE * (1 + (siguiente(azar) * 2 - 1) * variacion));
  const total = pesos.reduce((s, p) => s + p, 0);
  const crudos = pesos.map((p) => (p / total) * 100);
  // Un decimal, y que sumen exactamente 100.
  const redondos = crudos.map((v) => Math.round(v * 10) / 10);
  const diferencia = Math.round((100 - redondos.reduce((s, v) => s + v, 0)) * 10) / 10;
  redondos[redondos.indexOf(Math.max(...redondos))] = Math.round((Math.max(...redondos) + diferencia) * 10) / 10;
  return redondos;
}

/** Primera vuelta presidencial: gana con 45 %, o con 40 % y diez puntos de ventaja. */
export function ganaEnPrimeraVuelta(votos: number[]): boolean {
  const orden = [...votos].sort((a, b) => b - a);
  return orden[0] >= 45 || (orden[0] >= 40 && orden[0] - orden[1] >= 10);
}

/** ¿Ganaste con ese resultado? */
export function ganaste(cargo: CargoId, resultado: ResultadoVotacion): boolean {
  const i = resultado.candidatos.findIndex((c) => c.jugador);
  const tuyos = resultado.votos[i];
  const puesto = [...resultado.votos].sort((a, b) => b - a).indexOf(tuyos) + 1;
  const forma = datos(cargo).forma;
  if (forma.tipo === 'umbral') return tuyos >= forma.porcentaje;
  if (forma.tipo === 'dos-primeros') return puesto <= 2;
  return puesto === 1;
}

/* Candidaturas */

export interface Candidatura {
  cargo: CargoId;
  motivo: string | null;
  /** Intención de voto estimada, de 0 a 100. */
  intencion: number;
  /** Chance estimada de ganar, de 0 a 1. */
  chance: number;
}

function motivoSinCandidatura(carrera: Carrera, cargo: CargoId): string | null {
  const e = datos(cargo);
  if (e.ejecutivo && !esAnioEjecutivo(carrera.anio)) return 'Este año no se vota: los ejecutivos se eligen cada cuatro años.';
  if (cargo === 'presidente' && carrera.cargo === 'presidente' && (carrera.mandatosSeguidos ?? 0) >= MANDATOS_SEGUIDOS_PRESIDENTE) {
    return 'Ya tuviste dos mandatos seguidos: la Constitución no deja un tercero.';
  }
  if (carrera.cargo === cargo && carrera.mandatoHasta !== undefined && carrera.mandatoHasta > carrera.anio) {
    return `Ya tenés este cargo hasta ${carrera.mandatoHasta}.`;
  }
  // Solo te presentás para subir. La única reelección es la del presidente.
  const reeleccion = cargo === 'presidente' && carrera.cargo === 'presidente';
  if (carrera.cargo !== 'militante' && !reeleccion && CARGOS[cargo].rango <= CARGOS[carrera.cargo].rango) {
    return 'Solo te presentás para subir de cargo.';
  }
  if (carrera.mejorRango < e.rangoPrevio) return 'Te falta experiencia: primero tenés que pasar por un cargo más chico.';
  if (carrera.medidores.fama < e.fama) return `Necesitás ${e.fama} de Fama.`;
  if (carrera.construccion < e.construccion) return `Necesitás ${e.construccion} de Construcción.`;
  if (carrera.edad < (cargo === 'presidente' || cargo === 'senador' ? 30 : 21)) return 'Todavía no tenés la edad que pide la ley.';
  return null;
}

/**
 * Pronóstico sin tocar el azar de la carrera: simula la elección muchas veces
 * con un azar aparte. Sirve para la encuesta.
 */
export function pronosticar(
  carrera: Carrera,
  cargo: CargoId,
  opciones: { campania?: NivelCampania; frentePropio?: boolean; rivales?: Candidato[]; promesas?: string[] } = {},
): { intencion: number; chance: number } {
  const azar = crearAzar((carrera.semilla * 31 + carrera.anio * 7 + cargo.length) >>> 0);
  const vos: Candidato = {
    nombre: carrera.nombre,
    partido: carrera.partido,
    fuerza: fuerzaJugador(carrera, cargo, opciones),
    jugador: true,
  };
  let ganadas = 0;
  let suma = 0;
  const veces = 60;
  for (let i = 0; i < veces; i++) {
    const rivales = opciones.rivales ?? armarRivales(carrera, cargo, azar, opciones.frentePropio ? null : carrera.partido);
    const candidatos = [vos, ...rivales];
    const votos = repartirVotos(
      azar,
      candidatos.map((c) => c.fuerza),
    );
    suma += votos[0];
    let resultado: ResultadoVotacion = { titulo: '', candidatos, votos, votantes: 0 };
    if (cargo === 'presidente' && !ganaEnPrimeraVuelta(votos)) resultado = balotaje(azar, resultado);
    if (ganaste(cargo, resultado)) ganadas++;
  }
  return { intencion: Math.round(suma / veces), chance: ganadas / veces };
}

export function candidaturas(carrera: Carrera): Candidatura[] {
  return CARGOS_ELECTIVOS.filter((cargo) => !datos(cargo).ejecutivo || esAnioEjecutivo(carrera.anio)).map((cargo) => {
    const motivo = motivoSinCandidatura(carrera, cargo);
    const { intencion, chance } = motivo ? { intencion: 0, chance: 0 } : pronosticar(carrera, cargo);
    return { cargo, motivo, intencion, chance };
  });
}

/** Cómo te ven las encuestas, si no tenés encuestador propio. */
export function sensacion(chance: number): string {
  if (chance >= 0.65) return 'Favorito';
  if (chance >= 0.4) return 'Competitivo';
  if (chance >= 0.15) return 'Difícil';
  return 'Muy difícil';
}

export const tieneEncuestador = (carrera: Carrera) => tiene(carrera, 'encuestador');

/** ¿Arranca una elección este año? Solo si hay algo a lo que te puedas presentar. */
export function abrirEleccion(carrera: Carrera): boolean {
  if (!esAnioElectoral(carrera.anio) || carrera.edad < EDAD_CANDIDATO) return false;
  return CARGOS_ELECTIVOS.some((cargo) => !motivoSinCandidatura(carrera, cargo));
}

/* Las fases */

function conEleccion(anterior: Carrera, fase: string): Carrera {
  if (!anterior.eleccion || anterior.eleccion.fase !== fase) throw new Error(`La elección no está en la fase ${fase}`);
  return structuredClone(anterior);
}

/** El rival de tu propio partido: un personaje del elenco si hay, o alguien de la estructura. */
function rivalInterno(carrera: Carrera, cargo: CargoId): Candidato | undefined {
  const famoso = personajesEnCarrera(carrera, cargo).find((p) => p.partido === carrera.partido);
  if (famoso) return desdePersonaje(famoso, cargo, carrera.anio);
  // Si vas por la reelección, nadie del partido te discute.
  if (carrera.cargo === cargo) return undefined;
  const probabilidad = 0.35 + CARGOS[cargo].rango * 0.08;
  if (!chance(carrera.azar, probabilidad)) return undefined;
  const r = rivalGenerado(carrera.azar, cargo, carrera.partido, fuerzaJugador(carrera, cargo));
  return { ...r, fuerza: acotar(r.fuerza - 4, 1, 100) };
}

/** Los cargos a los que te podés presentar este año. */
export const cargosPosibles = (carrera: Carrera): CargoId[] => CARGOS_ELECTIVOS.filter((cargo) => !motivoSinCandidatura(carrera, cargo));

/** Te bajás antes de que se vote: en la interna o en la campaña. */
export function bajarseDeLaEleccion(anterior: Carrera): Carrera {
  const fase = anterior.eleccion?.fase;
  if (fase !== 'interna' && fase !== 'campania' && fase !== 'candidatura') throw new Error('Ya no te podés bajar');
  const carrera = structuredClone(anterior);
  delete carrera.eleccion;
  anotar(carrera, ['Elecciones: este año no te presentaste.']);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Elegís a qué te presentás, o no te presentás. */
export function elegirCandidatura(anterior: Carrera, cargo: CargoId | null): Carrera {
  const carrera = conEleccion(anterior, 'candidatura');
  if (cargo === null) {
    delete carrera.eleccion;
    anotar(carrera, ['Elecciones: este año no te presentaste.']);
    return carrera;
  }
  const motivo = motivoSinCandidatura(carrera, cargo);
  if (motivo) throw new Error(motivo);
  const rival = rivalInterno(carrera, cargo);
  carrera.eleccion = { fase: rival ? 'interna' : 'campania', cargo, rivalInterno: rival };
  if (!rival)
    anotar(carrera, [`Elecciones: ${elPartido(carrera.partido)} te dio la lapicera para ${nombreCargoEn(carrera, cargo)}, sin interna.`]);
  return carrera;
}

/** Chance de que el partido te elija sin internas: rosca y construcción contra el peso del rival. */
export function chanceLapicera(carrera: Carrera): number {
  const rival = carrera.eleccion?.rivalInterno;
  if (!rival) return 1;
  return acotar(
    0.3 + (carrera.atributos.rosca - 50) / 100 + (carrera.construccion - rival.fuerza) / 100 + (carrera.medidores.poder - 30) / 200,
    0.05,
    0.9,
  );
}

/** Construcción que perdés si rompés con tu partido para ir por fuera. */
export const COSTO_ROMPER = 8;

export function resolverInterna(anterior: Carrera, opcion: OpcionInterna): Carrera {
  const carrera = conEleccion(anterior, 'interna');
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const rival = e.rivalInterno!;
  const nombre = rival.apodo ? `${rival.nombre}, "${rival.apodo}"` : rival.nombre;

  if (opcion === 'lapicera') {
    if (chance(carrera.azar, chanceLapicera(anterior))) {
      e.fase = 'campania';
      anotar(carrera, [`Interna: te ganaste la lapicera. ${nombre} se bajó.`]);
    } else {
      delete carrera.eleccion;
      anotar(carrera, [`Interna: el partido eligió a ${nombre}. Este año no sos candidato.`]);
    }
  } else if (opcion === 'paso') {
    const vos: Candidato = { nombre: carrera.nombre, partido: carrera.partido, fuerza: fuerzaJugador(carrera, cargo), jugador: true };
    const votos = repartirVotos(carrera.azar, [vos.fuerza, rival.fuerza], 0.2);
    e.paso = {
      titulo: `PASO ${delPartido(carrera.partido, true)}`,
      candidatos: [vos, rival],
      votos,
      votantes: Math.round(datos(cargo).votantes * 0.25),
    };
    if (votos[0] > votos[1]) {
      e.fase = 'campania';
      aplicar(carrera, 'fama', 2);
      anotar(carrera, [`PASO: le ganaste a ${nombre}, ${votos[0]} % a ${votos[1]} % (Fama +2).`]);
    } else {
      e.fase = 'escrutinio';
      e.gano = false;
      anotar(carrera, [`PASO: perdiste con ${nombre}, ${votos[0]} % a ${votos[1]} %. Este año no sos candidato.`]);
    }
  } else {
    e.fase = 'campania';
    e.frentePropio = true;
    moverConstruccion(carrera, -COSTO_ROMPER);
    aplicar(carrera, 'imagen', -2);
    anotar(carrera, [`Rompiste con ${elPartido(carrera.partido)} y armaste tu propio frente (Construcción −${COSTO_ROMPER}, Imagen −2).`]);
  }
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Los rivales que vas a enfrentar en la general. Se fijan con un azar propio del año, así la encuesta no cambia. */
export function rivalesDeLaGeneral(carrera: Carrera): Candidato[] {
  const e = carrera.eleccion!;
  const azar = crearAzar((carrera.semilla * 17 + carrera.anio) >>> 0);
  return armarRivales(carrera, e.cargo!, azar, e.frentePropio ? null : carrera.partido);
}

function balotaje(azar: EstadoAzar, primera: ResultadoVotacion): ResultadoVotacion {
  const orden = primera.votos.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
  const finalistas = [primera.candidatos[orden[0][1]], primera.candidatos[orden[1][1]]];
  // Los votos de los que quedaron afuera se reparten; el que salió primero arranca con ventaja.
  const fuerzas = [finalistas[0].fuerza + 3, finalistas[1].fuerza];
  return {
    titulo: 'Balotaje',
    candidatos: finalistas,
    votos: repartirVotos(azar, fuerzas, 0.15),
    votantes: Math.round(primera.votantes * 0.97),
  };
}

/** Elegís cuánto gastar y qué prometer, y se vota. El resultado queda listo para el escrutinio animado. */
export function elegirCampania(anterior: Carrera, nivel: NivelCampania, promesas: string[] = []): Carrera {
  const carrera = conEleccion(anterior, 'campania');
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const sinPromesas = motivoSinPromesas(cargo, promesas);
  if (sinPromesas) throw new Error(sinPromesas);
  e.promesas = promesas;
  const costo = costoCampania(anterior, cargo, nivel);
  const motivo = motivoSinCampania(carrera, cargo, nivel);
  if (motivo) throw new Error(motivo);
  if (nivel === 'negra') {
    carrera.cajaNegra -= costo;
    carrera.negroUsado = true;
    aplicar(carrera, 'causas', CAUSAS_CAMPANIA_NEGRA);
    anotar(carrera, romperPromesas(carrera, { coima: true }));
  } else {
    carrera.medidores.caja -= costo;
  }

  const vos: Candidato = {
    nombre: carrera.nombre,
    partido: carrera.partido,
    fuerza: fuerzaJugador(carrera, cargo, { campania: nivel, frentePropio: e.frentePropio, promesas }),
    jugador: true,
    frentePropio: e.frentePropio,
  };
  const candidatos = [vos, ...rivalesDeLaGeneral(anterior)];
  const cobrados = cobrarFavores(carrera);
  if (cobrados) anotar(carrera, [`Cobraste ${cobrados === 1 ? 'un favor' : `${cobrados} favores`} en la campaña.`]);
  if (costo) {
    anotar(carrera, [
      `${CAMPANIA[nivel].nombre} para ${nombreCargoEn(carrera, cargo)} (US$ ${costo.toLocaleString('es-AR')}${nivel === 'negra' ? ` en negro, Causas +${CAUSAS_CAMPANIA_NEGRA}` : ''}).`,
    ]);
  }
  if (hayDebate(cargo)) {
    e.debate = armarDebate(carrera.azar, cargo, candidatos);
    e.fase = 'debate';
  } else {
    votarGenerales(carrera, candidatos);
  }
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Se vota la general (y el balotaje, si hace falta). El resultado queda listo para el escrutinio animado. */
function votarGenerales(carrera: Carrera, candidatos: Candidato[]) {
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const votos = repartirVotos(
    carrera.azar,
    candidatos.map((c) => c.fuerza),
  );
  e.generales = {
    titulo: cargo === 'presidente' ? 'Primera vuelta' : 'Elecciones generales',
    candidatos,
    votos,
    votantes: datos(cargo).votantes,
  };
  // Solo se fiscaliza si está peleada: si la diferencia es clara, no hace falta.
  if (!REGLAS_FISCALIZACION.soloSiPeleada || estaPeleada(cargo, e.generales)) {
    e.fiscalizacion = armarFiscalizacion(carrera.azar, carrera, cargo);
    e.fase = 'fiscalizacion';
  } else {
    cerrarFiscalizacion(carrera, 0);
  }
}

/** Las pruebas la apagan para fiscalizar siempre. */
export const REGLAS_FISCALIZACION = { soloSiPeleada: true };

/** Diferencia, en puntos, por debajo de la cual la noche se fiscaliza. */
export const MARGEN_PELEADA = 6;

/** ¿Lo que define la elección está a menos de `MARGEN_PELEADA` puntos? */
export function estaPeleada(cargo: CargoId, r: ResultadoVotacion): boolean {
  const i = r.candidatos.findIndex((c) => c.jugador);
  const tuyos = r.votos[i];
  const otros = r.votos.filter((_, k) => k !== i).sort((a, b) => b - a);
  const forma = datos(cargo).forma;
  if (cargo === 'presidente') return Math.abs(tuyos - 45) < MARGEN_PELEADA || Math.abs(tuyos - otros[0]) < MARGEN_PELEADA;
  if (forma.tipo === 'umbral') return Math.abs(tuyos - forma.porcentaje) < MARGEN_PELEADA;
  if (forma.tipo === 'dos-primeros') return Math.abs(tuyos - (otros[1] ?? 0)) < MARGEN_PELEADA;
  return Math.abs(tuyos - otros[0]) < MARGEN_PELEADA;
}

/** Con los votos fiscalizados: balotaje si hace falta (con el mismo ajuste) y quién ganó. */
function definirGanador(carrera: Carrera, ajuste: number): boolean {
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const generales = e.generales!;
  const tuyo = generales.candidatos.findIndex((c) => c.jugador);
  generales.votos = moverVotos(generales.votos, tuyo, ajuste);
  let final = generales;
  delete e.balotaje;
  if (cargo === 'presidente' && !ganaEnPrimeraVuelta(generales.votos)) {
    e.balotaje = balotaje(carrera.azar, generales);
    const enBalotaje = e.balotaje.candidatos.findIndex((c) => c.jugador);
    if (enBalotaje >= 0) e.balotaje.votos = moverVotos(e.balotaje.votos, enBalotaje, ajuste);
    final = e.balotaje;
  }
  e.gano = ganaste(cargo, final);
  return e.gano;
}

/** Cierra la fiscalización con ese ajuste y deja todo listo para el escrutinio. */
function cerrarFiscalizacion(carrera: Carrera, ajuste: number) {
  const e = carrera.eleccion!;
  // Lo que habría pasado sin fiscalizar, con un azar aparte, para saber si la diste vuelta en las mesas.
  const sin = structuredClone(carrera);
  const ganabaSin = definirGanador(sin, 0);
  const gano = definirGanador(carrera, ajuste);
  if (e.fiscalizacion) e.ajusteFiscalizacion = ajuste;
  delete e.fiscalizacion;
  e.fase = 'escrutinio';
  if (gano && !ganabaSin) registrarLogro(carrera, '🗳️', `La ganaste en las mesas: ${nombreCargoEn(carrera, e.cargo!)}`);
}

const puntos = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${String(Math.abs(x)).replace('.', ',')}`;

/** Termina la noche: con los envíos de fiscales que hiciste, se ajustan los votos. */
export function fiscalizar(anterior: Carrera, envios: EnvioFiscal[]): Carrera {
  const carrera = conEleccion(anterior, 'fiscalizacion');
  const f = carrera.eleccion!.fiscalizacion!;
  const ajuste = ajusteFiscalizacion(f, envios);
  const ok = salvados(f, envios).filter(Boolean).length;
  anotar(carrera, [`Fiscalizaste las mesas: salvaste ${ok} de ${f.incidentes.length} incidentes (${puntos(ajuste)} puntos de votos).`]);
  cerrarFiscalizacion(carrera, ajuste);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** No fiscalizás vos: lo hace el aparato del partido, y se pierden algunos votos. */
export function saltearFiscalizacion(anterior: Carrera): Carrera {
  const carrera = conEleccion(anterior, 'fiscalizacion');
  anotar(carrera, [`La fiscalización la hizo el aparato del partido (${puntos(AJUSTE_SIN_FISCALIZAR)} puntos de votos).`]);
  cerrarFiscalizacion(carrera, AJUSTE_SIN_FISCALIZAR);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Tu fuerza más lo que dio el debate, y se vota. */
function votarConDebate(carrera: Carrera, ajuste: number) {
  const e = carrera.eleccion!;
  const candidatos = e.debate!.candidatos.map((c) => (c.jugador ? { ...c, fuerza: acotar(c.fuerza + ajuste, 1, 100) } : c));
  e.ajusteDebate = ajuste;
  delete e.debate;
  votarGenerales(carrera, candidatos);
}

const conSigno = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${String(Math.abs(x)).replace('.', ',')}`;

/** Contestás la ronda que toca. Con la última se cierra el debate y se vota. */
export function responderDebate(anterior: Carrera, indice: number): Carrera {
  const carrera = conEleccion(anterior, 'debate');
  const e = carrera.eleccion!;
  const debate = e.debate!;
  debate.respuestas.push(indice >= 0 && indice <= 2 ? indice : -1);
  if (debate.respuestas.length < debate.preguntas.length) return carrera;

  const r = calcularDebate(carrera, debate, e.cargo!);
  aplicar(carrera, 'fama', r.fama);
  const fama = r.fama ? `, Fama ${r.fama > 0 ? '+' : '−'}${Math.abs(r.fama)}` : '';
  anotar(carrera, [`Debate con ${debate.rival}: ${r.veredicto} (Fuerza ${conSigno(r.ajuste)}${fama}).`]);
  if (r.ajuste >= 5) registrarLogro(carrera, '🎤', `Ganaste el debate a ${nombreCargoEn(carrera, e.cargo!)}`);
  votarConDebate(carrera, r.ajuste);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** No vas: lo resuelve el equipo, y rinde un poco peor que un debate regular. */
export function saltearDebate(anterior: Carrera): Carrera {
  const carrera = conEleccion(anterior, 'debate');
  anotar(carrera, [`No fuiste al debate. Tu equipo salió a explicar la silla vacía (Fuerza ${conSigno(AJUSTE_SIN_DEBATE)}).`]);
  votarConDebate(carrera, AJUSTE_SIN_DEBATE);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Después del escrutinio: asumís o volvés al llano. */
export function cerrarEleccion(anterior: Carrera): Carrera {
  const carrera = conEleccion(anterior, 'escrutinio');
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  delete carrera.eleccion;

  // Perdiste en la PASO: no hubo general.
  if (!e.generales) {
    carrera.cambios = diferencias(anterior, carrera);
    return carrera;
  }
  const final = e.balotaje ?? e.generales;
  const i = final.candidatos.findIndex((c) => c.jugador);
  const tuyos = final.votos[i];

  if (e.gano) {
    const reeleccion = carrera.cargo === cargo;
    const primeraVez = !carrera.palmares.some((l) => l.texto.startsWith(`Ganaste: ${CARGOS[cargo].nombre}`));
    // Las promesas del mandato que termina se revisan antes de asumir el nuevo.
    const balance: string[] = [];
    cerrarPromesas(carrera, balance);
    // Si dejás una intendencia o una provincia por otro cargo, la entregás.
    if (carrera.distrito && carrera.distrito.cargo !== cargo) entregarDistrito(carrera, balance);
    if (balance.length) anotar(carrera, balance);
    // Reelecto presidente: el mandato que termina cuenta como completo.
    if (reeleccion && cargo === 'presidente') anotarHistorico(carrera, 'mandatosPresidente');
    carrera.mandatosSeguidos = reeleccion ? (carrera.mandatosSeguidos ?? 1) + 1 : 1;
    cambiarCargo(carrera, cargo, true);
    carrera.mandatoHasta = carrera.anio + datos(cargo).duracion;
    asumirPromesas(carrera, e.promesas ?? [], cargo, carrera.mandatoHasta);
    // Llegar a la Rosada: heredás el país como está.
    if (cargo === 'presidente' && !reeleccion) recibirPais(carrera);
    // Y el Congreso que te dejó la elección.
    if (cargo === 'presidente') armarCongreso(carrera, tuyos);
    // Intendencia o provincia: heredás las cuentas y la gestión como están.
    if ((cargo === 'intendente' || cargo === 'gobernador') && !carrera.distrito) recibirDistrito(carrera);
    aplicar(carrera, 'fama', 3 + CARGOS[cargo].rango);
    moverConstruccion(carrera, construccionReal(carrera, 3));
    anotar(carrera, [
      `${reeleccion ? '¡Reelecto!' : '¡Ganaste!'} ${nombreCargoEn(carrera, cargo)} con el ${tuyos} %${e.balotaje ? ' en el balotaje' : ''}. Mandato hasta ${carrera.mandatoHasta}.`,
    ]);
    if (primeraVez) registrarLogro(carrera, '🗳️', `Ganaste: ${CARGOS[cargo].nombre}`);
    if (cargo === 'presidente' && primeraVez) registrarLogro(carrera, '🇦🇷', 'Llegaste a la Casa Rosada');
    if (reeleccion) registrarLogro(carrera, '🔁', `Reelecto: ${CARGOS[cargo].nombre}`);
  } else {
    aplicar(carrera, 'fama', tuyos >= 20 ? 2 : 1);
    anotar(carrera, [
      `Perdiste la elección a ${nombreCargoEn(carrera, cargo)}: sacaste el ${tuyos} %${e.balotaje ? ' en el balotaje' : ''}.`,
    ]);
  }
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Al terminar el año: si se te venció el mandato y no lo renovaste, volvés al llano. */
export function vencerMandato(carrera: Carrera, lineas: string[]) {
  if (carrera.mandatoHasta === undefined || carrera.anio < carrera.mandatoHasta) return;
  lineas.push(`Terminó tu mandato de ${CARGOS[carrera.cargo].nombre}. Volvés al llano.`);
  cerrarPromesas(carrera, lineas);
  if (carrera.cargo === 'presidente') {
    entregarPais(carrera, lineas);
    delete carrera.congreso;
    if (carrera.crisis?.length) lineas.push('Dejaste el país en plena crisis: eso también queda en tu historia.');
    delete carrera.crisis;
    carrera.expresidente = carrera.anio;
    registrarLogro(carrera, '🏛️', 'Ex presidente de la Nación');
    anotarHistorico(carrera, 'mandatosPresidente');
    lineas.push('Dejaste la Rosada. Ahora sos ex presidente: todo te va a costar más.');
  }
  entregarDistrito(carrera, lineas);
  carrera.cargo = 'militante';
  delete carrera.mandatoHasta;
  carrera.mandatosSeguidos = 0;
}
