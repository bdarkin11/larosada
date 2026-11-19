import { CARGOS } from '../datos/cargos';
import { PARTIDOS, elPartido } from '../datos/partidos';
import { ETAPA } from '../motor/ficha';
import { ETAPAS } from '../motor/tipos';
import type { Carrera, Foto, Pendiente } from '../motor/tipos';
import { dolares, escapar } from '../ui';

/** Papelitos celestes, blancos y dorados que caen. Es pura decoración: usa el azar del navegador. */
function confeti(cantidad = 36) {
  const colores = ['#75aadb', '#ffffff', '#f2b632'];
  return `<div class="confeti" aria-hidden="true">${Array.from({ length: cantidad }, (_, i) => {
    const izquierda = Math.round(Math.random() * 100);
    const demora = (Math.random() * 1.2).toFixed(2);
    const duracion = (2.2 + Math.random() * 1.6).toFixed(2);
    const giro = Math.round(Math.random() * 720 - 360);
    return `<span style="left:${izquierda}%;background:${colores[i % 3]};animation-delay:${demora}s;animation-duration:${duracion}s;--giro:${giro}deg"></span>`;
  }).join('')}</div>`;
}

function jura(carrera: Carrera, p: Extract<Pendiente, { tipo: 'jura' }>) {
  const cargo = CARGOS[p.cargo];
  const partido = PARTIDOS[p.partido];
  return `
    ${confeti()}
    <div class="tarjeta-celebracion jura" style="--color-partido:${partido.color}">
      <p class="sobretitulo">Jura del cargo · ${carrera.anio}</p>
      <h2 class="titulo-celebracion">¡Asumiste!</h2>
      <p class="cargo-jurado">${cargo.nombre}</p>
      <p class="partido-jura">por ${escapar(elPartido(p.partido))}</p>
      <p class="descripcion-cargo">${cargo.descripcion}</p>
      <blockquote class="formula">—¿Juráis desempeñar fielmente el cargo?<br><strong>—Sí, juro.</strong></blockquote>
      <div class="firma"><span>${escapar(carrera.nombre)}</span></div>
      <p class="ingreso-jura"><span class="chip bueno">${dolares(cargo.ingresoAnual)} por año</span></p>
      <button class="boton principal" data-accion="seguir-pendiente">Seguir</button>
    </div>`;
}

function etapa(p: Extract<Pendiente, { tipo: 'etapa' }>) {
  const actual = ETAPAS.indexOf(p.etapa);
  return `
    ${confeti(24)}
    <div class="tarjeta-celebracion etapa">
      <p class="sobretitulo">Construcción política</p>
      <div class="medalla"><span>${ETAPA[p.etapa].nombre}</span></div>
      <h2 class="titulo-celebracion">Ahora sos ${ETAPA[p.etapa].nombre}</h2>
      <p class="descripcion-cargo">${ETAPA[p.etapa].descripcion}</p>
      <ol class="escalera-etapas">
        ${ETAPAS.map((e, i) => `<li class="${i < actual ? 'hecha' : i === actual ? 'actual' : ''}">${ETAPA[e].nombre}</li>`).join('')}
      </ol>
      <button class="boton principal" data-accion="seguir-pendiente">Seguir</button>
    </div>`;
}

function filaBalance(nombre: string, antes: number, despues: number, plata = false) {
  const d = despues - antes;
  const formato = (n: number) => (plata ? dolares(n) : String(n));
  const cambio =
    d === 0
      ? '<span class="chip neutro">=</span>'
      : `<span class="chip ${d > 0 ? 'bueno' : 'malo'}">${d > 0 ? '+' : '−'}${plata ? dolares(Math.abs(d)) : Math.abs(d)}</span>`;
  return `<tr><th>${nombre}</th><td>${formato(antes)}</td><td>${formato(despues)}</td><td>${cambio}</td></tr>`;
}

function balance(carrera: Carrera, p: Extract<Pendiente, { tipo: 'balance' }>) {
  const logros = carrera.palmares.filter((l) => l.anio >= p.desde && l.anio <= p.hasta);
  const a: Foto = p.antes;
  const b: Foto = p.despues;
  return `
    ${logros.length ? confeti(30) : ''}
    <div class="tarjeta-celebracion balance">
      <p class="sobretitulo">Balance ${p.desde}–${p.hasta}</p>
      <h2 class="titulo-celebracion">${
        logros.length === 0
          ? 'Un período sin logros'
          : `¡Cerraste el período con ${logros.length} ${logros.length === 1 ? 'logro' : 'logros'}!`
      }</h2>
      ${
        logros.length
          ? `<div class="logros">${logros
              .map(
                (l) =>
                  `<div class="logro"><span class="icono">${l.icono}</span><span>${escapar(l.texto)}</span><small>${l.anio}</small></div>`,
              )
              .join('')}</div>`
          : '<p class="descripcion-cargo">Cuatro años de militancia sin nada para mostrar. El próximo período tiene que ser distinto.</p>'
      }
      <table class="tabla-balance">
        <thead><tr><th></th><th>${p.desde}</th><th>${p.hasta + 1}</th><th></th></tr></thead>
        <tbody>
          ${filaBalance('Poder', a.poder, b.poder)}
          ${filaBalance('Construcción', a.construccion, b.construccion)}
          ${filaBalance('Fama', a.fama, b.fama)}
          ${filaBalance('Imagen', a.imagen, b.imagen)}
          ${filaBalance('Caja', a.caja, b.caja, true)}
        </tbody>
      </table>
      <button class="boton principal" data-accion="seguir-pendiente">Seguir</button>
    </div>`;
}

/** La primera pantalla de festejo o balance que esté en la fila. */
export function capaPendiente(carrera: Carrera) {
  const p = carrera.pendientes[0];
  if (!p) return '';
  const contenido = p.tipo === 'jura' ? jura(carrera, p) : p.tipo === 'etapa' ? etapa(p) : balance(carrera, p);
  return `<div class="capa celebracion" role="dialog" aria-modal="true">${contenido}</div>`;
}
