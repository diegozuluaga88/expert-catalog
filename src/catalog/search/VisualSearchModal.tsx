// F50 · Etapa 9 (P1 search · 9.c) · v2 · visual search STUB.
//
// El PRD P1 pide "search visual" · el user sube una foto de una silla y
// el sistema devuelve productos similares del catálogo. Sin embeddings
// ni backend real, este modal:
//   1. Acepta upload de imagen (drag-drop o file picker) o URL.
//   2. Muestra 1.2s de "processing" simulado.
//   3. Devuelve un puñado de productos random del catálogo con un banner
//      honesto explicando que la similaridad es mock.
//
// Cuando exista backend, este modal se convierte en el wrapper del
// endpoint real (POST /search/visual con la imagen · devuelve top-K
// productos con score).
//
// Skills · Nielsen H10 (Help) + Norman Feedback (spinner de processing)
// + Refactoring UI (banner honesto + resultados como cards).

import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Upload, ImagePlus, ShieldAlert, ArrowUpRight, Loader2 } from 'lucide-react'
import { Button } from 'strata-design-system'
import type { Product } from '../types'

interface VisualSearchModalProps {
    open: boolean
    onClose: () => void
    products: Product[]
    onOpenProduct: (productId: string) => void
}

type Phase = 'upload' | 'processing' | 'results'

export default function VisualSearchModal({ open, onClose, products, onOpenProduct }: VisualSearchModalProps) {
    const [phase, setPhase] = useState<Phase>('upload')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [results, setResults] = useState<Product[]>([])
    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) {
            setPhase('upload')
            setPreviewUrl(null)
            setResults([])
            setDragging(false)
        }
    }, [open])

    const runMockSearch = (imageUrl: string) => {
        setPreviewUrl(imageUrl)
        setPhase('processing')
        // Devuelve 6-8 productos random como "similares" (mock).
        window.setTimeout(() => {
            const shuffled = [...products].sort(() => Math.random() - 0.5)
            setResults(shuffled.slice(0, 8))
            setPhase('results')
        }, 1200)
    }

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return
        const url = URL.createObjectURL(file)
        runMockSearch(url)
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[85]">
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
                        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl overflow-hidden">
                            {/* Header */}
                            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                                <div>
                                    <Dialog.Title className="text-base font-bold text-foreground">
                                        Visual search
                                    </Dialog.Title>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Upload an image to find similar products in the catalog.
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

                            {/* Honest banner · siempre visible */}
                            <div className="flex items-start gap-2 border-b border-border bg-amber-500/10 px-5 py-3 text-[12px]">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                                <div>
                                    <p className="font-semibold text-foreground">Mock results · not real similarity yet</p>
                                    <p className="mt-0.5 text-muted-foreground">
                                        Visual similarity requires embeddings + a backend. This preview returns random products from the catalog so you can see how the UX would work.
                                    </p>
                                </div>
                            </div>

                            {/* Body por phase */}
                            <div className="p-5 min-h-[280px]">
                                {phase === 'upload' && (
                                    <div>
                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault()
                                                setDragging(true)
                                            }}
                                            onDragLeave={() => setDragging(false)}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                setDragging(false)
                                                const file = e.dataTransfer.files[0]
                                                if (file) handleFile(file)
                                            }}
                                            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
                                                dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                                            }`}
                                        >
                                            <ImagePlus className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-foreground">Drop an image here</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP · up to 10 MB</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFile(file)
                                                }}
                                            />
                                            <Button onClick={() => fileInputRef.current?.click()}>
                                                <Upload className="mr-1.5 h-4 w-4" />
                                                Choose file
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {phase === 'processing' && (
                                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                                        {previewUrl && (
                                            <img
                                                src={previewUrl}
                                                alt="Search reference"
                                                className="max-h-40 rounded-lg border border-border object-cover"
                                            />
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                            Analyzing image (mock)…
                                        </div>
                                    </div>
                                )}

                                {phase === 'results' && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {previewUrl && (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Reference"
                                                        className="h-12 w-12 rounded-lg border border-border object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Similar to your image</p>
                                                    <p className="text-sm font-bold text-foreground">{results.length} matches (mock)</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhase('upload')
                                                    setPreviewUrl(null)
                                                    setResults([])
                                                }}
                                                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Try another
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {results.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onOpenProduct(p.id)
                                                        onClose()
                                                    }}
                                                    className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left hover:border-primary/40 hover:shadow-sm transition-all"
                                                >
                                                    <div className="aspect-square overflow-hidden bg-muted">
                                                        <img
                                                            src={p.images[0]}
                                                            alt={p.name}
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="flex-1 p-2">
                                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                                                            {p.brand}
                                                        </p>
                                                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-5 py-3">
                                <span className="text-[10px] text-muted-foreground italic">
                                    Backend endpoint will replace the mock delay and shuffle.
                                </span>
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
