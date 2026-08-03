// F50 · Etapa 10 (rewrite) · v2 · vista del proyecto como list-based.
//
// Reemplaza el ProjectCanvas SVG por una vista jerárquica tipo Bill of
// Quantities:
//   · Header con back + nombre editable + acciones (share/export mocks)
//   · Layout 2-col: rooms/zones/items a la izquierda + product picker a
//     la derecha (mismo picker que el canvas anterior)
//   · Cada Room es una card colapsable con header (nombre + acciones)
//   · Dentro, las Zones se listan como sub-secciones. Cada Zone tiene
//     nombre + acciones + tabla de items (product + qty + notes + delete)
//   · Product picker · click en el + de un producto lo agrega a la zona
//     seleccionada (o a la default). Si el producto ya existe en esa
//     zona, incrementa qty en vez de duplicar.
//
// Sin drag, sin canvas, sin posiciones · flujo tipo document editor.

import { useState, useMemo } from 'react'
import {
    ArrowLeft,
    Plus,
    Search,
    X,
    Trash2,
    Pencil,
    ChevronDown,
    ChevronRight,
    FolderKanban,
    Home,
    Layers,
    Download,
    Share2,
    Minus,
    StickyNote,
} from 'lucide-react'
import { Button, Input, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
import type { Project, Room, Zone, ProjectItem } from './useProjects'
import { projectTotalUnits, projectTotalLines } from './useProjects'
import type { Product } from '../types'
import { useToast, ToastContainer } from '../../components/AuthToast'
import { useDialogs } from '../../components/dialogs/DialogsContext'

interface ProjectDetailViewProps {
    project: Project
    allProducts: Product[]
    onBack: () => void
    onRename: (name: string) => void
    onAddRoom: (name: string) => Room | null
    onRenameRoom: (roomId: string, name: string) => void
    onRemoveRoom: (roomId: string) => void
    onAddZone: (roomId: string, name: string) => Zone | null
    onRenameZone: (roomId: string, zoneId: string, name: string) => void
    onRemoveZone: (roomId: string, zoneId: string) => void
    onAddItem: (roomId: string, zoneId: string, productId: string, qty?: number) => ProjectItem | null
    onUpdateItem: (itemId: string, patch: Partial<Pick<ProjectItem, 'qty' | 'notes'>>) => void
    onRemoveItem: (itemId: string) => void
}

export default function ProjectDetailView({
    project,
    allProducts,
    onBack,
    onRename,
    onAddRoom,
    onRenameRoom,
    onRemoveRoom,
    onAddZone,
    onRenameZone,
    onRemoveZone,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
}: ProjectDetailViewProps) {
    const { name, rooms } = project
    const { toasts, addToast, dismissToast } = useToast()
    const { prompt, confirm } = useDialogs()

    // Zone target del product picker · si es null, agrega a la primera
    // zona del proyecto (fallback). El user puede setearlo con click en
    // "Add to this zone" · badge visible en la zona seleccionada.
    const [targetZone, setTargetZone] = useState<{ roomId: string; zoneId: string } | null>(null)
    const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set())
    const [pickerQuery, setPickerQuery] = useState('')

    const totalUnits = useMemo(() => projectTotalUnits(project), [project])
    const totalLines = useMemo(() => projectTotalLines(project), [project])

    const toggleRoom = (roomId: string) => {
        setCollapsedRooms((prev) => {
            const next = new Set(prev)
            if (next.has(roomId)) next.delete(roomId)
            else next.add(roomId)
            return next
        })
    }

    /* ─── Room actions ───────────────────────────────────────────── */

    const handleAddRoom = async () => {
        const name = await prompt({
            title: 'New room',
            label: 'Room name',
            placeholder: 'e.g. Executive Office',
            submitLabel: 'Add room',
        })
        if (name) {
            const room = onAddRoom(name)
            if (room) addToast('success', `Room "${room.name}" added`)
        }
    }

    const handleRenameRoom = async (room: Room) => {
        const next = await prompt({
            title: 'Rename room',
            label: 'Room name',
            initialValue: room.name,
            submitLabel: 'Save',
        })
        if (next) onRenameRoom(room.id, next)
    }

    const handleRemoveRoom = async (room: Room) => {
        const lineCount = room.zones.reduce((s, z) => s + z.items.length, 0)
        const ok = await confirm({
            title: `Delete "${room.name}"?`,
            description: lineCount > 0
                ? `The room has ${lineCount} item ${lineCount === 1 ? 'line' : 'lines'} across ${room.zones.length} ${room.zones.length === 1 ? 'zone' : 'zones'}. This can't be undone.`
                : 'The room is empty. This can\'t be undone.',
            confirmLabel: 'Delete room',
            danger: true,
        })
        if (ok) {
            onRemoveRoom(room.id)
            if (targetZone?.roomId === room.id) setTargetZone(null)
        }
    }

    /* ─── Zone actions ───────────────────────────────────────────── */

    const handleAddZone = async (roomId: string) => {
        const name = await prompt({
            title: 'New zone',
            label: 'Zone name',
            placeholder: 'e.g. Waiting area',
            submitLabel: 'Add zone',
        })
        if (name) {
            const zone = onAddZone(roomId, name)
            if (zone) addToast('success', `Zone "${zone.name}" added`)
        }
    }

    const handleRenameZone = async (roomId: string, zone: Zone) => {
        const next = await prompt({
            title: 'Rename zone',
            label: 'Zone name',
            initialValue: zone.name,
            submitLabel: 'Save',
        })
        if (next) onRenameZone(roomId, zone.id, next)
    }

    const handleRemoveZone = async (roomId: string, zone: Zone) => {
        const ok = await confirm({
            title: `Delete zone "${zone.name}"?`,
            description: zone.items.length > 0
                ? `The zone has ${zone.items.length} item ${zone.items.length === 1 ? 'line' : 'lines'}. This can't be undone.`
                : 'The zone is empty. This can\'t be undone.',
            confirmLabel: 'Delete zone',
            danger: true,
        })
        if (ok) {
            onRemoveZone(roomId, zone.id)
            if (targetZone?.zoneId === zone.id) setTargetZone(null)
        }
    }

    /* ─── Item actions ───────────────────────────────────────────── */

    const handleAddItem = (product: Product) => {
        // Elige zone destino · target seleccionado, o la primera zone
        // de la primera room como fallback.
        const roomId = targetZone?.roomId ?? rooms[0]?.id
        const zoneId = targetZone?.zoneId ?? rooms[0]?.zones[0]?.id
        if (!roomId || !zoneId) {
            addToast('error', 'Create a room and a zone first before adding items.')
            return
        }
        onAddItem(roomId, zoneId, product.id, 1)
        addToast('success', `${product.name} added to ${findZoneName(roomId, zoneId)}`)
    }

    const findZoneName = (roomId: string, zoneId: string): string => {
        const room = rooms.find((r) => r.id === roomId)
        const zone = room?.zones.find((z) => z.id === zoneId)
        return `${room?.name ?? 'Room'} · ${zone?.name ?? 'Zone'}`
    }

    const handleQtyChange = (itemId: string, delta: number, currentQty: number) => {
        const nextQty = Math.max(1, currentQty + delta)
        if (nextQty !== currentQty) onUpdateItem(itemId, { qty: nextQty })
    }

    const handleItemNotes = async (item: ProjectItem, productName: string) => {
        const next = await prompt({
            title: `Notes for ${productName}`,
            label: 'Notes',
            placeholder: 'e.g. Custom fabric SC-42, delivery week 12',
            initialValue: item.notes ?? '',
            submitLabel: 'Save',
        })
        if (next !== null) onUpdateItem(item.id, { notes: next })
    }

    const handleRemoveItem = async (item: ProjectItem, productName: string) => {
        const ok = await confirm({
            title: `Remove "${productName}"?`,
            description: 'This removes the line from the project. The product stays in the catalog.',
            confirmLabel: 'Remove',
            danger: true,
        })
        if (ok) onRemoveItem(item.id)
    }

    /* ─── Export & share (mocks) ─────────────────────────────────── */

    const handleExportCSV = () => {
        // BOQ CSV con columnas: Room, Zone, Brand, Product, Qty, Notes
        const rows: string[] = ['Room,Zone,Brand,Product,Qty,Notes']
        for (const room of rooms) {
            for (const zone of room.zones) {
                for (const item of zone.items) {
                    const p = allProducts.find((x) => x.id === item.productId)
                    const cells = [
                        room.name,
                        zone.name,
                        p?.brand ?? '',
                        p?.name ?? item.productId,
                        String(item.qty),
                        (item.notes ?? '').replace(/"/g, '""'),
                    ].map((c) => `"${c}"`)
                    rows.push(cells.join(','))
                }
            }
        }
        const csv = rows.join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-boq.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        addToast('success', `${totalLines} ${totalLines === 1 ? 'line' : 'lines'} exported as CSV.`)
    }

    const handleShare = async () => {
        const shareData = btoa(unescape(encodeURIComponent(JSON.stringify({
            n: name,
            r: rooms.map((r) => ({
                n: r.name,
                z: r.zones.map((z) => ({
                    n: z.name,
                    i: z.items.map((it) => ({ p: it.productId, q: it.qty })),
                })),
            })),
        }))))
        const link = `${window.location.origin}${window.location.pathname}?project-share=${shareData.slice(0, 200)}…`
        try {
            await navigator.clipboard.writeText(link)
            addToast('success', 'Share link copied · read-only view of this project (mock).')
        } catch {
            window.prompt('Copy this link:', link)
        }
    }

    /* ─── Product picker filter ──────────────────────────────────── */

    const pickerResults = useMemo(() => {
        return allProducts
            .filter((p) => {
                if (!pickerQuery.trim()) return true
                const hay = `${p.name} ${p.brand ?? ''} ${p.category ?? ''}`.toLowerCase()
                return hay.includes(pickerQuery.toLowerCase())
            })
            .slice(0, 60)
    }, [allProducts, pickerQuery])

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
                    · {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · {totalLines} {totalLines === 1 ? 'line' : 'lines'} · {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                </span>

                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={totalLines === 0}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export as CSV (Bill of Quantities)"
                    >
                        <Download className="h-3 w-3" />
                        Export CSV
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

            {/* Body · rooms/zones/items + product picker */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <main className="space-y-3">
                    {rooms.length === 0 ? (
                        <EmptyState>
                            <EmptyStateIcon>
                                <Home className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                            </EmptyStateIcon>
                            <EmptyStateTitle>No rooms yet</EmptyStateTitle>
                            <EmptyStateDescription>
                                Add a room to start structuring the project by space.
                            </EmptyStateDescription>
                        </EmptyState>
                    ) : (
                        rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                allProducts={allProducts}
                                collapsed={collapsedRooms.has(room.id)}
                                targetZone={targetZone}
                                onToggle={() => toggleRoom(room.id)}
                                onRename={() => handleRenameRoom(room)}
                                onDelete={() => handleRemoveRoom(room)}
                                onAddZone={() => handleAddZone(room.id)}
                                onRenameZone={(zone) => handleRenameZone(room.id, zone)}
                                onDeleteZone={(zone) => handleRemoveZone(room.id, zone)}
                                onSelectZone={(zoneId) => setTargetZone({ roomId: room.id, zoneId })}
                                onQtyChange={handleQtyChange}
                                onEditNotes={handleItemNotes}
                                onRemoveItem={handleRemoveItem}
                            />
                        ))
                    )}

                    <button
                        type="button"
                        onClick={handleAddRoom}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add room
                    </button>
                </main>

                {/* Product picker */}
                <aside className="sticky top-4 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <header className="border-b border-border p-3">
                        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product picker</h3>
                        {targetZone ? (
                            <p className="mb-2 text-[11px] text-foreground">
                                Adding to <span className="font-bold">{findZoneName(targetZone.roomId, targetZone.zoneId)}</span>
                            </p>
                        ) : (
                            <p className="mb-2 text-[11px] text-muted-foreground">
                                Adds to the first zone by default · click a zone to change target.
                            </p>
                        )}
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
                    </header>
                    <ul className="scrollbar-mrl flex-1 space-y-1 overflow-y-auto p-2">
                        {pickerResults.length === 0 ? (
                            <li className="py-8 text-center text-xs text-muted-foreground">No products match.</li>
                        ) : (
                            pickerResults.map((p) => (
                                <li key={p.id}>
                                    <div className="group flex items-center gap-2 rounded-lg border border-border bg-background p-1.5 hover:border-foreground/20 hover:bg-muted transition-colors">
                                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                                            <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{p.brand}</p>
                                            <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(p)}
                                            aria-label={`Add ${p.name} to project`}
                                            title="Add 1 unit to selected zone"
                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground opacity-0 transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </aside>
            </div>

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}

/* ─── Room card ─────────────────────────────────────────────────── */

interface RoomCardProps {
    room: Room
    allProducts: Product[]
    collapsed: boolean
    targetZone: { roomId: string; zoneId: string } | null
    onToggle: () => void
    onRename: () => void
    onDelete: () => void
    onAddZone: () => void
    onRenameZone: (zone: Zone) => void
    onDeleteZone: (zone: Zone) => void
    onSelectZone: (zoneId: string) => void
    onQtyChange: (itemId: string, delta: number, currentQty: number) => void
    onEditNotes: (item: ProjectItem, productName: string) => void
    onRemoveItem: (item: ProjectItem, productName: string) => void
}

function RoomCard({
    room,
    allProducts,
    collapsed,
    targetZone,
    onToggle,
    onRename,
    onDelete,
    onAddZone,
    onRenameZone,
    onDeleteZone,
    onSelectZone,
    onQtyChange,
    onEditNotes,
    onRemoveItem,
}: RoomCardProps) {
    const roomLines = room.zones.reduce((s, z) => s + z.items.length, 0)
    return (
        <article className="rounded-xl border border-border bg-card overflow-hidden">
            <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={collapsed ? 'Expand room' : 'Collapse room'}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="flex-1 truncate text-sm font-bold text-foreground">{room.name}</h2>
                <span className="text-[11px] text-muted-foreground">
                    {room.zones.length} {room.zones.length === 1 ? 'zone' : 'zones'} · {roomLines} {roomLines === 1 ? 'line' : 'lines'}
                </span>
                <button
                    type="button"
                    onClick={onRename}
                    aria-label="Rename room"
                    title="Rename room"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Pencil className="h-3 w-3" />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label="Delete room"
                    title="Delete room"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </header>

            {!collapsed && (
                <div className="divide-y divide-border">
                    {room.zones.map((zone) => (
                        <ZoneSection
                            key={zone.id}
                            zone={zone}
                            allProducts={allProducts}
                            isTarget={targetZone?.roomId === room.id && targetZone?.zoneId === zone.id}
                            onSelect={() => onSelectZone(zone.id)}
                            onRename={() => onRenameZone(zone)}
                            onDelete={() => onDeleteZone(zone)}
                            onQtyChange={onQtyChange}
                            onEditNotes={onEditNotes}
                            onRemoveItem={onRemoveItem}
                        />
                    ))}
                    <div className="p-2">
                        <button
                            type="button"
                            onClick={onAddZone}
                            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            Add zone
                        </button>
                    </div>
                </div>
            )}
        </article>
    )
}

/* ─── Zone section ──────────────────────────────────────────────── */

interface ZoneSectionProps {
    zone: Zone
    allProducts: Product[]
    isTarget: boolean
    onSelect: () => void
    onRename: () => void
    onDelete: () => void
    onQtyChange: (itemId: string, delta: number, currentQty: number) => void
    onEditNotes: (item: ProjectItem, productName: string) => void
    onRemoveItem: (item: ProjectItem, productName: string) => void
}

function ZoneSection({
    zone,
    allProducts,
    isTarget,
    onSelect,
    onRename,
    onDelete,
    onQtyChange,
    onEditNotes,
    onRemoveItem,
}: ZoneSectionProps) {
    return (
        <section className={`p-3 ${isTarget ? 'bg-primary/5' : ''}`}>
            <header className="mb-2 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onSelect}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left"
                    title={isTarget ? 'Selected · new items go here' : 'Click to target this zone'}
                >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-[13px] font-bold text-foreground">{zone.name}</h3>
                    {isTarget && (
                        <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0 text-[9px] font-bold uppercase text-primary-foreground">
                            Target
                        </span>
                    )}
                </button>
                <span className="text-[11px] text-muted-foreground">
                    {zone.items.length} {zone.items.length === 1 ? 'line' : 'lines'}
                </span>
                <div className="ml-auto flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={onRename}
                        aria-label="Rename zone"
                        title="Rename zone"
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Pencil className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        aria-label="Delete zone"
                        title="Delete zone"
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </header>

            {zone.items.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-center text-[11px] text-muted-foreground">
                    No items yet · use the product picker on the right {isTarget ? 'to add here' : '(click the zone name to target it)'}.
                </p>
            ) : (
                <ul className="space-y-1">
                    {zone.items.map((item) => {
                        const product = allProducts.find((p) => p.id === item.productId)
                        return (
                            <ItemRow
                                key={item.id}
                                item={item}
                                product={product}
                                onIncrement={() => onQtyChange(item.id, +1, item.qty)}
                                onDecrement={() => onQtyChange(item.id, -1, item.qty)}
                                onEditNotes={() => onEditNotes(item, product?.name ?? 'item')}
                                onRemove={() => onRemoveItem(item, product?.name ?? 'item')}
                            />
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

/* ─── Item row ──────────────────────────────────────────────────── */

interface ItemRowProps {
    item: ProjectItem
    product?: Product
    onIncrement: () => void
    onDecrement: () => void
    onEditNotes: () => void
    onRemove: () => void
}

function ItemRow({ item, product, onIncrement, onDecrement, onEditNotes, onRemove }: ItemRowProps) {
    return (
        <li className="group flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                {product ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">?</div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {product?.brand ?? '—'}
                </p>
                <p className="text-xs font-semibold text-foreground truncate">
                    {product?.name ?? 'Missing product'}
                </p>
                {item.notes && (
                    <p className="mt-0.5 text-[10px] italic text-muted-foreground truncate">{item.notes}</p>
                )}
            </div>
            {/* Qty stepper */}
            <div className="inline-flex items-center gap-0.5 rounded-md border border-border">
                <button
                    type="button"
                    onClick={onDecrement}
                    disabled={item.qty <= 1}
                    aria-label="Decrease qty"
                    className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[24px] text-center text-xs font-bold tabular-nums text-foreground">{item.qty}</span>
                <button
                    type="button"
                    onClick={onIncrement}
                    aria-label="Increase qty"
                    className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
            <button
                type="button"
                onClick={onEditNotes}
                aria-label={item.notes ? 'Edit notes' : 'Add notes'}
                title={item.notes ? 'Edit notes' : 'Add notes'}
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                    item.notes ? 'text-foreground bg-muted' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground'
                }`}
            >
                <StickyNote className="h-3 w-3" />
            </button>
            <button
                type="button"
                onClick={onRemove}
                aria-label="Remove item"
                title="Remove item"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            >
                <Trash2 className="h-3 w-3" />
            </button>
        </li>
    )
}
