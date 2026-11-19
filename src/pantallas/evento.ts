import { TEXTO_ALERTA, buscarEvento } from '../datos/eventos';
import type { Opcion, Resultado } from '../datos/eventos';
import type { Efectos } from '../datos/tienda';
import { esBueno } from '../motor/ficha';
import { motivoOpcion, preverResultado, quienHabla } from '../motor/eventos';
import type { Prevision } from '../motor/eventos';
import type { Desenlace } from '../motor/eventos';
import { porcentajeDeCaja } from '../motor/escala';
import { ICONO_INDICADOR, NOMBRE_INDICADOR, indicadorBueno } from '../motor/pais';
import { ICONO_DISTRITO, NOMBRE_DISTRITO } from '../motor/distrito';
import type { Carrera, IndicadoresDistrito, Pais } from '../motor/tipos';
import { chip, dolares, escapar } from '../ui';
import { retrato, semillaDe } from './retrato';
import { sonar } from '../sonido';

/** Un indicador del país: verde si mejora, rojo si empeora. */
function chipPais(clave: keyof Pais, cantidad: number) {
  const texto = `${ICONO_INDICADOR[clave]} ${NOMBRE_INDICADOR[clave]} ${cantidad > 0 ? '+' : '−'}${Math.abs(cantidad)}${clave === 'inflacion' ? ' %' : ''}`;
  return `<span class="chip ${indicadorBueno(clave, cantidad) ? 'bueno' : 'malo'}">${texto}</span>`;
}

const chipDistrito = (clave: keyof IndicadoresDistrito, cantidad: number) =>
  `<span class="chip ${cantidad > 0 ? 'bueno' : 'malo'}">${ICONO_DISTRITO[clave]} ${NOMBRE_DISTRITO[clave]} ${cantidad > 0 ? '+' : '−'}${Math.abs(cantidad)}</span>`;

const chipMalestar = (cantidad: number) =>
  `<span class="chip ${cantidad > 0 ? 'malo' : 'bueno'}">✊ Calle ${cantidad > 0 ? '+' : '−'}${Math.abs(cantidad)}</span>`;

function chipsDe(
  efectos: Efectos,
  construccion: number,
  negra = 0,
  pais: Partial<Pais> = {},
  malestar = 0,
  distrito: Partial<IndicadoresDistrito> = {},
) {
  const partes = Object.entries(efectos).map(([k, v]) => chip(k as keyof Efectos, v!));
  if (construccion)
    partes.push(
      `<span class="chip ${construccion > 0 ? 'bueno' : 'malo'}">${construccion > 0 ? '+' : '−'}${Math.abs(construccion)} Construcción</span>`,
    );
  if (negra) partes.push(`<span class="chip negro">${negra > 0 ? '+' : '−'}${dolares(Math.abs(negra))} en negro</span>`);
  for (const [k, v] of Object.entries(pais)) partes.push(chipPais(k as keyof Pais, v!));
  for (const [k, v] of Object.entries(distrito)) partes.push(chipDistrito(k as keyof IndicadoresDistrito, v!));
  if (malestar) partes.push(chipMalestar(malestar));
  return `<span class="chips">${partes.join('')}</span>`;
}

/** La plata de una opción, con lo que representa de tu caja: "−US$ 13.800 Caja · 6 % de tu caja". */
function chipPlata(monto: number, base: number, tope: boolean, negra: boolean) {
  const pct = porcentajeDeCaja(monto, base);
  const detalle = tope && monto > 0 ? 'el tope' : pct ? `${pct} % de tu caja${negra && monto < 0 ? ' negra' : ''}` : '';
  const texto = `${monto > 0 ? '+' : '−'}${dolares(Math.abs(monto))} ${negra ? 'en negro' : 'Caja'}${detalle ? ` <small>· ${detalle}</small>` : ''}`;
  return `<span class="chip ${negra ? 'negro' : monto > 0 ? 'bueno' : 'malo'}">${texto}</span>`;
}

const etiqueta = (bueno: boolean, texto: string) => `<span class="chip ${bueno ? 'bueno' : 'malo'}">${texto}</span>`;

const TEXTO_PROCESO: Record<NonNullable<Prevision['proceso']>, [boolean, string]> = {
  retroceder: [true, '⚖️ La causa retrocede'],
  archivar: [true, '⚖️ Se archiva tu causa'],
  avanzar: [false, '⚖️ La causa avanza'],
  detencion: [false, '🚔 Orden de detención'],
};

/** Separa lo que suma de lo que resta. */
function prosYContras(carrera: Carrera, p: Prevision): { pros: string[]; contras: string[] } {
  const pros: string[] = [];
  const contras: string[] = [];
  for (const [k, v] of Object.entries(p.efectos)) {
    const lado = esBueno(k as keyof Efectos, v!) ? pros : contras;
    lado.push(k === 'caja' ? chipPlata(v!, carrera.medidores.caja, p.tope, false) : chip(k as keyof Efectos, v!));
  }
  if (p.construccion)
    (p.construccion > 0 ? pros : contras).push(
      etiqueta(p.construccion > 0, `${p.construccion > 0 ? '+' : '−'}${Math.abs(p.construccion)} Construcción`),
    );
  if (p.negra)
    (p.negra > 0 ? pros : contras).push(chipPlata(p.negra, p.negra > 0 ? carrera.medidores.caja : carrera.cajaNegra, p.tope, true));
  for (const [k, v] of Object.entries(p.pais)) (indicadorBueno(k as keyof Pais, v!) ? pros : contras).push(chipPais(k as keyof Pais, v!));
  for (const [k, v] of Object.entries(p.distrito)) (v! > 0 ? pros : contras).push(chipDistrito(k as keyof IndicadoresDistrito, v!));
  if (p.malestar) (p.malestar < 0 ? pros : contras).push(chipMalestar(p.malestar));
  const { lealtad, nivel, cargo } = p.delfin;
  const signo = (n: number) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
  if (nivel) (nivel > 0 ? pros : contras).push(etiqueta(nivel > 0, `🐬 Tu delfín crece ${signo(nivel)}`));
  if (lealtad) (lealtad > 0 ? pros : contras).push(etiqueta(lealtad > 0, `🐬 Lealtad de tu delfín ${signo(lealtad)}`));
  if (cargo) pros.push(etiqueta(true, '🐬 Tu delfín gana una banca'));
  if (p.sentido === 'coherente') pros.push(etiqueta(true, '🧭 Va con tus ideas'));
  if (p.sentido === 'incoherente') contras.push(etiqueta(false, '🧭 Va contra tus ideas: tu gente no lo entiende'));
  for (const r of p.rompe) contras.push(etiqueta(false, `💔 Rompés tu promesa «${escapar(r.texto)}»`));
  if (p.limpias) pros.push(etiqueta(true, '🤍 Mantenés las manos limpias'));
  if (p.ensucia) contras.push(etiqueta(false, '🤍 Perdés las manos limpias'));
  if (p.rastro) contras.push(etiqueta(false, '🕶️ Deja rastro: las causas no bajan de un piso'));
  if (p.favor) {
    if (p.favor.debes) contras.push(etiqueta(false, `📒 Le debés un favor a ${escapar(p.favor.quien)}`));
    else pros.push(etiqueta(true, `📒 ${escapar(p.favor.quien)} te debe un favor`));
  }
  if (p.saldaFavor) pros.push(etiqueta(true, '📒 Saldás la deuda'));
  if (p.proceso) {
    const [bueno, texto] = TEXTO_PROCESO[p.proceso];
    (bueno ? pros : contras).push(etiqueta(bueno, texto));
  }
  return { pros, contras };
}

function bloqueProsContras(carrera: Carrera, p: Prevision) {
  const { pros, contras } = prosYContras(carrera, p);
  return `
    <span class="pros-contras">
      <span class="fila-pc pros"><em>A favor</em>${pros.length ? pros.join('') : '<span class="nada">Nada</span>'}</span>
      <span class="fila-pc contras"><em>En contra</em>${contras.length ? contras.join('') : '<span class="nada">Nada</span>'}</span>
      ${p.amortiguado ? '<span class="nota-limpias">🤍 Tus manos limpias lo amortiguan</span>' : ''}
    </span>`;
}

/** Lo que se ve de una opción antes de elegirla: a favor, en contra y, si hay azar, cada escenario con su chance. */
function detalleOpcion(carrera: Carrera, o: Opcion) {
  const en = carrera.evento!;
  const carpetazo = buscarEvento(en.id).especial === 'carpetazo';
  // La rosca se juega: lo que pase depende de cómo negocies.
  if (o.rosca) return '';
  if ('chance' in o.resultado) {
    const az = o.resultado;
    const chance = Math.round(az.chance(carrera) * 100);
    return `
      <span class="escenario bien">🎲 Si sale bien · ${chance} %${az.exito.cortaCrisis ? ' · se termina la crisis (Poder +5)' : ''}</span>
      ${bloqueProsContras(carrera, preverResultado(carrera, az.exito, carpetazo, true, o))}
      <span class="escenario mal">🎲 Si sale mal · ${100 - chance} %${az.fracaso.fin ? ' · se termina tu carrera' : ''}</span>
      ${bloqueProsContras(carrera, preverResultado(carrera, az.fracaso, carpetazo, true, o))}`;
  }
  const r = o.resultado as Resultado;
  const fin = r.fin ? '<span class="escenario mal">Se termina tu carrera</span>' : '';
  return fin + bloqueProsContras(carrera, preverResultado(carrera, r, carpetazo, true, o));
}

/** Quién habla: retrato propio, nombre y rol. */
function presentacion(carrera: Carrera) {
  const q = quienHabla(carrera);
  if (!q) return '';
  const semilla = q.elenco ? semillaDe(q.nombre) : carrera.evento!.semillaRetrato;
  return `
    <div class="quien-evento">
      ${retrato(semilla, 'retrato-evento')}
      <div class="placa"><strong>${escapar(q.nombre)}</strong><span>${escapar(q.rol)}</span></div>
    </div>`;
}

/** Panel de un evento común, dentro de la carrera. */
export function panelEventoComun(carrera: Carrera) {
  const e = buscarEvento(carrera.evento!.id);
  return `
    <section class="panel evento-comun">
      <p class="alerta celeste">Pasan cosas · ${carrera.anio}</p>
      <div class="evento-cuerpo">
        ${e.quien ? presentacion(carrera) : ''}
        <div>
          <h3>${escapar(e.titulo)}</h3>
          <p class="texto-evento">${escapar(e.texto)}</p>
        </div>
      </div>
      <div class="salidas-detencion">
        ${e.opciones
          .map((o, i) => {
            const motivo = motivoOpcion(carrera, i);
            return `
            <button class="opcion" data-opcion-evento="${i}" ${motivo ? 'disabled' : ''}>
              <strong>${escapar(o.texto)}</strong>
              ${detalleOpcion(carrera, o)}
              ${motivo ? `<span class="item-motivo">${escapar(motivo)}</span>` : ''}
            </button>`;
          })
          .join('')}
      </div>
    </section>`;
}

/** Lo que pasó después de elegir. */
export function vistaDesenlace(d: Desenlace) {
  const clase = d.salioBien === undefined ? '' : d.salioBien ? 'bueno' : 'malo';
  return `
    <div class="desenlace ${clase}">
      ${d.salioBien === undefined ? '' : `<p class="sobretitulo">${d.salioBien ? 'Salió bien' : 'Salió mal'}</p>`}
      <p class="texto-desenlace">${escapar(d.texto)}</p>
      ${chipsDe(d.efectos, d.construccion, d.negra, d.pais, d.malestar, d.distrito)}
      ${d.favor ? `<p class="favor-anotado">📒 ${escapar(d.favor)}</p>` : ''}
      ${(d.consecuencias ?? []).map((l) => `<p class="consecuencia">${escapar(l)}</p>`).join('')}
      <button class="boton principal" data-accion="cerrar-desenlace">Seguir</button>
    </div>`;
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * La alerta de los eventos especiales: se frena todo, tiembla, entra el
 * cartel en diagonal, se desliza el personaje y habla letra por letra.
 * Devuelve la opción elegida.
 */
export async function alertaEspecial(capa: HTMLElement, carrera: Carrera): Promise<number> {
  const e = buscarEvento(carrera.evento!.id);
  const tipo = e.especial!;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  capa.innerHTML = `
    <div class="alerta-evento tipo-${tipo}" role="dialog" aria-modal="true" aria-label="${escapar(TEXTO_ALERTA[tipo])}">
      <div class="lineas-velocidad"></div>
      <div class="destello"></div>
      <div class="cartel-alerta"><span>${TEXTO_ALERTA[tipo]}</span></div>
      <div class="escena-evento" hidden>
        <div class="lado-retrato">${presentacion(carrera)}</div>
        <div class="globo">
          <p class="titulo-globo">${escapar(e.titulo)}</p>
          <p class="tipeo" data-tipeo></p>
          <span class="seguir-tipeo" data-tocar>▼</span>
        </div>
        <div class="opciones-evento" data-opciones hidden>
          ${e.opciones
            .map((o, i) => {
              const motivo = motivoOpcion(carrera, i);
              return `
              <button class="opcion opcion-alerta" data-elegir="${i}" style="animation-delay:${i * 0.12}s" ${motivo ? 'disabled' : ''}>
                <strong>${escapar(o.texto)}</strong>
                ${o.pista ? `<span class="pista">${escapar(o.pista)}</span>` : ''}
                ${detalleOpcion(carrera, o)}
                ${motivo ? `<span class="item-motivo">${escapar(motivo)}</span>` : ''}
              </button>`;
            })
            .join('')}
        </div>
      </div>
    </div>`;
  capa.hidden = false;
  document.body.classList.add('sin-scroll');
  const $ = (s: string) => capa.querySelector<HTMLElement>(s)!;

  // 1 y 2: temblor, destello y cartel.
  sonar('alerta');
  document.querySelector('.carrera')?.classList.add('temblor');
  await pausa(reducido ? 300 : 1500);
  document.querySelector('.carrera')?.classList.remove('temblor');
  $('.alerta-evento').classList.add('hablando');

  // 3: entra el personaje.
  $('.escena-evento').hidden = false;
  await pausa(reducido ? 0 : 450);

  // 4: habla letra por letra. Un toque completa el texto.
  const tipeo = $('[data-tipeo]');
  const texto = e.texto;
  let completo = false;
  const completar = () => (completo = true);
  $('.globo').addEventListener('click', completar);
  for (let i = 1; i <= texto.length && !completo && !reducido; i++) {
    tipeo.textContent = texto.slice(0, i);
    await pausa(texto[i - 1] === '.' || texto[i - 1] === ',' ? 140 : 22);
  }
  tipeo.textContent = texto;
  $('[data-tocar]').hidden = true;

  // 5: las opciones.
  $('[data-opciones]').hidden = false;
  return new Promise<number>((resolver) => {
    capa
      .querySelectorAll<HTMLButtonElement>('[data-elegir]')
      .forEach((b) => b.addEventListener('click', () => resolver(Number(b.dataset.elegir)), { once: true }));
  });
}

/** Después de elegir en la alerta: el desenlace en la misma capa. */
export function desenlaceEnAlerta(capa: HTMLElement, d: Desenlace): Promise<void> {
  const escena = capa.querySelector<HTMLElement>('.escena-evento')!;
  escena.querySelector('[data-opciones]')!.remove();
  escena.querySelector('.globo')!.remove();
  escena.insertAdjacentHTML('beforeend', vistaDesenlace(d));
  return new Promise((resolver) =>
    capa.querySelector('[data-accion="cerrar-desenlace"]')!.addEventListener('click', () => {
      capa.hidden = true;
      capa.innerHTML = '';
      document.body.classList.remove('sin-scroll');
      resolver();
    }),
  );
}
