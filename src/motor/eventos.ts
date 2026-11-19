import { COMUNES, ENFRIAMIENTO_EVENTO, ESPECIALES, ESTADO, buscarEvento } from '../datos/eventos';
import { GESTION } from '../datos/gestion';
import { DELFIN_DEL_EVENTO, DELFINES } from '../datos/delfines';
import type { Azaroso, DefEvento, Opcion, Resultado } from '../datos/eventos';
import type { DefPromesa } from '../datos/promesas';
import { EDAD_RETIRO_FIGURAS, FIGURAS } from '../datos/personajes';
import type { Figura } from '../datos/personajes';
import { APELLIDOS, NOMBRES } from '../datos/provincias';
import type { Efectos } from '../datos/tienda';
import { chance, elegir, entero, siguiente } from './azar';
import {
  CON_RENDIMIENTO,
  terminar,
  anotar,
  aplicar,
  conRendimiento,
  construccionReal,
  diferencias,
  moverConstruccion,
  textoEfectos,
} from './ficha';
import { aprobarLey, leyesPosibles, siguienteEnCola } from './congreso';
import { costoProporcional, gananciaProporcional, TOPE_GANANCIA } from './escala';
import { manosLimpias, moverProceso } from './justicia';
import { eventoDeCaida } from './caida';
import { delfinParaEvento, moverDelfin } from './delfines';
import { esEjecutivoLocal, moverDistrito } from './distrito';
import { eventoDeCrisis, terminarCrisis } from './crisis';
import { moverPais } from './pais';
import { PODER_SOLO, anotarFavor, favoresQueDebes } from './poder';
import { EFECTO_COHERENTE, EFECTO_INCOHERENTE, promesasQueRompe, romperPromesas, sentido, subirMalestar } from './promesas';
import type { Sentido } from './promesas';
import type { Carrera, EventoEnCurso, IndicadoresDistrito, Pais } from './tipos';

/**
 * Cuánto pesás: con poca fama y poco poder, pocas cosas pasan por vos. A
 * medida que crecés, te llegan más decisiones (de 0 a 100).
 */
export const pesoPolitico = (carrera: Carrera) => (carrera.medidores.fama + carrera.medidores.poder) / 2;

/** Probabilidad por turno (al cerrarlo) de un evento especial (con alerta) y de uno común, según tu peso. */
export const probabilidadEspecial = (carrera: Carrera) => Math.min(0.45, 0.15 + pesoPolitico(carrera) / 200);
export const probabilidadComun = (carrera: Carrera) => Math.min(0.9, 0.6 + pesoPolitico(carrera) / 150);
/** Si le debés algo a alguien, chance por año de que te lo vengan a cobrar. */
export const PROBABILIDAD_COBRO = 0.3;
/** Con el estilo transa, las coimas rinden más (hasta el tope). */
export const MULTIPLICADOR_TRANSA = 1.5;

export const esAzaroso = (r: Resultado | Azaroso): r is Azaroso => 'chance' in r;

/** La figura del elenco, si todavía está en actividad. Los camioneros pasan de padre a hijo. */
export function figuraActiva(id: string, anio: number): Figura | null {
  const f = FIGURAS.find((x) => x.id === id);
  if (!f) return null;
  if (anio - f.nacimiento <= (f.retiro ?? EDAD_RETIRO_FIGURAS)) return f;
  if (id === 'hugo-medrano') return figuraActiva('pablo-medrano', anio);
  return null;
}

function disponible(carrera: Carrera, e: DefEvento): boolean {
  if ((e.peso ?? 1) <= 0) return false;
  const visto = carrera.eventosVistos[e.id];
  if (visto !== undefined && carrera.anio - visto < ENFRIAMIENTO_EVENTO) return false;
  if (e.quien && 'figura' in e.quien && !figuraActiva(e.quien.figura, carrera.anio)) return false;
  return !e.condicion || e.condicion(carrera);
}

/** Peso de un evento: si estás solo, las amenazas llegan el doble. */
function peso(carrera: Carrera, e: DefEvento): number {
  let p = e.peso ?? 1;
  if (e.especial === 'amenaza' && carrera.medidores.poder <= PODER_SOLO) p *= 2;
  return p;
}

function elegirPonderadoEventos(carrera: Carrera, lista: DefEvento[]): DefEvento | null {
  const posibles = lista.filter((e) => disponible(carrera, e));
  const total = posibles.reduce((s, e) => s + peso(carrera, e), 0);
  if (!total) return null;
  let tirada = siguiente(carrera.azar) * total;
  for (const e of posibles) {
    tirada -= peso(carrera, e);
    if (tirada <= 0) return e;
  }
  return posibles[posibles.length - 1];
}

function abrir(carrera: Carrera, e: DefEvento, quien?: string): EventoEnCurso {
  carrera.eventosVistos[e.id] = carrera.anio;
  const generado = !e.quien || 'rol' in e.quien;
  return {
    id: e.id,
    nombre: generado ? `${elegir(carrera.azar, NOMBRES)} ${elegir(carrera.azar, APELLIDOS)}` : undefined,
    semillaRetrato: entero(carrera.azar, 1, 1_000_000),
    quien,
  };
}

/** El proyecto de ley del año, si sos presidente y queda alguno por mandar. */
export function sortearLey(carrera: Carrera): EventoEnCurso | null {
  const posibles = leyesPosibles(carrera);
  return posibles.length ? abrir(carrera, elegir(carrera.azar, posibles)) : null;
}

/** Chance por año de que un delfín te pida algo, si hay algún evento de delfines posible. */
export const PROBABILIDAD_DELFIN = 0.25;

/** Un evento de tus delfines: habla el delfín del que se trata. */
function eventoDeDelfin(carrera: Carrera): EventoEnCurso | null {
  if (!carrera.delfines?.length || !DELFINES.some((e) => disponible(carrera, e))) return null;
  if (!chance(carrera.azar, PROBABILIDAD_DELFIN)) return null;
  const e = elegirPonderadoEventos(carrera, DELFINES);
  const d = e && delfinParaEvento(carrera, (x) => DELFIN_DEL_EVENTO[e.id](x, carrera));
  if (!e || !d) return null;
  return { ...abrir(carrera, e), nombre: d.nombre, delfin: d.id };
}

/** Siendo presidente, además de las decisiones de Estado, pueden caerte estos. */
const ESPECIALES_DEL_PRESIDENTE = ['carpeta-operador', 'arrepentido', 'investigacion-alcorta', 'extorsion-socio'];

/**
 * ¿Pasa algo este año? Primero los cobros de favores, después la calle si
 * está caliente, después los especiales y por último lo cotidiano. Siendo
 * presidente, todos los años hay una decisión de Estado.
 */
/** Años que tienen que pasar entre un evento y el siguiente (salvo los que no esperan: caídas, cobros, calle, delfines, crisis y leyes). */
export const ANIOS_ENTRE_EVENTOS = 4;

const IDS_COMUNES = new Set([...ESPECIALES, ...COMUNES, ...GESTION, ...ESTADO].map((e) => e.id));

/** El último año en que salió un evento de los de todos los días. */
export function ultimoEventoComun(carrera: Carrera): number {
  let ultimo = -Infinity;
  for (const [id, anio] of Object.entries(carrera.eventosVistos)) if (IDS_COMUNES.has(id) && anio > ultimo) ultimo = anio;
  return ultimo;
}

export function sortearEvento(carrera: Carrera): EventoEnCurso | null {
  // Un presidente que se cae: el juicio político o el pedido de renuncia van antes que todo.
  const caida = eventoDeCaida(carrera);
  if (caida) return abrir(carrera, caida);
  const deudas = favoresQueDebes(carrera);
  if (deudas.length && chance(carrera.azar, PROBABILIDAD_COBRO)) {
    return abrir(carrera, buscarEvento('cobro-favor'), deudas[0].quien);
  }
  // Con bronca en la calle, paros y marchas: más cuanto más alto estás.
  if (carrera.cargo !== 'militante' && chance(carrera.azar, (carrera.malestar ?? 0) / 100)) {
    const ejecutivo = ['intendente', 'gobernador', 'presidente'].includes(carrera.cargo);
    return abrir(carrera, buscarEvento(ejecutivo ? 'paro-general' : 'movilizacion'));
  }
  // Tus delfines: a veces piden algo (o te salen a criticar).
  const delfin = eventoDeDelfin(carrera);
  if (delfin) return delfin;
  if (carrera.cargo === 'presidente') {
    // Con una crisis abierta, la decisión del año es cómo salir.
    const crisis = eventoDeCrisis(carrera);
    if (crisis) return abrir(carrera, crisis);
  }
  // Lo de todos los días: como mucho uno cada dos turnos (cuatro años).
  if (carrera.anio - ultimoEventoComun(carrera) < ANIOS_ENTRE_EVENTOS) return null;
  if (carrera.cargo === 'presidente') {
    if (chance(carrera.azar, 0.2)) {
      const e = elegirPonderadoEventos(
        carrera,
        ESPECIALES.filter((x) => ESPECIALES_DEL_PRESIDENTE.includes(x.id)),
      );
      if (e) return abrir(carrera, e);
    }
    const e =
      elegirPonderadoEventos(carrera, ESTADO) ??
      elegirPonderadoEventos(
        carrera,
        ESTADO.map((x) => ({ ...x, peso: 1 })).filter((x) => !x.condicion || x.condicion(carrera)),
      );
    return e ? abrir(carrera, e) : null;
  }
  if (chance(carrera.azar, probabilidadEspecial(carrera))) {
    const e = elegirPonderadoEventos(carrera, ESPECIALES);
    if (e) return abrir(carrera, e);
  }
  if (chance(carrera.azar, probabilidadComun(carrera))) {
    // Intendentes y gobernadores: la mitad de las veces, una decisión de gestión.
    const gestion = esEjecutivoLocal(carrera) && chance(carrera.azar, 0.5) ? elegirPonderadoEventos(carrera, GESTION) : null;
    const e = gestion ?? elegirPonderadoEventos(carrera, COMUNES);
    if (e) return abrir(carrera, e);
  }
  return null;
}

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** Quién habla en el evento: nombre y rol, para la alerta. */
export function quienHabla(carrera: Carrera): { nombre: string; rol: string; elenco: boolean } | null {
  const en = carrera.evento;
  if (!en) return null;
  const e = buscarEvento(en.id);
  if (e.quien && 'figura' in e.quien) {
    const f = figuraActiva(e.quien.figura, carrera.anio) ?? FIGURAS.find((x) => x.id === (e.quien as { figura: string }).figura)!;
    return { nombre: f.nombre, rol: f.rol, elenco: true };
  }
  const rol = e.quien && 'rol' in e.quien ? e.quien.rol : en.quien ? `De parte de ${en.quien}` : 'Un enviado';
  return { nombre: en.nombre ?? 'Alguien', rol, elenco: false };
}

/** Con quién queda anotado un favor del evento en curso. */
function quienDelFavor(carrera: Carrera): string {
  const en = carrera.evento!;
  if (en.quien) return en.quien;
  const q = quienHabla(carrera);
  if (!q) return 'Un compañero de tu espacio';
  return q.elenco ? q.nombre : `${q.nombre}, ${minuscula(q.rol)}`;
}

export interface Desenlace {
  texto: string;
  efectos: Efectos;
  construccion: number;
  /** Solo en las opciones con azar. */
  salioBien?: boolean;
  favor?: string;
  /** Plata negra que entró (positivo) o salió (negativo). */
  negra: number;
  pais?: Partial<Pais>;
  distrito?: Partial<IndicadoresDistrito>;
  malestar?: number;
  /** Lo que pasó con tus ideas y tus promesas. */
  consecuencias?: string[];
}

/** Lo que va a hacer un resultado, calculado sin tocar la carrera: sirve para mostrarlo antes de elegir. */
export interface Prevision {
  /** Los números reales, ya con los rendimientos decrecientes. Incluye la caja. */
  efectos: Efectos;
  negra: number;
  construccion: number;
  favor?: { quien: string; debes: boolean };
  saldaFavor: boolean;
  proceso?: Resultado['proceso'];
  /** Las manos limpias amortiguaron un carpetazo. */
  amortiguado: boolean;
  /** Rechazaste la tentación y seguís con las manos limpias. */
  limpias: boolean;
  /** La ganancia llegó al tope. */
  tope: boolean;
  /** Es una coima: deja rastro. */
  rastro: boolean;
  /** Con esto perdés las manos limpias. */
  ensucia: boolean;
  /** Lo que mueve en el país. */
  pais: Partial<Pais>;
  /** Lo que mueve en tu intendencia o tu provincia. */
  distrito: Partial<IndicadoresDistrito>;
  malestar: number;
  /** Si va con tus ideas o contra ellas (solo si la opción tiene postura). */
  sentido: Sentido;
  /** Las promesas de campaña que rompe. */
  rompe: DefPromesa[];
  /** Lo que le pasa a tu delfín. */
  delfin: NonNullable<Resultado['delfin']>;
}

/**
 * Con rendimiento en false, los números quedan como están escritos: sirve para
 * la prueba de equilibrio, que compara las opciones antes de mirar tu situación.
 */
export function preverResultado(carrera: Carrera, r: Resultado, carpetazo: boolean, rendimiento = true, opcion?: Opcion): Prevision {
  const base: Efectos = { ...(r.efectos ?? {}) };
  // Con las manos limpias, los carpetazos no prenden: se cae la parte grave.
  let amortiguado = false;
  if (carpetazo && manosLimpias(carrera)) {
    if ((base.causas ?? 0) > 0) {
      delete base.causas;
      amortiguado = true;
    }
    if ((base.imagen ?? 0) < -2) {
      base.imagen = Math.ceil(base.imagen! / 3);
      amortiguado = true;
    }
  }
  // Rendimientos decrecientes: lo que ya tenés alto rinde menos.
  const efectos: Efectos = {};
  for (const [clave, cantidad] of Object.entries(base)) {
    const k = clave as keyof Efectos;
    efectos[k] =
      rendimiento && (CON_RENDIMIENTO as readonly string[]).includes(k)
        ? conRendimiento(carrera.medidores[k as (typeof CON_RENDIMIENTO)[number]], cantidad!)
        : cantidad!;
  }
  let tope = false;
  if (r.plata) {
    const monto = r.plata < 0 ? -costoProporcional(carrera, -r.plata) : gananciaProporcional(carrera, r.plata);
    efectos.caja = monto;
    tope = monto >= TOPE_GANANCIA;
  }
  let negra = 0;
  if (r.negra) {
    if (r.negra < 0) {
      negra = -costoProporcional(carrera, -r.negra, carrera.cajaNegra);
    } else {
      negra = gananciaProporcional(carrera, r.negra, r.coima && carrera.estilo === 'transa' ? MULTIPLICADOR_TRANSA : 1);
      tope = negra >= TOPE_GANANCIA;
    }
  }
  return {
    efectos,
    negra,
    construccion: r.construccion ? (rendimiento ? construccionReal(carrera, r.construccion) : r.construccion) : 0,
    favor: r.favor && carrera.evento ? { quien: quienDelFavor(carrera), debes: r.favor.debes } : undefined,
    saldaFavor: !!r.saldarFavor,
    proceso: r.proceso,
    amortiguado,
    limpias: !!r.limpias && manosLimpias(carrera),
    tope,
    rastro: !!r.coima,
    ensucia: (!!r.coima || negra > 0) && manosLimpias(carrera),
    pais: carrera.pais ? { ...(r.pais ?? {}) } : {},
    distrito: carrera.distrito ? { ...(r.distrito ?? {}) } : {},
    malestar: carrera.cargo === 'militante' ? 0 : (r.malestar ?? 0),
    sentido: opcion ? sentido(carrera, opcion.postura) : null,
    rompe: opcion ? promesasQueRompe(carrera, { etiquetas: opcion.etiquetas, coima: !!r.coima || negra > 0, pasiva: opcion.pasiva }) : [],
    delfin: { ...(r.delfin ?? {}) },
  };
}

export const resultadosDe = (r: Resultado | Azaroso): Resultado[] => (esAzaroso(r) ? [r.exito, r.fracaso] : [r]);

function motivoPlata(carrera: Carrera, e: DefEvento, opcion: Opcion): string | null {
  for (const r of resultadosDe(opcion.resultado)) {
    const p = preverResultado(carrera, r, e.especial === 'carpetazo', true, opcion);
    if ((p.efectos.caja ?? 0) < 0 && carrera.medidores.caja < -p.efectos.caja!) return 'No te alcanza la caja.';
    if (p.negra < 0 && carrera.cajaNegra < -p.negra) return 'No tenés esa plata en negro.';
  }
  return null;
}

/**
 * Por qué no podés elegir una opción, o null si podés. La plata se revisa
 * sola. Si ninguna opción se puede pagar, se puede elegir igual: te endeudás.
 */
export function motivoOpcion(carrera: Carrera, indice: number): string | null {
  const e = buscarEvento(carrera.evento!.id);
  const opcion = e.opciones[indice];
  const motivo = opcion.requiere?.(carrera);
  if (motivo) return motivo;
  const plata = motivoPlata(carrera, e, opcion);
  if (!plata) return null;
  const hayOtra = e.opciones.some((o) => !o.requiere?.(carrera) && !motivoPlata(carrera, e, o));
  return hayOtra ? plata : null;
}

function aplicarResultado(carrera: Carrera, r: Resultado, carpetazo: boolean): Desenlace {
  const p = preverResultado(carrera, r, carpetazo);
  const texto = p.amortiguado ? `${r.texto} Como tenés las manos limpias, no prendió.` : r.texto;
  for (const [clave, cantidad] of Object.entries(p.efectos)) aplicar(carrera, clave as keyof Efectos, cantidad!);
  if (p.negra) {
    carrera.cajaNegra += p.negra;
    if (p.negra > 0) carrera.negroUsado = true;
  }
  if (p.proceso) moverProceso(carrera, p.proceso);
  if (p.construccion) moverConstruccion(carrera, p.construccion);
  if (Object.keys(p.pais).length) moverPais(carrera, p.pais);
  if (Object.keys(p.distrito).length) moverDistrito(carrera, p.distrito);
  if (p.malestar) subirMalestar(carrera, p.malestar);
  if (r.ley) aprobarLey(carrera, r.ley);
  if (r.fin) terminar(carrera, r.fin);
  const delfin = r.delfin ? moverDelfin(carrera, carrera.evento?.delfin, r.delfin) : '';
  const salida = r.cortaCrisis && carrera.crisis?.some((x) => x.id === r.cortaCrisis) ? terminarCrisis(carrera, r.cortaCrisis) : null;

  let favor: string | undefined;
  if (p.favor) {
    anotarFavor(carrera, p.favor.quien, p.favor.debes, r.favor!.motivo);
    favor = p.favor.debes ? `Le debés un favor a ${p.favor.quien}.` : `${p.favor.quien} te debe un favor.`;
  }
  if (p.saldaFavor) {
    const quien = carrera.evento?.quien;
    let i = carrera.favores.findIndex((f) => f.debes && f.quien === quien);
    if (i < 0) i = carrera.favores.findIndex((f) => f.debes);
    if (i >= 0) carrera.favores.splice(i, 1);
  }
  if (r.coima) carrera.coimas = (carrera.coimas ?? 0) + 1;
  return {
    texto: [texto, delfin, salida].filter(Boolean).join(' '),
    efectos: p.efectos,
    construccion: p.construccion,
    favor,
    negra: p.negra,
    pais: p.pais,
    distrito: p.distrito,
    malestar: p.malestar,
  };
}

/** Decidir con o contra tus ideas: tu gente lo nota. Devuelve la línea para el historial. */
function aplicarSentido(carrera: Carrera, s: Sentido): string | null {
  if (s === 'coherente') {
    aplicar(carrera, 'imagen', EFECTO_COHERENTE.imagen);
    return '🧭 Coherente con lo que pensás: tu gente te banca (Imagen +1).';
  }
  if (s === 'incoherente') {
    aplicar(carrera, 'imagen', EFECTO_INCOHERENTE.imagen);
    aplicar(carrera, 'poder', EFECTO_INCOHERENTE.poder);
    subirMalestar(carrera, EFECTO_INCOHERENTE.malestar);
    carrera.incoherencias = [...(carrera.incoherencias ?? []), carrera.anio];
    return '🧭 Fuiste contra lo que pensás: tu gente no lo entiende (Imagen −2, Poder −2).';
  }
  return null;
}

/** Elegís una opción del evento: se aplica, se anota y el evento se cierra. */
export function resolverEvento(anterior: Carrera, indice: number): { carrera: Carrera; desenlace: Desenlace } {
  const en = anterior.evento;
  if (!en) throw new Error('No hay ningún evento en curso');
  const e = buscarEvento(en.id);
  const opcion = e.opciones[indice];
  if (!opcion) throw new Error(`No hay opción ${indice}`);
  const motivo = motivoOpcion(anterior, indice);
  if (motivo) throw new Error(motivo);

  const carrera = structuredClone(anterior);
  let salioBien: boolean | undefined;
  let r: Resultado;
  if (esAzaroso(opcion.resultado)) {
    salioBien = chance(carrera.azar, opcion.resultado.chance(anterior));
    r = salioBien ? opcion.resultado.exito : opcion.resultado.fracaso;
  } else {
    r = opcion.resultado;
  }
  return cerrarEvento(anterior, carrera, e, opcion, r, salioBien);
}

/** Aplica el resultado que tocó sobre la copia `carrera`, lo anota y cierra el evento. */
export function cerrarEvento(
  anterior: Carrera,
  carrera: Carrera,
  e: DefEvento,
  opcion: Opcion,
  r: Resultado,
  salioBien?: boolean,
): { carrera: Carrera; desenlace: Desenlace } {
  // El evento sigue abierto mientras se aplica: hace falta para saber con quién es el favor.
  const desenlace: Desenlace = { ...aplicarResultado(carrera, r, e.especial === 'carpetazo'), salioBien };
  delete carrera.evento;
  // Tus ideas y tus promesas: lo que decidiste dice quién sos.
  const consecuencias = [aplicarSentido(carrera, sentido(anterior, opcion.postura))].filter((x): x is string => !!x);
  consecuencias.push(
    ...romperPromesas(carrera, { etiquetas: opcion.etiquetas, coima: !!r.coima || desenlace.negra > 0, pasiva: opcion.pasiva }),
  );
  if (consecuencias.length) desenlace.consecuencias = consecuencias;
  const partes = [textoEfectos(desenlace.efectos)];
  if (desenlace.negra) partes.push(`Caja negra ${desenlace.negra > 0 ? '+' : '−'}US$ ${Math.abs(desenlace.negra).toLocaleString('es-AR')}`);
  if (desenlace.construccion) partes.push(`Construcción ${desenlace.construccion > 0 ? '+' : '−'}${Math.abs(desenlace.construccion)}`);
  if (desenlace.pais)
    for (const [k, v] of Object.entries(desenlace.pais))
      partes.push(`${k === 'inflacion' ? 'Inflación' : k === 'actividad' ? 'Actividad' : 'Reservas'} ${v! > 0 ? '+' : '−'}${Math.abs(v!)}`);
  const detalle = partes.filter(Boolean).join(', ');
  anotar(carrera, [`${e.titulo}: ${desenlace.texto}${detalle ? ` (${detalle})` : ''}`, ...consecuencias]);
  // Si quedó algo en cola (el proyecto de ley), llega ahora.
  siguienteEnCola(carrera);
  carrera.cambios = diferencias(anterior, carrera);
  return { carrera, desenlace };
}
