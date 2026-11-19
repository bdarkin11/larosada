import { describe, expect, it } from 'vitest';
import { EVENTOS, ESPECIALES, COMUNES, buscarEvento } from '../datos/eventos';
import { FIGURAS } from '../datos/personajes';
import { elegirCarta, nuevaCarrera } from './carrera';
import { fuerzaJugador } from './elecciones';
import { ANIOS_ENTRE_EVENTOS, figuraActiva, motivoOpcion, quienHabla, resolverEvento, sortearEvento } from './eventos';
import { PISO_PODER, apoyoDelPoder, poderDeTuLugar } from './poder';
import { despejar } from './pruebas-util';
import type { Carrera } from './tipos';

function rica(semilla = 4): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', estilo: 'pragmatico' });
  Object.assign(c, { anio: 2031, edad: 45, construccion: 50, cargo: 'diputado' as const, mejorRango: 4 });
  Object.assign(c.medidores, { fama: 60, caja: 500_000, causas: 40 });
  return c;
}

describe('el poder', () => {
  it('se arranca con más poder si venís de una dinastía', () => {
    const comun = nuevaCarrera({ semilla: 3, origen: 'universitaria' });
    const dinastia = nuevaCarrera({ semilla: 3, origen: 'dinastia' });
    expect(dinastia.medidores.poder).toBe(comun.medidores.poder + 10);
  });

  it('tener poder suma en las elecciones', () => {
    const c = rica();
    c.medidores.poder = 25;
    const neutra = fuerzaJugador(c, 'diputado');
    c.medidores.poder = 100;
    expect(apoyoDelPoder(c)).toBe(15);
    expect(fuerzaJugador(c, 'diputado')).toBeGreaterThan(neutra);
  });

  it('el poder se ejerce o se pierde: se acerca al que te da tu lugar', () => {
    let c = rica();
    c.medidores.poder = 95;
    c.eleccion = undefined;
    c = elegirCarta(despejar(c), 0);
    expect(c.medidores.poder).toBeLessThan(95);
    expect(poderDeTuLugar(c)).toBe(PISO_PODER[c.cargo] + Math.round(c.construccion / 5));
  });
});

describe('eventos', () => {
  it('hay especiales con alerta y comunes, sin ids repetidos', () => {
    expect(ESPECIALES.length).toBeGreaterThanOrEqual(15);
    expect(COMUNES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(EVENTOS.map((e) => e.id)).size).toBe(EVENTOS.length);
    for (const e of ESPECIALES) expect(e.especial).toBeTruthy();
  });

  it('las figuras del elenco existen, y las coimas y carpetazos nunca los hace una de ellas', () => {
    for (const e of EVENTOS) {
      if (e.quien && 'figura' in e.quien) {
        expect(FIGURAS.some((f) => f.id === (e.quien as { figura: string }).figura)).toBe(true);
        const coima = e.opciones.some((o) =>
          ('chance' in o.resultado ? [o.resultado.exito, o.resultado.fracaso] : [o.resultado]).some((r) => r.coima),
        );
        expect(coima).toBe(false);
        expect(e.especial === 'carpetazo' && e.id !== 'investigacion-alcorta').toBe(false);
      }
    }
  });

  it('todas las opciones de todos los eventos se pueden resolver sin romper nada', () => {
    for (const e of EVENTOS) {
      e.opciones.forEach((_, i) => {
        const c = rica();
        c.evento = { id: e.id, nombre: 'Alguien', semillaRetrato: 1, quien: e.id === 'cobro-favor' ? 'Los sindicatos' : undefined };
        if (motivoOpcion(c, i)) return;
        const { carrera, desenlace } = resolverEvento(c, i);
        expect(carrera.evento).toBeUndefined();
        expect(desenlace.texto).toBeTruthy();
        expect(carrera.historial[0].lineas.some((l) => l.includes(e.titulo))).toBe(true);
        expect(carrera.medidores.poder).toBeGreaterThanOrEqual(0);
        expect(carrera.medidores.poder).toBeLessThanOrEqual(100);
      });
    }
  });

  it('el idealista no puede aceptar coimas', () => {
    const c = rica();
    c.estilo = 'idealista';
    c.evento = { id: 'coima-obra', nombre: 'X', semillaRetrato: 1 };
    expect(motivoOpcion(c, 0)).toMatch(/idealista/);
    expect(() => resolverEvento(c, 0)).toThrow();
  });

  it('una coima da plata negra proporcional a tu caja, con tope, sube las causas y queda registrada', () => {
    const c = rica();
    c.evento = { id: 'coima-obra', nombre: 'X', semillaRetrato: 1 };
    const { carrera } = resolverEvento(c, 0);
    expect(carrera.medidores.caja).toBe(c.medidores.caja);
    // 35 % de US$ 500.000 pasa el tope de US$ 40.000.
    expect(carrera.cajaNegra).toBe(40000);
    expect(carrera.medidores.causas).toBeGreaterThan(c.medidores.causas);
    expect(carrera.coimas).toBe(1);
  });

  it('los favores se anotan y te los vienen a cobrar', () => {
    let c = rica();
    c.evento = { id: 'financiar-por-fuera', nombre: 'X', semillaRetrato: 1 };
    c = resolverEvento(c, 1).carrera;
    expect(c.favores).toEqual([expect.objectContaining({ quien: 'X, empresario de la construcción', debes: true })]);
    c.evento = { id: 'cobro-favor', nombre: 'Y', semillaRetrato: 1, quien: c.favores[0].quien };
    const antes = c.medidores.poder;
    c = resolverEvento(c, 1).carrera;
    expect(c.favores).toHaveLength(0);
    expect(c.medidores.poder).toBeLessThan(antes);
  });

  it('con un evento abierto no pasa el año', () => {
    const c = rica();
    c.evento = { id: 'inundacion', semillaRetrato: 1 };
    expect(() => elegirCarta(c, 0)).toThrow();
  });

  it('los eventos aparecen, de a uno cada cuatro años como mucho, y no se repiten enseguida', () => {
    const c = rica();
    const ids: string[] = [];
    const anios: number[] = [];
    for (let i = 0; i < 40; i++) {
      const e = sortearEvento(c);
      if (e) {
        ids.push(e.id);
        anios.push(c.anio);
      }
      c.anio++;
    }
    expect(ids.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).not.toBe(ids[i - 1]);
      expect(anios[i] - anios[i - 1]).toBeGreaterThanOrEqual(ANIOS_ENTRE_EVENTOS);
    }
  });

  it('Hugo Medrano le pasa la posta a su hijo con los años', () => {
    expect(figuraActiva('hugo-medrano', 2027)!.nombre).toBe('Hugo Medrano');
    expect(figuraActiva('hugo-medrano', 2040)!.nombre).toBe('Pablo Medrano');
    const c = rica();
    c.anio = 2040;
    c.evento = { id: 'paro-camioneros', semillaRetrato: 1 };
    expect(quienHabla(c)!.nombre).toBe('Pablo Medrano');
    expect(buscarEvento('paro-camioneros').especial).toBe('amenaza');
  });
});
