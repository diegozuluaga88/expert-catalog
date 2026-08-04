// F51 · A.1 · Inspiration Gallery · upload flow (2 steps).
//
// Step 1 · file + metadata (title, designFirm, roomType) + design-firm
// gating (checkbox "confirmo derechos" — stub porque el PRD dice que el
// fail real fue no conseguir content de design firms).
// Step 2 · el usuario ve la installation ya creada y se le invita a
// taggear productos desde el detail modal (que es donde vive el flow
// de tagging).
//
// La imagen se guarda como object URL local (no backend). Vive solo en
// memoria del browser · si el user cierra la pestaña, la URL queda
// muerta pero la installation quedó persisted con esa URL. Compromise
// consciente para un prototype demo sin backend.

import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import type { CreateInstallationInput } from './useInstallations'

interface UploadInstallationModalProps {
    open: boolean
    onClose: () => void
    onCreate: (input: CreateInstallationInput) => void
}

const ROOM_TYPES = ['Focus Room', 'Work Cafe', 'Huddle Room', 'Meeting Room', 'Reception', 'Front Porch', 'Cafeteria', 'Other']

export default function UploadInstallationModal({ open, onClose, onCreate }: UploadInstallationModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [imageAspect, setImageAspect] = useState<number | undefined>(undefined)
    const [title, setTitle] = useState('')
    const [designFirm, setDesignFirm] = useState('')
    const [roomType, setRoomType] = useState('')
    const [rightsConfirmed, setRightsConfirmed] = useState(false)

    const resetAndClose = () => {
        setImageUrl(null)
        setImageAspect(undefined)
        setTitle('')
        setDesignFirm('')
        setRoomType('')
        setRightsConfirmed(false)
        onClose()
    }

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return
        const url = URL.createObjectURL(file)
        setImageUrl(url)
        const img = new Image()
        img.onload = () => setImageAspect(img.naturalWidth / img.naturalHeight)
        img.src = url
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const canSubmit = !!imageUrl && title.trim().length > 0 && rightsConfirmed

    const handleSubmit = () => {
        if (!canSubmit || !imageUrl) return
        onCreate({
            imageUrl,
            title,
            designFirm: designFirm.trim() || undefined,
            roomType: roomType || undefined,
            imageAspect,
            tags: [],
        })
        resetAndClose()
    }

    return (
        <Transition show={open} as={Fragment} appear>
            <Dialog onClose={resetAndClose} className="relative z-[75]">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            <header className="flex items-start justify-between gap-3 border-b border-border p-5">
                                <div>
                                    <Dialog.Title as="h2" className="text-lg font-bold text-foreground">Upload installation</Dialog.Title>
                                    <p className="mt-1 text-xs text-muted-foreground">Share an installation image and tag the products in it · other dealers on your team can browse.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetAndClose}
                                    aria-label="Close"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {/* Image drop / picker */}
                                {!imageUrl ? (
                                    {/* F57.3 · a11y fix · antes era un <div onClick> sin keyboard
                                        access · el input file estaba hidden y no había Enter/Space
                                        handler. Ahora role="button" + tabIndex=0 + onKeyDown
                                        + focus-visible ring · keyboard users pueden invocar el
                                        file picker con Enter/Space. */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Choose an image to upload · JPG, PNG or WebP"
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                fileInputRef.current?.click()
                                            }
                                        }}
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                        <p className="text-sm font-semibold text-foreground">Drop an image or click to select</p>
                                        <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP · saved locally to your browser</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            aria-hidden="true"
                                            tabIndex={-1}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                                        <img src={imageUrl} alt="Preview" className="max-h-64 w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageUrl(null); setImageAspect(undefined) }}
                                            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                            aria-label="Replace image"
                                            title="Replace image"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Title *</span>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Reception area · tech HQ"
                                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Design firm</span>
                                            <input
                                                type="text"
                                                value={designFirm}
                                                onChange={(e) => setDesignFirm(e.target.value)}
                                                placeholder="e.g. Gensler"
                                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Room type</span>
                                            <select
                                                value={roomType}
                                                onChange={(e) => setRoomType(e.target.value)}
                                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                            >
                                                <option value="">Select…</option>
                                                {ROOM_TYPES.map((rt) => (
                                                    <option key={rt} value={rt}>{rt}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                {/* Rights gating · stub del PRD */}
                                <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rightsConfirmed}
                                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                                        className="mt-0.5 accent-primary"
                                    />
                                    <span className="text-xs text-foreground leading-snug">
                                        I confirm I have rights to publish this image · if it belongs to a design firm, I have their permission to share it here.
                                    </span>
                                </label>
                            </div>

                            <footer className="flex items-center justify-end gap-2 border-t border-border p-4">
                                <button
                                    type="button"
                                    onClick={resetAndClose}
                                    className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Upload className="h-4 w-4" />
                                    Create installation
                                </button>
                            </footer>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}
