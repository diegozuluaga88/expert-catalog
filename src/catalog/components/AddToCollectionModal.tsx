// F50 · Wave 6 · v2 · modal para agregar/quitar un producto de colecciones.
//
// Se abre cuando el usuario hace click en el heart de un card. Muestra la
// lista de colecciones existentes con checkbox (checked = el producto ya
// pertenece), un input para crear una colección nueva sobre la marcha, y
// un CTA para confirmar los cambios.
//
// Skills · Nielsen H3 (User control) + Norman Signifier + Refactoring UI
// (Depth · un modal con backdrop concentra la atención en la elección).

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Check, FolderPlus, Trash2 } from 'lucide-react'
import { Button, Input } from 'strata-design-system'
import type { Collection } from '../browse/useCollections'
import { useDialogs } from '../../components/dialogs/DialogsContext'

interface AddToCollectionModalProps {
    open: boolean
    onClose: () => void
    productId: string
    productName?: string
    collections: Collection[]
    onCreateCollection: (name: string) => Collection
    onAddToCollection: (collectionId: string, productId: string) => void
    onRemoveFromCollection: (collectionId: string, productId: string) => void
    onDeleteCollection?: (collectionId: string) => void
}

export default function AddToCollectionModal({
    open,
    onClose,
    productId,
    productName,
    collections,
    onCreateCollection,
    onAddToCollection,
    onRemoveFromCollection,
    onDeleteCollection,
}: AddToCollectionModalProps) {
    const [newName, setNewName] = useState('')
    const [creatingIntent, setCreatingIntent] = useState(false)
    const { confirm } = useDialogs()

    useEffect(() => {
        if (!open) {
            setNewName('')
            setCreatingIntent(false)
        }
    }, [open])

    const belongsTo = useMemo(() => {
        const s = new Set<string>()
        collections.forEach((c) => {
            if (c.productIds.includes(productId)) s.add(c.id)
        })
        return s
    }, [collections, productId])

    const handleToggleCollection = (collectionId: string) => {
        if (belongsTo.has(collectionId)) {
            onRemoveFromCollection(collectionId, productId)
        } else {
            onAddToCollection(collectionId, productId)
        }
    }

    const handleCreateAndAdd = () => {
        const trimmed = newName.trim()
        if (!trimmed) return
        const created = onCreateCollection(trimmed)
        onAddToCollection(created.id, productId)
        setNewName('')
        setCreatingIntent(false)
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
                        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-card shadow-xl">
                            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                                <div className="min-w-0">
                                    <Dialog.Title className="text-base font-bold text-foreground">
                                        Save to collection
                                    </Dialog.Title>
                                    {productName && (
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{productName}</p>
                                    )}
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

                            <div className="max-h-80 overflow-y-auto px-5 py-3">
                                {collections.length === 0 && !creatingIntent && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        You don't have any collections yet. Create one below.
                                    </p>
                                )}
                                <ul className="space-y-1">
                                    {collections.map((c) => {
                                        const checked = belongsTo.has(c.id)
                                        return (
                                            <li key={c.id} className="group flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCollection(c.id)}
                                                    className={`flex flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                                        checked
                                                            ? 'border-primary/50 bg-primary/10 text-foreground'
                                                            : 'border-border bg-background text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                            checked
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-border bg-card'
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        {checked && <Check className="h-3 w-3" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                                                    <span className="text-xs text-muted-foreground">{c.productIds.length}</span>
                                                </button>
                                                {onDeleteCollection && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const ok = await confirm({
                                                                title: `Delete "${c.name}"?`,
                                                                description: 'Products stay in the catalog. Only the collection grouping is removed.',
                                                                confirmLabel: 'Delete collection',
                                                                danger: true,
                                                            })
                                                            if (ok) onDeleteCollection(c.id)
                                                        }}
                                                        aria-label={`Delete ${c.name}`}
                                                        title="Delete collection"
                                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>

                            <footer className="border-t border-border bg-muted/30 px-5 py-4">
                                {creatingIntent ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Collection name"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    handleCreateAndAdd()
                                                } else if (e.key === 'Escape') {
                                                    e.preventDefault()
                                                    setCreatingIntent(false)
                                                    setNewName('')
                                                }
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleCreateAndAdd}
                                            disabled={!newName.trim()}
                                        >
                                            Create
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setCreatingIntent(true)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                                    >
                                        <FolderPlus className="h-4 w-4" />
                                        Create new collection
                                    </button>
                                )}
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
