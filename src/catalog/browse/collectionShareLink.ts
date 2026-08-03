// F50 · Etapa 8 (P7 share) · v2 · util para encode/decode del share link
// de una colección en la URL. Client-side only · no hay backend.
//
// Sin servidor no existe un "signed link" real (nadie que valide firmas
// contra un secreto privado). La alternativa honesta es:
//
//   1. Serializar el snapshot mínimo de la colección (nombre + productIds
//      + timestamp) en JSON compacto.
//   2. Encodear en base64 url-safe.
//   3. Anexar un HMAC-lite calculado con una key mock hardcodeada. Esto
//      NO protege contra un atacante — solo evita que un typo en la URL
//      abra una vista ambigua. Documentado así explícitamente en el
//      banner de la vista compartida.
//
// Cuando exista backend, este módulo se vuelve wrapper del endpoint real
// (POST /collections/{id}/share → devuelve link firmado con expiración).

import type { Collection } from './useCollections'

// Payload compacto · lo mínimo para renderear el share view.
export interface SharedCollectionPayload {
    n: string           // name
    p: string[]         // productIds
    t: string           // ISO timestamp del share
    v: 1                // schema version
}

const MOCK_KEY = 'strata-catalog-share-v1'

// HMAC-lite · hash simple determinístico. No es criptográfico · solo
// integridad básica contra typos en la URL. Producción usaría crypto.subtle.
function mockHmac(input: string): string {
    let h = 5381
    const combined = input + MOCK_KEY
    for (let i = 0; i < combined.length; i++) {
        h = ((h << 5) + h) ^ combined.charCodeAt(i)
        h = h & 0x7fffffff
    }
    return h.toString(36)
}

// base64 url-safe (RFC 4648 §5 · no `+/=`).
function encodeB64Url(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
}

function decodeB64Url(str: string): string {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    return decodeURIComponent(escape(atob(b64 + pad)))
}

/** Encode a share link · devuelve una URL absoluta con ?share= y ?sig=. */
export function encodeCollectionShareLink(collection: Collection, baseUrl?: string): string {
    const payload: SharedCollectionPayload = {
        n: collection.name,
        p: [...collection.productIds],
        t: new Date().toISOString(),
        v: 1,
    }
    const json = JSON.stringify(payload)
    const share = encodeB64Url(json)
    const sig = mockHmac(share)
    const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '')
    return `${base}?share=${share}&sig=${sig}`
}

export interface DecodeResult {
    ok: boolean
    payload?: SharedCollectionPayload
    error?: 'missing' | 'bad-signature' | 'bad-payload' | 'unsupported-version'
}

/** Decode a share link a partir de un URLSearchParams. */
export function decodeCollectionShareLink(search: URLSearchParams | string): DecodeResult {
    const params = typeof search === 'string' ? new URLSearchParams(search) : search
    const share = params.get('share')
    const sig = params.get('sig')
    if (!share || !sig) return { ok: false, error: 'missing' }
    if (mockHmac(share) !== sig) return { ok: false, error: 'bad-signature' }
    try {
        const json = decodeB64Url(share)
        const parsed = JSON.parse(json) as SharedCollectionPayload
        if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'bad-payload' }
        if (parsed.v !== 1) return { ok: false, error: 'unsupported-version' }
        if (typeof parsed.n !== 'string' || !Array.isArray(parsed.p) || typeof parsed.t !== 'string') {
            return { ok: false, error: 'bad-payload' }
        }
        return { ok: true, payload: parsed }
    } catch {
        return { ok: false, error: 'bad-payload' }
    }
}
