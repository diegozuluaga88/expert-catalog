// F50 · Etapa 10 (rewrite list-based) · v2 · modal DS-compliant para
// crear un proyecto nuevo. Ahora solo pide nombre · el shape es
// jerárquico (rooms > zones > items) y arranca con una room + zone
// default que el user puede renombrar/agregar.

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Plus } from 'lucide-react'
import { Button, Input } from 'strata-design-system'

interface CreateProjectModalProps {
    open: boolean
    onClose: () => void
    onCreate: (name: string) => void
}

export default function CreateProjectModal({ open, onClose, onCreate }: CreateProjectModalProps) {
    const [name, setName] = useState('')

    useEffect(() => {
        if (!open) setName('')
    }, [open])

    const canSubmit = name.trim().length > 0

    const handleSubmit = () => {
        if (!canSubmit) return
        onCreate(name.trim())
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
                                        Set a name. The project starts with a "Room 1 · Default" that you can rename and expand.
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
