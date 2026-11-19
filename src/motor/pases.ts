import { EDAD_CANDIDATO } from '../datos/formacion';
import { CARGOS } from '../datos/cargos';
import { DISTANCIA_IMPERDONABLE, PARTIDOS, alPartido, distancia, elPartido } from '../datos/partidos';
import { entero } from './azar';
import { esAnioElectoral } from './elecciones';
import { ETAPA, anotar, aplicar, cambiarCargo, diferencias, moverConstruccion, registrarLogro, textoEfectos } from './ficha';
import { CARGOS_IDS, PARTIDOS_IDS } from './tipos';
import type { CargoId, Carrera, OfertaPase } from './tipos';

/** Fama o construcción mínimas para que alguien te llame en el cierre de listas. */
export const FAMA_PARA_PASES = 8;
export const CONSTRUCCION_PARA_PASES = 15;

export { esAnioElectoral };

/** El mejor cargo designado que te pueden dar. Los otros partidos, para tentarte, son más generosos. */
export function mejorCargo(carrera: Carrera, generosidad = 0): CargoId {
  let mejor: CargoId = 'militante';
  for (const id of CARGOS_IDS) {
    if (CARGOS[id].eleccion) continue;
    const requisitos = CARGOS[id].requisitos;
    const cumple = Object.entries(requisitos).every(([clave, minimo]) => {
      const valor = clave === 'construccion' ? carrera.construccion : carrera.atributos[clave as keyof Carrera['atributos']];
      return valor >= minimo! - generosidad;
    });
    if (cumple && CARGOS[id].rango > CARGOS[mejor].rango) mejor = id;
  }
  return mejor;
}

/** Lo que cuesta irte a otro espacio: más cuanto más lejos queda del tuyo. */
export function costoTraicion(carrera: Carrera, destino: OfertaPase['partido']) {
  const d = distancia(PARTIDOS[carrera.partido].posicion, PARTIDOS[destino].posicion);
  const imperdonable = d >= DISTANCIA_IMPERDONABLE;
  return {
    construccion: -Math.round(6 + (d / 283) * 24),
    imagen: imperdonable ? -6 : -2,
    imperdonable,
  };
}

/** Renovar con tu partido suma construcción. Arriba de Caudillo, solo si te quieren. */
function lealtadPorRenovar(carrera: Carrera): number {
  if (carrera.construccion < ETAPA.caudillo.desde) return 2;
  return carrera.medidores.imagen >= 55 ? 1 : 0;
}

/** Las ofertas del cierre de listas, o null si este año nadie te llama. */
export function generarPases(carrera: Carrera): OfertaPase[] | null {
  if (!esAnioElectoral(carrera.anio) || carrera.edad < EDAD_CANDIDATO) return null;
  if (carrera.medidores.fama < FAMA_PARA_PASES && carrera.construccion < CONSTRUCCION_PARA_PASES) return null;
  // A mitad de mandato nadie te ofrece nada: tu banca sigue.
  if (carrera.mandatoHasta !== undefined && carrera.mandatoHasta > carrera.anio) return null;

  const { azar } = carrera;
  // Con un cargo electivo, la banca es tuya: te la llevás a donde vayas.
  const electo = !!CARGOS[carrera.cargo].eleccion;
  const propio = electo ? carrera.cargo : mejorCargo(carrera);
  const ofertas: OfertaPase[] = [
    {
      partido: carrera.partido,
      renovacion: true,
      cargo: CARGOS[propio].rango > CARGOS[carrera.cargo].rango ? propio : carrera.cargo,
      caja: 0,
      fama: 0,
      construccion: lealtadPorRenovar(carrera),
      imagen: 0,
      imperdonable: false,
    },
  ];

  const otros = PARTIDOS_IDS.filter((p) => p !== carrera.partido);
  const cuantos = entero(azar, 2, 3);
  while (ofertas.length <= cuantos && otros.length) {
    const [partido] = otros.splice(entero(azar, 0, otros.length - 1), 1);
    const traicion = costoTraicion(carrera, partido);
    const valor = 1500 + carrera.medidores.fama * 250 + carrera.construccion * 150;
    ofertas.push({
      partido,
      renovacion: false,
      cargo: electo ? carrera.cargo : mejorCargo(carrera, entero(azar, 0, 8)),
      caja: Math.round((valor * (0.7 + entero(azar, 0, 70) / 100)) / 500) * 500,
      fama: entero(azar, 2, 4),
      construccion: traicion.construccion,
      imagen: traicion.imagen,
      imperdonable: traicion.imperdonable,
    });
  }
  return ofertas;
}

/** ¿Alguna oferta te sube de cargo? Si no, el cierre de listas no te pregunta nada. */
export function hayOfertaMejor(carrera: Carrera, ofertas: OfertaPase[]): boolean {
  return ofertas.some((o) => CARGOS[o.cargo].rango > CARGOS[carrera.cargo].rango);
}

/** Renovás con tu partido sin pantalla: la lealtad suma igual. */
export function renovarSinPreguntar(carrera: Carrera, renovacion: OfertaPase) {
  moverConstruccion(carrera, renovacion.construccion);
  if (renovacion.construccion)
    anotar(carrera, [`Cierre de listas: seguís en ${elPartido(carrera.partido)} (Construcción +${renovacion.construccion}).`]);
}

/** Elegís una oferta: renovar con tu partido o irte a otro. */
export function decidirPase(anterior: Carrera, indice: number): Carrera {
  const oferta = anterior.pases?.[indice];
  if (!oferta) throw new Error('No hay esa oferta');
  const carrera = structuredClone(anterior);
  delete carrera.pases;

  if (oferta.renovacion) {
    moverConstruccion(carrera, oferta.construccion);
    anotar(carrera, [
      `Cierre de listas: renovaste con ${elPartido(carrera.partido)}.${oferta.construccion ? ` La lealtad suma (Construcción +${oferta.construccion}).` : ''}`,
    ]);
    cambiarCargo(carrera, oferta.cargo);
  } else {
    const desde = elPartido(carrera.partido);
    carrera.partido = oferta.partido;
    carrera.partidoDesde = carrera.anio;
    const efectos = { caja: oferta.caja, fama: oferta.fama, imagen: oferta.imagen };
    for (const [clave, cantidad] of Object.entries(efectos)) if (cantidad) aplicar(carrera, clave as 'caja', cantidad);
    moverConstruccion(carrera, oferta.construccion);
    anotar(carrera, [
      `${oferta.imperdonable ? 'Traición imperdonable: ' : ''}dejaste ${desde} por ${elPartido(oferta.partido)} (${textoEfectos(efectos)}, Construcción ${oferta.construccion}).`,
    ]);
    registrarLogro(carrera, '🔁', `Pase ${alPartido(oferta.partido, true)}${oferta.imperdonable ? ' (traición)' : ''}`);
    if (oferta.cargo !== carrera.cargo && CARGOS[oferta.cargo].rango < CARGOS[carrera.cargo].rango) {
      anotar(carrera, [`Dejaste tu cargo de ${CARGOS[carrera.cargo].nombre}.`]);
    }
    cambiarCargo(carrera, oferta.cargo);
  }
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}
