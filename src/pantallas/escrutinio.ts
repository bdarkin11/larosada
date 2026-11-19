import { sonar } from '../sonido';
import { PARTIDOS } from '../datos/partidos';
import type { ResultadoVotacion } from '../motor/tipos';
import { escapar } from '../ui';

export interface OpcionesEscrutinio {
  /** Para la PASO y el balotaje: la misma secuencia, un poco más corta. */
  corto?: boolean;
  /** Texto grande al final: "¡Ganaste!", "Perdiste", "¡Hay balotaje!". */
  veredicto: { texto: string; tipo: 'bueno' | 'malo' | 'neutro'; detalle: string };
}

const pausa = (ms: number, control: Control) =>
  new Promise<void>((resolver) => {
    if (control.saltado) return resolver();
    const t = setTimeout(resolver, ms);
    control.esperas.push(() => {
      clearTimeout(t);
      resolver();
    });
  });

interface Control {
  saltado: boolean;
  esperas: (() => void)[];
}

const miles = (n: number) => Math.round(n).toLocaleString('es-AR');
const hora = (minutos: number) =>
  `${String(Math.floor(minutos / 60) % 24).padStart(2, '0')}:${String(Math.floor(minutos % 60)).padStart(2, '0')}`;

/** Anima un número de "desde" a "hasta" en "ms" milisegundos, llamando a "pintar" en cada cuadro. */
function animarNumero(desde: number, hasta: number, ms: number, control: Control, pintar: (v: number) => void) {
  return new Promise<void>((resolver) => {
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = control.saltado ? 1 : Math.min(1, (ahora - inicio) / ms);
      pintar(desde + (hasta - desde) * t);
      if (t < 1) requestAnimationFrame(paso);
      else resolver();
    };
    requestAnimationFrame(paso);
  });
}

function sobre(clase: string, estilo: string) {
  return `<span class="sobre ${clase}" style="${estilo}"></span>`;
}

/**
 * La noche electoral: los sobres entran a la urna, viajan a la computadora y
 * se cuentan mesa por mesa, despacio, hasta el resultado. Termina cuando el
 * jugador toca "Seguir" o, si saltó la animación, al instante.
 */
export function animarEscrutinio(contenedor: HTMLElement, r: ResultadoVotacion, opciones: OpcionesEscrutinio): Promise<void> {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escala = (reducido ? 0.25 : 1) * (opciones.corto ? 0.7 : 1);
  const control: Control = { saltado: false, esperas: [] };
  const participacion = 0.77;
  const votaron = r.votantes * participacion;
  const mesas = Math.max(40, Math.round(r.votantes / 350));

  // El orden del tablero: como en la tele, de mayor a menor... pero recién al final.
  const filas = r.candidatos.map((c, i) => ({ c, final: r.votos[i], i }));
  // Ruido de las primeras mesas: el conteo arranca desparejo y se va acomodando.
  const ruido = filas.map(() => (Math.random() * 2 - 1) * 9);
  const media = ruido.reduce((s, v) => s + v, 0) / ruido.length;
  for (let k = 0; k < ruido.length; k++) ruido[k] -= media;

  contenedor.innerHTML = `
    <div class="noche-electoral" aria-live="polite">
      <header class="noche-cabeza">
        <span class="en-vivo">En vivo</span>
        <strong>${escapar(r.titulo)}</strong>
        <span class="reloj-noche" data-hora>08:00</span>
      </header>

      <div class="escena" data-escena>
        <div class="puesto-urna">
          <div class="urna">
            <span class="ranura"></span>
            <span class="faja">Urna</span>
          </div>
          <div class="sobres-entrando" data-entrando></div>
          <p class="leyenda-escena" data-leyenda>Abren las escuelas. Empieza la votación.</p>
          <p class="contador-votantes">Votaron <strong data-votaron>0</strong> personas</p>
        </div>
        <div class="cinta" data-cinta></div>
        <div class="computadora">
          <div class="monitor">
            <div class="pantalla" data-pantalla><span class="cursor">▌</span></div>
          </div>
          <span class="pie-monitor"></span>
          <p class="transmision">Telegramas transmitidos <strong data-transmitidos>0 %</strong></p>
        </div>
      </div>

      <div class="tablero-conteo" data-tablero hidden>
        <div class="mesas">
          <span>Mesas escrutadas</span>
          <strong data-mesas>0,00 %</strong>
        </div>
        <div class="barra-mesas"><span data-barra-mesas></span></div>
        <ol class="filas-conteo">
          ${filas
            .map(
              (f) => `
            <li class="fila-conteo ${f.c.jugador ? 'vos' : ''}" data-fila="${f.i}" style="--color-partido:${PARTIDOS[f.c.partido].color}">
              <span class="quien">
                <strong>${escapar(f.c.nombre)}${f.c.jugador ? ' <em>Vos</em>' : ''}</strong>
                <small>${f.c.apodo ? `"${escapar(f.c.apodo)}" · ` : ''}${escapar(f.c.frentePropio ? 'Frente propio' : PARTIDOS[f.c.partido].corto)}</small>
              </span>
              <span class="barra-voto"><span data-barra></span></span>
              <span class="porcentaje" data-porcentaje>0,0 %</span>
              <span class="votos" data-votos>0</span>
            </li>`,
            )
            .join('')}
        </ol>
        <p class="suspenso" data-suspenso hidden>Faltan las últimas mesas…</p>
      </div>

      <div class="veredicto ${opciones.veredicto.tipo}" data-veredicto hidden>
        <span class="sello">${escapar(opciones.veredicto.texto)}</span>
        <p>${escapar(opciones.veredicto.detalle)}</p>
      </div>

      <div class="acciones-noche">
        <button class="boton chico" data-saltar>Saltar</button>
        <button class="boton principal" data-seguir hidden>Seguir</button>
      </div>
    </div>`;

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => contenedor.querySelector<T>(sel)!;
  const saltar = $('[data-saltar]');
  saltar.addEventListener('click', () => {
    control.saltado = true;
    control.esperas.splice(0).forEach((f) => f());
  });

  const secuencia = async () => {
    // 1. Votación: los sobres caen en la urna mientras pasa el día.
    const entrando = $('[data-entrando]');
    const cantidad = opciones.corto ? 8 : 14;
    entrando.innerHTML = Array.from({ length: cantidad }, (_, k) => {
      const lado = k % 2 ? 1 : -1;
      const x = lado * (40 + Math.random() * 70);
      return sobre(
        'cae',
        `--desde-x:${x}px;--giro:${lado * (10 + Math.random() * 30)}deg;animation-delay:${(k * 0.22 * escala).toFixed(2)}s;animation-duration:${(0.9 * Math.max(escala, 0.4)).toFixed(2)}s`,
      );
    }).join('');
    const tVotacion = 3600 * escala;
    await Promise.all([
      animarNumero(0, votaron, tVotacion, control, (v) => ($('[data-votaron]').textContent = miles(v))),
      animarNumero(8 * 60, 18 * 60, tVotacion, control, (v) => ($('[data-hora]').textContent = hora(v))),
    ]);
    $('[data-leyenda]').textContent = '18:00. Cierran los comicios.';
    await pausa(700 * escala, control);

    // 2. Transmisión: los sobres viajan de la urna a la computadora.
    $('[data-escena]').classList.add('transmitiendo');
    $('[data-leyenda]').textContent = 'Se abren las urnas y se cargan los telegramas.';
    const cinta = $('[data-cinta]');
    cinta.innerHTML = Array.from({ length: 9 }, (_, k) =>
      sobre('viaja', `animation-delay:${(k * 0.35 * escala).toFixed(2)}s;animation-duration:${(1.4 * Math.max(escala, 0.4)).toFixed(2)}s`),
    ).join('');
    const pantalla = $('[data-pantalla]');
    const tTransmision = 3800 * escala;
    let lineas = 0;
    await Promise.all([
      animarNumero(0, 100, tTransmision, control, (v) => {
        $('[data-transmitidos]').textContent = `${Math.floor(v)} %`;
        const deberia = Math.floor(v / 9);
        while (lineas < deberia) {
          lineas++;
          const mesa = String(1000 + Math.floor(Math.random() * 8999)).padStart(4, '0');
          pantalla.insertAdjacentHTML('beforeend', `<span class="linea">MESA ${mesa} ...... OK</span>`);
          if (!control.saltado) sonar('tic');
          if (pantalla.children.length > 7) pantalla.children[0].remove();
        }
      }),
      animarNumero(18 * 60, 21 * 60, tTransmision, control, (v) => ($('[data-hora]').textContent = hora(v))),
    ]);
    pantalla.insertAdjacentHTML('beforeend', '<span class="linea listo">PROCESANDO RESULTADOS</span>');
    await pausa(900 * escala, control);

    // 3. Conteo: el tablero se llena mesa por mesa, despacio, y el final se hace esperar.
    $('[data-escena]').classList.add('oculta');
    $('[data-tablero]').hidden = false;
    const pintar = (p: number) => {
      const crudos = filas.map((f, k) => Math.max(0.5, f.final + ruido[k] * (1 - p) ** 1.3));
      const total = crudos.reduce((s, v) => s + v, 0);
      const mostrados = crudos.map((v) => (v / total) * 100);
      const lider = mostrados.indexOf(Math.max(...mostrados));
      filas.forEach((f, k) => {
        const fila = contenedor.querySelector<HTMLElement>(`[data-fila="${f.i}"]`)!;
        fila.querySelector<HTMLElement>('[data-barra]')!.style.width = `${mostrados[k]}%`;
        fila.querySelector('[data-porcentaje]')!.textContent = `${mostrados[k].toFixed(1).replace('.', ',')} %`;
        fila.querySelector('[data-votos]')!.textContent = miles(votaron * p * (mostrados[k] / 100));
        fila.classList.toggle('lider', k === lider);
      });
      $('[data-mesas]').textContent = `${(p * 100).toFixed(2).replace('.', ',')} %`;
      $('[data-barra-mesas]').style.width = `${p * 100}%`;
      $('[data-mesas]').title = `${miles(mesas * p)} de ${miles(mesas)} mesas`;
    };
    const t = 6500 * escala;
    await animarNumero(0, 0.6, t * 0.35, control, pintar);
    await animarNumero(0.6, 0.874, t * 0.35, control, pintar);
    const suspenso = $('[data-suspenso]');
    suspenso.hidden = false;
    if (!control.saltado) sonar('redoble');
    await pausa(1600 * escala, control);
    suspenso.hidden = true;
    await animarNumero(0.874, 1, t * 0.3, control, pintar);
    pintar(1);
    // Al final, el tablero se ordena de mayor a menor.
    const lista = contenedor.querySelector('.filas-conteo')!;
    [...lista.children]
      .sort((a, b) => r.votos[Number((b as HTMLElement).dataset.fila)] - r.votos[Number((a as HTMLElement).dataset.fila)])
      .forEach((fila) => lista.appendChild(fila));
    await pausa(500 * escala, control);

    // 4. El veredicto.
    $('[data-veredicto]').hidden = false;
    if (opciones.veredicto.tipo !== 'neutro') sonar(opciones.veredicto.tipo === 'bueno' ? 'victoria' : 'derrota');
    saltar.hidden = true;
    const seguir = $('[data-seguir]');
    seguir.hidden = false;
    seguir.focus();
    await new Promise<void>((resolver) => seguir.addEventListener('click', () => resolver(), { once: true }));
  };
  return secuencia();
}
