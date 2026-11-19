import type { Carrera } from '../motor/tipos';
import type { DefEvento, Resultado } from './eventos';
import type { Etiqueta, Postura } from './promesas';

/**
 * El Congreso y los proyectos de ley del presidente. Cada año de mandato llega
 * uno: lo mandás al Congreso (sale o no, según tu bloque, tu Rosca y tu Poder),
 * lo sacás por decreto si se puede, o lo guardás.
 */

export const DIPUTADOS = 257;
export const SENADORES = 72;
export const MAYORIA_DIPUTADOS = 129;
export const MAYORIA_SENADO = 37;

/** Si por algún motivo no hay bloque armado (partidas viejas), uno típico. */
export const BLOQUE_TIPICO = { diputados: 110, senadores: 30 };

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * La chance de que una ley salga. Con mayoría propia en las dos cámaras, 92 %;
 * cada punto que te falta en la cámara más flaca la baja mucho. La Rosca y el
 * Poder suman o restan hasta 20 puntos cada uno, y las leyes difíciles restan.
 */
export function chanceLey(c: Carrera, dificultad = 0): number {
  const b = c.congreso ?? BLOQUE_TIPICO;
  const cubre = Math.min(b.diputados / MAYORIA_DIPUTADOS, b.senadores / MAYORIA_SENADO, 1);
  const base = 0.92 - (1 - cubre) * 1.6;
  const rosca = (c.atributos.rosca - 50) / 250;
  const poder = (c.medidores.poder - 50) / 250;
  return acotar(base + rosca + poder - dificultad, 0.05, 0.95);
}

const presidente = (c: Carrera) => c.cargo === 'presidente';

/** Lo que resta mandar una ley sin mayoría y sin rosquearla vos. */
export const CASTIGO_SIN_ROSCA = 0.1;

const sinMayoria = (c: Carrera) => {
  const b = c.congreso ?? BLOQUE_TIPICO;
  return b.diputados < MAYORIA_DIPUTADOS || b.senadores < MAYORIA_SENADO;
};

/** La chance de mandarla sin negociar. */
export const chanceSinRosca = (c: Carrera, dificultad: number) =>
  acotar(chanceLey(c, dificultad) - (sinMayoria(c) ? CASTIGO_SIN_ROSCA : 0), 0.05, 0.95);

interface DefLey {
  id: string;
  rol: string;
  titulo: string;
  texto: string;
  /** Lo que se insinúa de la ley, sin números. */
  pista: string;
  /** Resta a la chance: las leyes que tocan intereses grandes cuestan más. */
  dificultad: number;
  /** Si se puede sacar por decreto (las de impuestos y las penales, no). */
  decreto: boolean;
  postura?: Postura;
  etiquetas?: Etiqueta[];
  /** Lo que pasa si sale. */
  aprobada: string;
  efecto: Pick<Resultado, 'efectos' | 'pais' | 'malestar'>;
}

const RECHAZO: Resultado = { texto: 'El Congreso te la rechazó. Quedaste expuesto.', efectos: { poder: -3, imagen: -1 } };

function ley(d: DefLey): DefEvento {
  const sale: Resultado = { texto: d.aprobada, ...d.efecto, ley: d.id };
  const porDecreto: Resultado = {
    ...sale,
    texto: `${d.aprobada} Por decreto: el Congreso y la calle no te lo perdonan.`,
    efectos: { ...d.efecto.efectos, poder: (d.efecto.efectos?.poder ?? 0) - 3 },
    malestar: (d.efecto.malestar ?? 0) + 8,
  };
  return {
    id: d.id,
    especial: 'ley',
    quien: { rol: d.rol },
    titulo: d.titulo,
    texto: d.texto,
    condicion: presidente,
    opciones: [
      {
        texto: 'Mandarla al Congreso',
        pista: d.pista,
        postura: d.postura,
        etiquetas: d.etiquetas,
        resultado: { chance: (c) => chanceSinRosca(c, d.dificultad), exito: sale, fracaso: RECHAZO },
      },
      {
        texto: 'Rosquearla vos',
        pista: 'Negociás bloque por bloque. Si la mandás sin rosquear y sin mayoría, sale menos.',
        requiere: (c) => (sinMayoria(c) ? null : 'Tenés mayoría propia: no hace falta.'),
        postura: d.postura,
        etiquetas: d.etiquetas,
        rosca: { dificultad: d.dificultad },
        resultado: { chance: (c) => chanceSinRosca(c, d.dificultad), exito: sale, fracaso: RECHAZO },
      },
      {
        texto: 'Sacarla por decreto',
        pista: 'Sale seguro. Gobernar por decreto tiene su precio.',
        requiere: () => (d.decreto ? null : 'Esta ley no se puede sacar por decreto.'),
        postura: d.postura,
        etiquetas: d.etiquetas,
        resultado: porDecreto,
      },
      {
        texto: 'Guardarla en un cajón',
        pista: 'No arriesgás nada. Tampoco hacés nada.',
        pasiva: true,
        resultado: { texto: 'La guardaste. Otro año será.', efectos: { poder: -1 } },
      },
    ],
  };
}

export const LEYES: DefEvento[] = [
  ley({
    id: 'ley-emergencia',
    rol: 'Jefe de Gabinete',
    titulo: 'Emergencia económica',
    texto: 'Con la ley de emergencia manejamos el presupuesto sin pedirle permiso a nadie. La oposición dice que son superpoderes.',
    pista: 'Más margen para gobernar. La oposición grita.',
    dificultad: 0.05,
    decreto: true,
    postura: { economia: -1 },
    aprobada: 'Salió la ley de emergencia económica.',
    efecto: { pais: { reservas: 6, inflacion: -5 }, efectos: { poder: 3, imagen: -2 } },
  }),
  ley({
    id: 'ley-baja-impuestos',
    rol: 'Ministro de Economía',
    titulo: 'Bajar impuestos',
    texto: 'Si bajamos los impuestos al trabajo y a la producción, las empresas contratan. Lo que deja de entrar, lo vamos a extrañar.',
    pista: 'La economía se mueve. Las cuentas sufren.',
    dificultad: 0.1,
    decreto: false,
    postura: { economia: 1 },
    aprobada: 'Bajaste impuestos al trabajo y a la producción.',
    efecto: { pais: { actividad: 6, reservas: -6 }, efectos: { imagen: 2 } },
  }),
  ley({
    id: 'ley-grandes-fortunas',
    rol: 'Presidente del bloque',
    titulo: 'Aporte de las grandes fortunas',
    texto: 'Un aporte por única vez de los que más tienen. La gente lo aplaude; los que invierten ya están mirando el aeropuerto.',
    pista: 'Entra plata y aplausos. Los empresarios no olvidan.',
    dificultad: 0.15,
    decreto: false,
    postura: { economia: -1 },
    etiquetas: ['impuestos'],
    aprobada: 'Salió el aporte de las grandes fortunas.',
    efecto: { pais: { reservas: 8, actividad: -3 }, efectos: { imagen: 2, poder: -2 } },
  }),
  ley({
    id: 'ley-previsional',
    rol: 'Ministro de Economía',
    titulo: 'Reforma previsional',
    texto: 'El sistema jubilatorio no cierra. Con la reforma se ordena, pero los jubilados cobran menos. Va a haber piedras en la plaza.',
    pista: 'Ordena las cuentas. La plaza se llena.',
    dificultad: 0.2,
    decreto: false,
    postura: { economia: 1 },
    etiquetas: ['ajuste'],
    aprobada: 'Salió la reforma previsional.',
    efecto: { pais: { inflacion: -8, reservas: 6 }, efectos: { imagen: -3, poder: 2 }, malestar: 15 },
  }),
  ley({
    id: 'ley-alquileres',
    rol: 'Diputada del bloque',
    titulo: 'Ley de alquileres',
    texto:
      'Los inquilinos no llegan a fin de mes. Con la ley ponemos reglas a los aumentos. Los propietarios dicen que van a sacar las casas del mercado.',
    pista: 'Alivio para los inquilinos. Los dueños se retiran.',
    dificultad: 0.05,
    decreto: true,
    postura: { economia: -1 },
    aprobada: 'Salió la ley de alquileres.',
    efecto: { pais: { actividad: -2 }, efectos: { imagen: 2 } },
  }),
  ley({
    id: 'ley-privatizaciones',
    rol: 'Ministro de Economía',
    titulo: 'Privatizaciones',
    texto:
      'Las empresas del Estado pierden plata todos los meses. Si las vendemos, entran dólares. Los gremios ya están armando la marcha.',
    pista: 'Entran dólares. Los gremios salen a la calle.',
    dificultad: 0.2,
    decreto: false,
    postura: { economia: 1 },
    aprobada: 'Salió la ley de privatizaciones.',
    efecto: { pais: { reservas: 12, actividad: 2 }, efectos: { imagen: -2 }, malestar: 10 },
  }),
  ley({
    id: 'ley-financiamiento-universitario',
    rol: 'Rectora de la universidad pública',
    titulo: 'Financiamiento universitario',
    texto:
      'Las universidades no llegan a pagar la luz. Con la ley se actualiza el presupuesto. Su ministro de Economía dice que no hay de dónde.',
    pista: 'La universidad te aplaude. La plata sale de algún lado.',
    dificultad: 0.05,
    decreto: false,
    postura: { economia: -1 },
    aprobada: 'Salió la ley de financiamiento universitario.',
    efecto: { pais: { inflacion: 6, reservas: -3 }, efectos: { imagen: 3 } },
  }),
  ley({
    id: 'ley-acuerdo-fondo',
    rol: 'Ministro de Economía',
    titulo: 'El acuerdo con el Fondo',
    texto:
      'El acuerdo con el Fondo tiene que pasar por el Congreso. Si sale, entran los dólares. Si no sale, el mercado lo va a leer muy mal.',
    pista: 'Dólares frescos. Te ponés de rodillas ante el Fondo.',
    dificultad: 0.1,
    decreto: false,
    postura: { economia: 1 },
    etiquetas: ['fondo'],
    aprobada: 'El Congreso aprobó el acuerdo con el Fondo.',
    efecto: { pais: { reservas: 15, inflacion: -5 }, efectos: { imagen: -2 }, malestar: 8 },
  }),
  ley({
    id: 'ley-penal-juvenil',
    rol: 'Ministra de Seguridad',
    titulo: 'Régimen penal juvenil',
    texto:
      'Bajar la edad de imputabilidad. La gente la pide después de cada caso que sale en la tele. Los organismos de derechos humanos, no.',
    pista: 'La gente la pide. Los organismos te salen al cruce.',
    dificultad: 0.1,
    decreto: false,
    postura: { social: -1 },
    aprobada: 'Salió el nuevo régimen penal juvenil.',
    efecto: { efectos: { imagen: 3, poder: 1 }, malestar: 5 },
  }),
  ley({
    id: 'ley-licencias',
    rol: 'Diputada del bloque',
    titulo: 'Licencias familiares',
    texto:
      'Que los padres también tengan licencia cuando nace un hijo, y más días para las madres. Las pymes dicen que no lo pueden pagar.',
    pista: 'Ampliás derechos. Las pymes se quejan.',
    dificultad: 0.05,
    decreto: true,
    postura: { social: 1 },
    aprobada: 'Salió la ley de licencias familiares.',
    efecto: { pais: { actividad: -2 }, efectos: { imagen: 2 } },
  }),
  ley({
    id: 'ley-ficha-limpia',
    rol: 'Diputado de la oposición',
    titulo: 'Ficha limpia',
    texto: 'Que nadie con condena pueda ser candidato. La gente la quiere. En su propio bloque hay varios que la miran con miedo.',
    pista: 'Ganás en imagen. Tu propia tropa se incomoda.',
    dificultad: 0.15,
    decreto: false,
    aprobada: 'Salió la ley de ficha limpia.',
    efecto: { efectos: { imagen: 4, poder: -3 } },
  }),
];
