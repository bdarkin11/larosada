"""
Reemplazo quirúrgico para archivos grandes: cada texto a buscar tiene que
aparecer exactamente una vez, o no se toca nada.

Uso:
    python herramientas/reemplazar.py cambios.json

cambios.json:
    [
      {"archivo": "src/main.ts", "buscar": "texto viejo", "poner": "texto nuevo"},
      ...
    ]

Todo se valida antes de escribir: si un solo cambio falla, ningún archivo
cambia. Respeta los saltos de línea que tenga cada archivo (LF o CRLF).
"""

import io
import json
import sys


def main(ruta_cambios: str) -> int:
    with io.open(ruta_cambios, encoding="utf-8") as f:
        cambios = json.load(f)

    textos: dict[str, str] = {}
    finales: dict[str, str] = {}
    errores = []
    for i, c in enumerate(cambios, 1):
        archivo = c["archivo"]
        if archivo not in textos:
            with io.open(archivo, encoding="utf-8", newline="") as f:
                textos[archivo] = f.read()
            finales[archivo] = "\r\n" if "\r\n" in textos[archivo] else "\n"
        fin = finales[archivo]
        buscar = c["buscar"].replace("\r\n", "\n").replace("\n", fin)
        poner = c["poner"].replace("\r\n", "\n").replace("\n", fin)
        veces = textos[archivo].count(buscar)
        if veces != 1:
            errores.append(f"#{i} {archivo}: aparece {veces} veces → {c['buscar'][:80]!r}")
            continue
        textos[archivo] = textos[archivo].replace(buscar, poner)

    if errores:
        print("No se cambió nada:\n  " + "\n  ".join(errores))
        return 1
    for archivo, texto in textos.items():
        with io.open(archivo, "w", encoding="utf-8", newline="") as f:
            f.write(texto)
    print(f"{len(cambios)} cambios en {len(textos)} archivos.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
