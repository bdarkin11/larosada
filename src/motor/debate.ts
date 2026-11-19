import type { Ambito } from '../datos/cargos';
import { CARGOS } from '../datos/cargos';
import { LA_QUE_GANA, PREGUNTAS_DEBATE, TIPOS_RESPUESTA, buscarPreguntaDebate } from '../datos/debates';
import type { RespuestaDebate, TipoRespuestaDebate } from '../datos/debates';
import { entero } from './azar';
import type { EstadoAzar } from './azar';
import { UMBRAL_POSTURA } from './entrevista';
import { acotar } from './ficha';
import { bonoEntrevista } from './tienda';
import type { CargoId, Candidato, Carrera, DebateEnCurso, Ideologia } from './tipos';

/** Hay debate en las generales a gobernador y a presidente. */
export const CARGOS_CON_DEBATE: CargoId[] = ['gobernador', 'presidente'];
export const hayDebate = (cargo: CargoId) => CARGOS_CON_DEBATE.includes(cargo);

/** Lo más que puede mover el debate, para arriba o para abajo. */
export const TOPE_DEBATE = 10;
/** Lo que da no ir: un poco peor que un debate regular. */
export const AJUSTE_SIN_DEBATE = -2.5;
/** Con esta Fama o más, ves venir lo que te tiran. */
export const FAMA_PARA_PISTA = 40;
/** Fama que da ganar el debate, como mucho, según el cargo. */
const FAMA_POR_CARGO: Partial<Record<CargoId, number>> = { intendente: 2, gobernador: 3, presidente: 4 };

/** Segundos para contestar: más Fama, más aplomo. */
export const segundosDebate = (carrera: Carrera) => Math.min(16, 10 + Math.floor(carrera.medidores.fama / 15));
export const hayPista = (carrera: Carrera) => carrera.medidores.fama >= FAMA_PARA_PISTA;

/** Cuatro rondas, cinco para presidente. Arranca el moderador y después se alternan. */
export function armarDebate(azar: EstadoAzar, cargo: CargoId, candidatos: Candidato[]): DebateEnCurso {
  const ambito: Ambito = CARGOS[cargo].eleccion!.ambito;
  const rondas = cargo === 'presidente' ? 5 : 4;
  const posibles = PREGUNTAS_DEBATE.filter((p) => !p.ambitos || p.ambitos.includes(ambito));
  const serias = posibles.filter((p) => p.tipo === 'seria').map((p) => p.id);
  const chicanas = posibles.filter((p) => p.tipo === 'chicana').map((p) => p.id);
  const preguntas: string[] = [];
  const ordenes: number[][] = [];
  for (let i = 0; i < rondas; i++) {
    // Casi siempre se alternan, pero a veces el rival tira dos seguidas.
    const alterna = i % 2 === 1;
    const tocaChicana = i > 0 && (entero(azar, 0, 3) === 0 ? !alterna : alterna);
    const pila = tocaChicana && chicanas.length ? chicanas : serias;
    preguntas.push(...pila.splice(entero(azar, 0, pila.length - 1), 1));
    const orden = [0, 1, 2];
    for (let k = orden.length - 1; k > 0; k--) {
      const j = entero(azar, 0, k);
      [orden[k], orden[j]] = [orden[j], orden[k]];
    }
    ordenes.push(orden);
  }
  const rival = [...candidatos].filter((c) => !c.jugador).sort((a, b) => b.fuerza - a.fuerza)[0];
  return { rival: rival?.nombre ?? 'Tu rival', preguntas, ordenes, respuestas: [], candidatos };
}

/** La respuesta que elegiste en la ronda, con su tipo; undefined si te quedaste en blanco. */
export function respuestaElegida(
  debate: DebateEnCurso,
  ronda: number,
): { tipo: TipoRespuestaDebate; respuesta: RespuestaDebate } | undefined {
  const mostrada = debate.respuestas[ronda];
  if (mostrada === undefined || mostrada < 0) return undefined;
  const tipo = TIPOS_RESPUESTA[debate.ordenes[ronda][mostrada]];
  return { tipo, respuesta: buscarPreguntaDebate(debate.preguntas[ronda]).respuestas[tipo] };
}

/** Lo que vale una ronda: acertarle al tipo suma, errarle resta y la evasiva no mueve nada. */
export function puntosRonda(debate: DebateEnCurso, ronda: number, ideologia: Ideologia): number {
  const elegida = respuestaElegida(debate, ronda);
  if (!elegida) return -2;
  const pregunta = buscarPreguntaDebate(debate.preguntas[ronda]);
  let puntos = elegida.tipo === 'evasiva' ? 0 : elegida.tipo === LA_QUE_GANA[pregunta.tipo] ? 2 : -1;
  const postura = elegida.respuesta.postura;
  if (postura && Math.abs(ideologia[postura.eje]) >= UMBRAL_POSTURA) puntos += Math.sign(ideologia[postura.eje]) === postura.lado ? 1 : -1;
  return puntos;
}

export interface ResultadoDebate {
  /** Cuánta fuerza suma o resta en la general. */
  ajuste: number;
  fama: number;
  detalle: { pregunta: string; respuesta: string; puntos: number }[];
  extras: string[];
  veredicto: string;
}

/**
 * Del promedio por ronda (de −3 a +3) a la fuerza: medio punto por ronda da 0,
 * contestar todo con evasivas da −2 (apenas mejor que no ir) y acertar todo
 * con tus ideas da el tope.
 */
export function calcularDebate(carrera: Carrera, debate: DebateEnCurso, cargo: CargoId): ResultadoDebate {
  const detalle: ResultadoDebate['detalle'] = [];
  const extras: string[] = [];
  let total = 0;
  debate.preguntas.forEach((id, i) => {
    const puntos = puntosRonda(debate, i, carrera.ideologia);
    total += puntos;
    detalle.push({
      pregunta: buscarPreguntaDebate(id).texto,
      respuesta: respuestaElegida(debate, i)?.respuesta.texto ?? 'Te quedaste en blanco.',
      puntos,
    });
  });
  let ajuste = (total / debate.preguntas.length - 0.5) * 4;
  const bono = bonoEntrevista(carrera);
  if (bono) {
    ajuste += bono;
    extras.push('El coaching se notó: llegaste con las respuestas ensayadas.');
  }
  ajuste = Math.round(acotar(ajuste, -TOPE_DEBATE, TOPE_DEBATE) * 10) / 10;

  const tope = FAMA_POR_CARGO[cargo] ?? 2;
  const fama = ajuste > 0 ? Math.max(1, Math.round((ajuste / TOPE_DEBATE) * tope)) : ajuste <= -5 ? -1 : 0;
  const veredicto =
    ajuste >= 6
      ? 'Lo ganaste por afano. Mañana todos hablan de vos.'
      : ajuste >= 2
        ? 'Ganaste el debate.'
        : ajuste > -2
          ? 'Empate técnico: nadie se acuerda de nada.'
          : ajuste > -6
            ? 'Lo perdiste. Tu rival se llevó los mejores recortes.'
            : 'Un papelón. El recorte circula toda la semana.';
  return { ajuste, fama, detalle, extras, veredicto };
}
