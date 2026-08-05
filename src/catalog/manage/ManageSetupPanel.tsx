// F58b.2 · widget MRL sidebar · pattern clonado del InspirationPanel /
// SampleTrackingPanel para consistencia visual. Da un shortcut al modal
// "My Setup" desde MRL sin tener que ir a Product Catalog primero.
//
// Muestra las 3 primeras relationships del tenant (thumbnails + brand
// name + discount tier) + CTA "Open setup" que dispara el
// `expert-hub:open-setup-modal` event con tab='manufacturers' · el
// CatalogPageV2 shell escucha y monta el modal.

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { useTenant } from '../../TenantContext'
import {
    getRelationshipsForDealer,
    DEALER_REL_CHANGE_EVENT,
    UPDATE_REQUESTS_CHANGE_EVENT,
} from '../data/dealerRelationships'
import { MANUFACTURERS } from '../data/manufacturers'

interface ManageSetupPanelProps {
    /** Cuando true, el header arranca colapsado (útil si el sidebar
     *  del MRL está muy lleno). */
    defaultCollapsed?: boolean
}

/** F58b.2 · signal "needs attention" · outdated info OR pending
 *  update-requests. Mismo criterio que el badge amber del Navbar
 *  (que se elimina en F58b.3 · el signal se mueve acá). */
function isOutdated(iso: string): boolean {
    try {
        const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
        return days > 180
    } catch { return false }
}

export default function ManageSetupPanel({ defaultCollapsed = true }: ManageSetupPanelProps) {
    const { currentTenant } = useTenant()
    const [collapsed, setCollapsed] = useState(defaultCollapsed)
    const [tick, setTick] = useState(0)

    // Re-render al recibir eventos del rep dashboard (bulk updates) o
    // update-requests (dealer envió una solicitud).
    useEffect(() => {
        const recompute = () => setTick(t => t + 1)
        window.addEventListener(DEALER_REL_CHANGE_EVENT, recompute)
        window.addEventListener(UPDATE_REQUESTS_CHANGE_EVENT, recompute)
        return () => {
            window.removeEventListener(DEALER_REL_CHANGE_EVENT, recompute)
            window.removeEventListener(UPDATE_REQUESTS_CHANGE_EVENT, recompute)
        }
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _keepTick = tick
    const relationships = getRelationshipsForDealer(String(currentTenant) || '')
    const totalCount = relationships.length
    const recent = relationships.slice(0, 3)
    const needsAttention = relationships.some(r => isOutdated(r.lastUpdatedAt))

    const handleOpenSetup = (tab: 'manufacturers' | 'sync' = 'manufacturers') => {
        window.dispatchEvent(new CustomEvent('expert-hub:open-setup-modal', {
            detail: { tab },
        }))
    }

    return (
        <div className="border-t border-border">
            <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                aria-expanded={!collapsed}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    My Setup
                    {totalCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-foreground">
                            {totalCount}
                        </span>
                    )}
                    {needsAttention && (
                        <span
                            className="inline-flex h-2 w-2 rounded-full bg-amber-500"
                            title="Some manufacturer info is outdated"
                            aria-label="Needs attention"
                        />
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
                            Your dealer terms per manufacturer, connected catalogs, and buying
                            preferences · all in one place.
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {recent.map((rel) => {
                                const manufacturer = MANUFACTURERS.find(m => m.id === rel.manufacturerSlug)
                                const manufacturerName = manufacturer?.name
                                    ?? rel.manufacturerSlug.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
                                const outdated = isOutdated(rel.lastUpdatedAt)
                                return (
                                    <button
                                        key={rel.manufacturerSlug}
                                        type="button"
                                        onClick={() => handleOpenSetup('manufacturers')}
                                        className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-muted transition-colors"
                                        title={`Open ${manufacturerName} terms`}
                                    >
                                        <div
                                            className="h-8 w-10 flex-shrink-0 rounded flex items-center justify-center text-[9px] font-bold"
                                            style={{
                                                backgroundColor: manufacturer?.bgColor ?? 'var(--muted)',
                                                color: manufacturer?.textColor ?? 'inherit',
                                            }}
                                        >
                                            -{rel.discountTier}%
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-semibold text-foreground">
                                                {manufacturerName}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {rel.freightTerms}
                                                {outdated && <span className="ml-1 text-amber-600 dark:text-amber-500">· outdated</span>}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => handleOpenSetup('manufacturers')}
                        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                        title="Catalogs · Manufacturers · Buying preferences"
                    >
                        Open setup →
                    </button>
                </div>
            )}
        </div>
    )
}
