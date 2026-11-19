import { buscarEvento } from '../datos/eventos';
import { MAYORIA_DIPUTADOS, MAYORIA_SENADO } from '../datos/leyes';
import { TEXTO_PEDIDO } from '../datos/rosca';
import type { Desenlace } from '../motor/eventos';
import { alternarBloque, conteoRosca, fichasLibres, motivoSinBloque, saltearRosca, votarRosca } from '../motor/rosca';
import type { BloqueRosca, Carrera } from '../motor/tipos';
import { escapar } from '../ui';

function marcador(nombre: string, votos: number, mayoria: number) {
  const ancho = Math.min(100, Math.round((votos / mayoria) * 100));
  return `
    <div class="rosca-camara ${votos >= mayoria ? 'alcanza' : ''}">
      <span class="rosca-camara-nombre">${nombre}</span>
      <span class="rosca-camara-votos">${votos} de ${mayoria}</span>
      <span class="rosca-barra" aria-hidden="true"><span style="width:${ancho}%"></span></span>
    </div>`;
}

function tarjetaBloque(carrera: Carrera, b: BloqueRosca, i: number) {
  const r = carrera.rosca!;
  const elegido = r.arreglados.includes(i);
  const motivo = motivoSinBloque(carrera, i);
  const pedido = TEXTO_PEDIDO[b.pide];
  const pelea =
    b.rival !== undefined && !motivo ? `<span class="rosca-pelea">Peleado con ${escapar(r.bloques[b.rival].nombre)}</span>` : '';
  return `
    <button class="rosca-bloque ${elegido ? 'elegido' : ''}" data-bloque="${i}" aria-pressed="${elegido}" ${motivo ? 'disabled' : ''}>
      <strong>${escapar(b.nombre)}</strong>
      <span class="rosca-bancas">${b.diputados} ${b.diputados === 1 ? 'diputado' : 'diputados'} · ${b.senadores} ${b.senadores === 1 ? 'senador' : 'senadores'}</span>
      <span>${pedido.nombre} <em>(${pedido.costo})</em></span>
      <span class="rosca-costo">${elegido ? 'Arreglado · tocá para echarte atrás' : `Cuesta ${b.costo} de rosca`}</span>
      ${pelea}
      ${motivo ? `<span class="item-motivo">${escapar(motivo)}</span>` : ''}
    </button>`;
}

/** La mesa de negociación de una ley. */
export function panelRosca(carrera: Carrera): string {
  const r = carrera.rosca!;
  const e = buscarEvento(carrera.evento!.id);
  const conteo = conteoRosca(carrera);
  return `
    <section class="panel rosca">
      <p class="sobretitulo">Rosca en el Congreso</p>
      <h3>${escapar(e.titulo)}</h3>
      <p>Arreglá con los bloques hasta juntar la mayoría en las dos cámaras. Lo que cedas se paga cuando se vote, salga o no. Alguno que te prometió el voto puede faltar: conviene tener margen.</p>
      <div class="rosca-tablero">
        ${marcador('Diputados', conteo.diputados, MAYORIA_DIPUTADOS)}
        ${marcador('Senado', conteo.senadores, MAYORIA_SENADO)}
        <div class="rosca-fichas"><span>Te queda</span><strong>${fichasLibres(r)}</strong><span>de ${r.fichas} de rosca</span></div>
      </div>
      <div class="rosca-bloques">
        ${r.bloques.map((b, i) => tarjetaBloque(carrera, b, i)).join('')}
      </div>
      <div class="debate-acciones">
        <button class="boton principal" data-rosca="votar">${conteo.alcanza ? 'Llamar a votar' : 'Llamar a votar sin los números'}</button>
        <button class="boton" data-rosca="saltear">Que lo resuelva el equipo (−10 de chance)</button>
      </div>
    </section>`;
}

/** Conecta los botones de la mesa. */
export function conectarRosca(
  raiz: HTMLElement,
  carrera: Carrera,
  acciones: { seguir: (c: Carrera) => void; alTerminar: (d: { carrera: Carrera; desenlace: Desenlace }) => void },
) {
  raiz.querySelectorAll<HTMLButtonElement>('[data-bloque]').forEach((b) =>
    b.addEventListener('click', () => {
      const arriba = window.scrollY;
      acciones.seguir(alternarBloque(carrera, Number(b.dataset.bloque)));
      window.scrollTo(0, arriba);
    }),
  );
  raiz.querySelector('[data-rosca="votar"]')?.addEventListener('click', () => acciones.alTerminar(votarRosca(carrera)));
  raiz.querySelector('[data-rosca="saltear"]')?.addEventListener('click', () => acciones.alTerminar(saltearRosca(carrera)));
}
