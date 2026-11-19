import type { Carrera, CrisisId, Pais } from '../motor/tipos';
import { presencia } from './valor';
import type { DefEvento, Resultado } from './eventos';

/**
 * Las crisis del presidente: empiezan cuando el país se rompe, pesan todos los
 * años y solo terminan si el país se recupera o si una decisión de salida sale bien.
 */

export interface DefCrisis {
  id: CrisisId;
  nombre: string;
  icono: string;
  /** Cuándo empieza, mirando el país y la calle al cerrar el año. */
  empieza: (c: Carrera) => boolean;
  /** Cuándo se termina sola, porque el país se recuperó. */
  terminaSola: (c: Carrera) => boolean;
  /** Lo que cuesta cada año que sigue abierta. */
  castigo: { pais?: Partial<Pais>; imagen?: number; poder?: number; malestar?: number };
  /** El evento que te llega cada año para intentar salir. */
  salida: string;
}

const p = (c: Carrera) => c.pais ?? { inflacion: 0, actividad: 50, reservas: 50 };

export const CRISIS: DefCrisis[] = [
  {
    id: 'corrida',
    nombre: 'Corrida cambiaria',
    icono: '💸',
    empieza: (c) => p(c).reservas < 20,
    terminaSola: (c) => p(c).reservas >= 30,
    castigo: { pais: { inflacion: 20 }, imagen: -2 },
    salida: 'crisis-corrida',
  },
  {
    id: 'default',
    nombre: 'Default',
    icono: '📉',
    empieza: (c) => p(c).reservas < 8,
    terminaSola: (c) => p(c).reservas >= 25,
    castigo: { pais: { actividad: -8 }, poder: -4 },
    salida: 'crisis-default',
  },
  {
    id: 'hiper',
    nombre: 'Hiperinflación',
    icono: '🔥',
    empieza: (c) => p(c).inflacion > 200,
    terminaSola: (c) => p(c).inflacion < 80,
    castigo: { imagen: -5, malestar: 15 },
    salida: 'crisis-hiper',
  },
  {
    id: 'estallido',
    nombre: 'Estallido social',
    icono: '✊',
    empieza: (c) => (c.malestar ?? 0) >= 80,
    terminaSola: (c) => (c.malestar ?? 0) < 40,
    castigo: { poder: -5, pais: { actividad: -3 } },
    salida: 'crisis-estallido',
  },
];

export const buscarCrisis = (id: CrisisId) => CRISIS.find((c) => c.id === id)!;

const tiene = (id: CrisisId) => (c: Carrera) => c.cargo === 'presidente' && !!c.crisis?.some((x) => x.id === id);
const porAtributo = (a: 'gestion' | 'rosca' | 'fama', base: number) => (c: Carrera) =>
  Math.min(0.85, Math.max(0.15, base + ((a === 'fama' ? presencia(c) : c.atributos[a]) - 50) / 200));
const sale = (id: CrisisId, r: Omit<Resultado, 'cortaCrisis'>): Resultado => ({ ...r, cortaCrisis: id });

export const EVENTOS_CRISIS: DefEvento[] = [
  {
    id: 'crisis-corrida',
    especial: 'crisis',
    quien: { rol: 'Presidente del Banco Central' },
    titulo: 'La corrida no para',
    texto:
      'Las reservas se nos van por la ventanilla todos los días. Si no hacemos algo de fondo, el año que viene no hay con qué pagar las importaciones.',
    condicion: tiene('corrida'),
    opciones: [
      {
        texto: 'Devaluar de un saque',
        pista: 'Si el mercado te cree, se termina. Los precios vuelan igual.',
        postura: { economia: 1 },
        resultado: {
          chance: porAtributo('gestion', 0.6),
          exito: sale('corrida', {
            texto: 'Devaluaste y el mercado se calmó. Se terminó la corrida.',
            pais: { reservas: 15, inflacion: 15 },
            efectos: { imagen: -2 },
          }),
          fracaso: {
            texto: 'Devaluaste y nadie te creyó: más inflación, la misma corrida.',
            pais: { inflacion: 20 },
            efectos: { imagen: -3, poder: -1 },
          },
        },
      },
      {
        texto: 'Cepo total',
        pista: 'Frenás la sangría sin resolver nada. La economía se traba.',
        postura: { economia: -1 },
        resultado: { texto: 'Cerraste el cepo del todo.', pais: { reservas: 12, actividad: -4 }, efectos: { poder: 1 } },
      },
      {
        texto: 'Salvataje del Fondo',
        pista: 'Los dólares llegan. Las condiciones también.',
        etiquetas: ['fondo'],
        resultado: {
          chance: () => 0.55,
          exito: sale('corrida', {
            texto: 'El Fondo te dio el salvataje. Se terminó la corrida.',
            pais: { reservas: 20, inflacion: -5 },
            efectos: { imagen: -3 },
            malestar: 15,
          }),
          fracaso: { texto: 'El Fondo te dio la mitad de lo que pediste.', pais: { reservas: 5 }, efectos: { imagen: -3 }, malestar: 10 },
        },
      },
    ],
  },
  {
    id: 'crisis-default',
    especial: 'crisis',
    quien: { rol: 'Ministro de Economía' },
    titulo: 'El país en default',
    texto:
      'No le pagamos a nadie y nadie nos presta. Las empresas no pueden importar ni un tornillo. Hay que elegir cómo salir, y ninguna salida es gratis.',
    condicion: tiene('default'),
    opciones: [
      {
        texto: 'Renegociar con los acreedores',
        pista: 'Si te sale, volvés al mundo. Depende de tu muñeca.',
        resultado: {
          chance: porAtributo('rosca', 0.4),
          exito: sale('default', { texto: 'Cerraste la renegociación. Salís del default.', pais: { reservas: 10, actividad: 3 } }),
          fracaso: { texto: 'Los acreedores no aceptaron. Seguís en default.', pais: { actividad: -4 }, efectos: { poder: -3 } },
        },
      },
      {
        texto: 'Vivir con lo nuestro',
        pista: 'La gente te aplaude. El default sigue.',
        postura: { economia: -1 },
        resultado: {
          texto: 'Dijiste que no se paga con el hambre del pueblo.',
          pais: { actividad: -6 },
          efectos: { imagen: 3 },
          malestar: -10,
        },
      },
      {
        texto: 'Ajuste para pagar',
        pista: 'Si alcanza, salís. La calle lo sufre.',
        postura: { economia: 1 },
        etiquetas: ['ajuste'],
        resultado: {
          chance: () => 0.7,
          exito: sale('default', {
            texto: 'El ajuste alcanzó para pagar. Salís del default.',
            pais: { reservas: 12 },
            efectos: { imagen: -3 },
            malestar: 15,
          }),
          fracaso: { texto: 'Ajustaste y no alcanzó.', efectos: { imagen: -3 }, malestar: 15 },
        },
      },
    ],
  },
  {
    id: 'crisis-hiper',
    especial: 'crisis',
    quien: { rol: 'Ministro de Economía' },
    titulo: 'Hiperinflación',
    texto: 'Los precios cambian a la mañana y a la tarde. Los supermercados remarcan con la gente adentro. Esto no aguanta otro año.',
    condicion: tiene('hiper'),
    opciones: [
      {
        texto: 'Plan de estabilización',
        pista: 'Moneda nueva y cuentas en orden. Si sale bien, sos un héroe.',
        resultado: {
          chance: porAtributo('gestion', 0.35),
          exito: sale('hiper', {
            texto: 'El plan funcionó: la inflación se desplomó.',
            pais: { inflacion: -120, actividad: -5 },
            efectos: { imagen: 2, poder: 2 },
          }),
          fracaso: { texto: 'El plan se cayó a los tres meses.', pais: { inflacion: 40 }, efectos: { imagen: -4, poder: -2 } },
        },
      },
      {
        texto: 'Congelar precios y salarios',
        pista: 'Un respiro. Nadie cree que dure.',
        postura: { economia: -1 },
        resultado: { texto: 'Congelaste precios y salarios.', pais: { inflacion: -40, actividad: -5 }, malestar: -5 },
      },
      {
        texto: 'Dolarizar',
        pista: 'Matás la inflación de raíz, si te alcanzan los dólares. Perdés la moneda.',
        postura: { economia: 1 },
        resultado: {
          chance: () => 0.5,
          exito: sale('hiper', {
            texto: 'Dolarizaste. La inflación se terminó.',
            pais: { inflacion: -130, reservas: -15, actividad: -6 },
            efectos: { poder: -3 },
          }),
          fracaso: { texto: 'No alcanzaron los dólares para dolarizar.', pais: { reservas: -20, inflacion: 20 }, efectos: { poder: -2 } },
        },
      },
    ],
  },
  {
    id: 'crisis-estallido',
    especial: 'crisis',
    quien: { rol: 'Ministro del Interior' },
    titulo: 'Estallido social',
    texto: 'Hay cortes en todo el país, saqueos en el conurbano y una marcha a la Plaza que no se va. Lo que hagas ahora te va a definir.',
    condicion: tiene('estallido'),
    opciones: [
      {
        texto: 'Abrir el diálogo y repartir ayuda',
        pista: 'Si te creen, se calma. Cuesta plata del Estado.',
        postura: { economia: -1 },
        resultado: {
          chance: porAtributo('fama', 0.4),
          exito: sale('estallido', {
            texto: 'El diálogo prendió y la calle se calmó.',
            pais: { reservas: -8 },
            efectos: { imagen: 2 },
            malestar: -30,
          }),
          fracaso: { texto: 'Repartiste ayuda y la bronca siguió.', pais: { reservas: -10 }, efectos: { poder: -3 }, malestar: -5 },
        },
      },
      {
        texto: 'Reprimir',
        pista: 'La calle se vacía. Las imágenes dan la vuelta al mundo.',
        postura: { social: -1 },
        resultado: { texto: 'Mandaste a despejar las calles.', efectos: { imagen: -3, poder: 3, causas: 3 }, malestar: -30 },
      },
      {
        texto: 'Cambiar todo el gabinete',
        pista: 'Caras nuevas. A veces alcanza, a veces es tarde.',
        resultado: {
          chance: () => 0.5,
          exito: sale('estallido', { texto: 'El gabinete nuevo descomprimió la crisis.', efectos: { poder: -3 }, malestar: -30 }),
          fracaso: { texto: 'Cambiaste el gabinete y nadie se enteró.', efectos: { poder: -4 }, malestar: -5 },
        },
      },
    ],
  },
];
