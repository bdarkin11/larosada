import { describe, expect, it } from 'vitest';
import { crearAzar, siguiente } from './azar';
import {
  COSTO_EXILIO,
  EDAD_INICIAL,
  EDAD_LIMITE,
  elegirCarta,
  generarCartas,
  nuevaCarrera,
  probabilidadFinPorSalud,
  resolverDetencion,
  retirarse,
  salidasDisponibles,
  sortearRareza,
  aniosDelTurno,
} from './carrera';
import { UMBRAL_DENUNCIA, probabilidadDenuncia } from './justicia';
import { despejar } from './pruebas-util';
import { ATRIBUTOS } from './tipos';
import type { Carrera } from './tipos';

/** Un año: renueva con su partido si hay cierre de listas, no se presenta a elecciones y elige la carta. */
function jugarAnio(carrera: Carrera, carta: number): Carrera {
  return elegirCarta(despejar(carrera), carta);
}

function jugarHastaElFinal(carrera: Carrera): Carrera {
  let actual = carrera;
  let vueltas = 0;
  while (!actual.fin) {
    actual = jugarAnio(actual, 0);
    if (++vueltas > 200) throw new Error('La carrera no termina');
  }
  return actual;
}

describe('azar', () => {
  it('la misma semilla da la misma secuencia', () => {
    const a = crearAzar(42);
    const b = crearAzar(42);
    for (let i = 0; i < 20; i++) expect(siguiente(a)).toBe(siguiente(b));
  });
});

describe('nueva carrera', () => {
  it('arranca a los 18, de militante, con tres cartas distintas', () => {
    const carrera = nuevaCarrera({ semilla: 1 });
    expect(carrera.edad).toBe(EDAD_INICIAL);
    expect(carrera.cargo).toBe('militante');
    expect(carrera.cartas).toHaveLength(3);
    expect(new Set(carrera.cartas.map((c) => c.id)).size).toBe(3);
  });

  it('es reproducible con la misma semilla', () => {
    expect(nuevaCarrera({ semilla: 7 })).toEqual(nuevaCarrera({ semilla: 7 }));
  });

  it('respeta nombre y provincia elegidos', () => {
    const carrera = nuevaCarrera({ semilla: 3, nombre: '  Ana Paz ', provincia: 'Salta' });
    expect(carrera.nombre).toBe('Ana Paz');
    expect(carrera.provincia).toBe('Salta');
  });
});

describe('el paso del año', () => {
  it('elegir una carta pasa el turno hasta la próxima elección y deja la carrera anterior intacta', () => {
    const antes = nuevaCarrera({ semilla: 5 });
    const copia = structuredClone(antes);
    const despues = elegirCarta(antes, 1);
    expect(antes).toEqual(copia);
    const largo = aniosDelTurno(antes.anio);
    expect(largo).toBe(4);
    expect(despues.edad).toBe(antes.edad + largo);
    expect(despues.anio).toBe(antes.anio + largo);
    expect(despues.historial.at(-1)!.anio).toBe(antes.anio);
    expect(despues.historial.at(-1)!.lineas.length).toBeGreaterThan(antes.historial[0].lineas.length);
  });

  it('los atributos y medidores quedan dentro de sus límites toda la carrera', () => {
    for (let semilla = 0; semilla < 30; semilla++) {
      let carrera = nuevaCarrera({ semilla });
      while (!carrera.fin) {
        carrera = jugarAnio(carrera, semilla % 3);
        for (const atributo of ATRIBUTOS) {
          expect(carrera.atributos[atributo]).toBeGreaterThanOrEqual(1);
          expect(carrera.atributos[atributo]).toBeLessThanOrEqual(99);
        }
        for (const medidor of ['fama', 'imagen', 'causas'] as const) {
          expect(carrera.medidores[medidor]).toBeGreaterThanOrEqual(0);
          expect(carrera.medidores[medidor]).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('toda carrera termina, y nunca después de la edad límite', { timeout: 30000 }, () => {
    for (let semilla = 0; semilla < 100; semilla++) {
      const final = jugarHastaElFinal(nuevaCarrera({ semilla }));
      expect(final.fin).not.toBeNull();
      expect(final.edad).toBeLessThanOrEqual(EDAD_LIMITE);
      expect(final.cartas).toHaveLength(0);
    }
  });

  it('la mayoría de las carreras pasa los 60 años', { timeout: 30000 }, () => {
    let largas = 0;
    for (let semilla = 0; semilla < 200; semilla++) {
      if (jugarHastaElFinal(nuevaCarrera({ semilla })).edad >= 60) largas++;
    }
    expect(largas).toBeGreaterThan(150);
  });

  it('no se puede seguir jugando una carrera terminada', () => {
    const terminada = retirarse(nuevaCarrera({ semilla: 9 }));
    expect(terminada.fin?.motivo).toBe('retiro');
    expect(() => elegirCarta(terminada, 0)).toThrow();
  });
});

describe('la Justicia y los otros finales', () => {
  /** Avanza hasta que llegue una orden de detención, con causas altas todo el tiempo. */
  function hastaLaOrden(semilla: number, caja: number): Carrera {
    let carrera = nuevaCarrera({ semilla });
    for (let i = 0; i < 70; i++) {
      carrera.medidores.causas = 95;
      carrera = jugarAnio(carrera, 0);
      if (carrera.detencion) {
        carrera.medidores.caja = caja;
        return carrera;
      }
      if (carrera.fin) break;
    }
    throw new Error('No llegó la orden');
  }

  it('sin causas nadie te denuncia', () => {
    const carrera = nuevaCarrera({ semilla: 1 });
    carrera.medidores.causas = UMBRAL_DENUNCIA - 1;
    expect(probabilidadDenuncia(carrera)).toBe(0);
    carrera.medidores.causas = 90;
    expect(probabilidadDenuncia(carrera)).toBeGreaterThan(0);
  });

  it('con una orden pendiente no hay cartas ni se puede seguir sin resolverla', () => {
    const carrera = hastaLaOrden(21, 0);
    expect(carrera.cartas).toHaveLength(0);
    expect(() => elegirCarta(carrera, 0)).toThrow();
    expect(() => retirarse(carrera)).toThrow();
  });

  it('entregarse termina preso', () => {
    expect(resolverDetencion(hastaLaOrden(22, 0), 'entregarse').fin?.motivo).toBe('preso');
  });

  it('el exilio cuesta plata y sin plata no hay exilio', () => {
    const sinPlata = hastaLaOrden(23, COSTO_EXILIO - 1);
    expect(salidasDisponibles(sinPlata)).not.toContain('exilio');
    expect(() => resolverDetencion(sinPlata, 'exilio')).toThrow();

    const conPlata = hastaLaOrden(23, 100000);
    const exiliado = resolverDetencion(conPlata, 'exilio');
    expect(exiliado.fin?.motivo).toBe('exilio');
    expect(exiliado.medidores.caja).toBe(100000 - COSTO_EXILIO);
  });

  it('pelear en la Justicia a veces sale bien y a veces termina preso', () => {
    const resultados = new Set<string>();
    for (let semilla = 0; semilla < 60; semilla++) {
      const final = resolverDetencion(hastaLaOrden(semilla, 50000), 'pelear');
      resultados.add(final.fin ? final.fin.motivo : 'zafo');
      if (!final.fin) {
        expect(final.cartas).toHaveLength(3);
        expect(final.detencion).toBe(false);
      }
    }
    expect(resultados).toEqual(new Set(['zafo', 'preso']));
  });

  it('se puede dejar la política para ir al sector privado', () => {
    expect(retirarse(nuevaCarrera({ semilla: 4 }), 'privado').fin?.motivo).toBe('privado');
  });
});

describe('cartas y salud', () => {
  it('la icónica no sale antes de los 25', () => {
    const azar = crearAzar(11);
    for (let i = 0; i < 5000; i++) expect(sortearRareza(azar, 20)).not.toBe('iconica');
  });

  it('las rarezas salen en proporciones razonables', () => {
    const azar = crearAzar(12);
    const cuenta = { comun: 0, rara: 0, dorada: 0, iconica: 0 };
    for (let i = 0; i < 20000; i++) cuenta[sortearRareza(azar, 30)]++;
    expect(cuenta.comun / 20000).toBeGreaterThan(0.65);
    expect(cuenta.rara / 20000).toBeGreaterThan(0.18);
    expect(cuenta.dorada / 20000).toBeGreaterThan(0.04);
    expect(cuenta.iconica).toBeGreaterThan(0);
  });

  it('siempre salen tres cartas distintas', () => {
    const azar = crearAzar(13);
    for (let i = 0; i < 500; i++) {
      expect(new Set(generarCartas(azar, 40).map((c) => c.id)).size).toBe(3);
    }
  });

  it('más territorio, menos riesgo de que la salud te saque', () => {
    expect(probabilidadFinPorSalud(50, 50)).toBe(0);
    expect(probabilidadFinPorSalud(75, 80)).toBeLessThan(probabilidadFinPorSalud(75, 20));
    expect(probabilidadFinPorSalud(85, 50)).toBeGreaterThan(probabilidadFinPorSalud(70, 50));
  });
});
