import { CARGOS } from './cargos';
import type { Etiqueta, Postura } from './promesas';
import { EVENTOS_CAIDA } from './caida';
import { GESTION } from './gestion';
import { EVENTOS_CRISIS } from './crisis';
import { DELFINES } from './delfines';
import { LEYES } from './leyes';
import type { Efectos } from './tienda';
import type { Carrera, CrisisId, IndicadoresDistrito, MotivoFin, Pais } from '../motor/tipos';
import { presencia } from './valor';

/** La palabra del cartel en los eventos especiales. */
export type TipoAlerta =
  | 'oferta'
  | 'propuesta'
  | 'amenaza'
  | 'carpetazo'
  | 'pedido'
  | 'citacion'
  | 'desafuero'
  | 'estado'
  | 'huelga'
  | 'ley'
  | 'crisis'
  | 'juicio'
  | 'renuncia';

export const TEXTO_ALERTA: Record<TipoAlerta, string> = {
  oferta: '¡OFERTA!',
  propuesta: '¡PROPUESTA!',
  amenaza: '¡AMENAZA!',
  carpetazo: '¡CARPETAZO!',
  pedido: '¡PEDIDO!',
  citacion: '¡CITACIÓN!',
  desafuero: '¡DESAFUERO!',
  estado: '¡DECISIÓN DE ESTADO!',
  huelga: '¡A LA CALLE!',
  ley: '¡PROYECTO DE LEY!',
  crisis: '¡CRISIS!',
  juicio: '¡JUICIO POLÍTICO!',
  renuncia: '¡QUE SE VAYA!',
};

/**
 * Lo que pasa al elegir. Reglas para escribir (ver docs/propuesta-balance.md):
 * - toda opción gana algo y cede algo;
 * - las opciones de un evento valen parecido, pero se pagan con monedas distintas;
 * - la plata nunca es fija: es un porcentaje de tu caja.
 * La prueba de equilibrio (motor/balance.test.ts) revisa todo esto.
 */
export interface Resultado {
  /** Lo que pasó, para el historial y la pantalla de resultado. */
  texto: string;
  /** Atributos y medidores, sin la caja. Imagen, Fama y Poder rinden menos cuanto más tenés. */
  efectos?: Efectos;
  /** Plata, como fracción de tu caja: −0,08 es un costo del 8 % (con piso en sueldos), +0,2 una ganancia del 20 % (con tope). */
  plata?: number;
  /** Plata negra, igual: positiva entra (con tope), negativa sale de la caja negra. */
  negra?: number;
  /** Es una coima: deja rastro, y con estilo transa rinde más. */
  coima?: boolean;
  construccion?: number;
  /** Queda en la libreta, con quien habla en el evento. */
  favor?: { debes: boolean; motivo: string };
  /** Salda el favor que le debías a quien te lo vino a cobrar. */
  saldarFavor?: boolean;
  /** Qué pasa con la causa en tu contra. */
  proceso?: 'retroceder' | 'avanzar' | 'archivar' | 'detencion';
  /** Rechazaste una tentación: si tenés las manos limpias, las conservás. */
  limpias?: boolean;
  /** Lo que mueve en el país, si sos presidente. */
  pais?: Partial<Pais>;
  /** Bronca en la calle: positivo la sube, negativo la calma. */
  malestar?: number;
  /** Sale esta ley (id): queda en tu historial de leyes aprobadas. */
  ley?: string;
  /** Si sale, se termina esta crisis. */
  cortaCrisis?: CrisisId;
  /** Se termina la carrera, con este final. */
  fin?: MotivoFin;
  /** Lo que mueve en tu intendencia o tu provincia. */
  distrito?: Partial<IndicadoresDistrito>;
  /** Lo que le pasa al delfín del evento: lealtad, crecimiento y si gana una banca. */
  delfin?: { lealtad?: number; nivel?: number; cargo?: boolean };
}

export interface Azaroso {
  chance: (c: Carrera) => number;
  exito: Resultado;
  fracaso: Resultado;
}

export interface Opcion {
  texto: string;
  /** Lo que se insinúa antes de elegir, sin números. */
  pista?: string;
  requiere?: (c: Carrera) => string | null;
  resultado: Resultado | Azaroso;
  /** No meterse: arriesga poco y gana poco. Puede valer algo menos que las otras. */
  pasiva?: boolean;
  /** Hacia dónde tira la decisión. Si va contra tus ideas, tu gente no lo entiende. */
  postura?: Postura;
  /** Qué promesas de campaña puede romper. */
  etiquetas?: Etiqueta[];
  /** Abre la rosca en el Congreso: el `resultado` es lo que pasa si no la jugás. */
  rosca?: { dificultad: number };
}

export type Quien =
  /** Alguien del elenco (ver FIGURAS). */
  | { figura: string }
  /** Alguien generado por la partida, con su rol. */
  | { rol: string };

export interface DefEvento {
  id: string;
  especial?: TipoAlerta;
  quien?: Quien;
  titulo: string;
  /** Lo que dice quien habla, o lo que pasa. */
  texto: string;
  peso?: number;
  condicion?: (c: Carrera) => boolean;
  opciones: Opcion[];
}

const rango = (c: Carrera) => CARGOS[c.cargo].rango;
const tieneCargo = (c: Carrera) => c.cargo !== 'militante';
const ejecutivo = (c: Carrera) => ['intendente', 'gobernador', 'presidente'].includes(c.cargo);
const legislador = (c: Carrera) => ['concejal', 'legislador', 'diputado', 'senador'].includes(c.cargo);
const idealistaNo = (c: Carrera) => (c.estilo === 'idealista' ? 'Tu estilo idealista no te deja.' : null);
const porAtributo =
  (a: 'fama' | 'rosca' | 'gestion' | 'territorio', base = 0.2) =>
  (c: Carrera) =>
    Math.min(0.85, Math.max(0.1, base + (a === 'fama' ? presencia(c) : c.atributos[a]) / 120));

/**
 * Eventos especiales: interrumpen el año con la alerta. Las coimas y los
 * carpetazos los hacen siempre personajes generados, nunca figuras del elenco.
 */
export const ESPECIALES: DefEvento[] = [
  {
    id: 'coima-obra',
    especial: 'oferta',
    quien: { rol: 'Contratista de obra pública' },
    titulo: 'Un sobre por un pliego',
    texto:
      'Mire, no le voy a hacer perder el tiempo. Si la licitación del acueducto sale para nosotros, hay un sobre para usted. Nadie se tiene que enterar.',
    condicion: (c) => rango(c) >= 2,
    opciones: [
      {
        texto: 'Aceptar el sobre',
        pista: 'Mucha plata en negro y un contratista amigo. Deja rastro.',
        requiere: idealistaNo,
        resultado: { texto: 'Aceptaste el sobre del contratista.', negra: 0.35, coima: true, efectos: { causas: 6, poder: 2 } },
      },
      {
        texto: 'Rechazarlo',
        pista: 'Te quedás con las manos limpias y un contratista ofendido.',
        resultado: { texto: 'Rechazaste la coima del contratista.', limpias: true, efectos: { poder: -1, imagen: 1 } },
      },
      {
        texto: 'Denunciarlo',
        pista: 'Puede ser tu gran momento… si lo podés probar. Te hacés enemigos.',
        resultado: {
          chance: porAtributo('rosca', 0.3),
          exito: { texto: 'Denunciaste al contratista y la causa avanzó. Te aplauden.', efectos: { imagen: 4, fama: 3, poder: -3 } },
          fracaso: { texto: 'Lo denunciaste, pero no pudiste probar nada.', efectos: { imagen: -3, poder: -4 } },
        },
      },
    ],
  },
  {
    id: 'financiar-por-fuera',
    especial: 'oferta',
    quien: { rol: 'Empresario de la construcción' },
    titulo: 'Plata para la campaña',
    texto: 'Las campañas son caras, y usted tiene futuro. Yo le pongo la plata. Por fuera, sin recibo. Después, cuando gane, hablamos.',
    condicion: (c) => c.medidores.fama >= 15,
    opciones: [
      {
        texto: 'Aceptar, sin recibo',
        pista: 'Mucha plata en negro, una deuda y un rastro.',
        requiere: idealistaNo,
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Aceptaste financiamiento en negro.',
          negra: 0.35,
          coima: true,
          efectos: { causas: 3 },
          favor: { debes: true, motivo: 'Te financió la campaña por fuera' },
        },
      },
      {
        texto: 'Aceptar, pero declarado',
        pista: 'Menos plata, todo en regla. Igual le vas a deber.',
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Aceptaste un aporte de campaña declarado.',
          plata: 0.1,
          favor: { debes: true, motivo: 'Aportó a tu campaña' },
        },
      },
      {
        texto: 'No, gracias',
        pista: 'Seguís solo, sin deberle nada a nadie.',
        pasiva: true,
        resultado: { texto: 'Rechazaste el aporte del empresario.', limpias: true, efectos: { poder: -1 } },
      },
    ],
  },
  {
    id: 'marcha-movimientos',
    especial: 'propuesta',
    quien: { figura: 'grabovsky' },
    titulo: 'La marcha de mañana',
    texto: 'Mañana marchamos por trabajo y por comida. Si venís con nosotros, los barrios no se van a olvidar. Y en las urnas, tampoco.',
    condicion: (c) => c.medidores.fama >= 10,
    opciones: [
      {
        texto: 'Ir a la marcha',
        pista: 'Los barrios te abrazan. Una jornada larga, y otros fruncen la nariz.',
        postura: { economia: -0.6, social: 0.5 },
        resultado: {
          texto: 'Marchaste con los movimientos sociales.',
          efectos: { imagen: -2 },
          construccion: 1,
          favor: { debes: false, motivo: 'Fuiste a su marcha' },
        },
      },
      {
        texto: 'Mandar un mensaje de apoyo',
        pista: 'Quedás bien sin mojarte. Ellos esperaban más.',
        resultado: { texto: 'Mandaste un mensaje de apoyo a la marcha.', efectos: { fama: 2, poder: -1 } },
      },
      {
        texto: 'No ir',
        pista: 'Te lo van a anotar. Otros te lo agradecen.',
        pasiva: true,
        postura: { economia: 0.4 },
        resultado: { texto: 'No fuiste a la marcha de los movimientos.', efectos: { poder: -1, imagen: 1, territorio: 1 } },
      },
    ],
  },
  {
    id: 'paro-camioneros',
    especial: 'amenaza',
    quien: { figura: 'hugo-medrano' },
    titulo: 'O firmás, o paramos',
    texto: 'Te lo digo una sola vez. Si no firmás el aumento que pedimos, mañana no se mueve un camión en todo el distrito. Vos sabrás.',
    condicion: (c) => ejecutivo(c) || rango(c) >= 3,
    peso: 2,
    opciones: [
      {
        texto: 'Firmar el aumento',
        pista: 'Paz con el gremio, y te deben una. Pero cediste.',
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Cediste ante los camioneros y firmaste el aumento.',
          efectos: { imagen: -2, poder: -2 },
          favor: { debes: false, motivo: 'Les firmaste el aumento' },
        },
      },
      {
        texto: 'Aguantar el paro',
        pista: 'Si aguantás, salís fortalecido. Si no, el paro te pasa por encima.',
        resultado: {
          chance: porAtributo('territorio', 0.3),
          exito: {
            texto: 'Aguantaste el paro y el gremio levantó la medida. Saliste fortalecido.',
            efectos: { imagen: 4, poder: 4, territorio: -1 },
          },
          fracaso: { texto: 'El paro paralizó todo y la gente te culpó a vos.', efectos: { imagen: -5, poder: -4, territorio: -1 } },
        },
      },
      {
        texto: 'Sentarte a negociar',
        pista: 'Depende de tu rosca. Desgasta igual.',
        resultado: {
          chance: porAtributo('rosca', 0.15),
          exito: {
            texto: 'Negociaste con Medrano un aumento en cuotas. Todos contentos.',
            efectos: { poder: 2, rosca: 1, territorio: -1 },
          },
          fracaso: { texto: 'La negociación se rompió y hubo paro igual.', efectos: { imagen: -3, poder: -2, territorio: -1 } },
        },
      },
    ],
  },
  {
    id: 'carpeta-operador',
    especial: 'carpetazo',
    quien: { rol: 'Operador de prensa' },
    titulo: 'Una carpeta con tu nombre',
    texto: 'Tengo una carpeta tuya, con fotos y papeles. Puede salir en la tapa del domingo… o puede no salir nunca. Depende de vos.',
    condicion: (c) => c.medidores.causas >= 15 && c.medidores.fama >= 15,
    peso: 2,
    opciones: [
      {
        texto: 'Pagar para que no salga',
        pista: 'Silencio por ahora. Ese tipo va a volver.',
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Pagaste para que la carpeta no saliera.',
          plata: -0.06,
          efectos: { causas: -2 },
          favor: { debes: true, motivo: 'Le pagaste para que no publicara' },
        },
      },
      {
        texto: 'Ignorarlo',
        pista: 'Capaz es un bluff. Capaz no. Cuantas más causas tengas, peor.',
        resultado: {
          chance: (c) => Math.max(0.15, 0.85 - c.medidores.causas / 80),
          exito: { texto: 'Ignoraste al operador y la carpeta nunca salió.', efectos: { imagen: 1, poder: 1 } },
          fracaso: { texto: 'La carpeta salió en la tapa del domingo.', efectos: { imagen: -6, causas: 4, poder: -1 } },
        },
      },
      {
        texto: 'Adelantarte y contarlo vos',
        pista: 'Duele, pero le sacás el arma. Tu espacio no quería que hablaras.',
        resultado: { texto: 'Contaste vos mismo lo que había en la carpeta.', efectos: { imagen: -4, fama: 2, causas: -3, poder: -2 } },
      },
    ],
  },
  {
    id: 'pauta-multimedio',
    especial: 'propuesta',
    quien: { rol: 'Gerente comercial del multimedio' },
    titulo: 'La tapa del domingo',
    texto: 'Con un poco de pauta, la tapa del domingo es suya. Sin pauta… bueno, el diario es libre de publicar lo que quiera.',
    condicion: (c) => c.medidores.fama >= 20,
    opciones: [
      {
        texto: 'Pagar la pauta',
        pista: 'Buena prensa por un tiempo. No es barato.',
        resultado: { texto: 'Pagaste pauta en el multimedio.', plata: -0.1, efectos: { fama: 4, imagen: 1 } },
      },
      {
        texto: 'Negarte',
        pista: 'Te quedás con tu plata y con un enemigo con imprenta. Pero no te vendés.',
        pasiva: true,
        resultado: { texto: 'Te negaste a pagar pauta.', efectos: { poder: -2, imagen: 2 } },
      },
      {
        texto: 'Proponer una entrevista sin pauta',
        pista: 'Si caés bien, ganás igual.',
        resultado: {
          chance: porAtributo('fama', 0.1),
          exito: { texto: 'Te hicieron una entrevista sin pauta y saliste muy bien.', efectos: { fama: 4, imagen: 1 } },
          fracaso: { texto: 'No hubo entrevista y quedaste en la lista negra.', efectos: { poder: -2, imagen: -1 } },
        },
      },
    ],
  },
  {
    id: 'presupuesto-gobernador',
    especial: 'pedido',
    quien: { figura: 'insua' },
    titulo: 'El presupuesto',
    texto: 'Usted vóteme el presupuesto con las obras para mi provincia, y yo me acuerdo de usted. Los gobernadores nos acordamos de todo.',
    condicion: (c) => ['diputado', 'senador'].includes(c.cargo),
    opciones: [
      {
        texto: 'Votarlo',
        pista: 'Un gobernador te queda debiendo. Tu gente pregunta por qué.',
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Votaste el presupuesto que pedían los gobernadores.',
          efectos: { imagen: -3, poder: 1 },
          favor: { debes: false, motivo: 'Le votaste el presupuesto' },
        },
      },
      {
        texto: 'Votar en contra',
        pista: 'Coherencia, y una liga de gobernadores en contra.',
        resultado: { texto: 'Votaste en contra del presupuesto de los gobernadores.', efectos: { imagen: 3, fama: 1, poder: -3 } },
      },
    ],
  },
  {
    id: 'ley-industrial',
    especial: 'propuesta',
    quien: { figura: 'rocchi' },
    titulo: 'Una ley de promoción',
    texto: 'Tenemos inversiones esperando. Lo que falta es una ley de promoción industrial. Usted puede empujarla.',
    condicion: (c) => ['legislador', 'diputado', 'senador', 'gobernador', 'presidente'].includes(c.cargo),
    opciones: [
      {
        texto: 'Empujar la ley',
        pista: 'Los industriales te van a deber una. Los gremios, menos contentos.',
        etiquetas: ['rosca'],
        postura: { economia: 1 },
        resultado: {
          texto: 'Empujaste la ley de promoción industrial.',
          efectos: { imagen: -2, poder: 1 },
          favor: { debes: false, motivo: 'Empujaste su ley' },
        },
      },
      {
        texto: 'Pedir que incluya empleo local',
        pista: 'Si sale, todos ganan. Si no, perdiste tiempo y peso.',
        postura: { economia: -0.4 },
        resultado: {
          chance: porAtributo('rosca', 0.1),
          exito: { texto: 'La ley salió con cupo de empleo local.', efectos: { imagen: 3, poder: 2, territorio: -1 } },
          fracaso: { texto: 'La ley se trabó en comisión.', efectos: { poder: -2, territorio: -1 } },
        },
      },
      {
        texto: 'No meterte',
        pista: 'Tranquilidad, y una puerta que se cierra.',
        pasiva: true,
        resultado: { texto: 'No te metiste con la ley industrial.', efectos: { poder: -2, territorio: 1 } },
      },
    ],
  },
  {
    id: 'parroquia',
    especial: 'pedido',
    quien: { rol: 'Obispo de la diócesis' },
    titulo: 'Los comedores de la parroquia',
    texto: 'Los comedores de la parroquia no dan abasto. Le pido que venga a ver con sus propios ojos, y que nos ayude.',
    opciones: [
      {
        texto: 'Ir y ayudar',
        pista: 'Te ven en los barrios. Algo de plata y mucho cuerpo.',
        resultado: {
          texto: 'Recorriste los comedores de la parroquia y ayudaste.',
          plata: -0.06,
          efectos: { territorio: -1, imagen: 3, poder: 1 },
        },
      },
      {
        texto: 'Mandar una donación grande',
        pista: 'No vas, pero ponés más plata. La Iglesia te lo agradece.',
        resultado: {
          texto: 'Mandaste una donación grande a los comedores de la parroquia.',
          plata: -0.12,
          efectos: { imagen: 2, poder: 3 },
        },
      },
      {
        texto: 'Mantener distancia',
        pista: 'Conservás la plata. La Iglesia toma nota.',
        pasiva: true,
        resultado: { texto: 'No respondiste el pedido del obispo.', efectos: { poder: -2, territorio: 1 } },
      },
    ],
  },
  {
    id: 'reclamo-policial',
    especial: 'amenaza',
    quien: { rol: 'Comisario general' },
    titulo: 'Los muchachos están cansados',
    texto: 'Los muchachos están cansados. Si no hay aumento, mañana nadie sale a patrullar. No es una amenaza: es un aviso.',
    condicion: (c) => ['intendente', 'gobernador', 'presidente'].includes(c.cargo),
    opciones: [
      {
        texto: 'Dar el aumento',
        pista: 'Calma en los cuarteles. Sale de tu presupuesto, y otros también van a pedir.',
        resultado: { texto: 'Le diste el aumento a la policía.', plata: -0.06, efectos: { imagen: -1, poder: 2 } },
      },
      {
        texto: 'No ceder',
        pista: 'Autoridad, o un acuartelamiento.',
        resultado: {
          chance: porAtributo('territorio', 0.3),
          exito: { texto: 'No cediste y la policía volvió a la calle.', efectos: { imagen: 4, poder: 1, territorio: -1 } },
          fracaso: { texto: 'Hubo acuartelamiento y la ciudad quedó sin patrullaje.', efectos: { imagen: -6, poder: -3, territorio: -1 } },
        },
      },
    ],
  },
  {
    id: 'arrepentido',
    especial: 'carpetazo',
    quien: { rol: 'Fiscal federal' },
    titulo: 'Un arrepentido dio tu nombre',
    texto: 'Un arrepentido declaró y su nombre aparece en la causa. Le aconsejo que se presente antes de que lo citemos.',
    condicion: (c) => c.medidores.causas >= 30,
    peso: 2,
    opciones: [
      {
        texto: 'Contratar a los mejores abogados',
        pista: 'Cara, pero ayuda.',
        resultado: { texto: 'Contrataste abogados para frenar la declaración del arrepentido.', plata: -0.12, efectos: { causas: -6 } },
      },
      {
        texto: 'Pedir una reunión con el juez',
        pista: 'Gastás contactos. Si sale bien, la causa duerme. Si sale mal, empeora todo.',
        resultado: {
          chance: porAtributo('rosca', 0),
          exito: { texto: 'Te reuniste con el juez y la causa se frenó.', efectos: { causas: -10, poder: -2 } },
          fracaso: { texto: 'Se filtró que buscaste al juez. La causa se aceleró.', efectos: { causas: 6, imagen: -4, poder: -3 } },
        },
      },
      {
        texto: 'Presentarte y declarar',
        pista: 'Mostrar la cara tiene su valor. Tu espacio no quiere que hables.',
        resultado: { texto: 'Te presentaste ante la fiscalía a declarar.', efectos: { imagen: 2, causas: -2, territorio: -1, poder: -2 } },
      },
    ],
  },
  {
    id: 'retenciones',
    especial: 'amenaza',
    quien: { rol: 'Presidente de la Mesa Agropecuaria' },
    titulo: 'Si apoyás las retenciones…',
    texto: 'Si usted apoya las retenciones, el campo se planta. Tractores en las rutas y ni un grano al puerto. Piénselo.',
    condicion: (c) => ['legislador', 'diputado', 'senador', 'gobernador', 'presidente'].includes(c.cargo),
    opciones: [
      {
        texto: 'Ponerte del lado del campo',
        pista: 'El interior te banca. Otros te van a reprochar.',
        postura: { economia: 1 },
        resultado: { texto: 'Te pusiste del lado del campo contra las retenciones.', efectos: { poder: 3, imagen: -2 } },
      },
      {
        texto: 'Sostener las retenciones',
        pista: 'Recursos para el Estado. Y un conflicto en las rutas.',
        postura: { economia: -1 },
        resultado: { texto: 'Sostuviste las retenciones. El campo cortó rutas.', efectos: { imagen: 2, fama: 1, poder: -3 } },
      },
      {
        texto: 'Proponer un esquema escalonado',
        pista: 'Si tenés rosca, quedás bien con todos. Si no, con nadie.',
        resultado: {
          chance: porAtributo('rosca', 0.1),
          exito: { texto: 'Lograste un acuerdo escalonado con el campo.', efectos: { imagen: 3, poder: 1, territorio: -1 } },
          fracaso: { texto: 'Tu propuesta no conformó a nadie.', efectos: { poder: -2, imagen: -2, territorio: -1 } },
        },
      },
    ],
  },
  {
    id: 'plata-del-barrio',
    especial: 'oferta',
    quien: { rol: 'Puntero del barrio' },
    titulo: 'Plata para repartir',
    texto: 'Llegó plata de un programa social y alguien tiene que manejarla. Vos repartís, vos decidís… y algo queda para la agrupación.',
    condicion: (c) => rango(c) <= 2,
    opciones: [
      {
        texto: 'Manejar la plata',
        pista: 'Territorio y plata en negro. Y papeles que alguien va a mirar.',
        requiere: idealistaNo,
        resultado: {
          texto: 'Manejaste la plata del programa social a tu manera.',
          negra: 0.25,
          coima: true,
          efectos: { territorio: 2, causas: 5 },
          construccion: 1,
        },
      },
      {
        texto: 'Repartirla toda, con planilla',
        pista: 'Nada para vos, todo en regla. Mucho trabajo, y los punteros no te lo perdonan.',
        resultado: {
          texto: 'Repartiste la plata del programa con planilla y transparencia.',
          limpias: true,
          efectos: { imagen: 2, territorio: -1, poder: -1 },
          construccion: 1,
        },
      },
      {
        texto: 'No meterte',
        pista: 'Otro la va a manejar.',
        pasiva: true,
        resultado: { texto: 'No te metiste con la plata del programa.', efectos: { poder: -1, territorio: 1, imagen: 1 } },
      },
    ],
  },
  {
    id: 'investigacion-alcorta',
    especial: 'carpetazo',
    quien: { figura: 'alcorta' },
    titulo: 'Una investigación',
    texto: 'Estoy terminando una investigación sobre tu patrimonio. Antes de publicarla, quiero escuchar tu versión. Es lo justo.',
    condicion: (c) => c.medidores.causas >= 20 && c.medidores.fama >= 25,
    opciones: [
      {
        texto: 'Dar tu versión, con papeles',
        pista: 'Si tenés las cuentas claras, sale bien.',
        resultado: {
          chance: (c) => Math.max(0.1, 0.9 - c.medidores.causas / 70),
          exito: { texto: 'Diste tu versión con papeles y la nota salió matizada.', efectos: { imagen: 2, territorio: -1 } },
          fracaso: { texto: 'Tu versión no alcanzó: la investigación salió completa.', efectos: { imagen: -7, causas: 5, territorio: -1 } },
        },
      },
      {
        texto: 'No contestar',
        pista: 'La nota sale igual.',
        pasiva: true,
        resultado: { texto: 'No contestaste y la investigación salió sin tu versión.', efectos: { imagen: -4, causas: 3, territorio: 1 } },
      },
      {
        texto: 'Usar tus contactos para frenarla',
        pista: 'Gastás poder, y algo se sabe igual.',
        resultado: { texto: 'Moviste tus contactos y la investigación salió recortada.', efectos: { poder: -3, imagen: -1, causas: -2 } },
      },
    ],
  },
  {
    id: 'citacion-indagatoria',
    especial: 'citacion',
    quien: { rol: 'Juez federal' },
    titulo: 'Citado a indagatoria',
    texto:
      'Por la presente se lo cita a prestar declaración indagatoria. Puede venir con su abogado. Puede no declarar. Pero tiene que venir.',
    peso: 0,
    opciones: [
      {
        texto: 'Presentarte con los mejores abogados',
        pista: 'Cuesta caro. Si convencés al juez, la causa retrocede.',
        resultado: {
          chance: (c) => Math.min(0.8, Math.max(0.1, 0.35 + c.atributos.rosca / 300 + c.medidores.poder / 300 - c.medidores.causas / 300)),
          exito: {
            texto: 'Declaraste con tus abogados y el juez no encontró mérito para seguir.',
            plata: -0.12,
            efectos: { causas: -6 },
            proceso: 'retroceder',
          },
          fracaso: { texto: 'Declaraste, pero el juez no te creyó.', plata: -0.12 },
        },
      },
      {
        texto: 'Hablar de persecución en la puerta del juzgado',
        pista: 'Tu gente te banca. El juzgado, no.',
        resultado: { texto: 'Hablaste de persecución política en la puerta del juzgado.', efectos: { fama: 4, imagen: -2, causas: 3 } },
      },
      {
        texto: 'Negarte a declarar',
        pista: 'Es tu derecho. No cambia nada.',
        pasiva: true,
        resultado: { texto: 'Te negaste a declarar.', efectos: { imagen: -2, territorio: 1 } },
      },
      {
        texto: 'Arrepentirte y contar lo que sabés',
        pista: 'Te salvás vos. Tus socios y tu espacio no te lo van a perdonar.',
        requiere: (c) => (c.coimas ? null : 'No tenés nada que contar.'),
        resultado: {
          texto: 'Te convertiste en arrepentido y contaste todo.',
          efectos: { causas: -20, imagen: -4, poder: -6 },
          construccion: -5,
          proceso: 'archivar',
        },
      },
    ],
  },
  {
    id: 'desafuero',
    especial: 'desafuero',
    quien: { rol: 'Presidente de la Cámara' },
    titulo: 'El pedido de desafuero',
    texto: 'Llegó el pedido del juez para quitarle los fueros. La semana que viene se vota en el recinto. Usted verá cómo se prepara.',
    peso: 0,
    opciones: [
      {
        texto: 'Rosquear para que no lo voten',
        pista: 'Si juntás los votos, zafás. Pero queda feo y gastás poder.',
        resultado: {
          chance: (c) => Math.min(0.85, Math.max(0.1, 0.2 + c.atributos.rosca / 250 + c.medidores.poder / 250 + c.construccion / 400)),
          exito: { texto: 'La Cámara rechazó tu desafuero. Seguís con fueros.', efectos: { imagen: -4, poder: -4 } },
          fracaso: { texto: 'Te quitaron los fueros. El juez ordenó tu detención.', efectos: { imagen: -3 }, proceso: 'detencion' },
        },
      },
      {
        texto: 'Renunciar a los fueros y presentarte',
        pista: 'Dar la cara tiene su valor. Pero quedás a merced del juez.',
        resultado: { texto: 'Renunciaste a tus fueros para presentarte ante la Justicia.', efectos: { imagen: 6 }, proceso: 'detencion' },
      },
    ],
  },
  {
    id: 'extorsion-socio',
    especial: 'amenaza',
    quien: { rol: 'Tu ex socio' },
    titulo: 'Tu ex socio quiere más',
    texto: 'Vos te acordás de todo lo que hicimos juntos. Yo también, y tengo los papeles. Necesito plata. Si no, voy a lo del fiscal.',
    condicion: (c) => (c.coimas ?? 0) >= 2,
    peso: 2,
    opciones: [
      {
        texto: 'Pagarle en negro',
        pista: 'Se calla. Por ahora: va a volver a pedir.',
        resultado: {
          texto: 'Le pagaste a tu ex socio para que se callara.',
          negra: -0.25,
          favor: { debes: true, motivo: 'Le pagaste para que se callara: va a volver' },
        },
      },
      {
        texto: 'Que haga lo que quiera',
        pista: 'Si habla, la causa se te viene encima. Pero no te dejás apretar.',
        resultado: { texto: 'Tu ex socio fue a ver al fiscal y contó todo.', efectos: { causas: 12, imagen: 2 }, proceso: 'avanzar' },
      },
      {
        texto: 'Apretarlo vos',
        pista: 'Puede funcionar. Puede salir muy mal.',
        resultado: {
          chance: (c) => Math.min(0.7, Math.max(0.15, c.atributos.rosca / 130)),
          exito: { texto: 'Apretaste a tu ex socio y se echó atrás.', efectos: { rosca: 1, poder: 1 } },
          fracaso: {
            texto: 'Tu ex socio grabó la conversación y la llevó a la Justicia.',
            efectos: { causas: 15, imagen: -4 },
            proceso: 'avanzar',
          },
        },
      },
    ],
  },
  {
    id: 'cobro-favor',
    especial: 'pedido',
    titulo: 'Te vienen a cobrar',
    texto: 'Usted sabe por qué estoy acá. Le hicimos un favor, y ahora necesitamos que nos devuelva la gentileza.',
    peso: 0,
    opciones: [
      {
        texto: 'Cumplir',
        pista: 'Saldás la deuda, pero algo te va a costar.',
        resultado: { texto: 'Devolviste el favor que debías.', plata: -0.08, efectos: { imagen: -2 }, saldarFavor: true },
      },
      {
        texto: 'Hacerte el distraído',
        pista: 'No te lo van a perdonar: se corre la voz entre los que mandan.',
        resultado: {
          texto: 'No devolviste el favor. Te lo van a cobrar de otra forma.',
          efectos: { poder: -5, imagen: -1 },
          saldarFavor: true,
        },
      },
    ],
  },
];

/** Eventos comunes: la vida política de todos los días. Sin alerta, con números a la vista. */
export const COMUNES: DefEvento[] = [
  {
    id: 'almuerzo-legran',
    quien: { figura: 'legran' },
    titulo: 'Un almuerzo televisivo',
    texto: 'Mirna Legrán te invita a su mesa. Millones miran. Una frase mal dicha y la repiten toda la semana.',
    condicion: (c) => c.medidores.fama >= 30,
    opciones: [
      {
        texto: 'Ir y ser prudente',
        pista: 'Tu espacio esperaba que dijeras algo.',
        resultado: { texto: 'Fuiste al almuerzo de Mirna Legrán y estuviste prudente.', efectos: { fama: 3, imagen: 1, poder: -2 } },
      },
      {
        texto: 'Ir y polemizar',
        resultado: { texto: 'Polemizaste en la mesa de Mirna Legrán.', efectos: { fama: 6, imagen: -4, poder: 1 } },
      },
      {
        texto: 'No ir',
        pista: 'Descansás. Te ven esquivo.',
        pasiva: true,
        resultado: { texto: 'Rechazaste la invitación de Mirna Legrán.', efectos: { territorio: 1, fama: -1 } },
      },
    ],
  },
  {
    id: 'imitacion-tirelli',
    quien: { figura: 'tirelli' },
    titulo: 'Te imitan en la tele',
    texto: 'En el programa de Marcelo Tirelli apareció un imitador tuyo. El país entero se ríe. ¿Vos?',
    condicion: (c) => c.medidores.fama >= 35,
    opciones: [
      {
        texto: 'Reírte y compartirlo',
        pista: 'Caés simpático. Algunos te ven blando.',
        resultado: { texto: 'Te reíste de tu imitación en lo de Tirelli.', efectos: { fama: 2, imagen: 2, poder: -2 } },
      },
      {
        texto: 'Enojarte en público',
        resultado: { texto: 'Te enojaste con la imitación de Tirelli.', efectos: { fama: 5, imagen: -3, poder: 1 } },
      },
    ],
  },
  {
    id: 'saludo-jimenez',
    quien: { figura: 'jimenez' },
    titulo: 'Un saludo de Susana',
    texto: 'En pleno programa, Susana Jiménez dijo que le caés bien. En los barrios no se habla de otra cosa.',
    condicion: (c) => c.medidores.fama >= 45,
    opciones: [
      {
        texto: 'Agradecerle',
        pista: 'Simpático. Algunos te ven farandulero.',
        resultado: { texto: 'Le agradeciste a Susana Jiménez el saludo.', efectos: { fama: 2, imagen: 1, poder: -1 } },
      },
      {
        texto: 'Invitarla a un acto',
        pista: 'Un acto grande cuesta plata. Si viene, explota.',
        resultado: {
          chance: () => 0.35,
          exito: { texto: 'Susana Jiménez vino a tu acto. Explotó.', plata: -0.05, efectos: { fama: 8, imagen: 3 } },
          fracaso: { texto: 'Susana Jiménez no vino a tu acto, y se notó.', plata: -0.05, efectos: { imagen: -1 } },
        },
      },
    ],
  },
  {
    id: 'foto-messina',
    quien: { figura: 'messina' },
    titulo: 'Leandro Messina en el mismo evento',
    texto: 'Coincidís con Leandro Messina en una cena de beneficencia. Una foto con él vale oro. Él no hace política.',
    condicion: (c) => c.medidores.fama >= 20,
    opciones: [
      {
        texto: 'Pedirle la foto',
        pista: 'Si acepta, recorre el país. Si no, alguien filma el desplante.',
        resultado: {
          chance: () => 0.25,
          exito: { texto: 'Leandro Messina aceptó la foto. Recorrió el país.', efectos: { fama: 7, imagen: 3 } },
          fracaso: { texto: 'Messina no se prestó a la foto, y alguien lo filmó.', efectos: { imagen: -3 } },
        },
      },
      {
        texto: 'Respetar su espacio',
        pista: 'Quedás bien con la gente de la cena. Nadie se entera.',
        pasiva: true,
        resultado: { texto: 'Respetaste el espacio de Leandro Messina.', efectos: { imagen: 1, poder: 1, fama: -1 } },
      },
    ],
  },
  {
    id: 'inundacion',
    titulo: 'Inundación',
    texto: 'Llovió en una noche lo que llueve en un mes. Hay barrios bajo el agua y familias evacuadas.',
    opciones: [
      {
        texto: 'Ir con las botas puestas',
        pista: 'Te ven en el barro. Cansa.',
        resultado: {
          texto: 'Recorriste los barrios inundados con las botas puestas.',
          efectos: { imagen: 3, territorio: -1, poder: -1 },
          construccion: 1,
        },
      },
      {
        texto: 'Organizar la ayuda desde la oficina',
        pista: 'Ayuda que llega, con algo de tu plata.',
        resultado: { texto: 'Organizaste la ayuda a los inundados.', plata: -0.04, efectos: { gestion: 2, imagen: 2 } },
      },
      {
        texto: 'Seguir con tu agenda',
        pista: 'Cerrás un acuerdo importante. Nadie entiende dónde estabas.',
        pasiva: true,
        resultado: { texto: 'No suspendiste tu agenda durante la inundación.', efectos: { imagen: -3, territorio: 1, poder: 1, rosca: 1 } },
      },
    ],
  },
  {
    id: 'audio-filtrado',
    titulo: 'Un audio filtrado',
    texto: 'Circula un audio tuyo hablando mal de un compañero. No es nada grave, pero suena feo.',
    condicion: (c) => c.medidores.fama >= 15,
    opciones: [
      { texto: 'Pedir disculpas', resultado: { texto: 'Pediste disculpas por el audio filtrado.', efectos: { imagen: -1, poder: -1 } } },
      {
        texto: 'Decir que es falso',
        resultado: {
          chance: () => 0.5,
          exito: { texto: 'Dijiste que el audio era falso y la cosa pasó.', efectos: {} },
          fracaso: { texto: 'Dijiste que era falso y un peritaje dijo que no.', efectos: { imagen: -5 } },
        },
      },
      {
        texto: 'Redoblar y decir que es verdad',
        resultado: { texto: 'Sostuviste lo que dijiste en el audio.', efectos: { fama: 3, imagen: -3, rosca: -2 } },
      },
    ],
  },
  {
    id: 'club-barrio',
    titulo: 'El club del barrio',
    texto: 'El club del barrio está por cerrar. Te piden una mano para salvarlo.',
    opciones: [
      {
        texto: 'Poner plata y ayudar',
        resultado: { texto: 'Ayudaste a salvar el club del barrio.', plata: -0.08, efectos: { territorio: 2, imagen: 1 }, construccion: 1 },
      },
      {
        texto: 'Armar una colecta',
        pista: 'Te pone el cuerpo. Depende de tu fama.',
        resultado: {
          chance: porAtributo('fama', 0.2),
          exito: { texto: 'La colecta salvó el club.', efectos: { territorio: 1 }, construccion: 1 },
          fracaso: { texto: 'La colecta no alcanzó y el club cerró.', efectos: { imagen: -1, territorio: -1 } },
        },
      },
      { texto: 'No es tu tema', pasiva: true, resultado: { texto: 'El club del barrio cerró.', efectos: { territorio: -1, poder: 1 } } },
    ],
  },
  {
    id: 'presidencia-club',
    titulo: 'Las elecciones del club grande',
    texto: 'Te proponen encabezar la lista para presidir un club de fútbol grande. Es una vidriera enorme… y un dolor de cabeza.',
    condicion: (c) => c.medidores.fama >= 30,
    opciones: [
      {
        texto: 'Presentarte',
        pista: 'La campaña del club la pagás vos.',
        resultado: {
          chance: porAtributo('fama', 0.1),
          exito: { texto: 'Ganaste la presidencia del club.', plata: -0.15, efectos: { fama: 8, territorio: -1 }, construccion: 2 },
          fracaso: { texto: 'Perdiste las elecciones del club.', plata: -0.15, efectos: { fama: 2, imagen: -2 } },
        },
      },
      {
        texto: 'Mejor no',
        pista: 'Te ahorrás el dolor de cabeza.',
        pasiva: true,
        resultado: { texto: 'No te metiste en la política del fútbol.', efectos: { territorio: 1, fama: -1 } },
      },
    ],
  },
  {
    id: 'mundial',
    titulo: '¡La Selección es campeona del mundo!',
    texto: 'Argentina gana el Mundial. El país entero está en la calle.',
    condicion: (c) => (c.anio - 2026) % 4 === 0 && c.medidores.fama >= 10,
    opciones: [
      {
        texto: 'Festejar con la gente en la calle',
        resultado: { texto: 'Festejaste el Mundial en la calle con la gente.', efectos: { imagen: 3, territorio: -1 } },
      },
      {
        texto: 'Subir una foto con la camiseta',
        resultado: { texto: 'Subiste una foto con la camiseta de la Selección.', efectos: { fama: 2, imagen: -1 } },
      },
      {
        texto: 'Intentar colgarte del festejo',
        resultado: { texto: 'Intentaste colgarte del festejo de la Selección. Cayó mal.', efectos: { fama: 4, imagen: -4 } },
      },
    ],
  },
  {
    id: 'salud-estres',
    titulo: 'El cuerpo pasa factura',
    texto: 'Después de meses sin dormir bien, tu médico te pide que bajes un cambio.',
    condicion: (c) => c.edad >= 40,
    opciones: [
      {
        texto: 'Hacerle caso y descansar',
        resultado: { texto: 'Bajaste un cambio por consejo médico.', efectos: { territorio: 2, fama: -2, poder: -1 } },
      },
      {
        texto: 'Seguir a full',
        resultado: { texto: 'Ignoraste al médico y seguiste a full.', efectos: { territorio: -2, rosca: 1, poder: 1 } },
      },
    ],
  },
  {
    id: 'libro',
    titulo: 'Un libro',
    texto: 'Una editorial te propone escribir un libro sobre tus ideas.',
    condicion: (c) => c.medidores.fama >= 20,
    opciones: [
      {
        texto: 'Escribirlo vos',
        resultado: { texto: 'Escribiste un libro sobre tus ideas.', efectos: { fama: 2, gestion: 1, territorio: -1 } },
      },
      {
        texto: 'Pagar a alguien que lo escriba',
        resultado: { texto: 'Publicaste un libro escrito por otro.', plata: -0.05, efectos: { fama: 3 } },
      },
      {
        texto: 'No tenés tiempo',
        pasiva: true,
        resultado: { texto: 'Rechazaste escribir un libro.', efectos: { territorio: 1, fama: -1 } },
      },
    ],
  },
  {
    id: 'traicion-companero',
    titulo: 'Un compañero te serrucha el piso',
    texto: 'Alguien de tu propio espacio anda diciendo que no estás a la altura. Quiere tu lugar.',
    condicion: (c) => c.construccion >= 20,
    opciones: [
      {
        texto: 'Enfrentarlo',
        resultado: {
          chance: porAtributo('rosca', 0.1),
          exito: { texto: 'Enfrentaste al compañero y lo dejaste afuera.', efectos: { rosca: 2, poder: 2 }, construccion: 1 },
          fracaso: { texto: 'Enfrentaste al compañero y te salió mal.', efectos: { poder: -3 }, construccion: -3 },
        },
      },
      {
        texto: 'Sumarlo a tu equipo',
        pista: 'Se calma, pero compartís el poder.',
        resultado: { texto: 'Sumaste a tu equipo al compañero que te criticaba.', efectos: { rosca: 1, poder: -2 }, construccion: 1 },
      },
      {
        texto: 'Dejarlo pasar',
        pasiva: true,
        resultado: { texto: 'Dejaste pasar las críticas del compañero.', efectos: { territorio: 1 }, construccion: -1 },
      },
    ],
  },
  {
    id: 'toma-tierras',
    titulo: 'Una toma de tierras',
    texto: 'Cien familias ocuparon un terreno fiscal. Los vecinos piden desalojo; las familias, una solución.',
    condicion: (c) => tieneCargo(c),
    opciones: [
      {
        texto: 'Pedir el desalojo',
        pista: 'Los vecinos te aplauden. En los barrios no te lo perdonan.',
        postura: { social: -1 },
        resultado: { texto: 'Pediste el desalojo de la toma.', efectos: { imagen: 2, poder: 1, territorio: -2 } },
      },
      {
        texto: 'Mediar y buscar viviendas',
        postura: { social: 0.6 },
        resultado: {
          chance: porAtributo('gestion', 0.1),
          exito: { texto: 'Mediaste en la toma y se encontró una salida.', efectos: { imagen: 3, gestion: 1, territorio: -1 } },
          fracaso: { texto: 'La mediación fracasó y nadie quedó conforme.', efectos: { imagen: -2, territorio: -1 } },
        },
      },
      {
        texto: 'No meterte',
        pasiva: true,
        resultado: { texto: 'No te metiste en la toma de tierras.', efectos: { poder: -2, territorio: 1 } },
      },
    ],
  },
  {
    id: 'debate-universidad',
    titulo: 'Un debate en la universidad',
    texto: 'Te invitan a debatir con estudiantes de todas las agrupaciones.',
    opciones: [
      {
        texto: 'Ir a debatir',
        resultado: {
          chance: porAtributo('fama', 0.15),
          exito: { texto: 'Brillaste en el debate de la universidad.', efectos: { fama: 3, territorio: -1 } },
          fracaso: { texto: 'Te comieron en el debate de la universidad.', efectos: { imagen: -2, territorio: -1 } },
        },
      },
      {
        texto: 'Mandar a alguien de tu equipo',
        pista: 'Lo forma a él. A vos no te ven.',
        pasiva: true,
        resultado: { texto: 'Mandaste a alguien de tu equipo al debate.', efectos: { territorio: 1, poder: 1, fama: -1 } },
      },
    ],
  },
  {
    id: 'asado-gobernador',
    titulo: 'Un asado con un gobernador',
    texto: 'Un gobernador del interior te invita a su estancia. Asado largo, sobremesa más larga.',
    condicion: (c) => c.construccion >= 25,
    opciones: [
      {
        texto: 'Ir y escuchar',
        pista: 'Un fin de semana entero, lejos de tu gente.',
        resultado: { texto: 'Pasaste una tarde larga con un gobernador.', efectos: { rosca: 1, poder: 2, territorio: -2 } },
      },
      {
        texto: 'Excusarte',
        pasiva: true,
        resultado: { texto: 'Te excusaste del asado del gobernador.', efectos: { poder: -1, territorio: 1 } },
      },
    ],
  },
  {
    id: 'trolls',
    titulo: 'Te atacan en las redes',
    texto: 'Una catarata de cuentas sin foto te acusa de todo. Es tendencia.',
    condicion: (c) => c.medidores.fama >= 20,
    opciones: [
      {
        texto: 'Contestar uno por uno',
        resultado: { texto: 'Contestaste a las cuentas que te atacaban.', efectos: { fama: 2, imagen: -2, territorio: -1 } },
      },
      {
        texto: 'Ignorarlo',
        pasiva: true,
        resultado: { texto: 'Ignoraste el ataque en las redes.', efectos: { imagen: -1, territorio: 1 } },
      },
      {
        texto: 'Contratar a alguien que responda',
        resultado: { texto: 'Contrataste un equipo para responder en redes.', plata: -0.04, efectos: { imagen: 1 } },
      },
    ],
  },
  {
    id: 'herencia',
    titulo: 'Una herencia',
    texto: 'Murió un tío lejano y te dejó una casa en el interior.',
    peso: 0.5,
    opciones: [
      {
        texto: 'Venderla',
        pista: '"¿Y la familia?", te preguntan.',
        resultado: { texto: 'Vendiste la casa que te dejó un tío.', plata: 0.15, efectos: { imagen: -2 } },
      },
      {
        texto: 'Donarla a una escuela',
        pista: 'Queda bien, pero no entra un peso y la escritura la pagás vos.',
        resultado: { texto: 'Donaste la casa que heredaste a una escuela.', plata: -0.04, efectos: { imagen: 2, fama: 1, poder: 1 } },
      },
    ],
  },
  {
    id: 'robo',
    titulo: 'Te robaron',
    texto: 'Te entraron a robar a la casa. La noticia corre.',
    peso: 0.5,
    opciones: [
      {
        texto: 'Hacer la denuncia como cualquier vecino',
        resultado: { texto: 'Hiciste la denuncia del robo como cualquier vecino.', plata: -0.04, efectos: { imagen: 2 } },
      },
      {
        texto: 'Usarlo para hablar de seguridad',
        resultado: { texto: 'Usaste el robo para hablar de seguridad.', plata: -0.04, efectos: { fama: 2, imagen: -1, poder: 1 } },
      },
    ],
  },
  {
    id: 'corte-luz',
    titulo: 'Corte de luz en pleno verano',
    texto: 'Cuarenta grados y tres días sin luz en media ciudad. La gente está furiosa.',
    condicion: (c) => tieneCargo(c),
    opciones: [
      {
        texto: 'Culpar a la empresa',
        pista: 'La gente te da la razón. La empresa, no.',
        postura: { economia: -0.6 },
        resultado: { texto: 'Le echaste la culpa a la distribuidora por el corte de luz.', efectos: { imagen: 2, fama: 1, poder: -2 } },
      },
      {
        texto: 'Repartir generadores',
        resultado: { texto: 'Repartiste generadores en los barrios sin luz.', plata: -0.08, efectos: { imagen: 3 }, construccion: 1 },
      },
      {
        texto: 'Esperar',
        pista: 'Dejás trabajar a los técnicos. La gente no lo entiende.',
        pasiva: true,
        resultado: { texto: 'Esperaste a que volviera la luz.', efectos: { imagen: -2, territorio: 1, gestion: 1 } },
      },
    ],
  },
  {
    id: 'paro-docente',
    titulo: 'Paro docente',
    texto: 'Los docentes paran por salario. Las escuelas, cerradas. Las familias, divididas.',
    condicion: (c) => ejecutivo(c) || legislador(c),
    opciones: [
      {
        texto: 'Apoyar el reclamo',
        pista: 'Los gremios te abrazan. El gobierno, no.',
        postura: { economia: -0.7 },
        resultado: { texto: 'Apoyaste el reclamo docente.', efectos: { imagen: 2, fama: 1, poder: -2 } },
      },
      {
        texto: 'Pedir que vuelvan a las aulas',
        pista: 'Orden y aliados arriba. Muchas familias se enojan.',
        postura: { economia: 0.5, social: -0.3 },
        resultado: { texto: 'Pediste que los docentes volvieran a las aulas.', efectos: { poder: 2, imagen: -1 } },
      },
    ],
  },
  {
    id: 'viaje-exterior',
    titulo: 'Un viaje al exterior',
    texto: 'Te invitan a un foro internacional. Contactos, fotos y algún que otro reproche por viajar.',
    condicion: (c) => rango(c) >= 2,
    opciones: [
      { texto: 'Ir', resultado: { texto: 'Viajaste a un foro internacional.', efectos: { fama: 1, gestion: 1, imagen: -2, poder: 1 } } },
      { texto: 'Quedarte', pasiva: true, resultado: { texto: 'Te quedaste en el país.', efectos: { imagen: 1, territorio: 1, fama: -1 } } },
    ],
  },
  {
    id: 'encuesta-mala',
    titulo: 'Una encuesta te liquida',
    texto: 'Sale una encuesta que te deja último. Los propios empiezan a dudar.',
    condicion: (c) => c.medidores.fama >= 15,
    opciones: [
      {
        texto: 'Decir que la encuesta está comprada',
        resultado: { texto: 'Dijiste que la encuesta estaba comprada.', efectos: { imagen: -1, poder: -1, fama: 1 } },
      },
      {
        texto: 'Redoblar la militancia',
        resultado: { texto: 'Redoblaste la militancia después de la encuesta.', plata: -0.05, efectos: { territorio: 1 } },
      },
    ],
  },
  {
    id: 'escuela-techo',
    titulo: 'Se cae un techo en una escuela',
    texto: 'Se desprendió parte del techo de una escuela. Por suerte, sin heridos. Por ahora.',
    condicion: (c) => ejecutivo(c),
    opciones: [
      {
        texto: 'Arreglarlo ya',
        pista: 'Sin licitación, con fondos que tenés que poner.',
        resultado: { texto: 'Mandaste a arreglar el techo de la escuela de inmediato.', plata: -0.06, efectos: { imagen: 3, causas: 1 } },
      },
      {
        texto: 'Licitar como corresponde',
        pista: 'Todo en regla. Pasan meses.',
        resultado: { texto: 'Licitaste la obra del techo de la escuela.', efectos: { gestion: 2, imagen: -1, causas: -1 } },
      },
    ],
  },
  {
    id: 'familia',
    titulo: 'La familia',
    texto: 'Tu familia te reclama que nunca estás. Hay un cumpleaños importante el sábado y un acto el mismo día.',
    opciones: [
      { texto: 'Ir al cumpleaños', resultado: { texto: 'Elegiste estar con tu familia.', efectos: { imagen: 1, poder: -1 } } },
      { texto: 'Ir al acto', resultado: { texto: 'Elegiste el acto antes que el cumpleaños.', efectos: { territorio: 1, imagen: -1 } } },
    ],
  },
  {
    id: 'maestria',
    titulo: 'Una beca para estudiar',
    texto: 'Te ofrecen una beca para hacer una maestría en políticas públicas.',
    condicion: (c) => c.edad <= 45,
    opciones: [
      {
        texto: 'Aceptarla',
        pista: 'Dos años de estudio, lejos del barrio.',
        resultado: { texto: 'Hiciste una maestría en políticas públicas.', efectos: { gestion: 4, territorio: -1 } },
      },
      {
        texto: 'La calle enseña más',
        resultado: { texto: 'Rechazaste la beca: la calle enseña más.', efectos: { territorio: 1, gestion: -1 } },
      },
    ],
  },
  {
    id: 'piquete',
    titulo: 'Un piquete en la autopista',
    texto: 'Un corte total en la autopista. Miles de autos parados y la tele en vivo.',
    condicion: (c) => tieneCargo(c),
    opciones: [
      {
        texto: 'Pedir que se libere la vía',
        pista: 'Los automovilistas te aplauden. En los barrios, no.',
        postura: { social: -0.7 },
        resultado: { texto: 'Pediste que se liberara la autopista.', efectos: { imagen: 2, territorio: -1 } },
      },
      {
        texto: 'Ir a dialogar',
        postura: { social: 0.5 },
        resultado: {
          chance: porAtributo('rosca', 0.2),
          exito: { texto: 'Dialogaste y el corte se levantó.', efectos: { imagen: 3, poder: 1, territorio: -1 } },
          fracaso: { texto: 'Fuiste a dialogar y te insultaron en vivo.', efectos: { imagen: -2, territorio: -1 } },
        },
      },
    ],
  },
  {
    id: 'aniversario-partido',
    titulo: 'El acto del partido',
    texto: 'Se viene el gran acto anual del partido. Te ofrecen hablar, pero hay que llenar la plaza con tu gente.',
    condicion: (c) => c.construccion >= 15,
    opciones: [
      {
        texto: 'Llevar micros y hablar',
        pista: 'Los micros los pagás vos.',
        resultado: {
          texto: 'Llenaste tu parte de la plaza y hablaste en el acto del partido.',
          plata: -0.08,
          efectos: { fama: 2 },
          construccion: 2,
        },
      },
      {
        texto: 'Ir como uno más',
        resultado: { texto: 'Fuiste al acto del partido como uno más.', efectos: { territorio: -1 }, construccion: 1 },
      },
    ],
  },
  {
    id: 'ola-gripe',
    titulo: 'Una ola de gripe',
    texto: 'Una gripe fuerte llena las guardias. Te piden que des el ejemplo.',
    peso: 0.5,
    opciones: [
      {
        texto: 'Vacunarte en público',
        pista: 'Das el ejemplo. Te tumba un par de días.',
        resultado: { texto: 'Te vacunaste en público para dar el ejemplo.', efectos: { imagen: 2, territorio: -1 } },
      },
      {
        texto: 'Seguir como si nada',
        pista: 'No frenás. El cuerpo, sí.',
        resultado: { texto: 'Te contagiaste y estuviste dos semanas en cama.', efectos: { territorio: -1, poder: 1 } },
      },
    ],
  },
  {
    id: 'fiesta-cumple',
    titulo: 'La foto del cumpleaños',
    texto: 'Se filtra una foto tuya en un cumpleaños fastuoso mientras el país pasa un mal momento.',
    condicion: (c) => c.medidores.fama >= 25,
    opciones: [
      {
        texto: 'Pedir disculpas',
        resultado: { texto: 'Pediste disculpas por la foto del cumpleaños.', efectos: { imagen: -2, poder: -1 } },
      },
      {
        texto: 'Decir que es tu vida privada',
        resultado: { texto: 'Dijiste que la foto era parte de tu vida privada.', efectos: { imagen: -4, fama: 2 } },
      },
    ],
  },
  {
    id: 'interna-barrial',
    titulo: 'Pelea entre punteros',
    texto: 'Dos punteros de tu sector se pelean por un local. Cada uno te pide que lo bancás a él.',
    condicion: (c) => c.atributos.territorio >= 25,
    opciones: [
      {
        texto: 'Bancar al más fuerte',
        pista: 'Ganás el barrio, perdés gente.',
        resultado: { texto: 'Bancaste al puntero más fuerte.', efectos: { territorio: 2 }, construccion: -2 },
      },
      {
        texto: 'Sentarlos a los dos',
        resultado: {
          chance: porAtributo('rosca', 0.2),
          exito: { texto: 'Sentaste a los dos punteros y los pusiste de acuerdo.', efectos: { rosca: 1, territorio: -1 }, construccion: 1 },
          fracaso: { texto: 'Los punteros se fueron cada uno por su lado.', efectos: { territorio: -3 } },
        },
      },
    ],
  },
  {
    id: 'obra-inaugurar',
    titulo: 'Una obra para inaugurar',
    texto: 'Está lista una obra que empezó tu antecesor. Podés cortar la cinta.',
    condicion: (c) => ejecutivo(c),
    opciones: [
      {
        texto: 'Inaugurarla con todo',
        pista: 'Acto, cinta y escenario, que pagás vos.',
        resultado: { texto: 'Inauguraste la obra con acto y cinta.', plata: -0.04, efectos: { fama: 3, imagen: 1 } },
      },
      {
        texto: 'Reconocer a tu antecesor',
        pista: 'Queda bien. Le das aire a otro.',
        resultado: { texto: 'Inauguraste la obra reconociendo a tu antecesor.', efectos: { imagen: 3, poder: -2 }, construccion: 1 },
      },
    ],
  },
];

const presidente = (c: Carrera) => c.cargo === 'presidente';
const segundoMandato = (c: Carrera) => presidente(c) && (c.mandatosSeguidos ?? 0) >= 2;

/**
 * Decisiones de Estado: siendo presidente, reemplazan a los eventos de todos
 * los días. Mueven el país (inflación, actividad, reservas) y la calle.
 */
export const ESTADO: DefEvento[] = [
  {
    id: 'cuentas-no-cierran',
    especial: 'estado',
    quien: { rol: 'Ministro de Economía' },
    titulo: 'Las cuentas no cierran',
    texto:
      'Presidente, gastamos más de lo que entra. Hay que tapar el agujero, y no hay forma linda de hacerlo. Usted decide de dónde sale.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Recortar la administración pública',
        pista: 'Baja la inflación. Los estatales salen a la calle.',
        etiquetas: ['ajuste'],
        postura: { economia: 1 },
        resultado: {
          texto: 'Recortaste la administración pública.',
          pais: { inflacion: -20, reservas: 10, actividad: -5 },
          efectos: { imagen: -2 },
          malestar: 10,
        },
      },
      {
        texto: 'Cargar al sector privado con impuestos',
        pista: 'Entra plata. Los que invierten se van.',
        etiquetas: ['impuestos'],
        postura: { economia: -1 },
        resultado: {
          texto: 'Subiste los impuestos a las empresas.',
          pais: { reservas: 8, actividad: -6 },
          efectos: { imagen: 1, poder: -2 },
        },
      },
      {
        texto: 'Endeudarte afuera',
        pista: 'Plata hoy. La deuda la paga el que viene… o vos.',
        resultado: {
          texto: 'Tomaste deuda en los mercados internacionales.',
          pais: { actividad: 5, reservas: 10, inflacion: 10 },
          efectos: { poder: -2 },
        },
      },
    ],
  },
  {
    id: 'retenciones-soja',
    especial: 'estado',
    quien: { rol: 'Ministro de Economía' },
    titulo: 'La soja y el Estado',
    texto:
      'La cosecha viene récord. Si subimos las retenciones, entran dólares. Si las bajamos, el campo invierte. Lo que no podemos es no hacer nada.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Subirlas para pagarles a los jubilados',
        pista: 'Los jubilados te lo agradecen. Tractores en las rutas.',
        etiquetas: ['impuestos'],
        postura: { economia: -1 },
        resultado: {
          texto: 'Subiste las retenciones para financiar a los jubilados.',
          pais: { reservas: 10, actividad: -6 },
          efectos: { imagen: 3, poder: -3 },
          malestar: 5,
        },
      },
      {
        texto: 'Subirlas a cambio de obras en las provincias',
        pista: 'Los gobernadores te quedan debiendo. El campo, furioso.',
        etiquetas: ['impuestos', 'rosca'],
        resultado: {
          texto: 'Subiste las retenciones y repartiste obras entre los gobernadores.',
          pais: { reservas: 8, actividad: -6 },
          efectos: { imagen: -2 },
          favor: { debes: false, motivo: 'Les repartiste obras con las retenciones' },
        },
      },
      {
        texto: 'Bajarlas',
        pista: 'El campo invierte. Las reservas, flacas.',
        postura: { economia: 1 },
        resultado: { texto: 'Bajaste las retenciones al campo.', pais: { actividad: 8, reservas: -10 }, efectos: { poder: 2, imagen: -2 } },
      },
    ],
  },
  {
    id: 'maquinita',
    especial: 'estado',
    quien: { rol: 'Presidente del Banco Central' },
    titulo: 'Tiempos difíciles',
    texto:
      'La economía se frena y la gente no llega a fin de mes. Podemos emitir, podemos pedir al Fondo, o podemos ajustar de golpe. Las tres cosas duelen.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Darle a la maquinita',
        pista: 'Plata en la calle ya. La inflación, después.',
        etiquetas: ['emision'],
        postura: { economia: -1 },
        resultado: { texto: 'Emitiste a gran escala para reactivar.', pais: { actividad: 8, inflacion: 40 }, efectos: { imagen: 2 } },
      },
      {
        texto: 'Pedirle al Fondo',
        pista: 'Dólares frescos, a cambio de que te digan qué hacer.',
        etiquetas: ['fondo'],
        postura: { economia: 0.6 },
        resultado: { texto: 'Pediste un préstamo al Fondo Monetario.', pais: { reservas: 20 }, efectos: { poder: -3, imagen: -2 } },
      },
      {
        texto: 'Ajuste de shock',
        pista: 'La inflación se desploma. La calle explota.',
        etiquetas: ['ajuste'],
        postura: { economia: 1 },
        resultado: {
          texto: 'Aplicaste un ajuste de shock.',
          pais: { inflacion: -25, reservas: 5, actividad: -6 },
          efectos: { imagen: -2 },
          malestar: 10,
        },
      },
    ],
  },
  {
    id: 'dolar',
    especial: 'estado',
    quien: { rol: 'Presidente del Banco Central' },
    titulo: 'El dólar se dispara',
    texto:
      'El dólar subió un diez por ciento en una semana y las reservas se escurren. Necesito una decisión hoy, antes de que abran los mercados.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Poner el cepo',
        pista: 'Frenás la sangría. La economía se traba.',
        postura: { economia: -1 },
        resultado: { texto: 'Pusiste el cepo cambiario.', pais: { reservas: 10, actividad: -5 }, efectos: { imagen: -1, poder: 1 } },
      },
      {
        texto: 'Liberar el dólar',
        pista: 'Salto de precios ahora; inversiones después.',
        postura: { economia: 1 },
        resultado: { texto: 'Liberaste el tipo de cambio.', pais: { inflacion: 25, reservas: 5, actividad: 5 }, efectos: { poder: -1 } },
      },
      {
        texto: 'Desdoblar el tipo de cambio',
        pista: 'Un dólar para cada cosa. Y sospechas.',
        resultado: { texto: 'Desdoblaste el tipo de cambio.', pais: { reservas: 5, inflacion: 10, actividad: 2 }, efectos: { causas: 2 } },
      },
    ],
  },
  {
    id: 'tarifas',
    especial: 'estado',
    quien: { rol: 'Secretario de Energía' },
    titulo: 'Tarifas congeladas',
    texto: 'Hace años que la luz y el gas valen monedas. Los subsidios se comen el presupuesto. O pagamos nosotros, o paga la gente.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Descongelar las tarifas',
        pista: 'Las cuentas mejoran. Las boletas llegan con un susto.',
        etiquetas: ['ajuste'],
        postura: { economia: 1 },
        resultado: {
          texto: 'Descongelaste las tarifas de luz y gas.',
          pais: { reservas: 10, inflacion: 8, actividad: 3 },
          efectos: { imagen: -3 },
          malestar: 5,
        },
      },
      {
        texto: 'Seguir subsidiando',
        pista: 'La gente tranquila. Las reservas, no.',
        postura: { economia: -1 },
        resultado: { texto: 'Mantuviste los subsidios a las tarifas.', pais: { reservas: -10, actividad: 2 }, efectos: { imagen: 2 } },
      },
      {
        texto: 'Segmentar por ingreso',
        pista: 'Paga más el que más tiene. Armarlo cuesta.',
        resultado: { texto: 'Segmentaste las tarifas por ingreso.', pais: { reservas: 4 }, efectos: { imagen: -1, poder: -1, gestion: 1 } },
      },
    ],
  },
  {
    id: 'reforma-laboral',
    especial: 'estado',
    quien: { rol: 'Ministro de Trabajo' },
    titulo: 'La reforma laboral',
    texto:
      'Las empresas dicen que no toman gente por las leyes laborales. La CGT dice que si las tocamos, para el país. Las dos cosas son ciertas.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Hacerla por decreto',
        pista: 'Se activa la economía. Se activa también la CGT.',
        postura: { economia: 1 },
        resultado: {
          texto: 'Hiciste la reforma laboral por decreto.',
          pais: { actividad: 8 },
          efectos: { poder: 1, imagen: -1 },
          malestar: 20,
        },
      },
      {
        texto: 'Negociarla con la CGT',
        pista: 'Una reforma a medias, y muchas noches sin dormir.',
        etiquetas: ['rosca'],
        resultado: { texto: 'Negociaste una reforma laboral con la CGT.', pais: { actividad: 3 }, efectos: { poder: -1, territorio: -1 } },
      },
      {
        texto: 'Retirarla',
        pista: 'Calma en la calle. Te ven débil.',
        postura: { economia: -1 },
        resultado: { texto: 'Retiraste la reforma laboral.', efectos: { poder: -3, imagen: 1 }, malestar: -10 },
      },
    ],
  },
  {
    id: 'jubilados',
    especial: 'estado',
    quien: { rol: 'Presidente de la Cámara de Diputados' },
    titulo: 'El aumento a los jubilados',
    texto:
      'El Congreso aprobó un aumento para los jubilados. Si lo promulga, se rompe el equilibrio fiscal. Si lo veta, los jubilados van a la plaza.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Promulgarlo',
        pista: 'Los jubilados te bancan. Las cuentas, no.',
        postura: { economia: -1 },
        resultado: { texto: 'Promulgaste el aumento a los jubilados.', pais: { reservas: -8, inflacion: 8 }, efectos: { imagen: 3 } },
      },
      {
        texto: 'Vetarlo',
        pista: 'Equilibrio fiscal. Miércoles de marcha en el Congreso.',
        etiquetas: ['ajuste'],
        postura: { economia: 1 },
        resultado: {
          texto: 'Vetaste el aumento a los jubilados.',
          pais: { reservas: 5, inflacion: -5 },
          efectos: { imagen: -3, poder: 2 },
          malestar: 10,
        },
      },
      {
        texto: 'Vetarlo y dar un bono',
        pista: 'Ni una cosa ni la otra.',
        resultado: {
          texto: 'Vetaste el aumento y diste un bono a los jubilados.',
          pais: { reservas: -3 },
          efectos: { imagen: 1, poder: -1 },
        },
      },
    ],
  },
  {
    id: 'aerolinea',
    especial: 'estado',
    quien: { rol: 'Ministro de Transporte' },
    titulo: 'La aerolínea de bandera',
    texto:
      'La aerolínea pierde plata todos los años. Unos dicen que conecta el país; otros, que la pagan los que nunca se subieron a un avión.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Privatizarla',
        pista: 'Entra plata. Los gremios aeronáuticos paran.',
        postura: { economia: 1 },
        resultado: {
          texto: 'Privatizaste la aerolínea de bandera.',
          pais: { reservas: 8, actividad: 2 },
          efectos: { imagen: -2 },
          malestar: 10,
        },
      },
      {
        texto: 'Sostenerla',
        pista: 'Orgullo nacional. Un agujero en el presupuesto.',
        postura: { economia: -1 },
        resultado: { texto: 'Sostuviste la aerolínea de bandera.', pais: { reservas: -6 }, efectos: { imagen: 1, poder: 1 } },
      },
      {
        texto: 'Concesionar las rutas',
        pista: 'Un camino del medio, con letra chica.',
        resultado: {
          texto: 'Concesionaste parte de las rutas de la aerolínea.',
          pais: { reservas: 3 },
          efectos: { gestion: 1, poder: -1 },
        },
      },
    ],
  },
  {
    id: 'corte-suprema',
    especial: 'estado',
    quien: { rol: 'Jefe de Gabinete' },
    titulo: 'La Corte te frena una ley',
    texto:
      'La Corte declaró inconstitucional tu ley más importante. En el partido piden ampliar la Corte. En los diarios, que la respetes.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Ampliar la Corte con jueces propios',
        pista: 'Te asegurás la Justicia. Medio país grita "golpe".',
        resultado: { texto: 'Ampliaste la Corte Suprema con jueces afines.', efectos: { poder: 5, causas: -5, imagen: -6 }, malestar: 15 },
      },
      {
        texto: 'Acatar el fallo',
        pista: 'Respeto institucional. Tu ley, al cajón.',
        resultado: { texto: 'Acataste el fallo de la Corte.', efectos: { imagen: 2, poder: -3 } },
      },
      {
        texto: 'Impulsar un juicio político a un juez',
        pista: 'Si juntás los votos, ganás. Si no, quedás expuesto.',
        etiquetas: ['rosca'],
        resultado: {
          chance: porAtributo('rosca', 0.1),
          exito: { texto: 'El juicio político prosperó y el juez cayó.', efectos: { poder: 4, imagen: -2 } },
          fracaso: { texto: 'El juicio político no juntó los votos.', efectos: { poder: -4, imagen: -3 } },
        },
      },
    ],
  },
  {
    id: 'provincia-quebrada',
    especial: 'estado',
    quien: { rol: 'Gobernador de una provincia del norte' },
    titulo: 'Una provincia no paga sueldos',
    texto:
      'No tengo con qué pagar los sueldos de este mes. Los estatales ya cortaron la ruta. Presidente, sin usted, esto se prende fuego.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Rescatarla',
        pista: 'El gobernador te queda debiendo. La Nación pone la plata.',
        etiquetas: ['rosca'],
        resultado: {
          texto: 'Rescataste a la provincia con fondos nacionales.',
          pais: { reservas: -6, inflacion: 5 },
          favor: { debes: false, motivo: 'Le rescataste la provincia' },
        },
      },
      {
        texto: 'Intervenirla',
        pista: 'Ponés a tu gente. Te acusan de autoritario.',
        resultado: { texto: 'Interviniste la provincia.', efectos: { poder: 3, imagen: -2 }, malestar: 10 },
      },
      {
        texto: 'Dejarla caer',
        pista: 'No ponés un peso. El incendio sigue.',
        postura: { economia: 0.5 },
        resultado: {
          texto: 'Dejaste que la provincia resolviera sola su crisis.',
          pais: { reservas: 3 },
          efectos: { imagen: -1 },
          malestar: 10,
        },
      },
    ],
  },
  {
    id: 'gas-invierno',
    especial: 'estado',
    quien: { rol: 'Secretario de Energía' },
    titulo: 'Crisis energética en invierno',
    texto: 'Hace frío, falta gas y los barcos con gas importado cuestan una fortuna. Alguien se va a quedar sin calefacción. ¿Quién?',
    condicion: presidente,
    opciones: [
      {
        texto: 'Importar gas, cueste lo que cueste',
        pista: 'Nadie pasa frío. Las reservas, sí.',
        resultado: { texto: 'Importaste gas a precio récord.', pais: { reservas: -12 }, efectos: { imagen: 1 } },
      },
      {
        texto: 'Cortarles el gas a las industrias',
        pista: 'Las casas calefaccionadas. Las fábricas, paradas.',
        resultado: { texto: 'Programaste cortes de gas a las industrias.', pais: { actividad: -5, reservas: 2 } },
      },
      {
        texto: 'Tarifazo para bajar el consumo',
        pista: 'La gente consume menos. Y te insulta más.',
        etiquetas: ['ajuste'],
        postura: { economia: 1 },
        resultado: { texto: 'Aplicaste un tarifazo al gas.', pais: { reservas: 6, inflacion: 6 }, efectos: { imagen: -2 }, malestar: 5 },
      },
    ],
  },
  {
    id: 'inseguridad',
    especial: 'estado',
    quien: { rol: 'Ministra de Seguridad' },
    titulo: 'La inseguridad',
    texto: 'Tres crímenes en una semana en el conurbano y la tele no habla de otra cosa. La gente pide respuestas. Hoy.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Mandar las fuerzas federales a la calle',
        pista: 'Uniformes en cada esquina. Denuncias de abusos.',
        postura: { social: -1 },
        resultado: { texto: 'Mandaste las fuerzas federales a las calles.', pais: { reservas: -4 }, efectos: { imagen: 2, causas: 2 } },
      },
      {
        texto: 'Una reforma policial',
        pista: 'Resultados lentos. Los comisarios te miran mal.',
        etiquetas: ['blando'],
        postura: { social: 0.5 },
        resultado: { texto: 'Impulsaste una reforma de la policía.', efectos: { gestion: 2, poder: -2, imagen: 1 } },
      },
      {
        texto: 'Un plan social en los barrios',
        pista: 'Ir a las causas. Cuesta plata y paciencia.',
        etiquetas: ['blando'],
        postura: { economia: -0.6, social: 1 },
        resultado: {
          texto: 'Lanzaste un plan social en los barrios más golpeados.',
          pais: { reservas: -6 },
          efectos: { imagen: 1, territorio: 1 },
        },
      },
    ],
  },
  {
    id: 'fondo-pide',
    especial: 'estado',
    quien: { rol: 'Ministro de Economía' },
    titulo: 'El Fondo vuelve a pedir',
    texto: 'Vencen los pagos con el Fondo y no hay con qué. Ofrecen refinanciar, a cambio de condiciones. Hay quien dice que no paguemos.',
    condicion: presidente,
    opciones: [
      {
        texto: 'Firmar con condiciones',
        pista: 'Llegan los dólares. Y la lista de recortes.',
        etiquetas: ['fondo', 'ajuste'],
        postura: { economia: 1 },
        resultado: { texto: 'Firmaste un acuerdo con el Fondo.', pais: { reservas: 15 }, efectos: { poder: -2, imagen: -2 }, malestar: 5 },
      },
      {
        texto: 'Patear la negociación',
        pista: 'Ganás tiempo. Se van los dólares.',
        resultado: { texto: 'Pateaste la negociación con el Fondo.', pais: { reservas: -8 }, efectos: { poder: 1 } },
      },
      {
        texto: 'Declarar el default',
        pista: 'Aplausos en el Congreso. Afuera, nadie te presta más.',
        postura: { economia: -1 },
        resultado: { texto: 'Declaraste el default de la deuda.', pais: { reservas: 5, actividad: -8 }, efectos: { imagen: 1, poder: 1 } },
      },
    ],
  },
  {
    id: 'sucesor',
    especial: 'estado',
    quien: { rol: 'Jefe de Gabinete' },
    titulo: '¿Quién te sucede?',
    texto: 'Es tu último mandato y en el partido ya se pelean por la herencia. Todos esperan una señal tuya.',
    condicion: segundoMandato,
    peso: 2,
    opciones: [
      {
        texto: 'Ungir a alguien de tu espacio',
        pista: 'Te sigue cubriendo. La gente odia el dedo.',
        resultado: { texto: 'Ungiste a tu sucesor con el dedo.', efectos: { poder: 2, imagen: -3 }, construccion: 1 },
      },
      {
        texto: 'Que se definan en las PASO',
        pista: 'Democracia interna. Y una pelea que te gasta.',
        resultado: { texto: 'Dejaste que tu sucesor se definiera en las PASO.', efectos: { imagen: 2, poder: -3 } },
      },
      {
        texto: 'Apostar por alguien de afuera',
        pista: 'Aire nuevo. Tu gente se siente traicionada.',
        resultado: { texto: 'Apostaste por un candidato de afuera del partido.', efectos: { fama: 2, poder: -2 }, construccion: -1 },
      },
    ],
  },
];

/** La calle: cuando la bronca sube, paros y movilizaciones que te comen el poder. */
export const CALLE: DefEvento[] = [
  {
    id: 'paro-general',
    especial: 'huelga',
    quien: { rol: 'Secretario general de la CGT' },
    titulo: 'Paro general',
    texto: 'Mañana no anda nada: ni trenes, ni colectivos, ni bancos. Esto no es contra el país, es contra usted. Y no va a ser el último.',
    peso: 0,
    opciones: [
      {
        texto: 'Reprimir los piquetes',
        pista: 'La calle se vacía. Las imágenes dan la vuelta al mundo.',
        postura: { social: -1 },
        resultado: { texto: 'Reprimiste los piquetes del paro general.', efectos: { imagen: -4, causas: 2, poder: 1 }, malestar: -25 },
      },
      {
        texto: 'Negociar con la CGT',
        pista: 'Algo vas a tener que poner. Y ceder.',
        etiquetas: ['rosca'],
        resultado: { texto: 'Negociaste con la CGT para levantar el paro.', plata: -0.08, efectos: { poder: -3 }, malestar: -20 },
      },
      {
        texto: 'Aguantar el paro',
        pista: 'Un día perdido. Y otro poco de poder.',
        resultado: { texto: 'Aguantaste el paro general.', efectos: { poder: -4, territorio: -1 }, malestar: -15 },
      },
    ],
  },
  {
    id: 'movilizacion',
    especial: 'huelga',
    quien: { rol: 'Vocera de la movilización' },
    titulo: 'La plaza llena en tu contra',
    texto: 'Somos miles y no nos vamos a ir. Queremos que nos escuche, que dé la cara. Si no, mañana somos el doble.',
    peso: 0,
    opciones: [
      {
        texto: 'Recibir a los organizadores',
        pista: 'Bajás la tensión. Te ven ceder.',
        resultado: { texto: 'Recibiste a los organizadores de la movilización.', efectos: { poder: -3, imagen: 1 }, malestar: -20 },
      },
      {
        texto: 'Ignorarlos',
        pista: 'Ya se van a cansar. O no.',
        pasiva: true,
        resultado: { texto: 'Ignoraste la movilización.', efectos: { poder: -3, territorio: 1 }, malestar: -5 },
      },
      {
        texto: 'Organizar una contramarcha',
        pista: 'Mostrás que también tenés calle. Cuesta plata.',
        resultado: { texto: 'Organizaste una contramarcha propia.', plata: -0.06, efectos: { fama: 2, poder: -1 }, malestar: -10 },
      },
    ],
  },
];

export const EVENTOS: DefEvento[] = [
  ...ESPECIALES,
  ...COMUNES,
  ...ESTADO,
  ...CALLE,
  ...LEYES,
  ...EVENTOS_CRISIS,
  ...EVENTOS_CAIDA,
  ...GESTION,
  ...DELFINES,
];

export function buscarEvento(id: string): DefEvento {
  const e = EVENTOS.find((x) => x.id === id);
  if (!e) throw new Error(`Evento desconocido: ${id}`);
  return e;
}

/** Años que tiene que pasar un evento antes de poder repetirse. */
export const ENFRIAMIENTO_EVENTO = 6;
