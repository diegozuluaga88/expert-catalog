// F51 · A.1 · P6 Inspiration Gallery · vista principal.
//
// Grid tipo masonry (columnas fluidas por aspect ratio) de instalaciones
// con tags. Cada card muestra la imagen, el título, el design firm, el
// room type, y un contador de productos taggeados. Click en la card abre
// el InstallationDetailModal con los hotspots.
//
// Header · CTA "Upload installation" (abre UploadInstallationModal) +
// contador global + filtros básicos por design firm y room type (deriv
// del set de installations vigente).
//
// Empty state · si el user borra todos los mocks, mensaje explicativo
// con el CTA de upload.

import { useMemo, useState } from 'react'
import { Sparkles, Upload, MapPin, Building2, Search } from 'lucide-react'
import { useInstallations, type Installation, type InstallationTag } from './useInstallations'
import InstallationDetailModal from './InstallationDetailModal'
import UploadInstallationModal from './UploadInstallationModal'
import type { Manufacturer, Category, Product } from '../types'
import { UNIFIED_INDEX } from '../showroom/data/unifiedProducts'

interface InspirationGalleryPageProps {
    /** Callback para navegar al binder/producto taggeado. Recibe el
     *  contexto completo (manufacturer + category + product) para poder
     *  ir directo al ProductDetailPage. Si no se pasa, los tags solo
     *  muestran hover state sin linkear. */
    onNavigateToProduct?: (ctx: { manufacturer: Manufacturer; category: Category; product: Product }) => void
}

export default function InspirationGalleryPage({ onNavigateToProduct }: InspirationGalleryPageProps) {
    const {
        installations,
        createInstallation,
        deleteInstallation,
        addTag,
        removeTag,
    } = useInstallations()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [designFirmFilter, setDesignFirmFilter] = useState<string>('')
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>('')

    const designFirms = useMemo(() => {
        const set = new Set<string>()
        installations.forEach((it) => { if (it.designFirm) set.add(it.designFirm) })
        return Array.from(set).sort()
    }, [installations])

    const roomTypes = useMemo(() => {
        const set = new Set<string>()
        installations.forEach((it) => { if (it.roomType) set.add(it.roomType) })
        return Array.from(set).sort()
    }, [installations])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return installations.filter((it) => {
            if (designFirmFilter && it.designFirm !== designFirmFilter) return false
            if (roomTypeFilter && it.roomType !== roomTypeFilter) return false
            if (!q) return true
            const hay = `${it.title} ${it.designFirm ?? ''} ${it.roomType ?? ''}`.toLowerCase()
            return hay.includes(q)
        })
    }, [installations, search, designFirmFilter, roomTypeFilter])

    const selected = selectedId ? installations.find((it) => it.id === selectedId) ?? null : null

    const handleNavigateToProduct = (productId: string) => {
        if (!onNavigateToProduct) return
        const ctx = UNIFIED_INDEX[productId]
        if (!ctx) return
        // ProductContext trae manufacturer + category + product enriquecido.
        // El consumer decide si mostrar el ProductDetailPage o quedarse en
        // el ManufacturerPage · en CatalogPageV2 va directo al detail.
        onNavigateToProduct(ctx)
        setSelectedId(null)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground leading-tight flex items-center gap-2">
                        {/* Icon en muted-foreground · NO primary sobre paper claro (Rule DS). */}
                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                        Inspiration
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Real installations from design firms · click any image to see the products used and jump to their binders. Upload your own to share with your team.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    <Upload className="h-4 w-4" />
                    Upload installation
                </button>
            </div>

            {/* Filters */}
            {installations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by title, design firm, room…"
                            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                    <select
                        value={designFirmFilter}
                        onChange={(e) => setDesignFirmFilter(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                        <option value="">All design firms</option>
                        {designFirms.map((df) => <option key={df} value={df}>{df}</option>)}
                    </select>
                    <select
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                        <option value="">All room types</option>
                        {roomTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {filtered.length} / {installations.length}
                    </span>
                </div>
            )}

            {/* Grid o empty */}
            {filtered.length === 0 && installations.length === 0 ? (
                <EmptyGallery onUpload={() => setUploadOpen(true)} />
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                    <p className="text-sm text-muted-foreground">No installations match your filters.</p>
                    <button
                        type="button"
                        onClick={() => { setSearch(''); setDesignFirmFilter(''); setRoomTypeFilter('') }}
                        className="mt-3 text-xs font-semibold text-foreground underline hover:no-underline"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                    {filtered.map((it) => (
                        <InstallationCard
                            key={it.id}
                            installation={it}
                            onOpen={() => setSelectedId(it.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <InstallationDetailModal
                installation={selected}
                onClose={() => setSelectedId(null)}
                onNavigateToProduct={onNavigateToProduct ? handleNavigateToProduct : undefined}
                onAddTag={selected ? (tag: InstallationTag) => addTag(selected.id, tag) : undefined}
                onRemoveTag={selected ? (tagIndex: number) => removeTag(selected.id, tagIndex) : undefined}
                onDeleteInstallation={selected ? () => deleteInstallation(selected.id) : undefined}
            />
            <UploadInstallationModal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onCreate={(input) => {
                    const created = createInstallation(input)
                    setUploadOpen(false)
                    setSelectedId(created.id)
                }}
            />
        </div>
    )
}

/* ─── Card ──────────────────────────────────────────────────────────── */

interface InstallationCardProps {
    installation: Installation
    onOpen: () => void
}

function InstallationCard({ installation, onOpen }: InstallationCardProps) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:shadow-md hover:border-primary/40"
        >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <img
                    src={installation.imageUrl}
                    alt={installation.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                {installation.tags.length > 0 && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1 text-[10px] font-bold text-white">
                        <MapPin className="h-3 w-3" />
                        {installation.tags.length} {installation.tags.length === 1 ? 'product' : 'products'}
                    </span>
                )}
            </div>
            <div className="p-3">
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {installation.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {installation.designFirm && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {installation.designFirm}
                        </span>
                    )}
                    {installation.roomType && (
                        // Chip room type · fill neutro para no pisar el CTA principal (Upload) que sí usa primary (Rule DS).
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
                            {installation.roomType}
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

/* ─── Empty state ───────────────────────────────────────────────────── */

function EmptyGallery({ onUpload }: { onUpload: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <div>
                <h3 className="text-base font-bold text-foreground">No installations yet</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    Upload an installation image, tag the products in it, and share the reference with your team.
                </p>
            </div>
            <button
                type="button"
                onClick={onUpload}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
                <Upload className="h-4 w-4" />
                Upload your first installation
            </button>
        </div>
    )
}
