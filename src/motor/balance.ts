import { ESTADO, EVENTOS } from '../datos/eventos';
import { EVENTOS_CAIDA } from '../datos/caida';
import { EVENTOS_CRISIS } from '../datos/crisis';
import { GESTION } from '../datos/gestion';
import { LEYES } from '../datos/leyes';
import type { DefEvento, Resultado } from '../datos/eventos';
import {
  PUNTOS_POR_CAJA,
  VALOR_CONSTRUCCION,
  VALOR_FAVOR,
  VALOR_MALESTAR,
  VALOR_MANOS_LIMPIAS,
  VALOR_PAIS,
  VALOR_SALIDA_CRISIS,
  VALOR_FIN,
  VALOR_DISTRITO,
  VALOR_DELFIN,
  VALOR_NEGRA,
  VALOR_POR_UNIDAD,
  VALOR_PROCESO,
  VALOR_RASTRO,
} from '../datos/valor';
import { nuevaCarrera } from './carrera';
import { esAzaroso, motivoOpcion, preverResultado } from './eventos';
import { manosLimpias } from './justicia';
import type { CargoId, Carrera } from './tipos';

/**
 * La prueba de equilibrio de los eventos (regla 5 de la propuesta): mide cada
 * opción en la escala común de puntos, en tres momentos de una carrera típica.
 */

export interface Perfil {
  nombre: string;
  carrera: Carrera;
}

function perfil(
  nombre: string,
  datos: {
    edad: number;
    cargo: CargoId;
    caja: number;
    negra: number;
    fama: number;
    imagen: number;
    poder: number;
    causas: number;
    construccion: number;
    atributos: Carrera['atributos'];
    coimas?: number;
    pais?: Carrera['pais'];
    distrito?: Carrera['distrito'];
  },
): Perfil {
  const c = nuevaCarrera({ semilla: 7, provincia: 'Buenos Aires', estilo: 'pragmatico' });
  c.edad = datos.edad;
  // El año no importa para el valor; uno en el que el elenco sigue en actividad.
  c.anio = 2031;
  c.cargo = datos.cargo;
  c.construccion = datos.construccion;
  c.atributos = { ...datos.atributos };
  Object.assign(c.medidores, { caja: datos.caja, fama: datos.fama, imagen: datos.imagen, poder: datos.poder, causas: datos.causas });
  c.cajaNegra = datos.negra;
  if (datos.pais) c.pais = datos.pais;
  if (datos.distrito) {
    c.distrito = datos.distrito;
    c.oficialismo = c.partido;
  }
  if (datos.cargo === 'presidente') c.mandatosSeguidos = 1;
  if (datos.coimas) {
    c.coimas = datos.coimas;
    c.negroUsado = true;
  }
  return { nombre, carrera: c };
}

/** Tres momentos de una carrera típica, con la economía nueva. */
export const PERFILES: Perfil[] = [
  perfil('A · 25 años, militante', {
    edad: 25,
    cargo: 'militante',
    caja: 27500,
    negra: 0,
    fama: 12,
    imagen: 50,
    poder: 12,
    causas: 5,
    construccion: 20,
    atributos: { rosca: 30, territorio: 30, gestion: 30 },
  }),
  perfil('B · 45 años, director municipal', {
    edad: 45,
    cargo: 'funcionario',
    caja: 120000,
    negra: 20000,
    fama: 30,
    imagen: 55,
    poder: 30,
    causas: 20,
    construccion: 45,
    atributos: { rosca: 50, territorio: 45, gestion: 50 },
  }),
  perfil('C · 60 años, senador con una coima', {
    edad: 60,
    cargo: 'senador',
    caja: 230000,
    negra: 60000,
    fama: 50,
    imagen: 50,
    poder: 55,
    causas: 35,
    construccion: 65,
    atributos: { rosca: 65, territorio: 50, gestion: 55 },
    coimas: 2,
  }),
  perfil('D · 55 años, presidente', {
    edad: 55,
    cargo: 'presidente',
    caja: 150000,
    negra: 0,
    fama: 70,
    imagen: 50,
    poder: 75,
    causas: 15,
    construccion: 65,
    atributos: { rosca: 65, territorio: 50, gestion: 60 },
    pais: { inflacion: 60, actividad: 50, reservas: 35, recibido: { inflacion: 60, actividad: 50, reservas: 35 } },
  }),
  perfil('E · 48 años, intendente', {
    edad: 48,
    cargo: 'intendente',
    caja: 140000,
    negra: 0,
    fama: 35,
    imagen: 55,
    poder: 45,
    causas: 15,
    construccion: 50,
    atributos: { rosca: 55, territorio: 55, gestion: 55 },
    distrito: { cuentas: 50, gestion: 50, recibido: { cuentas: 50, gestion: 50 }, cargo: 'intendente' },
  }),
];

/** El perfil del presidente, solo para las decisiones de Estado. */
const PRESIDENTE = PERFILES[3];
/** El intendente, solo para las decisiones de gestión. */
const INTENDENTE = PERFILES[4];

/** Lo que vale un resultado, moneda por moneda. */
export type Vector = Record<string, number>;

export function vectorDe(carrera: Carrera, r: Resultado, carpetazo: boolean): Vector {
  const p = preverResultado(carrera, r, carpetazo, false);
  const v: Vector = {};
  const caja = Math.max(1, carrera.medidores.caja);
  for (const [clave, cantidad] of Object.entries(p.efectos)) {
    v[clave] =
      clave === 'caja' ? (cantidad! / caja) * PUNTOS_POR_CAJA : cantidad! * VALOR_POR_UNIDAD[clave as keyof typeof VALOR_POR_UNIDAD];
  }
  if (p.negra) v.negra = (p.negra / caja) * PUNTOS_POR_CAJA * VALOR_NEGRA;
  if (p.construccion) v.construccion = p.construccion * VALOR_CONSTRUCCION;
  if (p.favor) v.favor = p.favor.debes ? -VALOR_FAVOR : VALOR_FAVOR;
  if (p.saldaFavor) v.deuda = VALOR_FAVOR;
  if (p.proceso) v.proceso = VALOR_PROCESO[p.proceso];
  if (p.limpias) v.limpias = VALOR_MANOS_LIMPIAS;
  for (const [k, x] of Object.entries(p.pais)) v[k] = x! * VALOR_PAIS[k as keyof typeof VALOR_PAIS];
  if (p.malestar) v.malestar = p.malestar * VALOR_MALESTAR;
  for (const [k, x] of Object.entries(p.distrito)) v[k] = x! * VALOR_DISTRITO[k as keyof typeof VALOR_DISTRITO];
  for (const [k, x] of Object.entries(p.delfin)) v[`delfin-${k}`] = Number(x) * VALOR_DELFIN[k as keyof typeof VALOR_DELFIN];
  if (r.cortaCrisis) v.crisis = VALOR_SALIDA_CRISIS;
  if (r.fin) v.fin = VALOR_FIN;
  // Ensuciarte las manos: dejan de valer y queda el rastro.
  if (r.coima || p.negra > 0) {
    v.rastro = VALOR_RASTRO;
    if (manosLimpias(carrera)) v.limpias = (v.limpias ?? 0) - VALOR_MANOS_LIMPIAS;
  }
  return v;
}

const sumar = (v: Vector) => Object.values(v).reduce((s, x) => s + x, 0);

export interface ValorOpcion {
  indice: number;
  texto: string;
  pasiva: boolean;
  /** Valor esperado, en puntos. */
  total: number;
  /** Lo esperado en cada moneda. */
  vector: Vector;
  /** Si es de azar: cuánto vale si sale mal. */
  siSaleMal?: number;
}

export function valorOpcion(carrera: Carrera, e: DefEvento, indice: number): ValorOpcion | null {
  const c = structuredClone(carrera);
  c.evento = { id: e.id, nombre: 'Alguien', semillaRetrato: 1 };
  if (motivoOpcion(c, indice)) return null;
  const o = e.opciones[indice];
  const carpetazo = e.especial === 'carpetazo';
  let vector: Vector;
  let siSaleMal: number | undefined;
  if (esAzaroso(o.resultado)) {
    const p = o.resultado.chance(c);
    const bien = vectorDe(c, o.resultado.exito, carpetazo);
    const mal = vectorDe(c, o.resultado.fracaso, carpetazo);
    vector = {};
    for (const k of new Set([...Object.keys(bien), ...Object.keys(mal)])) vector[k] = p * (bien[k] ?? 0) + (1 - p) * (mal[k] ?? 0);
    siSaleMal = sumar(mal);
  } else {
    vector = vectorDe(c, o.resultado, carpetazo);
  }
  return { indice, texto: o.texto, pasiva: !!o.pasiva, total: sumar(vector), vector, siSaleMal };
}

/** Cuánto pueden separarse las opciones de un evento. */
export const TOLERANCIA_ACTIVAS = 2.5;
/** Si hay azar, la opción vale más o menos según tus atributos: se permite un poco más. */
export const TOLERANCIA_AZAR = 1.5;
export const TOLERANCIA_PASIVAS = 4;
/** Lo que cede una opción tiene que valer al menos esto de lo que gana. */
export const CEDE_MINIMO = 0.3;
/** Un costo en plata tiene que estar entre el 3 % y el 35 % de la caja. */
export const PLATA_MINIMA = 0.03;
export const PLATA_MAXIMA = 0.35;

/** Eventos que no siguen las reglas, con el motivo. */
export const EXCEPCIONES: Record<string, string> = {
  desafuero: 'Es el final del camino judicial: cualquier salida puede terminar en detención.',
  'juicio-politico': 'Es el final del mandato en juego: cualquier salida puede terminar la carrera.',
  'pedido-renuncia': 'Es el final del mandato en juego: cualquier salida puede terminar la carrera.',
};

function domina(a: Vector, b: Vector): boolean {
  const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
  let mejor = false;
  for (const k of claves) {
    const x = a[k] ?? 0;
    const y = b[k] ?? 0;
    if (x < y - 1e-9) return false;
    if (x > y + 1e-9) mejor = true;
  }
  return mejor;
}

/** Los problemas de un evento en un perfil, como texto. Vacío si está bien. */
export function revisarEvento(e: DefEvento, p: Perfil): string[] {
  if (EXCEPCIONES[e.id]) return [];
  const problemas: string[] = [];
  const valores = e.opciones.map((_, i) => valorOpcion(p.carrera, e, i)).filter((v): v is ValorOpcion => !!v);
  const donde = `${e.id} (${p.nombre})`;

  for (const a of valores) {
    for (const b of valores) {
      if (a !== b && domina(a.vector, b.vector)) problemas.push(`${donde}: "${b.texto}" está dominada por "${a.texto}".`);
    }
    // Lo que cede: o hay algo en contra que pese, o es de azar y si sale mal perdés.
    const gana = Object.values(a.vector)
      .filter((x) => x > 0)
      .reduce((s, x) => s + x, 0);
    const cede = -Object.values(a.vector)
      .filter((x) => x < 0)
      .reduce((s, x) => s + x, 0);
    const arriesga = a.siSaleMal !== undefined && a.siSaleMal < 0;
    if (gana > 0.5 && cede < CEDE_MINIMO * gana && !arriesga)
      problemas.push(`${donde}: "${a.texto}" no cede casi nada (gana ${gana.toFixed(1)}, cede ${cede.toFixed(1)}).`);
  }

  const activas = valores.filter((v) => !v.pasiva);
  if (activas.length >= 2) {
    const mejor = Math.max(...activas.map((v) => v.total));
    const peor = Math.min(...activas.map((v) => v.total));
    const tolerancia = TOLERANCIA_ACTIVAS + (activas.some((v) => v.siSaleMal !== undefined) ? TOLERANCIA_AZAR : 0);
    if (mejor - peor > tolerancia) problemas.push(`${donde}: las opciones se separan ${(mejor - peor).toFixed(1)} puntos.`);
  }
  if (valores.length >= 2) {
    const mejor = Math.max(...valores.map((v) => v.total));
    for (const v of valores.filter((x) => x.pasiva)) {
      if (mejor - v.total > TOLERANCIA_PASIVAS)
        problemas.push(`${donde}: "${v.texto}" queda ${(mejor - v.total).toFixed(1)} puntos abajo.`);
    }
  }

  // La plata: ni regalada ni imposible.
  const c = structuredClone(p.carrera);
  c.evento = { id: e.id, nombre: 'Alguien', semillaRetrato: 1 };
  for (const o of e.opciones) {
    const resultados = esAzaroso(o.resultado) ? [o.resultado.exito, o.resultado.fracaso] : [o.resultado];
    for (const r of resultados) {
      if ((r.efectos as Record<string, number> | undefined)?.caja)
        problemas.push(`${donde}: "${o.texto}" tiene plata fija; tiene que ir en "plata".`);
      const monto = preverResultado(c, r, false).efectos.caja ?? 0;
      if (monto < 0) {
        const parte = -monto / c.medidores.caja;
        if (parte < PLATA_MINIMA || parte > PLATA_MAXIMA)
          problemas.push(`${donde}: "${o.texto}" cuesta el ${Math.round(parte * 100)} % de la caja.`);
      }
    }
  }
  return problemas;
}

/** Los perfiles en los que un evento puede salir. Si no sale en ninguno, se lo revisa en los tres. */
export function perfilesDe(e: DefEvento): Perfil[] {
  if (ESTADO.includes(e) || LEYES.includes(e) || EVENTOS_CRISIS.includes(e) || EVENTOS_CAIDA.includes(e)) return [PRESIDENTE];
  if (GESTION.includes(e)) return [INTENDENTE];
  const comunes = PERFILES.filter((p) => p !== PRESIDENTE && p !== INTENDENTE);
  const posibles = comunes.filter((p) => !e.condicion || e.condicion(p.carrera));
  return posibles.length ? posibles : comunes;
}

export function revisarTodo(): string[] {
  return EVENTOS.flatMap((e) => perfilesDe(e).flatMap((p) => revisarEvento(e, p)));
}

/** La tabla para escribir y ajustar eventos: el valor de cada opción en cada perfil. */
export function tablaDeValores(): string {
  const filas: string[] = [];
  for (const e of EVENTOS) {
    filas.push(`\n${e.id}`);
    e.opciones.forEach((o, i) => {
      const celdas = PERFILES.map((p) => {
        if (!perfilesDe(e).includes(p)) return '     ·';
        const v = valorOpcion(p.carrera, e, i);
        return v ? v.total.toFixed(1).padStart(6) : '     —';
      });
      filas.push(`  ${(o.pasiva ? '· ' : '  ') + o.texto.slice(0, 44).padEnd(46)}${celdas.join(' ')}`);
    });
  }
  return filas.join('\n');
}
