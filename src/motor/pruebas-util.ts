import { LA_QUE_GANA, TIPOS_RESPUESTA, buscarPreguntaDebate } from '../datos/debates';
import type { TipoRespuestaDebate } from '../datos/debates';
import { buscarEvento } from '../datos/eventos';
import { descartarPendiente, resolverDetencion } from './carrera';
import { bajarseDeLaEleccion, responderDebate } from './elecciones';
import { motivoOpcion, resolverEvento } from './eventos';
import { decidirPase } from './pases';
import { alternarBloque, conteoRosca, iniciarRosca, motivoSinBloque, votarRosca } from './rosca';
import { DURACION_FISCALIZACION, OCUPADO_FISCAL, VIAJE_FISCAL } from './fiscalizacion';
import type { Carrera, EnvioFiscal, FiscalizacionEnCurso, RoscaEnCurso } from './tipos';

/**
 * Solo para las pruebas: juega el debate entero. `como` dice, para cada ronda,
 * qué contestar: 'bien' (lo que le gana), 'mal' (lo que pierde), una evasiva o nada.
 */
export function debatir(carrera: Carrera, como: (ronda: number) => 'bien' | 'mal' | 'evasiva' | 'blanco'): Carrera {
  let c = carrera;
  while (c.eleccion?.fase === 'debate') {
    const d = c.eleccion.debate!;
    const ronda = d.respuestas.length;
    const gana = LA_QUE_GANA[buscarPreguntaDebate(d.preguntas[ronda]).tipo];
    const pierde: TipoRespuestaDebate = gana === 'propuesta' ? 'contraataque' : 'propuesta';
    const plan = como(ronda);
    if (plan === 'blanco') {
      c = responderDebate(c, -1);
      continue;
    }
    const tipo = plan === 'bien' ? gana : plan === 'mal' ? pierde : 'evasiva';
    c = responderDebate(c, d.ordenes[ronda].indexOf(TIPOS_RESPUESTA.indexOf(tipo)));
  }
  return c;
}

/**
 * Solo para las pruebas: un fiscal que reacciona tantos segundos después de que
 * salta cada incidente y manda a quien esté libre. Con `urgentes`, atiende
 * primero los que vencen antes y deja los perdidos.
 */
export function enviosDeFiscal(f: FiscalizacionEnCurso, reaccion: number, urgentes = false): EnvioFiscal[] {
  const libres: number[] = Array(f.fiscales).fill(0);
  const envios: EnvioFiscal[] = [];
  const orden = f.incidentes
    .map((inc, i) => ({ i, desde: inc.aparece + reaccion, vence: inc.aparece + inc.plazo - VIAJE_FISCAL }))
    .sort((a, b) => (urgentes ? a.vence - b.vence : a.desde - b.desde));
  for (const x of orden) {
    const k = libres.indexOf(Math.min(...libres));
    const segundo = Math.round(Math.max(x.desde, libres[k]) * 10) / 10;
    if (segundo > DURACION_FISCALIZACION || (urgentes && segundo > x.vence)) continue;
    libres[k] = segundo + OCUPADO_FISCAL;
    envios.push({ incidente: x.i, segundo });
  }
  return envios;
}

/** Solo para las pruebas: rosquea una ley. `orden` dice a qué bloques llamar primero. */
export function roscar(carrera: Carrera, orden: (r: RoscaEnCurso) => number[], conMargen = false) {
  let c = iniciarRosca(carrera);
  for (const i of orden(c.rosca!)) {
    if (conteoRosca(c).alcanza && !conMargen) break;
    if (!motivoSinBloque(c, i)) c = alternarBloque(c, i);
  }
  return votarRosca(c);
}

/**
 * Solo para las pruebas: resuelve todo lo que frena el año de la forma más
 * neutra (renovar, no presentarse, la primera opción del evento sin coimas,
 * pelear en la Justicia).
 */
export function despejar(carrera: Carrera): Carrera {
  let c = carrera;
  while (c.pendientes.length) c = descartarPendiente(c);
  if (c.pases) c = decidirPase(c, 0);
  if (c.eleccion) c = bajarseDeLaEleccion(c);
  while (c.evento) {
    const opciones = buscarEvento(c.evento.id).opciones;
    const posibles = opciones.map((_, k) => k).filter((k) => !motivoOpcion(c, k));
    // Un jugador neutral: si puede, no agarra coimas.
    const esCoima = (k: number) => {
      const r = opciones[k].resultado;
      return 'chance' in r ? !!(r.exito.coima || r.fracaso.coima) : !!r.coima;
    };
    const limpia = posibles.find((k) => !esCoima(k));
    c = resolverEvento(c, limpia ?? posibles[0]).carrera;
  }
  if (c.detencion && !c.pendientes.length) c = resolverDetencion(c, 'pelear');
  return c;
}
