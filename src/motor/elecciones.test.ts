import { describe, expect, it } from 'vitest';
import { CARGOS, esAnioEjecutivo } from '../datos/cargos';
import { elegirCarta, nuevaCarrera } from './carrera';
import { crearAzar } from './azar';
import {
  abrirEleccion,
  candidaturas,
  cerrarEleccion,
  elegirCampania,
  elegirCandidatura,
  ganaEnPrimeraVuelta,
  ganaste,
  repartirVotos,
  resolverInterna,
  saltearDebate,
  saltearFiscalizacion,
} from './elecciones';
import type { Carrera, ResultadoVotacion } from './tipos';

/** Una carrera fuerte, en 2031 (año de elecciones ejecutivas), lista para elegir candidatura. */
function enCampania(semilla = 3): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  Object.assign(c, { anio: 2031, edad: 45, construccion: 70, mejorRango: 4 });
  Object.assign(c.medidores, { fama: 80, caja: 1_000_000, imagen: 60 });
  Object.assign(c.atributos, { territorio: 70, gestion: 70, rosca: 90 });
  c.eleccion = { fase: 'candidatura' };
  return c;
}

/** Lleva una candidatura hasta el escrutinio: lapicera si hay interna, campaña normal. */
function votar(c: Carrera, cargo: Parameters<typeof elegirCandidatura>[1]): Carrera {
  c = elegirCandidatura(c, cargo);
  if (c.eleccion?.fase === 'interna') c = resolverInterna(c, 'romper');
  c = elegirCampania(c, 'normal');
  if (c.eleccion?.fase === 'debate') c = saltearDebate(c);
  return c.eleccion?.fase === 'fiscalizacion' ? saltearFiscalizacion(c) : c;
}

describe('calendario y candidaturas', () => {
  it('hay elecciones en los años impares; los ejecutivos, cada cuatro', () => {
    expect(esAnioEjecutivo(2027)).toBe(true);
    expect(esAnioEjecutivo(2029)).toBe(false);
    expect(esAnioEjecutivo(2031)).toBe(true);
    const c = enCampania();
    c.anio = 2029;
    expect(candidaturas(c).some((x) => x.cargo === 'presidente')).toBe(false);
    expect(candidaturas(enCampania()).some((x) => x.cargo === 'presidente')).toBe(true);
  });

  it('a los 18, sin fama ni construcción, no hay elección para vos', () => {
    const c = nuevaCarrera({ semilla: 1 });
    c.anio = 2029;
    expect(abrirEleccion(c)).toBe(false);
  });

  it('los cargos altos piden experiencia', () => {
    const c = enCampania();
    c.mejorRango = 0;
    const presi = candidaturas(c).find((x) => x.cargo === 'presidente')!;
    expect(presi.motivo).toMatch(/experiencia/);
    expect(candidaturas(c).find((x) => x.cargo === 'concejal')!.motivo).toBeNull();
  });

  it('no te podés presentar al cargo que ya tenés con mandato vigente', () => {
    const c = enCampania();
    c.cargo = 'senador';
    c.mandatoHasta = 2035;
    expect(candidaturas(c).find((x) => x.cargo === 'senador')!.motivo).toMatch(/hasta 2035/);
  });

  it('no presentarse cierra la elección sin cambiar nada', () => {
    const c = elegirCandidatura(enCampania(), null);
    expect(c.eleccion).toBeUndefined();
    expect(() => elegirCarta(c, 0)).not.toThrow();
  });

  it('con una elección abierta no pasa el año', () => {
    expect(() => elegirCarta(enCampania(), 0)).toThrow();
  });
});

describe('votos y reglas', () => {
  it('los votos suman 100 y el más fuerte suele sacar más', () => {
    const azar = crearAzar(5);
    let ganaFuerte = 0;
    for (let i = 0; i < 200; i++) {
      const votos = repartirVotos(azar, [70, 40, 35]);
      expect(votos.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 5);
      if (votos[0] === Math.max(...votos)) ganaFuerte++;
    }
    expect(ganaFuerte).toBeGreaterThan(170);
  });

  it('balotaje: gana en primera con 45 %, o con 40 % y diez de ventaja', () => {
    expect(ganaEnPrimeraVuelta([46, 30, 24])).toBe(true);
    expect(ganaEnPrimeraVuelta([41, 30, 29])).toBe(true);
    expect(ganaEnPrimeraVuelta([41, 35, 24])).toBe(false);
    expect(ganaEnPrimeraVuelta([38, 37, 25])).toBe(false);
  });

  it('cada cargo se gana a su manera', () => {
    const r = (votos: number[]): ResultadoVotacion => ({
      titulo: '',
      votantes: 1,
      votos,
      candidatos: votos.map((_, i) => ({ nombre: String(i), partido: 'libertad', fuerza: 1, jugador: i === 1 })),
    });
    // Concejal: entrás si tu lista pasa el umbral, aunque no salgas primero.
    expect(ganaste('concejal', r([40, 30, 30]))).toBe(true);
    expect(ganaste('concejal', r([60, 20, 20]))).toBe(false);
    // Senador: entran los dos primeros.
    expect(ganaste('senador', r([40, 35, 25]))).toBe(true);
    // Intendente: solo el primero.
    expect(ganaste('intendente', r([40, 35, 25]))).toBe(false);
  });
});

describe('de la candidatura a la jura', () => {
  it('ganar te da el cargo, el mandato y la jura; perder te deja donde estabas', () => {
    const resultados = new Set<boolean>();
    for (let semilla = 0; semilla < 40; semilla++) {
      const votada = votar(enCampania(semilla), 'intendente');
      expect(votada.eleccion!.fase).toBe('escrutinio');
      expect(votada.eleccion!.generales!.votos.reduce((s, v) => s + v, 0)).toBeCloseTo(100, 5);
      const final = cerrarEleccion(votada);
      resultados.add(!!votada.eleccion!.gano);
      expect(final.eleccion).toBeUndefined();
      if (votada.eleccion!.gano) {
        expect(final.cargo).toBe('intendente');
        expect(final.mandatoHasta).toBe(2035);
        expect(final.pendientes.some((p) => p.tipo === 'jura')).toBe(true);
      } else {
        expect(final.cargo).toBe('militante');
      }
    }
    expect(resultados).toEqual(new Set([true, false]));
  });

  it('la campaña cuesta plata', () => {
    const c = elegirCandidatura(enCampania(), 'concejal');
    const antes = c.eleccion!.fase === 'interna' ? resolverInterna(c, 'romper') : c;
    const despues = elegirCampania(antes, 'fuerte');
    // El mínimo del cargo, o el 20 % de la caja si es más.
    const esperado = Math.max(CARGOS.concejal.eleccion!.costoCampania * 3, Math.round((antes.medidores.caja * 0.2) / 100) * 100);
    expect(despues.medidores.caja).toBe(antes.medidores.caja - esperado);
  });

  it('en la presidencial, si nadie gana en primera vuelta, hay balotaje entre los dos primeros', () => {
    let vistos = 0;
    for (let semilla = 0; semilla < 60 && vistos < 3; semilla++) {
      const v = votar(enCampania(semilla), 'presidente');
      const e = v.eleccion!;
      if (ganaEnPrimeraVuelta(e.generales!.votos)) {
        expect(e.balotaje).toBeUndefined();
      } else {
        vistos++;
        expect(e.balotaje!.candidatos).toHaveLength(2);
        expect(e.gano).toBe(ganaste('presidente', e.balotaje!));
      }
    }
    expect(vistos).toBeGreaterThan(0);
  });

  it('el mandato se vence si no lo renovás', () => {
    let c = enCampania();
    c.eleccion = undefined;
    c.cargo = 'concejal';
    c.mandatoHasta = 2031;
    c = elegirCarta(c, 0);
    expect(c.cargo).toBe('militante');
    expect(c.historial.flatMap((h) => h.lineas).join(' ')).toMatch(/Terminó tu mandato/);
  });

  it('romper con el partido baja la construcción', () => {
    const c = enCampania();
    let x = elegirCandidatura(c, 'presidente');
    if (x.eleccion?.fase !== 'interna') return; // sin interna no hay nada que romper
    x = resolverInterna(x, 'romper');
    expect(x.construccion).toBeLessThan(c.construccion);
    expect(x.eleccion!.frentePropio).toBe(true);
  });
});
