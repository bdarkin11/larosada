import { crearAzar, elegir, siguiente } from '../motor/azar';

/** Un número estable a partir de un texto: el mismo nombre, el mismo retrato. */
export function semillaDe(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

const PIELES = ['#f1d3b8', '#e3b48f', '#c98e66', '#a86b45', '#7a4b2e'];
const PELOS = ['#1d1612', '#3b2a1e', '#6b4a2b', '#a8a8a8', '#d9d4c7', '#8c5a2b', '#2a2a2a'];
const SACOS = ['#1f2a3a', '#2d3b4f', '#3a2f2a', '#4a4f57', '#18324a', '#3d1f2a'];
const CORBATAS = ['#b33a3a', '#75aadb', '#d4af37', '#2f6b4a', '#6b3fa0', 'none'];

/**
 * Un retrato propio, en SVG: busto, pelo, anteojos, saco. No representa a
 * nadie en particular: sale de la semilla.
 */
export function retrato(semilla: number, clase = '', edad?: number): string {
  const azar = crearAzar(semilla || 1);
  const piel = elegir(azar, PIELES);
  let pelo = elegir(azar, PELOS);
  // Con los años, las canas (y las arrugas).
  if (edad !== undefined && edad >= 70) pelo = '#e2ded5';
  else if (edad !== undefined && edad >= 55) pelo = '#a9a9a9';
  const arrugas = edad !== undefined && edad >= 50;
  const saco = elegir(azar, SACOS);
  const corbata = elegir(azar, CORBATAS);
  const peinado = Math.floor(siguiente(azar) * 5);
  const anteojos = siguiente(azar) < 0.35;
  const barba = siguiente(azar) < 0.2;
  const fondo = elegir(azar, ['#24364d', '#2a2440', '#203a34', '#3a2a24', '#2c2c3a']);

  const cabello = [
    // corto
    `<path d="M38 52 Q38 26 60 24 Q82 26 82 52 Q78 38 60 36 Q42 38 38 52Z" fill="${pelo}"/>`,
    // pelado con costados
    `<path d="M38 56 Q38 46 42 42 L42 58Z M82 56 Q82 46 78 42 L78 58Z" fill="${pelo}"/>`,
    // largo
    `<path d="M34 92 Q30 30 60 24 Q90 30 86 92 Q82 60 80 50 Q70 36 60 36 Q48 36 40 50 Q38 60 34 92Z" fill="${pelo}"/>`,
    // raya al costado
    `<path d="M37 54 Q36 24 64 23 Q86 26 83 50 Q74 34 52 38 Q42 42 37 54Z" fill="${pelo}"/>`,
    // melena corta
    `<path d="M35 70 Q32 28 60 24 Q88 28 85 70 Q82 46 72 38 Q60 34 48 38 Q38 46 35 70Z" fill="${pelo}"/>`,
  ][peinado];

  return `
    <svg class="retrato ${clase}" viewBox="0 0 120 140" role="img" aria-hidden="true">
      <rect width="120" height="140" rx="10" fill="${fondo}"/>
      <path d="M14 140 Q16 104 44 96 L60 104 L76 96 Q104 104 106 140Z" fill="${saco}"/>
      <path d="M48 96 L60 118 L72 96 L66 94 L60 102 L54 94Z" fill="#f4f4f4"/>
      ${corbata === 'none' ? '' : `<path d="M57 102 L63 102 L65 126 L60 132 L55 126Z" fill="${corbata}"/>`}
      <rect x="52" y="78" width="16" height="20" rx="6" fill="${piel}"/>
      <ellipse cx="60" cy="60" rx="22" ry="27" fill="${piel}"/>
      ${barba ? `<path d="M40 62 Q42 90 60 90 Q78 90 80 62 Q76 80 60 80 Q44 80 40 62Z" fill="${pelo}" opacity="0.85"/>` : ''}
      ${cabello}
      <path d="M48 55 h8 M64 55 h8" stroke="#2a1e18" stroke-width="2" stroke-linecap="round"/>
      <circle cx="52" cy="61" r="2.2" fill="#1d1612"/>
      <circle cx="68" cy="61" r="2.2" fill="#1d1612"/>
      ${anteojos ? '<g fill="none" stroke="#1b1b1b" stroke-width="1.8"><circle cx="52" cy="61" r="6"/><circle cx="68" cy="61" r="6"/><path d="M58 61 h4"/></g>' : ''}
      <path d="M60 64 l-2 7 h4" fill="none" stroke="#00000033" stroke-width="1.5"/>
      <path d="M53 76 Q60 79 67 76" fill="none" stroke="#7a3b2e" stroke-width="2" stroke-linecap="round"/>
      ${arrugas ? '<path d="M47 47 h10 M63 47 h10 M45 68 q2 3 4 4 M75 68 q-2 3 -4 4" fill="none" stroke="#00000030" stroke-width="1.3" stroke-linecap="round"/>' : ''}
    </svg>`;
}
