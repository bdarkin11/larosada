import { entero } from './azar';
import { acotar, anotarHistorico, aplicar, registrarLogro } from './ficha';
import { subirMalestar } from './promesas';
import type { Carrera, Pais } from './tipos';

/**
 * El país, mientras sos presidente: inflación, actividad y reservas. Se
 * mueven solos un poco cada año, y tus decisiones de Estado los mueven mucho.
 */

export const NOMBRE_INDICADOR: Record<keyof Pais, string> = {
  inflacion: 'Inflación',
  actividad: 'Actividad',
  reservas: 'Reservas',
};

export const ICONO_INDICADOR: Record<keyof Pais, string> = {
  inflacion: '📈',
  actividad: '🏭',
  reservas: '🏦',
};

/** Si subir este indicador es bueno: la inflación es lo único que conviene bajar. */
export const indicadorBueno = (clave: keyof Pais, cantidad: number) => (clave === 'inflacion' ? cantidad < 0 : cantidad > 0);

/** Con las reservas por debajo de esto, hay corrida: el dólar se dispara. */
export const RESERVAS_CORRIDA = 20;

const acotarPais = (p: Pais): Pais => ({
  inflacion: acotar(Math.round(p.inflacion), 0, 500),
  actividad: acotar(Math.round(p.actividad), 0, 100),
  reservas: acotar(Math.round(p.reservas), 0, 100),
});

/** Al asumir, heredás el país como está: a veces bien, a veces en crisis. */
export function recibirPais(carrera: Carrera) {
  const recibido: Pais = {
    inflacion: entero(carrera.azar, 15, 120),
    actividad: entero(carrera.azar, 35, 60),
    reservas: entero(carrera.azar, 15, 55),
  };
  carrera.pais = { ...recibido, recibido };
}

export function moverPais(carrera: Carrera, cambio: Partial<Pais>) {
  if (!carrera.pais) return;
  const p = carrera.pais;
  const nuevo = acotarPais({
    inflacion: p.inflacion + (cambio.inflacion ?? 0),
    actividad: p.actividad + (cambio.actividad ?? 0),
    reservas: p.reservas + (cambio.reservas ?? 0),
  });
  Object.assign(p, nuevo);
}

/** Al cerrar el año: el país se mueve solo y se hace sentir en tu imagen y en la calle. */
export function anioDelPais(carrera: Carrera): string[] {
  const p = carrera.pais;
  if (!p) return [];
  const lineas: string[] = [];
  // La inercia: sin reservas, la inflación se acelera; con la economía recalentada, también.
  const inercia = (p.reservas < 25 ? 10 : 0) + (p.actividad > 65 ? 5 : 0) + (p.inflacion > 100 ? 5 : -3);
  moverPais(carrera, {
    inflacion: inercia,
    actividad: (50 - p.actividad) * 0.1 - (p.inflacion > 100 ? 4 : 0),
    reservas: (40 - p.reservas) * 0.1,
  });
  let imagen = 0;
  let calle = 0;
  if (p.inflacion >= 100) {
    imagen -= 4;
    calle += 8;
  } else if (p.inflacion >= 50) {
    imagen -= 2;
    calle += 4;
  } else if (p.inflacion <= 15) imagen += 2;
  if (p.actividad < 40) {
    imagen -= 2;
    calle += 8;
  } else if (p.actividad > 60) imagen += 1;
  if (imagen) aplicar(carrera, 'imagen', imagen);
  if (calle) subirMalestar(carrera, calle);
  lineas.push(
    `El país: inflación ${p.inflacion} %, actividad ${p.actividad}, reservas ${p.reservas}${imagen ? ` (Imagen ${imagen > 0 ? '+' : '−'}${Math.abs(imagen)})` : ''}.`,
  );
  return lineas;
}

/** Al dejar la Rosada: cómo dejaste el país queda en tu historia. */
export function entregarPais(carrera: Carrera, lineas: string[]) {
  const p = carrera.pais;
  if (!p) return;
  const r = p.recibido;
  lineas.push(
    `Entregaste el país con inflación ${p.inflacion} % (recibiste ${r.inflacion} %), actividad ${p.actividad} (${r.actividad}) y reservas ${p.reservas} (${r.reservas}).`,
  );
  if (p.inflacion < r.inflacion - 10) registrarLogro(carrera, '📉', `Bajaste la inflación del ${r.inflacion} % al ${p.inflacion} %`);
  if (p.inflacion > r.inflacion + 30) registrarLogro(carrera, '📈', `Dejaste la inflación en ${p.inflacion} %`);
  // Cómo dejaste el país es la imagen con la que te vas.
  const balance = (r.inflacion - p.inflacion) / 20 + (p.actividad - r.actividad) / 5 + (p.reservas - r.reservas) / 10;
  const imagen = Math.round(acotar(balance, -8, 8));
  anotarHistorico(carrera, 'paisNotas', acotar(balance, -8, 8));
  if (imagen) {
    aplicar(carrera, 'imagen', imagen);
    lineas.push(`Cómo dejaste el país pesa en cómo te recuerdan: Imagen ${imagen > 0 ? '+' : '−'}${Math.abs(imagen)}.`);
  }
  delete carrera.pais;
}
