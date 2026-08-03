// F50 · sweep DS · modal de prompt (rename/new). Consumido solo por
// DialogsProvider · no se instancia directo desde pages.

import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { Button, Input } from 'strata-design-system'
import type { PromptOptions } from './DialogsContext'

interface PromptDialogProps {
    open: boolean
    options: PromptOptions
    onClose: (value: string | null) => void
}

export default function PromptDialog({ open, options, onClose }: PromptDialogProps) {
    const [value, setValue] = useState('')
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Reset value cuando el modal abre con nuevas options
    useEffect(() => {
        if (open) {
            setValue(options.initialValue ?? '')
            setError(null)
            // Selecciona el texto para edición rápida
            requestAnimationFrame(() => {
                inputRef.current?.select()
            })
        }
    }, [open, options.initialValue])

    const handleSubmit = () => {
        const trimmed = value.trim()
        if (!trimmed) {
            setError('Please enter a value')
            return
        }
        if (options.validate) {
            const err = options.validate(trimmed)
            if (err) {
                setError(err)
                return
            }
        }
        onClose(trimmed)
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={() => onClose(null)} className="relative z-[90]">
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
                                <div className="min-w-0">
                                    <Dialog.Title className="text-base font-bold text-foreground">{options.title}</Dialog.Title>
                                    {options.description && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">{options.description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onClose(null)}
                                    aria-label="Cancel"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>

                            <div className="px-5 py-4">
                                {options.label && (
                                    <label
                                        htmlFor="prompt-dialog-input"
                                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        {options.label}
                                    </label>
                                )}
                                <Input
                                    id="prompt-dialog-input"
                                    ref={inputRef}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value)
                                        if (error) setError(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSubmit()
                                        }
                                    }}
                                    placeholder={options.placeholder}
                                    autoFocus
                                />
                                {error && (
                                    <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>
                                )}
                            </div>

                            <footer className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
                                <Button variant="outline" onClick={() => onClose(null)}>
                                    {options.cancelLabel ?? 'Cancel'}
                                </Button>
                                <Button onClick={handleSubmit} disabled={value.trim().length === 0}>
                                    {options.submitLabel ?? 'Save'}
                                </Button>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
