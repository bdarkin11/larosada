import { beforeAll, describe, expect, it } from 'vitest';
import { nuevaCarrera } from './carrera';
import {
  elegirCampania,
  elegirCandidatura,
  fiscalizar,
  resolverInterna,
  saltearDebate,
  saltearFiscalizacion,
  REGLAS_FISCALIZACION,
} from './elecciones';

// La noche se fiscaliza siempre, aunque no esté peleada.
beforeAll(() => {
  REGLAS_FISCALIZACION.soloSiPeleada = false;
});
import {
  AJUSTE_SIN_FISCALIZAR,
  MEJOR_FISCALIZACION,
  OCUPADO_FISCAL,
  PEOR_FISCALIZACION,
  VIAJE_FISCAL,
  ajusteFiscalizacion,
  armarFiscalizacion,
  fiscalesDe,
  moverVotos,
  salvados,
} from './fiscalizacion';
import { enviosDeFiscal } from './pruebas-util';
import type { CargoId, Carrera, FiscalizacionEnCurso } from './tipos';

function enLaNoche(cargo: CargoId = 'concejal', semilla = 3): Carrera {
  let c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  Object.assign(c, { anio: 2031, edad: 45, construccion: 60, mejorRango: 4 });
  Object.assign(c.medidores, { fama: 80, caja: 1_000_000, imagen: 60 });
  Object.assign(c.atributos, { territorio: 70, gestion: 70, rosca: 90 });
  c.eleccion = { fase: 'candidatura' };
  c = elegirCandidatura(c, cargo);
  if (c.eleccion?.fase === 'interna') c = resolverInterna(c, 'romper');
  c = elegirCampania(c, 'normal');
  return c.eleccion?.fase === 'debate' ? saltearDebate(c) : c;
}

const tusVotos = (c: Carrera) => {
  const g = c.eleccion!.generales!;
  return g.votos[g.candidatos.findIndex((x) => x.jugador)];
};

/** Una noche a medida: un incidente, un fiscal. */
const noche = (plazo = 6): FiscalizacionEnCurso => ({
  mesas: 9,
  cubiertas: [],
  fiscales: 1,
  incidentes: [{ mesa: 0, tipo: 'acta', aparece: 5, plazo, peso: 1 }],
});

describe('cuándo se fiscaliza', () => {
  it('en toda general, después del debate y antes del escrutinio', () => {
    for (const cargo of ['concejal', 'intendente', 'presidente'] as const) {
      const c = enLaNoche(cargo);
      expect(c.eleccion!.fase).toBe('fiscalizacion');
      expect(c.eleccion!.generales).toBeDefined();
      expect(c.eleccion!.gano).toBeUndefined();
    }
  });

  it('la misma semilla arma la misma noche', () => {
    expect(enLaNoche('intendente', 9).eleccion!.fiscalizacion).toEqual(enLaNoche('intendente', 9).eleccion!.fiscalizacion);
  });

  it('más Construcción da más mesas con fiscal fijo, y un delfín leal suma un volante', () => {
    const c = enLaNoche();
    c.construccion = 10;
    const pocasMesas = armarFiscalizacion(c.azar, c, 'concejal').cubiertas.length;
    c.construccion = 90;
    expect(armarFiscalizacion(c.azar, c, 'concejal').cubiertas.length).toBeGreaterThan(pocasMesas);
    c.delfines = [];
    const sinDelfin = fiscalesDe(c);
    c.delfines = [{ nombre: 'Delfín', edad: 25, nivel: 30, lealtad: 90, desde: 2030 } as never];
    expect(fiscalesDe(c)).toBe(sinDelfin + 1);
  });

  it('si gobierna otro partido, hay más incidentes', () => {
    const c = enLaNoche();
    c.oficialismo = c.partido;
    const propio = armarFiscalizacion(structuredClone(c.azar), c, 'concejal').incidentes.length;
    c.oficialismo = c.partido === 'libertad' ? 'frente-nacional' : 'libertad';
    expect(armarFiscalizacion(structuredClone(c.azar), c, 'concejal').incidentes.length).toBeGreaterThan(propio);
  });
});

describe('los fiscales', () => {
  it('llegar a tiempo salva el incidente', () => {
    expect(salvados(noche(), [{ incidente: 0, segundo: 5 + 6 - VIAJE_FISCAL }])).toEqual([true]);
    expect(salvados(noche(), [{ incidente: 0, segundo: 5 + 6 - VIAJE_FISCAL + 0.1 }])).toEqual([false]);
  });

  it('no se puede mandar antes de que salte, ni dos veces', () => {
    expect(salvados(noche(), [{ incidente: 0, segundo: 4 }])).toEqual([false]);
    const f = noche();
    f.incidentes.push({ ...f.incidentes[0], mesa: 1 });
    f.fiscales = 2;
    expect(
      salvados(f, [
        { incidente: 0, segundo: 5 },
        { incidente: 0, segundo: 6 },
      ]),
    ).toEqual([true, false]);
  });

  it('un fiscal ocupado no puede ir a otro lado', () => {
    const f = noche();
    f.incidentes.push({ ...f.incidentes[0], mesa: 1 });
    expect(
      salvados(f, [
        { incidente: 0, segundo: 5 },
        { incidente: 1, segundo: 5 + OCUPADO_FISCAL - 1 },
      ]),
    ).toEqual([true, false]);
    f.incidentes[1].plazo = 9;
    expect(
      salvados(f, [
        { incidente: 0, segundo: 5 },
        { incidente: 1, segundo: 5 + OCUPADO_FISCAL },
      ]),
    ).toEqual([true, true]);
  });

  it('va de −6 si no salvás nada a +4 si salvás todo', () => {
    expect(ajusteFiscalizacion(noche(), [])).toBe(PEOR_FISCALIZACION);
    expect(ajusteFiscalizacion(noche(), [{ incidente: 0, segundo: 5 }])).toBe(MEJOR_FISCALIZACION);
  });
});

describe('cuánto pesa', () => {
  const promedio = (reaccion: number, urgentes = false) => {
    let suma = 0;
    for (let s = 0; s < 60; s++) {
      const f = enLaNoche('intendente', s).eleccion!.fiscalizacion!;
      suma += ajusteFiscalizacion(f, enviosDeFiscal(f, reaccion, urgentes));
    }
    return suma / 60;
  };

  it('jugarla regular rinde más o menos como no jugarla', () => {
    expect(Math.abs(promedio(2) - AJUSTE_SIN_FISCALIZAR)).toBeLessThan(1.5);
  });

  it('jugarla bien suma, y no hacer nada es lo peor', () => {
    expect(promedio(0.5, true)).toBeGreaterThan(promedio(2) + 1);
    expect(promedio(99)).toBe(PEOR_FISCALIZACION);
  });
});

describe('los votos', () => {
  it('lo que ganás se lo sacás a los rivales, y siguen sumando 100', () => {
    const v = moverVotos([40, 35, 25], 0, 3);
    expect(v[0]).toBe(43);
    expect(v.reduce((s, x) => s + x, 0)).toBeCloseTo(100, 5);
    expect(v[1]).toBeLessThan(35);
  });

  it('fiscalizar bien sube tu porcentaje; saltearlo lo baja un poco', () => {
    const antes = enLaNoche('intendente');
    const bien = fiscalizar(antes, enviosDeFiscal(antes.eleccion!.fiscalizacion!, 0.5, true));
    const sin = saltearFiscalizacion(antes);
    expect(tusVotos(bien)).toBeGreaterThan(tusVotos(sin));
    expect(tusVotos(sin)).toBeCloseTo(tusVotos(antes) + AJUSTE_SIN_FISCALIZAR, 1);
    expect(sin.eleccion!.fase).toBe('escrutinio');
    expect(typeof sin.eleccion!.gano).toBe('boolean');
    expect(sin.eleccion!.fiscalizacion).toBeUndefined();
  });

  it('dar vuelta la elección en las mesas va al palmarés', () => {
    const antes = enLaNoche('intendente');
    const g = antes.eleccion!.generales!;
    const tuyo = g.candidatos.findIndex((x) => x.jugador);
    // Perdías por un punto: 40 contra 41.
    g.votos = g.votos.map((_, i) => (i === tuyo ? 40 : i === (tuyo + 1) % g.votos.length ? 41 : 0));
    g.votos[(tuyo + 2) % g.votos.length] += 19;
    const sin = saltearFiscalizacion(antes);
    const bien = fiscalizar(antes, enviosDeFiscal(antes.eleccion!.fiscalizacion!, 0, true));
    expect(sin.eleccion!.gano).toBe(false);
    expect(bien.eleccion!.gano).toBe(true);
    expect(bien.palmares.some((l) => l.texto.startsWith('La ganaste en las mesas'))).toBe(true);
  });
});
