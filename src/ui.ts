import { NOMBRE_ATRIBUTO, NOMBRE_MEDIDOR, esBueno, textoCantidad } from './motor/carrera';
import { ATRIBUTOS } from './motor/tipos';
import type { Atributo, Atributos, Carrera, Ideologia, Medidor, Medidores } from './motor/tipos';

/** Para qué sirve cada número: aparece al tocarlo. */
export const AYUDA: Record<Atributo | Medidor, string> = {
  rosca: 'Saber negociar. Sirve en las internas, la lapicera, el desafuero y en las apuestas de los eventos.',
  territorio:
    'Tu base en el barrio y tu resistencia. Pesa en las elecciones locales, hace crecer tu construcción y, con poco, la salud te saca antes.',
  gestion: 'Saber gobernar. Pesa en las reelecciones y abre los cargos designados.',
  fama: 'Cuánta gente te conoce y cómo caés en público. Pesa en todas las elecciones (más en las nacionales) y en las entrevistas; cada candidatura pide un mínimo y se apaga sola con los años.',
  imagen: 'Cuánto te quieren los que te conocen. Pesa en todas las elecciones; vuelve sola hacia 50.',
  causas: 'Riesgo judicial. Desde 30 te pueden abrir una causa.',
  caja: 'Tu plata. Los costos de los eventos son un porcentaje de lo que tenés.',
  poder: 'Tu peso entre los que mandan. Suma en las elecciones y frena las causas.',
};

/** La posición ideológica en dos ejes: Estado ↔ Mercado y conservador ↔ progresista. */
export function brujula(ideologia: Ideologia): string {
  const x = 28 + (ideologia.economia / 100) * 22;
  const y = 28 - (ideologia.social / 100) * 22;
  return `
    <svg class="brujula" viewBox="0 0 56 56" role="img" aria-label="Tus ideas: economía ${ideologia.economia}, social ${ideologia.social}">
      <title>Tus ideas · horizontal: Estado ↔ Mercado · vertical: conservador ↔ progresista</title>
      <rect x="1" y="1" width="54" height="54" rx="8" fill="#0b121a" stroke="#2b3d55"/>
      <path d="M28 5 V51 M5 28 H51" stroke="#2b3d55" stroke-width="1"/>
      <text x="6" y="31" font-size="6" fill="#6f8299">E</text>
      <text x="46" y="31" font-size="6" fill="#6f8299">M</text>
      <text x="26" y="11" font-size="6" fill="#6f8299">P</text>
      <text x="26" y="52" font-size="6" fill="#6f8299">C</text>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#38bdf833"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#38bdf8" stroke="#fff" stroke-width="1.2"/>
    </svg>`;
}

/** Números que cuentan solos: del valor anterior al nuevo, en un rato corto. */
export function contarNumeros(raiz: ParentNode) {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.querySelectorAll<HTMLElement>('[data-hasta]').forEach((el) => {
    const desde = Number(el.dataset.desde);
    const hasta = Number(el.dataset.hasta);
    const plata = el.dataset.plata === '1';
    const pintar = (v: number) => (el.textContent = plata ? dolares(Math.round(v / 100) * 100) : String(Math.round(v)));
    if (reducido || desde === hasta) return pintar(hasta);
    const inicio = performance.now();
    const duracion = 800;
    pintar(desde);
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      pintar(desde + (hasta - desde) * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(paso);
      else pintar(hasta);
    };
    requestAnimationFrame(paso);
  });
}

export const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const dolares = (monto: number) => `${monto < 0 ? '−' : ''}US$ ${Math.abs(monto).toLocaleString('es-AR')}`;

export const nombreDe = (clave: Atributo | Medidor) =>
  clave in NOMBRE_ATRIBUTO ? NOMBRE_ATRIBUTO[clave as Atributo] : NOMBRE_MEDIDOR[clave as Medidor];

/** Un efecto como etiqueta: verde si te conviene, rojo si te resta. */
export function chip(clave: Atributo | Medidor, cantidad: number) {
  const clase = cantidad === 0 ? 'neutro' : esBueno(clave, cantidad) ? 'bueno' : 'malo';
  return `<span class="chip ${clase}">${textoCantidad(clave, cantidad)} ${nombreDe(clave)}</span>`;
}

export function chips(efectos: Partial<Record<Atributo | Medidor, number>>) {
  return `<span class="chips">${Object.entries(efectos)
    .map(([clave, cantidad]) => chip(clave as Atributo | Medidor, cantidad!))
    .join('')}</span>`;
}

function dato(etiqueta: string, valor: string, clase = '') {
  return `<div class="dato ${clase}"><dt>${etiqueta}:</dt><dd>${valor}</dd></div>`;
}

/** La ficha compacta: atributos y situación en un solo recuadro, nombre y valor. */
export function paneles(atributos: Atributos, m: Medidores) {
  return `
    <section class="panel ficha-datos">
      <dl>
        ${ATRIBUTOS.map((a) => dato(NOMBRE_ATRIBUTO[a], String(atributos[a]))).join('')}
        ${dato(NOMBRE_MEDIDOR.fama, String(m.fama))}
        ${dato(NOMBRE_MEDIDOR.imagen, String(m.imagen))}
        ${dato(NOMBRE_MEDIDOR.causas, String(m.causas), m.causas > 0 ? 'peligro' : '')}
        ${dato(NOMBRE_MEDIDOR.poder, String(m.poder))}
        ${dato(NOMBRE_MEDIDOR.caja, dolares(m.caja), m.caja < 0 ? 'peligro' : '')}
      </dl>
    </section>`;
}

/** Nivel de un número de 0 a 100, para el color del recuadro. */
export function nivel(valor: number) {
  if (valor >= 80) return 'n4';
  if (valor >= 60) return 'n3';
  if (valor >= 40) return 'n2';
  return 'n1';
}

function flecha(carrera: Carrera, clave: Atributo | Medidor) {
  const cambio = carrera.cambios?.[clave];
  if (!cambio) return '';
  const bueno = esBueno(clave, cambio);
  const texto = textoCantidad(clave, cambio);
  return `<span class="flecha ${bueno ? 'bueno' : 'malo'}" title="${texto} el último año">${cambio > 0 ? '▲' : '▼'}${clave === 'caja' ? '' : `<small>${Math.abs(cambio)}</small>`}</span>`;
}

/** Un recuadro de la barra de estadísticas: valor grande, flecha y nombre. */
export function caja(carrera: Carrera, clave: Atributo | Medidor, animar: boolean) {
  const valor = clave in carrera.atributos ? carrera.atributos[clave as Atributo] : carrera.medidores[clave as Medidor];
  const cambio = carrera.cambios?.[clave];
  const clases = ['estadistica'];
  if (clave === 'caja') clases.push(valor < 0 ? 'peligro' : 'plata');
  else if (clave === 'causas') clases.push(valor >= 60 ? 'peligro' : valor >= 30 ? 'alerta-causas' : 'n1');
  else clases.push(nivel(valor));
  if (animar && cambio) clases.push(esBueno(clave, cambio) ? 'destello-bueno' : 'destello-malo');
  const texto = clave === 'caja' ? dolares(valor) : String(valor);
  const contar =
    animar && cambio ? ` data-desde="${valor - cambio}" data-hasta="${valor}"${clave === 'caja' ? ' data-plata="1"' : ''}` : '';
  return `
    <div class="${clases.join(' ')}" data-clave="${clave}" tabindex="0" data-ayuda="${escapar(AYUDA[clave])}">
      <span class="valor"><span class="numero"${contar}>${texto}</span>${flecha(carrera, clave)}</span>
      <span class="etiqueta">${nombreDe(clave)}</span>
    </div>`;
}

/**
 * Confirmación propia, en la página. Reemplaza a window.confirm, que en
 * algunos navegadores (como el integrado) no se muestra y devuelve "no".
 */
export function confirmar(texto: string, opciones: { aceptar?: string; peligro?: boolean } = {}): Promise<boolean> {
  return new Promise((resolver) => {
    const capa = document.createElement('div');
    capa.className = 'capa confirmacion';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.innerHTML = `
      <div class="caja-confirmacion">
        <p>${escapar(texto)}</p>
        <div class="botones-confirmacion">
          <button class="boton chico" data-respuesta="no">Cancelar</button>
          <button class="boton chico principal ${opciones.peligro ? 'peligro-lleno' : ''}" data-respuesta="si">${escapar(opciones.aceptar ?? 'Sí')}</button>
        </div>
      </div>`;
    const cerrar = (valor: boolean) => {
      document.removeEventListener('keydown', teclas);
      capa.remove();
      resolver(valor);
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar(false);
    };
    capa.addEventListener('click', (e) => {
      const boton = (e.target as HTMLElement).closest<HTMLElement>('[data-respuesta]');
      if (boton) cerrar(boton.dataset.respuesta === 'si');
      else if (e.target === capa) cerrar(false);
    });
    document.addEventListener('keydown', teclas);
    document.body.appendChild(capa);
    capa.querySelector<HTMLButtonElement>('[data-respuesta="si"]')!.focus();
  });
}
