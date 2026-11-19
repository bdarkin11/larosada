import type { Carrera, Delfin } from '../motor/tipos';
import type { DefEvento } from './eventos';

/**
 * Los eventos de tus delfines. Cada uno dice de qué delfín puede tratarse
 * (`DELFIN_DEL_EVENTO`); el que habla es ese delfín.
 */

export const DELFIN_DEL_EVENTO: Record<string, (d: Delfin, c: Carrera) => boolean> = {
  'delfin-candidato': (d) => d.nivel >= 25 && !d.cargo && d.lealtad >= 40,
  'delfin-critica': (d, c) => d.lealtad < 45 && c.medidores.imagen < 45,
};

const hayDelfin = (id: string) => (c: Carrera) => (c.delfines ?? []).some((d) => DELFIN_DEL_EVENTO[id](d, c));
/** Que haga la suya: le va mejor cuanto más creció. */
const porSuNivel = (c: Carrera) => Math.min(0.8, 0.3 + Math.max(0, ...(c.delfines ?? []).map((d) => d.nivel)) / 200);

export const DELFINES: DefEvento[] = [
  {
    id: 'delfin-candidato',
    quien: { rol: 'Tu delfín' },
    titulo: 'Tu delfín quiere ser candidato',
    texto: '«Me siento preparado. Quiero encabezar la lista de concejales en mi distrito. Con tu apoyo, gano.»',
    condicion: hayDelfin('delfin-candidato'),
    opciones: [
      {
        texto: 'Bancar su candidatura con todo',
        resultado: {
          texto: 'Le pusiste tu estructura y tu plata. Ganó la banca y no se olvida de quién le dio el lugar.',
          plata: -0.1,
          efectos: { poder: -2 },
          delfin: { nivel: 15, lealtad: 15, cargo: true },
        },
      },
      {
        texto: 'Que haga la suya',
        resultado: {
          chance: porSuNivel,
          exito: {
            texto: 'Hizo su campaña sin vos y ganó. Ahora tiene banca propia, y lo sabe.',
            delfin: { nivel: 10, cargo: true, lealtad: -5 },
          },
          fracaso: {
            texto: 'Hizo la suya y perdió. Volvió con la derrota a cuestas y algo de resentimiento.',
            delfin: { nivel: -5, lealtad: -10 },
          },
        },
      },
      {
        texto: 'Decirle que todavía no',
        resultado: {
          texto: 'Le pediste paciencia y te guardaste el lugar. Se fue sin decir nada, y no le gustó.',
          efectos: { poder: 2 },
          delfin: { lealtad: -20 },
        },
      },
    ],
  },
  {
    id: 'delfin-critica',
    quien: { rol: 'Tu delfín' },
    titulo: 'Tu delfín te critica en público',
    texto:
      'En la radio dijo que «hay que renovar» y que «algunos ya cumplieron su ciclo». En el partido todos entendieron a quién se refería.',
    condicion: hayDelfin('delfin-critica'),
    opciones: [
      {
        texto: 'Llamar y arreglar',
        resultado: {
          texto: 'Un café largo y algunas concesiones. Las aguas se calmaron, por ahora.',
          efectos: { poder: -2 },
          delfin: { lealtad: 15 },
        },
      },
      {
        texto: 'Bajarle el precio en público',
        resultado: {
          texto: 'Le contestaste fuerte. Quedó claro quién manda, pero la interna se vio.',
          efectos: { poder: 2, imagen: -1 },
          delfin: { lealtad: -15, nivel: -5 },
        },
      },
      {
        texto: 'Hacerte el distraído',
        pasiva: true,
        resultado: { texto: 'No dijiste nada. Algunos lo leyeron como debilidad.', efectos: { imagen: -1, poder: -1 } },
      },
    ],
  },
];
