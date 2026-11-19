import { EDAD_CANDIDATO, ETAPAS_FORMACION } from '../datos/formacion';
import { elegirFormacion } from '../motor/formacion';
import type { Carrera } from '../motor/tipos';
import { brujula, escapar } from '../ui';

/** Los años de militancia: una decisión por etapa, hasta los 35. */
export function panelFormacion(carrera: Carrera): string {
  const paso = carrera.formacion!.paso;
  const etapa = ETAPAS_FORMACION[paso];
  const hasta = carrera.edad + etapa.anios;
  return `
    <section class="panel eleccion formacion">
      <p class="sobretitulo">Tus años de militancia · ${paso + 1} de ${ETAPAS_FORMACION.length} · de ${carrera.edad} a ${hasta} años</p>
      <h3>${escapar(etapa.titulo)}</h3>
      <p>${escapar(etapa.texto)}</p>
      <div class="opciones-formacion">
        ${etapa.opciones
          .map(
            (o, i) => `
          <button class="opcion" data-formacion="${i}">
            <strong>${escapar(o.texto)}</strong>
          </button>`,
          )
          .join('')}
      </div>
      <div class="formacion-ideas">${brujula(carrera.ideologia)}</div>
      <p class="ayuda">Hasta los ${EDAD_CANDIDATO} nadie te vota: estos años forman lo que pensás.</p>
    </section>`;
}

export function conectarFormacion(raiz: HTMLElement, carrera: Carrera, seguir: (c: Carrera) => void) {
  raiz.querySelectorAll<HTMLButtonElement>('[data-formacion]').forEach((b) =>
    b.addEventListener('click', () => {
      window.scrollTo(0, 0);
      seguir(elegirFormacion(carrera, Number(b.dataset.formacion)));
    }),
  );
}
