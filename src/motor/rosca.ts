import { BLOQUES_ROSCA } from '../datos/rosca';
import { buscarEvento } from '../datos/eventos';
import type { Opcion, Resultado } from '../datos/eventos';
import { BLOQUE_TIPICO, MAYORIA_DIPUTADOS, MAYORIA_SENADO } from '../datos/leyes';
import { chance, entero, siguiente } from './azar';
import type { EstadoAzar } from './azar';
import { costoProporcional } from './escala';
import { cerrarEvento, esAzaroso, resolverEvento } from './eventos';
import type { Desenlace } from './eventos';
import { acotar } from './ficha';
import { anotarFavor } from './poder';
import type { BloqueRosca, Carrera, PedidoRosca, RoscaEnCurso } from './tipos';

/** Lo que cuesta cada pedido, cuando se vota. */
export const COSTO_OBRA = 0.03;
export const COSTO_CARGO = 2;
export const FACTOR_CAMBIO = 0.75;
const FACTOR_MINIMO = 0.4;

const bloqueDe = (c: Pick<Carrera, 'congreso'>) => c.congreso ?? BLOQUE_TIPICO;

export const tieneMayoria = (c: Pick<Carrera, 'congreso'>) => {
  const b = bloqueDe(c);
  return b.diputados >= MAYORIA_DIPUTADOS && b.senadores >= MAYORIA_SENADO;
};

/** El presupuesto de rosca: sale de tu Rosca y tu Poder. */
export const fichasDeRosca = (c: Carrera) => Math.round(8 + c.atributos.rosca / 20 + c.medidores.poder / 25);

/**
 * Lo que costaría arreglar con todos: cuanto más lejos estás de la mayoría, más
 * te piden. Como juntan una vez y media lo que falta, llegar justo sale dos
 * tercios de esto: con Rosca y Poder 50 se llega si te faltan menos de un 30 %.
 */
export const precioDeLaMesa = (c: Pick<Carrera, 'congreso'>) => {
  const b = bloqueDe(c);
  return 9.5 + 24 * (1 - Math.min(b.diputados / MAYORIA_DIPUTADOS, b.senadores / MAYORIA_SENADO, 1));
};

function mezclar<T>(azar: EstadoAzar, lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = entero(azar, 0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** De 6 a 8 bloques que juntan bastante más de lo que te falta: hay que elegir. */
export function armarRosca(azar: EstadoAzar, carrera: Carrera): RoscaEnCurso {
  const propio = bloqueDe(carrera);
  const faltanD = Math.max(0, MAYORIA_DIPUTADOS - propio.diputados);
  const faltanS = Math.max(0, MAYORIA_SENADO - propio.senadores);
  const elegidos = mezclar(azar, BLOQUES_ROSCA).slice(0, entero(azar, 6, 8));
  const conPeso = elegidos.map((b) => ({ ...b, ajuste: 0.75 + siguiente(azar) * 0.5 }));
  const sumaD = conPeso.reduce((s, b) => s + b.diputados * b.ajuste, 0);
  const sumaS = conPeso.reduce((s, b) => s + b.senadores * b.ajuste, 0);
  const totalD = Math.max(faltanD * 1.5, 24);
  const totalS = Math.max(faltanS * 1.5, 8);
  const bloques: BloqueRosca[] = conPeso.map((b) => {
    const diputados = Math.max(1, Math.round((totalD * b.diputados * b.ajuste) / sumaD));
    const senadores = Math.round((totalS * b.senadores * b.ajuste) / sumaS);
    const parte = (diputados / totalD + senadores / totalS) / 2;
    return { nombre: b.nombre, diputados, senadores, pide: b.pide, costo: Math.max(1, Math.round(precioDeLaMesa(carrera) * parte)) };
  });
  // Una o dos peleas: si arreglás con uno, el otro se ofende.
  const orden = mezclar(
    azar,
    bloques.map((_, i) => i),
  );
  const peleas = entero(azar, 1, 2);
  for (let i = 0; i < peleas; i++) {
    const [a, b] = [orden[i * 2], orden[i * 2 + 1]];
    bloques[a].rival = b;
    bloques[b].rival = a;
  }
  return { bloques, fichas: fichasDeRosca(carrera), arreglados: [] };
}

function opcionDeRosca(carrera: Carrera): Opcion | undefined {
  return carrera.evento ? buscarEvento(carrera.evento.id).opciones.find((o) => o.rosca) : undefined;
}

/** Elegís rosquearla vos: se arma la mesa. El evento sigue abierto hasta que se vote. */
export function iniciarRosca(anterior: Carrera): Carrera {
  const opcion = opcionDeRosca(anterior);
  if (!opcion) throw new Error('Este evento no se rosquea');
  const motivo = opcion.requiere?.(anterior);
  if (motivo) throw new Error(motivo);
  const carrera = structuredClone(anterior);
  carrera.rosca = armarRosca(carrera.azar, carrera);
  carrera.cambios = undefined;
  return carrera;
}

export const fichasLibres = (r: RoscaEnCurso) => r.fichas - r.arreglados.reduce((s, i) => s + r.bloques[i].costo, 0);

const cuantos = (r: RoscaEnCurso, pedido: PedidoRosca) => r.arreglados.filter((i) => r.bloques[i].pide === pedido).length;

/** Por qué no podés arreglar con ese bloque, o null. */
export function motivoSinBloque(carrera: Carrera, indice: number): string | null {
  const r = carrera.rosca!;
  const b = r.bloques[indice];
  if (r.arreglados.includes(indice)) return null;
  if (b.rival !== undefined && r.arreglados.includes(b.rival)) return `Se ofendió: arreglaste con ${r.bloques[b.rival].nombre}.`;
  if (b.costo > fichasLibres(r)) return 'No te alcanza la rosca.';
  if (b.pide === 'obra' && costoProporcional(carrera, COSTO_OBRA * (cuantos(r, 'obra') + 1)) > carrera.medidores.caja) {
    return 'No te alcanza la caja.';
  }
  return null;
}

/** Arreglás con un bloque, o te echás atrás. Nada se paga hasta que se vota. */
export function alternarBloque(anterior: Carrera, indice: number): Carrera {
  if (!anterior.rosca) throw new Error('No hay ninguna rosca en curso');
  const motivo = motivoSinBloque(anterior, indice);
  if (motivo) throw new Error(motivo);
  const carrera = structuredClone(anterior);
  const r = carrera.rosca!;
  r.arreglados = r.arreglados.includes(indice) ? r.arreglados.filter((i) => i !== indice) : [...r.arreglados, indice];
  carrera.cambios = undefined;
  return carrera;
}

/** Los votos que juntaste hasta ahora. */
export function conteoRosca(carrera: Carrera): { diputados: number; senadores: number; alcanza: boolean } {
  const propio = bloqueDe(carrera);
  const r = carrera.rosca!;
  const diputados = propio.diputados + r.arreglados.reduce((s, i) => s + r.bloques[i].diputados, 0);
  const senadores = propio.senadores + r.arreglados.reduce((s, i) => s + r.bloques[i].senadores, 0);
  return { diputados, senadores, alcanza: diputados >= MAYORIA_DIPUTADOS && senadores >= MAYORIA_SENADO };
}

/** Chance de que un bloque que prometió el voto falte: las leyes difíciles asustan, y tu Rosca los ata. */
export const chanceDeFaltazo = (carrera: Carrera, dificultad: number) =>
  acotar(0.05 + dificultad * 0.5 - (carrera.atributos.rosca - 50) / 1000, 0.02, 0.2);

/** La ley, con lo que cediste en el texto: rinde menos, salvo lo que te cuesta. */
function conCambios(r: Resultado, cambios: number): Resultado {
  if (!cambios) return r;
  const factor = Math.max(FACTOR_MINIMO, FACTOR_CAMBIO ** cambios);
  const achicar = (x: number) => (x > 0 ? Math.ceil(x * factor) : x);
  const pais = r.pais && Object.fromEntries(Object.entries(r.pais).map(([k, v]) => [k, Math.round(v * factor)]));
  const efectos = r.efectos && Object.fromEntries(Object.entries(r.efectos).map(([k, v]) => [k, achicar(v)]));
  return { ...r, texto: `${r.texto} Salió con cambios: rinde menos de lo que querías.`, pais, efectos };
}

/** Se llama a votar. Los que prometieron pueden faltar, y lo cedido se paga salga o no. */
export function votarRosca(anterior: Carrera): { carrera: Carrera; desenlace: Desenlace } {
  if (!anterior.rosca || !anterior.evento) throw new Error('No hay ninguna rosca en curso');
  const e = buscarEvento(anterior.evento.id);
  const opcion = e.opciones.find((o) => o.rosca)!;
  const carrera = structuredClone(anterior);
  const r = carrera.rosca!;
  delete carrera.rosca;

  const faltaron = r.arreglados.filter(() => chance(carrera.azar, chanceDeFaltazo(carrera, opcion.rosca!.dificultad)));
  const presentes = r.arreglados.filter((i) => !faltaron.includes(i));
  const propio = bloqueDe(carrera);
  const diputados = propio.diputados + presentes.reduce((s, i) => s + r.bloques[i].diputados, 0);
  const senadores = propio.senadores + presentes.reduce((s, i) => s + r.bloques[i].senadores, 0);
  const salio = diputados >= MAYORIA_DIPUTADOS && senadores >= MAYORIA_SENADO;

  if (!esAzaroso(opcion.resultado)) throw new Error('La rosca necesita una opción con azar');
  const base = salio ? conCambios(opcion.resultado.exito, cuantos(r, 'cambio')) : opcion.resultado.fracaso;
  const obras = cuantos(r, 'obra');
  const cargos = cuantos(r, 'cargo');
  const aviso = faltaron.length ? ` A la hora de votar faltaron: ${faltaron.map((i) => r.bloques[i].nombre).join(', ')}.` : '';
  const final: Resultado = {
    ...base,
    texto: `${base.texto}${aviso} Votos: ${diputados} en Diputados y ${senadores} en el Senado.`,
    ...(cargos ? { efectos: { ...base.efectos, poder: (base.efectos?.poder ?? 0) - cargos * COSTO_CARGO } } : {}),
    ...(obras ? { plata: (base.plata ?? 0) - obras * COSTO_OBRA } : {}),
  };

  const promesas = r.arreglados.filter((i) => r.bloques[i].pide === 'promesa').map((i) => r.bloques[i].nombre);
  for (const quien of promesas) {
    anotarFavor(carrera, quien, true, 'Le prometiste algo para que te votara una ley');
    anotarFavor(carrera, quien, false, 'Quedó comprometido con tu gobierno después de la ley');
  }
  const cierre = cerrarEvento(anterior, carrera, e, opcion, final, salio);
  if (promesas.length) cierre.desenlace.favor = `Favores cruzados con ${promesas.join(', ')}.`;
  return cierre;
}

/** Que lo resuelva el equipo: se manda al Congreso, con la chance recortada. */
export function saltearRosca(anterior: Carrera): { carrera: Carrera; desenlace: Desenlace } {
  const carrera = structuredClone(anterior);
  delete carrera.rosca;
  return resolverEvento(carrera, 0);
}
