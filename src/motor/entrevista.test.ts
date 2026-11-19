import { describe, expect, it } from 'vitest';
import { MEDIOS, buscarPregunta } from '../datos/entrevistas';
import { desgastePolitico, elegirCarta, nuevaCarrera } from './carrera';
import { calcularResultado, iniciarEntrevista, motivoSinEntrevista, responderEntrevista } from './entrevista';
import type { Carrera } from './tipos';

function carreraConPlata(semilla = 7): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', ideologia: { economia: 80, social: 0 } });
  c.medidores.caja = 100000;
  // Fama 30: sin premio ni castigo por cómo caés en cámara.
  c.medidores.fama = 30;
  return c;
}

/** El índice de la mejor o la peor respuesta de cada pregunta, sin contar la postura. */
function indicePor(c: Carrera, criterio: 'mejor' | 'peor'): number {
  const id = c.entrevista!.preguntas[c.entrevista!.respuestas.length];
  const puntos = buscarPregunta(id).respuestas.map((r) => r.puntos);
  const buscado = criterio === 'mejor' ? Math.max(...puntos) : Math.min(...puntos);
  return puntos.indexOf(buscado);
}

function jugar(c: Carrera, criterio: 'mejor' | 'peor' | 'callado'): Carrera {
  while (c.entrevista) c = responderEntrevista(c, criterio === 'callado' ? -1 : indicePor(c, criterio));
  return c;
}

describe('entrevista', () => {
  it('cobra el espacio y sortea preguntas distintas', () => {
    const c = iniciarEntrevista(carreraConPlata(), 'streaming');
    expect(c.medidores.caja).toBe(100000 - MEDIOS.streaming.costo);
    expect(c.entrevista!.preguntas).toHaveLength(MEDIOS.streaming.preguntas);
    expect(new Set(c.entrevista!.preguntas).size).toBe(MEDIOS.streaming.preguntas);
  });

  it('contestar bien suma fama y contestar mal resta', () => {
    const base = carreraConPlata();
    const bien = jugar(iniciarEntrevista(base, 'television'), 'mejor');
    const mal = jugar(iniciarEntrevista(base, 'television'), 'peor');
    expect(bien.medidores.fama).toBeGreaterThan(base.medidores.fama);
    expect(mal.medidores.fama).toBeLessThan(base.medidores.fama);
    expect(bien.entrevista).toBeUndefined();
    expect(bien.cambios?.fama).toBeGreaterThan(0);
  });

  it('quedarse callado es lo peor', () => {
    const base = carreraConPlata();
    const callado = jugar(iniciarEntrevista(base, 'radio'), 'callado');
    expect(callado.medidores.fama).toBeLessThan(base.medidores.fama);
    expect(callado.historial[0].lineas.at(-1)).toContain('Entrevista');
  });

  it('una sola entrevista por año, y el año no pasa en medio de una', () => {
    const c = iniciarEntrevista(carreraConPlata(), 'radio');
    expect(() => elegirCarta(c, 0)).toThrow();
    const terminada = jugar(c, 'mejor');
    expect(motivoSinEntrevista(terminada, 'radio')).toMatch(/este año/);
    expect(motivoSinEntrevista(elegirCarta(terminada, 0), 'radio')).toBeNull();
  });

  it('pide fama y plata', () => {
    const c = carreraConPlata();
    c.medidores.fama = 5;
    expect(motivoSinEntrevista(c, 'television')).toMatch(/Fama/);
    c.medidores.caja = 100;
    expect(motivoSinEntrevista(c, 'radio')).toMatch(/caja/);
  });

  it('contradecirte con lo que pensás resta', () => {
    const c = carreraConPlata();
    const entrevista = { medio: 'radio' as const, preguntas: ['estado-mercado'], respuestas: [0] };
    const coherente = calcularResultado(c, entrevista); // "Menos Estado" con un perfil liberal
    const contradiccion = calcularResultado(c, { ...entrevista, respuestas: [2] });
    expect(coherente.puntaje).toBeGreaterThan(contradiccion.puntaje);
    expect(contradiccion.extras.join(' ')).toMatch(/no van con lo que pensás/);
  });
});

describe('desgaste político', () => {
  it('no hay desgaste los primeros años y después se agrava', () => {
    expect(desgastePolitico(5).nivel).toBe('ninguno');
    expect(desgastePolitico(15).fama).toBeLessThan(0);
    expect(desgastePolitico(25).imagen).toBeLessThan(desgastePolitico(15).imagen);
    expect(desgastePolitico(40).nivel).toBe('total');
  });

  it('después de muchos años en política, la imagen y la fama bajan solas', () => {
    let c = carreraConPlata();
    c.anioInicio = c.anio - 30;
    c.medidores.imagen = 50;
    c.medidores.fama = 50;
    c = elegirCarta(
      c,
      c.cartas.findIndex((x) => x.id !== 'comedor' && x.id !== 'radio' && x.id !== 'redes'),
    );
    expect(c.historial[0].lineas.join(' ')).toMatch(/Desgaste fuerte/);
    expect(c.medidores.fama).toBeLessThanOrEqual(47);
  });
});
