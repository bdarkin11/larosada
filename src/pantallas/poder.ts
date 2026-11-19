import { CARGOS } from '../datos/cargos';
import {
  NOMBRE_POSTURA,
  PISO_PODER,
  PODER_ALTO,
  PODER_SOLO,
  PUNTOS_POR_FAVOR,
  apoyoDelPoder,
  factorImpunidad,
  favoresACobrar,
  poderDeTuLugar,
  posturaPoder,
} from '../motor/poder';
import { MOVIDAS, motivoSinMovida } from '../motor/justicia';
import { buscarPromesa } from '../datos/promesas';
import { MALESTAR_ALTO } from '../motor/promesas';
import type { Carrera } from '../motor/tipos';
import { confirmar, dolares, escapar } from '../ui';

function seccionMovidas(carrera: Carrera) {
  if (carrera.estilo === 'idealista') {
    return `
      <section class="tienda-seccion">
        <h4>🕶️ Por debajo de la mesa</h4>
        <p class="ayuda">Tu estilo idealista no te deja. Las manos limpias tienen su premio: los carpetazos no te prenden.</p>
      </section>`;
  }
  return `
    <section class="tienda-seccion">
      <h4>🕶️ Por debajo de la mesa</h4>
      <p class="ayuda">Se paga con plata negra (tenés ${dolares(carrera.cajaNegra)}). Una vez por año cada una. Todo deja rastro.</p>
      <div class="tienda-items grilla">
        ${MOVIDAS.map((m) => {
          const motivo = motivoSinMovida(carrera, m.id);
          return `
          <button class="item-tienda movida" data-movida="${m.id}" ${motivo ? 'disabled' : ''}>
            <span class="item-cabeza"><strong>${m.icono} ${m.nombre}</strong><span class="precio negro">${dolares(m.costo(carrera))}</span></span>
            <span class="item-texto">${m.descripcion}</span>
            ${motivo ? `<span class="item-motivo">${motivo}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

/** El poder en una sola barra: dónde estás, hacia dónde tiende y para qué sirve. */
function seccionPoder(carrera: Carrera) {
  const p = carrera.medidores.poder;
  const objetivo = poderDeTuLugar(carrera);
  const postura = posturaPoder(p);
  const apoyo = apoyoDelPoder(carrera);
  const impunidad = factorImpunidad(carrera);
  const tendencia = objetivo > p ? 'sube' : objetivo < p ? 'baja' : 'se mantiene';
  return `
    <section class="tienda-seccion">
      <h4>Tu peso entre los que mandan</h4>
      <p class="ayuda">Sindicatos, empresarios, medios, jueces y gobernadores, todos juntos. Las decisiones lo suben o lo bajan.</p>
      <div class="barra-poder ${postura}">
        <span class="relleno" style="width:${p}%"></span>
        <span class="marca-objetivo" style="left:${objetivo}%" title="El poder que te da tu lugar"></span>
      </div>
      <p class="estado-poder"><strong>${p}</strong> · ${NOMBRE_POSTURA[postura]}</p>
      <ul class="fuentes-poder">
        <li><span>Tu cargo (${escapar(CARGOS[carrera.cargo].nombre)})</span><strong>${PISO_PODER[carrera.cargo]}</strong></li>
        <li><span>Un quinto de tu construcción</span><strong>+${Math.round(carrera.construccion / 5)}</strong></li>
        <li class="total"><span>El poder que te da tu lugar</span><strong>${objetivo}</strong></li>
      </ul>
      <p class="ayuda">El poder se ejerce o se pierde: cada año ${tendencia === 'se mantiene' ? 'se queda donde está' : `${tendencia} un poco hacia ${objetivo}`}.</p>
      <ul class="efectos-poder">
        <li>En las elecciones: <strong class="${apoyo >= 0 ? 'bueno' : 'malo'}">${apoyo >= 0 ? '+' : ''}${apoyo}</strong> de fuerza.</li>
        <li>Tus causas avanzan <strong class="${impunidad < 1 ? 'bueno' : 'malo'}">× ${impunidad.toFixed(2).replace('.', ',')}</strong>${impunidad < 1 ? ': hay quien te cuide' : ': nadie te cuida'}.</li>
        <li>${p <= PODER_SOLO ? '<strong class="malo">Estás solo</strong>: Imagen −1 por año y las amenazas llegan el doble.' : p >= PODER_ALTO ? '<strong class="bueno">Todos te llaman</strong>: Fama +1 por año.' : `Con ${PODER_ALTO} o más, todos te llaman (Fama +1 por año). Con ${PODER_SOLO} o menos, estás solo.`}</li>
      </ul>
    </section>`;
}

/** Lo que prometiste y cómo está la calle. */
function seccionPromesasYCalle(carrera: Carrera) {
  const promesas = carrera.promesas ?? [];
  const malestar = carrera.malestar ?? 0;
  const rotas = (carrera.promesasRotas ?? []).filter((a) => carrera.anio - a < 8).length;
  return `
    <section class="tienda-seccion">
      <h4>🤝 Tus promesas y la calle</h4>
      ${
        promesas.length
          ? `<ul class="fuentes-poder">${promesas
              .map((p) => {
                const def = buscarPromesa(p.id);
                return `<li><span>«${escapar(def.texto)}»<br><small>${escapar(def.detalle)}</small></span><strong>hasta ${p.hasta}</strong></li>`;
              })
              .join('')}</ul>`
          : '<p class="vacio">No tenés promesas vigentes.</p>'
      }
      ${rotas ? `<p class="ayuda malo">Rompiste ${rotas === 1 ? 'una promesa' : `${rotas} promesas`} en los últimos ocho años: te restan votos.</p>` : ''}
      <p class="ayuda">✊ Bronca en la calle: <strong class="${malestar >= MALESTAR_ALTO ? 'malo' : ''}">${malestar}</strong>/100. Cuanto más alta, más paros y marchas; con ${MALESTAR_ALTO} o más perdés Poder −3 por año. Se enfría sola un cuarto por año.</p>
    </section>`;
}

/** El poder, la libreta de favores y lo que se hace por debajo de la mesa, en una capa. */
export function abrirPoder(capa: HTMLElement, carrera: Carrera, alMover: (id: string) => void) {
  const teDeben = carrera.favores.filter((f) => !f.debes);
  const debes = carrera.favores.filter((f) => f.debes);
  const linea = (f: (typeof carrera.favores)[number]) =>
    `<li><span>${escapar(f.quien)}</span><small>${escapar(f.motivo)} · ${f.anio}</small></li>`;
  capa.innerHTML = `
    <div class="tienda grupos-capa" role="dialog" aria-modal="true" aria-labelledby="titulo-poder">
      <header class="tienda-cabeza">
        <h3 id="titulo-poder">El poder</h3>
        <span class="tienda-caja">${carrera.medidores.poder} / 100</span>
        <button class="cerrar" data-accion="cerrar-poder" aria-label="Cerrar">×</button>
      </header>
      ${seccionPoder(carrera)}
      ${seccionPromesasYCalle(carrera)}
      <section class="tienda-seccion">
        <h4>📒 La libreta de favores</h4>
        <div class="libreta">
          <div>
            <p class="libreta-titulo bueno">Te deben (${teDeben.length})</p>
            ${teDeben.length ? `<ul>${teDeben.map(linea).join('')}</ul>` : '<p class="vacio">Nadie te debe nada.</p>'}
            ${teDeben.length ? `<p class="ayuda">En la próxima campaña cobrás ${favoresACobrar(carrera).length}: +${favoresACobrar(carrera).length * PUNTOS_POR_FAVOR} de fuerza.</p>` : ''}
          </div>
          <div>
            <p class="libreta-titulo malo">Debés (${debes.length})</p>
            ${debes.length ? `<ul>${debes.map(linea).join('')}</ul>` : '<p class="vacio">No le debés nada a nadie.</p>'}
            ${debes.length ? '<p class="ayuda">Tarde o temprano te lo vienen a cobrar. Si no cumplís: Poder −6 e Imagen −1.</p>' : ''}
          </div>
        </div>
      </section>
      ${seccionMovidas(carrera)}
    </div>`;
  capa.hidden = false;
  document.body.classList.add('sin-scroll');
  const cerrar = () => {
    capa.hidden = true;
    capa.innerHTML = '';
    document.body.classList.remove('sin-scroll');
  };
  capa.querySelector('[data-accion="cerrar-poder"]')!.addEventListener('click', cerrar);
  capa.querySelectorAll<HTMLButtonElement>('[data-movida]').forEach((b) =>
    b.addEventListener('click', async () => {
      const m = MOVIDAS.find((x) => x.id === b.dataset.movida)!;
      if (!(await confirmar(`¿${m.nombre}? Cuesta ${dolares(m.costo(carrera))} en negro.`, { aceptar: 'Hacerlo' }))) return;
      cerrar();
      alMover(m.id);
    }),
  );
  capa.onclick = (e) => {
    if (e.target === capa) cerrar();
  };
}
