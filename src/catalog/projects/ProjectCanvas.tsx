// F50 · Etapa 10.c (P2 Project Builder) · v2 · editor del canvas.
//
// SVG-based canvas con drag nativo (pointer events) para no depender de
// librerías extra. Features:
//   · Grid background con snap-to-grid opcional (toggle en toolbar)
//   · Checkbox en cada item para multi-select (Diego ask · más obvio
//     que Ctrl+click)
//   · Multi-drag · al arrastrar un item seleccionado, todos los del set
//     se mueven con el mismo delta
//   · Floating bulk actions bar cuando hay 1+ items seleccionados:
//     Delete + Duplicate + Align (6 opciones) + Distribute (2 opciones,
//     disabled si <3 items)
//   · Drag out del canvas · si el pointer suelta afuera del SVG bounds
//     habiendo movido >40px, abre modal de confirm para borrar los items
//     arrastrados
//   · Keyboard: Delete/Backspace borra selección · Esc deselecciona
//   · Product picker panel a la derecha con búsqueda · drag desde row
//     al canvas o click + para add al centro
//   · Toolbar con: back, rename, snap toggle, clear, export SVG (mock
//     PNG), share link (mock)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ArrowLeft,
    Grid3x3,
    Trash2,
    Download,
    Share2,
    Search,
    X,
    Plus,
    Copy,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    AlignHorizontalDistributeCenter,
    AlignVerticalDistributeCenter,
    Check,
} from 'lucide-react'
import { Button, Input } from 'strata-design-system'
import type { Project, PlacedItem, AddItemInput } from './useProjects'
import { snapToGrid, DEFAULT_ITEM_SIZE } from './useProjects'
import type { Product } from '../types'
import { useToast, ToastContainer } from '../../components/AuthToast'
import { useDialogs } from '../../components/dialogs/DialogsContext'

const GRID_SIZE = 20
const DRAG_OUT_MIN_MOVE = 40

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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [snap, setSnap] = useState(true)
    const [pickerQuery, setPickerQuery] = useState('')
    const [isDraggingOut, setIsDraggingOut] = useState(false)
    const { toasts, addToast, dismissToast } = useToast()
    const { prompt, confirm } = useDialogs()

    // Set helpers
    const isSelected = (id: string) => selectedIds.has(id)
    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }
    const selectOnly = (id: string) => setSelectedIds(new Set([id]))
    const clearSelection = () => setSelectedIds(new Set())

    // Deselecciona con Escape · Delete/Backspace borra selección
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (selectedIds.size === 0) return
            const t = e.target as HTMLElement | null
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
            if (e.key === 'Escape') {
                clearSelection()
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                handleDeleteSelected()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIds])

    // Convierte coordenadas de mouse a coordenadas del canvas
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

    // Chequea si el pointer está fuera de los bounds del SVG (client space)
    const isPointerOutsideSvg = useCallback((clientX: number, clientY: number): boolean => {
        const svg = svgRef.current
        if (!svg) return false
        const rect = svg.getBoundingClientRect()
        return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom
    }, [])

    // Drag state · tracker de items siendo movidos + start point para
    // calcular delta y detectar "moved enough" para drag-out.
    interface DragState {
        itemIds: string[]      // ids que se mueven juntos (multi-drag)
        anchorId: string       // item que el user tomó (para calcular delta)
        offsetX: number        // dif entre pointer y anchor.x al start
        offsetY: number        // idem y
        originalPositions: Map<string, { x: number; y: number }>
        startClientX: number
        startClientY: number
        totalMoved: number     // Manhattan distance acumulado
    }
    const dragRef = useRef<DragState | null>(null)

    const startDrag = (e: React.PointerEvent, item: PlacedItem) => {
        e.stopPropagation()
        // Si el ítem tomado no está en la selección, hacé single-select
        // (reemplaza set). Si está, mantené la selección multi para drag
        // conjunto.
        let itemIds: string[]
        if (selectedIds.has(item.id)) {
            itemIds = Array.from(selectedIds)
        } else {
            selectOnly(item.id)
            itemIds = [item.id]
        }
        const canvasPt = clientToCanvas(e.clientX, e.clientY)
        const originalPositions = new Map<string, { x: number; y: number }>()
        for (const id of itemIds) {
            const it = items.find((i) => i.id === id)
            if (it) originalPositions.set(id, { x: it.x, y: it.y })
        }
        dragRef.current = {
            itemIds,
            anchorId: item.id,
            offsetX: canvasPt.x - item.x,
            offsetY: canvasPt.y - item.y,
            originalPositions,
            startClientX: e.clientX,
            startClientY: e.clientY,
            totalMoved: 0,
        }
        try {
            (e.target as Element).setPointerCapture(e.pointerId)
        } catch { /* noop */ }
    }

    const onDragMove = (e: React.PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        const canvasPt = clientToCanvas(e.clientX, e.clientY)
        const anchor = items.find((it) => it.id === drag.anchorId)
        if (!anchor) return
        const rawX = canvasPt.x - drag.offsetX
        const rawY = canvasPt.y - drag.offsetY
        // Calcula delta desde la posición original del anchor
        const orig = drag.originalPositions.get(drag.anchorId)!
        const deltaX = rawX - orig.x
        const deltaY = rawY - orig.y
        // Aplica el delta a todos los ítems del set
        for (const id of drag.itemIds) {
            const origPos = drag.originalPositions.get(id)
            const item = items.find((i) => i.id === id)
            if (!origPos || !item) continue
            const maxX = canvas.width - item.width
            const maxY = canvas.height - item.height
            const nextX = Math.max(0, Math.min(maxX, origPos.x + deltaX))
            const nextY = Math.max(0, Math.min(maxY, origPos.y + deltaY))
            const finalX = snap ? snapToGrid(nextX, GRID_SIZE) : Math.round(nextX)
            const finalY = snap ? snapToGrid(nextY, GRID_SIZE) : Math.round(nextY)
            if (finalX !== item.x || finalY !== item.y) {
                onUpdateItem(id, { x: finalX, y: finalY })
            }
        }
        // Track total movement + drag-out state
        drag.totalMoved = Math.abs(e.clientX - drag.startClientX) + Math.abs(e.clientY - drag.startClientY)
        const outside = isPointerOutsideSvg(e.clientX, e.clientY)
        setIsDraggingOut(outside && drag.totalMoved > DRAG_OUT_MIN_MOVE)
    }

    const endDrag = async (e: React.PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        try {
            (e.target as Element).releasePointerCapture(e.pointerId)
        } catch { /* noop */ }
        const droppedOutside = isPointerOutsideSvg(e.clientX, e.clientY) && drag.totalMoved > DRAG_OUT_MIN_MOVE
        dragRef.current = null
        setIsDraggingOut(false)
        if (droppedOutside) {
            const count = drag.itemIds.length
            const label = count === 1 ? '1 item' : `${count} items`
            const ok = await confirm({
                title: `Delete ${label}?`,
                description: 'You dropped outside the canvas. This will remove the item(s) from the project.',
                confirmLabel: 'Delete',
                danger: true,
            })
            if (ok) {
                // Restore original positions first (to avoid leaving items
                // at edge positions), then remove.
                for (const id of drag.itemIds) {
                    const orig = drag.originalPositions.get(id)
                    if (orig) onUpdateItem(id, { x: orig.x, y: orig.y })
                    onRemoveItem(id)
                }
                setSelectedIds((prev) => {
                    const next = new Set(prev)
                    drag.itemIds.forEach((id) => next.delete(id))
                    return next
                })
            } else {
                // Cancel → restore original positions
                for (const id of drag.itemIds) {
                    const orig = drag.originalPositions.get(id)
                    if (orig) onUpdateItem(id, { x: orig.x, y: orig.y })
                }
            }
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
        if (item) selectOnly(item.id)
    }

    /* ─── Bulk actions ────────────────────────────────────────────── */

    const selectedItems = useMemo(
        () => items.filter((it) => selectedIds.has(it.id)),
        [items, selectedIds],
    )

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return
        const count = selectedIds.size
        const ok = await confirm({
            title: count === 1 ? 'Delete this item?' : `Delete ${count} items?`,
            description: "This can't be undone.",
            confirmLabel: 'Delete',
            danger: true,
        })
        if (!ok) return
        for (const id of selectedIds) onRemoveItem(id)
        clearSelection()
    }

    const handleDuplicateSelected = () => {
        if (selectedIds.size === 0) return
        const newIds: string[] = []
        for (const it of selectedItems) {
            const offset = 20
            const newX = Math.min(canvas.width - it.width, it.x + offset)
            const newY = Math.min(canvas.height - it.height, it.y + offset)
            const created = onAddItem({
                productId: it.productId,
                x: snap ? snapToGrid(newX, GRID_SIZE) : newX,
                y: snap ? snapToGrid(newY, GRID_SIZE) : newY,
                width: it.width,
                height: it.height,
            })
            if (created) newIds.push(created.id)
        }
        if (newIds.length > 0) setSelectedIds(new Set(newIds))
    }

    type AlignMode = 'left' | 'hCenter' | 'right' | 'top' | 'vCenter' | 'bottom'
    const handleAlign = (mode: AlignMode) => {
        if (selectedItems.length < 2) return
        if (mode === 'left') {
            const minX = Math.min(...selectedItems.map((it) => it.x))
            selectedItems.forEach((it) => onUpdateItem(it.id, { x: minX }))
        } else if (mode === 'right') {
            const maxRight = Math.max(...selectedItems.map((it) => it.x + it.width))
            selectedItems.forEach((it) => onUpdateItem(it.id, { x: maxRight - it.width }))
        } else if (mode === 'hCenter') {
            const centers = selectedItems.map((it) => it.x + it.width / 2)
            const avgCenter = centers.reduce((s, v) => s + v, 0) / centers.length
            selectedItems.forEach((it) => onUpdateItem(it.id, { x: Math.round(avgCenter - it.width / 2) }))
        } else if (mode === 'top') {
            const minY = Math.min(...selectedItems.map((it) => it.y))
            selectedItems.forEach((it) => onUpdateItem(it.id, { y: minY }))
        } else if (mode === 'bottom') {
            const maxBottom = Math.max(...selectedItems.map((it) => it.y + it.height))
            selectedItems.forEach((it) => onUpdateItem(it.id, { y: maxBottom - it.height }))
        } else if (mode === 'vCenter') {
            const centers = selectedItems.map((it) => it.y + it.height / 2)
            const avgCenter = centers.reduce((s, v) => s + v, 0) / centers.length
            selectedItems.forEach((it) => onUpdateItem(it.id, { y: Math.round(avgCenter - it.height / 2) }))
        }
    }

    const handleDistribute = (axis: 'h' | 'v') => {
        if (selectedItems.length < 3) return
        // Ordenar por posición, mantener el primero y el último, distribuir
        // los gaps entre los del medio de forma uniforme.
        const sorted = [...selectedItems].sort((a, b) =>
            axis === 'h' ? (a.x + a.width / 2) - (b.x + b.width / 2) : (a.y + a.height / 2) - (b.y + b.height / 2),
        )
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        if (axis === 'h') {
            const firstCenter = first.x + first.width / 2
            const lastCenter = last.x + last.width / 2
            const step = (lastCenter - firstCenter) / (sorted.length - 1)
            sorted.slice(1, -1).forEach((it, i) => {
                const targetCenter = firstCenter + step * (i + 1)
                onUpdateItem(it.id, { x: Math.round(targetCenter - it.width / 2) })
            })
        } else {
            const firstCenter = first.y + first.height / 2
            const lastCenter = last.y + last.height / 2
            const step = (lastCenter - firstCenter) / (sorted.length - 1)
            sorted.slice(1, -1).forEach((it, i) => {
                const targetCenter = firstCenter + step * (i + 1)
                onUpdateItem(it.id, { y: Math.round(targetCenter - it.height / 2) })
            })
        }
    }

    /* ─── Export + share ──────────────────────────────────────────── */

    const handleExport = () => {
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

    /* ─── Product picker ──────────────────────────────────────────── */

    const pickerResults = allProducts
        .filter((p) => {
            if (!pickerQuery.trim()) return true
            const hay = `${p.name} ${p.brand ?? ''} ${p.category ?? ''}`.toLowerCase()
            return hay.includes(pickerQuery.toLowerCase())
        })
        .slice(0, 50)

    /* ─── Render ─────────────────────────────────────────────────── */

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
                    onClick={async () => {
                        const next = await prompt({
                            title: 'Rename project',
                            label: 'Project name',
                            initialValue: name,
                            submitLabel: 'Save',
                        })
                        if (next) onRename(next)
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
                            snap ? 'border-foreground bg-muted text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Toggle snap to grid"
                    >
                        <Grid3x3 className="h-3 w-3" />
                        Snap {snap ? 'on' : 'off'}
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            if (items.length === 0) return
                            const ok = await confirm({
                                title: 'Clear all items from the canvas?',
                                description: `${items.length} ${items.length === 1 ? 'item' : 'items'} will be removed. The project itself stays.`,
                                confirmLabel: 'Clear canvas',
                                danger: true,
                            })
                            if (ok) {
                                onClearItems()
                                clearSelection()
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
                {/* Canvas wrapper con overlay de "Drop to delete" cuando drag out */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                    {isDraggingOut && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 mx-auto flex w-fit items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground shadow-xl">
                            <Trash2 className="h-4 w-4" />
                            Drop to delete
                        </div>
                    )}
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
                        onClick={() => clearSelection()}
                    >
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

                        {items.map((it) => {
                            const product = allProducts.find((p) => p.id === it.productId)
                            const selected = isSelected(it.id)
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
                                        stroke={selected ? 'var(--color-foreground, #09090b)' : 'var(--color-border, #e4e4e7)'}
                                        strokeWidth={selected ? 3 : 2}
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
                                    {/* Selection checkbox visual · siempre visible top-left */}
                                    <g
                                        onPointerDown={(e) => {
                                            e.stopPropagation()
                                            toggleSelected(it.id)
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <circle cx={12} cy={12} r={10} fill="var(--color-background, #fafafa)" opacity={0.9} />
                                        <circle
                                            cx={12}
                                            cy={12}
                                            r={9}
                                            fill={selected ? 'var(--color-primary, #a3c414)' : 'transparent'}
                                            stroke={selected ? 'var(--color-primary, #a3c414)' : 'var(--color-foreground, #09090b)'}
                                            strokeWidth={selected ? 2 : 1.5}
                                        />
                                        {selected && (
                                            <path
                                                d="M 7 12 L 11 15 L 17 9"
                                                fill="none"
                                                stroke="var(--color-primary-foreground, #02060C)"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}
                                    </g>
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

            {/* Floating bulk actions bar · aparece cuando hay 1+ items seleccionados */}
            {selectedIds.size > 0 && (
                <BulkActionsBar
                    count={selectedIds.size}
                    canAlign={selectedItems.length >= 2}
                    canDistribute={selectedItems.length >= 3}
                    onDelete={handleDeleteSelected}
                    onDuplicate={handleDuplicateSelected}
                    onAlign={handleAlign}
                    onDistribute={handleDistribute}
                    onClear={clearSelection}
                />
            )}

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}

/* ─── Floating bulk actions bar ─────────────────────────────────── */

interface BulkActionsBarProps {
    count: number
    canAlign: boolean
    canDistribute: boolean
    onDelete: () => void
    onDuplicate: () => void
    onAlign: (mode: 'left' | 'hCenter' | 'right' | 'top' | 'vCenter' | 'bottom') => void
    onDistribute: (axis: 'h' | 'v') => void
    onClear: () => void
}

function BulkActionsBar({
    count,
    canAlign,
    canDistribute,
    onDelete,
    onDuplicate,
    onAlign,
    onDistribute,
    onClear,
}: BulkActionsBarProps) {
    return (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
                {count} selected
            </span>

            <div className="mx-1 h-4 w-px bg-border" />

            <BulkIconButton onClick={onDuplicate} icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" />
            <BulkIconButton onClick={onDelete} icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" danger />

            {/* Align group · solo cuando hay 2+ */}
            <div className={`mx-1 h-4 w-px bg-border ${canAlign ? '' : 'opacity-50'}`} />
            <BulkIconButton onClick={() => onAlign('left')} icon={<AlignStartVertical className="h-3.5 w-3.5" />} label="Align left" disabled={!canAlign} />
            <BulkIconButton onClick={() => onAlign('hCenter')} icon={<AlignCenterVertical className="h-3.5 w-3.5" />} label="Align horizontal center" disabled={!canAlign} />
            <BulkIconButton onClick={() => onAlign('right')} icon={<AlignEndVertical className="h-3.5 w-3.5" />} label="Align right" disabled={!canAlign} />
            <BulkIconButton onClick={() => onAlign('top')} icon={<AlignStartHorizontal className="h-3.5 w-3.5" />} label="Align top" disabled={!canAlign} />
            <BulkIconButton onClick={() => onAlign('vCenter')} icon={<AlignCenterHorizontal className="h-3.5 w-3.5" />} label="Align vertical center" disabled={!canAlign} />
            <BulkIconButton onClick={() => onAlign('bottom')} icon={<AlignEndHorizontal className="h-3.5 w-3.5" />} label="Align bottom" disabled={!canAlign} />

            {/* Distribute group · solo cuando hay 3+ */}
            <div className={`mx-1 h-4 w-px bg-border ${canDistribute ? '' : 'opacity-50'}`} />
            <BulkIconButton onClick={() => onDistribute('h')} icon={<AlignHorizontalDistributeCenter className="h-3.5 w-3.5" />} label="Distribute horizontally" disabled={!canDistribute} />
            <BulkIconButton onClick={() => onDistribute('v')} icon={<AlignVerticalDistributeCenter className="h-3.5 w-3.5" />} label="Distribute vertically" disabled={!canDistribute} />

            <div className="mx-1 h-4 w-px bg-border" />
            <BulkIconButton onClick={onClear} icon={<X className="h-3.5 w-3.5" />} label="Clear selection" />
        </div>
    )
}

function BulkIconButton({
    onClick,
    icon,
    label,
    danger,
    disabled,
}: {
    onClick: () => void
    icon: React.ReactNode
    label: string
    danger?: boolean
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                danger
                    ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
            {icon}
        </button>
    )
}
