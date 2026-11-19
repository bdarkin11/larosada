import type { Carrera } from '../motor/tipos';
import { presencia } from './valor';
import type { DefEvento } from './eventos';

/**
 * Decisiones de gestión de intendentes y gobernadores: mueven Cuentas y
 * Gestión de tu distrito. Salen en lugar de algunos eventos comunes.
 */

const local = (c: Carrera) => c.cargo === 'intendente' || c.cargo === 'gobernador';
/** Pedirle algo a la Nación: si sos aliado, casi seguro; si no, difícil. */
const conLaNacion = (c: Carrera) => (c.oficialismo === c.partido ? 0.75 : 0.3);
const porAtributo = (a: 'rosca' | 'gestion' | 'fama', base: number) => (c: Carrera) =>
  Math.min(0.85, Math.max(0.15, base + ((a === 'fama' ? presencia(c) : c.atributos[a]) - 50) / 200));

export const GESTION: DefEvento[] = [
  {
    id: 'gestion-basura',
    quien: { rol: 'Secretario de Servicios Públicos' },
    titulo: 'La basura se acumula',
    texto: 'El contrato de recolección se vence y las bolsas se juntan en las esquinas. Los vecinos ya mandan fotos a la radio.',
    condicion: local,
    opciones: [
      {
        texto: 'Licitar a una empresa grande',
        pista: 'Funciona bien. Sale caro.',
        postura: { economia: 1 },
        resultado: {
          texto: 'Licitaste la recolección a una empresa grande.',
          distrito: { cuentas: -8, gestion: 8 },
          efectos: { imagen: 1 },
        },
      },
      {
        texto: 'Cooperativas de recicladores',
        pista: 'Más barato y das trabajo. Al principio, un desorden.',
        postura: { economia: -1 },
        resultado: { texto: 'Les diste la recolección a las cooperativas.', distrito: { cuentas: -6, gestion: 4 }, malestar: -5 },
      },
      {
        texto: 'Prorrogar el contrato viejo',
        pista: 'No gastás. Las bolsas siguen ahí.',
        pasiva: true,
        resultado: { texto: 'Prorrogaste el contrato viejo.', distrito: { gestion: -4 }, efectos: { imagen: -1 } },
      },
    ],
  },
  {
    id: 'gestion-paro-estatales',
    quien: { rol: 'Delegado de los estatales' },
    titulo: 'Los estatales quieren aumento',
    texto: 'La inflación se comió los sueldos. Si no hay aumento este mes, paramos todo: hospitales, escuelas y recolección.',
    condicion: local,
    opciones: [
      {
        texto: 'Darles el aumento',
        pista: 'Paz social. La caja sufre.',
        resultado: { texto: 'Les diste el aumento a los estatales.', distrito: { cuentas: -10 }, efectos: { poder: 1 }, malestar: -10 },
      },
      {
        texto: 'Darles la mitad',
        pista: 'Nadie queda contento, nadie queda furioso.',
        resultado: { texto: 'Diste la mitad del aumento.', distrito: { cuentas: -5 }, malestar: 5 },
      },
      {
        texto: 'No hay plata',
        pista: 'Cuidás las cuentas. El paro es seguro.',
        postura: { economia: 1 },
        etiquetas: ['ajuste'],
        resultado: { texto: 'Les dijiste que no hay plata.', distrito: { cuentas: 4, gestion: -2 }, efectos: { imagen: -1 }, malestar: 12 },
      },
    ],
  },
  {
    id: 'gestion-obra',
    quien: { rol: 'Secretaria de Obras' },
    titulo: 'La obra del siglo',
    texto: 'Hay un proyecto para el hospital nuevo que se promete hace veinte años. Si lo hacemos, es la foto de la gestión. Plata no hay.',
    condicion: local,
    opciones: [
      {
        texto: 'Endeudarte y hacerla',
        pista: 'La foto es tuya. La deuda también.',
        resultado: { texto: 'Te endeudaste para hacer el hospital.', distrito: { cuentas: -12, gestion: 10 }, efectos: { fama: 2 } },
      },
      {
        texto: 'Pedirle la plata a la Nación',
        pista: 'Si sos aliado, casi seguro. Si no, te van a dar vueltas.',
        resultado: {
          chance: conLaNacion,
          exito: { texto: 'La Nación puso la plata para el hospital.', distrito: { gestion: 8 }, efectos: { poder: -1 } },
          fracaso: { texto: 'La Nación te dio vueltas y el hospital quedó en el cajón.', efectos: { imagen: -1, poder: -1 } },
        },
      },
      {
        texto: 'Hacerla de a poco',
        pista: 'Sin deuda. La cinta la corta otro.',
        resultado: { texto: 'Arrancaste el hospital de a poco.', distrito: { cuentas: -4, gestion: 4 } },
      },
    ],
  },
  {
    id: 'gestion-tasas',
    quien: { rol: 'Secretario de Hacienda' },
    titulo: 'Las tasas',
    texto: 'Las tasas no se actualizan hace años y la caja no da más. Podemos subirlas, cobrarle más a los grandes o seguir así.',
    condicion: local,
    opciones: [
      {
        texto: 'Subirlas para todos',
        pista: 'Entra plata. Los vecinos no te lo perdonan.',
        etiquetas: ['impuestos'],
        resultado: { texto: 'Subiste las tasas.', distrito: { cuentas: 12 }, efectos: { imagen: -3 } },
      },
      {
        texto: 'Cobrarles más a los grandes',
        pista: 'Entra algo. Los grandes contribuyentes tienen amigos.',
        postura: { economia: -1 },
        etiquetas: ['impuestos'],
        resultado: {
          texto: 'Les subiste las tasas a los grandes contribuyentes.',
          distrito: { cuentas: 7 },
          efectos: { poder: -2, imagen: 1 },
        },
      },
      {
        texto: 'Dejarlas como están',
        pista: 'Los vecinos contentos. La caja, no.',
        pasiva: true,
        resultado: { texto: 'Dejaste las tasas como estaban.', distrito: { cuentas: -3 }, efectos: { imagen: 1 } },
      },
    ],
  },
  {
    id: 'gestion-inseguridad',
    quien: { rol: 'Vecina de la sociedad de fomento' },
    titulo: 'Ola de robos',
    texto: 'En el barrio ya nadie sale de noche. Le robaron a la panadería tres veces este mes. Queremos saber qué va a hacer.',
    condicion: local,
    opciones: [
      {
        texto: 'Más patrulleros y cámaras',
        pista: 'Se ve. Cuesta.',
        postura: { social: -1 },
        resultado: { texto: 'Pusiste más patrulleros y cámaras.', distrito: { cuentas: -8, gestion: 4 }, efectos: { imagen: 2 } },
      },
      {
        texto: 'Programas en los barrios',
        pista: 'Va a la raíz. Tarda en notarse.',
        postura: { social: 1 },
        resultado: { texto: 'Lanzaste programas de prevención en los barrios.', distrito: { cuentas: -5, gestion: 3 }, malestar: -5 },
      },
      {
        texto: 'Pedir fuerzas federales',
        pista: 'Gratis, si la Nación te atiende.',
        resultado: {
          chance: conLaNacion,
          exito: { texto: 'Llegaron las fuerzas federales.', distrito: { gestion: 5 }, efectos: { imagen: 1 } },
          fracaso: { texto: 'La Nación no mandó a nadie. Quedaste pidiendo.', efectos: { imagen: -2 } },
        },
      },
    ],
  },
  {
    id: 'gestion-colectivos',
    quien: { rol: 'Empresario del transporte' },
    titulo: 'Paran los colectivos',
    texto: 'Con este boleto no cubrimos ni el gasoil. O nos ayuda, o mañana no sale ningún colectivo.',
    condicion: local,
    opciones: [
      {
        texto: 'Subsidiarlos',
        pista: 'Los colectivos andan. La caja paga.',
        postura: { economia: -1 },
        resultado: { texto: 'Subsidiaste a los colectivos.', distrito: { cuentas: -8 }, malestar: -8 },
      },
      {
        texto: 'Aumentar el boleto',
        pista: 'Las cuentas cierran. Los que viajan, no.',
        postura: { economia: 1 },
        resultado: { texto: 'Aumentaste el boleto.', distrito: { cuentas: 4 }, efectos: { imagen: -3 }, malestar: 8 },
      },
      {
        texto: 'Sentarte a negociar',
        pista: 'Si tenés muñeca, nadie paga de más.',
        resultado: {
          chance: porAtributo('rosca', 0.5),
          exito: { texto: 'Negociaste y los colectivos siguieron andando.', efectos: { poder: 1 }, malestar: -5 },
          fracaso: { texto: 'La negociación fracasó: tres días sin colectivos.', efectos: { imagen: -1 }, malestar: 8 },
        },
      },
    ],
  },
  {
    id: 'gestion-fondos-nacion',
    quien: { rol: 'Ministro del Interior de la Nación' },
    titulo: 'Los fondos de la Nación',
    texto:
      'Los fondos para obras están, pero hay una cola larga de intendentes y gobernadores. Usted sabe cómo se consigue un lugar adelante.',
    condicion: (c) => local(c) && c.oficialismo !== c.partido,
    opciones: [
      {
        texto: 'Pelearte en público',
        pista: 'Quedás como el que se planta. Los fondos no llegan.',
        resultado: {
          texto: 'Denunciaste en los medios la discriminación de la Nación.',
          efectos: { fama: 4, poder: -2 },
          distrito: { cuentas: -3 },
        },
      },
      {
        texto: 'Acordar en silencio',
        pista: 'Llegan los fondos. Tu gente no entiende de qué lado estás.',
        etiquetas: ['rosca'],
        resultado: { texto: 'Acordaste en silencio con la Nación.', distrito: { cuentas: 8 }, efectos: { imagen: -2 } },
      },
      {
        texto: 'Ir a la Corte',
        pista: 'Si ganás, te deben todo. Tarda.',
        resultado: {
          chance: () => 0.4,
          exito: { texto: 'La Corte te dio la razón: la Nación tiene que pagar.', distrito: { cuentas: 12 }, efectos: { fama: 1 } },
          fracaso: { texto: 'La Corte cajoneó tu reclamo.', efectos: { poder: -1 } },
        },
      },
    ],
  },
  {
    id: 'gestion-credito',
    quien: { rol: 'Gerente de un banco internacional' },
    titulo: 'Un crédito para obras',
    texto: 'Le ofrecemos un crédito a diez años, en dólares, para obras. Las condiciones son buenas… mientras no se devalúe.',
    condicion: local,
    opciones: [
      {
        texto: 'Tomarlo entero',
        pista: 'Plata fresca hoy. La cuota la paga el que viene.',
        resultado: { texto: 'Tomaste el crédito entero.', distrito: { cuentas: 12, gestion: 3 }, efectos: { imagen: -1, causas: 2 } },
      },
      {
        texto: 'Solo para una obra',
        pista: 'Menos deuda, una obra que se ve.',
        resultado: { texto: 'Tomaste una parte para una obra puntual.', distrito: { cuentas: 2, gestion: 5 }, efectos: { poder: -1 } },
      },
      {
        texto: 'Rechazarlo',
        pista: 'Sin deuda. Sin obras.',
        pasiva: true,
        resultado: { texto: 'Rechazaste el crédito.', distrito: { gestion: -2 }, efectos: { imagen: 1 } },
      },
    ],
  },
];
