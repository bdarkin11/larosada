import { describe, expect, it } from 'vitest';
import { COSTO_EXILIO, elegirCarta, nuevaCarrera, resolverDetencion, salidasDisponibles } from './carrera';
import { costoCampania, elegirCampania, elegirCandidatura, motivoSinCampania, resolverInterna } from './elecciones';
import { resolverEvento } from './eventos';
import { avanzarJusticia, hacerMovida, manosLimpias, motivoSinMovida, moverProceso } from './justicia';
import type { Carrera } from './tipos';

function base(semilla = 8): Carrera {
  const c = nuevaCarrera({ semilla, provincia: 'Buenos Aires', estilo: 'transa' });
  Object.assign(c, { anio: 2031, edad: 45, construccion: 60, mejorRango: 4 });
  Object.assign(c.medidores, { fama: 60, caja: 200_000 });
  return c;
}

/** Repite la Justicia de un año hasta que pase algo, con causas altas. */
function hastaQue(c: Carrera, condicion: (c: Carrera) => boolean, causas = 90): Carrera {
  for (let i = 0; i < 200 && !condicion(c); i++) {
    c.medidores.causas = causas;
    delete c.evento;
    avanzarJusticia(c);
  }
  return c;
}

describe('la causa avanza por etapas', () => {
  it('con causas altas, de la denuncia al pedido de detención', () => {
    const c = base();
    c.cargo = 'militante';
    const etapas = new Set<string>();
    for (let i = 0; i < 200 && !c.detencion; i++) {
      c.medidores.causas = 90;
      avanzarJusticia(c);
      if (c.proceso) etapas.add(c.proceso.etapa);
      if (c.evento?.id === 'citacion-indagatoria') delete c.evento;
    }
    expect([...etapas]).toEqual(['denuncia', 'imputacion', 'indagatoria', 'procesamiento']);
    expect(c.detencion).toBe(true);
  });

  it('en la indagatoria te citan con la alerta', () => {
    const c = hastaQue(base(), (x) => x.evento?.id === 'citacion-indagatoria');
    expect(c.proceso!.etapa).toBe('indagatoria');
  });

  it('con fueros, antes de la detención se vota el desafuero', () => {
    const c = base();
    c.cargo = 'diputado';
    c.proceso = { etapa: 'procesamiento', desde: 2030 };
    hastaQue(c, (x) => x.evento?.id === 'desafuero' || !!x.detencion);
    expect(c.evento?.id).toBe('desafuero');
    expect(c.detencion).toBeFalsy();
  });

  it('sin fueros, el fiscal que te estaba esperando pide la detención', () => {
    const c = base();
    c.cargo = 'militante';
    c.proceso = { etapa: 'procesamiento', desde: 2030 };
    hastaQue(c, (x) => !!x.detencion);
    expect(c.detencion).toBe(true);
  });

  it('si las causas bajan, la causa se archiva', () => {
    const c = base();
    c.proceso = { etapa: 'denuncia', desde: 2030 };
    hastaQue(c, (x) => !x.proceso, 5);
    expect(c.proceso).toBeUndefined();
    expect(c.palmares.some((l) => l.texto === 'Sobreseído')).toBe(true);
  });

  it('perder el desafuero termina en orden de detención', () => {
    let c = base();
    c.cargo = 'diputado';
    c.proceso = { etapa: 'procesamiento', desde: 2030 };
    c.evento = { id: 'desafuero', semillaRetrato: 1 };
    c = resolverEvento(c, 1).carrera; // renunciar a los fueros
    expect(c.detencion).toBe(true);
    expect(() => elegirCarta(c, 0)).toThrow();
  });

  it('el arrepentido archiva su causa, pero lo paga caro', () => {
    let c = base();
    c.coimas = 2;
    c.proceso = { etapa: 'indagatoria', desde: 2030 };
    c.evento = { id: 'citacion-indagatoria', semillaRetrato: 1 };
    c = resolverEvento(c, 3).carrera;
    expect(c.proceso).toBeUndefined();
    expect(c.construccion).toBeLessThan(60);
  });

  it('mover la causa hacia atrás desde la denuncia la archiva', () => {
    const c = base();
    c.proceso = { etapa: 'denuncia', desde: 2030 };
    moverProceso(c, 'retroceder');
    expect(c.proceso).toBeUndefined();
  });
});

describe('caja negra', () => {
  it('las movidas se pagan en negro, una vez por año, y el idealista no puede', () => {
    const c = base();
    c.cajaNegra = 100_000;
    const { carrera } = hacerMovida(c, 'comprar-tapa');
    expect(carrera.cajaNegra).toBe(85_000);
    expect(carrera.medidores.fama).toBeGreaterThan(c.medidores.fama);
    expect(motivoSinMovida(carrera, 'comprar-tapa')).toMatch(/este año/);
    const idealista = base();
    idealista.estilo = 'idealista';
    idealista.cajaNegra = 100_000;
    expect(motivoSinMovida(idealista, 'comprar-tapa')).toMatch(/idealista/);
  });

  it('lavar pasa plata a la caja blanca, con pérdida', () => {
    const c = base();
    c.cajaNegra = 80_000;
    const { carrera } = hacerMovida(c, 'lavar');
    expect(carrera.cajaNegra).toBe(30_000);
    expect(carrera.medidores.caja).toBe(c.medidores.caja + 35_000);
  });

  it('la campaña con plata negra rinde más y suma causas', () => {
    let c = base();
    c.cajaNegra = 0;
    c.eleccion = { fase: 'candidatura' };
    c = elegirCandidatura(c, 'concejal');
    if (c.eleccion?.fase === 'interna') c = resolverInterna(c, 'romper');
    expect(motivoSinCampania(c, 'concejal', 'negra')).toMatch(/negra/);
    c.cajaNegra = 100_000;
    const despues = elegirCampania(c, 'negra');
    expect(despues.cajaNegra).toBe(100_000 - costoCampania(c, 'concejal', 'negra'));
    expect(despues.medidores.causas).toBeGreaterThan(c.medidores.causas);
    expect(manosLimpias(despues)).toBe(false);
  });

  it('el exilio se paga primero con plata negra, y preso te la decomisan', () => {
    const c = base();
    c.detencion = true;
    c.medidores.caja = 0;
    c.cajaNegra = COSTO_EXILIO + 5000;
    expect(salidasDisponibles(c)).toContain('exilio');
    const exiliado = resolverDetencion(c, 'exilio');
    expect(exiliado.cajaNegra).toBe(5000);
    const preso = resolverDetencion(c, 'entregarse');
    expect(preso.cajaNegra).toBe(0);
    expect(preso.historial[0].lineas.join(' ')).toMatch(/decomisaron/);
  });
});

describe('manos limpias', () => {
  it('sin coimas ni plata negra, los carpetazos no prenden', () => {
    const limpio = base();
    limpio.medidores.causas = 20;
    limpio.evento = { id: 'investigacion-alcorta', semillaRetrato: 1 };
    expect(manosLimpias(limpio)).toBe(true);
    const sucio = structuredClone(limpio);
    sucio.coimas = 3;
    const a = resolverEvento(limpio, 1); // no contestar
    const b = resolverEvento(sucio, 1);
    expect(a.carrera.medidores.causas).toBe(20);
    expect(b.carrera.medidores.causas).toBeGreaterThan(20);
    expect(a.carrera.medidores.imagen).toBeGreaterThan(b.carrera.medidores.imagen);
    expect(a.desenlace.texto).toMatch(/manos limpias/);
  });

  it('una coima te saca las manos limpias', () => {
    let c = base();
    c.evento = { id: 'coima-obra', semillaRetrato: 1 };
    c = resolverEvento(c, 0).carrera;
    expect(manosLimpias(c)).toBe(false);
    expect(c.cajaNegra).toBeGreaterThan(0);
  });
});
