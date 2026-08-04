// F58a.1 · panel widget para la sidebar del MRL (LibraryPageV2) · reemplaza
// el sub-tab Inspiration que existía a nivel CatalogPageV2. Pattern clonado
// del SampleTrackingPanel · misma estructura visual (collapsible section
// con header + body compact) para consistencia.
//
// Muestra los custom SpaceType Settings del tenant (ex "installations" en
// el módulo Inspiration previo) con thumbnails + count + CTA "View gallery"
// que dispara el CustomEvent `expert-hub:navigate-to-showroom-inspiration`
// · CatalogPageV2 lo intercepta para setMode('showroom') + taxonomy='spaces'.

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useCustomSpaces } from './useCustomSpaces'
import { SPACE_TYPES } from '../data/spaceTypes'

interface InspirationPanelProps {
    /** Cuando true, el header arranca colapsado (útil si el sidebar
     *  del MRL está muy lleno). */
    defaultCollapsed?: boolean
}

export default function InspirationPanel({ defaultCollapsed = true }: InspirationPanelProps) {
    const { customSettings } = useCustomSpaces()
    const [collapsed, setCollapsed] = useState(defaultCollapsed)

    // Los últimos 3 custom settings del tenant · thumbnails preview.
    const recent = customSettings.slice(-3).reverse()
    const totalCount = customSettings.length

    const handleOpenGallery = () => {
        window.dispatchEvent(new CustomEvent('expert-hub:navigate-to-showroom-inspiration'))
    }

    return (
        <div className="border-t border-border">
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-expanded={!collapsed}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    Inspiration
                    {totalCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-foreground">
                            {totalCount}
                        </span>
                    )}
                </span>
                {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                )}
            </button>

            {!collapsed && (
                <div className="px-4 pb-3 space-y-2">
                    {totalCount === 0 ? (
                        <p className="text-[11px] text-muted-foreground leading-snug">
                            Reference installations + space bundles with tagged products. Browse the
                            gallery to add ready-made settings to your selection.
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {recent.map((setting) => {
                                const parent = SPACE_TYPES.find((sp) => sp.id === setting.spaceTypeId)
                                return (
                                    <button
                                        key={setting.id}
                                        type="button"
                                        onClick={handleOpenGallery}
                                        className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-muted transition-colors"
                                        title={`Open ${setting.name}`}
                                    >
                                        <div className="h-8 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                                            {setting.imageUrl && (
                                                <img
                                                    src={setting.imageUrl}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-semibold text-foreground">
                                                {setting.name}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {parent?.name ?? '—'}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* F58a.1 fix · label descriptivo · el user smoke reportó
                        que "View gallery" no dejaba claro que iba a cambiar de
                        tab (MRL → Product Catalog). Ahora explícito. */}
                    <button
                        type="button"
                        onClick={handleOpenGallery}
                        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                        title="Opens the Inspiration tab inside Product Catalog"
                    >
                        Open in Product Catalog →
                    </button>
                </div>
            )}
        </div>
    )
}
