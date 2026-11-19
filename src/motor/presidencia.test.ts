import { describe, expect, it } from 'vitest';
import { nuevaCarrera } from './carrera';
import { aporteAgrupacion } from './escala';
import { resolverEvento } from './eventos';
import { anioDelPais, entregarPais, recibirPais } from './pais';
import { PISO_PATO_RENGO, poderDeTuLugar } from './poder';
import { EDAD_PRESIDENCIAL, ajustesDeHistoria, asumirPromesas, fuerzaDePromesa, sentido } from './promesas';
import { vencerMandato } from './elecciones';
import type { Carrera } from './tipos';

function presidente(): Carrera {
  const c = nuevaCarrera({ semilla: 21, provincia: 'Buenos Aires', estilo: 'pragmatico', ideologia: { economia: 80, social: 0 } });
  Object.assign(c, { anio: 2031, edad: 50, cargo: 'presidente' as const, mandatoHasta: 2035, mandatosSeguidos: 1, construccion: 60 });
  Object.assign(c.medidores, { caja: 100_000, fama: 70, poder: 75 });
  recibirPais(c);
  return c;
}

describe('el aporte a la agrupación', () => {
  it('crece con el cargo y con la construcción', () => {
    const c = nuevaCarrera({ semilla: 3 });
    expect(aporteAgrupacion(c)).toBe(0);
    c.cargo = 'legislador';
    c.construccion = 10;
    expect(aporteAgrupacion(c)).toBe(Math.round(28000 * 0.4));
    c.construccion = 65;
    expect(aporteAgrupacion(c)).toBe(Math.round(28000 * 0.5));
  });
});

describe('promesas y coherencia', () => {
  it('una promesa que va con tus ideas rinde más', () => {
    const c = presidente();
    expect(fuerzaDePromesa(c, 'no-impuestos')).toBe(3);
    expect(fuerzaDePromesa(c, 'no-ajuste')).toBe(1);
    expect(fuerzaDePromesa(c, 'manos-limpias')).toBe(2);
  });

  it('romper una promesa cuesta imagen, poder y calle, y queda anotado', () => {
    let c = presidente();
    asumirPromesas(c, ['inflacion'], 'presidente', 2035);
    c.evento = { id: 'maquinita', nombre: 'X', semillaRetrato: 1 };
    const antes = c.medidores.poder;
    c = resolverEvento(c, 0).carrera;
    expect(c.promesas).toEqual([]);
    expect(c.promesasRotas).toEqual([2031]);
    expect(c.medidores.poder).toBeLessThan(antes);
    expect(c.malestar).toBeGreaterThanOrEqual(25);
    expect(ajustesDeHistoria(c, 'presidente').some((a) => a.texto.includes('Promesas rotas'))).toBe(true);
  });

  it('decidir contra tus ideas se nota', () => {
    const c = presidente();
    expect(sentido(c, { economia: -1 })).toBe('incoherente');
    expect(sentido(c, { economia: 1 })).toBe('coherente');
    c.evento = { id: 'retenciones-soja', nombre: 'X', semillaRetrato: 1 };
    const { carrera } = resolverEvento(c, 0);
    expect(carrera.incoherencias).toEqual([2031]);
  });
});

describe('la presidencia', () => {
  it('el país se mueve con las decisiones y se entrega al final', () => {
    let c = presidente();
    const inflacion = c.pais!.inflacion;
    c.evento = { id: 'maquinita', nombre: 'X', semillaRetrato: 1 };
    c = resolverEvento(c, 0).carrera;
    expect(c.pais!.inflacion).toBe(Math.min(500, inflacion + 40));
    expect(anioDelPais(c)[0]).toMatch(/El país/);
    const lineas: string[] = [];
    entregarPais(c, lineas);
    expect(c.pais).toBeUndefined();
    expect(lineas[0]).toMatch(/Entregaste el país/);
  });

  it('en el segundo mandato el poder de la Rosada se achica', () => {
    const c = presidente();
    const primero = poderDeTuLugar(c);
    c.mandatosSeguidos = 2;
    c.anio = 2034;
    expect(poderDeTuLugar(c)).toBeLessThan(primero);
    c.anio = 2040;
    expect(poderDeTuLugar(c)).toBe(PISO_PATO_RENGO + Math.round(c.construccion / 5));
  });

  it('al dejar la Rosada sos ex presidente y te cuesta más volver', () => {
    const c = presidente();
    c.anio = 2035;
    vencerMandato(c, []);
    expect(c.cargo).toBe('militante');
    expect(c.expresidente).toBe(2035);
    expect(c.pais).toBeUndefined();
    expect(ajustesDeHistoria(c, 'senador').some((a) => a.valor === -8)).toBe(true);
  });

  it('antes de los 37 años nadie te ve como presidente', () => {
    const c = presidente();
    c.edad = 31;
    const joven = ajustesDeHistoria(c, 'presidente').find((a) => a.texto.includes('joven'));
    expect(joven?.valor).toBe(-3 * (EDAD_PRESIDENCIAL - 31));
    c.edad = 40;
    expect(ajustesDeHistoria(c, 'presidente').some((a) => a.texto.includes('joven'))).toBe(false);
  });
});
