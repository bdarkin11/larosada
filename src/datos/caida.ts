import type { Carrera } from '../motor/tipos';
import { presencia } from './valor';
import type { DefEvento } from './eventos';
import { BLOQUE_TIPICO } from './leyes';

/**
 * El fin anticipado: el juicio político y el pedido de renuncia. Si salen mal,
 * la carrera termina con un final propio.
 */

/** Con un tercio de Diputados propio, la oposición no llega a los dos tercios. */
export const TERCIO_DIPUTADOS = 86;

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Los diputados que te siguen de verdad: con la Imagen por debajo de 70, los
 * tuyos empiezan a no atender el teléfono (con 35 de Imagen, te queda la mitad).
 */
export function diputadosLeales(c: Carrera): number {
  const b = c.congreso ?? BLOQUE_TIPICO;
  return Math.round(b.diputados * Math.min(1, Math.max(0, c.medidores.imagen) / 70));
}

/** Frenar el juicio: hace falta un tercio. Tus leales, tu Rosca y tu Poder. */
export function chanceDeFrenarJuicio(c: Carrera): number {
  return acotar(
    0.15 + 0.45 * (diputadosLeales(c) / TERCIO_DIPUTADOS) + (c.atributos.rosca - 50) / 250 + (c.medidores.poder - 50) / 250,
    0.05,
    0.85,
  );
}

/** Defenderte en persona: tu Fama y lo que te quede de Imagen. */
export function chanceDeDefenderte(c: Carrera): number {
  return acotar(0.25 + (presencia(c) - 50) / 200 + c.medidores.imagen / 200, 0.05, 0.75);
}

/** Aguantar en la Rosada: tu Poder y tu Territorio. */
export function chanceDeResistir(c: Carrera): number {
  return acotar(0.3 + c.medidores.poder / 200 + (c.atributos.territorio - 50) / 250, 0.05, 0.75);
}

export const EVENTOS_CAIDA: DefEvento[] = [
  {
    id: 'juicio-politico',
    especial: 'juicio',
    quien: { rol: 'Presidente de la Cámara de Diputados' },
    titulo: 'Juicio político',
    texto:
      'La oposición juntó las firmas y pidió su juicio político por mal desempeño. Si en Diputados llegan a los dos tercios, el Senado lo juzga. Le aviso que algunos de los suyos ya no atienden el teléfono.',
    opciones: [
      {
        texto: 'Rosquear para frenarlo',
        pista: 'Con un tercio de Diputados alcanza. Cada voto se paga.',
        resultado: {
          chance: chanceDeFrenarJuicio,
          exito: {
            texto: 'Conseguiste el tercio y el juicio no prosperó. Sobreviviste, a un precio alto.',
            efectos: { poder: -4, imagen: -2 },
          },
          fracaso: { texto: 'Los dos tercios aparecieron. El Senado te destituyó.', fin: 'destituido' },
        },
      },
      {
        texto: 'Ir al Congreso a defenderte',
        pista: 'Si das vuelta a la opinión pública, los legisladores te siguen.',
        resultado: {
          chance: chanceDeDefenderte,
          exito: { texto: 'Tu defensa en el Congreso dio vuelta la historia. El juicio se cayó.', efectos: { imagen: 4, poder: -2 } },
          fracaso: { texto: 'Te defendiste y no alcanzó. El Senado te destituyó.', fin: 'destituido' },
        },
      },
      {
        texto: 'Renunciar antes de que te echen',
        pista: 'Te vas por tu cuenta. Es el final.',
        resultado: { texto: 'Renunciaste antes de que te juzgaran.', fin: 'renuncia' },
      },
    ],
  },
  {
    id: 'pedido-renuncia',
    especial: 'renuncia',
    quien: { rol: 'Jefe de Gabinete' },
    titulo: 'Que se vayan todos',
    texto:
      'La Plaza está llena y piden su renuncia. Los gobernadores no atienden, el partido está dividido y las Fuerzas esperan una orden. Lo que decida esta noche define cómo se va a contar esta historia.',
    opciones: [
      {
        texto: 'Renunciar',
        pista: 'Te vas con lo que te queda de dignidad. Es el final.',
        resultado: { texto: 'Presentaste tu renuncia ante la Asamblea Legislativa.', fin: 'renuncia' },
      },
      {
        texto: 'Resistir',
        pista: 'Si aguantás la semana, sobrevivís. Si no, todo termina mal.',
        resultado: {
          chance: chanceDeResistir,
          exito: {
            texto: 'Aguantaste la peor semana de tu gobierno. La calle, de a poco, se calmó.',
            efectos: { poder: 3 },
            malestar: -20,
          },
          fracaso: { texto: 'Resististe hasta que no hubo más nada que resistir.', fin: 'caos' },
        },
      },
      {
        texto: 'Llamar a un gobierno de unidad',
        pista: 'Compartís el poder para no perderlo entero.',
        resultado: {
          texto: 'Llamaste a un gobierno de unidad nacional con la oposición.',
          efectos: { poder: -6, imagen: 2 },
          malestar: -30,
        },
      },
    ],
  },
];
