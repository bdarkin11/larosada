import { MEDIOS, SEGUNDOS_POR_PREGUNTA } from '../datos/entrevistas';
import { ITEMS, NOMBRE_SECCION } from '../datos/tienda';
import type { SeccionTienda } from '../datos/tienda';
import { motivoSinEntrevista } from '../motor/entrevista';
import { aniosRestantes, motivoSinCompra, tiene } from '../motor/tienda';
import type { Carrera, MedioId } from '../motor/tipos';
import { chips, confirmar, dolares } from '../ui';

interface Acciones {
  alEntrevistar: (medio: MedioId) => void;
  /** Compra una mejora; recibe dónde estaba la tienda para reabrirla en el mismo lugar. */
  alComprar: (id: string, desplazamiento: number) => void;
}

function seccionPrensa(carrera: Carrera) {
  return `
    <section class="tienda-seccion">
      <h4>Prensa · entrevistas</h4>
      <p class="ayuda">Pagás el espacio y contestás en vivo. Según cómo respondas, ganás o perdés fama. Una por año.</p>
      <div class="tienda-items">
        ${Object.values(MEDIOS)
          .map((m) => {
            const motivo = motivoSinEntrevista(carrera, m.id);
            return `
            <button class="item-tienda" data-medio="${m.id}" ${motivo ? 'disabled' : ''}>
              <span class="item-cabeza"><strong>🎤 ${m.nombre}</strong><span class="precio">${dolares(m.costo)}</span></span>
              <span class="item-texto">${m.descripcion}</span>
              <span class="item-datos">${m.preguntas} preguntas · ${SEGUNDOS_POR_PREGUNTA} segundos cada una${m.famaMinima ? ` · pide ${m.famaMinima} de Fama` : ''}</span>
              ${motivo ? `<span class="item-motivo">${motivo}</span>` : ''}
            </button>`;
          })
          .join('')}
      </div>
    </section>`;
}

function seccion(carrera: Carrera, nombre: SeccionTienda) {
  return `
    <section class="tienda-seccion">
      <h4>${NOMBRE_SECCION[nombre]}</h4>
      <div class="tienda-items grilla">
        ${ITEMS.filter((i) => i.seccion === nombre)
          .map((item) => {
            const loTenes = tiene(carrera, item.id);
            const motivo = motivoSinCompra(carrera, item.id);
            const restantes = aniosRestantes(carrera, item.id);
            const estado = loTenes
              ? `<span class="item-tenes">✓ ${item.seccion === 'consumible' ? `Activo · ${restantes === 1 ? 'queda este año' : `quedan ${restantes} años`}` : 'Lo tenés'}</span>`
              : motivo
                ? `<span class="item-motivo">${motivo}</span>`
                : '';
            return `
            <button class="item-tienda ${loTenes ? 'comprado' : ''}" data-item="${item.id}" ${motivo ? 'disabled' : ''}>
              <span class="item-cabeza"><strong>${item.icono} ${item.nombre}</strong>${loTenes ? '' : `<span class="precio">${dolares(item.costo)}</span>`}</span>
              <span class="item-texto">${item.descripcion}</span>
              ${item.alComprar ? chips(item.alComprar) : ''}
              ${estado}
            </button>`;
          })
          .join('')}
      </div>
    </section>`;
}

/** La tienda, en una capa encima de la carrera. */
export function abrirTienda(capa: HTMLElement, carrera: Carrera, acciones: Acciones, desplazamiento?: number) {
  capa.innerHTML = `
    <div class="tienda ${desplazamiento === undefined ? '' : 'sin-entrada'}" role="dialog" aria-modal="true" aria-labelledby="titulo-tienda">
      <header class="tienda-cabeza">
        <h3 id="titulo-tienda">Tienda</h3>
        <span class="tienda-caja ${carrera.medidores.caja < 0 ? 'peligro' : ''}">${dolares(carrera.medidores.caja)}</span>
        <button class="cerrar" data-accion="cerrar-tienda" aria-label="Cerrar la tienda">×</button>
      </header>
      ${seccionPrensa(carrera)}
      ${seccion(carrera, 'equipo')}
      ${seccion(carrera, 'consumible')}
      ${seccion(carrera, 'lujo')}
    </div>`;
  capa.hidden = false;
  if (desplazamiento !== undefined) capa.scrollTop = desplazamiento;
  document.body.classList.add('sin-scroll');
  const cerrar = () => {
    capa.hidden = true;
    capa.innerHTML = '';
    document.body.classList.remove('sin-scroll');
  };
  capa.querySelector('[data-accion="cerrar-tienda"]')!.addEventListener('click', cerrar);
  capa.onclick = (e) => {
    if (e.target === capa) cerrar();
  };
  capa.querySelectorAll<HTMLButtonElement>('[data-medio]').forEach((boton) =>
    boton.addEventListener('click', async () => {
      const medio = MEDIOS[boton.dataset.medio as MedioId];
      if (!(await confirmar(`¿Pagás ${dolares(medio.costo)} por la entrevista en ${medio.nombre}?`, { aceptar: 'Pagar' }))) return;
      cerrar();
      acciones.alEntrevistar(medio.id);
    }),
  );
  capa.querySelectorAll<HTMLButtonElement>('[data-item]').forEach((boton) =>
    // Las mejoras se compran con un toque y la tienda queda abierta.
    boton.addEventListener('click', () => acciones.alComprar(boton.dataset.item!, capa.scrollTop)),
  );
}
