import { describe, expect, it } from 'vitest';
import { CARGOS } from '../datos/cargos';
import { PARTIDOS, partidoMasCercano } from '../datos/partidos';
import { buscarItem } from '../datos/tienda';
import { ANIOS_PERIODO, elegirCarta, herencia, nuevaCarrera, retirarse } from './carrera';
import { despejar } from './pruebas-util';
import { etapaDe } from './ficha';
import { costoTraicion, decidirPase, generarPases, mejorCargo } from './pases';
import { comprar, motivoSinCompra, tiene } from './tienda';
import type { Carrera } from './tipos';

function base(semilla = 11): Carrera {
  return nuevaCarrera({ semilla, provincia: 'Buenos Aires', ideologia: { economia: -60, social: 20 } });
}

/** Avanza (al menos) esos años renovando siempre y cerrando los festejos. Cada carta pasa uno o dos. */
function avanzar(c: Carrera, anios: number): Carrera {
  const hasta = c.anio + anios;
  while (c.anio < hasta && !c.fin) c = elegirCarta(despejar(c), 0);
  return c;
}

describe('partido y construcción política', () => {
  it('arrancás en el partido más cercano a lo que pensás', () => {
    expect(base().partido).toBe(partidoMasCercano({ economia: -60, social: 20 }));
    expect(base().partido).toBe('frente-nacional');
  });

  it('la construcción crece con los años y subir de etapa se festeja', () => {
    const c = base();
    c.atributos.territorio = 90;
    const despues = avanzar(c, 12);
    expect(despues.construccion).toBeGreaterThan(c.construccion);
    expect(despues.palmares.some((l) => l.texto.startsWith('Llegaste a'))).toBe(true);
  });

  it('las etapas van de Desconocido a Prócer', () => {
    expect(etapaDe(0)).toBe('desconocido');
    expect(etapaDe(45)).toBe('referente');
    expect(etapaDe(100)).toBe('procer');
  });
});

describe('cierre de listas', () => {
  function conOfertas(): Carrera {
    const c = base();
    c.anio = 2031;
    c.edad = 40;
    c.medidores.fama = 30;
    c.construccion = 30;
    c.atributos.gestion = 50;
    c.atributos.rosca = 45;
    c.pases = generarPases(c)!;
    return c;
  }

  it('solo hay ofertas en años electorales y si te conocen', () => {
    const c = base();
    c.anio = 2028;
    c.medidores.fama = 50;
    expect(generarPases(c)).toBeNull();
    c.anio = 2029;
    c.edad = 22;
    c.medidores.fama = 2;
    c.construccion = 0;
    expect(generarPases(c)).toBeNull();
    expect(conOfertas().pases!.length).toBeGreaterThanOrEqual(3);
  });

  it('la primera oferta es renovar con tu partido, y las otras son de otros espacios', () => {
    const c = conOfertas();
    expect(c.pases![0].renovacion).toBe(true);
    expect(c.pases![0].partido).toBe(c.partido);
    expect(c.pases!.slice(1).every((o) => o.partido !== c.partido && o.construccion < 0)).toBe(true);
  });

  it('no se puede pasar el año sin decidir', () => {
    expect(() => elegirCarta(conOfertas(), 0)).toThrow();
  });

  it('irte al espacio de enfrente es una traición imperdonable', () => {
    const c = base();
    expect(costoTraicion(c, 'libertad').imperdonable).toBe(true);
    expect(costoTraicion(c, 'coalicion-centro').imperdonable).toBe(false);
    expect(costoTraicion(c, 'libertad').construccion).toBeLessThan(costoTraicion(c, 'coalicion-centro').construccion);
  });

  it('pasarte cambia de partido, suma plata y baja la construcción', () => {
    const c = conOfertas();
    const indice = c.pases!.findIndex((o) => !o.renovacion);
    const oferta = c.pases![indice];
    const despues = decidirPase(c, indice);
    expect(despues.partido).toBe(oferta.partido);
    expect(despues.pases).toBeUndefined();
    expect(despues.medidores.caja).toBe(c.medidores.caja + oferta.caja);
    expect(despues.construccion).toBeLessThan(c.construccion);
    expect(despues.historial[0].lineas.join(' ')).toContain(PARTIDOS[oferta.partido].nombre);
  });

  it('un ascenso de cargo trae la jura y un sueldo mejor', () => {
    const c = conOfertas();
    expect(mejorCargo(c)).not.toBe('militante');
    const despues = decidirPase(c, 0);
    expect(CARGOS[despues.cargo].rango).toBeGreaterThan(0);
    expect(despues.pendientes.some((p) => p.tipo === 'jura')).toBe(true);
  });
});

describe('tienda', () => {
  function rica(): Carrera {
    const c = base();
    c.medidores.caja = 500000;
    return c;
  }

  it('el equipo se compra una vez y trabaja todos los años', () => {
    const c = comprar(rica(), 'asesor-imagen');
    expect(tiene(c, 'asesor-imagen')).toBe(true);
    expect(motivoSinCompra(c, 'asesor-imagen')).toMatch(/tenés/);
    expect(c.medidores.caja).toBe(500000 - buscarItem('asesor-imagen').costo);
    expect(avanzar(c, 1).historial[0].lineas.join(' ')).toMatch(/Tu equipo/);
  });

  it('los consumibles se terminan', () => {
    const c = comprar(rica(), 'redes');
    expect(tiene(c, 'redes')).toBe(true);
    expect(tiene(avanzar(c, 1), 'redes')).toBe(false);
    // Los de dos años duran un turno entero.
    const spots = comprar(rica(), 'spots');
    expect(tiene(spots, 'spots')).toBe(true);
    expect(tiene(avanzar(spots, 2), 'spots')).toBe(false);
  });

  it('el lujo da fama pero sube las causas', () => {
    const antes = rica();
    const c = comprar(antes, 'yate');
    expect(c.medidores.fama).toBeGreaterThan(antes.medidores.fama);
    expect(c.medidores.causas).toBeGreaterThan(antes.medidores.causas);
    expect(c.palmares.at(-1)!.texto).toContain('Yate');
  });

  it('sin plata no se compra', () => {
    const c = base();
    c.medidores.caja = 100;
    expect(motivoSinCompra(c, 'yate')).toMatch(/caja/);
    expect(() => comprar(c, 'yate')).toThrow();
  });
});

describe('balance, trayectoria y legado', () => {
  it('cada cuatro años hay un balance del período', () => {
    let c = base();
    while (c.trayectoria.length < ANIOS_PERIODO * 2 + 1) c = elegirCarta(despejar(c), 0);
    // Va a la bitácora, sin pantalla.
    const balances = c.historial.flatMap((h) => h.lineas).filter((l) => l.startsWith('📊 Balance'));
    expect(balances).toHaveLength(2);
    expect(balances.at(-1)).toContain(`${c.anioInicio}–${c.anioInicio + ANIOS_PERIODO - 1}`);
  });

  it('la trayectoria guarda una fila por año, aunque cada carta pase dos', () => {
    const c = avanzar(base(), 6);
    const anios = c.trayectoria.map((f) => f.anio);
    expect(anios.length).toBeGreaterThanOrEqual(6);
    expect(anios).toEqual(anios.map((_, i) => 2027 + i));
  });

  it('el delfín hereda partido, contactos y parte de la construcción', () => {
    const padre = retirarse(avanzar(base(), 10));
    const padrino = { nombre: padre.nombre, partido: 'libertad' as const, construccion: 60, caja: 50000 };
    const solo = nuevaCarrera({ semilla: 99 });
    const delfin = nuevaCarrera({ semilla: 99, padrino });
    expect(delfin.partido).toBe('libertad');
    expect(delfin.padrino?.nombre).toBe(padre.nombre);
    expect(delfin.construccion).toBe(solo.construccion + herencia(padrino).construccion);
    expect(delfin.atributos.rosca).toBe(Math.min(99, solo.atributos.rosca + 5));
    expect(delfin.medidores.caja).toBe(solo.medidores.caja + 5000);
  });
});
