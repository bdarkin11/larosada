import { describe, expect, it } from 'vitest';
import { GESTION } from '../datos/gestion';
import { nuevaCarrera } from './carrera';
import { anioDelDistrito, notaDeGestion, recibirDistrito } from './distrito';
import { vencerMandato } from './elecciones';
import { resolverEvento, sortearEvento } from './eventos';
import { ajustesDeHistoria } from './promesas';
import type { Carrera, PartidoId } from './tipos';

function intendente(semilla = 5): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', ideologia: { economia: 0, social: 0 } });
  Object.assign(c, { anio: 2030, edad: 45, cargo: 'intendente' as const, mandatoHasta: 2033 });
  Object.assign(c.medidores, { caja: 80_000, fama: 30, poder: 45, imagen: 50 });
  c.oficialismo = c.partido;
  recibirDistrito(c);
  Object.assign(c.distrito!, { cuentas: 50, gestion: 50 });
  return c;
}

const otroPartido = (c: Carrera): PartidoId => (c.partido === 'libertad' ? 'coalicion-centro' : 'libertad');

describe('el distrito', () => {
  it('se hereda al asumir, con lo que había', () => {
    const c = intendente();
    expect(c.distrito!.cargo).toBe('intendente');
    expect(c.distrito!.recibido.cuentas).toBeGreaterThanOrEqual(25);
  });

  it('al aliado de la Nación le llegan fondos; al opositor, no', () => {
    const aliado = intendente();
    const opositor = intendente();
    opositor.oficialismo = otroPartido(opositor);
    const lineas = anioDelDistrito(aliado);
    anioDelDistrito(opositor);
    expect(aliado.distrito!.cuentas).toBeGreaterThan(opositor.distrito!.cuentas);
    expect(lineas.join(' ')).toMatch(/aliado de la Nación/);
  });

  it('el atributo Gestión empuja la gestión, y una buena gestión se ve en la imagen', () => {
    const bueno = intendente();
    const malo = intendente();
    bueno.atributos.gestion = 95;
    malo.atributos.gestion = 10;
    anioDelDistrito(bueno);
    anioDelDistrito(malo);
    expect(bueno.distrito!.gestion).toBeGreaterThan(malo.distrito!.gestion);

    const lucido = intendente();
    lucido.distrito!.gestion = 80;
    const imagen = lucido.medidores.imagen;
    anioDelDistrito(lucido);
    expect(lucido.medidores.imagen).toBeGreaterThan(imagen);
  });

  it('sin plata para sueldos, la calle se calienta', () => {
    const c = intendente();
    c.distrito!.cuentas = 5;
    c.malestar = 0;
    anioDelDistrito(c);
    expect(c.malestar).toBeGreaterThan(0);
  });

  it('al terminar el mandato se entrega, y pesa en las elecciones de los años siguientes', () => {
    const c = intendente();
    Object.assign(c.distrito!, { cuentas: 70, gestion: 82 });
    c.anio = c.mandatoHasta!;
    const lineas: string[] = [];
    vencerMandato(c, lineas);
    expect(c.distrito).toBeUndefined();
    expect(c.legadoGestion?.valor).toBe(notaDeGestion({ cuentas: 70, gestion: 82 }));
    expect(lineas.join(' ')).toMatch(/Entregaste la intendencia con Gestión 82/);
    expect(c.palmares.some((l) => l.texto.startsWith('Buena gestión'))).toBe(true);
    const ajuste = ajustesDeHistoria(c, 'gobernador').find((a) => a.texto.includes('gestión'));
    expect(ajuste?.valor).toBeGreaterThan(0);
    c.anio += 5;
    expect(ajustesDeHistoria(c, 'gobernador').some((a) => a.texto.includes('gestión'))).toBe(false);
  });

  it('una gestión mala resta mientras la estás haciendo', () => {
    const c = intendente();
    Object.assign(c.distrito!, { cuentas: 20, gestion: 25 });
    expect(ajustesDeHistoria(c, 'intendente').find((a) => a.texto.includes('gestión'))?.valor).toBeLessThan(0);
  });

  it('si pasás de intendente a gobernador, entregás una y recibís la otra', () => {
    const c = intendente();
    c.cargo = 'gobernador';
    anioDelDistrito(c);
    expect(c.distrito!.cargo).toBe('gobernador');
    expect(c.legadoGestion?.cargo).toBe('intendente');
  });
});

describe('las decisiones de gestión', () => {
  it('le llegan a intendentes y gobernadores', () => {
    const ids = new Set<string>();
    for (let semilla = 1; semilla <= 60; semilla++) {
      const c = intendente(semilla);
      c.medidores.fama = 80;
      c.malestar = 0;
      c.favores = [];
      const e = sortearEvento(c);
      if (e) ids.add(e.id);
    }
    expect([...ids].some((id) => GESTION.some((g) => g.id === id))).toBe(true);
  });

  it('mueven las cuentas y la gestión', () => {
    let c = intendente();
    c.evento = { id: 'gestion-obra', nombre: 'Alguien', semillaRetrato: 1 };
    const { carrera, desenlace } = resolverEvento(c, 0);
    c = carrera;
    expect(c.distrito).toMatchObject({ cuentas: 38, gestion: 60 });
    expect(desenlace.distrito).toEqual({ cuentas: -12, gestion: 10 });
  });
});
