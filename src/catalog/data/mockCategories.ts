// MRL Fase 9 (2026-07-10) · Mock categorías para el sidebar del MRL.
//
// El referente myresourcelibrary.com tiene ~24 categorías genéricas
// (Accessories, Acoustic, Architectural Products, ... Workplace Hygiene)
// con counts inflados que dan la sensación de "biblioteca grande".
// Nuestro seed sólo tiene categorías reales de los ~10 manufacturers con
// productos populados (Chairs, Sofas, Systems Casegoods, etc.). Para
// aproximar el look del sidebar del referente, exportamos aquí la lista
// COMPLETA que FilterSidebar renderiza en el tab Products.
//
// Estas categorías son de DISPLAY únicamente · click en cualquiera de
// ellas dispara el filter en LibraryPage; los binders reales aparecen
// solo si algún `manufacturer.categories[].name` matchea (case-sensitive)
// con el label acá. Las que no matcheen dejan el shelf vacío (empty
// state existente cubre el UX). Diego usará esto solo para mostrar el
// look, no para navegar.

export interface MockCategory {
    /** Nombre visible + valor que se emite al FilterSidebar como filter key. */
    name: string
    /** Count hardcoded que se muestra entre paréntesis · Nielsen H2 real
     *  world · replica los números que ve el user en el referente. */
    count: number
}

/** Categorías del tab Products · lista y counts calcados del referente
 *  MRL para dar sensación de biblioteca a escala. Orden alfabético. */
export const MOCK_PRODUCT_CATEGORIES: MockCategory[] = [
    { name: 'Accessories',            count: 1466 },
    { name: 'Acoustic',               count: 738 },
    { name: 'Architectural Products', count: 107 },
    { name: 'Casegoods',              count: 797 },
    { name: 'Childrens Furniture',    count: 1666 },
    { name: 'Education',              count: 5903 },
    { name: 'Ergonomic',              count: 917 },
    { name: 'Healthcare',             count: 2374 },
    { name: 'Lighting',               count: 277 },
    { name: 'Locks & Locking Systems', count: 465 },
    { name: 'Media Center-Library',   count: 138 },
    { name: 'Outdoor',                count: 2922 },
    { name: 'Power & Data',           count: 605 },
    { name: 'Presentation',           count: 773 },
    { name: 'Privacy',                count: 529 },
    { name: 'Seating',                count: 11397 },
    { name: 'Senior Living',          count: 9967 },
    { name: 'Signage',                count: 97 },
    { name: 'Space Defining',         count: 190 },
    { name: 'Storage',                count: 2316 },
    { name: 'Systems Furniture',      count: 219 },
    { name: 'Tables',                 count: 4656 },
    { name: 'Wallcovering',           count: 2 },
    { name: 'Workplace Hygiene',      count: 184 },
]

/** Categorías del tab Materials · lista corta (el referente usa un solo
 *  radio "Textiles" con count global). Se deja como stub por si Diego
 *  quiere expandirla luego. */
export const MOCK_MATERIAL_CATEGORIES: MockCategory[] = [
    { name: 'Upholstery',    count: 3421 },
    { name: 'Wallcovering',  count: 1189 },
    { name: 'Panel',         count: 542 },
    { name: 'Acoustic',      count: 316 },
    { name: 'Cubicle',       count: 208 },
    { name: 'Drapery',       count: 174 },
]
