import type { EstadoAzar } from './azar';

export const ATRIBUTOS = ['rosca', 'territorio', 'gestion'] as const;
export type Atributo = (typeof ATRIBUTOS)[number];
export type Atributos = Record<Atributo, number>;

export const MEDIDORES = ['fama', 'imagen', 'caja', 'causas', 'poder'] as const;
export type Medidor = (typeof MEDIDORES)[number];

export interface Medidores {
  /** Cuánta gente te conoce (0 a 100). */
  fama: number;
  /** Aprobación entre los que te conocen (0 a 100). */
  imagen: number;
  /** Plata disponible, en dólares. Puede quedar en negativo (deudas). */
  caja: number;
  /** Riesgo judicial (0 a 100). */
  causas: number;
  /** Cuánto pesás entre los que mandan: sindicatos, empresarios, medios, jueces, gobernadores (0 a 100). */
  poder: number;
}

export const RAREZAS = ['comun', 'rara', 'dorada', 'iconica'] as const;
export type Rareza = (typeof RAREZAS)[number];

export interface Carta {
  id: string;
  rareza: Rareza;
}

/** Militante, los cargos designados (los da un partido) y los electivos (se ganan en elecciones). */
export const CARGOS_IDS = [
  'militante',
  'asesor',
  'funcionario',
  'secretario',
  'concejal',
  'legislador',
  'intendente',
  'diputado',
  'senador',
  'gobernador',
  'presidente',
] as const;
export type CargoId = (typeof CARGOS_IDS)[number];

export const PARTIDOS_IDS = ['frente-nacional', 'union-republicana', 'libertad', 'coalicion-centro', 'bloque-izquierda'] as const;
export type PartidoId = (typeof PARTIDOS_IDS)[number];

/** Construcción política: de Desconocido a Prócer. */
export const ETAPAS = ['desconocido', 'conocido', 'referente', 'caudillo', 'procer'] as const;
export type EtapaId = (typeof ETAPAS)[number];

/** Algo para el palmarés: aparece en el balance del período y en el final. */
export interface Logro {
  anio: number;
  icono: string;
  texto: string;
}

/** Una oferta del cierre de listas: quedarte en tu partido o pasarte a otro. */
export interface OfertaPase {
  partido: PartidoId;
  renovacion: boolean;
  cargo: CargoId;
  caja: number;
  fama: number;
  construccion: number;
  imagen: number;
  /** Irte a un espacio opuesto: la gente no te lo perdona. */
  imperdonable: boolean;
}

/** Una foto de tus números para comparar períodos. */
export interface Foto {
  poder: number;
  fama: number;
  imagen: number;
  caja: number;
  construccion: number;
}

/** Pantallas que se muestran una vez, en orden, antes de seguir. */
export type Pendiente =
  | { tipo: 'jura'; cargo: CargoId; partido: PartidoId }
  | { tipo: 'etapa'; etapa: EtapaId }
  | { tipo: 'balance'; desde: number; hasta: number; antes: Foto; despues: Foto };

export interface FilaTrayectoria {
  anio: number;
  edad: number;
  cargo: CargoId;
  partido: PartidoId;
  poder: number;
  fama: number;
  imagen: number;
  construccion: number;
}

/** Alguien en la boleta: vos, un rival generado o un personaje del elenco. */
export interface Candidato {
  nombre: string;
  partido: PartidoId;
  /** Qué tan fuerte llega a la elección, de 1 a 100. */
  fuerza: number;
  jugador?: boolean;
  /** Si es un personaje del elenco, su apodo. */
  apodo?: string;
  /** Va por fuera de su partido. */
  frentePropio?: boolean;
}

/** Cómo terminó una votación: porcentaje de votos válidos de cada candidato, en el mismo orden. */
export interface ResultadoVotacion {
  titulo: string;
  candidatos: Candidato[];
  votos: number[];
  /** Votantes que fueron a votar, para el contador de la urna. */
  votantes: number;
}

export type FaseEleccion = 'candidatura' | 'interna' | 'campania' | 'debate' | 'fiscalizacion' | 'escrutinio';

export type TipoIncidente = 'boletas' | 'acta' | 'cadena' | 'urna';

/** Algo que salta en una mesa la noche de la elección. Los tiempos van en segundos desde que arranca. */
export interface IncidenteMesa {
  mesa: number;
  tipo: TipoIncidente;
  aparece: number;
  /** Cuánto tiempo hay para que llegue un fiscal. */
  plazo: number;
  /** Cuántos votos pesa: más en las mesas sin fiscal fijo. */
  peso: number;
}

/** La fiscalización de la general, mientras dura. Los votos ya están contados en `generales`. */
export interface FiscalizacionEnCurso {
  mesas: number;
  /** Las mesas con fiscal fijo. */
  cubiertas: number[];
  /** Tus fiscales volantes. */
  fiscales: number;
  incidentes: IncidenteMesa[];
}

/** Mandaste un fiscal a un incidente, en ese segundo. */
export interface EnvioFiscal {
  incidente: number;
  segundo: number;
}

/** El debate antes de la general a intendente, gobernador o presidente. */
export interface DebateEnCurso {
  /** El rival principal, que tira las chicanas. */
  rival: string;
  preguntas: string[];
  /** Por pregunta, en qué orden se muestran las respuestas (índices de `TIPOS_RESPUESTA`). */
  ordenes: number[][];
  /** Lo que elegiste en cada una, en el orden mostrado; −1 si te quedaste en blanco. */
  respuestas: number[];
  /** Los candidatos de la general, con tu fuerza antes del debate. */
  candidatos: Candidato[];
}
export type OpcionInterna = 'lapicera' | 'paso' | 'romper';
export type NivelCampania = 'austera' | 'normal' | 'fuerte' | 'negra';

/** Cómo avanza una causa en tu contra, de la denuncia al pedido de detención. */
export const ETAPAS_JUDICIALES = ['denuncia', 'imputacion', 'indagatoria', 'procesamiento'] as const;
export type EtapaJudicial = (typeof ETAPAS_JUDICIALES)[number];

export interface Proceso {
  etapa: EtapaJudicial;
  /** Año en que se abrió la causa. */
  desde: number;
}

/** Los números del país, mientras sos presidente. */
export interface Pais {
  /** Inflación anual, en %. */
  inflacion: number;
  /** Trabajo y producción, de 0 a 100. */
  actividad: number;
  /** Los dólares del Banco Central, de 0 a 100. */
  reservas: number;
}

/** Los números de tu intendencia o tu provincia, de 0 a 100. */
export interface IndicadoresDistrito {
  /** Si te alcanza la plata. */
  cuentas: number;
  /** Obras, servicios y seguridad. */
  gestion: number;
}

export interface Distrito extends IndicadoresDistrito {
  recibido: IndicadoresDistrito;
  /** Intendencia o provincia. */
  cargo: CargoId;
}

/** Lo que la carrera va dejando para el Poder Histórico y que, si no, se perdería. */
export interface RegistroHistorico {
  /** Mandatos de presidente completos. */
  mandatosPresidente: number;
  /** Cómo entregaste el país cada vez (de −8 a +8). */
  paisNotas: number[];
  /** Nota de gestión de cada intendencia o provincia que entregaste. */
  distritoNotas: number[];
  crisisSuperadas: number;
  promesasCumplidas: number;
}

/** Alguien joven de tu espacio que formás para que crezca (y, quizás, herede tu lugar). */
export interface Delfin {
  id: number;
  nombre: string;
  edad: number;
  /** Lo que puede llegar a ser (25 a 90). */
  talento: number;
  /** De 0 a 100: abajo de 25, se puede ir. */
  lealtad: number;
  /** Cuánto creció: gente propia, cargo, nombre (0 a 100). */
  nivel: number;
  desde: number;
  /** Ganó una banca con tu apoyo. */
  cargo?: boolean;
}

/** Las crisis que pueden caerle a un presidente (ver datos/crisis.ts). */
export type CrisisId = 'corrida' | 'default' | 'hiper' | 'estallido';

export interface CrisisAbierta {
  id: CrisisId;
  /** Año en que empezó. */
  desde: number;
}

export type PedidoRosca = 'obra' | 'cargo' | 'cambio' | 'promesa';

/** Un bloque indeciso: sus bancas y lo que pide para darte los votos. */
export interface BloqueRosca {
  nombre: string;
  diputados: number;
  senadores: number;
  pide: PedidoRosca;
  /** Lo que gasta de tu presupuesto de rosca. */
  costo: number;
  /** El bloque (índice) que se ofende si arreglás con este. */
  rival?: number;
}

/** La negociación de una ley, mientras dura. El proyecto sigue en `evento`. */
export interface RoscaEnCurso {
  bloques: BloqueRosca[];
  fichas: number;
  /** Con quiénes arreglaste (índices). */
  arreglados: number[];
}

/** Tu bloque propio en el Congreso: bancas de tu lado en cada cámara. */
export interface Congreso {
  diputados: number;
  senadores: number;
}

/** Una promesa de campaña que tenés que cumplir mientras dure el mandato. */
export interface PromesaActiva {
  id: string;
  cargo: CargoId;
  /** Hasta qué año dura el compromiso. */
  hasta: number;
}

export interface EleccionEnCurso {
  fase: FaseEleccion;
  /** Las promesas que hiciste en esta campaña. */
  promesas?: string[];
  cargo?: CargoId;
  rivalInterno?: Candidato;
  frentePropio?: boolean;
  /** La PASO interna, si fuiste a una. */
  paso?: ResultadoVotacion;
  generales?: ResultadoVotacion;
  balotaje?: ResultadoVotacion;
  gano?: boolean;
  /** Mientras se debate. */
  debate?: DebateEnCurso;
  /** Cuánta fuerza te dio (o te sacó) el debate. */
  ajusteDebate?: number;
  /** Mientras se fiscaliza. */
  fiscalizacion?: FiscalizacionEnCurso;
  /** Cuántos puntos de tu porcentaje movió la fiscalización. */
  ajusteFiscalizacion?: number;
}

/** Una línea de la libreta: quién te debe o a quién le debés. */
export interface Favor {
  /** Con quién es la deuda, como texto: "Hugo Medrano", "Ramón Pérez, contratista de obra pública". */
  quien: string;
  /** true: vos le debés. false: te debe a vos. */
  debes: boolean;
  anio: number;
  motivo: string;
}

/** El evento que interrumpe el año, hasta que lo resolvés. */
export interface EventoEnCurso {
  id: string;
  /** Quién habla, si es alguien generado: queda fijo para que no cambie al recargar. */
  nombre?: string;
  semillaRetrato: number;
  /** En los eventos de delfines: de cuál se habla. */
  delfin?: number;
  /** En el cobro de un favor: quién te lo viene a cobrar. */
  quien?: string;
}

/** Lo que compraste en la tienda. Los consumibles duran hasta el año indicado. */
export interface Compra {
  id: string;
  hasta?: number;
}

export type MotivoFin = 'retiro' | 'privado' | 'salud' | 'muerte' | 'preso' | 'exilio' | 'destituido' | 'renuncia' | 'caos';

/** Qué hacés cuando llega una orden de detención. */
export type SalidaDetencion = 'entregarse' | 'pelear' | 'exilio';

export interface EntradaHistorial {
  anio: number;
  edad: number;
  lineas: string[];
}

export const ORIGENES = ['universitaria', 'sindicato', 'empresario', 'outsider', 'puntero', 'dinastia'] as const;
export type Origen = (typeof ORIGENES)[number];

export const ESTILOS = ['idealista', 'pragmatico', 'transa'] as const;
export type Estilo = (typeof ESTILOS)[number];

/** Dos ejes de −100 a 100. */
export interface Ideologia {
  /** −100 Estado, +100 Mercado. */
  economia: number;
  /** −100 Conservador, +100 Progresista. */
  social: number;
}

export type MedioId = 'radio' | 'streaming' | 'television';

export interface EntrevistaEnCurso {
  medio: MedioId;
  /** Ids de las preguntas sorteadas, en orden. */
  preguntas: string[];
  /** Índice de la respuesta elegida en cada pregunta; −1 es quedarse callado. */
  respuestas: number[];
}

export interface Carrera {
  version: 9;
  semilla: number;
  azar: EstadoAzar;
  nombre: string;
  /** Provincia natal: se sortea, no se elige. */
  provincia: string;
  /** Dónde hacés política hoy. Arranca en la natal; se puede mudar a Buenos Aires. */
  base: string;
  origen: Origen;
  ideologia: Ideologia;
  /** No se cambia en toda la carrera. */
  estilo: Estilo;
  cartaArranque: string;
  anioInicio: number;
  anio: number;
  edad: number;
  cargo: CargoId;
  /** Hasta qué año dura el cargo electivo que tenés. */
  mandatoHasta?: number;
  /** Cuántos mandatos seguidos llevás en el mismo cargo electivo. */
  mandatosSeguidos?: number;
  /** El escalón más alto al que llegaste: algunos cargos piden experiencia. */
  mejorRango: number;
  partido: PartidoId;
  /** Desde qué año estás en este partido: la lealtad suma construcción. */
  partidoDesde: number;
  /** Construcción política, de 0 a 100. */
  construccion: number;
  atributos: Atributos;
  medidores: Medidores;
  /** Las tres cartas del armado del año en curso. */
  cartas: Carta[];
  historial: EntradaHistorial[];
  /** Hay una orden de detención: antes de seguir hay que decidir qué hacer. */
  detencion?: boolean;
  /** Cuánto se movió cada número en el último paso, para las flechas de la ficha. */
  cambios?: Partial<Record<Atributo | Medidor, number>>;
  /** Año de la última entrevista comprada en la tienda: una por año. */
  ultimaEntrevista?: number;
  /** Los años de militancia (18 a 35), mientras duran: en qué etapa vas. */
  formacion?: { paso: number };
  /** Entrevista en curso: se guarda pregunta a pregunta. */
  entrevista?: EntrevistaEnCurso;
  /** Cierre de listas abierto: hay que decidir antes de seguir. */
  pases?: OfertaPase[];
  /** Año electoral: la elección en curso, fase por fase. */
  eleccion?: EleccionEnCurso;
  favores: Favor[];
  evento?: EventoEnCurso;
  /** Estás negociando el proyecto de ley en curso. */
  rosca?: RoscaEnCurso;
  /** Lo que llega después del evento en curso, el mismo año (el proyecto de ley del presidente). */
  cola?: EventoEnCurso[];
  /** Tu bloque en el Congreso, mientras sos presidente. */
  congreso?: Congreso;
  /** Para el Poder Histórico. */
  historico?: Partial<RegistroHistorico>;
  /** Tu intendencia o tu provincia, mientras la gobernás. */
  distrito?: Distrito;
  /** El partido que gobierna la Nación (si no sos vos): define la coparticipación. */
  oficialismo?: PartidoId;
  /** Cómo entregaste tu última intendencia o provincia: pesa en las elecciones de los cuatro años siguientes. */
  legadoGestion?: { cargo: CargoId; anio: number; valor: number };
  /** Las crisis abiertas del presidente: pesan cada año hasta que salís. */
  crisis?: CrisisAbierta[];
  /** Leyes que lograste aprobar (ids), para el palmarés y el Poder Histórico. */
  leyes?: string[];
  /** Último año en que salió cada evento, para que no se repitan seguido. */
  eventosVistos: Record<string, number>;
  /** Cuántas coimas aceptaste. */
  coimas?: number;
  /** Plata en negro: no figura en ningún lado, hasta que la encuentran. */
  cajaNegra: number;
  /** Si alguna vez usaste plata negra o coimas: se pierden las manos limpias. */
  negroUsado?: boolean;
  /** La causa abierta en tu contra, si hay una. */
  proceso?: Proceso;
  /** El país que gobernás, si sos presidente: cómo está y cómo lo recibiste. */
  pais?: Pais & { recibido: Pais };
  /** Las promesas de campaña vigentes. */
  promesas?: PromesaActiva[];
  /** Años en que rompiste una promesa: la gente se acuerda. */
  promesasRotas?: number[];
  /** Años en que decidiste contra lo que pensás. */
  incoherencias?: number[];
  /** Cuántas veces no te metiste en este mandato (para la promesa de estar cerca). */
  ausencias?: number;
  /** Bronca en la calle, de 0 a 100: huelgas y movilizaciones. */
  malestar?: number;
  /** Año en que dejaste la presidencia. */
  expresidente?: number;
  /** Último año de cada movida por debajo de la mesa: una por año. */
  movidas: Record<string, number>;
  pendientes: Pendiente[];
  palmares: Logro[];
  trayectoria: FilaTrayectoria[];
  compras: Compra[];
  /** Dónde arrancó el período de cuatro años en curso. */
  inicioPeriodo: { anio: number } & Foto;
  /** Si sos el delfín de una carrera anterior. */
  padrino?: { nombre: string; partido: PartidoId };
  /** Tus delfines (hasta dos). */
  delfines?: Delfin[];
  /** El último año en que sumaste un delfín. */
  delfinFormado?: number;
  /** Cuántos delfines se fueron a otro partido. */
  traiciones?: number;
  fin: { motivo: MotivoFin; anio: number; edad: number } | null;
}
