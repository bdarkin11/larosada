import { fiscalizar, saltearFiscalizacion } from '../motor/elecciones';
import {
  AJUSTE_SIN_FISCALIZAR,
  DURACION_FISCALIZACION,
  OCUPADO_FISCAL,
  TEXTO_INCIDENTE,
  VIAJE_FISCAL,
  ajusteFiscalizacion,
  salvados,
} from '../motor/fiscalizacion';
import type { Carrera, EnvioFiscal, FiscalizacionEnCurso } from '../motor/tipos';

export interface ResultadoFiscalizacion {
  salvados: number;
  total: number;
  ajuste: number;
}

const conSigno = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${String(Math.abs(x)).replace('.', ',')}`;

let arrancado = false;
let reloj: number | undefined;

function parar() {
  if (reloj !== undefined) clearInterval(reloj);
  reloj = undefined;
}

function presentacion(f: FiscalizacionEnCurso) {
  return `
    <section class="panel eleccion fiscalizacion-presentacion">
      <p class="sobretitulo">Noche electoral · Fiscalización</p>
      <h3>Cuidá tus votos mesa por mesa</h3>
      <p>Son ${f.mesas} mesas: en ${f.cubiertas.length} tenés fiscal fijo. Tenés ${f.fiscales} fiscales volantes y ${DURACION_FISCALIZACION} segundos.</p>
      <ul class="debate-reglas">
        <li>Cuando salta un incidente, <strong>tocá la mesa</strong> y sale un fiscal libre.</li>
        <li>Tarda ${VIAJE_FISCAL} segundos en llegar y queda ocupado ${OCUPADO_FISCAL}. Si llega antes de que se acabe el tiempo de la mesa, salvás esos votos.</li>
        <li>En las mesas sin fiscal fijo hay menos tiempo y se pierden más votos.</li>
        <li>Lo que pase acá mueve de −6 a +4 puntos tu porcentaje.</li>
      </ul>
      <div class="debate-acciones">
        <button class="boton principal" data-fiscal="arrancar">Arrancar</button>
        <button class="boton" data-fiscal="saltear">Que lo haga el aparato (${conSigno(AJUSTE_SIN_FISCALIZAR)} puntos)</button>
      </div>
    </section>`;
}

function tablero(f: FiscalizacionEnCurso) {
  return `
    <section class="panel fiscalizacion" aria-live="polite">
      <div class="entrevista-cabeza">
        <span class="en-vivo">En vivo</span>
        <span class="medio">Fiscalización</span>
        <span class="contador" data-fiscales-libres>Fiscales libres: ${f.fiscales} de ${f.fiscales}</span>
      </div>
      <div class="reloj" aria-hidden="true"><span style="animation-duration:${DURACION_FISCALIZACION}s"></span></div>
      <div class="mesas">
        ${Array.from(
          { length: f.mesas },
          (_, i) => `
          <button class="mesa ${f.cubiertas.includes(i) ? 'cubierta' : ''}" data-mesa="${i}">
            <span class="mesa-numero">Mesa ${i + 1}</span>
            <span class="mesa-estado" data-estado>${f.cubiertas.includes(i) ? 'Con fiscal' : 'Sin fiscal'}</span>
            <span class="mesa-plazo" aria-hidden="true"><span></span></span>
          </button>`,
        ).join('')}
      </div>
      <p class="ayuda pie" data-aviso>Tocá una mesa cuando salte un incidente.</p>
    </section>`;
}

export function panelFiscalizacion(carrera: Carrera): string {
  const f = carrera.eleccion!.fiscalizacion!;
  return arrancado ? tablero(f) : presentacion(f);
}

export function panelResultadoFiscalizacion(r: ResultadoFiscalizacion): string {
  const clase = r.ajuste > 0 ? 'bueno' : r.ajuste < 0 ? 'malo' : 'neutro';
  return `
    <section class="panel resultado-entrevista ${clase}">
      <p class="sobretitulo">Fin de la fiscalización</p>
      <h3>Salvaste ${r.salvados} de ${r.total} incidentes</h3>
      <div class="resultado-chips"><span class="debate-fuerza ${clase}">Tus votos ${conSigno(r.ajuste)} puntos</span></div>
      <button class="boton principal" data-accion="cerrar-fiscalizacion">Al escrutinio</button>
    </section>`;
}

/** Conecta la presentación o arranca la noche, que corre sola 30 segundos. */
export function conectarFiscalizacion(
  raiz: HTMLElement,
  carrera: Carrera,
  acciones: { seguir: (c: Carrera) => void; redibujar: () => void; alTerminar: (r: ResultadoFiscalizacion) => void },
) {
  parar();
  const f = carrera.eleccion!.fiscalizacion!;
  raiz.querySelector('[data-fiscal="arrancar"]')?.addEventListener('click', () => {
    arrancado = true;
    acciones.redibujar();
  });
  raiz.querySelector('[data-fiscal="saltear"]')?.addEventListener('click', () => {
    arrancado = false;
    acciones.seguir(saltearFiscalizacion(carrera));
  });
  const mesas = raiz.querySelector<HTMLElement>('.mesas');
  if (!mesas) return;

  const inicio = performance.now();
  const envios: EnvioFiscal[] = [];
  const segundo = () => Math.round(((performance.now() - inicio) / 1000) * 10) / 10;
  const aviso = raiz.querySelector<HTMLElement>('[data-aviso]')!;
  const libres = (t: number) => f.fiscales - envios.filter((e) => e.segundo + OCUPADO_FISCAL > t).length;
  const enviado = (i: number) => envios.find((e) => e.incidente === i);
  /** El incidente que se ve en la mesa: el que está activo, o el último que terminó hace poco. */
  const incidenteDe = (mesa: number, t: number) => {
    let elegido = -1;
    f.incidentes.forEach((inc, i) => {
      if (inc.mesa !== mesa || inc.aparece > t) return;
      const e = enviado(i);
      const fin = e ? e.segundo + VIAJE_FISCAL : inc.aparece + inc.plazo;
      if (t < fin + 1.5) elegido = i;
    });
    return elegido;
  };

  mesas.addEventListener('pointerdown', (ev) => {
    const boton = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-mesa]');
    if (!boton) return;
    const t = segundo();
    const i = incidenteDe(Number(boton.dataset.mesa), t);
    const inc = f.incidentes[i];
    if (i < 0 || enviado(i) || t >= inc.aparece + inc.plazo) return;
    if (libres(t) <= 0) {
      aviso.textContent = 'No te quedan fiscales libres: esperá a que vuelva alguno.';
      return;
    }
    envios.push({ incidente: i, segundo: t });
    aviso.textContent = `Salió un fiscal para la mesa ${inc.mesa + 1}.`;
  });

  const terminar = () => {
    parar();
    arrancado = false;
    const ok = salvados(f, envios).filter(Boolean).length;
    acciones.alTerminar({ salvados: ok, total: f.incidentes.length, ajuste: ajusteFiscalizacion(f, envios) });
    acciones.seguir(fiscalizar(carrera, envios));
  };

  const botones = [...mesas.querySelectorAll<HTMLButtonElement>('[data-mesa]')];
  const contador = raiz.querySelector<HTMLElement>('[data-fiscales-libres]')!;
  const pintar = () => {
    if (!document.body.contains(mesas)) return parar();
    const t = segundo();
    if (t >= DURACION_FISCALIZACION) return terminar();
    contador.textContent = `Fiscales libres: ${libres(t)} de ${f.fiscales}`;
    botones.forEach((b, mesa) => {
      const i = incidenteDe(mesa, t);
      let estado = f.cubiertas.includes(mesa) ? 'Con fiscal' : 'Sin fiscal';
      let clase = '';
      let resta = 0;
      if (i >= 0) {
        const inc = f.incidentes[i];
        const e = enviado(i);
        if (e && t < e.segundo + VIAJE_FISCAL) [estado, clase] = ['Fiscal en camino…', 'en-camino'];
        else if (e)
          [estado, clase] = e.segundo + VIAJE_FISCAL <= inc.aparece + inc.plazo ? ['✓ Salvada', 'salvada'] : ['✗ Llegó tarde', 'perdida'];
        else if (t < inc.aparece + inc.plazo) {
          [estado, clase] = [TEXTO_INCIDENTE[inc.tipo], 'incidente'];
          resta = (inc.aparece + inc.plazo - t) / inc.plazo;
        } else [estado, clase] = ['✗ Votos perdidos', 'perdida'];
      }
      const span = b.querySelector<HTMLElement>('[data-estado]')!;
      if (span.textContent !== estado) span.textContent = estado;
      b.dataset.clase = clase;
      b.querySelector<HTMLElement>('.mesa-plazo span')!.style.width = `${Math.round(resta * 100)}%`;
    });
  };
  pintar();
  reloj = window.setInterval(pintar, 100);
}
