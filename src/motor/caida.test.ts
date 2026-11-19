import { describe, expect, it } from 'vitest';
import { chanceDeFrenarJuicio, diputadosLeales, TERCIO_DIPUTADOS } from '../datos/caida';
import { elegirCarta, nuevaCarrera, TEXTO_FIN } from './carrera';
import { eventoDeCaida, riesgoDeJuicio, riesgoDeRenuncia } from './caida';
import { resolverEvento, sortearEvento } from './eventos';
import { recibirPais } from './pais';
import type { Carrera } from './tipos';

function presidente(semilla = 11): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', ideologia: { economia: 0, social: 0 } });
  Object.assign(c, { anio: 2031, edad: 50, cargo: 'presidente' as const, mandatoHasta: 2035, mandatosSeguidos: 1 });
  Object.assign(c.medidores, { caja: 100_000, fama: 70, poder: 50, imagen: 50, causas: 0 });
  c.congreso = { diputados: 120, senadores: 33 };
  c.favores = [];
  recibirPais(c);
  return c;
}

/** Un presidente al borde del juicio político. */
function acorralado(semilla = 11): Carrera {
  const c = presidente(semilla);
  c.congreso = { diputados: 70, senadores: 20 };
  c.medidores.imagen = 18;
  c.crisis = [{ id: 'corrida', desde: 2030 }];
  return c;
}

describe('cuándo se cae un presidente', () => {
  it('el juicio político necesita bloque flaco, imagen baja y de qué agarrarse', () => {
    expect(riesgoDeJuicio(acorralado())).toBe(true);
    const conBloque = acorralado();
    // Con 35 de Imagen, de 200 te siguen 100: alcanza para el tercio.
    conBloque.congreso = { diputados: 200, senadores: 50 };
    conBloque.medidores.imagen = 35;
    expect(riesgoDeJuicio(conBloque)).toBe(false);
    const querido = acorralado();
    querido.medidores.imagen = 45;
    expect(riesgoDeJuicio(querido)).toBe(false);
    const sinMotivo = acorralado();
    delete sinMotivo.crisis;
    expect(riesgoDeJuicio(sinMotivo)).toBe(false);
    sinMotivo.malestar = 0;
    expect(riesgoDeJuicio(sinMotivo)).toBe(false);
    sinMotivo.medidores.causas = 60;
    expect(riesgoDeJuicio(sinMotivo)).toBe(true);
    expect(riesgoDeJuicio(presidente())).toBe(false);
  });

  it('te piden la renuncia sin imagen y con la calle estallada o dos crisis', () => {
    const c = presidente();
    c.medidores.imagen = 20;
    expect(riesgoDeRenuncia(c)).toBe(false);
    c.crisis = [{ id: 'estallido', desde: 2030 }];
    expect(riesgoDeRenuncia(c)).toBe(true);
    c.crisis = [
      { id: 'corrida', desde: 2030 },
      { id: 'hiper', desde: 2031 },
    ];
    expect(riesgoDeRenuncia(c)).toBe(true);
    c.medidores.imagen = 40;
    expect(riesgoDeRenuncia(c)).toBe(false);
  });

  it('el juicio va antes que cualquier otro evento, y no se repite al año siguiente', () => {
    const c = acorralado();
    // Con la calle tibia no hay pedido de renuncia, pero el paro podría salir: el juicio va primero.
    c.malestar = 20;
    expect(sortearEvento(c)?.id).toBe('juicio-politico');
    c.anio++;
    expect(eventoDeCaida(c)).toBeNull();
    c.anio++;
    expect(eventoDeCaida(c)?.id).toBe('juicio-politico');
  });

  it('con más bancas y más imagen es más fácil frenar el juicio', () => {
    const flaco = acorralado();
    const menos = chanceDeFrenarJuicio(flaco);
    flaco.congreso = { diputados: 100, senadores: 20 };
    expect(chanceDeFrenarJuicio(flaco)).toBeGreaterThan(menos);
    const conBancas = chanceDeFrenarJuicio(flaco);
    flaco.medidores.imagen = 35;
    expect(chanceDeFrenarJuicio(flaco)).toBeGreaterThan(conBancas);
    expect(diputadosLeales(flaco)).toBeLessThan(TERCIO_DIPUTADOS);
  });
});

describe('cómo termina', () => {
  it('renunciar termina la carrera con su final', () => {
    const c = acorralado();
    c.evento = { id: 'juicio-politico', nombre: 'Alguien', semillaRetrato: 1 };
    const { carrera } = resolverEvento(c, 2);
    expect(carrera.fin?.motivo).toBe('renuncia');
    expect(carrera.evento).toBeUndefined();
    expect(carrera.cartas).toEqual([]);
    expect(TEXTO_FIN.renuncia).toMatch(/Renunciaste/);
    expect(() => elegirCarta(carrera, 0)).toThrow(/terminó/);
  });

  it('si el juicio sale mal, te destituyen; si sale bien, seguís', () => {
    const motivos = new Set<string>();
    for (let semilla = 1; semilla <= 30; semilla++) {
      const c = acorralado(semilla);
      c.evento = { id: 'juicio-politico', nombre: 'Alguien', semillaRetrato: 1 };
      c.cola = [{ id: 'ley-alquileres', nombre: 'Alguien', semillaRetrato: 1 }];
      const { carrera, desenlace } = resolverEvento(c, 0);
      motivos.add(carrera.fin?.motivo ?? 'sigue');
      if (desenlace.salioBien) {
        expect(carrera.fin).toBeFalsy();
        expect(carrera.evento?.id).toBe('ley-alquileres');
      } else {
        expect(carrera.fin?.motivo).toBe('destituido');
        expect(carrera.cola).toBeUndefined();
      }
    }
    expect([...motivos].sort()).toEqual(['destituido', 'sigue']);
  });

  it('resistir puede terminar en crisis institucional', () => {
    const motivos = new Set<string>();
    for (let semilla = 1; semilla <= 30; semilla++) {
      const c = presidente(semilla);
      c.medidores.imagen = 20;
      c.crisis = [{ id: 'estallido', desde: 2030 }];
      c.evento = { id: 'pedido-renuncia', nombre: 'Alguien', semillaRetrato: 1 };
      motivos.add(resolverEvento(c, 1).carrera.fin?.motivo ?? 'sigue');
    }
    expect([...motivos].sort()).toEqual(['caos', 'sigue']);
  });
});
