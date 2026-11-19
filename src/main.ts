import './estilos.css';
import { CARGOS } from './datos/cargos';
import { ESTILO, ORIGEN } from './datos/armado';
import { buscarCarta } from './datos/cartas';
import { buscarEvento } from './datos/eventos';
import { MEDIOS, SEGUNDOS_POR_PREGUNTA, buscarPregunta } from './datos/entrevistas';
import { PARTIDOS, delPartido, elPartido } from './datos/partidos';
import { buscarItem } from './datos/tienda';
import { borrarCarrera, cargarCarrera, guardarCarrera } from './guardado';
import {
  COSTO_ABOGADOS,
  COSTO_EXILIO,
  COSTO_MUDANZA,
  NOMBRE_DESGASTE,
  NOMBRE_RAREZA,
  ETAPA,
  TEXTO_FIN,
  descartarPendiente,
  desgastePolitico,
  etapaDe,
  siguienteEtapa,
  efectoDeCarta,
  elegirCarta,
  enElCentroDelPoder,
  mudarseABuenosAires,
  nombreDe,
  nombreIdeologia,
  probabilidadZafar,
  puedeMudarse,
  resolverDetencion,
  retirarse,
  salidasDisponibles,
} from './motor/carrera';
import { calcularResultado, iniciarEntrevista, responderEntrevista } from './motor/entrevista';
import { iniciarRosca } from './motor/rosca';
import { bajarseDeLaEleccion, cerrarEleccion, elegirCampania, elegirCandidatura, resolverInterna } from './motor/elecciones';
import { decidirPase } from './motor/pases';
import { NOMBRE_ETAPA_JUDICIAL, hacerMovida, manosLimpias } from './motor/justicia';
import { resolverEvento } from './motor/eventos';
import type { Desenlace } from './motor/eventos';
import { aniosRestantes, comprar, vigentes } from './motor/tienda';
import type { ResultadoDebate } from './motor/debate';
import type { ResultadoEntrevista } from './motor/entrevista';
import { ATRIBUTOS } from './motor/tipos';
import type { CargoId, Carrera, MotivoFin, NivelCampania, OpcionInterna, Pais, SalidaDetencion } from './motor/tipos';
import { herencia } from './motor/carrera';
import type { Padrino } from './motor/carrera';
import { COSTO_DELFIN, LEALTAD_TRAICION, PODER_DELFIN, formarDelfin, motivoSinDelfin } from './motor/delfines';
import { pantallaArmado } from './pantallas/armado';
import { panelEleccion, veredicto } from './pantallas/elecciones';
import { alertaEspecial, desenlaceEnAlerta, panelEventoComun, vistaDesenlace } from './pantallas/evento';
import { abrirPoder } from './pantallas/poder';
import { buscarPromesa } from './datos/promesas';
import { textoBloque } from './motor/congreso';
import { textoCrisis } from './motor/crisis';
import { poderHistorico } from './motor/historico';
import { mejoresCarreras, registrarCarrera } from './historicos';
import type { CarreraHistorica } from './historicos';
import { ICONO_DISTRITO, NOMBRE_DISTRITO, esAliado } from './motor/distrito';
import { ICONO_INDICADOR, NOMBRE_INDICADOR, RESERVAS_CORRIDA } from './motor/pais';
import { MALESTAR_ALTO } from './motor/promesas';
import { animarEscrutinio } from './pantallas/escrutinio';
import { capaPendiente } from './pantallas/celebraciones';
import { conectarDebate, panelDebate, panelResultadoDebate } from './pantallas/debate';
import { panelPases } from './pantallas/pases';
import { conectarRosca, panelRosca } from './pantallas/rosca';
import { conectarFormacion, panelFormacion } from './pantallas/formacion';
import { empezarFormacion } from './motor/formacion';
import { conectarFiscalizacion, panelFiscalizacion, panelResultadoFiscalizacion } from './pantallas/fiscalizacion';
import type { ResultadoFiscalizacion } from './pantallas/fiscalizacion';
import { abrirTienda } from './pantallas/tienda';
import { AYUDA, brujula, caja, chip, chips, confirmar, contarNumeros, dolares, escapar, nivel } from './ui';
import { alternarSilencio, silenciado, sonar } from './sonido';
import { retrato, semillaDe } from './pantallas/retrato';

const app = document.querySelector<HTMLElement>('#app')!;

/** Qué mostrar una sola vez después de una acción: la animación y el resultado de la entrevista. */
let recienCambio = false;
let resultadoPendiente: ResultadoEntrevista | null = null;
let debatePendiente: ResultadoDebate | null = null;
let fiscalizacionPendiente: ResultadoFiscalizacion | null = null;
let reloj: number | undefined;

function pararReloj() {
  if (reloj !== undefined) clearInterval(reloj);
  reloj = undefined;
}

function pantallaInicio() {
  pararReloj();
  const guardada = cargarCarrera();
  const enCurso = guardada && !guardada.fin ? guardada : null;
  app.innerHTML = `
    <section class="inicio">
      <p class="sobretitulo">Una carrera política argentina</p>
      <h1>La Rosada</h1>
      <p class="bajada">Empezás a los 18 años, militando en tu barrio. Lo que pase después depende de vos.</p>
      <div class="acciones">
        ${enCurso ? `<button class="boton principal" data-accion="continuar">Seguir la carrera de ${escapar(enCurso.nombre)}</button>` : ''}
        <button class="boton ${enCurso ? '' : 'principal'}" data-accion="nueva">Nueva carrera</button>
      </div>
      <p class="nota">Versión beta. Tu carrera se guarda en este navegador: si borrás los datos del sitio o cambiás de dispositivo, empezás de cero.</p>
    </section>
    ${tablaHistoricos(mejoresCarreras())}`;
  app.querySelector('[data-accion="nueva"]')!.addEventListener('click', async () => {
    if (enCurso && !(await confirmar('Se pierde la carrera en curso. ¿Empezar otra?', { aceptar: 'Empezar otra', peligro: true }))) return;
    armar();
  });
  app.querySelector('[data-accion="continuar"]')?.addEventListener('click', () => pantallaCarrera(enCurso!));
}

function armar(padrino?: Padrino) {
  pararReloj();
  window.scrollTo(0, 0);
  pantallaArmado(app, { alEmpezar: empezar, alVolver: pantallaInicio, padrino });
}

function empezar(nueva: Carrera) {
  // Primero, los años de militancia: hasta los 35 solo se forman tus ideas.
  const carrera = empezarFormacion(nueva);
  guardarCarrera(carrera);
  window.scrollTo(0, 0);
  pantallaCarrera(carrera);
}

/** La escarapela, dibujada: celeste, blanca y celeste, con un sol en el medio. */
const ESCARAPELA = `
  <svg class="escarapela" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="19" fill="#75aadb"/>
    <circle cx="20" cy="20" r="13" fill="#f4f7fb"/>
    <circle cx="20" cy="20" r="7" fill="#75aadb"/>
    <circle cx="20" cy="20" r="3.2" fill="#f2b632"/>
    <g stroke="#f2b632" stroke-width="1.2">${Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<line x1="${(20 + Math.cos(a) * 3.8).toFixed(1)}" y1="${(20 + Math.sin(a) * 3.8).toFixed(1)}" x2="${(20 + Math.cos(a) * 5.6).toFixed(1)}" y2="${(20 + Math.sin(a) * 5.6).toFixed(1)}"/>`;
    }).join('')}</g>
  </svg>`;

/** El país, mientras sos presidente: inflación, actividad y reservas, con cómo los recibiste. */
/** Tu intendencia o tu provincia: Cuentas, Gestión y si la Nación te ayuda. */
function filaDistrito(carrera: Carrera) {
  const d = carrera.distrito;
  if (!d) return '';
  const dato = (k: 'cuentas' | 'gestion') =>
    `<span class="indicador ${d[k] < 35 ? 'malo' : ''}" title="La recibiste en ${d.recibido[k]}">${ICONO_DISTRITO[k]} ${NOMBRE_DISTRITO[k]} <strong>${d[k]}</strong></span>`;
  const nacion = carrera.oficialismo
    ? esAliado(carrera)
      ? '<span class="indicador" title="Sos del partido que gobierna la Nación: te llegan fondos">🤝 Aliado de la Nación</span>'
      : `<span class="indicador malo" title="La Nación es de otro partido: te retacean fondos">🥶 Nación: ${escapar(elPartido(carrera.oficialismo))}</span>`
    : '';
  return `<div class="fila-pais"><span class="titulo-pais">${d.cargo === 'gobernador' ? 'Tu provincia' : 'Tu municipio'}</span>${dato('cuentas')}${dato('gestion')}${nacion}</div>`;
}

/** Tus delfines: cuánto crecieron y qué tan leales son. */
function filaDelfines(carrera: Carrera) {
  const delfines = carrera.delfines ?? [];
  if (!delfines.length) return '';
  const dato = (d: NonNullable<Carrera['delfines']>[number]) =>
    `<span class="indicador ${d.lealtad < LEALTAD_TRAICION ? 'malo' : ''}" title="${d.edad} años · talento ${d.talento}${d.cargo ? ' · tiene banca' : ''}${d.lealtad < LEALTAD_TRAICION ? ' · se te puede ir' : ''}">🐬 ${escapar(d.nombre)} · crece <strong>${d.nivel}</strong> · lealtad <strong>${d.lealtad}</strong></span>`;
  return `<div class="fila-pais fila-delfines"><span class="titulo-pais">Tus delfines</span>${delfines.map(dato).join('')}</div>`;
}

function filaPais(carrera: Carrera) {
  const p = carrera.pais;
  if (!p) return '';
  const dato = (clave: keyof Pais, sufijo = '') => {
    const malo = clave === 'inflacion' ? p.inflacion >= 50 : clave === 'actividad' ? p.actividad < 40 : p.reservas < RESERVAS_CORRIDA;
    return `<span class="indicador ${malo ? 'malo' : ''}" title="Lo recibiste en ${p.recibido[clave]}${sufijo}">${ICONO_INDICADOR[clave]} ${NOMBRE_INDICADOR[clave]} <strong>${p[clave]}${sufijo}</strong></span>`;
  };
  return `<div class="fila-pais"><span class="titulo-pais">El país</span>${dato('inflacion', ' %')}${dato('actividad')}${dato('reservas')}<span class="indicador bloque" title="Tu bloque propio. Para tener mayoría hacen falta 129 diputados y 37 senadores.">🏛️ <strong>${textoBloque(carrera)}</strong></span>${textoCrisis(
    carrera,
  )
    .map((x) => `<span class="indicador malo crisis" title="En crisis desde ${x.desde}">${x.icono} <strong>${x.nombre}</strong></span>`)
    .join('')}</div>`;
}

/** Caja negra, causa abierta, la calle y las promesas: solo aparecen si hay algo que mostrar. */
function filaJusticia(carrera: Carrera) {
  const partes: string[] = [];
  const malestar = carrera.malestar ?? 0;
  if (malestar >= 10) {
    partes.push(
      `<span class="dato-calle ${malestar >= MALESTAR_ALTO ? 'caliente' : ''}" title="Bronca en la calle: con 50 o más perdés poder todos los años y llegan paros y marchas">✊ Calle <strong>${malestar}</strong></span>`,
    );
  }
  const promesas = carrera.promesas ?? [];
  if (promesas.length) {
    partes.push(
      `<span class="dato-promesas" title="${escapar(promesas.map((x) => `«${buscarPromesa(x.id).texto}» hasta ${x.hasta}`).join(' · '))}">🤝 ${promesas.length === 1 ? '1 promesa' : `${promesas.length} promesas`}</span>`,
    );
  }
  if (carrera.cajaNegra > 0 || carrera.negroUsado) {
    partes.push(
      `<span class="dato-negro" title="Plata en negro: no figura en ningún lado">🕶️ Caja negra <strong>${dolares(carrera.cajaNegra)}</strong></span>`,
    );
  }
  if (carrera.proceso) {
    const etapas = ['denuncia', 'imputacion', 'indagatoria', 'procesamiento'];
    const paso = etapas.indexOf(carrera.proceso.etapa) + 1;
    partes.push(`
      <span class="dato-causa" title="La causa avanza si tus causas siguen altas">⚖️ ${NOMBRE_ETAPA_JUDICIAL[carrera.proceso.etapa]}
        <span class="escalera-causa">${etapas.map((_, i) => `<i class="${i < paso ? 'hecha' : ''}"></i>`).join('')}</span>
      </span>`);
  }
  return partes.length ? `<div class="fila-justicia">${partes.join('')}</div>` : '';
}

/** La barra de arriba: quién sos, tus números con flechas y los botones de la carrera. */
function tableroSuperior(carrera: Carrera, conBotones: boolean) {
  const animar = recienCambio;
  const anios = carrera.anio - carrera.anioInicio;
  const desgaste = desgastePolitico(anios);
  const p = carrera.medidores.poder;
  const cambioPoder = carrera.cambios?.poder;
  const lejos = !enElCentroDelPoder(carrera);
  const partido = PARTIDOS[carrera.partido];
  const etapa = etapaDe(carrera.construccion);
  const proxima = siguienteEtapa(carrera.construccion);
  const activos = vigentes(carrera).filter((i) => i.seccion !== 'lujo');
  return `
    <header class="tablero-sup">
      <div class="cabeza">
        <div class="poder ${nivel(p)} ${animar && cambioPoder ? (cambioPoder > 0 ? 'destello-bueno' : 'destello-malo') : ''}" tabindex="0" data-ayuda="${escapar(AYUDA.poder)}">
          <strong><span class="numero"${animar && cambioPoder ? ` data-desde="${p - cambioPoder}" data-hasta="${p}"` : ''}>${p}</span>${cambioPoder ? `<span class="flecha ${cambioPoder > 0 ? 'bueno' : 'malo'}">${cambioPoder > 0 ? '▲' : '▼'}<small>${Math.abs(cambioPoder)}</small></span>` : ''}</strong><span>Poder</span>
        </div>
        <div class="retrato-jugador" title="${carrera.edad} años">${retrato(semillaDe(carrera.nombre + carrera.semilla), 'retrato-propio', carrera.edad)}</div>
        <div class="identidad">
          <h2>${escapar(carrera.nombre)}</h2>
          <p>${carrera.anio} · ${carrera.edad} años · <strong class="cargo-actual">${CARGOS[carrera.cargo].nombre}</strong>${carrera.mandatoHasta ? ` <span class="mandato">hasta ${carrera.mandatoHasta}</span>` : ''}</p>
          <p class="partido-actual" style="--color-partido:${partido.color}">${escapar(partido.nombre)}</p>
          ${lejos ? `<p class="badge-lugar" title="Lejos de Buenos Aires: la fama rinde la mitad">📍 ${escapar(carrera.base)} · Lejos del poder</p>` : ''}
          <p class="padrino-linea">${carrera.padrino ? ` · delfín de ${escapar(carrera.padrino.nombre)}` : ''}</p>
          <p class="perfil">${ORIGEN[carrera.origen].nombre} · ${nombreIdeologia(carrera.ideologia)} · ${ESTILO[carrera.estilo].nombre}${manosLimpias(carrera) ? ' · <span class="manos-limpias" title="Nunca aceptaste una coima ni usaste plata negra">🤍 Manos limpias</span>' : ''}</p>
        </div>
        <div class="lugar ${lejos ? 'interior' : 'centro'}">
          ${brujula(carrera.ideologia)}
          ${ESCARAPELA}
          <span class="lugar-texto">
            <strong>${escapar(carrera.base)}</strong>
            <span>${carrera.base !== carrera.provincia ? `de ${escapar(carrera.provincia)}` : lejos ? 'Tu provincia' : 'Centro del poder'}</span>
          </span>
        </div>
      </div>

      <div class="trayecto" tabindex="0" data-ayuda="${escapar(proxima ? `Construcción política: te faltan ${ETAPA[proxima].desde - carrera.construccion} para ${ETAPA[proxima].nombre}. Crece con territorio, imagen, lealtad al partido y triunfos.` : 'Construcción política: llegaste a lo más alto.')}">
        <div class="trayecto-texto">
          <span class="etapa-actual ${etapa}">${ETAPA[etapa].nombre}</span>
          <span><strong>${carrera.construccion}</strong>/100${proxima ? ` → ${ETAPA[proxima].nombre} ${ETAPA[proxima].desde}` : ''}</span>
        </div>
        ${
          carrera.construccion >= ETAPA.caudillo.desde && carrera.medidores.imagen < 55
            ? '<p class="estancado">Frenado: arriba de Caudillo, con Imagen menor a 55, tu construcción crece a la mitad.</p>'
            : ''
        }
        <div class="trayecto-barra construccion"><span style="width:${carrera.construccion}%"></span></div>
        <div class="trayecto-pie">
          <span><strong>${anios}</strong> ${anios === 1 ? 'año' : 'años'} en política</span>
          <span class="desgaste ${desgaste.nivel}">${NOMBRE_DESGASTE[desgaste.nivel]}</span>
        </div>
      </div>

      <div class="fila-estadisticas atributos">
        ${ATRIBUTOS.map((a) => caja(carrera, a, animar)).join('')}
      </div>
      <div class="fila-estadisticas medidores">
        ${(['fama', 'imagen', 'causas', 'caja'] as const).map((m) => caja(carrera, m, animar)).join('')}
      </div>
      ${filaPais(carrera)}${filaDistrito(carrera)}${filaDelfines(carrera)}
      ${filaJusticia(carrera)}
      ${
        activos.length
          ? `<div class="activos"><span class="activos-titulo">Equipo</span>${activos
              .map((i) => {
                const quedan = aniosRestantes(carrera, i.id);
                return `<span class="activo" title="${escapar(i.nombre)}">${i.icono}${quedan ? `<small>${quedan}</small>` : ''}</span>`;
              })
              .join('')}</div>`
          : ''
      }

      ${
        conBotones
          ? `<nav class="botonera">
              <button class="boton-barra tienda" data-accion="tienda" ${carrera.formacion || carrera.detencion || carrera.entrevista || carrera.pases || carrera.eleccion || carrera.evento ? 'disabled' : ''}><span class="icono" aria-hidden="true">🛒</span>Tienda</button>
              <button class="boton-barra poder-boton" data-accion="poder"><span class="icono" aria-hidden="true">🏛️</span>Poder${carrera.favores.length ? ` <span class="globito">${carrera.favores.length}</span>` : ''}</button>
              ${lejos ? `<button class="boton-barra" data-accion="mudarse" ${puedeMudarse(carrera) ? '' : 'disabled'} title="Mudarte a Buenos Aires: cuesta ${dolares(COSTO_MUDANZA)} y la mitad de tu Territorio"><span class="icono" aria-hidden="true">🚚</span>Mudarte</button>` : ''}
              ${
                carrera.construccion >= ETAPA.referente.desde
                  ? `<button class="boton-barra" data-accion="delfin" ${motivoSinDelfin(carrera) ? 'disabled' : ''} title="${escapar(motivoSinDelfin(carrera) ?? `Formar un delfín: ${dolares(COSTO_DELFIN)} y Poder −${PODER_DELFIN}`)}"><span class="icono" aria-hidden="true">🐬</span>Delfín</button>`
                  : ''
              }
              <button class="boton-barra" data-accion="historia"><span class="icono" aria-hidden="true">📜</span>Tu historia</button>
              ${
                carrera.detencion || carrera.entrevista || carrera.eleccion || carrera.evento
                  ? ''
                  : `<button class="boton-barra" data-accion="privado"><span class="icono" aria-hidden="true">💼</span>Sector privado</button>
                     <button class="boton-barra peligro" data-accion="retirarse"><span class="icono" aria-hidden="true">🚪</span>Retirarte</button>`
              }
              <button class="boton-barra" data-accion="inicio"><span class="icono" aria-hidden="true">🏠</span>Inicio</button>
              <button class="boton-barra sonido" data-accion="sonido" aria-label="${silenciado() ? 'Activar el sonido' : 'Silenciar'}" title="${silenciado() ? 'Activar el sonido' : 'Silenciar'}"><span class="icono" aria-hidden="true">${silenciado() ? '🔇' : '🔊'}</span></button>
            </nav>`
          : ''
      }
    </header>`;
}

function historial(carrera: Carrera) {
  if (!carrera.historial.length) return '<p class="vacio">Tu historia empieza este año.</p>';
  return carrera.historial
    .slice(0, 12)
    .map(
      (e) => `
      <article class="anio-historial">
        <h4>${e.anio} <span>· ${e.edad} años</span></h4>
        ${e.lineas.map((l) => `<p>${escapar(l)}</p>`).join('')}
      </article>`,
    )
    .join('');
}

function contenidoPrincipal(carrera: Carrera) {
  if (resultadoPendiente) return panelResultado(resultadoPendiente);
  if (debatePendiente) return panelResultadoDebate(debatePendiente);
  if (fiscalizacionPendiente) return panelResultadoFiscalizacion(fiscalizacionPendiente);
  if (carrera.formacion) return panelFormacion(carrera);
  if (carrera.entrevista) return panelEntrevista(carrera);
  if (carrera.detencion) return panelDetencion(carrera);
  if (carrera.pases) return panelPases(carrera);
  if (carrera.eleccion) {
    // Recién se votó la PASO: primero su conteo, después la campaña.
    if (pasoPorAnimar && carrera.eleccion.paso) return '<section class="panel eleccion" data-escrutinio></section>';
    if (carrera.eleccion.fase === 'debate') return panelDebate(carrera);
    if (carrera.eleccion.fase === 'fiscalizacion') return panelFiscalizacion(carrera);
    return panelEleccion(carrera, promesasElegidas);
  }
  if (carrera.rosca) return panelRosca(carrera);
  if (desenlacePendiente) return `<section class="panel evento-comun">${vistaDesenlace(desenlacePendiente)}</section>`;
  if (carrera.evento) {
    return buscarEvento(carrera.evento.id).especial
      ? '<section class="panel evento-espera"><p class="ayuda">Algo está por pasar…</p></section>'
      : panelEventoComun(carrera);
  }
  return panelBase(carrera) + panelArmado(carrera);
}

/** Dónde estaba la tienda cuando se compró algo, para reabrirla igual. */
let tiendaEn: number | null = null;

function tiendaDe(carrera: Carrera, seguir: (c: Carrera) => void, desplazamiento?: number) {
  abrirTienda(
    app.querySelector<HTMLElement>('[data-capa="tienda"]')!,
    carrera,
    {
      alEntrevistar: (medio) => seguir(iniciarEntrevista(carrera, medio)),
      alComprar: (id, lugar) => {
        tiendaEn = lugar;
        seguir(comprar(carrera, id));
        avisar(`${buscarItem(id).icono} ${buscarItem(id).nombre}`);
      },
    },
    desplazamiento,
  );
}

/** Lo que pasó en el último evento común, hasta que el jugador toca "Seguir". */
let desenlacePendiente: Desenlace | null = null;

/** La alerta de un evento especial, de punta a punta. */
async function eventoEspecial(carrera: Carrera) {
  const capa = app.querySelector<HTMLElement>('[data-capa="alerta"]')!;
  const opcion = await alertaEspecial(capa, carrera);
  if (buscarEvento(carrera.evento!.id).opciones[opcion].rosca) {
    capa.hidden = true;
    capa.innerHTML = '';
    document.body.classList.remove('sin-scroll');
    const enLaMesa = iniciarRosca(carrera);
    guardarCarrera(enLaMesa);
    window.scrollTo(0, 0);
    return pantallaCarrera(enLaMesa);
  }
  const { carrera: siguiente, desenlace } = resolverEvento(carrera, opcion);
  guardarCarrera(siguiente);
  await desenlaceEnAlerta(capa, desenlace);
  recienCambio = true;
  window.scrollTo(0, 0);
  pantallaCarrera(siguiente);
}

/** La PASO recién votada se muestra con su propio conteo antes de seguir. */
let pasoPorAnimar = false;
/** Las promesas marcadas en la campaña, hasta que se vota. */
let promesasElegidas: string[] = [];

/** Corre los conteos que correspondan y, al final, cierra la elección. */
async function nocheElectoral(escenario: HTMLElement, carrera: Carrera, seguir: (c: Carrera) => void) {
  const e = carrera.eleccion!;
  escenario.scrollIntoView({ block: 'start' });
  if (e.paso && (pasoPorAnimar || !e.generales)) {
    pasoPorAnimar = false;
    await animarEscrutinio(escenario, e.paso, { corto: true, veredicto: veredicto(carrera, e.paso, 'paso') });
    if (e.fase !== 'escrutinio') return pantallaCarrera(carrera);
  }
  if (e.generales) {
    await animarEscrutinio(escenario, e.generales, { veredicto: veredicto(carrera, e.generales, 'generales') });
    if (e.balotaje) {
      escenario.scrollIntoView({ block: 'start' });
      await animarEscrutinio(escenario, e.balotaje, { corto: true, veredicto: veredicto(carrera, e.balotaje, 'balotaje') });
    }
  }
  window.scrollTo(0, 0);
  seguir(cerrarEleccion(carrera));
}

function pantallaCarrera(carrera: Carrera) {
  pararReloj();
  if (carrera.fin) return pantallaFin(carrera);
  // En la noche electoral no se adelanta nada: sin flechas ni historial hasta el veredicto.
  const enConteo = !!carrera.eleccion && (carrera.eleccion.fase === 'escrutinio' || (pasoPorAnimar && !!carrera.eleccion.paso));
  app.innerHTML = `
    <section class="carrera">
      ${tableroSuperior(enConteo ? { ...carrera, cambios: undefined } : carrera, true)}
      <div class="cuerpo">
        ${contenidoPrincipal(carrera)}
        ${
          enConteo
            ? ''
            : `<section class="panel bitacora" id="historia">
                <h3>Tu historia <span class="bitacora-sobre">Bitácora</span></h3>
                <div class="historial">${historial(carrera)}</div>
              </section>`
        }
      </div>
    </section>
    <div class="capa" data-capa="tienda" hidden></div>
    <div class="capa capa-alerta" data-capa="alerta" hidden></div>
    ${capaPendiente(carrera)}`;
  contarNumeros(app);
  recienCambio = false;
  document.body.classList.toggle('sin-scroll', carrera.pendientes.length > 0);

  const seguir = (siguiente: Carrera) => {
    guardarCarrera(siguiente);
    recienCambio = true;
    pantallaCarrera(siguiente);
  };

  // Atajo: 1, 2 y 3 eligen la carta del armado.
  document.onkeydown = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.capa:not([hidden])')) return;
    const boton = app.querySelector<HTMLButtonElement>(`[data-carta="${Number(e.key) - 1}"]:not(:disabled)`);
    if (['1', '2', '3'].includes(e.key) && boton) boton.click();
  };
  app.querySelectorAll<HTMLButtonElement>('[data-carta]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const indice = Number(boton.dataset.carta);
      const { clave, cantidad } = efectoDeCarta(carrera.cartas[indice], !enElCentroDelPoder(carrera), carrera);
      sonar('carta');
      lanzarCarta(boton, chip(clave, cantidad), () => seguir(elegirCarta(carrera, indice)));
    }),
  );
  app.querySelector('[data-accion="sonido"]')?.addEventListener('click', () => {
    const ahora = alternarSilencio();
    if (!ahora) sonar('clic');
    const b = app.querySelector<HTMLButtonElement>('[data-accion="sonido"]')!;
    b.querySelector('.icono')!.textContent = ahora ? '🔇' : '🔊';
    b.title = ahora ? 'Activar el sonido' : 'Silenciar';
  });
  app.querySelector('[data-accion="seguir-pendiente"]')?.addEventListener('click', () => {
    const siguiente = descartarPendiente(carrera);
    guardarCarrera(siguiente);
    pantallaCarrera(siguiente);
  });
  app.querySelectorAll<HTMLButtonElement>('[data-pase]').forEach((boton) =>
    boton.addEventListener('click', () => {
      window.scrollTo(0, 0);
      seguir(decidirPase(carrera, Number(boton.dataset.pase)));
    }),
  );
  app
    .querySelectorAll<HTMLButtonElement>('[data-salida]')
    .forEach((boton) => boton.addEventListener('click', () => seguir(resolverDetencion(carrera, boton.dataset.salida as SalidaDetencion))));
  app
    .querySelectorAll<HTMLButtonElement>('[data-respuesta]')
    .forEach((boton) => boton.addEventListener('click', () => contestar(carrera, Number(boton.dataset.respuesta), seguir)));
  if (carrera.entrevista && !resultadoPendiente) arrancarReloj(carrera, seguir);
  // En el celular la barra de arriba es alta: durante la entrevista, la pregunta va a la vista.
  app.querySelector('.entrevista, .resultado-entrevista, .eleccion, .fiscalizacion')?.scrollIntoView({ block: 'start' });

  // Elecciones: candidatura, interna, campaña y la noche electoral.
  app.querySelectorAll<HTMLButtonElement>('[data-candidatura]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const valor = boton.dataset.candidatura!;
      seguir(elegirCandidatura(carrera, valor === 'ninguna' ? null : (valor as CargoId)));
    }),
  );
  app.querySelector('[data-bajarse]')?.addEventListener('click', () => {
    promesasElegidas = [];
    seguir(bajarseDeLaEleccion(carrera));
  });
  app.querySelectorAll<HTMLButtonElement>('[data-interna]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const opcion = boton.dataset.interna as OpcionInterna;
      pasoPorAnimar = opcion === 'paso';
      seguir(resolverInterna(carrera, opcion));
    }),
  );
  app.querySelectorAll<HTMLInputElement>('[data-promesa]').forEach((caja) =>
    caja.addEventListener('change', () => {
      const id = caja.dataset.promesa!;
      promesasElegidas = caja.checked ? [...promesasElegidas, id] : promesasElegidas.filter((x) => x !== id);
      const arriba = window.scrollY;
      pantallaCarrera(carrera);
      window.scrollTo(0, arriba);
    }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-campania]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const promesas = promesasElegidas;
      promesasElegidas = [];
      seguir(elegirCampania(carrera, boton.dataset.campania as NivelCampania, promesas));
    }),
  );
  // Eventos: los comunes se eligen en el panel; los especiales, en la alerta.
  app.querySelectorAll<HTMLButtonElement>('[data-opcion-evento]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const { carrera: siguiente, desenlace } = resolverEvento(carrera, Number(boton.dataset.opcionEvento));
      desenlacePendiente = desenlace;
      seguir(siguiente);
    }),
  );
  app.querySelector('.evento-comun [data-accion="cerrar-desenlace"]')?.addEventListener('click', () => {
    desenlacePendiente = null;
    pantallaCarrera(carrera);
  });
  app.querySelector('[data-accion="poder"]')?.addEventListener('click', () =>
    abrirPoder(app.querySelector<HTMLElement>('[data-capa="tienda"]')!, carrera, (id) => {
      const { carrera: siguiente, texto, salioBien } = hacerMovida(carrera, id);
      window.scrollTo(0, 0);
      seguir(siguiente);
      avisar(`${salioBien === false ? '✗ ' : '🕶️ '}${texto}`);
    }),
  );
  if (
    carrera.evento &&
    buscarEvento(carrera.evento.id).especial &&
    !carrera.pendientes.length &&
    !carrera.pases &&
    !carrera.eleccion &&
    !carrera.detencion &&
    !carrera.rosca &&
    !desenlacePendiente
  ) {
    void eventoEspecial(carrera);
  }
  if (carrera.formacion) conectarFormacion(app, carrera, seguir);
  if (carrera.rosca) {
    conectarRosca(app, carrera, {
      seguir,
      alTerminar: ({ carrera: siguiente, desenlace }) => {
        desenlacePendiente = desenlace;
        window.scrollTo(0, 0);
        seguir(siguiente);
      },
    });
  }

  const escenario = app.querySelector<HTMLElement>('[data-escrutinio]');
  if (escenario) void nocheElectoral(escenario, carrera, seguir);

  if (carrera.eleccion?.fase === 'debate' && !debatePendiente) {
    conectarDebate(app, carrera, {
      seguir,
      redibujar: () => pantallaCarrera(carrera),
      alTerminar: (r) => {
        debatePendiente = r;
      },
    });
  }
  if (carrera.eleccion?.fase === 'fiscalizacion' && !fiscalizacionPendiente) {
    conectarFiscalizacion(app, carrera, {
      seguir,
      redibujar: () => pantallaCarrera(carrera),
      alTerminar: (r) => {
        fiscalizacionPendiente = r;
      },
    });
  }
  app.querySelector('[data-accion="cerrar-fiscalizacion"]')?.addEventListener('click', () => {
    fiscalizacionPendiente = null;
    pantallaCarrera(carrera);
    window.scrollTo(0, 0);
  });
  app.querySelector('[data-accion="cerrar-debate"]')?.addEventListener('click', () => {
    debatePendiente = null;
    pantallaCarrera(carrera);
    window.scrollTo(0, 0);
  });
  app.querySelector('[data-accion="cerrar-resultado"]')?.addEventListener('click', () => {
    resultadoPendiente = null;
    pantallaCarrera(carrera);
    window.scrollTo(0, 0);
  });
  app.querySelector('[data-accion="inicio"]')!.addEventListener('click', pantallaInicio);
  app
    .querySelector('[data-accion="historia"]')!
    .addEventListener('click', () => document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth' }));
  app.querySelector('[data-accion="tienda"]')?.addEventListener('click', () => tiendaDe(carrera, seguir));
  // Si se acaba de comprar algo, la tienda vuelve a abrirse donde estaba.
  if (tiendaEn !== null) {
    const desplazamiento = tiendaEn;
    tiendaEn = null;
    tiendaDe(carrera, seguir, desplazamiento);
  }
  app.querySelector('[data-accion="mudarse"]')?.addEventListener('click', async () => {
    if (
      await confirmar(`¿Te mudás a Buenos Aires? Cuesta ${dolares(COSTO_MUDANZA)} y perdés la mitad de tu Territorio.`, {
        aceptar: 'Mudarme',
      })
    ) {
      seguir(mudarseABuenosAires(carrera));
    }
  });
  app.querySelector('[data-accion="delfin"]')?.addEventListener('click', async () => {
    if (
      await confirmar(
        `¿Sumás a alguien joven de tu espacio como tu delfín? Cuesta ${dolares(COSTO_DELFIN)} y Poder −${PODER_DELFIN}. Crece con tu construcción, te ayuda en las elecciones y puede heredar tu lugar. Si lo descuidás, se va.`,
        { aceptar: 'Formar un delfín' },
      )
    ) {
      seguir(formarDelfin(carrera));
    }
  });
  app.querySelector('[data-accion="retirarse"]')?.addEventListener('click', async () => {
    if (await confirmar('¿Seguro que querés retirarte de la política? La carrera termina acá.', { aceptar: 'Retirarme', peligro: true })) {
      seguir(retirarse(carrera, 'retiro'));
    }
  });
  app.querySelector('[data-accion="privado"]')?.addEventListener('click', async () => {
    if (
      await confirmar('¿Dejás la política para trabajar en el sector privado? La carrera termina acá.', {
        aceptar: 'Pasar al privado',
        peligro: true,
      })
    ) {
      seguir(retirarse(carrera, 'privado'));
    }
  });
}

/** La carta elegida se destaca, el efecto sube flotando y recién ahí pasa el año. */
function lanzarCarta(boton: HTMLButtonElement, etiqueta: string, despues: () => void) {
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducido) return despues();
  app.querySelectorAll<HTMLButtonElement>('[data-carta]').forEach((b) => {
    b.disabled = true;
    b.classList.add(b === boton ? 'elegida' : 'descartada');
  });
  const flotante = document.createElement('div');
  flotante.className = 'efecto-flotante';
  flotante.innerHTML = etiqueta;
  const r = boton.getBoundingClientRect();
  flotante.style.left = `${r.left + r.width / 2}px`;
  flotante.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(flotante);
  setTimeout(() => {
    flotante.remove();
    window.scrollTo(0, 0);
    despues();
  }, 900);
}

/** Solo aparece mientras hacés política lejos de Buenos Aires. */
function panelBase(carrera: Carrera) {
  if (enElCentroDelPoder(carrera)) return '';
  const puede = puedeMudarse(carrera);
  return `
    <section class="panel base-interior cartelera">
      <p class="cartelera-sobre">Advertencia territorial</p>
      <h3>Lejos del poder</h3>
      <p class="ayuda">Hacés política en ${escapar(carrera.base)}. Desde acá la fama rinde la mitad y te olvidan más rápido. Para crecer, tarde o temprano vas a tener que instalarte en Buenos Aires.</p>
      <p class="aviso-base">${puede ? `Ya podés mudarte desde el botón de arriba: ${dolares(COSTO_MUDANZA)} y la mitad de tu Territorio.` : `Para mudarte necesitás ${dolares(COSTO_MUDANZA)} en la caja.`}</p>
    </section>`;
}

/** El último año en que se repartieron cartas: solo se dan vuelta una vez por año. */
let ultimoReparto = -1;

function panelArmado(carrera: Carrera) {
  const repartir = ultimoReparto !== carrera.anio;
  ultimoReparto = carrera.anio;
  if (repartir) sonar('reparto');
  return `
    <section class="panel armado-anual">
      <header class="franja-turno">
        <span class="franja-sobre">Toma de decisiones</span>
        <h3>Armado del ${carrera.anio}</h3>
        <span class="franja-grito">¡Es tu turno de elegir!</span>
        <p class="ayuda">Elegí en qué invertís este año. Después pasa el año. <span class="atajo">Atajo: teclas 1, 2 y 3.</span></p>
      </header>
      <div class="cartas ${repartir ? 'reparto' : ''}">
        ${carrera.cartas
          .map((carta, i) => {
            const def = buscarCarta(carta.id);
            const { clave, cantidad } = efectoDeCarta(carta, !enElCentroDelPoder(carrera), carrera);
            return `
            <button class="carta ${carta.rareza}" data-carta="${i}" style="--i:${i}">
              <span class="dorso" aria-hidden="true"></span>
              <span class="marca-agua" aria-hidden="true">${escapar(nombreDe(clave))}</span>
              <span class="tecla" aria-hidden="true">${i + 1}</span>
              <span class="rareza">${NOMBRE_RAREZA[carta.rareza]}</span>
              <strong>${escapar(def.nombre)}</strong>
              <span class="descripcion">${escapar(def.descripcion)}</span>
              <span class="chips">${chip(clave, cantidad)}</span>
            </button>`;
          })
          .join('')}
      </div>
    </section>`;
}

function panelDetencion(carrera: Carrera) {
  const disponibles = salidasDisponibles(carrera);
  const chancePelear = Math.round(probabilidadZafar(carrera) * 100);
  const opciones: { salida: SalidaDetencion; titulo: string; detalle: string; efectos: string }[] = [
    {
      salida: 'pelear',
      titulo: 'Pelear en la Justicia',
      detalle: `Si sale bien, seguís en carrera; si no, quedás detenido. Chance aproximada: ${chancePelear}%.`,
      efectos: chip('caja', -COSTO_ABOGADOS),
    },
    {
      salida: 'exilio',
      titulo: 'Irte del país',
      detalle: disponibles.includes('exilio')
        ? 'No vas preso, pero tu carrera en la Argentina se termina.'
        : `Necesitás ${dolares(COSTO_EXILIO)}, entre la caja y la plata negra, para irte.`,
      efectos: chip('caja', -COSTO_EXILIO),
    },
    {
      salida: 'entregarse',
      titulo: 'Entregarte',
      detalle: 'Te presentás ante el juez. Quedás detenido y la carrera termina.',
      efectos: '',
    },
  ];
  return `
    <section class="panel detencion">
      <p class="alerta">Orden de detención</p>
      <h3>Un juez federal ordenó tu detención</h3>
      <p class="ayuda">Las causas en tu contra avanzaron. Antes de que pase el año tenés que decidir qué hacer.</p>
      <div class="salidas-detencion">
        ${opciones
          .map(
            (o) => `
          <button class="opcion" data-salida="${o.salida}" ${disponibles.includes(o.salida) ? '' : 'disabled'}>
            <strong>${o.titulo}</strong>
            <span>${o.detalle}</span>
            ${o.efectos ? `<span class="chips">${o.efectos}</span>` : ''}
          </button>`,
          )
          .join('')}
      </div>
    </section>`;
}

/** Un aviso corto que aparece y se va solo. */
function avisar(texto: string) {
  const aviso = document.createElement('div');
  aviso.className = 'aviso-flotante';
  aviso.textContent = texto;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), 2200);
}

/* Entrevista */

function panelEntrevista(carrera: Carrera) {
  const e = carrera.entrevista!;
  const medio = MEDIOS[e.medio];
  const n = e.respuestas.length;
  const pregunta = buscarPregunta(e.preguntas[n]);
  return `
    <section class="panel entrevista" aria-live="polite">
      <div class="entrevista-cabeza">
        <span class="en-vivo">En vivo</span>
        <span class="medio">${medio.nombre}</span>
        <span class="contador">Pregunta ${n + 1} de ${e.preguntas.length}</span>
      </div>
      <div class="reloj" aria-hidden="true"><span data-reloj style="animation-duration:${SEGUNDOS_POR_PREGUNTA}s"></span></div>
      <p class="pregunta" data-clave-pregunta="${pregunta.id}">${escapar(pregunta.texto)}</p>
      <div class="respuestas">
        ${pregunta.respuestas
          .map(
            (r, i) => `
          <button class="respuesta" data-respuesta="${i}">
            <span class="letra">${'ABC'[i]}</span>
            <span>${escapar(r.texto)}</span>
          </button>`,
          )
          .join('')}
      </div>
      <p class="ayuda pie">Si se acaba el tiempo, te quedaste en blanco.</p>
    </section>`;
}

function contestar(carrera: Carrera, indice: number, seguir: (c: Carrera) => void) {
  pararReloj();
  const e = carrera.entrevista!;
  const ultima = e.respuestas.length === e.preguntas.length - 1;
  if (ultima) {
    resultadoPendiente = calcularResultado(carrera, { ...e, respuestas: [...e.respuestas, indice] });
  }
  app.querySelectorAll<HTMLButtonElement>('[data-respuesta]').forEach((b) => {
    b.disabled = true;
    if (Number(b.dataset.respuesta) === indice) b.classList.add('elegida');
  });
  setTimeout(() => seguir(responderEntrevista(carrera, indice)), 350);
}

function arrancarReloj(carrera: Carrera, seguir: (c: Carrera) => void) {
  const limite = Date.now() + SEGUNDOS_POR_PREGUNTA * 1000;
  reloj = window.setInterval(() => {
    if (!document.querySelector('[data-reloj]')) return pararReloj();
    if (Date.now() >= limite) contestar(carrera, -1, seguir);
  }, 200);
}

function panelResultado(r: ResultadoEntrevista) {
  const clase = r.fama > 0 ? 'bueno' : r.fama < 0 ? 'malo' : 'neutro';
  return `
    <section class="panel resultado-entrevista ${clase}">
      <p class="sobretitulo">Fin de la entrevista</p>
      <h3>${r.veredicto}</h3>
      <div class="resultado-chips">${chips({ fama: r.fama, ...(r.imagen ? { imagen: r.imagen } : {}) })}</div>
      <ol class="detalle-entrevista">
        ${r.detalle
          .map(
            (d) => `
          <li>
            <span class="q">${escapar(d.pregunta)}</span>
            <span class="a">${escapar(d.respuesta)}</span>
            <span class="puntos ${d.puntos > 0 ? 'bueno' : d.puntos < 0 ? 'malo' : 'neutro'}">${d.puntos > 0 ? 'Sumó' : d.puntos < 0 ? 'Restó' : 'Neutra'}</span>
          </li>`,
          )
          .join('')}
      </ol>
      ${r.extras.map((x) => `<p class="ayuda extra">${escapar(x)}</p>`).join('')}
      <button class="boton principal" data-accion="cerrar-resultado">Seguir</button>
    </section>`;
}

/** Los finales en los que seguís vivo y libre: podés quedarte como armador y apadrinar a alguien. */
const PUEDE_SER_ARMADOR = ['retiro', 'privado', 'salud'];

function palmares(carrera: Carrera) {
  if (!carrera.palmares.length) return '<p class="vacio">Una carrera sin logros para mostrar.</p>';
  return `<div class="logros">${carrera.palmares
    .map((l) => `<div class="logro"><span class="icono">${l.icono}</span><span>${escapar(l.texto)}</span><small>${l.anio}</small></div>`)
    .join('')}</div>`;
}

function trayectoria(carrera: Carrera) {
  if (!carrera.trayectoria.length) return '<p class="vacio">No llegó a pasar un año.</p>';
  return `
    <div class="tabla-desplazable">
      <table class="tabla-trayectoria">
        <thead><tr><th>Año</th><th>Edad</th><th>Cargo</th><th>Partido</th><th>Poder</th><th>Constr.</th><th>Fama</th><th>Imagen</th></tr></thead>
        <tbody>
          ${carrera.trayectoria
            .map(
              (f) => `<tr>
                <td>${f.anio}</td><td>${f.edad}</td><td>${CARGOS[f.cargo].nombre}</td>
                <td><span class="punto-partido" style="--color-partido:${PARTIDOS[f.partido].color}"></span>${PARTIDOS[f.partido].corto}</td>
                <td>${f.poder}</td><td>${f.construccion}</td><td>${f.fama}</td><td>${f.imagen}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

/** Cómo se nombra cada final en la tabla. */
const NOMBRE_FINAL: Record<MotivoFin, string> = {
  retiro: 'Retiro',
  privado: 'Sector privado',
  salud: 'Salud',
  muerte: 'Murió',
  preso: 'Preso',
  exilio: 'Exilio',
  destituido: 'Destituido',
  renuncia: 'Renunció',
  caos: 'Crisis institucional',
};

/** El Poder Histórico con su desglose. */
function bloqueHistorico(carrera: Carrera) {
  const ph = poderHistorico(carrera);
  const signo = (n: number) => `${n > 0 ? '+' : '−'}${Math.abs(n).toLocaleString('es-AR')}`;
  return `
    <div class="poder-historico">
      <p class="sobretitulo">Poder Histórico</p>
      <p class="ph-total">${ph.total.toLocaleString('es-AR')}</p>
      <ul class="ph-partes">
        ${ph.partes.map((p) => `<li><span>${escapar(p.texto)}</span><strong class="${p.valor < 0 ? 'malo' : 'bueno'}">${signo(p.valor)}</strong></li>`).join('')}
        <li class="ph-multiplicador"><span>${escapar(ph.motivoMultiplicador)}</span><strong>× ${ph.multiplicador.toLocaleString('es-AR')}</strong></li>
      </ul>
    </div>`;
}

/** Las mejores carreras de este navegador. */
function tablaHistoricos(tabla: CarreraHistorica[], resaltar?: string) {
  if (!tabla.length) return '';
  return `
    <section class="panel mejores-carreras">
      <h3>Las mejores carreras <span class="contador-titulo">en este navegador</span></h3>
      <div class="tabla-desplazable">
        <table class="tabla-trayectoria">
          <thead><tr><th>#</th><th>Nombre</th><th>Años</th><th>Llegó a</th><th>Final</th><th>Poder Histórico</th></tr></thead>
          <tbody>
            ${tabla
              .map(
                (x, i) => `<tr class="${x.id === resaltar ? 'resaltada' : ''}">
                  <td>${i + 1}</td><td>${escapar(x.nombre)}</td><td>${x.desde}–${x.hasta}</td><td>${escapar(x.cargoMax)}</td>
                  <td>${NOMBRE_FINAL[x.final]}</td><td><strong>${x.puntos.toLocaleString('es-AR')}</strong></td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function pantallaFin(carrera: Carrera) {
  pararReloj();
  document.body.classList.remove('sin-scroll');
  const fin = carrera.fin!;
  const anios = fin.anio - carrera.anioInicio;
  const etapa = etapaDe(carrera.construccion);
  const armador = PUEDE_SER_ARMADOR.includes(fin.motivo);
  const { tabla, id, puesto } = registrarCarrera(carrera);
  const padrino: Padrino = {
    nombre: carrera.nombre,
    partido: carrera.partido,
    construccion: carrera.construccion,
    caja: carrera.medidores.caja,
  };
  const herederos: Padrino[] = (carrera.delfines ?? []).map((d) => ({ ...padrino, delfin: d }));
  const chipsHerencia = (p: Padrino) => {
    const h = herencia(p);
    return `<span class="chips"><span class="chip bueno">+${h.rosca} Rosca</span><span class="chip bueno">+${h.construccion} Construcción</span>${h.caja > 0 ? `<span class="chip bueno">+${dolares(h.caja)} Caja</span>` : ''}</span>`;
  };
  app.innerHTML = `
    <section class="carrera">
      ${tableroSuperior(carrera, false)}
      <section class="panel fin">
        <h3>Fin de la carrera</h3>
        <p class="motivo">${TEXTO_FIN[fin.motivo]}</p>
        <p>${anios} años de política, de ${carrera.anioInicio} a ${fin.anio}. Terminaste a los ${fin.edad} años, como ${ETAPA[etapa].nombre} ${escapar(delPartido(carrera.partido))}.</p>
        ${bloqueHistorico(carrera)}
        ${puesto ? `<p class="puesto">🏆 Puesto ${puesto} entre tus mejores carreras.</p>` : ''}
        <div class="acciones">
          <button class="boton principal" data-accion="nueva">Nueva carrera</button>
          <button class="boton" data-accion="inicio">Volver al inicio</button>
        </div>
      </section>
      ${
        armador
          ? `<section class="panel armador">
              <p class="sobretitulo">Tu legado</p>
              <h3>Seguí como armador: pasale la posta a un delfín</h3>
              <p class="ayuda">Dejás la primera línea, pero no la política. Le pasás tus contactos y parte de tu gente${herederos.length ? ': a uno de los delfines que formaste, que hereda más cuanto más lo hiciste crecer, o a alguien nuevo' : ' a alguien joven de tu espacio'}.</p>
              ${herederos
                .map(
                  (p, i) => `<div class="heredero">
                    <p><strong>🐬 ${escapar(p.delfin!.nombre)}</strong> · crecimiento ${p.delfin!.nivel} · talento ${p.delfin!.talento} · lealtad ${p.delfin!.lealtad}</p>
                    ${chipsHerencia(p)}
                    <button class="boton principal" data-accion="heredero" data-indice="${i}">Pasarle la posta a ${escapar(p.delfin!.nombre)}</button>
                  </div>`,
                )
                .join('')}
              <div class="heredero">
                ${herederos.length ? '<p><strong>Alguien nuevo</strong></p>' : ''}
                ${chipsHerencia(padrino)}
                <button class="boton ${herederos.length ? '' : 'principal'}" data-accion="armador">Apadrinar a alguien nuevo</button>
              </div>
            </section>`
          : ''
      }
      ${tablaHistoricos(tabla, id)}
      <section class="panel">
        <h3>Palmarés <span class="contador-titulo">${carrera.palmares.length}</span></h3>
        ${palmares(carrera)}
      </section>
      <section class="panel">
        <h3>Tu trayectoria <span class="contador-titulo">${carrera.trayectoria.length} años</span></h3>
        ${trayectoria(carrera)}
      </section>
      <section class="panel"><h3>Tu historia</h3><div class="historial">${historial(carrera)}</div></section>
    </section>`;
  recienCambio = false;
  app.querySelector('[data-accion="nueva"]')!.addEventListener('click', () => {
    borrarCarrera();
    armar();
  });
  app.querySelector('[data-accion="armador"]')?.addEventListener('click', () => {
    borrarCarrera();
    armar(padrino);
  });
  for (const boton of app.querySelectorAll<HTMLElement>('[data-accion="heredero"]')) {
    boton.addEventListener('click', () => {
      borrarCarrera();
      armar(herederos[Number(boton.dataset.indice)]);
    });
  }
  app.querySelector('[data-accion="inicio"]')!.addEventListener('click', pantallaInicio);
}

pantallaInicio();
