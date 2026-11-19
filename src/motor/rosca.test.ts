import { describe, expect, it } from 'vitest';
import { LEYES, MAYORIA_DIPUTADOS, MAYORIA_SENADO, chanceLey, chanceSinRosca } from '../datos/leyes';
import { nuevaCarrera } from './carrera';
import { motivoOpcion, resolverEvento } from './eventos';
import { roscar } from './pruebas-util';
import {
  COSTO_CARGO,
  alternarBloque,
  armarRosca,
  conteoRosca,
  fichasDeRosca,
  fichasLibres,
  iniciarRosca,
  motivoSinBloque,
  saltearRosca,
  votarRosca,
} from './rosca';
import type { BloqueRosca, Carrera, PedidoRosca } from './tipos';

function presidente(semilla = 3, diputados = 105, senadores = 30): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  Object.assign(c, { cargo: 'presidente', congreso: { diputados, senadores } });
  Object.assign(c.medidores, { caja: 500_000, poder: 60 });
  c.atributos.rosca = 60;
  c.evento = { id: 'ley-emergencia', nombre: 'Alguien', semillaRetrato: 1 };
  return c;
}

/** Con los votos asegurados: aunque el bloque falte, sale. */
function conVotos(): Carrera {
  const c = presidente(3, MAYORIA_DIPUTADOS, MAYORIA_SENADO);
  const pais = { inflacion: 60, actividad: 50, reservas: 50 };
  c.pais = { ...pais, recibido: pais };
  return c;
}

/** Una mesa a medida: un solo bloque que da justo lo que pide la prueba. */
function conBloque(c: Carrera, pide: PedidoRosca, parcial: Partial<BloqueRosca> = {}): Carrera {
  const x = structuredClone(c);
  x.rosca = {
    fichas: 10,
    arreglados: [0],
    bloques: [{ nombre: 'Bloque de prueba', diputados: 60, senadores: 20, costo: 1, pide, ...parcial }],
  };
  return x;
}

describe('cuándo se puede rosquear', () => {
  it('sin mayoría propia, el botón está', () => {
    expect(motivoOpcion(presidente(), 1)).toBeNull();
  });

  it('con mayoría propia no hace falta', () => {
    const c = presidente(3, MAYORIA_DIPUTADOS, MAYORIA_SENADO);
    expect(motivoOpcion(c, 1)).toMatch(/mayoría/);
    expect(() => iniciarRosca(c)).toThrow(/mayoría/);
  });

  it('mandarla sin rosca y sin mayoría resta 10 puntos; con mayoría, no', () => {
    const sin = presidente();
    expect(chanceSinRosca(sin, 0)).toBeCloseTo(chanceLey(sin, 0) - 0.1, 5);
    const con = presidente(3, 140, 40);
    expect(chanceSinRosca(con, 0)).toBeCloseTo(chanceLey(con, 0), 5);
  });

  it('todas las leyes se pueden rosquear', () => {
    for (const l of LEYES) expect(l.opciones.some((o) => o.rosca)).toBe(true);
  });
});

describe('la mesa', () => {
  it('tiene de 6 a 8 bloques, con plata y bancas de sobra para elegir', () => {
    for (let s = 0; s < 40; s++) {
      const c = presidente(s);
      const r = armarRosca(c.azar, c);
      expect(r.bloques.length).toBeGreaterThanOrEqual(6);
      expect(r.bloques.length).toBeLessThanOrEqual(8);
      expect(r.bloques.reduce((t, b) => t + b.diputados, 0)).toBeGreaterThanOrEqual(MAYORIA_DIPUTADOS - 105);
      expect(r.bloques.reduce((t, b) => t + b.senadores, 0)).toBeGreaterThanOrEqual(MAYORIA_SENADO - 30);
      expect(r.bloques.every((b) => b.costo >= 1)).toBe(true);
    }
  });

  it('más Rosca y más Poder dan más presupuesto', () => {
    const c = presidente();
    const poco = fichasDeRosca(c);
    c.atributos.rosca = 90;
    c.medidores.poder = 90;
    expect(fichasDeRosca(c)).toBeGreaterThan(poco);
  });

  it('la misma semilla arma la misma mesa', () => {
    expect(iniciarRosca(presidente(8)).rosca).toEqual(iniciarRosca(presidente(8)).rosca);
  });

  it('arreglar gasta presupuesto, y echarse atrás lo devuelve', () => {
    let c = iniciarRosca(presidente());
    const libre = fichasLibres(c.rosca!);
    const i = c.rosca!.bloques.findIndex((_, k) => !motivoSinBloque(c, k));
    c = alternarBloque(c, i);
    expect(fichasLibres(c.rosca!)).toBe(libre - c.rosca!.bloques[i].costo);
    c = alternarBloque(c, i);
    expect(fichasLibres(c.rosca!)).toBe(libre);
  });

  it('si arreglás con uno, su rival se ofende', () => {
    let c = iniciarRosca(presidente());
    const a = c.rosca!.bloques.findIndex((b) => b.rival !== undefined);
    const b = c.rosca!.bloques[a].rival!;
    c.rosca!.fichas = 99;
    c = alternarBloque(c, a);
    expect(motivoSinBloque(c, b)).toMatch(/ofendió/);
    expect(() => alternarBloque(c, b)).toThrow(/ofendió/);
  });

  it('no te deja gastar lo que no tenés', () => {
    const c = iniciarRosca(presidente());
    c.rosca!.fichas = 0;
    expect(motivoSinBloque(c, 0)).toMatch(/rosca/);
  });
});

describe('la votación', () => {
  it('con los votos, sale la ley y queda anotada', () => {
    const { carrera, desenlace } = votarRosca(conBloque(conVotos(), 'cargo'));
    expect(desenlace.salioBien).toBe(true);
    expect(carrera.leyes).toEqual(['ley-emergencia']);
    expect(carrera.rosca).toBeUndefined();
    expect(carrera.evento).toBeUndefined();
  });

  it('sin los votos, la rechazan', () => {
    const { carrera, desenlace } = votarRosca(conBloque(presidente(), 'cargo', { diputados: 1, senadores: 0 }));
    expect(desenlace.salioBien).toBe(false);
    expect(carrera.leyes ?? []).toEqual([]);
  });

  it('un bloque que prometió puede faltar y hacerla caer', () => {
    const resultados = new Set<boolean>();
    for (let s = 0; s < 200; s++) {
      const c = conBloque(presidente(s), 'cargo', { diputados: 24, senadores: 7 });
      expect(conteoRosca(c).alcanza).toBe(true);
      resultados.add(!!votarRosca(c).desenlace.salioBien);
    }
    expect(resultados).toEqual(new Set([true, false]));
  });

  it('una obra sale de la caja', () => {
    const c = conBloque(conVotos(), 'obra');
    expect(votarRosca(c).carrera.medidores.caja).toBeLessThan(c.medidores.caja);
  });

  it('un cargo cuesta Poder, salga o no', () => {
    const sale = votarRosca(conBloque(conVotos(), 'promesa')).desenlace.efectos.poder ?? 0;
    const conCargo = votarRosca(conBloque(conVotos(), 'cargo')).desenlace.efectos.poder ?? 0;
    expect(conCargo).toBeLessThanOrEqual(sale - COSTO_CARGO + 1);
    const c = conBloque(presidente(), 'cargo', { diputados: 1, senadores: 0 });
    expect(votarRosca(c).desenlace.efectos.poder).toBeLessThanOrEqual(-3 - COSTO_CARGO + 1);
  });

  it('un cambio en la ley hace que rinda menos', () => {
    const entera = votarRosca(conBloque(conVotos(), 'cargo')).desenlace.pais!;
    const cambiada = votarRosca(conBloque(conVotos(), 'cambio')).desenlace.pais!;
    expect(cambiada.reservas!).toBeLessThan(entera.reservas!);
  });

  it('una promesa deja favores cruzados', () => {
    const { carrera, desenlace } = votarRosca(conBloque(conVotos(), 'promesa'));
    expect(carrera.favores.filter((f) => f.quien === 'Bloque de prueba' && f.debes)).toHaveLength(1);
    expect(carrera.favores.filter((f) => f.quien === 'Bloque de prueba' && !f.debes)).toHaveLength(1);
    expect(desenlace.favor).toContain('Bloque de prueba');
  });

  it('saltearla es mandarla sin negociar', () => {
    const c = iniciarRosca(presidente());
    const { carrera } = saltearRosca(c);
    expect(carrera.rosca).toBeUndefined();
    expect(carrera.evento).toBeUndefined();
    const directo = resolverEvento(presidente(), 0).desenlace.salioBien;
    expect(typeof directo).toBe('boolean');
  });
});

describe('cómo pesa', () => {
  const tasa = (n: number, jugar: (s: number) => boolean) => {
    let si = 0;
    for (let s = 0; s < n; s++) if (jugar(s)) si++;
    return si / n;
  };
  const enOrden = (s: number, d: number, sen: number) =>
    !!roscar(presidente(s, d, sen), (r) => r.bloques.map((_, i) => i)).desenlace.salioBien;

  it('jugada regular, la chance queda cerca de la de siempre', () => {
    const hoy = chanceLey(presidente(), 0.05);
    expect(Math.abs(tasa(400, (s) => enOrden(s, 105, 30)) - hoy)).toBeLessThan(0.2);
  });

  it('negociar sale más que mandarla sin rosca', () => {
    const sin = tasa(400, (s) => !!resolverEvento(presidente(s, 95, 26), 0).desenlace.salioBien);
    expect(tasa(400, (s) => enOrden(s, 95, 26))).toBeGreaterThan(sin);
  });
});
