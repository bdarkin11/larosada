import { CRECIMIENTO_FORMACION, EDAD_CANDIDATO, ETAPAS_FORMACION } from '../datos/formacion';
import { elPartido, partidoMasCercano } from '../datos/partidos';
import { generarCartas, nombreIdeologia } from './carrera';
import { acotar, anotar, aplicar, diferencias, foto, moverConstruccion } from './ficha';
import type { Atributo, Carrera, Medidor } from './tipos';

/** Arranca los años de militancia: hasta los 35 solo se decide qué pensás. */
export function empezarFormacion(anterior: Carrera): Carrera {
  const carrera = structuredClone(anterior);
  carrera.formacion = { paso: 0 };
  carrera.cartas = [];
  return carrera;
}

/** Elegís en la etapa que toca. Con la última, llegás a los 35 y arranca la carrera. */
export function elegirFormacion(anterior: Carrera, indice: number): Carrera {
  if (!anterior.formacion) throw new Error('No estás en los años de militancia');
  const etapa = ETAPAS_FORMACION[anterior.formacion.paso];
  const opcion = etapa.opciones[indice];
  if (!opcion) throw new Error(`No hay opción ${indice}`);
  const carrera = structuredClone(anterior);

  carrera.ideologia = {
    economia: acotar(carrera.ideologia.economia + (opcion.ideas.economia ?? 0), -100, 100),
    social: acotar(carrera.ideologia.social + (opcion.ideas.social ?? 0), -100, 100),
  };
  for (const [clave, cantidad] of Object.entries(opcion.ajustes)) aplicar(carrera, clave as Atributo | Medidor, cantidad);
  if (opcion.construccion) moverConstruccion(carrera, opcion.construccion);
  anotar(carrera, [`${etapa.titulo}: ${opcion.texto}.`]);
  carrera.anio += etapa.anios;
  carrera.edad += etapa.anios;
  carrera.formacion!.paso++;

  if (carrera.formacion!.paso >= ETAPAS_FORMACION.length) terminarFormacion(carrera);
  carrera.cambios = diferencias(anterior, carrera);
  return carrera;
}

function terminarFormacion(carrera: Carrera) {
  delete carrera.formacion;
  const c = CRECIMIENTO_FORMACION;
  aplicar(carrera, 'territorio', c.territorio);
  aplicar(carrera, 'rosca', c.rosca);
  aplicar(carrera, 'gestion', c.gestion);
  moverConstruccion(carrera, c.construccion);
  carrera.medidores.caja += c.caja;
  carrera.medidores.fama = Math.max(carrera.medidores.fama, c.famaMinima);
  carrera.medidores.poder = Math.max(carrera.medidores.poder, c.poderMinimo);
  // Con las ideas que te formaste, el partido que mejor te representa (salvo que te apadrinen).
  const lineas = [
    `A los ${EDAD_CANDIDATO}, el electorado empieza a tenerte en cuenta. Tus ideas: ${nombreIdeologia(carrera.ideologia).toLowerCase()}.`,
  ];
  if (!carrera.padrino) {
    const partido = partidoMasCercano(carrera.ideologia);
    if (partido !== carrera.partido) lineas.push(`Te pasaste a ${elPartido(partido)}, que va más con lo que pensás.`);
    carrera.partido = partido;
  }
  carrera.partidoDesde = carrera.anio;
  // Los años en política (y su desgaste) se cuentan desde acá.
  carrera.anioInicio = carrera.anio;
  carrera.inicioPeriodo = { anio: carrera.anio, ...foto(carrera) };
  anotar(carrera, lineas);
  carrera.cartas = generarCartas(carrera.azar, carrera.edad);
}
