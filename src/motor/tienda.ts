import { ITEMS, buscarItem } from '../datos/tienda';
import type { Efectos } from '../datos/tienda';
import { anotar, aplicarEfectos, diferencias, registrarLogro, textoCantidad, textoEfectos } from './ficha';
import type { Carrera } from './tipos';

/** Lo que tenés y sigue andando: el equipo, los lujos y los consumibles vigentes. */
export function vigentes(carrera: Carrera) {
  return carrera.compras.filter((c) => c.hasta === undefined || c.hasta >= carrera.anio).map((c) => buscarItem(c.id));
}

export const tiene = (carrera: Carrera, id: string) => vigentes(carrera).some((i) => i.id === id);

/** Cuántos años le quedan a un consumible, contando el actual. */
export function aniosRestantes(carrera: Carrera, id: string): number {
  const compra = carrera.compras.find((c) => c.id === id && c.hasta !== undefined && c.hasta >= carrera.anio);
  return compra ? compra.hasta! - carrera.anio + 1 : 0;
}

export function motivoSinCompra(carrera: Carrera, id: string): string | null {
  const item = buscarItem(id);
  if (carrera.fin || carrera.detencion || carrera.entrevista || carrera.pases || carrera.eleccion || carrera.evento) return 'Ahora no.';
  if (tiene(carrera, id)) return item.seccion === 'consumible' ? 'Ya está activo.' : 'Ya lo tenés.';
  if (carrera.medidores.caja < item.costo) return 'No te alcanza la caja.';
  return null;
}

export function comprar(anterior: Carrera, id: string): Carrera {
  const motivo = motivoSinCompra(anterior, id);
  if (motivo) throw new Error(motivo);
  const item = buscarItem(id);
  const carrera = structuredClone(anterior);
  carrera.medidores.caja -= item.costo;
  carrera.compras = carrera.compras.filter((c) => c.id !== id);
  carrera.compras.push(item.anios ? { id, hasta: carrera.anio + item.anios - 1 } : { id });
  let detalle = textoCantidad('caja', -item.costo);
  if (item.alComprar) {
    aplicarEfectos(carrera, item.alComprar);
    detalle = `${textoEfectos(item.alComprar)}, ${detalle}`;
  }
  anotar(carrera, [`Tienda: ${item.nombre} (${detalle}).`]);
  if (item.seccion === 'lujo') registrarLogro(carrera, item.icono, `Te diste el gusto: ${item.nombre}`);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

/**
 * Al cerrar el año: suma lo que dan el equipo y los consumibles, y saca los que
 * se terminaron. Devuelve la construcción extra para sumar con la del año.
 */
export function aplicarCompras(carrera: Carrera): { construccion: number; lineas: string[] } {
  const activos = vigentes(carrera);
  const total: Efectos = {};
  let construccion = 0;
  for (const item of activos) {
    for (const [clave, cantidad] of Object.entries(item.anual ?? {})) {
      total[clave as keyof Efectos] = (total[clave as keyof Efectos] ?? 0) + cantidad!;
    }
    construccion += item.construccion ?? 0;
  }
  aplicarEfectos(carrera, total);
  const vencidos = carrera.compras.filter((c) => c.hasta !== undefined && c.hasta <= carrera.anio);
  carrera.compras = carrera.compras.filter((c) => c.hasta === undefined || c.hasta > carrera.anio);

  const lineas: string[] = [];
  if (Object.keys(total).length) lineas.push(`Tu equipo y lo que pagaste: ${textoEfectos(total)}.`);
  if (vencidos.length) lineas.push(`Se terminó: ${vencidos.map((c) => buscarItem(c.id).nombre).join(', ')}.`);
  return { construccion, lineas };
}

export const bonoEntrevista = (carrera: Carrera) => vigentes(carrera).reduce((s, i) => s + (i.entrevista ?? 0), 0);
export const bonoZafar = (carrera: Carrera) => (carrera.compras ? vigentes(carrera).reduce((s, i) => s + (i.zafar ?? 0), 0) : 0);
export const factorSalud = (carrera: Carrera) => vigentes(carrera).reduce((f, i) => f * (i.salud ?? 1), 1);

export { ITEMS };
