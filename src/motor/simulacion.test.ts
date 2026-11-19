import { describe, it } from 'vitest';
import { CARGOS } from '../datos/cargos';
import { buscarEvento } from '../datos/eventos';
import { valorOpcion } from './balance';
import { descartarPendiente, elegirCarta, nuevaCarrera, resolverDetencion } from './carrera';
import {
  bajarseDeLaEleccion,
  candidaturas,
  cerrarEleccion,
  chanceLapicera,
  elegirCampania,
  elegirCandidatura,
  fiscalizar,
  motivoSinCampania,
  resolverInterna,
} from './elecciones';
import { motivoOpcion, resolverEvento } from './eventos';
import { decidirPase } from './pases';
import { COSTO_DELFIN, formarDelfin, motivoSinDelfin } from './delfines';
import { poderHistorico } from './historico';
import { debatir, enviosDeFiscal, roscar } from './pruebas-util';
import { elegirFormacion, empezarFormacion } from './formacion';
import type { Carrera } from './tipos';

/**
 * Simulación de carreras enteras, para medir la economía y los números por
 * edad. Solo corre a pedido: SIM=archivo.txt npx vitest run simulacion
 */
const entorno = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

type Estilo = 'honesto' | 'corrupto';

function esCoima(c: Carrera, k: number) {
  const r = buscarEvento(c.evento!.id).opciones[k].resultado;
  return 'chance' in r ? !!(r.exito.coima || r.fracaso.coima) : !!r.coima;
}

/** Un jugador razonable: se presenta si tiene chance, hace la mejor campaña que puede pagar y elige la opción que más vale. */
function jugar(semilla: number, estilo: Estilo) {
  let c: Carrera = empezarFormacion(nuevaCarrera({ semilla, estilo: estilo === 'corrupto' ? 'transa' : 'pragmatico' }));
  // Los años de militancia: cuatro decisiones de ideas.
  for (let k = 0; c.formacion; k++) c = elegirFormacion(c, (semilla + k) % 3);
  const fotos: {
    edad: number;
    caja: number;
    negra: number;
    fama: number;
    imagen: number;
    poder: number;
    construccion: number;
    territorio: number;
    rango: number;
    causas: number;
  }[] = [];
  let fin = '';
  let edadPresidente: number | null = null;
  const cuenta = {
    formacion: 4,
    candidaturas: 0,
    anios: 0,
    comunes: 0,
    especiales: 0,
    roscas: 0,
    campanias: 0,
    debates: 0,
    fiscalizaciones: 0,
    festejos: 0,
    pases: 0,
  };
  let formados = 0;
  while (!c.fin) {
    if (c.cargo === 'presidente' && edadPresidente === null) edadPresidente = c.edad;
    while (c.pendientes.length) {
      c = descartarPendiente(c);
      cuenta.festejos++;
    }
    if (c.pases) {
      c = decidirPase(c, 0);
      cuenta.pases++;
    }
    if (c.eleccion) {
      const ops = candidaturas(c)
        .filter((x) => !x.motivo && x.chance >= 0.3)
        .sort((a, b) => CARGOS[b.cargo].rango - CARGOS[a.cargo].rango);
      if (c.eleccion.fase === 'candidatura') {
        cuenta.candidaturas++;
        c = elegirCandidatura(c, ops[0]?.cargo ?? null);
      } else if (!ops.some((x) => x.cargo === c.eleccion?.cargo)) {
        // Con un solo cargo posible ya está en campaña: si no le conviene, se baja.
        cuenta.candidaturas++;
        c = bajarseDeLaEleccion(c);
      }
      if (c.eleccion?.fase === 'interna') c = resolverInterna(c, chanceLapicera(c) > 0.5 ? 'lapicera' : 'paso');
      if (c.eleccion?.fase === 'campania') {
        const cargo = c.eleccion.cargo!;
        const orden =
          estilo === 'corrupto' ? (['negra', 'fuerte', 'normal', 'austera'] as const) : (['fuerte', 'normal', 'austera'] as const);
        // Gasta en campaña sin vaciar la caja: la fuerte solo si le sobra.
        const nivel = orden.find((n) => !motivoSinCampania(c, cargo, n)) ?? 'austera';
        c = elegirCampania(c, nivel);
        cuenta.campanias++;
        if (c.eleccion?.fase === 'debate') cuenta.debates++;
        // Un debate regular: una bien, una evasiva, una mal.
        c = debatir(c, (ronda) => (['bien', 'evasiva', 'mal'] as const)[ronda % 3]);
        // Una fiscalización regular: reacciona en dos segundos y atiende en orden.
        if (c.eleccion?.fase === 'fiscalizacion') cuenta.fiscalizaciones++;
        if (c.eleccion?.fase === 'fiscalizacion') c = fiscalizar(c, enviosDeFiscal(c.eleccion.fiscalizacion!, 2));
      }
      if (c.eleccion) c = cerrarEleccion(c);
    }
    // Puede haber más de uno: la decisión de Estado y, después, el proyecto de ley.
    while (c.evento) {
      const e = buscarEvento(c.evento.id);
      if (e.especial) cuenta.especiales++;
      else cuenta.comunes++;
      const posibles = e.opciones.map((_, k) => k).filter((k) => !motivoOpcion(c, k));
      if (!posibles.length)
        throw new Error(
          `Sin opciones en ${e.id}: caja ${c.medidores.caja}, negra ${c.cajaNegra}, ${e.opciones.map((_, k) => motivoOpcion(c, k)).join(' / ')}`,
        );
      const candidatas = estilo === 'honesto' ? posibles.filter((k) => !esCoima(c, k)) : posibles;
      const lista = candidatas.length ? candidatas : posibles;
      const coima = estilo === 'corrupto' ? lista.find((k) => esCoima(c, k)) : undefined;
      const mejor =
        coima ?? lista.reduce((a, k) => ((valorOpcion(c, e, k)?.total ?? -99) > (valorOpcion(c, e, a)?.total ?? -99) ? k : a), lista[0]);
      // Sin mayoría, juega la rosca como un jugador regular: llama en el orden en que aparecen.
      if (mejor === 0 && e.opciones[1]?.rosca && !motivoOpcion(c, 1)) cuenta.roscas++;
      if (mejor === 0 && e.opciones[1]?.rosca && !motivoOpcion(c, 1)) c = roscar(c, (r) => r.bloques.map((_, i) => i)).carrera;
      else c = resolverEvento(c, mejor).carrera;
    }
    // Un presidente que cae (juicio político, renuncia) termina la carrera a mitad de año.
    if (c.fin) break;
    if (c.detencion) {
      c = resolverDetencion(c, 'pelear');
      if (c.fin) break;
    }
    fotos.push({
      edad: c.edad,
      caja: c.medidores.caja,
      negra: c.cajaNegra,
      fama: c.medidores.fama,
      imagen: c.medidores.imagen,
      poder: c.medidores.poder,
      construccion: c.construccion,
      territorio: c.atributos.territorio,
      rango: CARGOS[c.cargo].rango,
      causas: c.medidores.causas,
    });
    // Forma delfines si le sobra la plata.
    if (!motivoSinDelfin(c) && c.medidores.caja >= COSTO_DELFIN * 4) {
      c = formarDelfin(c);
      formados++;
    }
    c = elegirCarta(c, semilla % 3);
    cuenta.anios++;
  }
  fin = c.fin?.motivo ?? '';
  const delfines = { formados, traiciones: c.traiciones ?? 0, niveles: (c.delfines ?? []).map((d) => d.nivel) };
  return {
    fotos,
    fin,
    mejorRango: c.mejorRango,
    presidente: c.mejorRango >= 6,
    edadPresidente,
    historico: poderHistorico(c).total,
    cuenta,
    delfines,
  };
}

const mediana = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

describe.runIf(!!entorno.SIM)('simulación', () => {
  it('carreras enteras, honestas y corruptas', { timeout: 600_000 }, async () => {
    const lineas: string[] = [];
    for (const estilo of ['honesto', 'corrupto'] as const) {
      const porEdad: Record<number, ReturnType<typeof jugar>['fotos']> = {};
      const fines: Record<string, number> = {};
      let presidentes = 0;
      const historicos: number[] = [];
      const edades: number[] = [];
      const delfines = { formados: 0, traiciones: 0, niveles: [] as number[] };
      const cuentas: ReturnType<typeof jugar>['cuenta'][] = [];
      const rangos: Record<number, number> = {};
      const N = 300;
      for (let s = 0; s < N; s++) {
        const r = jugar(s, estilo);
        fines[r.fin] = (fines[r.fin] ?? 0) + 1;
        if (r.presidente) presidentes++;
        cuentas.push(r.cuenta);
        rangos[r.mejorRango] = (rangos[r.mejorRango] ?? 0) + 1;
        historicos.push(r.historico);
        delfines.formados += r.delfines.formados;
        delfines.traiciones += r.delfines.traiciones;
        delfines.niveles.push(...r.delfines.niveles);
        if (r.edadPresidente !== null) edades.push(r.edadPresidente);
        for (const f of r.fotos) {
          if (f.edad % 5 !== 0) continue;
          if (!porEdad[f.edad]) porEdad[f.edad] = [];
          porEdad[f.edad].push(f);
        }
      }
      lineas.push(
        `\n${estilo.toUpperCase()} (${N} carreras) · fin: ${JSON.stringify(fines)} · llegaron a presidente: ${presidentes} · edad al asumir: ${edades.length ? `mínima ${Math.min(...edades)}, mediana ${mediana(edades)}` : '—'} · Poder Histórico: mediana ${mediana(historicos)}, máximo ${Math.max(...historicos)}`,
      );
      lineas.push(
        `Delfines: ${delfines.formados} formados, ${delfines.traiciones} traiciones, ${delfines.niveles.length} siguen al final (crecimiento mediano ${delfines.niveles.length ? mediana(delfines.niveles) : '—'})`,
      );
      // Cuánto dura una partida: segundos estimados por cada cosa que hay que decidir o mirar.
      const SEGUNDOS = {
        formacion: 12,
        candidaturas: 8,
        anios: 6,
        comunes: 20,
        especiales: 35,
        roscas: 60,
        campanias: 45,
        debates: 75,
        fiscalizaciones: 45,
        festejos: 8,
        pases: 15,
      };
      const claves = Object.keys(SEGUNDOS) as (keyof typeof SEGUNDOS)[];
      const minutos = cuentas.map((x) => claves.reduce((t, k) => t + x[k] * SEGUNDOS[k], 0) / 60);
      // Decisiones: todo lo que pide elegir (las juras son un toque, no cuentan).
      const DECISIONES = [
        'formacion',
        'anios',
        'comunes',
        'especiales',
        'roscas',
        'candidaturas',
        'campanias',
        'debates',
        'fiscalizaciones',
        'pases',
      ] as const;
      const decisiones = cuentas.map((x) => DECISIONES.reduce((t, k) => t + x[k], 0));
      lineas.push(`Cargo más alto (rango: carreras): ${JSON.stringify(rangos)}`);
      lineas.push(
        `Decisiones por carrera: mediana ${mediana(decisiones)}, promedio ${Math.round(decisiones.reduce((a, b) => a + b, 0) / decisiones.length)}`,
      );
      lineas.push(
        `Partida típica: ${claves.map((k) => `${k} ${mediana(cuentas.map((x) => x[k]))}`).join(', ')} · duración estimada: mediana ${Math.round(mediana(minutos))} min (de ${Math.round(Math.min(...minutos))} a ${Math.round(Math.max(...minutos))})`,
      );
      lineas.push('edad   n     caja   negra  fama imagen poder constr terr rango causas');
      for (const [edad, fs] of Object.entries(porEdad)) {
        if (fs.length < 20) continue;
        const m = (k: keyof (typeof fs)[number]) => mediana(fs.map((f) => f[k]));
        lineas.push(
          `${edad.padStart(4)} ${String(fs.length).padStart(4)} ${String(m('caja')).padStart(8)} ${String(m('negra')).padStart(7)} ${String(m('fama')).padStart(5)} ${String(m('imagen')).padStart(6)} ${String(m('poder')).padStart(5)} ${String(m('construccion')).padStart(6)} ${String(m('territorio')).padStart(4)} ${String(m('rango')).padStart(5)} ${String(m('causas')).padStart(6)}`,
        );
      }
    }
    // @ts-ignore: los tipos de Node no están en el proyecto.
    const { writeFileSync } = await import('node:fs');
    writeFileSync(entorno.SIM!, lineas.join('\n'));
  });
});
