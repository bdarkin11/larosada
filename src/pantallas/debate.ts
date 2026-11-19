import { TIPOS_RESPUESTA, buscarPreguntaDebate } from '../datos/debates';
import { AJUSTE_SIN_DEBATE, calcularDebate, hayPista, segundosDebate } from '../motor/debate';
import type { ResultadoDebate } from '../motor/debate';
import { nombreCargoEn, responderDebate, saltearDebate } from '../motor/elecciones';
import type { Carrera } from '../motor/tipos';
import { chips, escapar } from '../ui';

const conComa = (x: number) => String(Math.abs(x)).replace('.', ',');
const conSigno = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${conComa(x)}`;

/** Se pasó de la presentación: recién ahí corre el reloj. */
let arrancado = false;
let reloj: number | undefined;

function pararReloj() {
  if (reloj !== undefined) clearInterval(reloj);
  reloj = undefined;
}

/** La presentación: qué se juega y la salida para no ir. */
function presentacion(carrera: Carrera) {
  const e = carrera.eleccion!;
  const d = e.debate!;
  return `
    <section class="panel eleccion debate-presentacion">
      <p class="sobretitulo">Debate · ${escapar(nombreCargoEn(carrera, e.cargo!))}</p>
      <h3>Enfrente, ${escapar(d.rival)}</h3>
      <p>${d.preguntas.length} rondas y ${segundosDebate(carrera)} segundos para cada respuesta. Lo que pase acá mueve tu fuerza en la elección.</p>
      <ul class="debate-reglas">
        <li>A una <strong>pregunta seria</strong>, contestale con una <strong>propuesta</strong>.</li>
        <li>A una <strong>chicana</strong>, devolvele un <strong>contraataque</strong>.</li>
        <li>La <strong>evasiva</strong> no suma nada, pero tampoco te hunde.</li>
        <li>Si lo que decís va contra tus ideas, resta.</li>
      </ul>
      <div class="debate-acciones">
        <button class="boton principal" data-debate="arrancar">Salir al aire</button>
        <button class="boton" data-debate="saltear">Que lo resuelva el equipo (Fuerza ${conSigno(AJUSTE_SIN_DEBATE)})</button>
      </div>
    </section>`;
}

function ronda(carrera: Carrera) {
  const d = carrera.eleccion!.debate!;
  const n = d.respuestas.length;
  const pregunta = buscarPreguntaDebate(d.preguntas[n]);
  const esChicana = pregunta.tipo === 'chicana';
  const pista = esChicana ? 'Es una chicana: devolvésela.' : 'Es una pregunta seria: traé una propuesta.';
  return `
    <section class="panel entrevista debate" aria-live="polite">
      <div class="entrevista-cabeza">
        <span class="en-vivo">En vivo</span>
        <span class="medio">Debate con ${escapar(d.rival)}</span>
        <span class="contador">Ronda ${n + 1} de ${d.preguntas.length}</span>
      </div>
      <div class="reloj" aria-hidden="true"><span data-reloj-debate style="animation-duration:${segundosDebate(carrera)}s"></span></div>
      <p class="debate-quien">${esChicana ? escapar(d.rival) : 'El moderador'}</p>
      <p class="pregunta">${escapar(pregunta.texto)}</p>
      ${hayPista(carrera) ? `<p class="debate-pista">Tu asesor te sopla: ${pista}</p>` : ''}
      <div class="respuestas">
        ${d.ordenes[n]
          .map(
            (tipo, i) => `
          <button class="respuesta" data-debate-respuesta="${i}">
            <span class="letra">${'ABC'[i]}</span>
            <span>${escapar(pregunta.respuestas[TIPOS_RESPUESTA[tipo]].texto)}</span>
          </button>`,
          )
          .join('')}
      </div>
      <p class="ayuda pie">Si se acaba el tiempo, te quedaste en blanco.</p>
    </section>`;
}

/** El panel del debate: la presentación o la ronda que toca. */
export function panelDebate(carrera: Carrera): string {
  return arrancado || carrera.eleccion!.debate!.respuestas.length ? ronda(carrera) : presentacion(carrera);
}

export function panelResultadoDebate(r: ResultadoDebate): string {
  const clase = r.ajuste > 0 ? 'bueno' : r.ajuste < 0 ? 'malo' : 'neutro';
  return `
    <section class="panel resultado-entrevista ${clase}">
      <p class="sobretitulo">Fin del debate</p>
      <h3>${escapar(r.veredicto)}</h3>
      <div class="resultado-chips">
        <span class="debate-fuerza ${clase}">Fuerza ${conSigno(r.ajuste)}</span>
        ${r.fama ? chips({ fama: r.fama }) : ''}
      </div>
      <ol class="detalle-entrevista">
        ${r.detalle
          .map(
            (d) => `
          <li>
            <span class="q">${escapar(d.pregunta)}</span>
            <span class="a">${escapar(d.respuesta)}</span>
            <span class="puntos ${d.puntos > 0 ? 'bueno' : d.puntos < 0 ? 'malo' : 'neutro'}">${d.puntos > 0 ? 'Sumó' : d.puntos < 0 ? 'Restó' : 'Neutra'}</span>
          </li>`,
          )
          .join('')}
      </ol>
      ${r.extras.map((x) => `<p class="ayuda extra">${escapar(x)}</p>`).join('')}
      <button class="boton principal" data-accion="cerrar-debate">A votar</button>
    </section>`;
}

/** Conecta los botones y el reloj del panel. `alTerminar` recibe el resultado antes de la última jugada. */
export function conectarDebate(
  raiz: HTMLElement,
  carrera: Carrera,
  acciones: { seguir: (c: Carrera) => void; redibujar: () => void; alTerminar: (r: ResultadoDebate) => void },
) {
  pararReloj();
  raiz.querySelector('[data-debate="arrancar"]')?.addEventListener('click', () => {
    arrancado = true;
    acciones.redibujar();
  });
  raiz.querySelector('[data-debate="saltear"]')?.addEventListener('click', () => {
    arrancado = false;
    acciones.seguir(saltearDebate(carrera));
  });

  const contestar = (indice: number) => {
    pararReloj();
    const e = carrera.eleccion!;
    const d = e.debate!;
    if (d.respuestas.length === d.preguntas.length - 1) {
      arrancado = false;
      acciones.alTerminar(calcularDebate(carrera, { ...d, respuestas: [...d.respuestas, indice] }, e.cargo!));
    }
    raiz.querySelectorAll<HTMLButtonElement>('[data-debate-respuesta]').forEach((b) => {
      b.disabled = true;
      if (Number(b.dataset.debateRespuesta) === indice) b.classList.add('elegida');
    });
    setTimeout(() => acciones.seguir(responderDebate(carrera, indice)), 350);
  };
  raiz
    .querySelectorAll<HTMLButtonElement>('[data-debate-respuesta]')
    .forEach((b) => b.addEventListener('click', () => contestar(Number(b.dataset.debateRespuesta))));

  if (!raiz.querySelector('[data-reloj-debate]')) return;
  const limite = Date.now() + segundosDebate(carrera) * 1000;
  reloj = window.setInterval(() => {
    if (!document.querySelector('[data-reloj-debate]')) return pararReloj();
    if (Date.now() >= limite) contestar(-1);
  }, 200);
}
