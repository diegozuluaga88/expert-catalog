#!/usr/bin/env node
// expert-catalog · security scanner
//
// Escanea el repo por el payload malicioso documentado en SECURITY.md.
// Exit code 1 si detecta hits · 0 si limpio.
//
// Corrido automáticamente por `npm run build` (guard) · también manual:
//   node scripts/scan-security.mjs
//
// Se usa sin dependencias externas (fs + regex) para que no dependa de
// npm install · queda operativo aún en un clone recién hecho.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/* ─── Signature ────────────────────────────────────────────────────────
   Patterns característicos del payload obfuscado. Basta con que UNO
   matchee para marcar el archivo como infectado. */
const PATTERNS = [
    /_\$_aeb0/,
    /global\.o='5-2-234-du'/,
    /Tmx\('sorcpf/,
    /rEf\(4950\)/,
]

/* ─── Directorios a excluir ─────────────────────────────────────────── */
const EXCLUDE_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.vercel',
    'coverage',
])

/* ─── Extensiones a escanear ────────────────────────────────────────── */
const EXTENSIONS = new Set([
    '.mjs', '.cjs', '.js',
    '.mts', '.cts', '.ts',
    '.tsx', '.jsx',
    '.json',
])

function walk(dir, hits) {
    let entries
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
        return
    }
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (EXCLUDE_DIRS.has(entry.name)) continue
            walk(path.join(dir, entry.name), hits)
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (!EXTENSIONS.has(ext)) continue
            const filePath = path.join(dir, entry.name)
            let content
            try {
                content = fs.readFileSync(filePath, 'utf-8')
            } catch {
                continue
            }
            for (const pattern of PATTERNS) {
                if (pattern.test(content)) {
                    hits.push({ file: path.relative(ROOT, filePath), pattern: pattern.source })
                    break
                }
            }
        }
    }
}

const startedAt = Date.now()
const hits = []
walk(ROOT, hits)
const elapsedMs = Date.now() - startedAt

if (hits.length === 0) {
    console.log(`✅ security-scan · clean (${elapsedMs}ms)`)
    process.exit(0)
}

console.error('')
console.error('╔══════════════════════════════════════════════════════════════╗')
console.error('║ 🛑  SECURITY · MALWARE PATTERN DETECTED                      ║')
console.error('╚══════════════════════════════════════════════════════════════╝')
console.error('')
console.error(`${hits.length} file(s) infected:`)
for (const h of hits) {
    console.error(`  · ${h.file}   [${h.pattern}]`)
}
console.error('')
console.error('Ver SECURITY.md · procedimiento de limpieza.')
console.error('')
process.exit(1)
