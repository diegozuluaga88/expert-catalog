// Custom Item Flag & Governance · US-013 (2026-08-28)
// ───────────────────────────────────────────────────
// P0 del programa UW y, según el PRD, "el requisito más enfatizado y
// acordado con el cliente en discovery".
//
// La historia, textual:
//
//   "Como Standards Administrator, quiero marcar un estándar como custom
//    o parcialmente custom para que el staff no pueda pedirlo
//    accidentalmente en bloque como si fuera un ítem de catálogo
//    estándar."
//
// El riesgo que previene es concreto y caro: pedir 200 unidades de una
// configuración que el fabricante arma a medida, creyendo que es stock.
//
// ── Tres niveles, no un booleano
//
// El modelo de datos del PRD declara `Standard.IsCustom` como Boolean,
// pero el criterio de aceptación pide marcar "custom **o parcialmente
// custom**", con "checkbox **o equivalente**". Dos conceptos no entran
// en un booleano, así que acá son tres niveles y el booleano del backend
// se deriva de ellos (`isCustom = level !== 'standard'`).
//
// `partial` es el caso real de UW: un producto de catálogo estándar con
// una modificación —un acabado fuera de la carta, una medida especial—
// que basta para que deje de comportarse como stock.
//
// ── De dónde sale la marca
//
// **En producción es una decisión administrativa**, no un dato del
// fabricante: el Standards Administrator marca el registro, y los
// históricos pueden marcarse retroactivamente durante la migración (el
// PRD cita CHRG09 como ejemplo).
//
// Acá no se inventan marcas. Se derivan de la señal más cercana que el
// seed tiene —productos que declaran configuración especial, modular o
// de opciones en sus specs— y se deja `OVERRIDES` como el punto donde
// entraría la marca manual real.
//
// ── El umbral
//
// El criterio pide "un umbral configurable". **El número es decisión de
// UW y sigue abierto** — está en las preguntas pendientes. El valor de
// acá es un supuesto de trabajo, declarado como tal, no una propuesta.

import type { Product } from '../types'

export type CustomLevel = 'standard' | 'partial' | 'custom'

/** Supuesto de trabajo, no decisión. El umbral real lo define UW.
 *  El propio questionnaire advierte del riesgo de fatiga de alarma:
 *  "how often can it flag a legitimately standard bulk order before
 *  Jen/Amy start ignoring it?" — si avisa de más, se vuelve invisible. */
export const CUSTOM_QUANTITY_THRESHOLD = 10

/** Marcas manuales del administrador · en producción vendrían del
 *  registro, no del código. Vacío a propósito: no hay marcas reales que
 *  transcribir, y poner unas inventadas las volvería indistinguibles de
 *  las derivadas. */
const OVERRIDES: Record<string, CustomLevel> = {}

/* ── Derivación desde el seed ─────────────────────────────────────────
   Specs que sugieren un producto configurado antes que uno de stock.
   Es una aproximación declarada, no la marca real. */
const CONFIGURED_SIGNALS = ['SPECIAL', 'CONFIGURATION', 'MODULAR', 'OPTIONS']

function normalizeId(productId: string): string {
    // El pool unificado prefija con la marca (`allermuir__axyl`); el
    // seed jerárquico no. Se comparan sin prefijo.
    const i = productId.indexOf('__')
    return i === -1 ? productId : productId.slice(i + 2)
}

/** Nivel custom de un producto. */
export function customLevel(product: Product): CustomLevel {
    const override = OVERRIDES[normalizeId(product.id)]
    if (override) return override

    const keys = Object.keys({ ...(product.specs ?? {}), ...(product.performance ?? {}) })
        .map(k => k.trim().toUpperCase())

    const hasSignal = keys.some(k => CONFIGURED_SIGNALS.some(s => k === s || k.startsWith(s + ' ')))
    return hasSignal ? 'partial' : 'standard'
}

export function isCustomItem(product: Product): boolean {
    return customLevel(product) !== 'standard'
}

export const CUSTOM_LABEL: Record<Exclude<CustomLevel, 'standard'>, string> = {
    partial: 'Partially custom',
    custom: 'Custom',
}

/** Por qué está marcado · alimenta el tooltip y la advertencia. */
export const CUSTOM_EXPLANATION: Record<Exclude<CustomLevel, 'standard'>, string> = {
    partial:
        'Built on a catalogue product with a modification — a finish, a dimension, or a configuration outside the standard offering.',
    custom: 'Made to order. It does not behave like a stock item.',
}

export interface QuantityWarning {
    level: Exclude<CustomLevel, 'standard'>
    quantity: number
    threshold: number
    message: string
}

/**
 * La advertencia de cantidad del criterio de aceptación.
 *
 * Devuelve `null` cuando no aplica — el consumidor no debe decidir la
 * regla, solo mostrar lo que salga de acá.
 */
export function quantityWarning(product: Product, quantity: number): QuantityWarning | null {
    const level = customLevel(product)
    if (level === 'standard') return null
    if (quantity <= CUSTOM_QUANTITY_THRESHOLD) return null

    return {
        level,
        quantity,
        threshold: CUSTOM_QUANTITY_THRESHOLD,
        message:
            level === 'custom'
                ? `${quantity} units of a made-to-order item. Confirm lead time and pricing with the manufacturer before ordering.`
                : `${quantity} units of a modified product. The modification may not hold at this volume — confirm with the manufacturer.`,
    }
}
