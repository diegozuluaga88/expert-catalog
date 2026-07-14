# Security · expert-catalog

Este repo fue infectado **dos veces** con el mismo payload de malware
JavaScript obfuscado. Este documento describe la signature, cómo
detectarlo, cómo limpiarlo, y las defensas activas.

## Payload signature

El payload se agrega al final de archivos `.mjs`, `.cjs`, `.js`, `.ts`
de config/build (no toca source `.tsx` de React). Empieza con:

```
global.o='5-2-234-du';
var _$_aeb0=(function(d,n){var g=d.length;var b=[];...})("i%abiec_eli__dedme%ufenr_am%tmnnrd_%%jnfo_e",5050678);
```

Y contiene un IIFE con:

```
var HfX=Tmx('sorcpfzxactkbcodighturntlyqorseujwvnm').substr(0,dqI);
var yQx='var   krcctfga(=vh,...';
var rEf=xsk(EmA,hlD);rEf(4950);
```

La función `Tmx()` hace un shuffling determinístico de strings + un
`require` dinámico oculto. Al ejecutarse (via `node`, `vite`, `postcss`,
o cualquier build tool que cargue el archivo), llama a `rEf(4950)` que
dispara el payload real.

## Detección rápida

```bash
grep -rE "_\$_aeb0|global\.o='5-2-234-du'|Tmx\('sorcpf|rEf\(4950\)" \
  src/ scripts/ packages/ postcss.config.js \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

Debe retornar 0 hits. Si encuentra algo, seguir el procedimiento de
limpieza abajo.

Alternativa · `node scripts/scan-security.mjs` (equivalente).

## Historial de incidentes

| Fecha | Commit cleanup | Alcance | Notas |
|---|---|---|---|
| 2026-06-23 | `0b0cc3b` | 1 archivo (`postcss.config.js`) | Primera limpieza · sin dejar guardas |
| 2026-07-14 | `751690f` | 11 archivos (postcss + build-tokens + scripts + strata-ds api ts) | Segunda limpieza · agregamos prevención (este archivo + hook + scanner) |

## Archivos históricamente afectados

Todos son archivos que se cargan al hacer `npm run build` o `npm run dev`
(y por tanto **ejecutan** el payload):

- `postcss.config.js` · cargado por vite en cada build/dev
- `scripts/sync-tokens.mjs`
- `scripts/promote-component.mjs`
- `scripts/fix-design-tokens.mjs`
- `scripts/audit-design-tokens.mjs`
- `packages/strata-ds/postcss.config.cjs`
- `packages/strata-ds/build-tokens.mjs`
- `packages/strata-ds/scripts/validate-tokens.mjs`
- `packages/strata-ds/api/src/server.ts`
- `packages/strata-ds/api/src/utils/test-update-flow.ts`
- `packages/strata-ds/api/src/config/figma-webhook-setup.ts`

## Síntomas de infección

- Vercel deploys hang **~45min** y salen con `Error` (build script queda
  atrapado en el payload).
- Local `npm run build` cuelga · `npm run dev` puede parecer OK pero está
  ejecutando el payload en background.
- Diff de un commit muestra `+4/-4` líneas en varios archivos de config
  que NO tocaste explícitamente.

## Procedimiento de limpieza

1. **DETENER** todo proceso corriendo: `npm run dev`, `npm run build`,
   cualquier terminal ejecutando node en este repo.
2. Verificar `node_modules` limpio · si tiene el payload, **borrar
   `node_modules` completo** y `package-lock.json`, y re-instalar con
   `npm install` (auditar).
3. Restaurar los archivos infectados desde un commit limpio:
   ```
   git checkout <last-clean-commit> -- <infected-file>
   ```
   El último Vercel-Ready confiable históricamente es `a636e79` (post
   D0-P8 del refactor MRL).
4. Correr el scan (`node scripts/scan-security.mjs`) · debe retornar 0.
5. Commit · `git commit -m "security: remove re-injected obfuscated
   malware from ..."`.
6. Push · Vercel debe compilar en <2 min y quedar Ready.

## Defensas activas en este repo

### 1. `SECURITY.md` (este archivo)

Documenta el payload. Cualquier agente (Claude, Copilot, Cursor) o dev
humano que audite el repo puede detectar.

### 2. `.githooks/pre-commit`

Script bash que corre el scan antes de cada `git commit`. Si detecta el
pattern en los archivos staged, aborta el commit.

**Activar** (una vez por clone):
```
git config core.hooksPath .githooks
```

### 3. `scripts/scan-security.mjs`

Node script standalone que escanea todo el repo (excluye `node_modules`,
`.git`, `dist`). Exit code 1 si encuentra pattern · 0 si limpio.

Uso manual:
```
node scripts/scan-security.mjs
```

### 4. Build guard en `package.json`

El script `build` incluye el scan como primer paso · Vercel también
falla temprano (<5s) si detecta payload, no espera 45min de timeout:

```json
"build": "node scripts/scan-security.mjs && ..."
```

## Verificación cruzada

Cada vez que hagas `git status` y aparezcan cambios inesperados en:
- `postcss.config.js` / `postcss.config.cjs`
- `build-tokens.mjs`
- Cualquier `.mjs` en `scripts/` o `packages/strata-ds/scripts/`
- `packages/strata-ds/api/src/**/*.ts`

**REVISAR EL DIFF ANTES DE `git add`**. Nunca hagas `git add -A` si esos
archivos aparecen como Modified sin razón conocida.

## Vector de infección · desconocido (pendiente investigación)

Node modules escaneado y limpio · no es supply-chain vía NPM. Otros
repos Strata escaneados y limpios · no es un ataque cross-repo.

Hipótesis:
- Extensión de editor (VS Code / Cursor) con acceso al filesystem que
  modifica archivos.
- Script postinstall de algún tool instalado globalmente.
- Actor con acceso al repo push directo (verificar `git log --format="%an
  %ae %s"` en commits afectados).

**Acción recomendada** si vuelve a aparecer: correr `find . -name "*.mjs"
-newer /tmp/last-known-clean -not -path "./node_modules/*"` para ver qué
se modificó desde el último baseline.
