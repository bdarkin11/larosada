import { expect, type Page, test } from '@playwright/test';

const CLAVE = 'larosada.carrera';

interface CarreraGuardada {
  nombre: string;
  edad: number;
  anio: number;
  cargo: string;
  cartas: unknown[];
  evento?: unknown;
  historial: { lineas: string[] }[];
}

async function leerCarrera(page: Page): Promise<CarreraGuardada> {
  const texto = await page.evaluate((clave) => localStorage.getItem(clave), CLAVE);
  expect(texto, 'la carrera tiene que estar guardada').not.toBeNull();
  return JSON.parse(texto!);
}

/** Cierra los festejos que haya (al llegar a los 35 suele haber uno de etapa). */
async function cerrarFestejos(page: Page) {
  const seguir = page.locator('[data-accion="seguir-pendiente"]');
  while (await seguir.isVisible()) await seguir.click();
}

/** Hace el armado completo con lo primero que ofrece cada paso y devuelve la carrera guardada. */
async function armarPersonaje(page: Page, nombre: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Nueva carrera' }).click();

  const siguiente = page.locator('[data-accion="siguiente"]');
  for (const grupo of ['origen', 'estilo', 'carta']) {
    await expect(page.locator(`[data-grupo="${grupo}"]`)).toBeVisible();
    await page.locator(`[data-grupo="${grupo}"] [data-valor]`).first().click();
    await expect(siguiente).toBeEnabled();
    await siguiente.click();
  }

  await page.locator('[data-campo="nombre"]').fill(nombre);
  await expect(siguiente).toHaveText('Empezar la carrera');
  await siguiente.click();

  // Los años de militancia: cuatro decisiones hasta los 35.
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('.formacion')).toBeVisible();
    await page.locator('[data-formacion]').first().click();
  }
  await expect(page.locator('[data-carta]')).toHaveCount(3);
  await cerrarFestejos(page);
}

test('se arma un personaje nuevo y arranca la carrera', async ({ page }) => {
  await armarPersonaje(page, 'Prueba Automática');

  await expect(page.getByText('Prueba Automática').first()).toBeVisible();
  await expect(page.locator('.armado-anual')).toBeVisible();
  await expect(page.locator('[data-carta]')).toHaveCount(3);

  const carrera = await leerCarrera(page);
  expect(carrera.nombre).toBe('Prueba Automática');
  expect(carrera.edad).toBe(35);
  expect(carrera.cargo).toBe('militante');
  expect(carrera.evento).toBeUndefined();
});

test('las teclas 1, 2 y 3 eligen la carta que corresponde', async ({ page }) => {
  await armarPersonaje(page, 'Prueba de Atajos');
  await expect(page.locator('[data-carta]')).toHaveCount(3);
  const inicial = await page.evaluate((clave) => localStorage.getItem(clave)!, CLAVE);
  const anio = JSON.parse(inicial).anio;

  for (const tecla of ['1', '2', '3']) {
    // Cada tecla arranca del mismo año recién armado.
    await page.evaluate(([clave, valor]) => localStorage.setItem(clave, valor), [CLAVE, inicial]);
    await page.reload();
    await page.locator('[data-accion="continuar"]').click();
    await cerrarFestejos(page);

    const carta = page.locator(`[data-carta="${Number(tecla) - 1}"]`);
    await expect(carta).toBeEnabled();
    const nombreCarta = (await carta.locator('strong').textContent())!.trim();

    await page.keyboard.press(tecla);
    await expect(carta).toHaveClass(/elegida/);
    await expect(page.locator('[data-carta].descartada')).toHaveCount(2);

    await expect
      .poll(async () => (await leerCarrera(page)).anio, { message: `la tecla ${tecla} pasa uno o dos años` })
      .toBeGreaterThan(anio);
    const historial = JSON.stringify((await leerCarrera(page)).historial);
    expect(historial).toContain(`Armado del año: ${nombreCarta}`);
  }
});

test('otras teclas no eligen ninguna carta', async ({ page }) => {
  await armarPersonaje(page, 'Prueba de Teclas');
  const antes = await leerCarrera(page);

  for (const tecla of ['4', '0', 'a']) await page.keyboard.press(tecla);
  await page.keyboard.press('Control+1');

  await expect(page.locator('[data-carta].elegida')).toHaveCount(0);
  expect((await leerCarrera(page)).anio).toBe(antes.anio);
});
