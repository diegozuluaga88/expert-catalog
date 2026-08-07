// F67 · ManufacturerInsightsPage (2026-08-06)
// Dashboard demo del PRD Section 05 · manufacturer-facing analytics.
// Simulación del "toggle View as manufacturer" (user decisión del
// AskUserQuestion) · muestra cómo vería su brand un manufacturer que
// entra al MRL con este role.
//
// Data · mock determinístico (hash-based) del manufacturer.id · consistente
// entre reloads · en production reemplaza con /api/insights/{manufacturerId}.
//
// KPIs del PRD (Jeff live example): "1,089 unique users · 6,951 activities
// over 4 weeks" · dashboard tiene esas 2 + sample requests + top products
// + trending searches. Laura: "surface most impactful info · something
// that leads to a lead or sale".

import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft, Users, Activity, Package, Search, TrendingUp, TrendingDown,
    Building2, ChevronDown, ChevronUp, Send, Eye, MousePointerClick,
} from 'lucide-react'
import { MANUFACTURERS } from '../data/manufacturers'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import type { Manufacturer } from '../types'
import Navbar from '../../components/Navbar'

interface ManufacturerInsightsPageProps {
    onBack: () => void
    onLogout: () => void
    onNavigate: (page: string) => void
    onNavigateToWorkspace: () => void
}

/** F67 · mock determinístico de métricas per manufacturer. Hash-based ·
 *  consistente entre reloads · in production reemplaza con GET /api/insights. */
function seededMetrics(manufacturerId: string) {
    let hash = 0
    for (let i = 0; i < manufacturerId.length; i++) {
        hash = ((hash << 5) - hash + manufacturerId.charCodeAt(i)) & 0xffffffff
    }
    const abs = Math.abs(hash)
    const uniqueUsers = 200 + (abs % 1800)              // 200-2000
    const activities = 800 + (abs % 8000)                // 800-8800
    const sampleRequests = 5 + (abs % 60)                // 5-65
    const productViews = 1500 + (abs % 12000)            // 1500-13500
    const clickthrough = 30 + (abs % 40)                 // 30-70 %
    const wowUsersPct = ((abs % 30) - 15)                // -15 to +15
    const wowActivitiesPct = (((abs >> 4) % 40) - 20)    // -20 to +20
    return {
        uniqueUsers, activities, sampleRequests, productViews,
        clickthrough, wowUsersPct, wowActivitiesPct,
    }
}

/** F67 · top products mock · pick 5 products del manufacturer con views
 *  determinísticas y trending direction (up/down/flat). */
function topProductsFor(manufacturer: Manufacturer) {
    const brand = manufacturer.name
    const brandProducts = UNIFIED_PRODUCTS.filter((p) => p.brand === brand)
    return brandProducts.slice(0, 5).map((p, i) => {
        let hash = 0
        for (let j = 0; j < p.id.length; j++) hash = ((hash << 5) - hash + p.id.charCodeAt(j)) & 0xffffffff
        const abs = Math.abs(hash)
        return {
            id: p.id,
            name: p.name,
            image: p.images?.[0],
            views: 300 + (abs % 1200) + (5 - i) * 80,
            wow: ((abs % 30) - 15),
        }
    })
}

/** F67 · trending searches mock · lista de queries populares que llevaron
 *  al brand. Determinístico per manufacturer. */
const SEARCH_QUERIES = [
    'ergonomic chair', 'lounge seating', 'height adjustable desk',
    'acoustic panels', 'modular sofa', 'work cafe',
    'phone booth', 'huddle room', 'training tables',
    'privacy screen', 'stools', 'benching system',
]

function trendingSearchesFor(manufacturer: Manufacturer) {
    let hash = 0
    for (let i = 0; i < manufacturer.id.length; i++) hash = ((hash << 5) - hash + manufacturer.id.charCodeAt(i)) & 0xffffffff
    const abs = Math.abs(hash)
    const picked = [0, 1, 2, 3, 4].map((offset) => SEARCH_QUERIES[(abs + offset * 3) % SEARCH_QUERIES.length])
    return picked.map((query, i) => ({
        query,
        volume: 40 + ((abs + i * 17) % 200),
        wow: (((abs + i * 7) % 40) - 20),
    }))
}

const STORAGE_KEY = 'expert-catalog.viewing-as-manufacturer'

export default function ManufacturerInsightsPage({ onBack, onLogout, onNavigate, onNavigateToWorkspace }: ManufacturerInsightsPageProps) {
    // Persist el selected manufacturer para que reload preserve el context.
    const [selectedId, setSelectedId] = useState<string>(() => {
        if (typeof window === 'undefined') return MANUFACTURERS[0]?.id ?? ''
        return window.localStorage.getItem(STORAGE_KEY) ?? MANUFACTURERS[0]?.id ?? ''
    })
    useEffect(() => {
        try { window.localStorage.setItem(STORAGE_KEY, selectedId) } catch { /* noop */ }
    }, [selectedId])

    const [pickerOpen, setPickerOpen] = useState(false)
    const selectedManufacturer = MANUFACTURERS.find((m) => m.id === selectedId) ?? MANUFACTURERS[0]

    const metrics = useMemo(() => seededMetrics(selectedManufacturer.id), [selectedManufacturer.id])
    const topProducts = useMemo(() => topProductsFor(selectedManufacturer), [selectedManufacturer])
    const trendingSearches = useMemo(() => trendingSearchesFor(selectedManufacturer), [selectedManufacturer])

    return (
        <>
            <Navbar
                onLogout={onLogout}
                activeTab="Insights"
                onNavigateToWorkspace={onNavigateToWorkspace}
                onNavigate={onNavigate}
            />
            <div className="pt-24 px-4 max-w-screen-2xl mx-auto space-y-6">
                {/* Header · title + back + manufacturer picker */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <button
                            type="button"
                            onClick={onBack}
                            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to catalog
                        </button>
                        <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground">
                            Manufacturer insights
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Preview · what a manufacturer sees when they log into MRL. Data below is mocked deterministically for demo purposes.
                        </p>
                    </div>

                    {/* Manufacturer picker */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setPickerOpen((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors min-w-[220px]"
                        >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Viewing as:</span>
                            <span className="truncate flex-1 text-left">{selectedManufacturer.name}</span>
                            {pickerOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        {pickerOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                                <div className="absolute right-0 top-full z-40 mt-2 w-[280px] max-h-[400px] overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
                                    {MANUFACTURERS.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => { setSelectedId(m.id); setPickerOpen(false) }}
                                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                m.id === selectedId ? 'bg-primary/15 text-foreground font-semibold' : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div
                                                className="h-6 w-6 flex-shrink-0 rounded"
                                                style={{ backgroundColor: m.bgColor ?? 'var(--muted)' }}
                                                aria-hidden="true"
                                            />
                                            <span className="truncate">{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* KPI cards row · 4 metrics */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <KpiCard
                        icon={<Users className="h-4 w-4" />}
                        label="Unique users (30d)"
                        value={metrics.uniqueUsers.toLocaleString()}
                        wow={metrics.wowUsersPct}
                    />
                    <KpiCard
                        icon={<Activity className="h-4 w-4" />}
                        label="Activities (30d)"
                        value={metrics.activities.toLocaleString()}
                        wow={metrics.wowActivitiesPct}
                    />
                    <KpiCard
                        icon={<Send className="h-4 w-4" />}
                        label="Sample requests"
                        value={metrics.sampleRequests.toString()}
                        wow={12}
                    />
                    <KpiCard
                        icon={<MousePointerClick className="h-4 w-4" />}
                        label="Product views"
                        value={metrics.productViews.toLocaleString()}
                        subLabel={`${metrics.clickthrough}% CTR`}
                    />
                </div>

                {/* Two-column · top products + trending searches */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Top products */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Top products (30d)
                            </h2>
                            <span className="text-[10px] text-muted-foreground">by views</span>
                        </div>
                        {topProducts.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-4 text-center">
                                No products found for {selectedManufacturer.name} in the catalog.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {topProducts.map((p, i) => (
                                    <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
                                        <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums text-center">
                                            {i + 1}
                                        </span>
                                        {p.image ? (
                                            <img src={p.image} alt="" className="h-10 w-14 flex-shrink-0 rounded object-cover" />
                                        ) : (
                                            <div className="h-10 w-14 flex-shrink-0 rounded bg-muted" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground inline-flex items-center gap-2">
                                                <span className="inline-flex items-center gap-0.5">
                                                    <Eye className="h-3 w-3" />
                                                    {p.views.toLocaleString()}
                                                </span>
                                                <TrendChip wow={p.wow} />
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Trending searches */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                Trending searches that led here
                            </h2>
                            <span className="text-[10px] text-muted-foreground">by volume</span>
                        </div>
                        <ul className="space-y-2">
                            {trendingSearches.map((s, i) => (
                                <li key={s.query} className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
                                    <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums text-center">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-foreground truncate">"{s.query}"</p>
                                        <p className="text-[10px] text-muted-foreground inline-flex items-center gap-2">
                                            <span>{s.volume.toLocaleString()} searches</span>
                                            <TrendChip wow={s.wow} />
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer · disclaimer del demo */}
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                    <strong className="text-foreground">Demo note</strong> · These figures are mocked deterministically per
                    manufacturer id. In production this connects to Google Tag Manager instrumentation + Power BI
                    (Ken Jensen owns the dataset per Legacy KT session). Retention · rolling 2 years.
                </div>
            </div>
        </>
    )
}

/* ─── KpiCard ─────────────────────────────────────────────────────────── */

interface KpiCardProps {
    icon: React.ReactNode
    label: string
    value: string
    wow?: number       // % WoW change
    subLabel?: string
}

function KpiCard({ icon, label, value, wow, subLabel }: KpiCardProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                </div>
                {wow !== undefined && <TrendChip wow={wow} />}
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums leading-none">
                {value}
            </div>
            {subLabel && (
                <div className="text-[11px] text-muted-foreground mt-1">{subLabel}</div>
            )}
        </div>
    )
}

/* ─── TrendChip ───────────────────────────────────────────────────────── */

function TrendChip({ wow }: { wow: number }) {
    const isUp = wow > 0
    const isFlat = wow === 0
    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
            isFlat
                ? 'bg-muted text-muted-foreground'
                : isUp
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400'
        }`}>
            {isFlat ? '—' : isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isFlat ? '0%' : `${wow > 0 ? '+' : ''}${wow}%`}
        </span>
    )
}
