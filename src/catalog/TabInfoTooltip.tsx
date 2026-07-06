// Fase 6.1 · TabInfoTooltip (2026-07-06 refactor)
// Trigger cambiado del tab entero al icono Info (Diego ask · el tooltip no
// debería aparecer al pasar el mouse para cambiar de tab).
// Positioning smart · align 'start' / 'center' / 'end' evita que se corte
// contra el borde del viewport.
// Contenido más compacto · menos texto denso, mejor jerarquía tipográfica,
// bullets con lucide Check icon (accesibles + visualmente pro).

import type { ReactNode } from 'react'
import { Info, Check } from 'lucide-react'

export interface TabInfo {
    title: string
    whatYouSee: string
    dataSource: string
    structure: string
    features: string[]
}

type Align = 'start' | 'center' | 'end'

interface TooltipProps {
    content: TabInfo
    align?: Align
}

/** Icon-only trigger · un botón Info que despliega el popover al hover.
 *  Diego ask · antes el trigger era el tab entero y aparecía accidentalmente
 *  al navegar. Ahora es explícito · click/hover en el (i) icon. */
export function TabInfoTrigger({ content, align = 'center' }: TooltipProps) {
    // Positioning del popover · start alinea con left del trigger,
    // end alinea con right, center centra sobre el trigger.
    const positionClass =
        align === 'start' ? 'left-0'
        : align === 'end' ? 'right-0'
        : 'left-1/2 -translate-x-1/2'
    const arrowClass =
        align === 'start' ? 'left-2'
        : align === 'end' ? 'right-2'
        : 'left-1/2 -translate-x-1/2'

    return (
        <span className="group/tt relative inline-flex items-center">
            {/* Trigger · icon (i) discreto */}
            <button
                type="button"
                tabIndex={-1}
                aria-label={`About ${content.title}`}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                onClick={e => e.stopPropagation()}
            >
                <Info className="h-3 w-3" strokeWidth={2} />
            </button>

            {/* Popover */}
            <div
                role="tooltip"
                className={`pointer-events-none absolute top-full ${positionClass} z-[70] mt-2 w-[320px] opacity-0 invisible translate-y-1 transition-all duration-150 delay-200 group-hover/tt:pointer-events-auto group-hover/tt:opacity-100 group-hover/tt:visible group-hover/tt:translate-y-0`}
            >
                {/* Arrow */}
                <div className={`absolute -top-1.5 ${arrowClass} h-3 w-3 rotate-45 border-l border-t border-border bg-card`} />

                <div className="relative rounded-xl border border-border bg-card shadow-xl">
                    {/* Header · solo title, compacto */}
                    <div className="border-b border-border px-3.5 py-2.5">
                        <h4 className="text-sm font-bold text-foreground leading-tight">{content.title}</h4>
                    </div>

                    <div className="px-3.5 py-3 space-y-3">
                        {/* What you'll see */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Purpose
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.whatYouSee}</p>
                        </div>

                        {/* Data source */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Data source
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.dataSource}</p>
                        </div>

                        {/* Visual structure */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Layout
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{content.structure}</p>
                        </div>

                        {/* Features · list nativa con Check icon como bullet */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                Features
                            </div>
                            <ul role="list" className="space-y-1">
                                {content.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-relaxed">
                                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" strokeWidth={2.5} aria-hidden="true" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </span>
    )
}

/** Wrapper legacy · mantiene la API previa (children pattern) por si otros
 *  callers dependen de él. Deprecado en favor de TabInfoTrigger. */
export default function TabInfoTooltip({ content, children }: { content: TabInfo; children: ReactNode }) {
    return <>{children}<TabInfoTrigger content={content} /></>
}

/* ═══════════════════════════════════════════════════════════════════════
   Contenido de cada tab · versión refinada (menos texto denso · más scan-able).
   ═══════════════════════════════════════════════════════════════════════ */

export const TAB_INFO_MRL: TabInfo = {
    title: 'MRL · Manufacturer Reference Library',
    whatYouSee: 'Vista jerárquica clásica marca → categoría → producto con detalle rico y documentación.',
    dataSource: 'manufacturers.ts · Allermuir, Allsteel, AIS + acústicos Camira, HBF, Luum, Mayer.',
    structure: 'Library → Brand page (hero + contactos) → Category grid → Detail modal 5-tab.',
    features: [
        'Brand pages con contactos de sales y A&D',
        'Product detail con specs y performance',
        'Documentos PDF (guarantees, brochures, certs)',
        'Symbol folders (AutoCAD, Revit, SketchUp)',
    ],
}

export const TAB_INFO_DEALER_QUOTE: TabInfo = {
    title: 'Dealer / Quote · Manage Catalogs',
    whatYouSee: 'Panel de administración de los catálogos importados y preferencias del dealer.',
    dataSource: 'catalogs.ts (mock reactivo) + Preferences per tenant en localStorage.',
    structure: 'Grid de catalog cards + modal 2-tab · Catalogs y Preferences.',
    features: [
        'Sync management con delta reporting',
        'Preferences · brand priorities, delivery zones',
        'Status · Active / Update Avail. / Out of Sync',
        'Import y disconnect con confirmación',
    ],
}

export const TAB_INFO_FIGMA: TabInfo = {
    title: 'Figma · Product Catalog (design original)',
    whatYouSee: 'Vista alineada con el Figma design original · grid con sidebar de filtros.',
    dataSource: 'shop/data/products.ts · 12 productos dealer curados.',
    structure: 'Sidebar filters + main grid 8 items/página + sort dropdown.',
    features: [
        'Filter sidebar · Category, Brand, Features, Price',
        'Sort · 7 opciones incluyendo History-First',
        'Product cards con SKU visible y colorways',
        'Multi-line quote builder en el detail',
    ],
}

export const TAB_INFO_PRODUCT_CATALOG: TabInfo = {
    title: 'Product Catalog · Showroom unificado',
    whatYouSee: 'Storefront que combina Products, Materials y Spaces en un solo tab con toggle sidebar.',
    dataSource: 'unifiedProducts + SPACE_TYPES + PRODUCT_STUBS + custom spaces localStorage.',
    structure: 'Sidebar toggle 3-way + filtros específicos + main grid. Spaces mode → detail con bundles.',
    features: [
        'Toggle 3-way Products / Materials / Spaces',
        'Filtros específicos por taxonomía',
        'Space Types con bundles pre-armados',
        'Custom Spaces · CRUD completo',
        'Add all N items to Selection en un click',
    ],
}

export const TAB_INFO_MY_SELECTION: TabInfo = {
    title: 'My Selection · Quote drafts',
    whatYouSee: 'Selecciones del tenant activo con multi-line items, buyer info auto y submit flow.',
    dataSource: 'QuoteContext · multi-draft per tenant en `expert-hub-quotes-{slug}` localStorage.',
    structure: '2-col · drafts list + detail con Buyer info + Line items + Totals.',
    features: [
        'Multi-draft · N quotes paralelas por tenant',
        'Auto-filled buyer info (user + tenant)',
        'Toggle Flat list / By Space Setting',
        'Reference number Q-YYYY-NNN-TENANT',
        'Persist localStorage · sobrevive refresh',
    ],
}
