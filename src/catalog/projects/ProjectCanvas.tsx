// F50 · Etapa 10.c (P2 Project Builder) · v2 · editor del canvas.
//
// SVG-based canvas con drag nativo (mousedown/mousemove/mouseup) para no
// depender de librerías extra. Features:
//   · Grid background con snap-to-grid opcional (toggle en toolbar)
//   · Items drag-around con puntero
//   · Click en item lo selecciona · Delete key remueve
//   · Product picker panel a la derecha con búsqueda · click agrega al
//     centro, o drag desde el panel al canvas para posicionar
//   · Toolbar con: back, rename, snap toggle, clear, export PNG (mock),
//     share link
//   · Persist automático (cada acción va contra useProjects)

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Grid3x3, Trash2, Download, Share2, Search, X, Plus } from 'lucide-react'
import { Button, Input } from 'strata-design-system'
import type { Project, PlacedItem, AddItemInput } from './useProjects'
import { snapToGrid, DEFAULT_ITEM_SIZE } from './useProjects'
import type { Product } from '../types'
import { useToast, ToastContainer } from '../../components/AuthToast'

const GRID_SIZE = 20

interface ProjectCanvasProps {
    project: Project
    allProducts: Product[]
    onBack: () => void
    onAddItem: (input: AddItemInput) => PlacedItem | null
    onUpdateItem: (itemId: string, patch: Partial<PlacedItem>) => void
    onRemoveItem: (itemId: string) => void
    onClearItems: () => void
    onRename: (name: string) => void
}

export default function ProjectCanvas({
    project,
    allProducts,
    onBack,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onClearItems,
    onRename,
}: ProjectCanvasProps) {
    const { canvas, items, name } = project
    const svgRef = useRef<SVGSVGElement>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [snap, setSnap] = useState(true)
    const [pickerQuery, setPickerQuery] = useState('')
    const { toasts, addToast, dismissToast } = useToast()

    // Deselecciona al Escape · Delete borra el item seleccionado
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!selectedId) return
            if (e.key === 'Escape') {
                setSelectedId(null)
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                const t = e.target as HTMLElement | null
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
                onRemoveItem(selectedId)
                setSelectedId(null)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selectedId, onRemoveItem])

    // Convierte coordenadas de mouse (client px) a coordenadas del canvas
    // (unidades del viewBox). Necesario porque el SVG se escala responsivo.
    const clientToCanvas = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
        const svg = svgRef.current
        if (!svg) return { x: 0, y: 0 }
        const rect = svg.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        }
    }, [canvas.width, canvas.height])

    // Drag de un item existente · pointerdown en el item → track move → up
    const dragRef = useRef<{ itemId: string; offsetX: number; offsetY: number } | null>(null)
    const startDrag = (e: React.PointerEvent, item: PlacedItem) => {
        e.stopPropagation()
        setSelectedId(item.id)
        const canvasPt = clientToCanvas(e.clientX, e.clientY)
        dragRef.current = {
            itemId: item.id,
            offsetX: canvasPt.x - item.x,
            offsetY: canvasPt.y - item.y,
        }
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }
    const onDragMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return
        const canvasPt = clientToCanvas(e.clientX, e.clientY)
        const rawX = canvasPt.x - dragRef.current.offsetX
        const rawY = canvasPt.y - dragRef.current.offsetY
        const item = items.find((it) => it.id === dragRef.current!.itemId)
        if (!item) return
        // Clamp al canvas bounds
        const maxX = canvas.width - item.width
        const maxY = canvas.height - item.height
        const clampedX = Math.max(0, Math.min(maxX, rawX))
        const clampedY = Math.max(0, Math.min(maxY, rawY))
        const finalX = snap ? snapToGrid(clampedX, GRID_SIZE) : Math.round(clampedX)
        const finalY = snap ? snapToGrid(clampedY, GRID_SIZE) : Math.round(clampedY)
        if (finalX !== item.x || finalY !== item.y) {
            onUpdateItem(item.id, { x: finalX, y: finalY })
        }
    }
    const endDrag = (e: React.PointerEvent) => {
        if (dragRef.current) {
            try { (e.target as Element).releasePointerCapture(e.pointerId) } catch { /* noop */ }
            dragRef.current = null
        }
    }

    // Drop desde el product picker (HTML5 dnd) al canvas
    const onDropFromPicker = (e: React.DragEvent) => {
        e.preventDefault()
        const productId = e.dataTransfer.getData('application/x-product-id')
        if (!productId) return
        const pt = clientToCanvas(e.clientX, e.clientY)
        const x = pt.x - DEFAULT_ITEM_SIZE.width / 2
        const y = pt.y - DEFAULT_ITEM_SIZE.height / 2
        const clampedX = Math.max(0, Math.min(canvas.width - DEFAULT_ITEM_SIZE.width, x))
        const clampedY = Math.max(0, Math.min(canvas.height - DEFAULT_ITEM_SIZE.height, y))
        onAddItem({
            productId,
            x: snap ? snapToGrid(clampedX, GRID_SIZE) : Math.round(clampedX),
            y: snap ? snapToGrid(clampedY, GRID_SIZE) : Math.round(clampedY),
        })
    }

    const handleAddClick = (product: Product) => {
        const item = onAddItem({ productId: product.id })
        if (item) setSelectedId(item.id)
    }

    const handleExport = async () => {
        // Mock export · en producción usaríamos html2canvas / saveSvgAsPng.
        // Por ahora abrimos el SVG en una tab nueva para que el user haga
        // "Save image as…" (banner honesto en el toast).
        const svg = svgRef.current
        if (!svg) return
        const clone = svg.cloneNode(true) as SVGSVGElement
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        const serializer = new XMLSerializer()
        const source = serializer.serializeToString(clone)
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        addToast('info', 'Exported as SVG · in production this would render a high-res PNG server-side.')
    }

    const handleShare = async () => {
        // Reusa el pattern de collections · encode del layout en URL.
        // Mock signature (client-side, ver collectionShareLink) · aquí es
        // aún más simple: solo copiamos un link a la vista actual.
        const shareData = btoa(unescape(encodeURIComponent(JSON.stringify({
            n: name,
            i: items.map((it) => ({ p: it.productId, x: it.x, y: it.y, w: it.width, h: it.height })),
        }))))
        const link = `${window.location.origin}${window.location.pathname}?project-share=${shareData.slice(0, 200)}…`
        try {
            await navigator.clipboard.writeText(link)
            addToast('success', 'Share link copied · read-only view of this project layout (mock).')
        } catch {
            window.prompt('Copy this link:', link)
        }
    }

    // Product picker · filtra allProducts por query. Cap a 50 para no
    // ahogar el DOM.
    const pickerResults = allProducts
        .filter((p) => {
            if (!pickerQuery.trim()) return true
            const hay = `${p.name} ${p.brand ?? ''} ${p.category ?? ''}`.toLowerCase()
            return hay.includes(pickerQuery.toLowerCase())
        })
        .slice(0, 50)

    return (
        <div className="mx-auto max-w-[1600px]">
            {/* Toolbar */}
            <header className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Back to projects"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Projects
                </button>
                <div className="h-6 w-px bg-border" />
                <button
                    type="button"
                    onClick={() => {
                        const next = window.prompt('Rename project', name)
                        if (next && next.trim()) onRename(next)
                    }}
                    className="rounded-md px-2 py-1 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                    title="Click to rename"
                >
                    {name}
                </button>
                <span className="text-xs text-muted-foreground">
                    · {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>

                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setSnap((v) => !v)}
                        aria-pressed={snap}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                            snap ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Toggle snap to grid"
                    >
                        <Grid3x3 className="h-3 w-3" />
                        Snap {snap ? 'on' : 'off'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (items.length === 0) return
                            if (window.confirm('Clear all items from the canvas?')) {
                                onClearItems()
                                setSelectedId(null)
                            }
                        }}
                        disabled={items.length === 0}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-3 w-3" />
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Export canvas as SVG (PNG in production)"
                    >
                        <Download className="h-3 w-3" />
                        Export
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Copy shareable read-only link (mock)"
                    >
                        <Share2 className="h-3 w-3" />
                        Share
                    </button>
                </div>
            </header>

            {/* Body · canvas + picker */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                {/* Canvas */}
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="block w-full touch-none"
                        style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
                        onPointerMove={onDragMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                        onDrop={onDropFromPicker}
                        onClick={() => setSelectedId(null)}
                    >
                        {/* Grid pattern */}
                        <defs>
                            <pattern id="canvas-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                                <path
                                    d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                                    fill="none"
                                    stroke="var(--color-border, #e4e4e7)"
                                    strokeWidth={0.5}
                                />
                            </pattern>
                        </defs>
                        <rect width={canvas.width} height={canvas.height} fill="var(--color-background, #fafafa)" />
                        <rect width={canvas.width} height={canvas.height} fill="url(#canvas-grid)" />

                        {/* Items */}
                        {items.map((it) => {
                            const product = allProducts.find((p) => p.id === it.productId)
                            const isSelected = it.id === selectedId
                            return (
                                <g
                                    key={it.id}
                                    transform={`translate(${it.x} ${it.y})`}
                                    onPointerDown={(e) => startDrag(e, it)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: 'grab' }}
                                >
                                    <rect
                                        width={it.width}
                                        height={it.height}
                                        fill="var(--color-card, #fff)"
                                        stroke={isSelected ? 'var(--color-primary, #a3c414)' : 'var(--color-border, #e4e4e7)'}
                                        strokeWidth={isSelected ? 3 : 2}
                                        rx={8}
                                    />
                                    {product && (
                                        <image
                                            href={product.images[0]}
                                            x={4}
                                            y={4}
                                            width={it.width - 8}
                                            height={it.height - 8}
                                            preserveAspectRatio="xMidYMid slice"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                    {product && (
                                        <text
                                            x={it.width / 2}
                                            y={it.height + 14}
                                            textAnchor="middle"
                                            fontSize="11"
                                            fontWeight="600"
                                            fill="var(--color-foreground, #09090b)"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {product.name.length > 24 ? product.name.slice(0, 22) + '…' : product.name}
                                        </text>
                                    )}
                                </g>
                            )
                        })}
                    </svg>
                </div>

                {/* Product picker */}
                <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <header className="border-b border-border p-3">
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product picker</h3>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={pickerQuery}
                                onChange={(e) => setPickerQuery(e.target.value)}
                                placeholder="Filter products…"
                                className="pl-8 pr-8"
                            />
                            {pickerQuery && (
                                <button
                                    type="button"
                                    onClick={() => setPickerQuery('')}
                                    aria-label="Clear filter"
                                    className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground">
                            Drag to place · or click <Plus className="inline h-2.5 w-2.5" /> to add at center.
                        </p>
                    </header>
                    <ul className="scrollbar-mrl flex-1 space-y-1 overflow-y-auto p-2">
                        {pickerResults.length === 0 ? (
                            <li className="py-8 text-center text-xs text-muted-foreground">No products match.</li>
                        ) : (
                            pickerResults.map((p) => (
                                <li key={p.id}>
                                    <div
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/x-product-id', p.id)
                                            e.dataTransfer.effectAllowed = 'copy'
                                        }}
                                        className="group flex cursor-grab items-center gap-2 rounded-lg border border-border bg-background p-1.5 hover:border-foreground/20 hover:bg-muted transition-colors"
                                    >
                                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                                            <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{p.brand}</p>
                                            <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddClick(p)}
                                            aria-label={`Add ${p.name} to canvas`}
                                            title="Add to canvas center"
                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                    <footer className="border-t border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
                        <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">Delete</kbd> removes selected · <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">Esc</kbd> deselects
                    </footer>
                </aside>
            </div>

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}
