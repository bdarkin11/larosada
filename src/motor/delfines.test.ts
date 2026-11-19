import { describe, expect, it } from 'vitest';
import { buscarEvento } from '../datos/eventos';
import { herencia, nuevaCarrera } from './carrera';
import {
  COSTO_DELFIN,
  LEALTAD_APOYO,
  MAXIMO_DELFINES,
  PODER_DELFIN,
  anioDeLosDelfines,
  apoyoDeDelfines,
  formarDelfin,
  motivoSinDelfin,
} from './delfines';
import { resolverEvento, sortearEvento } from './eventos';
import { poderHistorico } from './historico';
import { ajustesDeHistoria } from './promesas';
import type { Carrera, Delfin } from './tipos';

function referente(semilla = 7): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  c.construccion = 45;
  c.medidores.caja = 50000;
  c.medidores.poder = 40;
  return c;
}

const delfin = (extra: Partial<Delfin> = {}): Delfin => ({
  id: 1,
  nombre: 'Lucía Ferreyra',
  edad: 25,
  talento: 60,
  lealtad: 60,
  nivel: 30,
  desde: 2030,
  ...extra,
});

describe('formar un delfín', () => {
  it('hace falta ser Referente, tener la plata y no más de dos', () => {
    const c = referente();
    c.construccion = 30;
    expect(motivoSinDelfin(c)).toMatch(/Referente/);
    c.construccion = 45;
    c.medidores.caja = COSTO_DELFIN - 1;
    expect(motivoSinDelfin(c)).toMatch(/caja/);
    c.medidores.caja = 50000;
    c.delfines = Array.from({ length: MAXIMO_DELFINES }, (_, i) => delfin({ id: i }));
    expect(motivoSinDelfin(c)).toMatch(/no da para más/);
  });

  it('cuesta Poder y plata, no pasa el año y solo uno por año', () => {
    const c = referente();
    const d = formarDelfin(c);
    expect(c.delfines).toBeUndefined();
    expect(d.delfines).toHaveLength(1);
    expect(d.anio).toBe(c.anio);
    expect(d.medidores.caja).toBe(c.medidores.caja - COSTO_DELFIN);
    expect(d.medidores.poder).toBe(c.medidores.poder - PODER_DELFIN);
    expect(motivoSinDelfin(d)).toMatch(/este año/);
    const { talento, lealtad, edad } = d.delfines![0];
    expect(talento).toBeGreaterThanOrEqual(25);
    expect(lealtad).toBeGreaterThanOrEqual(55);
    expect(edad).toBeLessThanOrEqual(32);
  });
});

describe('el año de tus delfines', () => {
  it('crecen con su talento y tu construcción', () => {
    const c = referente();
    c.delfines = [delfin({ nivel: 10, talento: 75 })];
    anioDeLosDelfines(c);
    // 75 / 25 + 45 / 30 = 4,5 → 5
    expect(c.delfines[0].nivel).toBe(15);
    expect(c.delfines[0].edad).toBe(26);
    // Solo, no pasa de su talento.
    c.delfines = [delfin({ nivel: 58, talento: 60 })];
    anioDeLosDelfines(c);
    expect(c.delfines[0].nivel).toBe(60);
    anioDeLosDelfines(c);
    expect(c.delfines[0].nivel).toBe(60);
  });

  it('con tu imagen por el piso y sin poder, la lealtad baja; muy baja, se va y se lleva gente', () => {
    const c = referente();
    c.medidores.imagen = 20;
    c.medidores.poder = 10;
    c.delfines = [delfin({ lealtad: 40 })];
    anioDeLosDelfines(c);
    expect(c.delfines[0].lealtad).toBe(36);
    let traiciono = false;
    for (let s = 1; s <= 30 && !traiciono; s++) {
      const x = referente(s);
      x.delfines = [delfin({ lealtad: 5 })];
      const lineas = anioDeLosDelfines(x);
      if (!x.delfines.length) {
        traiciono = true;
        expect(x.construccion).toBeLessThan(45);
        expect(x.traiciones).toBe(1);
        expect(lineas.join(' ')).toMatch(/traicionó/);
      }
    }
    expect(traiciono).toBe(true);
  });
});

describe('lo que te dan', () => {
  it('los leales suman en las elecciones, con tope', () => {
    const c = referente();
    c.delfines = [delfin({ nivel: 60, cargo: true }), delfin({ id: 2, nivel: 80, lealtad: LEALTAD_APOYO - 1 })];
    // Solo el primero: 60 / 20 + 2 por la banca.
    expect(apoyoDeDelfines(c)).toBe(5);
    expect(ajustesDeHistoria(c, 'concejal').some((a) => a.texto.includes('delfines') && a.valor === 5)).toBe(true);
    c.delfines[1].lealtad = 90;
    expect(apoyoDeDelfines(c)).toBe(6);
  });

  it('suman al Poder Histórico, y las traiciones restan', () => {
    const c = referente();
    c.delfines = [delfin({ nivel: 40 })];
    c.traiciones = 1;
    const partes = poderHistorico(c).partes;
    expect(partes.find((p) => p.texto.startsWith('Delfines que formaste'))?.valor).toBe(10);
    expect(partes.find((p) => p.texto.startsWith('Delfines que te traicionaron'))?.valor).toBe(-10);
  });

  it('el que hereda tu lugar arranca con más cuanto más lo hiciste crecer', () => {
    const padrino = { nombre: 'Ana', partido: 'libertad' as const, construccion: 60, caja: 100000 };
    const nuevo = herencia(padrino);
    const formado = herencia({ ...padrino, delfin: delfin({ nivel: 50, talento: 90, lealtad: 80 }) });
    expect(formado.construccion).toBe(nuevo.construccion + 10);
    expect(formado.rosca).toBe(nuevo.rosca + 6);
    expect(formado.caja).toBe(Math.round(nuevo.caja * 1.8));
  });
});

describe('los eventos de delfines', () => {
  it('habla el delfín, y lo que elegís le pasa a él', () => {
    let probado = false;
    for (let s = 1; s <= 200 && !probado; s++) {
      const c = referente(s);
      c.medidores.fama = 0;
      c.medidores.poder = 0;
      c.delfines = [delfin()];
      const en = sortearEvento(c);
      if (en?.id !== 'delfin-candidato') continue;
      probado = true;
      expect(en.nombre).toBe('Lucía Ferreyra');
      c.evento = en;
      const { carrera, desenlace } = resolverEvento(c, 0);
      expect(carrera.delfines![0]).toMatchObject({ nivel: 45, lealtad: 75, cargo: true });
      expect(desenlace.texto).toMatch(/Lucía Ferreyra: lealtad \+15, crecimiento \+15/);
    }
    expect(probado).toBe(true);
    expect(buscarEvento('delfin-critica').condicion!(Object.assign(referente(), { delfines: [delfin({ lealtad: 30 })] }))).toBe(false);
  });
});
