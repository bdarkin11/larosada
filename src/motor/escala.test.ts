import { describe, expect, it } from 'vitest';
import { buscarItem, precioPorLoQueDa } from '../datos/tienda';
import { elegirCarta, nuevaCarrera } from './carrera';
import { TOPE_GANANCIA, costoProporcional, gananciaProporcional, gastoDeEstructura } from './escala';
import { conRendimiento } from './ficha';
import { despejar } from './pruebas-util';
import type { Carrera } from './tipos';

function con(caja: number, cargo: Carrera['cargo'] = 'militante'): Carrera {
  const c = nuevaCarrera({ semilla: 9, provincia: 'Buenos Aires' });
  c.medidores.caja = caja;
  c.cargo = cargo;
  return c;
}

describe('la plata a escala', () => {
  it('un costo es un porcentaje de la caja, con un piso en sueldos', () => {
    expect(costoProporcional(con(200_000), 0.08)).toBe(16_000);
    // Sin plata, el piso: 8 % de cuatro sueldos de militante.
    expect(costoProporcional(con(0), 0.08)).toBe(1_900);
  });

  it('una ganancia es un porcentaje de la caja, hasta US$ 40.000', () => {
    expect(gananciaProporcional(con(100_000), 0.2)).toBe(20_000);
    expect(gananciaProporcional(con(1_000_000), 0.2)).toBe(TOPE_GANANCIA);
    expect(gananciaProporcional(con(1_000_000), 0.2, 1.5)).toBe(TOPE_GANANCIA);
  });

  it('sostener la estructura cuesta un fijo y el 3 % de la caja', () => {
    expect(gastoDeEstructura(con(100_000))).toBe(4_500 + 3_000);
    expect(gastoDeEstructura(con(-5_000))).toBe(4_500);
  });

  it('el año descuenta la estructura del sueldo', () => {
    const c = despejar(con(100_000));
    const despues = elegirCarta(
      c,
      c.cartas.findIndex((x) => x.id !== 'colecta'),
    );
    expect(despues.historial.at(-1)!.lineas.join(' ')).toMatch(/estructura −US\$ 7\.500/);
  });
});

describe('rendimientos decrecientes', () => {
  it('subir rinde más si estás abajo, y perder duele más si estás arriba', () => {
    expect(conRendimiento(20, 6)).toBe(9);
    expect(conRendimiento(50, 6)).toBe(6);
    expect(conRendimiento(80, 6)).toBe(3);
    expect(conRendimiento(20, -6)).toBe(-4);
    expect(conRendimiento(80, -6)).toBe(-8);
    expect(conRendimiento(99, 1)).toBe(1);
  });
});

describe('la tienda', () => {
  it('el precio de una mejora sale de lo que da', () => {
    // Imagen +1 por año, ocho años, a US$ 3.000 el punto.
    expect(buscarItem('asesor-imagen').costo).toBe(24_000);
    // Construcción +1 por año vale 1,5 puntos.
    expect(buscarItem('armador').costo).toBe(36_000);
    // Un consumible cuenta solo los años que dura.
    expect(buscarItem('redes').costo).toBe(6_000);
    const doble = precioPorLoQueDa({ id: 'x', seccion: 'equipo', nombre: '', descripcion: '', icono: '', anual: { imagen: 2 } });
    expect(doble).toBe(2 * buscarItem('asesor-imagen').costo);
  });
});
