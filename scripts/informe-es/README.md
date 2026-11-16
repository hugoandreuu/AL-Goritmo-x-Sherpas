# Texto del informe en castellano

Un archivo por caso (`<caso>.json`) con la traducción del campo `narrative` de `financial-health` (claves `fh.…`) e `investment-analysis` (claves `ia.…`). Es el texto que pinta el informe en PDF, sección a sección. La app lo enseña en el desplegable "Lo que dice el informe" de cada tema y en la nota general.

Cada entrada es `{ "en": "<huella>", "es": "<texto>" }`:

- `en` es la huella del texto en inglés (los 12 primeros caracteres del sha1). Si Sherpas cambia el texto, `npm run estudio` descarta esa traducción y avisa en `generado.avisos`.
- `es` usa el mismo markdown mínimo que el original: viñetas con `- ` y negritas con `**…**`.

Al generar el estudio se comprueba que **toda cifra de la traducción esté en el original** (si no, se descarta) y que **no falte ninguna cifra del original** (si falta, avisa). Las cifras van como en castellano: `1.177.586 $`, `5,6 %`.

Para retraducir una entrada: cambia `es`, pon en `en` la huella nueva y vuelve a lanzar `npm run estudio`:

```bash
node -e "const c=require('crypto');console.log(c.createHash('sha1').update(require('./cases/<caso>/financial-health.json').narrative['<clave>']).digest('hex').slice(0,12))"
```
