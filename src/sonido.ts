/**
 * Sonidos cortos, sintetizados en el momento (sin archivos): al elegir una
 * carta, en las alertas y en la noche electoral. Se pueden silenciar, y la
 * preferencia queda guardada en este navegador.
 */

export type Sonido = 'carta' | 'reparto' | 'alerta' | 'tic' | 'redoble' | 'victoria' | 'derrota' | 'clic';

const CLAVE = 'larosada.silencio';

let contexto: AudioContext | null = null;

export function silenciado(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function alternarSilencio(): boolean {
  const nuevo = !silenciado();
  try {
    localStorage.setItem(CLAVE, nuevo ? '1' : '0');
  } catch {
    // Sin almacenamiento: vale solo por esta vez.
  }
  return nuevo;
}

function audio(): AudioContext | null {
  if (silenciado()) return null;
  try {
    contexto ??= new AudioContext();
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

/** Una nota: frecuencia, cuándo empieza, cuánto dura, forma de onda y volumen. */
function nota(
  ctx: AudioContext,
  frecuencia: number,
  inicio: number,
  duracion: number,
  onda: OscillatorType = 'triangle',
  volumen = 0.12,
  hasta?: number,
) {
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  osc.type = onda;
  const t = ctx.currentTime + inicio;
  osc.frequency.setValueAtTime(frecuencia, t);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  gan.gain.setValueAtTime(0.0001, t);
  gan.gain.exponentialRampToValueAtTime(volumen, t + 0.01);
  gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(gan).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracion + 0.02);
}

/** Un golpe de ruido, para el tambor del redoble. */
function golpe(ctx: AudioContext, inicio: number, volumen = 0.08) {
  const largo = Math.floor(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo) ** 2;
  const fuente = ctx.createBufferSource();
  const gan = ctx.createGain();
  gan.gain.value = volumen;
  fuente.buffer = buffer;
  fuente.connect(gan).connect(ctx.destination);
  fuente.start(ctx.currentTime + inicio);
}

export function sonar(sonido: Sonido) {
  const ctx = audio();
  if (!ctx) return;
  switch (sonido) {
    case 'clic':
      nota(ctx, 660, 0, 0.05, 'square', 0.04);
      break;
    case 'carta':
      nota(ctx, 300, 0, 0.18, 'triangle', 0.1, 900);
      nota(ctx, 1200, 0.12, 0.12, 'sine', 0.06);
      break;
    case 'reparto':
      for (let i = 0; i < 3; i++) golpe(ctx, i * 0.15, 0.05);
      break;
    case 'alerta':
      nota(ctx, 220, 0, 0.12, 'sawtooth', 0.08);
      nota(ctx, 330, 0.1, 0.12, 'sawtooth', 0.08);
      nota(ctx, 440, 0.2, 0.3, 'square', 0.07);
      break;
    case 'tic':
      nota(ctx, 1800, 0, 0.03, 'square', 0.025);
      break;
    case 'redoble':
      for (let i = 0; i < 14; i++) golpe(ctx, i * 0.07, 0.03 + i * 0.004);
      break;
    case 'victoria':
      [523, 659, 784, 1047].forEach((f, i) => nota(ctx, f, i * 0.11, 0.35, 'triangle', 0.1));
      break;
    case 'derrota':
      [392, 330, 262].forEach((f, i) => nota(ctx, f, i * 0.18, 0.4, 'sine', 0.1));
      break;
  }
}
