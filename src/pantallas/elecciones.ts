import { CARGOS } from '../datos/cargos';
import { PARTIDOS, delPartido } from '../datos/partidos';
import {
  CAMPANIA,
  CAUSAS_CAMPANIA_NEGRA,
  motivoSinCampania,
  COSTO_ROMPER,
  candidaturas,
  chanceLapicera,
  costoCampania,
  fuerzaJugador,
  ganaste,
  nombreCargoEn,
  pronosticar,
  rivalesDeLaGeneral,
  sensacion,
  tieneEncuestador,
} from '../motor/elecciones';
import { PUNTOS_POR_FAVOR, apoyoDelPoder, favoresACobrar } from '../motor/poder';
import { MAXIMO_PROMESAS } from '../datos/promesas';
import { UMBRAL_COHERENCIA, ajustesDeHistoria, coherencia, fuerzaDePromesa, promesasDisponibles } from '../motor/promesas';
import type { Candidato, Carrera, NivelCampania, ResultadoVotacion } from '../motor/tipos';
import { chip, dolares, escapar } from '../ui';
import type { OpcionesEscrutinio } from './escrutinio';

const porcentaje = (x: number) => `${Math.round(x * 100)} %`;

/** Lo que dicen las encuestas: con encuestador propio, números; sin él, una sensación. */
function encuesta(carrera: Carrera, intencion: number, chance: number) {
  const clase = chance >= 0.65 ? 'favorito' : chance >= 0.4 ? 'competitivo' : chance >= 0.15 ? 'dificil' : 'muy-dificil';
  if (tieneEncuestador(carrera)) {
    return `<span class="encuesta ${clase}">📊 Intención de voto ${intencion} % · chance de ganar ${porcentaje(chance)}</span>`;
  }
  return `<span class="encuesta ${clase}">Las encuestas te ven: ${sensacion(chance)}</span>`;
}

function etiquetaCandidato(c: Candidato) {
  return `
    <span class="candidato-rival" style="--color-partido:${PARTIDOS[c.partido].color}">
      <strong>${escapar(c.nombre)}</strong>
      ${c.apodo ? `<em>"${escapar(c.apodo)}"</em>` : ''}
      <small>${escapar(PARTIDOS[c.partido].corto)} · fuerza ${c.fuerza}</small>
    </span>`;
}

function panelCandidatura(carrera: Carrera) {
  const opciones = candidaturas(carrera);
  return `
    <section class="panel eleccion">
      <p class="alerta celeste">Elecciones generales ${carrera.anio}</p>
      <h3>¿A qué te presentás?</h3>
      <p class="ayuda">Se vota todo junto: bancas, intendentes, gobernadores y presidente. Si no te presentás, el año sigue igual.</p>
      <div class="candidaturas">
        ${opciones
          .map((o) => {
            const d = CARGOS[o.cargo];
            const e = d.eleccion!;
            const reeleccion = carrera.cargo === o.cargo;
            const forma =
              e.forma.tipo === 'umbral'
                ? `Entrás si tu lista pasa el ${e.forma.porcentaje} %`
                : e.forma.tipo === 'dos-primeros'
                  ? 'Entran los dos primeros'
                  : o.cargo === 'presidente'
                    ? 'Gana el primero; puede haber balotaje'
                    : 'Gana el primero';
            return `
            <button class="candidatura" data-candidatura="${o.cargo}" ${o.motivo ? 'disabled' : ''}>
              <span class="candidatura-cabeza">
                <strong>${escapar(nombreCargoEn(carrera, o.cargo))}</strong>
                ${reeleccion ? '<span class="etiqueta-pase renovacion">Reelección</span>' : ''}
              </span>
              <span class="candidatura-datos">${e.duracion} años · ${dolares(d.ingresoAnual)} por año${d.fueros ? ' · fueros' : ''} · ${forma}</span>
              ${o.motivo ? `<span class="item-motivo">${escapar(o.motivo)}</span>` : encuesta(carrera, o.intencion, o.chance)}
            </button>`;
          })
          .join('')}
      </div>
      <button class="boton chico no-presentarse" data-candidatura="ninguna">No me presento este año</button>
    </section>`;
}

function panelInterna(carrera: Carrera) {
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const rival = e.rivalInterno!;
  const vos = fuerzaJugador(carrera, cargo);
  return `
    <section class="panel eleccion">
      <button class="boton chico no-presentarse" data-bajarse>No me presento este año</button>
      <p class="alerta celeste">Interna ${escapar(delPartido(carrera.partido, true))}</p>
      <h3>Alguien más quiere ser candidato a ${escapar(nombreCargoEn(carrera, cargo))}</h3>
      <div class="cara-a-cara">
        <span class="candidato-rival vos" style="--color-partido:${PARTIDOS[carrera.partido].color}">
          <strong>${escapar(carrera.nombre)}</strong><small>Vos · fuerza ${vos}</small>
        </span>
        <span class="contra">vs</span>
        ${etiquetaCandidato(rival)}
      </div>
      <div class="salidas-detencion">
        <button class="opcion" data-interna="lapicera">
          <strong>Negociar la lapicera</strong>
          <span>Rosca y construcción para que el partido te elija sin internas. Si sale mal, este año no sos candidato. Chance: ${porcentaje(chanceLapicera(carrera))}.</span>
        </button>
        <button class="opcion" data-interna="paso">
          <strong>Ir a las PASO</strong>
          <span>Que voten afiliados y simpatizantes. El que saca más votos es el candidato.</span>
        </button>
        <button class="opcion" data-interna="romper">
          <strong>Romper y armar tu propio frente</strong>
          <span>Vas por fuera, sin el piso de votos del partido.</span>
          <span class="chips">${chip('imagen', -2)}<span class="chip malo">−${COSTO_ROMPER} Construcción</span></span>
        </button>
      </div>
    </section>`;
}

/** Las promesas que podés hacer: suman en la elección, y si no las cumplís, te cuestan caro. */
function seccionPromesas(carrera: Carrera, elegidas: string[]) {
  const cargo = carrera.eleccion!.cargo!;
  const lleno = elegidas.length >= MAXIMO_PROMESAS;
  return `
    <div class="promesas-campania">
      <p class="ayuda">¿Qué prometés? Hasta ${MAXIMO_PROMESAS}. Suman votos ahora; si ganás y no las cumplís, Imagen −6, Poder −4 y la calle se calienta.</p>
      ${promesasDisponibles(cargo)
        .map((p) => {
          const marcada = elegidas.includes(p.id);
          const c = coherencia(carrera, p.postura);
          const nota =
            c >= UMBRAL_COHERENCIA ? 'va con tus ideas: te creen' : c <= -UMBRAL_COHERENCIA ? 'va contra tus ideas: pocos te creen' : '';
          return `
          <label class="promesa ${marcada ? 'marcada' : ''}">
            <input type="checkbox" data-promesa="${p.id}" ${marcada ? 'checked' : ''} ${!marcada && lleno ? 'disabled' : ''}>
            <span>
              <strong>«${escapar(p.texto)}»</strong>
              <small><span class="bueno">+${fuerzaDePromesa(carrera, p.id)} de fuerza</span>${nota ? ` · ${nota}` : ''}</small>
              <small>${escapar(p.detalle)}</small>
            </span>
          </label>`;
        })
        .join('')}
    </div>`;
}

function panelCampania(carrera: Carrera, promesas: string[]) {
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const rivales = rivalesDeLaGeneral(carrera);
  const historia = ajustesDeHistoria(carrera, cargo);
  return `
    <section class="panel eleccion">
      <button class="boton chico no-presentarse" data-bajarse>No me presento este año</button>
      <p class="alerta celeste">Campaña ${carrera.anio}</p>
      <h3>Candidato a ${escapar(nombreCargoEn(carrera, cargo))}${e.frentePropio ? ' · frente propio' : ''}</h3>
      <p class="ayuda">Enfrente tenés a:</p>
      <div class="rivales">${rivales.map(etiquetaCandidato).join('')}</div>
      <p class="apoyos-campania">
        <span>Tu poder: <strong class="${apoyoDelPoder(carrera) >= 0 ? 'bueno' : 'malo'}">${apoyoDelPoder(carrera) >= 0 ? '+' : ''}${apoyoDelPoder(carrera)}</strong></span>
        <span>📒 Favores que cobrás: <strong class="bueno">${favoresACobrar(carrera).length}</strong>${favoresACobrar(carrera).length ? ` (+${favoresACobrar(carrera).length * PUNTOS_POR_FAVOR})` : ''}</span>
        ${historia.map((a) => `<span>${escapar(a.texto)}: <strong class="${a.valor >= 0 ? 'bueno' : 'malo'}">${a.valor >= 0 ? '+' : '−'}${Math.abs(a.valor)}</strong></span>`).join('')}
      </p>
      ${seccionPromesas(carrera, promesas)}
      <p class="ayuda">¿Cuánto ponés en la campaña?</p>
      <div class="salidas-detencion">
        ${(Object.keys(CAMPANIA) as NivelCampania[])
          .filter((nivel) => nivel !== 'negra' || carrera.estilo !== 'idealista')
          .map((nivel) => {
            const costo = costoCampania(carrera, cargo, nivel);
            const p = pronosticar(carrera, cargo, { campania: nivel, frentePropio: e.frentePropio, rivales, promesas });
            const motivo = motivoSinCampania(carrera, cargo, nivel);
            const precio =
              nivel === 'negra'
                ? `<span class="chip negro">−US$ ${costo.toLocaleString('es-AR')} en negro</span>${chip('causas', CAUSAS_CAMPANIA_NEGRA)}`
                : costo
                  ? chip('caja', -costo)
                  : '<span class="chip neutro">Gratis</span>';
            return `
            <button class="opcion ${nivel === 'negra' ? 'opcion-negra' : ''}" data-campania="${nivel}" ${motivo ? 'disabled' : ''}>
              <strong>${CAMPANIA[nivel].nombre}</strong>
              <span>${CAMPANIA[nivel].descripcion}</span>
              <span class="chips">${precio}</span>
              ${motivo ? `<span class="item-motivo">${motivo}</span>` : encuesta(carrera, p.intencion, p.chance)}
            </button>`;
          })
          .join('')}
      </div>
    </section>`;
}

/** El panel de la fase en curso (menos el escrutinio, que es una animación aparte). */
export function panelEleccion(carrera: Carrera, promesas: string[] = []): string {
  switch (carrera.eleccion?.fase) {
    case 'candidatura':
      return panelCandidatura(carrera);
    case 'interna':
      return panelInterna(carrera);
    case 'campania':
      return panelCampania(carrera, promesas);
    default:
      return '<section class="panel eleccion" data-escrutinio></section>';
  }
}

/** Qué decir al final de cada conteo. */
export function veredicto(
  carrera: Carrera,
  r: ResultadoVotacion,
  etapa: 'paso' | 'generales' | 'balotaje',
): OpcionesEscrutinio['veredicto'] {
  const e = carrera.eleccion!;
  const cargo = e.cargo!;
  const i = r.candidatos.findIndex((c) => c.jugador);
  const tuyos = `${r.votos[i].toFixed(1).replace('.', ',')} %`;
  if (etapa === 'paso') {
    return r.votos[0] > r.votos[1]
      ? { texto: '¡Ganaste la PASO!', tipo: 'bueno', detalle: `Sacaste el ${tuyos}. Sos el candidato.` }
      : { texto: 'Perdiste la PASO', tipo: 'malo', detalle: `Sacaste el ${tuyos}. Este año no sos candidato.` };
  }
  if (etapa === 'generales' && e.balotaje) {
    return {
      texto: '¡Hay balotaje!',
      tipo: 'neutro',
      detalle: `Nadie llegó al 45 %, ni al 40 % con diez puntos de ventaja. Sacaste el ${tuyos}.`,
    };
  }
  const gano = ganaste(cargo, r);
  const entrar = CARGOS[cargo].eleccion!.forma.tipo !== 'primero';
  if (gano) {
    return {
      texto: entrar ? '¡Entraste!' : cargo === 'presidente' ? '¡Presidente!' : '¡Ganaste!',
      tipo: 'bueno',
      detalle: `${nombreCargoEn(carrera, cargo)} con el ${tuyos}.`,
    };
  }
  return {
    texto: entrar ? 'No alcanzó' : 'Perdiste',
    tipo: 'malo',
    detalle: `Sacaste el ${tuyos}.${entrar ? ' Tu lista no llegó a meterte.' : ''}`,
  };
}
