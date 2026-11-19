import { ESTILO, ORIGEN, buscarCartaArranque } from '../datos/armado';
import type { Ajustes } from '../datos/armado';
import { CENTRO_DEL_PODER } from '../datos/provincias';
import { semillaAleatoria } from '../motor/azar';
import { COSTO_MUDANZA, NOMBRE_RAREZA, nombreIdeologia, herencia, nuevaCarrera, vistaPreviaArmado } from '../motor/carrera';
import type { Padrino } from '../motor/carrera';
import { elPartido } from '../datos/partidos';
import { ESTILOS, ORIGENES } from '../motor/tipos';
import type { Carrera, Estilo, Ideologia, Origen } from '../motor/tipos';
import { chips, dolares, escapar, paneles } from '../ui';

interface Acciones {
  alEmpezar: (carrera: Carrera) => void;
  alVolver: () => void;
  /** Si la carrera nueva es la de un delfín. */
  padrino?: Padrino;
}

/** El orden del armado. */
const PASOS = ['origen', 'estilo', 'carta', 'ideologia'] as const;
type Paso = (typeof PASOS)[number];

const TITULO: Record<Paso, string> = {
  origen: 'De dónde venís',
  estilo: 'Cómo jugás',
  carta: 'Carta de arranque',
  ideologia: 'Qué pensás',
};

function opcion(valor: string, nombre: string, descripcion: string, ajustes: Ajustes, elegida: boolean) {
  return `
    <button class="opcion ${elegida ? 'seleccionada' : ''}" data-valor="${valor}" aria-pressed="${elegida}">
      <strong>${escapar(nombre)}</strong>
      <span>${escapar(descripcion)}</span>
      ${chips(ajustes)}
    </button>`;
}

export function pantallaArmado(app: HTMLElement, acciones: Acciones) {
  // La provincia natal sale de la semilla: no se elige.
  const semilla = semillaAleatoria();
  let paso = 0;
  let origen: Origen | undefined;
  let estilo: Estilo | undefined;
  let cartaArranque: string | undefined;
  let ideologia: Ideologia = { economia: 0, social: 0 };
  let nombre = acciones.padrino?.delfin?.nombre ?? '';

  const elegido = (p: Paso) => (p === 'origen' ? !!origen : p === 'estilo' ? !!estilo : p === 'carta' ? !!cartaArranque : true);

  function contenidoDelPaso(p: Paso, ofrecidas: string[], nombreSugerido: string) {
    switch (p) {
      case 'origen':
        return `
          <p class="ayuda">Tu historia antes de la política. Define con qué arrancás.</p>
          <div class="opciones-grilla" data-grupo="origen">
            ${ORIGENES.map((o) => opcion(o, ORIGEN[o].nombre, ORIGEN[o].descripcion, ORIGEN[o].ajustes, o === origen)).join('')}
          </div>`;
      case 'estilo':
        return `
          <p class="ayuda">Cómo vas a hacer política. No se cambia en toda la carrera.</p>
          <div class="opciones-grilla tres" data-grupo="estilo">
            ${ESTILOS.map((e) => opcion(e, ESTILO[e].nombre, ESTILO[e].descripcion, ESTILO[e].ajustes, e === estilo)).join('')}
          </div>`;
      case 'carta':
        return `
          <p class="ayuda">Elegí una de las tres. Muy de vez en cuando aparece una icónica.</p>
          <div class="cartas" data-grupo="carta">
            ${ofrecidas
              .map((id) => {
                const c = buscarCartaArranque(id);
                return `
                <button class="carta ${c.rareza} ${id === cartaArranque ? 'seleccionada' : ''}" data-valor="${id}" aria-pressed="${id === cartaArranque}">
                  <span class="rareza">${NOMBRE_RAREZA[c.rareza]}</span>
                  <strong>${escapar(c.nombre)}</strong>
                  <span class="descripcion">${escapar(c.descripcion)}</span>
                  ${chips(c.ajustes)}
                </button>`;
              })
              .join('')}
          </div>`;
      case 'ideologia':
        return `
          <p class="ayuda">Define con cuánto poder arrancás y a qué votantes llegás.</p>
          <div class="eje">
            <div class="eje-extremos"><span>Estado</span><span>Mercado</span></div>
            <input type="range" min="-100" max="100" step="1" data-eje="economia" value="${ideologia.economia}" aria-label="Economía: Estado o Mercado" />
          </div>
          <div class="eje">
            <div class="eje-extremos"><span>Conservador</span><span>Progresista</span></div>
            <input type="range" min="-100" max="100" step="1" data-eje="social" value="${ideologia.social}" aria-label="Sociedad: conservador o progresista" />
          </div>
          <p class="ideologia">Perfil: <strong data-vista="ideologia">${nombreIdeologia(ideologia)}</strong></p>
          <label class="campo nombre-campo">
            <span>Tu nombre (si lo dejás vacío, queda el sugerido)</span>
            <input type="text" maxlength="40" data-campo="nombre" value="${escapar(nombre)}" placeholder="${escapar(nombreSugerido)}" />
          </label>`;
    }
  }

  function render() {
    const p = PASOS[paso];
    const { padrino } = acciones;
    const previa = vistaPreviaArmado(semilla, { origen, estilo, cartaArranque, padrino });
    const enElCentro = CENTRO_DEL_PODER.includes(previa.provincia);
    const ultimo = paso === PASOS.length - 1;

    app.innerHTML = `
      <section class="armado">
        <header class="ficha">
          <div>
            <h2>${acciones.padrino ? 'Armá a tu delfín' : 'Armá tu carrera'}</h2>
            <p>Paso ${paso + 1} de ${PASOS.length}: ${TITULO[p]}</p>
          </div>
          <ol class="progreso" aria-hidden="true">
            ${PASOS.map((_, i) => `<li class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}"></li>`).join('')}
          </ol>
        </header>

        ${
          padrino
            ? `<div class="natal padrino"><strong>Te apadrina ${escapar(padrino.nombre)}.</strong> Arrancás en ${escapar(elPartido(padrino.partido))} y heredás Rosca +${herencia(padrino).rosca}, Construcción +${herencia(padrino).construccion}${herencia(padrino).caja ? ` y ${dolares(herencia(padrino).caja)}` : ''}.</div>`
            : ''
        }
        <div class="natal ${enElCentro ? 'centro' : 'interior'}">
          <strong>Naciste en ${escapar(previa.provincia)}.</strong>
          ${
            enElCentro
              ? 'Estás en el centro del poder: todo lo que hagas se ve en todo el país.'
              : `Estás lejos de Buenos Aires: la fama te cuesta el doble y te olvidan más rápido. Cuando juntes ${dolares(COSTO_MUDANZA)} vas a poder mudarte.`
          }
        </div>

        <div class="tablero armado-tablero">
          <div class="columna principal-col">
            <section class="panel">
              <h3>${TITULO[p]}</h3>
              ${contenidoDelPaso(p, previa.ofrecidas, previa.nombreSugerido)}
            </section>
          </div>
          <div class="columna vista-previa">
            <h3 class="titulo-previa">Así arrancás</h3>
            <div>${paneles(previa.atributos, previa.medidores)}</div>
          </div>
        </div>

        <nav class="navegacion-armado">
          <button class="boton" data-accion="atras">${paso === 0 ? 'Volver al inicio' : 'Atrás'}</button>
          <button class="boton principal" data-accion="siguiente" ${elegido(p) ? '' : 'disabled'}>
            ${ultimo ? 'Empezar la carrera' : 'Siguiente'}
          </button>
        </nav>
      </section>`;

    conectar(p);
  }

  function conectar(p: Paso) {
    app.querySelector('[data-accion="atras"]')!.addEventListener('click', () => {
      if (paso === 0) return acciones.alVolver();
      paso--;
      render();
      window.scrollTo(0, 0);
    });
    app.querySelector('[data-accion="siguiente"]')!.addEventListener('click', () => {
      if (!elegido(p)) return;
      if (paso < PASOS.length - 1) {
        paso++;
        render();
        window.scrollTo(0, 0);
        return;
      }
      acciones.alEmpezar(nuevaCarrera({ semilla, origen, estilo, cartaArranque, ideologia, nombre, padrino: acciones.padrino }));
    });

    app.querySelectorAll<HTMLButtonElement>('[data-grupo] [data-valor]').forEach((boton) =>
      boton.addEventListener('click', () => {
        const valor = boton.dataset.valor!;
        if (p === 'origen') origen = valor as Origen;
        if (p === 'estilo') estilo = valor as Estilo;
        if (p === 'carta') cartaArranque = valor;
        render();
      }),
    );

    app.querySelectorAll<HTMLInputElement>('[data-eje]').forEach((deslizador) =>
      deslizador.addEventListener('input', () => {
        ideologia = { ...ideologia, [deslizador.dataset.eje!]: Number(deslizador.value) };
        app.querySelector('[data-vista="ideologia"]')!.textContent = nombreIdeologia(ideologia);
      }),
    );
    app.querySelector<HTMLInputElement>('[data-campo="nombre"]')?.addEventListener('input', (e) => {
      nombre = (e.target as HTMLInputElement).value;
    });
  }

  render();
}
