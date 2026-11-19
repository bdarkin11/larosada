import type { Atributo, Estilo, Medidor, Origen, Rareza } from '../motor/tipos';

/** Cambios sobre atributos y medidores. La caja va en dólares. */
export type Ajustes = Partial<Record<Atributo | Medidor, number>>;

export interface DefOrigen {
  nombre: string;
  descripcion: string;
  ajustes: Ajustes;
}

export const ORIGEN: Record<Origen, DefOrigen> = {
  universitaria: {
    nombre: 'Militancia universitaria',
    descripcion: 'Asambleas, centro de estudiantes y muchas ideas. Poca plata.',
    ajustes: { fama: 6, gestion: 5 },
  },
  sindicato: {
    nombre: 'Sindicato',
    descripcion: 'Aparato y calle desde el primer día. Los medios no te quieren.',
    ajustes: { territorio: 10, rosca: 5, imagen: -8, caja: 2000, poder: 5 },
  },
  empresario: {
    nombre: 'Empresario',
    descripcion: 'Plata para arrancar y gente que sabe gestionar. Ninguna base.',
    ajustes: { gestion: 6, territorio: -5, imagen: -3, caja: 60000, poder: 5 },
  },
  outsider: {
    nombre: 'Outsider mediático',
    descripcion: 'Te conoce todo el país por la tele. No tenés ni un fiscal de mesa.',
    ajustes: { fama: 30, territorio: -8, rosca: -5 },
  },
  puntero: {
    nombre: 'Puntero barrial',
    descripcion: 'Conocés cada pasillo del barrio. Arriba no te conoce nadie.',
    ajustes: { territorio: 15, rosca: 3, fama: -2, gestion: -3, poder: 5 },
  },
  dinastia: {
    nombre: 'Dinastía política',
    descripcion: 'El apellido abre puertas. También trae las causas de tu viejo.',
    ajustes: { rosca: 8, fama: 12, caja: 20000, causas: 15, poder: 10 },
  },
};

export interface DefEstilo {
  nombre: string;
  descripcion: string;
  ajustes: Ajustes;
}

export const ESTILO: Record<Estilo, DefEstilo> = {
  idealista: {
    nombre: 'Idealista',
    descripcion: 'Nunca vas a aceptar una coima. Subís más lento, pero los carpetazos no te tocan y tu legado vale más.',
    ajustes: { imagen: 8 },
  },
  pragmatico: {
    nombre: 'Pragmático',
    descripcion: 'Transás cuando hace falta, con límites. El camino del medio.',
    ajustes: { rosca: 3 },
  },
  transa: {
    nombre: 'Transa',
    descripcion: 'Todo vale. La caja se llena rápido y la Justicia te mira de cerca.',
    ajustes: { rosca: 5, caja: 5000, imagen: -3 },
  },
};

export interface DefCartaArranque {
  id: string;
  nombre: string;
  descripcion: string;
  rareza: Rareza;
  ajustes: Ajustes;
}

export const CARTAS_ARRANQUE: DefCartaArranque[] = [
  { id: 'pico-de-oro', nombre: 'Pico de oro', descripcion: 'Cuando hablás, la gente se queda.', rareza: 'rara', ajustes: { fama: 5 } },
  {
    id: 'amigo-intendente',
    nombre: 'Amigo del intendente',
    descripcion: 'Te atiende el teléfono. Eso ya es mucho.',
    rareza: 'rara',
    ajustes: { rosca: 6, territorio: 6 },
  },
  {
    id: 'contacto-tribunales',
    nombre: 'Contacto en tribunales',
    descripcion: 'Te avisan antes de que algo se mueva.',
    rareza: 'rara',
    ajustes: { rosca: 4, causas: -10 },
  },
  {
    id: 'barrio-propio',
    nombre: 'El barrio es tuyo',
    descripcion: 'Creciste ahí y todos lo saben.',
    rareza: 'comun',
    ajustes: { territorio: 8 },
  },
  { id: 'tecnico', nombre: 'Perfil técnico', descripcion: 'Sabés de números y de presupuesto.', rareza: 'comun', ajustes: { gestion: 8 } },
  {
    id: 'deportista',
    nombre: 'Ex deportista',
    descripcion: 'Buena salud y una cara conocida en el club.',
    rareza: 'comun',
    ajustes: { territorio: 3, fama: 4 },
  },
  { id: 'herencia', nombre: 'Una herencia', descripcion: 'Una plata que no esperabas.', rareza: 'comun', ajustes: { caja: 25000 } },
  {
    id: 'periodista-amigo',
    nombre: 'Periodista amigo',
    descripcion: 'Alguien en los medios que habla bien de vos.',
    rareza: 'comun',
    ajustes: { fama: 6, imagen: 6 },
  },
  {
    id: 'carrera-meteorica',
    nombre: 'Carrera meteórica',
    descripcion: 'Todo te sale. Por ahora.',
    rareza: 'dorada',
    ajustes: { fama: 11, rosca: 6 },
  },
  {
    id: 'padrino',
    nombre: 'Padrino político',
    descripcion: 'Un caudillo te eligió como su heredero.',
    rareza: 'iconica',
    ajustes: { rosca: 12, territorio: 12, fama: 10, caja: 30000 },
  },
];

/** Probabilidad de que una de las tres cartas de arranque sea la icónica. */
export const PROBABILIDAD_ARRANQUE_ICONICA = 0.01;

export function buscarCartaArranque(id: string): DefCartaArranque {
  const carta = CARTAS_ARRANQUE.find((c) => c.id === id);
  if (!carta) throw new Error(`Carta de arranque desconocida: ${id}`);
  return carta;
}
