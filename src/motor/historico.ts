import { CARGOS } from '../datos/cargos';
import { etapaDe } from './ficha';
import { manosLimpias } from './justicia';
import type { CargoId, Carrera, EtapaId, MotivoFin } from './tipos';

/**
 * El Poder Histórico: el puntaje de toda la carrera. Suma cargos, años en el
 * poder, leyes, cómo dejaste el país y tus distritos, crisis superadas y
 * promesas cumplidas; resta promesas rotas y causas; y lo multiplica tu honestidad.
 */

export const PUNTOS = {
  /** Por cada año en un cargo, multiplicado por su rango (presidente, 6 × 1,5 = 9 por año). */
  anioPorRango: 1.5,
  mandatoPresidente: 80,
  reelecto: 40,
  ley: 15,
  /** Por cada punto de cómo dejaste el país (de −8 a +8). */
  pais: 7.5,
  /** Por cada punto de la nota de gestión de un distrito. */
  distrito: 5,
  crisis: 25,
  promesaCumplida: 10,
  promesaRota: -15,
  logro: 5,
  causa: -1,
  /** Por cada punto de crecimiento de un delfín que sigue con vos, dividido 4. */
  delfin: 0.25,
  traicion: -10,
};

export const PUNTOS_ETAPA: Record<EtapaId, number> = { desconocido: 0, conocido: 0, referente: 20, caudillo: 50, procer: 100 };

/** Lo que resta un final que no elegiste. */
export const PUNTOS_FINAL: Partial<Record<MotivoFin, number>> = { destituido: -100, caos: -150, renuncia: -50 };
/** Lo que multiplica un final en la cárcel o afuera. */
export const MULTIPLICADOR_FINAL: Partial<Record<MotivoFin, number>> = { preso: 0.5, exilio: 0.6 };
export const MULTIPLICADOR_LIMPIAS = 1.25;
export const MULTIPLICADOR_COIMA = 0.9;
export const PISO_MULTIPLICADOR = 0.5;

export interface Parte {
  texto: string;
  valor: number;
}

export interface PoderHistorico {
  partes: Parte[];
  /** Antes del multiplicador. */
  subtotal: number;
  multiplicador: number;
  motivoMultiplicador: string;
  total: number;
}

/** El cargo más alto que tuviste, por rango. */
export function cargoMaximo(c: Carrera): CargoId {
  let max: CargoId = c.cargo;
  for (const f of c.trayectoria) if (CARGOS[f.cargo].rango > CARGOS[max].rango) max = f.cargo;
  return max;
}

export function poderHistorico(c: Carrera): PoderHistorico {
  const h = c.historico ?? {};
  const partes: Parte[] = [];
  const sumar = (texto: string, valor: number) => {
    if (Math.round(valor)) partes.push({ texto, valor: Math.round(valor) });
  };

  const aniosConCargo = c.trayectoria.filter((f) => CARGOS[f.cargo].rango > 0);
  sumar(
    `Años en cargos (${aniosConCargo.length})`,
    aniosConCargo.reduce((s, f) => s + CARGOS[f.cargo].rango * PUNTOS.anioPorRango, 0),
  );
  const mandatos = h.mandatosPresidente ?? 0;
  sumar(`Mandatos completos de presidente (${mandatos})`, mandatos * PUNTOS.mandatoPresidente);
  if (mandatos >= 2) sumar('Reelecto presidente', PUNTOS.reelecto);
  const leyes = c.leyes?.length ?? 0;
  sumar(`Leyes aprobadas (${leyes})`, leyes * PUNTOS.ley);
  const pais = (h.paisNotas ?? []).reduce((s, n) => s + n, 0);
  sumar(pais >= 0 ? 'Cómo dejaste el país' : 'Cómo dejaste el país (peor que como lo recibiste)', pais * PUNTOS.pais);
  const distritos = h.distritoNotas ?? [];
  sumar(`Cómo dejaste tus distritos (${distritos.length})`, distritos.reduce((s, n) => s + n, 0) * PUNTOS.distrito);
  sumar(`Crisis superadas (${h.crisisSuperadas ?? 0})`, (h.crisisSuperadas ?? 0) * PUNTOS.crisis);
  sumar(`Promesas cumplidas (${h.promesasCumplidas ?? 0})`, (h.promesasCumplidas ?? 0) * PUNTOS.promesaCumplida);
  sumar(`Promesas rotas (${c.promesasRotas?.length ?? 0})`, (c.promesasRotas?.length ?? 0) * PUNTOS.promesaRota);
  const etapa = etapaDe(c.construccion);
  sumar(`Construcción política: ${etapa === 'procer' ? 'Prócer' : etapa === 'caudillo' ? 'Caudillo' : 'Referente'}`, PUNTOS_ETAPA[etapa]);
  sumar(`Logros (${c.palmares.length})`, c.palmares.length * PUNTOS.logro);
  const delfines = c.delfines ?? [];
  sumar(`Delfines que formaste (${delfines.length})`, delfines.reduce((s, d) => s + d.nivel, 0) * PUNTOS.delfin);
  sumar(`Delfines que te traicionaron (${c.traiciones ?? 0})`, (c.traiciones ?? 0) * PUNTOS.traicion);
  sumar(`Causas al final (${c.medidores.causas})`, c.medidores.causas * PUNTOS.causa);
  const final = c.fin ? PUNTOS_FINAL[c.fin.motivo] : undefined;
  if (final)
    sumar(
      c.fin!.motivo === 'destituido'
        ? 'Te destituyeron'
        : c.fin!.motivo === 'caos'
          ? 'Te fuiste en medio del caos'
          : 'Renunciaste a la presidencia',
      final,
    );

  const subtotal = partes.reduce((s, p) => s + p.valor, 0);
  let multiplicador = 1;
  let motivoMultiplicador = 'Sin multiplicador';
  if (manosLimpias(c)) {
    multiplicador = MULTIPLICADOR_LIMPIAS;
    motivoMultiplicador = 'Manos limpias toda la carrera';
  } else if (c.coimas) {
    multiplicador = Math.max(PISO_MULTIPLICADOR, MULTIPLICADOR_COIMA ** c.coimas);
    motivoMultiplicador = `${c.coimas} ${c.coimas === 1 ? 'coima' : 'coimas'}`;
  } else {
    motivoMultiplicador = 'Plata negra: perdiste las manos limpias';
  }
  const castigo = c.fin ? MULTIPLICADOR_FINAL[c.fin.motivo] : undefined;
  if (castigo) {
    multiplicador *= castigo;
    motivoMultiplicador += c.fin!.motivo === 'preso' ? ' · terminaste preso' : ' · terminaste en el exilio';
  }
  multiplicador = Math.round(multiplicador * 100) / 100;
  return { partes, subtotal, multiplicador, motivoMultiplicador, total: Math.max(0, Math.round(subtotal * multiplicador)) };
}
