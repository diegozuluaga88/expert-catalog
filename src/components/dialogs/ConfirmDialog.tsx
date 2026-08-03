// F50 · sweep DS · modal de confirm (delete/clear). Consumido solo por
// DialogsProvider · no se instancia directo desde pages.

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'
import { Button } from 'strata-design-system'
import type { ConfirmOptions } from './DialogsContext'

interface ConfirmDialogProps {
    open: boolean
    options: ConfirmOptions
    onClose: (value: boolean) => void
}

export default function ConfirmDialog({ open, options, onClose }: ConfirmDialogProps) {
    const danger = options.danger ?? false
    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={() => onClose(false)} className="relative z-[90]">
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
                            <div className="flex items-start gap-3 px-5 pt-5">
                                {danger && (
                                    <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                        <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <Dialog.Title className="text-base font-bold text-foreground">{options.title}</Dialog.Title>
                                    {options.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{options.description}</p>
                                    )}
                                </div>
                            </div>

                            <footer className="mt-5 flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
                                <Button variant="outline" onClick={() => onClose(false)}>
                                    {options.cancelLabel ?? 'Cancel'}
                                </Button>
                                {danger ? (
                                    <button
                                        type="button"
                                        onClick={() => onClose(true)}
                                        className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                                    >
                                        {options.confirmLabel ?? 'Confirm'}
                                    </button>
                                ) : (
                                    <Button onClick={() => onClose(true)}>
                                        {options.confirmLabel ?? 'Confirm'}
                                    </Button>
                                )}
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
