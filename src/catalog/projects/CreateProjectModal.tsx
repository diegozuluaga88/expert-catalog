// F50 · Etapa 10 · v2 · modal DS-compliant para crear un proyecto nuevo.
// Reemplaza el window.prompt nativo (que ignora el DS y no permite
// configuración inicial).
//
// Fields:
//   · Name · input required, autofocus
//   · Canvas size · 3 presets radios (Small / Medium / Large)
//
// Skills · Nielsen H3 (User control) + H5 (Error prevention · validation
// del nombre required) + Refactoring UI · Depth.

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Plus } from 'lucide-react'
import { Button, Input } from 'strata-design-system'
import type { ProjectCanvas } from './useProjects'

interface CreateProjectModalProps {
    open: boolean
    onClose: () => void
    onCreate: (name: string, canvas: ProjectCanvas) => void
}

interface SizePreset {
    id: 'small' | 'medium' | 'large'
    label: string
    dims: string
    canvas: ProjectCanvas
}

const SIZE_PRESETS: SizePreset[] = [
    { id: 'small', label: 'Small', dims: '800 × 600', canvas: { width: 800, height: 600 } },
    { id: 'medium', label: 'Medium', dims: '1200 × 800', canvas: { width: 1200, height: 800 } },
    { id: 'large', label: 'Large', dims: '1600 × 1200', canvas: { width: 1600, height: 1200 } },
]

export default function CreateProjectModal({ open, onClose, onCreate }: CreateProjectModalProps) {
    const [name, setName] = useState('')
    const [sizeId, setSizeId] = useState<SizePreset['id']>('medium')

    useEffect(() => {
        if (!open) {
            setName('')
            setSizeId('medium')
        }
    }, [open])

    const canSubmit = name.trim().length > 0

    const handleSubmit = () => {
        if (!canSubmit) return
        const preset = SIZE_PRESETS.find((p) => p.id === sizeId)!
        onCreate(name.trim(), preset.canvas)
    }

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
                        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-card shadow-2xl overflow-hidden">
                            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                                <div>
                                    <Dialog.Title className="text-base font-bold text-foreground">New project</Dialog.Title>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Set a name and choose a canvas size. You can always resize items later.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>

                            <div className="space-y-4 px-5 py-4">
                                <div>
                                    <label htmlFor="project-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Project name
                                    </label>
                                    <Input
                                        id="project-name"
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && canSubmit) {
                                                e.preventDefault()
                                                handleSubmit()
                                            }
                                        }}
                                        placeholder="e.g. Fairport Reception"
                                    />
                                </div>

                                <fieldset>
                                    <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Canvas size
                                    </legend>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SIZE_PRESETS.map((preset) => {
                                            const selected = sizeId === preset.id
                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => setSizeId(preset.id)}
                                                    aria-pressed={selected}
                                                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                                                        selected
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-border bg-background hover:bg-muted'
                                                    }`}
                                                >
                                                    <SizeThumb ratio={preset.canvas.width / preset.canvas.height} selected={selected} />
                                                    <span className="text-sm font-bold text-foreground">{preset.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">{preset.dims}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </fieldset>
                            </div>

                            <footer className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={!canSubmit}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Create project
                                </Button>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

// Mini-thumbnail proporcional para el radio card · comunica el aspect
// ratio del preset sin cargar imagen.
function SizeThumb({ ratio, selected }: { ratio: number; selected: boolean }) {
    // Fija altura y calcula width según ratio · max 36×24
    const h = 20
    const w = Math.round(h * ratio)
    return (
        <div className="mb-1 flex h-6 items-center justify-center">
            <div
                className={`rounded border ${selected ? 'border-primary bg-primary/20' : 'border-border bg-muted'}`}
                style={{ width: Math.min(w, 36), height: h }}
                aria-hidden="true"
            />
        </div>
    )
}
