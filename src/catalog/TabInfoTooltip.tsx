// Fase 6.2 · TabInfoTooltip (2026-07-07 refactor)
// Popover explicativo por tab · qué es, de dónde salen los datos, cómo
// está estructurado y qué hace.
//
// MRL scope cleanup (2026-08-27) · quedaban los TabInfo de los tabs
// retirados (Dealer/Quote, Figma, Products, My Selection) y el contenido
// de Library describía features que ya no existen. Sobreviven los dos
// tabs que sí son áreas del MVP · Library y My Projects.

import type { ReactNode } from 'react'
import { Info, Check } from 'lucide-react'

/** Fase 6.2 · tab role marker · differentiates reference vs current-version tabs.
 *  Diego ask (2026-07-07) · My Selection también es Current Version (misma
 *  arquitectura consolidada que Product Catalog) · role 'live' retirado. */
export type TabRole = 'reference' | 'current'

export interface TabInfo {
    title: string
    /** Chip that qualifies the tab's role in the catalog architecture. */
    role: TabRole
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

// F64.5 · chipStyle function removida · el chip Reference/Current Version
// del header del popover fue eliminado (user ask). TabRole type se mantiene
// exportado en TabInfo por retrocompat pero no se usa para render.

/** Icon-only trigger · a small Info button that unfolds the popover on hover.
 *  Diego ask · previously the whole tab triggered the tooltip and popovers
 *  appeared while navigating. Now explicit · click/hover on the (i) icon. */
export function TabInfoTrigger({ content, align = 'center' }: TooltipProps) {
    const positionClass =
        align === 'start' ? 'left-0'
        : align === 'end' ? 'right-0'
        : 'left-1/2 -translate-x-1/2'
    const arrowClass =
        align === 'start' ? 'left-2'
        : align === 'end' ? 'right-2'
        : 'left-1/2 -translate-x-1/2'

    // F64.5 · chipStyle(content.role) removido · el chip Reference/Current
    // Version fue eliminado del header (user ask · noise visual innecesario).

    return (
        <span className="group/tt relative inline-flex items-center">
            {/* F64.1 · Trigger cambia de <button> a <span> · antes era button
                nested dentro del tab button (HTML inválido · hover behavior
                undefined en browsers · Chrome no fireaba tooltip). Span con
                role="img" preserva semantics + hover funciona ok. */}
            <span
                role="img"
                aria-label={`About ${content.title}`}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground group-hover/tt:text-foreground group-hover/tt:bg-foreground/10 transition-colors cursor-help"
            >
                <Info className="h-3 w-3" strokeWidth={2} />
            </span>

            {/* Popover · F64.1 delay reducido de 200ms → 80ms para feedback
                más ágil. Tooltip visible on hover del wrapping span.
                F64.2 · z-[9999] (era z-[70]) · el tab pill container tenía
                overflow-x-auto que clippeaba + otros elementos con z-[80]
                lo tapaban. Combined con md:overflow-visible en el pill
                container (CatalogPageV2) queda garantizado que se ve arriba.
                F64.3 · width bump w-[340] → w-[380] + max-w-[calc(100vw-2rem)]
                para safety cuando el tooltip llega al edge del viewport. */}
            <div
                role="tooltip"
                className={`pointer-events-none absolute top-full ${positionClass} z-[9999] mt-2 w-[380px] max-w-[calc(100vw-2rem)] opacity-0 invisible translate-y-1 transition-all duration-150 delay-[80ms] group-hover/tt:pointer-events-auto group-hover/tt:opacity-100 group-hover/tt:visible group-hover/tt:translate-y-0`}
            >
                {/* Arrow */}
                <div className={`absolute -top-1.5 ${arrowClass} h-3 w-3 rotate-45 border-l border-t border-border bg-card`} />

                <div className="relative rounded-xl border border-border bg-card shadow-xl">
                    {/* Header · title only.
                        F64.5 · chip "Reference / Current version" eliminado (user
                        ask) · era noise visual + confusion (post-F64 los tabs se
                        distinguen por nombre + banner introductory, no necesitan
                        chip categorization). El type TabRole queda como field
                        legacy en la interface pero no se renderea. */}
                    <div className="border-b border-border px-3.5 py-2.5">
                        <h4 className="text-sm font-bold text-foreground leading-tight">{content.title}</h4>
                    </div>

                    <div className="px-3.5 py-3 space-y-3">
                        {/* Purpose */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Purpose
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.whatYouSee}</p>
                        </div>

                        {/* Data source */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Data source
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.dataSource}</p>
                        </div>

                        {/* Layout */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Layout
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-normal break-words">{content.structure}</p>
                        </div>

                        {/* Features · list with accessible bullets.
                            F64.4 · fixes:
                            - min-w-0 + break-words en <span> · el flex parent
                              (li con flex + gap) hacía que el span no shrinkeara
                              respetando el container · text salía por la derecha
                              cortando palabras completas ("year-ol" cut).
                            - Check icon color · text-primary (lime) sobre bg-card
                              blanco tiene contrast malo (Diego a11y rule) ·
                              cambio a text-foreground/70 · legible + neutral. */}
                        <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                Features
                            </div>
                            <ul role="list" className="space-y-1">
                                {content.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-relaxed">
                                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-foreground/70" strokeWidth={2.5} aria-hidden="true" />
                                        <span className="min-w-0 whitespace-normal break-words">{f}</span>
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

/** Legacy wrapper · preserves the previous children-based API. */
export default function TabInfoTooltip({ content, children }: { content: TabInfo; children: ReactNode }) {
    return <>{children}<TabInfoTrigger content={content} /></>
}

/* ═══════════════════════════════════════════════════════════════════════
   Per-tab content · English-only, curated for Diego's review flow.
   ═══════════════════════════════════════════════════════════════════════ */

export const TAB_INFO_MRL: TabInfo = {
    title: 'Library',
    role: 'current',
    whatYouSee:
        'Browse manufacturer binders and drill into their products. One of the five MVP areas Jeff named · "new Library/Binder UX".',
    dataSource:
        'MANUFACTURERS registry · the same brand binders as MRL classic, plus your tenant-scoped Custom Library.',
    structure:
        'Sidebar with Custom Library + Filters · Grid or Shelf view toggle · Brand card → Binder → Category → Product.',
    features: [
        'Grid + Shelf view · bookshelf metaphor preserved',
        'Custom Library · the brands you keep, scoped per tenant',
        'Search palette + visual search · upload an image, find similar',
        'Modernized card design · hero image + hover overlays',
    ],
}

export const TAB_INFO_MY_PROJECTS: TabInfo = {
    title: 'My Projects',
    role: 'current',
    whatYouSee:
        'Organize products into rooms and zones for a specific job, and share the result. One of the five MVP areas Jeff named · "Project Tool".',
    dataSource:
        'useProjects hook · per-tenant projects in localStorage · products added from the Library.',
    structure:
        'Project list + canvas view · rooms as containers · zones as sub-groups · products as draggable cards from binders.',
    features: [
        'Drag-and-drop from binders · "easy enough for 80-year-old"',
        'Multi-project per tenant · switch context anytime',
        'Rooms + zones structure · organize by physical space',
        'Add-to-project modal from any product card',
        'localStorage persistence · survives refresh',
        'Pending · vertical-scroll and lookbook presentations, plus activity heat map, viewer notifications and click counts (Decision Log NEW-10)',
    ],
}

