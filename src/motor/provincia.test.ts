import { describe, expect, it } from 'vitest';
import {
  COSTO_MUDANZA,
  cartasDeArranque,
  efectoDeCarta,
  elegirCarta,
  enElCentroDelPoder,
  mudarseABuenosAires,
  nuevaCarrera,
  puedeMudarse,
  vistaPreviaArmado,
  FACTOR_CARTA,
} from './carrera';

describe('provincia natal y centro del poder', () => {
  it('la provincia sale según la población: Buenos Aires y la Ciudad son casi la mitad', () => {
    let centro = 0;
    const vistas = new Set<string>();
    for (let semilla = 0; semilla < 4000; semilla++) {
      const carrera = nuevaCarrera({ semilla });
      vistas.add(carrera.provincia);
      if (enElCentroDelPoder(carrera)) centro++;
    }
    expect(centro / 4000).toBeGreaterThan(0.38);
    expect(centro / 4000).toBeLessThan(0.52);
    expect(vistas.size).toBe(24);
  });

  it('la base arranca en la provincia natal', () => {
    const carrera = nuevaCarrera({ semilla: 1, provincia: 'Salta' });
    expect(carrera.base).toBe('Salta');
    expect(enElCentroDelPoder(carrera)).toBe(false);
    expect(enElCentroDelPoder(nuevaCarrera({ semilla: 1, provincia: 'Ciudad de Buenos Aires' }))).toBe(true);
  });

  it('lejos de Buenos Aires, las cartas de fama rinden la mitad', () => {
    const carta = { id: 'radio', rareza: 'dorada' as const };
    // Cada carta vale por varios años del turno.
    expect(efectoDeCarta(carta, false).cantidad).toBe(10 * FACTOR_CARTA);
    expect(efectoDeCarta(carta, true).cantidad).toBe(5 * FACTOR_CARTA);
    expect(efectoDeCarta({ id: 'timbreo', rareza: 'dorada' }, true).cantidad).toBe(7 * FACTOR_CARTA);
  });

  it('mudarse cuesta plata y la mitad del territorio, y no pasa el año', () => {
    const antes = nuevaCarrera({ semilla: 8, provincia: 'Chaco' });
    antes.medidores.caja = 20000;
    antes.atributos.territorio = 40;
    const despues = mudarseABuenosAires(antes);
    expect(despues.base).toBe('Buenos Aires');
    expect(despues.medidores.caja).toBe(20000 - COSTO_MUDANZA);
    expect(despues.atributos.territorio).toBe(20);
    expect(despues.anio).toBe(antes.anio);
    expect(despues.provincia).toBe('Chaco');
    expect(puedeMudarse(despues)).toBe(false);
  });

  it('sin plata o ya en Buenos Aires no hay mudanza', () => {
    const pobre = nuevaCarrera({ semilla: 9, provincia: 'Formosa' });
    pobre.medidores.caja = COSTO_MUDANZA - 1;
    expect(puedeMudarse(pobre)).toBe(false);
    expect(() => mudarseABuenosAires(pobre)).toThrow();
    const porteno = nuevaCarrera({ semilla: 9, provincia: 'Buenos Aires' });
    porteno.medidores.caja = 50000;
    expect(puedeMudarse(porteno)).toBe(false);
  });

  it('lejos del poder la fama se pierde más rápido', () => {
    const lejos = nuevaCarrera({ semilla: 10, provincia: 'Jujuy' });
    const cerca = nuevaCarrera({ semilla: 10, provincia: 'Buenos Aires' });
    lejos.medidores.fama = 40;
    cerca.medidores.fama = 40;
    const indice = lejos.cartas.findIndex((c) => !['radio', 'redes'].includes(c.id));
    // Se apaga un 9 % por año lejos y un 6 % cerca.
    expect(elegirCarta(lejos, indice).medidores.fama).toBeLessThan(elegirCarta(cerca, indice).medidores.fama);
  });

  it('la vista previa del armado coincide con la carrera que se crea', () => {
    const semilla = 55;
    const carta = cartasDeArranque(semilla)[1];
    const previa = vistaPreviaArmado(semilla, { origen: 'outsider', estilo: 'transa', cartaArranque: carta });
    const carrera = nuevaCarrera({ semilla, origen: 'outsider', estilo: 'transa', cartaArranque: carta });
    expect(previa.atributos).toEqual(carrera.atributos);
    expect(previa.medidores).toEqual(carrera.medidores);
    expect(previa.provincia).toBe(carrera.provincia);
  });
});
