import { CARGOS } from '../datos/cargos';
import { CARTAS, EDAD_MINIMA_ICONICA, MAGNITUDES, PORCENTAJE_CAJA, PROBABILIDAD_RAREZA, buscarCarta } from '../datos/cartas';
import { APELLIDOS, CENTRO_DEL_PODER, NOMBRES, POBLACION } from '../datos/provincias';
import { elPartido, partidoMasCercano } from '../datos/partidos';
import { EDAD_JUBILACION } from '../datos/formacion';
import { CARTAS_ARRANQUE, ESTILO, ORIGEN, PROBABILIDAD_ARRANQUE_ICONICA, buscarCartaArranque } from '../datos/armado';
import type { Ajustes } from '../datos/armado';
import { chance, crearAzar, elegir, elegirPonderado, entero, ruido, siguiente } from './azar';
import {
  ETAPA,
  NOMBRE_ATRIBUTO,
  acotar,
  anotar,
  aplicar,
  diferencias,
  etapaDe,
  foto,
  construccionReal,
  moverConstruccion,
  nombreDe,
  registrarLogro,
  terminar,
  textoCantidad,
} from './ficha';
import { anioDelCongreso } from './congreso';
import { anioDeLasCrisis } from './crisis';
import { anioDelDistrito } from './distrito';
import { anioDeLosDelfines } from './delfines';
import { abrirEleccion, cargosPosibles, elegirCandidatura, esAnioElectoral, vencerMandato } from './elecciones';
import { sortearEvento, sortearLey } from './eventos';
import { aporteAgrupacion, gananciaProporcional, gastoDeEstructura } from './escala';
import { anioDelPais } from './pais';
import { PODER_INICIAL, efectoAnualDelPoder } from './poder';
import { MALESTAR_ALTO, subirMalestar } from './promesas';
import { avanzarJusticia, decomisar, manosLimpias, pisoDeCausas } from './justicia';
import { generarPases, hayOfertaMejor, renovarSinPreguntar } from './pases';
import { aplicarCompras, bonoZafar, factorSalud } from './tienda';
import type { Ficha } from './ficha';
import type { Foto } from './tipos';
import type { EstadoAzar } from './azar';
import { ATRIBUTOS, ESTILOS, ORIGENES } from './tipos';
import type {
  Atributo,
  Carrera,
  Carta,
  Delfin,
  Estilo,
  Ideologia,
  Medidor,
  MotivoFin,
  Origen,
  PartidoId,
  Rareza,
  SalidaDetencion,
} from './tipos';

export {
  NOMBRE_ATRIBUTO,
  NOMBRE_MEDIDOR,
  acotar,
  anotar,
  aplicar,
  diferencias,
  esBueno,
  ETAPA,
  etapaDe,
  nombreDe,
  siguienteEtapa,
  textoCantidad,
} from './ficha';

export const EDAD_INICIAL = 18;
/** Nadie sigue en carrera más allá de esta edad. */
export const EDAD_LIMITE = 95;

export const NOMBRE_RAREZA: Record<Rareza, string> = {
  comun: 'Común',
  rara: 'Rara',
  dorada: 'Dorada',
  iconica: 'Icónica',
};

export interface OpcionesNuevaCarrera {
  semilla: number;
  anio?: number;
  nombre?: string;
  provincia?: string;
  origen?: Origen;
  ideologia?: Ideologia;
  estilo?: Estilo;
  /** Una de las tres que da cartasDeArranque(semilla). */
  cartaArranque?: string;
  /** Si la carrera es de un delfín: quién lo apadrina. */
  padrino?: Padrino;
}

/** Quien te apadrina: una carrera anterior que siguió como armador. */
export interface Padrino {
  nombre: string;
  partido: PartidoId;
  construccion: number;
  caja: number;
  /** Si le pasás la posta a uno de tus delfines: hereda más cuanto más lo hiciste crecer. */
  delfin?: Pick<Delfin, 'nombre' | 'talento' | 'lealtad' | 'nivel'>;
}

/**
 * Lo que hereda el delfín: parte de la construcción, contactos y algo de plata.
 * Uno que formaste suma su crecimiento, su talento y, con su lealtad, más plata.
 */
export function herencia(padrino: Padrino) {
  const d = padrino.delfin;
  const caja = Math.min(20000, Math.max(0, Math.round(padrino.caja * 0.1)));
  return {
    construccion: Math.round(padrino.construccion / 3) + (d ? Math.round(d.nivel / 5) : 0),
    rosca: 5 + (d ? Math.round(d.talento / 15) : 0),
    caja: d ? Math.round(caja * (1 + d.lealtad / 100)) : caja,
  };
}

/**
 * Las tres cartas de arranque que ofrece una semilla. Usan su propio azar,
 * así no cambian según lo que se elija en el resto del armado.
 */
export function cartasDeArranque(semilla: number): string[] {
  const azar = crearAzar((semilla ^ 0x9e3779b9) >>> 0);
  const normales = CARTAS_ARRANQUE.filter((c) => c.rareza !== 'iconica');
  const iconicas = CARTAS_ARRANQUE.filter((c) => c.rareza === 'iconica');
  const elegidas: string[] = [];
  while (elegidas.length < 3) {
    const carta = elegir(azar, normales);
    if (!elegidas.includes(carta.id)) elegidas.push(carta.id);
  }
  if (chance(azar, PROBABILIDAD_ARRANQUE_ICONICA)) elegidas[entero(azar, 0, 2)] = elegir(azar, iconicas).id;
  return elegidas;
}

export function nombreIdeologia({ economia, social }: Ideologia): string {
  const eco = economia <= -34 ? 'Estatista' : economia >= 34 ? 'Liberal' : 'De centro';
  const soc = social <= -34 ? 'conservador' : social >= 34 ? 'progresista' : 'moderado';
  return `${eco} ${soc}`;
}

function aplicarAjustes(ficha: Ficha, ajustes: Ajustes) {
  for (const [clave, cantidad] of Object.entries(ajustes)) aplicar(ficha, clave as Atributo | Medidor, cantidad);
}

/**
 * Todo lo que sale de la semilla, siempre en el mismo orden: así la misma
 * semilla da la misma provincia y los mismos atributos base con cualquier armado.
 */
function sortearBase(semilla: number) {
  const azar = crearAzar(semilla);
  const nombre = `${elegir(azar, NOMBRES)} ${elegir(azar, APELLIDOS)}`;
  const provincia = elegirPonderado(azar, POBLACION);
  const origen = elegir(azar, ORIGENES);
  const estilo = elegir(azar, ESTILOS);
  const ideologia = { economia: entero(azar, -100, 100), social: entero(azar, -100, 100) };
  const ofrecidas = cartasDeArranque(semilla);
  const cartaArranque = elegir(azar, ofrecidas);
  const ficha: Ficha = {
    atributos: {
      rosca: entero(azar, 10, 30),
      territorio: entero(azar, 10, 30),
      gestion: entero(azar, 10, 30),
    },
    medidores: { fama: entero(azar, 1, 5), imagen: 50, caja: entero(azar, 1, 5) * 1000, causas: 0, poder: PODER_INICIAL },
  };
  return { azar, nombre, provincia: provincia as string, origen, estilo, ideologia, ofrecidas, cartaArranque, ficha };
}

/** Lo que el armado deja ver mientras se elige: la provincia sorteada y la ficha con lo elegido hasta ahora. */
export function vistaPreviaArmado(
  semilla: number,
  elegido: { origen?: Origen; estilo?: Estilo; cartaArranque?: string; padrino?: Padrino },
): { nombreSugerido: string; provincia: string; ofrecidas: string[] } & Ficha {
  const base = sortearBase(semilla);
  const ficha = base.ficha;
  if (elegido.origen) aplicarAjustes(ficha, ORIGEN[elegido.origen].ajustes);
  if (elegido.estilo) aplicarAjustes(ficha, ESTILO[elegido.estilo].ajustes);
  if (elegido.cartaArranque) aplicarAjustes(ficha, buscarCartaArranque(elegido.cartaArranque).ajustes);
  if (elegido.padrino) {
    const { rosca, caja } = herencia(elegido.padrino);
    aplicarAjustes(ficha, { rosca, caja });
  }
  return { nombreSugerido: base.nombre, provincia: base.provincia, ofrecidas: base.ofrecidas, ...ficha };
}

export function nuevaCarrera(opciones: OpcionesNuevaCarrera): Carrera {
  const base = sortearBase(opciones.semilla);
  const anio = opciones.anio ?? 2027;

  const cartaArranque = opciones.cartaArranque ?? base.cartaArranque;
  if (!base.ofrecidas.includes(cartaArranque)) {
    throw new Error(`Esa carta de arranque no está entre las ofrecidas: ${cartaArranque}`);
  }
  const ideologia = opciones.ideologia ?? base.ideologia;
  const provincia = opciones.provincia ?? base.provincia;

  const carrera: Carrera = {
    version: 9,
    semilla: opciones.semilla,
    azar: base.azar,
    nombre: opciones.nombre?.trim() || base.nombre,
    provincia,
    base: provincia,
    origen: opciones.origen ?? base.origen,
    ideologia: {
      economia: acotar(Math.round(ideologia.economia), -100, 100),
      social: acotar(Math.round(ideologia.social), -100, 100),
    },
    estilo: opciones.estilo ?? base.estilo,
    cartaArranque,
    anioInicio: anio,
    anio,
    edad: EDAD_INICIAL,
    cargo: 'militante',
    mejorRango: 0,
    partido: 'frente-nacional',
    partidoDesde: anio,
    construccion: 0,
    ...base.ficha,
    cartas: [],
    historial: [],
    pendientes: [],
    palmares: [],
    trayectoria: [],
    compras: [],
    inicioPeriodo: { anio, poder: 0, fama: 0, imagen: 0, caja: 0, construccion: 0 },
    favores: [],
    eventosVistos: {},
    cajaNegra: 0,
    movidas: {},
    fin: null,
  };

  const origen = ORIGEN[carrera.origen];
  const estilo = ESTILO[carrera.estilo];
  const arranque = buscarCartaArranque(cartaArranque);
  aplicarAjustes(carrera, origen.ajustes);
  aplicarAjustes(carrera, estilo.ajustes);
  aplicarAjustes(carrera, arranque.ajustes);

  // El partido: el que mejor te representa, o el de tu padrino.
  carrera.partido = opciones.padrino?.partido ?? partidoMasCercano(carrera.ideologia);
  // Un poco de construcción de entrada, según tu territorio.
  carrera.construccion = Math.floor(carrera.atributos.territorio / 4);

  const lineas = [
    `Empezás a militar en ${carrera.provincia}, en ${elPartido(carrera.partido)}. Origen: ${origen.nombre.toLowerCase()}.`,
    `Perfil ${nombreIdeologia(carrera.ideologia).toLowerCase()}, estilo ${estilo.nombre.toLowerCase()}.`,
    `Carta de arranque: ${arranque.nombre} (${NOMBRE_RAREZA[arranque.rareza].toLowerCase()}).`,
  ];
  if (opciones.padrino) {
    const h = herencia(opciones.padrino);
    aplicarAjustes(carrera, { rosca: h.rosca, caja: h.caja });
    carrera.construccion += h.construccion;
    carrera.padrino = { nombre: opciones.padrino.nombre, partido: opciones.padrino.partido };
    lineas.push(
      `Te apadrina ${opciones.padrino.nombre}: heredás contactos y gente (Rosca +${h.rosca}, Construcción +${h.construccion}${h.caja ? `, ${textoCantidad('caja', h.caja)}` : ''}).`,
    );
    registrarLogro(carrera, '🤝', `Delfín de ${opciones.padrino.nombre}`);
  }
  if (!enElCentroDelPoder(carrera)) {
    lineas.push('Estás lejos de Buenos Aires: crecer desde acá cuesta el doble.');
  }
  carrera.historial.push({ anio, edad: EDAD_INICIAL, lineas });
  carrera.inicioPeriodo = { anio, ...foto(carrera) };
  carrera.cartas = generarCartas(carrera.azar, carrera.edad);
  return carrera;
}

/** Hacer política en la Ciudad o la provincia de Buenos Aires: cerca del poder. */
export function enElCentroDelPoder(carrera: Pick<Carrera, 'base'>): boolean {
  return CENTRO_DEL_PODER.includes(carrera.base);
}

/** Lo que cuesta instalarse en Buenos Aires, en dólares. */
export const COSTO_MUDANZA = 8000;

export function puedeMudarse(carrera: Carrera): boolean {
  return !carrera.fin && !carrera.detencion && !enElCentroDelPoder(carrera) && carrera.medidores.caja >= COSTO_MUDANZA;
}

/**
 * Te mudás al conurbano para estar cerca del poder. Cuesta plata y la mitad
 * de tu territorio: el barrio que construiste queda lejos. No pasa el año.
 */
export function mudarseABuenosAires(anterior: Carrera): Carrera {
  if (!puedeMudarse(anterior)) throw new Error('No se puede mudar ahora');
  const carrera = structuredClone(anterior);
  const territorioPerdido = Math.floor(carrera.atributos.territorio / 2);
  carrera.medidores.caja -= COSTO_MUDANZA;
  aplicar(carrera, 'territorio', -territorioPerdido);
  carrera.base = 'Buenos Aires';
  anotar(carrera, [
    `Te mudaste a Buenos Aires para estar cerca del poder (${textoCantidad('caja', -COSTO_MUDANZA)}, Territorio ${textoCantidad('territorio', -territorioPerdido)}).`,
  ]);
  registrarLogro(carrera, '🚚', 'Te instalaste en Buenos Aires');
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

export function sortearRareza(azar: EstadoAzar, edad: number): Rareza {
  const tirada = siguiente(azar);
  if (edad >= EDAD_MINIMA_ICONICA && tirada < PROBABILIDAD_RAREZA.iconica) return 'iconica';
  if (tirada < PROBABILIDAD_RAREZA.iconica + PROBABILIDAD_RAREZA.dorada) return 'dorada';
  if (tirada < PROBABILIDAD_RAREZA.iconica + PROBABILIDAD_RAREZA.dorada + PROBABILIDAD_RAREZA.rara) return 'rara';
  return 'comun';
}

/** Tres cartas distintas para el armado del año. */
export function generarCartas(azar: EstadoAzar, edad: number): Carta[] {
  const disponibles = [...CARTAS];
  const cartas: Carta[] = [];
  while (cartas.length < 3) {
    const indice = entero(azar, 0, disponibles.length - 1);
    const [def] = disponibles.splice(indice, 1);
    cartas.push({ id: def.id, rareza: sortearRareza(azar, edad) });
  }
  return cartas;
}

/**
 * Cuánto suma una carta y sobre qué. Lejos de Buenos Aires, la fama que da
 * una carta rinde la mitad: lo que pasa en el interior llega menos a todo el país.
 */
export function efectoDeCarta(carta: Carta, lejosDelPoder = false, carrera?: Carrera): { clave: Atributo | Medidor; cantidad: number } {
  const def = buscarCarta(carta.id);
  const clave = def.efecto.tipo === 'atributo' ? def.efecto.atributo : def.efecto.medidor;
  if (clave === 'caja' && carrera) return { clave, cantidad: gananciaProporcional(carrera, PORCENTAJE_CAJA[carta.rareza]) };
  // Cada carta vale por varios años del turno.
  const cantidad = MAGNITUDES[clave][carta.rareza] * FACTOR_CARTA;
  return { clave, cantidad: lejosDelPoder && clave === 'fama' ? Math.ceil(cantidad / 2) : cantidad };
}

export interface Desgaste {
  nivel: 'ninguno' | 'leve' | 'fuerte' | 'total';
  fama: number;
  imagen: number;
}

/**
 * Lo que cobra la política por estar mucho tiempo: la gente se cansa de ver
 * siempre la misma cara. Arranca a los 15 años de carrera y se agrava.
 */
export function desgastePolitico(aniosEnPolitica: number): Desgaste {
  if (aniosEnPolitica >= 35) return { nivel: 'total', fama: -3, imagen: -3 };
  if (aniosEnPolitica >= 25) return { nivel: 'fuerte', fama: -2, imagen: -2 };
  if (aniosEnPolitica >= 15) return { nivel: 'leve', fama: -1, imagen: -1 };
  return { nivel: 'ninguno', fama: 0, imagen: 0 };
}

export const NOMBRE_DESGASTE: Record<Desgaste['nivel'], string> = {
  ninguno: 'Cara nueva',
  leve: 'Desgaste leve',
  fuerte: 'Desgaste fuerte',
  total: 'Quemado',
};

/** Cambio anual de un atributo por la edad: se aprende de joven, se gasta de grande. */
export function cambioPorEdad(azar: EstadoAzar, atributo: Atributo, edad: number): number {
  const tirar = (min: number, max: number) => entero(azar, min, max);
  switch (atributo) {
    case 'rosca':
      if (edad < 60) return tirar(0, 2);
      if (edad < 75) return tirar(0, 1);
      return tirar(-1, 0);
    case 'territorio':
      if (edad < 70) return tirar(0, 1);
      return tirar(-1, 0);
    case 'gestion':
      if (edad < 55) return tirar(0, 1);
      if (edad < 70) return 0;
      return tirar(-1, 0);
  }
}

/** Desde los 50, cada año resta esto de lo que te protege el Territorio: el cuerpo se gasta igual. */
export const DESGASTE_SALUD = 2.5;

/** Probabilidad de que la salud termine la carrera este año. */
export function probabilidadFinPorSalud(edad: number, territorio: number): number {
  if (edad < 55) return 0;
  const base = ((edad - 55) / 40) ** 2 * 0.35;
  // Con más territorio, más resistencia: la gente te sostiene. Pero la edad la gasta.
  const resistencia = Math.max(0, territorio - Math.max(0, edad - 50) * DESGASTE_SALUD);
  const factor = 1.6 - resistencia / 80;
  return acotar(base * factor, 0, 1);
}

/**
 * Elige una carta del armado y hace pasar el año. Devuelve una carrera nueva:
 * la anterior no se toca.
 */
export function elegirCarta(anterior: Carrera, indice: number): Carrera {
  if (anterior.fin) throw new Error('La carrera ya terminó');
  if (anterior.detencion) throw new Error('Primero hay que resolver la orden de detención');
  if (anterior.entrevista) throw new Error('Primero hay que terminar la entrevista');
  if (anterior.pases) throw new Error('Primero hay que decidir en el cierre de listas');
  if (anterior.eleccion) throw new Error('Primero hay que terminar la elección');
  if (anterior.evento) throw new Error('Primero hay que resolver el evento');
  if (anterior.formacion) throw new Error('Primero terminá tus años de militancia');
  const carta = anterior.cartas[indice];
  if (!carta) throw new Error(`No hay carta en la posición ${indice}`);

  const carrera = structuredClone(anterior);
  const lineas: string[] = [];

  const { clave, cantidad } = efectoDeCarta(carta, !enElCentroDelPoder(carrera), carrera);
  aplicar(carrera, clave, cantidad);
  lineas.push(
    `Armado del año: ${buscarCarta(carta.id).nombre} (${NOMBRE_RAREZA[carta.rareza].toLowerCase()}). ${nombreDe(clave)} ${textoCantidad(clave, cantidad)}.`,
  );

  if (carta.rareza === 'iconica') registrarLogro(carrera, '💎', `Carta icónica: ${buscarCarta(carta.id).nombre}`);

  // El turno llega hasta la próxima elección (cuatro años como mucho). Se corta antes si aparece algo para decidir.
  const largo = aniosDelTurno(anterior.anio);
  pasarAnio(carrera, lineas, largo === 1);
  for (let i = 1; i < largo && !carrera.fin && !esperaDecision(carrera); i++) pasarAnio(carrera, [], i === largo - 1);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/** Cuántos años dura el turno que arranca en `anio`: hasta el próximo año de elecciones, como mucho `ANIOS_POR_TURNO`. */
export function aniosDelTurno(anio: number): number {
  let largo = 1;
  while (largo < ANIOS_POR_TURNO && !esAnioElectoral(anio + largo)) largo++;
  return largo;
}

/** Cuántos años pasan con cada carta, como mucho. */
export const ANIOS_POR_TURNO = 4;
/** Cuánto más rinde una carta, porque vale por varios años. */
export const FACTOR_CARTA = 3;

/** Algo que el jugador tiene que resolver antes de que siga el tiempo. */
const esperaDecision = (c: Carrera) => !!(c.detencion || c.pases || c.eleccion || c.evento);

/** Cerrás la pantalla de festejo o de balance que estaba primera en la fila. */
export function descartarPendiente(anterior: Carrera): Carrera {
  if (!anterior.pendientes.length) return anterior;
  const carrera = structuredClone(anterior);
  carrera.pendientes.shift();
  return carrera;
}

/** Deja la política por decisión propia: retiro o pase al sector privado. */
export function retirarse(anterior: Carrera, motivo: 'retiro' | 'privado' = 'retiro'): Carrera {
  if (anterior.fin) return anterior;
  if (anterior.detencion) throw new Error('Con una orden de detención no hay retiro tranquilo');
  const carrera = structuredClone(anterior);
  const linea = motivo === 'privado' ? 'Dejaste la política para trabajar en el sector privado.' : 'Anunciaste tu retiro de la política.';
  carrera.historial.unshift({ anio: carrera.anio, edad: carrera.edad, lineas: [linea] });
  terminar(carrera, motivo);
  return carrera;
}

/** Lo que cuesta irse del país y vivir afuera, en dólares. Se puede pagar con plata negra. */
export const COSTO_EXILIO = 30000;
/** Lo que cuestan los abogados para pelear la causa, en dólares. */
export const COSTO_ABOGADOS = 15000;

/** Probabilidad de ganar la pelea en la Justicia y seguir en carrera. */
export function probabilidadZafar(carrera: Carrera): number {
  const { causas, caja } = carrera.medidores;
  const porPlata = acotar(caja / 200000, 0, 0.2);
  return acotar(0.25 + carrera.atributos.rosca / 400 + porPlata - causas / 400 + bonoZafar(carrera), 0.05, 0.85);
}

/** Qué salidas hay frente a la orden de detención. */
export function salidasDisponibles(carrera: Carrera): SalidaDetencion[] {
  const salidas: SalidaDetencion[] = ['entregarse', 'pelear'];
  if (carrera.medidores.caja + carrera.cajaNegra >= COSTO_EXILIO) salidas.push('exilio');
  return salidas;
}

export function resolverDetencion(anterior: Carrera, salida: SalidaDetencion): Carrera {
  if (!anterior.detencion) throw new Error('No hay ninguna orden de detención');
  if (!salidasDisponibles(anterior).includes(salida)) throw new Error(`Salida no disponible: ${salida}`);
  const carrera = structuredClone(anterior);
  carrera.detencion = false;
  const lineas: string[] = [];

  if (salida === 'entregarse') {
    lineas.push('Te presentaste ante la Justicia. Quedaste detenido.');
    const decomiso = decomisar(carrera);
    if (decomiso) lineas.push(decomiso);
    terminar(carrera, 'preso');
  } else if (salida === 'exilio') {
    // Primero se usa la plata negra: para eso estaba.
    const deNegro = Math.min(carrera.cajaNegra, COSTO_EXILIO);
    carrera.cajaNegra -= deNegro;
    carrera.medidores.caja -= COSTO_EXILIO - deNegro;
    lineas.push(
      `Te fuiste del país antes de que te detuvieran (US$ ${COSTO_EXILIO.toLocaleString('es-AR')}${deNegro ? `, ${deNegro === COSTO_EXILIO ? 'todo' : `US$ ${deNegro.toLocaleString('es-AR')}`} en negro` : ''}).`,
    );
    terminar(carrera, 'exilio');
  } else {
    carrera.medidores.caja -= COSTO_ABOGADOS;
    if (chance(carrera.azar, probabilidadZafar(anterior))) {
      carrera.medidores.causas = acotar(carrera.medidores.causas - 30, 0, 100);
      carrera.medidores.imagen = acotar(carrera.medidores.imagen - 5, 0, 100);
      lineas.push(
        `Tus abogados frenaron la detención (${textoCantidad('caja', -COSTO_ABOGADOS)}). Causas −30, Imagen −5. Seguís en carrera.`,
      );
      registrarLogro(carrera, '⚖️', 'Zafaste de una orden de detención');
      // La causa vuelve a foja cero: imputado, pero libre.
      carrera.proceso = { etapa: 'imputacion', desde: carrera.proceso?.desde ?? carrera.anio };
      carrera.cartas = generarCartas(carrera.azar, carrera.edad);
    } else {
      lineas.push(`Perdiste en la Justicia (${textoCantidad('caja', -COSTO_ABOGADOS)}). Quedaste detenido.`);
      const decomiso = decomisar(carrera);
      if (decomiso) lineas.push(decomiso);
      terminar(carrera, 'preso');
    }
  }
  carrera.historial.unshift({ anio: carrera.anio, edad: carrera.edad, lineas });
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

function pasarAnio(carrera: Carrera, lineas: string[], cierraTurno = true) {
  const { azar } = carrera;
  delete carrera.cola;
  const anio = carrera.anio;
  const edad = carrera.edad;

  // La edad mueve los atributos.
  const cambios: string[] = [];
  for (const atributo of ATRIBUTOS) {
    const cambio = cambioPorEdad(azar, atributo, edad);
    if (cambio !== 0) {
      aplicar(carrera, atributo, cambio);
      cambios.push(`${NOMBRE_ATRIBUTO[atributo]} ${textoCantidad(atributo, cambio)}`);
    }
  }
  if (cambios.length) lineas.push(`Con el año: ${cambios.join(', ')}.`);

  // Los medidores vuelven solos hacia su lugar.
  const m = carrera.medidores;
  // La fama se apaga un 6 % por año (lejos de Buenos Aires, más rápido)…
  if (m.fama > 5) {
    const olvido = Math.max(1, Math.round(m.fama * (enElCentroDelPoder(carrera) ? 0.06 : 0.09)));
    m.fama = acotar(m.fama - olvido, 5, 100);
  }
  // …pero tener un cargo te da visibilidad.
  const visibilidad = CARGOS[carrera.cargo].rango;
  if (visibilidad) {
    aplicar(carrera, 'fama', visibilidad);
    lineas.push(`Tu cargo te da visibilidad: Fama +${visibilidad}.`);
  }
  // La imagen vuelve sola hacia el medio. Con las manos limpias, el medio es un poco más alto.
  const centroImagen = manosLimpias(carrera) && carrera.edad >= 30 ? 55 : 50;
  m.imagen = acotar(Math.round(m.imagen + (centroImagen - m.imagen) * 0.15 + ruido(azar, 3)), 0, 100);
  // Las causas se enfrían solas… salvo el rastro que dejan las coimas: eso no se borra.
  m.causas = Math.max(Math.min(m.causas, pisoDeCausas(carrera)), m.causas - 2);

  // Muchos años en política gastan: la gente se cansa de la misma cara.
  const desgaste = desgastePolitico(anio - carrera.anioInicio);
  if (desgaste.nivel !== 'ninguno') {
    const famaAntes = m.fama;
    m.fama = Math.max(Math.min(famaAntes, 5), m.fama + desgaste.fama);
    m.imagen = acotar(m.imagen + desgaste.imagen, 0, 100);
    const partes = [
      m.fama !== famaAntes ? `Fama ${textoCantidad('fama', m.fama - famaAntes)}` : '',
      `Imagen ${textoCantidad('imagen', desgaste.imagen)}`,
    ].filter(Boolean);
    lineas.push(`${NOMBRE_DESGASTE[desgaste.nivel]}: la gente se cansa de verte siempre (${partes.join(', ')}).`);
  }

  // Haber sido presidente pesa: los primeros ocho años, todo se gasta más rápido.
  lineas.push(...desgasteExpresidente(carrera));

  // El país, si lo gobernás.
  lineas.push(...anioDelPais(carrera));
  // Tu intendencia o tu provincia, si la gobernás.
  lineas.push(...anioDelDistrito(carrera));

  // El Congreso: el presupuesto de cada año y, a mitad del mandato, las legislativas.
  lineas.push(...anioDelCongreso(carrera));

  // Las crisis: pesan, se cierran solas o empiezan (antes de que la calle se enfríe).
  lineas.push(...anioDeLasCrisis(carrera));

  // La calle: si está caliente, el poder se te escurre. La bronca se enfría sola.
  lineas.push(...anioDeLaCalle(carrera));

  // El poder se ejerce o se pierde: se acerca al que te da tu lugar.
  lineas.push(...efectoAnualDelPoder(carrera));

  // Lo que compraste en la tienda trabaja para vos.
  const tienda = aplicarCompras(carrera);
  lineas.push(...tienda.lineas);

  // La construcción política crece con territorio, imagen y lealtad. Arriba de 50 cuesta cada vez más.
  const territorio = carrera.atributos.territorio;
  const lealtad = anio - carrera.partidoDesde >= 8 ? 1 : 0;
  const porImagen = m.imagen >= 60 ? 1 : m.imagen < 35 ? -1 : 0;
  let crece = (territorio >= 30 ? 1 : 0) + (territorio >= 60 ? 1 : 0) + porImagen + lealtad + tienda.construccion;
  // Para ser prócer, además, te tienen que querer.
  crece = construccionReal(carrera, crece);
  moverConstruccion(carrera, crece);
  if (crece) {
    lineas.push(
      `Construcción política ${crece > 0 ? '+' : '−'}${Math.abs(crece)}: ${ETAPA[etapaDe(carrera.construccion)].nombre}, ${carrera.construccion}/100.`,
    );
  }
  // Tus delfines crecen con vos (o se van).
  lineas.push(...anioDeLosDelfines(carrera));

  // Parte del sueldo va para la agrupación, y sostener la estructura cuesta un fijo y el 3 % de lo que tenés.
  const ingreso = CARGOS[carrera.cargo].ingresoAnual;
  const aporte = aporteAgrupacion(carrera);
  const gasto = gastoDeEstructura(carrera);
  m.caja += ingreso - aporte - gasto;
  lineas.push(
    `Sueldo ${textoCantidad('caja', ingreso)}${aporte ? `, aporte a la agrupación ${textoCantidad('caja', -aporte)}` : ''}, estructura ${textoCantidad('caja', -gasto)}: ${textoCantidad('caja', ingreso - aporte - gasto)} en el año.`,
  );
  vencerMandato(carrera, lineas);

  // El primer año se suma a la entrada del armado, que ya es de ese año.
  anotar(carrera, lineas);
  carrera.trayectoria.push({
    anio,
    edad,
    cargo: carrera.cargo,
    partido: carrera.partido,
    poder: m.poder,
    fama: m.fama,
    imagen: m.imagen,
    construccion: carrera.construccion,
  });
  carrera.anio = anio + 1;
  carrera.edad = edad + 1;

  // A los 65 te jubilás, tengas el cargo que tengas.
  if (carrera.edad >= EDAD_JUBILACION) {
    anotar(carrera, [`A los ${EDAD_JUBILACION} te jubilaste de la política.`]);
    terminar(carrera, 'retiro');
    return;
  }
  // ¿La salud deja seguir?
  if (carrera.edad >= EDAD_LIMITE) {
    terminar(carrera, 'muerte');
    return;
  }
  if (chance(azar, probabilidadFinPorSalud(carrera.edad, carrera.atributos.territorio) * factorSalud(carrera))) {
    const motivo: MotivoFin = carrera.edad < 75 && chance(azar, 0.7) ? 'salud' : 'muerte';
    terminar(carrera, motivo);
    return;
  }

  // Cada cuatro años, el balance del período.
  if (carrera.anio - carrera.inicioPeriodo.anio >= ANIOS_PERIODO) {
    const { anio: desde, ...antes } = carrera.inicioPeriodo;
    anotar(carrera, [textoBalance(desde, carrera.anio - 1, antes, foto(carrera))]);
    carrera.inicioPeriodo = { anio: carrera.anio, ...foto(carrera) };
  }

  // La Justicia: se abren, avanzan o se archivan las causas.
  avanzarJusticia(carrera);
  if (carrera.detencion) {
    carrera.cartas = [];
    return;
  }

  // Año electoral: primero el cierre de listas, después las candidaturas.
  // Si nadie te ofrece subir, renovás sin pantalla.
  const pases = generarPases(carrera);
  if (pases && hayOfertaMejor(carrera, pases)) carrera.pases = pases;
  else if (pases) renovarSinPreguntar(carrera, pases[0]);
  if (abrirEleccion(carrera)) {
    carrera.eleccion = { fase: 'candidatura' };
    // Si hay un solo cargo posible, vas directo a la campaña (con la opción de bajarte).
    const posibles = cargosPosibles(carrera);
    if (posibles.length === 1) Object.assign(carrera, elegirCandidatura(carrera, posibles[0]));
  }
  // Los eventos y las leyes llegan al cerrar el turno, junto con la elección si la hay.
  if (cierraTurno) {
    // Y a veces pasan cosas (si la Justicia no te citó ya).
    if (!carrera.evento) {
      const evento = sortearEvento(carrera);
      if (evento) carrera.evento = evento;
    }
    // El presidente, además, manda un proyecto de ley: llega después del evento, si hay uno.
    const ley = sortearLey(carrera);
    if (ley) {
      if (carrera.evento) carrera.cola = [ley];
      else carrera.evento = ley;
    }
  }
  carrera.cartas = generarCartas(azar, carrera.edad);
}

/** El balance del período, en una línea de la bitácora. */
export function textoBalance(desde: number, hasta: number, antes: Foto, despues: Foto): string {
  const partes = (['poder', 'fama', 'imagen', 'construccion'] as const)
    .map((k) => [k, despues[k] - antes[k]] as const)
    .filter(([, d]) => d !== 0)
    .map(([k, d]) => `${k === 'construccion' ? 'Construcción' : nombreDe(k)} ${d > 0 ? '+' : '−'}${Math.abs(d)}`);
  const caja = despues.caja - antes.caja;
  if (caja) partes.push(textoCantidad('caja', caja));
  return `📊 Balance ${desde}–${hasta}: ${partes.length ? partes.join(', ') : 'todo igual'}.`;
}

/** Cada cuántos años se hace el balance. */
export const ANIOS_PERIODO = 8;

/** Cuántos años dura el desgaste de haber sido presidente. */
export const ANIOS_DESGASTE_EXPRESIDENTE = 8;

/** El peso de haber sido presidente: Fama −2, Imagen −2 y −1 en cada atributo por año. */
export function desgasteExpresidente(carrera: Carrera): string[] {
  if (carrera.expresidente === undefined || carrera.cargo === 'presidente') return [];
  if (carrera.anio - carrera.expresidente >= ANIOS_DESGASTE_EXPRESIDENTE) return [];
  aplicar(carrera, 'fama', -2);
  aplicar(carrera, 'imagen', -2);
  for (const a of ATRIBUTOS) aplicar(carrera, a, -1);
  return ['🏛️ El peso de haber sido presidente: Fama −2, Imagen −2 y −1 en cada atributo.'];
}

/** La calle en el año: con bronca alta, el poder se escurre; la bronca se enfría sola. */
export function anioDeLaCalle(carrera: Carrera): string[] {
  const lineas: string[] = [];
  if (carrera.cargo !== 'militante' && carrera.medidores.imagen < 30) subirMalestar(carrera, 5);
  const malestar = carrera.malestar ?? 0;
  if (malestar >= MALESTAR_ALTO) {
    aplicar(carrera, 'poder', -3);
    lineas.push(`✊ La calle está caliente (${malestar}): Poder −3.`);
  }
  if (malestar) carrera.malestar = Math.floor(malestar * 0.75);
  return lineas;
}

export const TEXTO_FIN: Record<MotivoFin, string> = {
  retiro: 'Te retiraste de la política por decisión propia.',
  privado: 'Dejaste la política para trabajar en el sector privado.',
  preso: 'Terminaste preso. Tu carrera política se terminó tras las rejas.',
  exilio: 'Te fuiste del país para no quedar preso. Seguís la política argentina desde el exterior.',
  salud: 'La salud te obligó a dejar la política.',
  muerte: 'Moriste. La política argentina despide a una de sus figuras.',
  destituido: 'El Congreso te destituyó en un juicio político. Saliste de la Rosada por la puerta de atrás.',
  renuncia: 'Renunciaste a la presidencia antes de terminar el mandato.',
  caos: 'Te tuviste que ir en medio del caos: una crisis institucional terminó con tu gobierno.',
};
