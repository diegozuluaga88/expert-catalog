// F51 · A.1 · Inspiration Gallery · detalle full-screen de una
// installation. Muestra la imagen con hotspots circulares sobre cada
// tag + panel lateral con la lista de productos taggeados. Cada producto
// linkea al binder de su manufacturer (onNavigateToProduct callback).
//
// UX · hover en un tag resalta el item correspondiente del panel y
// viceversa. Modo edit permite arrastrar tags, borrar, agregar nuevo
// (click en imagen abre picker de producto).

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Installation, InstallationTag } from './useInstallations'
import { UNIFIED_INDEX } from '../showroom/data/unifiedProducts'
import { useDialogs } from '../../components/dialogs/DialogsContext'

interface InstallationDetailModalProps {
    installation: Installation | null
    onClose: () => void
    onNavigateToProduct?: (productId: string) => void
    onAddTag?: (tag: InstallationTag) => void
    onRemoveTag?: (tagIndex: number) => void
    onDeleteInstallation?: () => void
}

export default function InstallationDetailModal({
    installation,
    onClose,
    onNavigateToProduct,
    onAddTag,
    onRemoveTag,
    onDeleteInstallation,
}: InstallationDetailModalProps) {
    const { confirm } = useDialogs()
    const [hoveredTag, setHoveredTag] = useState<number | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [addTagPickerOpen, setAddTagPickerOpen] = useState<{ xPct: number; yPct: number } | null>(null)

    if (!installation) return null

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!editMode || !onAddTag) return
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const xPct = ((e.clientX - rect.left) / rect.width) * 100
        const yPct = ((e.clientY - rect.top) / rect.height) * 100
        setAddTagPickerOpen({ xPct, yPct })
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete "${installation.title}"?`,
            description: 'This installation and all its tagged products will be removed. This cannot be undone.',
            confirmLabel: 'Delete installation',
            danger: true,
        })
        if (ok && onDeleteInstallation) {
            onDeleteInstallation()
            onClose()
        }
    }

    return (
        <Transition show as={Fragment} appear>
            <Dialog onClose={onClose} className="relative z-[70]">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            {/* Image column · con hotspots absolute */}
                            <div className="relative flex-1 bg-muted">
                                <div
                                    className={`relative h-full w-full ${editMode && onAddTag ? 'cursor-crosshair' : ''}`}
                                    onClick={handleImageClick}
                                >
                                    <img
                                        src={installation.imageUrl}
                                        alt={installation.title}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                    />
                                    {installation.tags.map((tag, i) => {
                                        const ctx = UNIFIED_INDEX[tag.productId]
                                        const productName = ctx?.product.name ?? 'Product'
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (onNavigateToProduct) onNavigateToProduct(tag.productId)
                                                }}
                                                onMouseEnter={() => setHoveredTag(i)}
                                                onMouseLeave={() => setHoveredTag(null)}
                                                aria-label={`Tag ${i + 1} · ${productName}`}
                                                title={productName}
                                                className={`absolute -translate-x-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-white transition-all ${
                                                    hoveredTag === i
                                                        ? 'bg-primary text-primary-foreground scale-125'
                                                        : 'bg-white/95 text-foreground hover:scale-110'
                                                }`}
                                                style={{ left: `${tag.xPct}%`, top: `${tag.yPct}%` }}
                                            >
                                                {i + 1}
                                            </button>
                                        )
                                    })}
                                    {editMode && onAddTag && (
                                        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                                            Click on the image to add a tag
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Side panel · title + tag list + actions */}
                            <aside className="flex w-96 flex-shrink-0 flex-col border-l border-border bg-card">
                                <header className="flex items-start justify-between gap-3 border-b border-border p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Installation</p>
                                        <h2 className="mt-0.5 text-base font-bold text-foreground leading-snug">
                                            {installation.title}
                                        </h2>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            {installation.designFirm && (
                                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                                    {installation.designFirm}
                                                </span>
                                            )}
                                            {installation.roomType && (
                                                // Chip room type · fill neutro (Rule DS · no branded como texto sobre paper).
                                                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                                    {installation.roomType}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </header>

                                <div className="flex-1 overflow-y-auto">
                                    <div className="border-b border-border px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Tagged products · {installation.tags.length}
                                        </p>
                                    </div>
                                    {installation.tags.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground">
                                            No products tagged yet. {onAddTag && 'Turn on edit mode and click on the image to tag a product.'}
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-border">
                                            {installation.tags.map((tag, i) => {
                                                const ctx = UNIFIED_INDEX[tag.productId]
                                                if (!ctx) {
                                                    return (
                                                        <li key={i} className="px-4 py-3 text-xs text-muted-foreground italic">
                                                            {i + 1} · Product not found ({tag.productId})
                                                        </li>
                                                    )
                                                }
                                                const { product, manufacturer } = ctx
                                                return (
                                                    <li
                                                        key={i}
                                                        onMouseEnter={() => setHoveredTag(i)}
                                                        onMouseLeave={() => setHoveredTag(null)}
                                                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                                            hoveredTag === i ? 'bg-primary/5' : ''
                                                        }`}
                                                    >
                                                        <div className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                                                            {i + 1}
                                                        </div>
                                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                            {product.images?.[0] && (
                                                                <img
                                                                    src={product.images[0]}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                                                                {manufacturer.name}
                                                            </p>
                                                            <p className="text-xs font-bold text-foreground truncate leading-tight">
                                                                {product.name}
                                                            </p>
                                                        </div>
                                                        {onNavigateToProduct && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onNavigateToProduct(tag.productId)}
                                                                className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                title="Open in binder"
                                                                aria-label={`Open ${product.name} in binder`}
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {editMode && onRemoveTag && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onRemoveTag(i)}
                                                                className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                title="Remove tag"
                                                                aria-label={`Remove tag for ${product.name}`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {(onAddTag || onDeleteInstallation) && (
                                    <footer className="flex items-center gap-2 border-t border-border p-3">
                                        {onAddTag && (
                                            <button
                                                type="button"
                                                onClick={() => setEditMode((v) => !v)}
                                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                                                    editMode
                                                        ? 'bg-foreground text-background hover:bg-foreground/90'
                                                        : 'border border-input text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                {editMode ? 'Done editing' : 'Edit tags'}
                                            </button>
                                        )}
                                        {onDeleteInstallation && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                                                title="Delete installation"
                                                aria-label="Delete installation"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </footer>
                                )}
                            </aside>

                            {/* Product picker overlay · elegir qué producto asociar al tag nuevo */}
                            {addTagPickerOpen && onAddTag && (
                                <ProductPickerOverlay
                                    onPick={(productId) => {
                                        onAddTag({
                                            productId,
                                            xPct: addTagPickerOpen.xPct,
                                            yPct: addTagPickerOpen.yPct,
                                        })
                                        setAddTagPickerOpen(null)
                                    }}
                                    onCancel={() => setAddTagPickerOpen(null)}
                                />
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

/* ─── Product picker overlay ────────────────────────────────────────── */

interface ProductPickerOverlayProps {
    onPick: (productId: string) => void
    onCancel: () => void
}

function ProductPickerOverlay({ onPick, onCancel }: ProductPickerOverlayProps) {
    const [query, setQuery] = useState('')
    const q = query.trim().toLowerCase()
    const options = Object.values(UNIFIED_INDEX)
        .filter((ctx) => {
            if (!q) return true
            const hay = `${ctx.product.name} ${ctx.manufacturer.name} ${ctx.product.brand ?? ''}`.toLowerCase()
            return hay.includes(q)
        })
        .slice(0, 40)

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                <header className="border-b border-border p-4">
                    <h3 className="text-sm font-bold text-foreground">Tag a product</h3>
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search product or manufacturer…"
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                </header>
                <div className="flex-1 overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {options.map((ctx) => (
                            <li key={ctx.product.id}>
                                <button
                                    type="button"
                                    onClick={() => onPick(ctx.product.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted"
                                >
                                    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-muted">
                                        {ctx.product.images?.[0] && (
                                            <img
                                                src={ctx.product.images[0]}
                                                alt={ctx.product.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{ctx.manufacturer.name}</p>
                                        <p className="text-xs font-bold text-foreground truncate">{ctx.product.name}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                        {options.length === 0 && (
                            <li className="p-6 text-center text-xs text-muted-foreground">No products match your search.</li>
                        )}
                    </ul>
                </div>
                <footer className="border-t border-border p-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex w-full items-center justify-center rounded-md border border-input px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    )
}

