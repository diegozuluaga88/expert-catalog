// F50 · Etapa 10.d (previa Etapa 11) · v2 · modal DS-compliant para
// enviar un producto del catálogo a un project · room · zone.
//
// Diseño · lista plana de todos los combos (Project · Room · Zone) para
// evitar flow multi-step. El user elige el destino con radio + click
// Add. Si no hay proyectos, botón "New project" al footer arma uno
// nuevo y agrega el producto a Room 1 · Default automáticamente.
//
// Skills · Nielsen H3 (User control) + Refactoring UI (Hierarchy · una
// sola pantalla, sin flow) + Norman Constraints (destino explícito
// antes de submit).

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Plus, Home, Layers, FolderKanban, Check } from 'lucide-react'
import { Button, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from 'strata-design-system'
import type { Project } from './useProjects'
import { useDialogs } from '../../components/dialogs/DialogsContext'

interface AddToProjectModalProps {
    open: boolean
    onClose: () => void
    /** Producto a agregar · muestra el nombre en el header. */
    productName: string
    projects: Project[]
    onAdd: (projectId: string, roomId: string, zoneId: string) => void
    /** Crea un proyecto nuevo (con room+zone default) y devuelve su id.
     *  El modal lo llama internamente al click en "New project". */
    onCreateProject: (name: string) => Project | null
}

interface Combo {
    key: string
    projectId: string
    projectName: string
    roomId: string
    roomName: string
    zoneId: string
    zoneName: string
    zoneItemCount: number
}

export default function AddToProjectModal({
    open,
    onClose,
    productName,
    projects,
    onAdd,
    onCreateProject,
}: AddToProjectModalProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const { prompt } = useDialogs()

    // Flat de todos los combos Project · Room · Zone (con conteo de items).
    const combos: Combo[] = useMemo(() => {
        const out: Combo[] = []
        for (const p of projects) {
            for (const r of p.rooms) {
                for (const z of r.zones) {
                    out.push({
                        key: `${p.id}::${r.id}::${z.id}`,
                        projectId: p.id,
                        projectName: p.name,
                        roomId: r.id,
                        roomName: r.name,
                        zoneId: z.id,
                        zoneName: z.name,
                        zoneItemCount: z.items.length,
                    })
                }
            }
        }
        return out
    }, [projects])

    // Al abrir, pre-selecciona el primer combo · si hay uno.
    useEffect(() => {
        if (open) {
            setSelectedKey(combos[0]?.key ?? null)
        }
    }, [open, combos])

    const canAdd = selectedKey !== null

    const handleAdd = () => {
        if (!selectedKey) return
        const combo = combos.find((c) => c.key === selectedKey)
        if (!combo) return
        onAdd(combo.projectId, combo.roomId, combo.zoneId)
    }

    const handleNewProject = async () => {
        const name = await prompt({
            title: 'New project',
            label: 'Project name',
            placeholder: 'e.g. Fairport Reception',
            submitLabel: 'Create',
        })
        if (!name) return
        const created = onCreateProject(name)
        if (created && created.rooms[0]?.zones[0]) {
            // Auto-agrega el producto al Room 1 · Default del nuevo project.
            onAdd(created.id, created.rooms[0].id, created.rooms[0].zones[0].id)
        }
    }

    // Agrupa los combos por project para renderizar con headers.
    const grouped = useMemo(() => {
        const map = new Map<string, { projectName: string; items: Combo[] }>()
        for (const c of combos) {
            if (!map.has(c.projectId)) {
                map.set(c.projectId, { projectName: c.projectName, items: [] })
            }
            map.get(c.projectId)!.items.push(c)
        }
        return Array.from(map.entries())
    }, [combos])

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[70]">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-150"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-100"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="flex w-full max-w-lg flex-col rounded-2xl bg-card shadow-2xl overflow-hidden">
                            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                                <div className="min-w-0">
                                    <Dialog.Title className="text-base font-bold text-foreground">Add to project</Dialog.Title>
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{productName}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Cancel"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>

                            <div className="scrollbar-mrl max-h-[60vh] flex-1 overflow-y-auto px-3 py-2">
                                {combos.length === 0 ? (
                                    <div className="py-4">
                                        <EmptyState>
                                            <EmptyStateIcon>
                                                <FolderKanban className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                                            </EmptyStateIcon>
                                            <EmptyStateTitle>No projects yet</EmptyStateTitle>
                                            <EmptyStateDescription>
                                                Create your first project below · the product will be added to Room 1 · Default automatically.
                                            </EmptyStateDescription>
                                        </EmptyState>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {grouped.map(([projectId, { projectName, items }]) => (
                                            <section key={projectId}>
                                                <h3 className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    <FolderKanban className="h-3 w-3" aria-hidden="true" />
                                                    {projectName}
                                                </h3>
                                                <ul className="space-y-0.5">
                                                    {items.map((c) => {
                                                        const selected = selectedKey === c.key
                                                        return (
                                                            <li key={c.key}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedKey(c.key)}
                                                                    aria-pressed={selected}
                                                                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                                                        selected
                                                                            ? 'border-foreground bg-muted'
                                                                            : 'border-border bg-background hover:bg-muted'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                                            selected
                                                                                ? 'border-foreground bg-foreground text-background'
                                                                                : 'border-border bg-background'
                                                                        }`}
                                                                        aria-hidden="true"
                                                                    >
                                                                        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                                                                    </span>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                                                                            <Home className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                                                            <span className="truncate">{c.roomName}</span>
                                                                            <span className="text-muted-foreground">›</span>
                                                                            <Layers className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                                                                            <span className="truncate">{c.zoneName}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {c.zoneItemCount} {c.zoneItemCount === 1 ? 'line' : 'lines'}
                                                                    </span>
                                                                </button>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3">
                                <button
                                    type="button"
                                    onClick={handleNewProject}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    New project
                                </button>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAdd} disabled={!canAdd}>
                                        Add
                                    </Button>
                                </div>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
