import { describe, expect, it } from 'vitest';
import { chanceLey, LEYES, MAYORIA_DIPUTADOS, MAYORIA_SENADO } from '../datos/leyes';
import { elegirCarta, nuevaCarrera } from './carrera';
import { anioDelCongreso, armarCongreso, leyesPosibles } from './congreso';
import { vencerMandato } from './elecciones';
import { resolverEvento } from './eventos';
import { recibirPais } from './pais';
import type { Carrera } from './tipos';

function presidente(semilla = 21): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', estilo: 'pragmatico', ideologia: { economia: 0, social: 0 } });
  Object.assign(c, { anio: 2031, edad: 50, cargo: 'presidente' as const, mandatoHasta: 2035, mandatosSeguidos: 1, construccion: 60 });
  Object.assign(c.medidores, { caja: 100_000, fama: 70, poder: 50, imagen: 50 });
  c.atributos.rosca = 50;
  c.congreso = { diputados: MAYORIA_DIPUTADOS, senadores: MAYORIA_SENADO };
  recibirPais(c);
  return c;
}

describe('la chance de una ley', () => {
  it('con mayoría propia sale casi siempre, y sin bloque casi nunca', () => {
    const c = presidente();
    expect(chanceLey(c)).toBeCloseTo(0.92);
    c.congreso = { diputados: 100, senadores: 30 };
    const flaco = chanceLey(c);
    expect(flaco).toBeLessThan(0.7);
    c.congreso = { diputados: 50, senadores: 12 };
    expect(chanceLey(c)).toBe(0.05);
    c.congreso = { diputados: 100, senadores: 30 };
    c.atributos.rosca = 90;
    c.medidores.poder = 90;
    expect(chanceLey(c)).toBeGreaterThan(flaco + 0.25);
    expect(chanceLey(c, 0.2)).toBeCloseTo(chanceLey(c) - 0.2);
  });
});

describe('el bloque', () => {
  it('sale de los votos: más votos, más bancas', () => {
    const muchos = presidente();
    const pocos = presidente();
    armarCongreso(muchos, 58);
    armarCongreso(pocos, 32);
    expect(muchos.congreso!.diputados).toBeGreaterThan(pocos.congreso!.diputados);
    expect(pocos.congreso!.diputados).toBeGreaterThanOrEqual(64);
    expect(muchos.congreso!.senadores).toBeLessThanOrEqual(45);
  });

  it('las legislativas de medio término premian la imagen alta y castigan la baja', () => {
    const bien = presidente();
    const mal = presidente();
    for (const c of [bien, mal]) c.anio = c.mandatoHasta! - 2;
    bien.medidores.imagen = 80;
    mal.medidores.imagen = 20;
    const lineas = anioDelCongreso(bien);
    anioDelCongreso(mal);
    expect(lineas[0]).toMatch(/Legislativas de medio término/);
    expect(bien.congreso!.diputados).toBeGreaterThan(MAYORIA_DIPUTADOS);
    expect(mal.congreso!.diputados).toBeLessThan(MAYORIA_DIPUTADOS);
  });

  it('fuera de la mitad del mandato no hay legislativas', () => {
    const c = presidente();
    c.anio = c.mandatoHasta! - 3;
    expect(anioDelCongreso(c).some((l) => l.includes('medio término'))).toBe(false);
  });

  it('sin bloque, el presupuesto casi nunca sale y cuesta poder', () => {
    let rechazos = 0;
    for (let semilla = 1; semilla <= 20; semilla++) {
      const c = presidente(semilla);
      c.anio = c.mandatoHasta! - 1;
      c.congreso = { diputados: 50, senadores: 12 };
      const poder = c.medidores.poder;
      if (anioDelCongreso(c).some((l) => l.startsWith('No te aprobaron'))) {
        rechazos++;
        expect(c.medidores.poder).toBeLessThan(poder);
      }
    }
    expect(rechazos).toBeGreaterThanOrEqual(15);
  });

  it('al dejar la presidencia, el bloque se va', () => {
    const c = presidente();
    c.anio = c.mandatoHasta!;
    vencerMandato(c, []);
    expect(c.congreso).toBeUndefined();
  });
});

describe('los proyectos de ley', () => {
  it('cada año de presidencia llega uno, después de la decisión de Estado', () => {
    let c = presidente();
    c = elegirCarta(c, 0);
    const ids = [c.evento?.id, ...(c.cola ?? []).map((e) => e.id)];
    expect(ids.some((id) => LEYES.some((l) => l.id === id))).toBe(true);
    if (c.cola?.length) {
      const ley = c.cola[0].id;
      c = resolverEvento(c, 0).carrera;
      expect(c.evento?.id).toBe(ley);
      expect(c.cola).toBeUndefined();
    }
  });

  it('por decreto sale seguro, queda anotada y no vuelve a aparecer', () => {
    let c = presidente();
    c.evento = { id: 'ley-emergencia', nombre: 'Alguien', semillaRetrato: 1 };
    const poder = c.medidores.poder;
    c = resolverEvento(c, 2).carrera;
    expect(c.leyes).toEqual(['ley-emergencia']);
    expect(c.palmares.some((l) => l.texto === 'Tu primera ley')).toBe(true);
    expect(c.medidores.poder).toBeLessThanOrEqual(poder);
    expect(leyesPosibles(c).some((l) => l.id === 'ley-emergencia')).toBe(false);
  });

  it('las leyes de impuestos no se pueden sacar por decreto', () => {
    const c = presidente();
    c.evento = { id: 'ley-grandes-fortunas', nombre: 'Alguien', semillaRetrato: 1 };
    expect(() => resolverEvento(c, 2)).toThrow(/decreto/);
  });

  it('solo el presidente manda leyes', () => {
    const c = presidente();
    c.cargo = 'gobernador';
    expect(leyesPosibles(c)).toEqual([]);
  });
});
