import { CARGOS } from '../datos/cargos';
import { APELLIDOS, NOMBRES } from '../datos/provincias';
import { chance, elegir, entero } from './azar';
import { acotar, anotar, aplicar, construccionReal, diferencias, moverConstruccion, registrarLogro, textoCantidad } from './ficha';
import { costoProporcional } from './escala';
import { factorImpunidad } from './poder';
import { romperPromesas } from './promesas';
import { ETAPAS_JUDICIALES } from './tipos';
import type { Carrera, EtapaJudicial } from './tipos';

export const NOMBRE_ETAPA_JUDICIAL: Record<EtapaJudicial, string> = {
  denuncia: 'Denunciado',
  imputacion: 'Imputado',
  indagatoria: 'Citado a indagatoria',
  procesamiento: 'Procesado',
};

/** Desde cuántas causas un fiscal puede abrirte una. */
export const UMBRAL_DENUNCIA = 30;

export const tieneFueros = (carrera: Carrera) => CARGOS[carrera.cargo].fueros;

/** Nunca aceptaste una coima ni usaste plata negra. */
export const manosLimpias = (carrera: Carrera) => !carrera.negroUsado && !carrera.coimas;

/** Cada coima deja un rastro que no se borra: las causas no bajan de este piso. */
export const RASTRO_POR_COIMA = 10;
export const pisoDeCausas = (carrera: Carrera) => Math.min(60, (carrera.coimas ?? 0) * RASTRO_POR_COIMA + (carrera.negroUsado ? 5 : 0));

/** Durante cuatro años después de dejar la Rosada, los jueces se animan. */
export const ANIOS_JUECES_ANIMADOS = 4;
export const FACTOR_EXPRESIDENTE = 1.5;

/** Con mucho poder, todo va más lento: impunidad. Sin el sillón, todo se acelera. */
const factorJusticia = (carrera: Carrera) => {
  const ex = carrera.expresidente !== undefined && carrera.anio - carrera.expresidente < ANIOS_JUECES_ANIMADOS && !manosLimpias(carrera);
  return factorImpunidad(carrera) * (ex ? FACTOR_EXPRESIDENTE : 1);
};

export function probabilidadDenuncia(carrera: Carrera): number {
  const { causas } = carrera.medidores;
  if (causas < UMBRAL_DENUNCIA) return 0;
  return acotar(((causas - 25) / 100) * factorJusticia(carrera), 0, 0.8);
}

/** Chance por año de que la causa pase a la etapa siguiente. */
export function probabilidadAvance(carrera: Carrera): number {
  if (!carrera.proceso) return 0;
  return acotar((carrera.medidores.causas / 120) * factorJusticia(carrera), 0, 0.9);
}

/** Chance por año de que la causa se archive porque no hay nada. */
export function probabilidadArchivo(carrera: Carrera): number {
  if (!carrera.proceso) return 0;
  const { causas } = carrera.medidores;
  return causas < 20 ? 0.5 : causas < 35 ? 0.15 : 0;
}

/** El evento judicial que se fuerza, si no hay otro más urgente. */
function citar(carrera: Carrera, id: 'citacion-indagatoria' | 'desafuero') {
  carrera.evento = {
    id,
    nombre: `${elegir(carrera.azar, NOMBRES)} ${elegir(carrera.azar, APELLIDOS)}`,
    semillaRetrato: entero(carrera.azar, 1, 1_000_000),
  };
}

/**
 * Una vez por año: se abren, avanzan o se archivan las causas. Al final del
 * camino está el pedido de detención; con fueros, antes hay que votar el desafuero.
 */
export function avanzarJusticia(carrera: Carrera) {
  const p = carrera.proceso;
  if (!p) {
    if (chance(carrera.azar, probabilidadDenuncia(carrera))) {
      carrera.proceso = { etapa: 'denuncia', desde: carrera.anio };
      anotar(carrera, ['Un fiscal abrió una causa en tu contra.']);
    }
    return;
  }
  if (chance(carrera.azar, probabilidadArchivo(carrera))) {
    delete carrera.proceso;
    anotar(carrera, ['La causa en tu contra se archivó: no encontraron nada.']);
    registrarLogro(carrera, '⚖️', 'Sobreseído');
    return;
  }
  if (!chance(carrera.azar, probabilidadAvance(carrera))) return;

  switch (p.etapa) {
    case 'denuncia':
      p.etapa = 'imputacion';
      anotar(carrera, ['Te imputaron en la causa.']);
      return;
    case 'imputacion':
      p.etapa = 'indagatoria';
      citar(carrera, 'citacion-indagatoria');
      return;
    case 'indagatoria':
      p.etapa = 'procesamiento';
      anotar(carrera, ['El juez te procesó.']);
      return;
    case 'procesamiento':
      if (tieneFueros(carrera)) {
        citar(carrera, 'desafuero');
      } else {
        carrera.detencion = true;
        carrera.cartas = [];
        delete carrera.evento;
        anotar(carrera, ['El fiscal pidió tu detención. Sin fueros, no hay nada que te proteja.']);
      }
  }
}

/** Mueve la causa: atrás, adelante, la archiva o termina en detención. */
export function moverProceso(carrera: Carrera, hacia: 'retroceder' | 'avanzar' | 'archivar' | 'detencion') {
  if (hacia === 'archivar') {
    delete carrera.proceso;
    return;
  }
  if (hacia === 'detencion') {
    carrera.detencion = true;
    carrera.cartas = [];
    return;
  }
  const p = carrera.proceso;
  if (!p) {
    if (hacia === 'avanzar') carrera.proceso = { etapa: 'denuncia', desde: carrera.anio };
    return;
  }
  const i = ETAPAS_JUDICIALES.indexOf(p.etapa) + (hacia === 'avanzar' ? 1 : -1);
  if (i < 0) delete carrera.proceso;
  else p.etapa = ETAPAS_JUDICIALES[Math.min(i, ETAPAS_JUDICIALES.length - 1)];
}

/* Por debajo de la mesa */

export interface Movida {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  costo: (c: Carrera) => number;
}

export const MOVIDAS: Movida[] = [
  {
    id: 'aceitar-fiscal',
    icono: '🗂️',
    nombre: 'Aceitar a un fiscal',
    descripcion: 'Que la causa duerma un tiempo. Si el fiscal no se presta, te denuncia.',
    costo: (c) => Math.round(20000 * (1 + CARGOS[c.cargo].rango / 2)),
  },
  {
    id: 'comprar-tapa',
    icono: '📰',
    nombre: 'Comprar una tapa',
    descripcion: 'Fama +3 e Imagen +2. Causas +3. Cuesta el 15 % de tu caja negra.',
    costo: (c) => costoProporcional(c, 0.15, c.cajaNegra),
  },
  {
    id: 'pagar-punteros',
    icono: '🚌',
    nombre: 'Pagar a los punteros',
    descripcion: 'Territorio +3 y Construcción +3. Causas +3. Cuesta el 10 % de tu caja negra.',
    costo: (c) => costoProporcional(c, 0.1, c.cajaNegra),
  },
  {
    id: 'lavar',
    icono: '🧺',
    nombre: 'Lavar plata',
    descripcion: 'Pasás hasta US$ 50.000 de la caja negra a la blanca, y te quedás con el 70 %. Causas +4.',
    costo: () => 5000,
  },
];

export function motivoSinMovida(carrera: Carrera, id: string): string | null {
  const m = MOVIDAS.find((x) => x.id === id)!;
  if (carrera.estilo === 'idealista') return 'Tu estilo idealista no te deja.';
  if (carrera.fin || carrera.detencion || carrera.evento || carrera.eleccion || carrera.pases || carrera.entrevista) return 'Ahora no.';
  if (carrera.movidas[id] === carrera.anio) return 'Ya lo hiciste este año.';
  if (carrera.cajaNegra < m.costo(carrera)) return 'No te alcanza la caja negra.';
  return null;
}

/** Una movida por debajo de la mesa, pagada con plata negra. */
export function hacerMovida(anterior: Carrera, id: string): { carrera: Carrera; texto: string; salioBien?: boolean } {
  const motivo = motivoSinMovida(anterior, id);
  if (motivo) throw new Error(motivo);
  const m = MOVIDAS.find((x) => x.id === id)!;
  const carrera = structuredClone(anterior);
  carrera.movidas[id] = carrera.anio;
  carrera.negroUsado = true;
  let texto = '';
  let salioBien: boolean | undefined;

  if (id === 'lavar') {
    const monto = Math.min(carrera.cajaNegra, 50000);
    carrera.cajaNegra -= monto;
    aplicar(carrera, 'caja', Math.round(monto * 0.7));
    aplicar(carrera, 'causas', 4);
    texto = `Lavaste US$ ${monto.toLocaleString('es-AR')} de la caja negra (${textoCantidad('caja', Math.round(monto * 0.7))}, Causas +4).`;
  } else {
    const costo = m.costo(carrera);
    carrera.cajaNegra -= costo;
    if (id === 'aceitar-fiscal') {
      if (!carrera.proceso) {
        aplicar(carrera, 'causas', -8);
        texto = 'Aceitaste a un fiscal amigo: las causas se enfrían (Causas −8).';
      } else {
        salioBien = chance(carrera.azar, acotar(0.55 + carrera.atributos.rosca / 400, 0, 0.85));
        if (salioBien) {
          moverProceso(carrera, 'retroceder');
          aplicar(carrera, 'causas', -10);
          texto = 'El fiscal aceptó y la causa retrocedió (Causas −10).';
        } else {
          aplicar(carrera, 'causas', 15);
          aplicar(carrera, 'poder', -5);
          texto = 'El fiscal no se prestó y te denunció por intento de soborno (Causas +15, Poder −5).';
        }
      }
    } else if (id === 'comprar-tapa') {
      aplicar(carrera, 'fama', 3);
      aplicar(carrera, 'imagen', 2);
      aplicar(carrera, 'causas', 3);
      texto = 'Compraste una tapa favorable (Fama +3, Imagen +2, Causas +3).';
    } else if (id === 'pagar-punteros') {
      aplicar(carrera, 'territorio', 3);
      const suma = construccionReal(carrera, 3);
      moverConstruccion(carrera, suma);
      aplicar(carrera, 'causas', 3);
      texto = `Pagaste a los punteros del barrio (Territorio +3, Construcción +${suma}, Causas +3).`;
    }
    texto = `${texto.slice(0, -1)}, con US$ ${costo.toLocaleString('es-AR')} en negro.`;
  }
  anotar(carrera, [`Por debajo de la mesa: ${texto}`, ...romperPromesas(carrera, { coima: true })]);
  carrera.cambios = diferencias(anterior, carrera);
  return { carrera, texto, salioBien };
}

/** Al quedar preso, la plata negra que encuentran se decomisa. */
export function decomisar(carrera: Carrera): string | null {
  if (!carrera.cajaNegra) return null;
  const monto = carrera.cajaNegra;
  carrera.cajaNegra = 0;
  return `Te decomisaron US$ ${monto.toLocaleString('es-AR')} de plata negra.`;
}
