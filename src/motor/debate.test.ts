import { beforeAll, describe, expect, it } from 'vitest';
import { PREGUNTAS_DEBATE, TIPOS_RESPUESTA } from '../datos/debates';
import { nuevaCarrera } from './carrera';
import { AJUSTE_SIN_DEBATE, calcularDebate, segundosDebate } from './debate';
import { elegirCampania, elegirCandidatura, resolverInterna, saltearDebate, REGLAS_FISCALIZACION } from './elecciones';

// La noche se fiscaliza siempre, aunque no esté peleada.
beforeAll(() => {
  REGLAS_FISCALIZACION.soloSiPeleada = false;
});
import { debatir } from './pruebas-util';
import type { CargoId, Carrera } from './tipos';

function enDebate(cargo: CargoId = 'gobernador', semilla = 3): Carrera {
  let c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  Object.assign(c, { anio: 2031, edad: 45, construccion: 70, mejorRango: 4 });
  Object.assign(c.medidores, { fama: 80, caja: 1_000_000, imagen: 60 });
  Object.assign(c.atributos, { territorio: 70, gestion: 70, rosca: 90 });
  // Sin ideas fuertes: las posturas no suman ni restan.
  c.ideologia = { economia: 0, social: 0 };
  c.eleccion = { fase: 'candidatura' };
  c = elegirCandidatura(c, cargo);
  if (c.eleccion?.fase === 'interna') c = resolverInterna(c, 'romper');
  return elegirCampania(c, 'normal');
}

const ajuste = (c: Carrera) => c.eleccion!.ajusteDebate!;
const tuFuerza = (c: Carrera) => c.eleccion!.generales!.candidatos.find((x) => x.jugador)!.fuerza;

describe('cuándo hay debate', () => {
  it('en las generales a gobernador y presidente', () => {
    for (const cargo of ['gobernador', 'presidente'] as const) {
      expect(enDebate(cargo).eleccion!.fase).toBe('debate');
    }
  });

  it('no en las listas: un concejal va directo a votarse', () => {
    expect(enDebate('concejal').eleccion!.fase).toBe('fiscalizacion');
  });

  it('cuatro rondas sin repetir, cinco para presidente', () => {
    for (let semilla = 0; semilla < 30; semilla++) {
      for (const [cargo, rondas] of [
        ['gobernador', 4],
        ['presidente', 5],
      ] as const) {
        const d = enDebate(cargo, semilla).eleccion!.debate!;
        expect(d.preguntas).toHaveLength(rondas);
        expect(new Set(d.preguntas).size).toBe(rondas);
      }
    }
  });
});

describe('cómo se puntúa', () => {
  it('leer bien lo que te tiran suma mucho', () => {
    const c = debatir(enDebate(), () => 'bien');
    expect(ajuste(c)).toBe(6);
    expect(c.eleccion!.fase).toBe('fiscalizacion');
  });

  it('ser coherente con tus ideas lleva al tope', () => {
    const c = enDebate();
    const d = c.eleccion!.debate!;
    d.preguntas = ['empleo', 'impuestos', 'inflacion-pais'];
    d.ordenes = [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ];
    c.ideologia = { economia: 80, social: 0 };
    expect(calcularDebate(c, { ...d, respuestas: [0, 0, 0] }, 'intendente').ajuste).toBe(10);
  });

  it('contestar lo que no era resta, y quedarse en blanco es lo peor', () => {
    expect(ajuste(debatir(enDebate(), () => 'mal'))).toBe(-6);
    expect(ajuste(debatir(enDebate(), () => 'blanco'))).toBe(-10);
  });

  it('las evasivas rinden apenas más que no ir', () => {
    expect(ajuste(debatir(enDebate(), () => 'evasiva'))).toBe(-2);
    expect(AJUSTE_SIN_DEBATE).toBe(-2.5);
  });

  it('un debate regular (una bien, una evasiva, una mal) queda cerca de cero', () => {
    const a = ajuste(debatir(enDebate(), (r) => (['bien', 'evasiva', 'mal'] as const)[r % 3]));
    expect(Math.abs(a)).toBeLessThanOrEqual(1);
  });

  it('si te contradecís, pierde lo que ganaba', () => {
    const c = enDebate();
    const d = c.eleccion!.debate!;
    d.preguntas = ['empleo'];
    d.ordenes = [[0, 1, 2]];
    c.ideologia = { economia: -80, social: 0 };
    // Una propuesta de mercado con ideas estatistas: 2 − 1 = 1 punto.
    expect(calcularDebate(c, { ...d, respuestas: [0] }, 'intendente').ajuste).toBe(2);
  });
});

describe('qué deja', () => {
  it('mueve tu fuerza en la general, en los dos sentidos', () => {
    const base = enDebate().eleccion!.debate!.candidatos.find((x) => x.jugador)!.fuerza;
    expect(tuFuerza(debatir(enDebate(), () => 'bien'))).toBe(base + 6);
    expect(tuFuerza(debatir(enDebate(), () => 'blanco'))).toBe(base - 10);
    expect(tuFuerza(saltearDebate(enDebate()))).toBe(base - 2.5);
  });

  it('ganarlo da fama y va al palmarés', () => {
    const antes = enDebate('presidente');
    const c = debatir(antes, () => 'bien');
    expect(c.medidores.fama).toBeGreaterThan(antes.medidores.fama);
    expect(c.palmares.some((l) => l.texto.startsWith('Ganaste el debate'))).toBe(true);
  });

  it('saltearlo no da fama ni logro, y se anota', () => {
    const antes = enDebate();
    const c = saltearDebate(antes);
    expect(c.medidores.fama).toBe(antes.medidores.fama);
    expect(c.palmares).toHaveLength(antes.palmares.length);
    expect(c.historial[0].lineas.join(' ')).toContain('silla vacía');
  });

  it('la misma semilla da el mismo debate', () => {
    expect(enDebate('gobernador', 9).eleccion!.debate).toEqual(enDebate('gobernador', 9).eleccion!.debate);
  });
});

describe('la Fama ayuda', () => {
  it('con más Fama hay más segundos', () => {
    const c = enDebate();
    c.medidores.fama = 0;
    const poco = segundosDebate(c);
    c.medidores.fama = 90;
    expect(segundosDebate(c)).toBeGreaterThan(poco);
  });
});

describe('las preguntas', () => {
  it('son unas treinta, sin ids repetidos', () => {
    expect(PREGUNTAS_DEBATE.length).toBeGreaterThanOrEqual(30);
    expect(new Set(PREGUNTAS_DEBATE.map((p) => p.id)).size).toBe(PREGUNTAS_DEBATE.length);
  });

  it('todas tienen los tres tipos de respuesta', () => {
    for (const p of PREGUNTAS_DEBATE) for (const t of TIPOS_RESPUESTA) expect(p.respuestas[t].texto.length).toBeGreaterThan(0);
  });

  it('las evasivas no toman partido', () => {
    for (const p of PREGUNTAS_DEBATE) expect(p.respuestas.evasiva.postura).toBeUndefined();
  });

  it('nadie acusa de un delito: el rival puede ser una persona real', () => {
    const delitos = /coima|corrup|\bcana\b|\bpreso|choreo|robaste|ladr[oó]n|lavado|narco|causa judicial/i;
    for (const p of PREGUNTAS_DEBATE) {
      expect(p.texto).not.toMatch(delitos);
      for (const t of TIPOS_RESPUESTA) expect(p.respuestas[t].texto).not.toMatch(delitos);
    }
  });
});
