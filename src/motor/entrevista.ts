import { MEDIOS, PREGUNTAS, buscarPregunta } from '../datos/entrevistas';
import type { Respuesta } from '../datos/entrevistas';
import { presencia } from '../datos/valor';
import { entero } from './azar';
import { anotar, diferencias, enElCentroDelPoder, textoCantidad } from './carrera';
import { registrarLogro } from './ficha';
import { bonoEntrevista } from './tienda';
import type { Carrera, EntrevistaEnCurso, Ideologia, MedioId } from './tipos';

/** Desde dónde una postura cuenta como tuya: lo mismo que separa "de centro" del resto. */
export const UMBRAL_POSTURA = 34;

export function motivoSinEntrevista(carrera: Carrera, medio: MedioId): string | null {
  const m = MEDIOS[medio];
  if (carrera.fin || carrera.detencion) return 'No es momento de entrevistas.';
  if (carrera.entrevista) return 'Ya estás en una entrevista.';
  if (carrera.pases) return 'Primero decidí en el cierre de listas.';
  if (carrera.eleccion) return 'Estás en plena elección.';
  if (carrera.evento) return 'Primero resolvé lo que está pasando.';
  if (carrera.ultimaEntrevista === carrera.anio) return 'Ya diste una entrevista este año.';
  if (carrera.medidores.fama < m.famaMinima) return `Necesitás ${m.famaMinima} de Fama para que te den este espacio.`;
  if (carrera.medidores.caja < m.costo) return 'No te alcanza la caja.';
  return null;
}

/** Pagás el espacio y se sortean las preguntas. */
export function iniciarEntrevista(anterior: Carrera, medio: MedioId): Carrera {
  const motivo = motivoSinEntrevista(anterior, medio);
  if (motivo) throw new Error(motivo);
  const carrera = structuredClone(anterior);
  const disponibles = PREGUNTAS.map((p) => p.id);
  const preguntas: string[] = [];
  while (preguntas.length < MEDIOS[medio].preguntas) {
    preguntas.push(...disponibles.splice(entero(carrera.azar, 0, disponibles.length - 1), 1));
  }
  carrera.medidores.caja -= MEDIOS[medio].costo;
  carrera.cambios = { caja: -MEDIOS[medio].costo };
  carrera.ultimaEntrevista = carrera.anio;
  carrera.entrevista = { medio, preguntas, respuestas: [] };
  return carrera;
}

/** Qué tan bien cayó una respuesta, con lo que pensás y lo que dijiste. */
export function puntajeRespuesta(
  respuesta: Respuesta | undefined,
  ideologia: Ideologia,
): {
  puntos: number;
  coherencia: number;
} {
  if (!respuesta) return { puntos: -2, coherencia: 0 };
  let coherencia = 0;
  if (respuesta.postura) {
    const tuya = ideologia[respuesta.postura.eje];
    if (Math.abs(tuya) >= UMBRAL_POSTURA) coherencia = Math.sign(tuya) === respuesta.postura.lado ? 1 : -1;
  }
  return { puntos: respuesta.puntos, coherencia };
}

export interface ResultadoEntrevista {
  puntaje: number;
  fama: number;
  imagen: number;
  /** Una línea por pregunta, para mostrar al final. */
  detalle: { pregunta: string; respuesta: string; puntos: number }[];
  extras: string[];
  veredicto: string;
}

export function calcularResultado(carrera: Carrera, entrevista: EntrevistaEnCurso): ResultadoEntrevista {
  const medio = MEDIOS[entrevista.medio];
  const detalle: ResultadoEntrevista['detalle'] = [];
  const extras: string[] = [];
  let puntaje = 0;
  let imagen = 0;
  let contradicciones = 0;

  entrevista.preguntas.forEach((id, i) => {
    const pregunta = buscarPregunta(id);
    const respuesta = pregunta.respuestas[entrevista.respuestas[i]];
    const { puntos, coherencia } = puntajeRespuesta(respuesta, carrera.ideologia);
    if (coherencia < 0) contradicciones++;
    puntaje += puntos + coherencia;
    imagen += respuesta?.imagen ?? 0;
    detalle.push({
      pregunta: pregunta.texto,
      respuesta: respuesta ? respuesta.texto : 'Te quedaste en blanco.',
      puntos: puntos + coherencia,
    });
  });

  if (contradicciones)
    extras.push(`Dijiste cosas que no van con lo que pensás (${contradicciones === 1 ? 'una vez' : `${contradicciones} veces`}).`);
  if (presencia(carrera) >= 60) {
    puntaje += 1;
    extras.push('Tu fama ayudó: la cámara te quiere.');
  } else if (presencia(carrera) < 25) {
    puntaje -= 1;
    extras.push('Con poca fama, se te notaron los nervios.');
  }

  const bono = bonoEntrevista(carrera);
  if (bono) {
    puntaje += bono;
    extras.push('Tu encuestador te dijo qué quería escuchar la gente.');
  }

  let fama = medio.base + Math.round(puntaje * medio.multiplicador);
  if (fama > 0 && !enElCentroDelPoder(carrera)) {
    fama = Math.ceil(fama / 2);
    extras.push('Desde el interior, la entrevista llegó a menos gente.');
  }

  const porPregunta = puntaje / entrevista.preguntas.length;
  const veredicto =
    porPregunta >= 1.5
      ? 'La rompiste. Te recortan en todos lados.'
      : porPregunta >= 0.8
        ? 'Saliste muy bien parado.'
        : porPregunta >= 0.2
          ? 'Una entrevista correcta, sin brillo.'
          : porPregunta > -0.5
            ? 'Floja. Nadie la va a recordar, por suerte.'
            : 'Un desastre. El recorte circula toda la semana.';

  return { puntaje, fama, imagen, detalle, extras, veredicto };
}

/** Contestás la pregunta que toca. Con la última, se cierra la entrevista y se aplica el resultado. */
export function responderEntrevista(anterior: Carrera, indice: number): Carrera {
  const enCurso = anterior.entrevista;
  if (!enCurso) throw new Error('No hay ninguna entrevista en curso');
  const carrera = structuredClone(anterior);
  const entrevista = carrera.entrevista!;
  const pregunta = buscarPregunta(entrevista.preguntas[entrevista.respuestas.length]);
  entrevista.respuestas.push(indice >= 0 && indice < pregunta.respuestas.length ? indice : -1);
  if (entrevista.respuestas.length < entrevista.preguntas.length) return carrera;

  // Antes del pago, para que las flechas muestren todo lo que movió la entrevista.
  const antes = structuredClone(carrera);
  antes.medidores.caja += MEDIOS[entrevista.medio].costo;

  const resultado = calcularResultado(carrera, entrevista);
  const m = carrera.medidores;
  m.fama = Math.min(100, Math.max(0, m.fama + resultado.fama));
  m.imagen = Math.min(100, Math.max(0, m.imagen + resultado.imagen));
  delete carrera.entrevista;

  const efectos = [`Fama ${textoCantidad('fama', resultado.fama)}`];
  if (resultado.imagen) efectos.push(`Imagen ${textoCantidad('imagen', resultado.imagen)}`);
  efectos.push(textoCantidad('caja', -MEDIOS[entrevista.medio].costo));
  anotar(carrera, [`Entrevista en ${MEDIOS[entrevista.medio].nombre}: ${resultado.veredicto} (${efectos.join(', ')}).`]);
  if (resultado.puntaje / entrevista.preguntas.length >= 0.8) {
    registrarLogro(carrera, '🎙️', `Gran entrevista en ${MEDIOS[entrevista.medio].nombre}`);
  }
  carrera.cambios = diferencias(antes, carrera);
  return carrera;
}
