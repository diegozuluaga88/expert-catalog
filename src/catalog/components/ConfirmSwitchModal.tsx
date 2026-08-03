// F50 · Wave 1.b · Confirmation modal para prevenir el borrado silencioso
// de filtros al cambiar de taxonomía en el Product Catalog.
//
// Antes de este modal, al hacer click en Products/Materials/Spaces se
// llamaba a resetFacets() directo, borrando 7 Sets sin aviso — el
// usuario perdía toda su configuración de filtros. Ahora, cuando hay
// filtros activos y el user cambia de taxonomía, este diálogo pide
// confirmación explícita.
//
// Solo se monta en v2 (via prop enableConfirmSwitch en ShowroomPage).
// v1 mantiene el comportamiento silent legacy como línea base.
//
// Basado en el patrón canónico de HeadlessUI Dialog + Transition ya en
// uso en CompareModal.tsx.
//
// Skills · Nielsen H5 (Error prevention) + H3 (User control) +
// Microinteractions Rules (make invisible rules visible).

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmSwitchModalProps {
    isOpen: boolean
    fromLabel: string
    toLabel: string
    activeFiltersCount: number
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmSwitchModal({
    isOpen,
    fromLabel,
    toLabel,
    activeFiltersCount,
    onConfirm,
    onCancel,
}: ConfirmSwitchModalProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onCancel}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                                </div>
                                <div className="flex-1">
                                    <Dialog.Title as="h3" className="text-base font-bold text-foreground">
                                        Switch to {toLabel}?
                                    </Dialog.Title>
                                    <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                                        You have <strong className="text-foreground">{activeFiltersCount}</strong>{' '}
                                        active {activeFiltersCount === 1 ? 'filter' : 'filters'} in {fromLabel}. Switching
                                        to {toLabel} will clear them.
                                    </Dialog.Description>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                                >
                                    Keep {fromLabel} filters
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                    autoFocus
                                >
                                    Switch &amp; clear filters
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
