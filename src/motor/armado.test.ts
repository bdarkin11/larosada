import { describe, expect, it } from 'vitest';
import { CARTAS_ARRANQUE, ESTILO, ORIGEN, buscarCartaArranque } from '../datos/armado';
import { cartasDeArranque, nombreIdeologia, nuevaCarrera } from './carrera';
import { ESTILOS, ORIGENES } from './tipos';

describe('armado del personaje', () => {
  it('cada semilla ofrece tres cartas de arranque distintas y siempre las mismas', () => {
    for (let semilla = 0; semilla < 300; semilla++) {
      const cartas = cartasDeArranque(semilla);
      expect(new Set(cartas).size).toBe(3);
      expect(cartasDeArranque(semilla)).toEqual(cartas);
    }
  });

  it('la carta icónica sale muy de vez en cuando', () => {
    let iconicas = 0;
    for (let semilla = 0; semilla < 5000; semilla++) {
      if (cartasDeArranque(semilla).some((id) => buscarCartaArranque(id).rareza === 'iconica')) iconicas++;
    }
    expect(iconicas).toBeGreaterThan(10);
    expect(iconicas).toBeLessThan(120);
  });

  it('respeta todo lo elegido', () => {
    const semilla = 77;
    const carta = cartasDeArranque(semilla)[2];
    const carrera = nuevaCarrera({
      semilla,
      nombre: 'Ana Paz',
      provincia: 'Jujuy',
      origen: 'sindicato',
      estilo: 'idealista',
      ideologia: { economia: -60, social: 40 },
      cartaArranque: carta,
    });
    expect(carrera).toMatchObject({
      nombre: 'Ana Paz',
      provincia: 'Jujuy',
      origen: 'sindicato',
      estilo: 'idealista',
      ideologia: { economia: -60, social: 40 },
      cartaArranque: carta,
    });
    expect(carrera.historial[0].lineas.join(' ')).toContain('Sindicato'.toLowerCase());
  });

  it('no acepta una carta de arranque que no fue ofrecida', () => {
    const ajena = CARTAS_ARRANQUE.find((c) => !cartasDeArranque(5).includes(c.id))!.id;
    expect(() => nuevaCarrera({ semilla: 5, cartaArranque: ajena })).toThrow();
  });

  it('los atributos base no cambian según el armado, solo los ajustes', () => {
    const semilla = 31;
    const carta = cartasDeArranque(semilla)[0];
    const a = nuevaCarrera({ semilla, origen: 'puntero', estilo: 'pragmatico', cartaArranque: carta });
    const b = nuevaCarrera({ semilla, origen: 'puntero', estilo: 'pragmatico', cartaArranque: carta, nombre: 'Otro Nombre' });
    expect(a.atributos).toEqual(b.atributos);
    expect(a.cartas).toEqual(b.cartas);
  });

  it('el origen se nota: el empresario arranca con más caja que el universitario', () => {
    const semilla = 12;
    const carta = cartasDeArranque(semilla)[0];
    const empresario = nuevaCarrera({ semilla, origen: 'empresario', estilo: 'pragmatico', cartaArranque: carta });
    const universitario = nuevaCarrera({ semilla, origen: 'universitaria', estilo: 'pragmatico', cartaArranque: carta });
    expect(empresario.medidores.caja - universitario.medidores.caja).toBe(ORIGEN.empresario.ajustes.caja);
  });

  it('todos los orígenes y estilos tienen su ficha', () => {
    for (const o of ORIGENES) expect(ORIGEN[o].nombre).toBeTruthy();
    for (const e of ESTILOS) expect(ESTILO[e].nombre).toBeTruthy();
  });

  it('nombra la ideología según los dos ejes', () => {
    expect(nombreIdeologia({ economia: -80, social: 80 })).toBe('Estatista progresista');
    expect(nombreIdeologia({ economia: 80, social: -80 })).toBe('Liberal conservador');
    expect(nombreIdeologia({ economia: 0, social: 0 })).toBe('De centro moderado');
  });
});
