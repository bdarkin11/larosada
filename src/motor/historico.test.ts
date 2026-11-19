import { beforeEach, describe, expect, it } from 'vitest';
import { mejoresCarreras, registrarCarrera } from '../historicos';
import { nuevaCarrera } from './carrera';
import { vencerMandato } from './elecciones';
import { anotarHistorico } from './ficha';
import { MULTIPLICADOR_LIMPIAS, PUNTOS, cargoMaximo, poderHistorico } from './historico';
import { recibirPais } from './pais';
import type { Carrera, FilaTrayectoria } from './tipos';

function carrera(semilla = 3): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires' });
  c.palmares = [];
  c.medidores.causas = 0;
  c.construccion = 10;
  return c;
}

const fila = (c: Carrera, cargo: FilaTrayectoria['cargo']): FilaTrayectoria => ({ ...c.trayectoria[0], cargo, anio: 2030, edad: 40 });

describe('el Poder Histórico', () => {
  it('suma años en cargos según el rango, y las manos limpias multiplican', () => {
    const c = carrera();
    c.trayectoria = [fila(c, 'concejal'), fila(c, 'concejal'), fila(c, 'presidente')];
    const ph = poderHistorico(c);
    // Concejal rango 2 y presidente rango 6: (2 + 2 + 6) × 1,5 = 15.
    expect(ph.partes.find((p) => p.texto.startsWith('Años en cargos'))?.valor).toBe(15);
    expect(ph.multiplicador).toBe(MULTIPLICADOR_LIMPIAS);
    expect(ph.total).toBe(Math.round(ph.subtotal * MULTIPLICADOR_LIMPIAS));
    expect(cargoMaximo(c)).toBe('presidente');
  });

  it('cuenta leyes, crisis, promesas, distritos y cómo dejaste el país', () => {
    const c = carrera();
    c.trayectoria = [];
    c.leyes = ['ley-alquileres', 'ley-licencias'];
    anotarHistorico(c, 'crisisSuperadas');
    anotarHistorico(c, 'promesasCumplidas');
    anotarHistorico(c, 'paisNotas', 4);
    anotarHistorico(c, 'distritoNotas', -2);
    c.promesasRotas = [2030];
    const valor = (inicio: string) => poderHistorico(c).partes.find((p) => p.texto.startsWith(inicio))?.valor;
    expect(valor('Leyes')).toBe(2 * PUNTOS.ley);
    expect(valor('Crisis')).toBe(PUNTOS.crisis);
    expect(valor('Promesas cumplidas')).toBe(PUNTOS.promesaCumplida);
    expect(valor('Promesas rotas')).toBe(PUNTOS.promesaRota);
    expect(valor('Cómo dejaste el país')).toBe(4 * PUNTOS.pais);
    expect(valor('Cómo dejaste tus distritos')).toBe(-2 * PUNTOS.distrito);
  });

  it('las coimas y la cárcel lo achican; que te destituyan resta', () => {
    const c = carrera();
    c.trayectoria = Array.from({ length: 8 }, () => fila(c, 'presidente'));
    c.coimas = 2;
    expect(poderHistorico(c).multiplicador).toBe(0.81);
    c.fin = { motivo: 'preso', anio: 2040, edad: 60 };
    expect(poderHistorico(c).multiplicador).toBeCloseTo(0.41, 2);
    c.coimas = 0;
    c.fin = { motivo: 'destituido', anio: 2040, edad: 60 };
    expect(poderHistorico(c).partes.some((p) => p.texto === 'Te destituyeron' && p.valor === -100)).toBe(true);
  });

  it('nunca da negativo', () => {
    const c = carrera();
    c.medidores.causas = 90;
    c.fin = { motivo: 'caos', anio: 2040, edad: 60 };
    expect(poderHistorico(c).total).toBe(0);
  });

  it('al dejar la presidencia quedan el mandato y cómo dejaste el país', () => {
    const c = carrera();
    Object.assign(c, { anio: 2035, cargo: 'presidente' as const, mandatoHasta: 2035, mandatosSeguidos: 1 });
    recibirPais(c);
    Object.assign(c.pais!, { inflacion: 10, actividad: 60, reservas: 50, recibido: { inflacion: 80, actividad: 40, reservas: 20 } });
    vencerMandato(c, []);
    expect(c.historico?.mandatosPresidente).toBe(1);
    expect(c.historico?.paisNotas?.[0]).toBe(8);
    expect(poderHistorico(c).partes.find((p) => p.texto.startsWith('Mandatos'))?.valor).toBe(PUNTOS.mandatoPresidente);
  });
});

describe('las mejores carreras', () => {
  beforeEach(() => {
    const datos = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
      clear: () => datos.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('se ordenan por Poder Histórico, una sola vez cada una, y quedan diez', () => {
    for (let semilla = 1; semilla <= 12; semilla++) {
      const c = carrera(semilla);
      c.trayectoria = Array.from({ length: semilla }, () => fila(c, 'diputado'));
      c.fin = { motivo: 'retiro', anio: 2050, edad: 60 };
      registrarCarrera(c);
      registrarCarrera(c);
    }
    const tabla = mejoresCarreras();
    expect(tabla).toHaveLength(10);
    expect(tabla[0].puntos).toBeGreaterThanOrEqual(tabla[9].puntos);
    expect(new Set(tabla.map((x) => x.id)).size).toBe(10);
  });

  it('dice en qué puesto quedaste, o que no entraste', () => {
    const c = carrera(99);
    c.trayectoria = Array.from({ length: 30 }, () => fila(c, 'presidente'));
    c.fin = { motivo: 'retiro', anio: 2060, edad: 70 };
    expect(registrarCarrera(c).puesto).toBe(1);
  });
});
