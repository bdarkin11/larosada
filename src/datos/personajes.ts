import type { Atributos, CargoId, PartidoId } from '../motor/tipos';

/**
 * Políticos del elenco: personajes ficticios, con rasgos tomados del perfil
 * de figuras públicas. Acá solo compiten en elecciones; nunca se les asigna
 * corrupción por guion.
 */
export interface Personaje {
  id: string;
  nombre: string;
  apodo?: string;
  partido: PartidoId;
  nacimiento: number;
  atributos: Atributos;
  /** Fama con la que llega a una elección nacional. */
  fama: number;
  /** A qué se presenta. */
  compite: CargoId[];
  /** Si solo compite en una provincia. */
  provincia?: string;
}

export const PERSONAJES: Personaje[] = [
  {
    id: 'clarisa',
    nombre: 'Clarisa Ferreyra',
    apodo: 'la Jefa',
    partido: 'frente-nacional',
    nacimiento: 1953,
    atributos: { rosca: 80, territorio: 85, gestion: 60 },
    fama: 93,
    compite: ['presidente', 'senador'],
  },
  {
    id: 'maximo',
    nombre: 'Máximo Ferreyra',
    partido: 'frente-nacional',
    nacimiento: 1977,
    atributos: { rosca: 70, territorio: 75, gestion: 45 },
    fama: 51,
    compite: ['diputado'],
    provincia: 'Buenos Aires',
  },
  {
    id: 'mancini',
    nombre: 'Marcelo Mancini',
    apodo: 'el Ingeniero',
    partido: 'union-republicana',
    nacimiento: 1959,
    atributos: { rosca: 65, territorio: 50, gestion: 70 },
    fama: 77,
    compite: ['presidente'],
  },
  {
    id: 'mileto',
    nombre: 'Gabriel Mileto',
    apodo: 'el León',
    partido: 'libertad',
    nacimiento: 1970,
    atributos: { rosca: 40, territorio: 35, gestion: 55 },
    fama: 91,
    compite: ['presidente'],
  },
  {
    id: 'villalba',
    nombre: 'Victoria Villalba',
    partido: 'libertad',
    nacimiento: 1975,
    atributos: { rosca: 55, territorio: 40, gestion: 50 },
    fama: 66,
    compite: ['presidente', 'senador'],
  },
  {
    id: 'burgos',
    nombre: 'Patricia Burgos',
    partido: 'union-republicana',
    nacimiento: 1956,
    atributos: { rosca: 70, territorio: 45, gestion: 65 },
    fama: 74,
    compite: ['presidente', 'senador'],
  },
  {
    id: 'massot',
    nombre: 'Ezequiel Massot',
    partido: 'coalicion-centro',
    nacimiento: 1972,
    atributos: { rosca: 95, territorio: 70, gestion: 55 },
    fama: 76,
    compite: ['presidente', 'gobernador'],
    provincia: 'Buenos Aires',
  },
  {
    id: 'kovalenko',
    nombre: 'Axel Kovalenko',
    partido: 'frente-nacional',
    nacimiento: 1971,
    atributos: { rosca: 55, territorio: 70, gestion: 60 },
    fama: 76,
    compite: ['gobernador', 'presidente'],
    provincia: 'Buenos Aires',
  },
  {
    id: 'larrea',
    nombre: 'Horacio Larrea',
    partido: 'union-republicana',
    nacimiento: 1965,
    atributos: { rosca: 70, territorio: 55, gestion: 85 },
    fama: 55,
    compite: ['gobernador', 'presidente'],
    provincia: 'Ciudad de Buenos Aires',
  },
  {
    id: 'loustal',
    nombre: 'Martín Loustal',
    partido: 'coalicion-centro',
    nacimiento: 1970,
    atributos: { rosca: 75, territorio: 40, gestion: 65 },
    fama: 63,
    compite: ['senador', 'gobernador'],
    provincia: 'Ciudad de Buenos Aires',
  },
  {
    id: 'carrizo',
    nombre: 'Elisa Carrizo',
    apodo: 'Lilita',
    partido: 'coalicion-centro',
    nacimiento: 1956,
    atributos: { rosca: 40, territorio: 30, gestion: 40 },
    fama: 75,
    compite: ['diputado', 'presidente'],
  },
  {
    id: 'insua',
    nombre: 'Gildo Insúa',
    apodo: 'el gobernador eterno',
    partido: 'frente-nacional',
    nacimiento: 1951,
    atributos: { rosca: 85, territorio: 99, gestion: 50 },
    fama: 51,
    compite: ['gobernador'],
    provincia: 'Formosa',
  },
];

/** Después de esta edad, los personajes del elenco ya no son candidatos. */
export const EDAD_RETIRO_PERSONAJES = 80;

/** Figuras del elenco que no son candidatas: aparecen en eventos, siempre con su perfil público. */
export interface Figura {
  id: string;
  nombre: string;
  rol: string;
  nacimiento: number;
  /** Si sigue en pantalla más allá de la edad de retiro general. */
  retiro?: number;
}

export const FIGURAS: Figura[] = [
  { id: 'hugo-medrano', nombre: 'Hugo Medrano', rol: 'Líder de los camioneros', nacimiento: 1944 },
  { id: 'pablo-medrano', nombre: 'Pablo Medrano', rol: 'Dirigente de los camioneros', nacimiento: 1970 },
  { id: 'grabovsky', nombre: 'Juan Grabovsky', rol: 'Referente de los movimientos sociales', nacimiento: 1983 },
  { id: 'rocchi', nombre: 'Paolo Rocchi', rol: 'Industrial del acero y la energía', nacimiento: 1952 },
  { id: 'alcorta', nombre: 'Hugo Alcorta', rol: 'Periodista de investigación', nacimiento: 1971 },
  { id: 'legran', nombre: 'Mirna Legrán', rol: 'Conductora de almuerzos televisivos', nacimiento: 1927, retiro: 102 },
  { id: 'tirelli', nombre: 'Marcelo Tirelli', rol: 'Conductor de televisión', nacimiento: 1960 },
  { id: 'jimenez', nombre: 'Susana Jiménez', rol: 'Diva de la televisión', nacimiento: 1944 },
  { id: 'messina', nombre: 'Leandro Messina', rol: 'El ídolo de la Selección', nacimiento: 1987 },
  { id: 'insua', nombre: 'Gildo Insúa', rol: 'Gobernador de Formosa', nacimiento: 1951 },
];

/** Hasta qué edad una figura sigue apareciendo. */
export const EDAD_RETIRO_FIGURAS = 85;
