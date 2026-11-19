import { CARGOS } from '../datos/cargos';
import { PARTIDOS, elPartido } from '../datos/partidos';
import type { Carrera, OfertaPase } from '../motor/tipos';
import { chip, dolares, escapar } from '../ui';

function etiqueta(o: OfertaPase) {
  if (o.renovacion) return '<span class="etiqueta-pase renovacion">Renovación</span>';
  if (o.imperdonable) return '<span class="etiqueta-pase traicion">Traición</span>';
  return '<span class="etiqueta-pase pase">Pase</span>';
}

function oferta(carrera: Carrera, o: OfertaPase, i: number) {
  const p = PARTIDOS[o.partido];
  const actual = CARGOS[carrera.cargo];
  const nuevo = CARGOS[o.cargo];
  const lineaCargo =
    o.cargo === carrera.cargo
      ? `<span class="cargo-oferta igual">${o.cargo === 'militante' ? 'Seguís sin cargo' : `Seguís como ${nuevo.nombre}`}</span>`
      : nuevo.rango > actual.rango
        ? `<span class="cargo-oferta sube">▲ ${nuevo.nombre} · ${dolares(nuevo.ingresoAnual)} por año</span>`
        : `<span class="cargo-oferta baja">▼ Perdés tu cargo de ${actual.nombre}</span>`;
  const efectos = [
    o.caja ? chip('caja', o.caja) : '',
    o.fama ? chip('fama', o.fama) : '',
    o.imagen ? chip('imagen', o.imagen) : '',
    o.construccion
      ? `<span class="chip ${o.construccion > 0 ? 'bueno' : 'malo'}">${o.construccion > 0 ? '+' : '−'}${Math.abs(o.construccion)} Construcción</span>`
      : '',
  ].join('');
  return `
    <button class="oferta-pase ${o.renovacion ? 'renueva' : o.imperdonable ? 'imperdonable' : ''}" data-pase="${i}" style="--color-partido:${p.color}">
      <span class="oferta-cabeza">
        <strong>${escapar(p.nombre)}</strong>
        ${etiqueta(o)}
      </span>
      ${lineaCargo}
      <span class="chips">${efectos}</span>
      ${
        o.renovacion
          ? `<span class="oferta-nota">${o.construccion ? 'La lealtad suma construcción.' : 'Para seguir creciendo, la gente te tiene que querer: Imagen 55 o más.'}</span>`
          : o.imperdonable
            ? '<span class="oferta-nota malo">Te vas al espacio de enfrente: traición imperdonable.</span>'
            : `<span class="oferta-nota">Dejás ${escapar(elPartido(carrera.partido, true))}: tu gente lo va a sentir.</span>`
      }
    </button>`;
}

export function panelPases(carrera: Carrera) {
  return `
    <section class="panel cierre-listas">
      <p class="alerta celeste">Cierre de listas ${carrera.anio}</p>
      <h3>Año electoral: te vinieron a buscar</h3>
      <p class="ayuda">Antes de seguir, decidí: renovás con tu partido o te vas a otro. Cambiarte de espacio te baja la construcción.</p>
      <div class="ofertas">
        ${carrera.pases!.map((o, i) => oferta(carrera, o, i)).join('')}
      </div>
    </section>`;
}
