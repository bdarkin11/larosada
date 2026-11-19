import { describe, expect, it } from 'vitest';
import { revisarTodo, tablaDeValores } from './balance';

const entorno = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

describe('equilibrio de los eventos', () => {
  it('ninguna opción está dominada, toda opción cede algo y las opciones valen parecido', () => {
    const problemas = revisarTodo();
    expect(problemas, problemas.join('\n')).toEqual([]);
  });

  // Para ajustar eventos: TABLA=archivo.txt npx vitest run balance
  it.runIf(!!entorno.TABLA)('tabla de valores', async () => {
    // @ts-ignore: los tipos de Node no están en el proyecto.
    const { writeFileSync } = await import('node:fs');
    writeFileSync(entorno.TABLA!, tablaDeValores());
  });
});
