import { describe, expect, it } from 'vitest';
import { nuevaCarrera } from './carrera';
import { anioDeLasCrisis, eventoDeCrisis, PREMIO_SALIDA } from './crisis';
import { vencerMandato } from './elecciones';
import { resolverEvento, sortearEvento } from './eventos';
import { recibirPais } from './pais';
import type { Carrera } from './tipos';

function presidente(semilla = 7): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', ideologia: { economia: 0, social: 0 } });
  Object.assign(c, { anio: 2031, edad: 50, cargo: 'presidente' as const, mandatoHasta: 2035, mandatosSeguidos: 1 });
  Object.assign(c.medidores, { caja: 100_000, fama: 70, poder: 50, imagen: 50 });
  recibirPais(c);
  Object.assign(c.pais!, { inflacion: 40, actividad: 50, reservas: 40 });
  return c;
}

describe('las crisis', () => {
  it('sin reservas empieza la corrida, y al año siguiente pesa', () => {
    const c = presidente();
    c.pais!.reservas = 15;
    const lineas = anioDeLasCrisis(c);
    expect(c.crisis?.map((x) => x.id)).toEqual(['corrida']);
    expect(lineas.join(' ')).toMatch(/Empezó una crisis: corrida cambiaria/);
    const inflacion = c.pais!.inflacion;
    const imagen = c.medidores.imagen;
    anioDeLasCrisis(c);
    expect(c.pais!.inflacion).toBe(inflacion + 20);
    expect(c.medidores.imagen).toBeLessThan(imagen);
  });

  it('con la calle en 80 hay estallido; con la inflación arriba de 200, hiper', () => {
    const c = presidente();
    c.malestar = 85;
    c.pais!.inflacion = 250;
    anioDeLasCrisis(c);
    expect(c.crisis?.map((x) => x.id).sort()).toEqual(['estallido', 'hiper']);
  });

  it('si el país se recupera, la crisis se termina sola y da poder', () => {
    const c = presidente();
    c.crisis = [{ id: 'corrida', desde: 2030 }];
    c.pais!.reservas = 35;
    const poder = c.medidores.poder;
    const lineas = anioDeLasCrisis(c);
    expect(c.crisis).toBeUndefined();
    expect(c.medidores.poder).toBeGreaterThan(poder);
    expect(lineas.join(' ')).toMatch(new RegExp(`Poder \\+${PREMIO_SALIDA}`));
    expect(c.palmares.some((l) => l.texto === 'Saliste de la crisis: Corrida cambiaria')).toBe(true);
  });

  it('con una crisis abierta, la decisión del año es cómo salir', () => {
    const c = presidente();
    c.crisis = [{ id: 'hiper', desde: 2030 }];
    expect(eventoDeCrisis(c)?.id).toBe('crisis-hiper');
    // Salvo que te cobren un favor o haya paro, que van antes.
    c.favores = [];
    c.malestar = 0;
    expect(sortearEvento(c)?.id).toBe('crisis-hiper');
  });

  it('una salida que sale bien corta la crisis; si sale mal, sigue', () => {
    let cortadas = 0;
    let siguen = 0;
    for (let semilla = 1; semilla <= 20; semilla++) {
      const c = presidente(semilla);
      c.crisis = [{ id: 'corrida', desde: 2030 }];
      c.evento = { id: 'crisis-corrida', nombre: 'Alguien', semillaRetrato: 1 };
      const { carrera, desenlace } = resolverEvento(c, 2);
      if (desenlace.salioBien) {
        cortadas++;
        expect(carrera.crisis).toBeUndefined();
        expect(desenlace.texto).toMatch(/se terminó la crisis/);
      } else {
        siguen++;
        expect(carrera.crisis?.[0].id).toBe('corrida');
      }
    }
    expect(cortadas).toBeGreaterThan(0);
    expect(siguen).toBeGreaterThan(0);
  });

  it('solo el presidente tiene crisis, y se van con el mandato', () => {
    const c = presidente();
    c.crisis = [{ id: 'default', desde: 2030 }];
    c.anio = c.mandatoHasta!;
    const lineas: string[] = [];
    vencerMandato(c, lineas);
    expect(c.crisis).toBeUndefined();
    expect(lineas.join(' ')).toMatch(/plena crisis/);
    c.crisis = [{ id: 'default', desde: 2030 }];
    expect(anioDeLasCrisis(c)).toEqual([]);
    expect(c.crisis).toBeUndefined();
  });
});
