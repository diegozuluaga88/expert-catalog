// Fase 5 · CreateEditSpaceModal (2026-07-06)
// Wizard 2 pasos para crear/editar un Custom Space Setting.
//   Paso 1 · Basic info: parent SpaceType, code, name, description
//   Paso 2 · Product picker: search + filtros de brand + add items con qty
// Reusa Headless UI Dialog (mismo pattern que ProductDetailPanel) y los
// UNIFIED_PRODUCTS del showroom como fuente del picker.
//
// F58a.4 · Mode toggle · [Bundle from scratch] | [Upload photo & tag].
// El photo mode absorbe el ex-módulo Inspiration · Step 1 gana file drop
// + designFirm + rights gating; Step 2 muestra la imagen taggeable con
// hotspots (click en producto → click en imagen coloca tag) en vez del
// bundle picker tradicional.

import { Fragment, useMemo, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ChevronLeft, ChevronRight, Plus, Minus, Search, Check, Trash2, Sparkles, Upload, Image as ImageIcon, MapPin, Layers } from 'lucide-react'
import { SPACE_TYPES } from '../data/spaceTypes'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import { inferProductGroupCode } from '../data/productGroups'
import type { Product, SpaceType, SpaceTypeSetting } from '../types'
import type { CreateCustomSpaceInput } from './useCustomSpaces'
import { formatPrice } from '../data/catalogues'

type WizardMode = 'bundle' | 'photo'

interface DraftTag {
    productId: string
    xPct: number
    yPct: number
}

interface Props {
    open: boolean
    onClose: () => void
    /** Si se pasa, es modo edit · pre-populate el wizard. Si null, es create. */
    editing?: SpaceTypeSetting | null
    onSubmit: (input: CreateCustomSpaceInput) => void
}

interface DraftItem {
    productId: string
    productName: string
    productBrand?: string
    productImageUrl?: string
    productGroupCode: string
    qty: number
    estimatedPrice: number
}

function makeDraftFromProduct(product: Product): DraftItem {
    const inferred = inferProductGroupCode(product) ?? 'PROD'
    return {
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        productImageUrl: product.images?.[0],
        productGroupCode: inferred,
        qty: 1,
        estimatedPrice: product.price ?? 0,
    }
}

export default function CreateEditSpaceModal({ open, onClose, editing, onSubmit }: Props) {
    const isEditing = !!editing

    // Wizard state
    const [step, setStep] = useState<1 | 2>(1)
    const [mode, setMode] = useState<WizardMode>('bundle')
    const [spaceTypeId, setSpaceTypeId] = useState<string>(SPACE_TYPES[0].id)
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [notesText, setNotesText] = useState('') // separado con \n
    const [draftItems, setDraftItems] = useState<DraftItem[]>([])
    // Fase 5.1 · flags para saber si el user editó cada campo · si no lo hizo,
    // auto-repopulamos cuando cambia el parent SpaceType (better first-run UX).
    const [codeTouched, setCodeTouched] = useState(false)
    const [nameTouched, setNameTouched] = useState(false)
    const [descTouched, setDescTouched] = useState(false)
    const [notesTouched, setNotesTouched] = useState(false)

    // Picker state
    const [search, setSearch] = useState('')
    const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())

    // F58a.4 · Photo mode state
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
    const [designFirm, setDesignFirm] = useState('')
    const [rightsConfirmed, setRightsConfirmed] = useState(false)
    const [tags, setTags] = useState<DraftTag[]>([])
    /** Producto "armado" para colocar en el próximo click sobre la imagen.
     *  null cuando no hay ninguno seleccionado (los clicks no hacen nada). */
    const [pendingTagProductId, setPendingTagProductId] = useState<string | null>(null)

    // Fase 5.1 · defaults comunes usados en create mode
    const DEFAULT_NOTES = 'Rendering is for reference only\nProducts can be swapped at quote time'
    // Deriva un code sugerido desde el parent SpaceType (Focus Room → "F-CUSTOM")
    const codeForType = (type: SpaceType | undefined): string => {
        if (!type) return 'CUSTOM'
        // Primera letra de cada palabra en mayúscula + '-CUSTOM' · ej. "Focus Room" → "FR-CUSTOM"
        const initials = type.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase() || type.code.toUpperCase()
        return `${initials}-CUSTOM`
    }
    const nameForType = (type: SpaceType | undefined): string => {
        if (!type) return 'Custom setting'
        return `${type.name} · Custom`
    }
    const descriptionForType = (type: SpaceType | undefined): string => {
        if (!type) return ''
        return `Custom ${type.name.toLowerCase()} configuration curated by the dealer for this project.`
    }

    // Reset o pre-populate al abrir el modal
    useEffect(() => {
        if (!open) return
        if (editing) {
            setSpaceTypeId(editing.spaceTypeId)
            setCode(editing.code)
            setName(editing.name)
            setDescription(editing.description)
            setNotesText((editing.notes ?? []).join('\n'))
            setCodeTouched(true); setNameTouched(true); setDescTouched(true); setNotesTouched(true)
            // Hidratar drafts desde bundle.items · mapea a Products del showroom por itemId
            const drafts: DraftItem[] = editing.bundle.items.map(bi => {
                const product = UNIFIED_PRODUCTS.find(p => p.id === bi.itemId)
                if (product) {
                    return { ...makeDraftFromProduct(product), qty: bi.qty }
                }
                return {
                    productId: bi.itemId,
                    productName: bi.label ?? bi.productGroupCode,
                    productBrand: undefined,
                    productImageUrl: undefined,
                    productGroupCode: bi.productGroupCode,
                    qty: bi.qty,
                    estimatedPrice: 0,
                }
            })
            setDraftItems(drafts)
            // F58a.4 · si el setting es un photo upload previo, entrar en photo mode
            const editingIsPhoto = !!editing.isUserUpload || (!!editing.imageUrl && !!editing.bundle.imageOverlay?.length)
            setMode(editingIsPhoto ? 'photo' : 'bundle')
            setPhotoDataUrl(editingIsPhoto ? (editing.imageUrl ?? null) : null)
            setDesignFirm(editing.designFirm ?? '')
            setRightsConfirmed(editingIsPhoto)   // ya la había marcado en el upload original
            setTags(editing.bundle.imageOverlay?.map(o => ({
                productId: o.productId, xPct: o.xPct, yPct: o.yPct,
            })) ?? [])
        } else {
            // Fase 5.1 · Prefill sensato para nueva creación · el user solo confirma
            const firstType = SPACE_TYPES[0]
            setSpaceTypeId(firstType.id)
            setCode(codeForType(firstType))
            setName(nameForType(firstType))
            setDescription(descriptionForType(firstType))
            setNotesText(DEFAULT_NOTES)
            setDraftItems([])
            setCodeTouched(false); setNameTouched(false); setDescTouched(false); setNotesTouched(false)
            // F58a.4 · defaults del photo mode
            setMode('bundle')
            setPhotoDataUrl(null)
            setDesignFirm('')
            setRightsConfirmed(false)
            setTags([])
        }
        setPendingTagProductId(null)
        setStep(1)
        setSearch('')
        setSelectedBrands(new Set())
    }, [open, editing])

    // Fase 5.1 · re-populate campos NO tocados cuando cambia el parent SpaceType
    // (solo en create mode · en edit los campos están locked como touched).
    useEffect(() => {
        if (editing) return
        const type = SPACE_TYPES.find(t => t.id === spaceTypeId)
        if (!type) return
        if (!codeTouched) setCode(codeForType(type))
        if (!nameTouched) setName(nameForType(type))
        if (!descTouched) setDescription(descriptionForType(type))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spaceTypeId, editing])

    // Filtered product list para el picker
    const brands = useMemo(
        () => Array.from(new Set(UNIFIED_PRODUCTS.map(p => p.brand!).filter(Boolean))).sort(),
        [],
    )
    const filteredProducts = useMemo(() => {
        const q = search.trim().toLowerCase()
        return UNIFIED_PRODUCTS.filter(p => {
            if (p.isMaterial) return false
            if (selectedBrands.size > 0 && (!p.brand || !selectedBrands.has(p.brand))) return false
            if (!q) return true
            return (
                p.name.toLowerCase().includes(q)
                || (p.brand ?? '').toLowerCase().includes(q)
                || (p.category ?? '').toLowerCase().includes(q)
            )
        })
    }, [search, selectedBrands])

    const totalEstimate = draftItems.reduce((s, i) => s + i.estimatedPrice * i.qty, 0)
    const totalUnits = draftItems.reduce((s, i) => s + i.qty, 0)

    // F58a.4 · Validaciones por mode.
    const basicInfoOk = code.trim() !== '' && name.trim() !== ''
    const photoStep1Ok = basicInfoOk && !!photoDataUrl && rightsConfirmed
    const canProceedToStep2 = mode === 'bundle' ? basicInfoOk : photoStep1Ok
    const canSubmit = mode === 'bundle'
        ? (basicInfoOk && draftItems.length > 0)
        : (photoStep1Ok && tags.length > 0)

    const handleAdd = (product: Product) => {
        setDraftItems(prev => {
            const existing = prev.find(d => d.productId === product.id)
            if (existing) {
                return prev.map(d => d.productId === product.id ? { ...d, qty: d.qty + 1 } : d)
            }
            return [...prev, makeDraftFromProduct(product)]
        })
    }

    const handleQty = (productId: string, delta: number) => {
        setDraftItems(prev =>
            prev
                .map(d => d.productId === productId ? { ...d, qty: Math.max(1, d.qty + delta) } : d)
                .filter(d => d.qty > 0),
        )
    }

    const handleRemove = (productId: string) => {
        setDraftItems(prev => prev.filter(d => d.productId !== productId))
    }

    // F58a.4 · Photo-mode handlers.
    const handlePhotoFile = (file: File) => {
        if (!file.type.startsWith('image/')) return
        // Read to dataURL para que persista en localStorage al recargar
        // (objectURL muere al cerrar la pestaña). Los uploads son ≤ pocos MB.
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result
            if (typeof result === 'string') setPhotoDataUrl(result)
        }
        reader.readAsDataURL(file)
    }

    const handleClearPhoto = () => {
        setPhotoDataUrl(null)
        setTags([])            // sin foto no tiene sentido conservar tags
        setPendingTagProductId(null)
    }

    const handlePickTagProduct = (productId: string) => {
        // Toggle · si ya está armado se desarma
        setPendingTagProductId(prev => prev === productId ? null : productId)
    }

    const handlePlaceTag = (xPct: number, yPct: number) => {
        if (!pendingTagProductId) return
        setTags(prev => [...prev, { productId: pendingTagProductId, xPct, yPct }])
        setPendingTagProductId(null)
    }

    const handleRemoveTag = (index: number) => {
        setTags(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        const notes = notesText.split('\n').map(l => l.trim()).filter(Boolean)
        if (mode === 'photo') {
            // Cada tag genera un item qty=1 en el bundle (sin estimated price)
            // + una entrada en imageOverlay con las coords.
            const photoItems = tags.map((t, i) => {
                const product = UNIFIED_PRODUCTS.find(p => p.id === t.productId)
                const inferred = product ? (inferProductGroupCode(product) ?? 'PROD') : 'PROD'
                return {
                    productGroupCode: inferred,
                    itemId: t.productId,
                    qty: 1,
                    label: String(i + 1),
                    productName: product?.name,
                    productBrand: product?.brand,
                    productImageUrl: product?.images?.[0],
                    // estimatedPrice omitido a propósito · uploads no tienen bundle cost
                }
            })
            onSubmit({
                code: code.trim(),
                name: name.trim(),
                spaceTypeId,
                description: description.trim(),
                notes: notes.length > 0 ? notes : undefined,
                items: photoItems,
                imageUrl: photoDataUrl ?? undefined,
                designFirm: designFirm.trim() || undefined,
                imageOverlay: tags.map(t => ({
                    productId: t.productId,
                    xPct: t.xPct,
                    yPct: t.yPct,
                })),
            })
            return
        }
        onSubmit({
            code: code.trim(),
            name: name.trim(),
            spaceTypeId,
            description: description.trim(),
            notes: notes.length > 0 ? notes : undefined,
            items: draftItems.map(d => ({
                productGroupCode: d.productGroupCode,
                itemId: d.productId,
                qty: d.qty,
                productName: d.productName,
                productBrand: d.productBrand,
                productImageUrl: d.productImageUrl,
                estimatedPrice: d.estimatedPrice,
            })),
        })
    }

    const parentType = SPACE_TYPES.find(t => t.id === spaceTypeId)

    const step2Label = mode === 'bundle' ? 'Product picker' : 'Tag products on photo'

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-3">
                    <Transition.Child as={Fragment}
                        enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="relative flex h-[94vh] w-[96vw] max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-primary/15 p-2">
                                        <Sparkles className="h-4 w-4 text-foreground" />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-sm font-bold text-foreground">
                                            {isEditing ? 'Edit custom space' : 'Create custom space'}
                                        </Dialog.Title>
                                        <p className="text-[11px] text-muted-foreground">
                                            Step {step} of 2 · {step === 1 ? 'Basic info' : step2Label}
                                        </p>
                                    </div>
                                </div>
                                <button type="button" onClick={onClose}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Step indicator bar */}
                            <div className="flex border-b border-border bg-muted/30">
                                <div className={`flex-1 h-1 ${step >= 1 ? 'bg-primary' : 'bg-transparent'}`} />
                                <div className={`flex-1 h-1 ${step >= 2 ? 'bg-primary' : 'bg-transparent'}`} />
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto">
                                {step === 1 ? (
                                    <BasicInfoStep
                                        mode={mode}
                                        setMode={setMode}
                                        isEditing={isEditing}
                                        spaceTypeId={spaceTypeId}
                                        setSpaceTypeId={setSpaceTypeId}
                                        code={code}
                                        setCode={(v) => { setCode(v); setCodeTouched(true) }}
                                        name={name}
                                        setName={(v) => { setName(v); setNameTouched(true) }}
                                        description={description}
                                        setDescription={(v) => { setDescription(v); setDescTouched(true) }}
                                        notesText={notesText}
                                        setNotesText={(v) => { setNotesText(v); setNotesTouched(true) }}
                                        parentType={parentType}
                                        photoDataUrl={photoDataUrl}
                                        onPhotoFile={handlePhotoFile}
                                        onClearPhoto={handleClearPhoto}
                                        designFirm={designFirm}
                                        setDesignFirm={setDesignFirm}
                                        rightsConfirmed={rightsConfirmed}
                                        setRightsConfirmed={setRightsConfirmed}
                                    />
                                ) : mode === 'bundle' ? (
                                    <ProductPickerStep
                                        search={search}
                                        setSearch={setSearch}
                                        brands={brands}
                                        selectedBrands={selectedBrands}
                                        setSelectedBrands={setSelectedBrands}
                                        products={filteredProducts}
                                        draftItems={draftItems}
                                        onAdd={handleAdd}
                                        onQty={handleQty}
                                        onRemove={handleRemove}
                                    />
                                ) : (
                                    <PhotoTaggerStep
                                        photoUrl={photoDataUrl!}
                                        tags={tags}
                                        pendingTagProductId={pendingTagProductId}
                                        onPickTagProduct={handlePickTagProduct}
                                        onPlaceTag={handlePlaceTag}
                                        onRemoveTag={handleRemoveTag}
                                        search={search}
                                        setSearch={setSearch}
                                        brands={brands}
                                        selectedBrands={selectedBrands}
                                        setSelectedBrands={setSelectedBrands}
                                        products={filteredProducts}
                                    />
                                )}
                            </div>

                            {/* Footer · nav + submit */}
                            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                                <div className="text-[11px] text-muted-foreground">
                                    {step === 2 && mode === 'bundle' && (
                                        <span>
                                            <span className="font-bold text-foreground">{draftItems.length}</span> items ·{' '}
                                            <span className="font-bold text-foreground">{totalUnits}</span> units ·{' '}
                                            <span className="font-bold text-foreground">{formatPrice(totalEstimate)}</span> estimated
                                        </span>
                                    )}
                                    {step === 2 && mode === 'photo' && (
                                        <span>
                                            <span className="font-bold text-foreground">{tags.length}</span> {tags.length === 1 ? 'product tagged' : 'products tagged'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {step === 2 && (
                                        <button type="button" onClick={() => setStep(1)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            Back
                                        </button>
                                    )}
                                    {step === 1 ? (
                                        <button type="button" onClick={() => setStep(2)} disabled={!canProceedToStep2}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            Next · {step2Label}
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Check className="h-3.5 w-3.5" />
                                            {isEditing ? 'Save changes' : (mode === 'photo' ? 'Create installation' : 'Create space')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

function BasicInfoStep(props: {
    mode: WizardMode
    setMode: (m: WizardMode) => void
    isEditing: boolean
    spaceTypeId: string
    setSpaceTypeId: (id: string) => void
    code: string
    setCode: (s: string) => void
    name: string
    setName: (s: string) => void
    description: string
    setDescription: (s: string) => void
    notesText: string
    setNotesText: (s: string) => void
    parentType?: SpaceType
    photoDataUrl: string | null
    onPhotoFile: (f: File) => void
    onClearPhoto: () => void
    designFirm: string
    setDesignFirm: (s: string) => void
    rightsConfirmed: boolean
    setRightsConfirmed: (b: boolean) => void
}) {
    const {
        mode, setMode, isEditing,
        spaceTypeId, setSpaceTypeId, code, setCode, name, setName,
        description, setDescription, notesText, setNotesText, parentType,
        photoDataUrl, onPhotoFile, onClearPhoto, designFirm, setDesignFirm,
        rightsConfirmed, setRightsConfirmed,
    } = props
    return (
        <div className="p-5 space-y-5">
            {/* F58a.4 · Mode toggle · Bundle from scratch | Upload photo & tag.
                En edit mode, el toggle queda locked (cambiar de mode borraría
                el trabajo previo · destructive). */}
            <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">
                    Setting type
                </label>
                <div
                    role="tablist"
                    aria-label="Setting type"
                    className={`inline-flex rounded-lg border border-border bg-muted/40 p-0.5 ${isEditing ? 'opacity-70' : ''}`}
                >
                    {(['bundle', 'photo'] as const).map(m => {
                        const active = mode === m
                        const label = m === 'bundle' ? 'Bundle from scratch' : 'Upload photo & tag'
                        const Icon = m === 'bundle' ? Layers : ImageIcon
                        return (
                            <button
                                key={m}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => { if (!isEditing) setMode(m) }}
                                disabled={isEditing}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} disabled:cursor-not-allowed`}
                                title={isEditing ? 'Mode cannot change while editing' : undefined}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        )
                    })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                    {mode === 'bundle'
                        ? 'Curate a product bundle from your connected catalogs · estimated cost range shown to your team.'
                        : 'Upload a photo of a real installation and tag the products in it · design firm attribution optional.'}
                </p>
            </div>

            {/* F58a.4 · Photo section · solo en photo mode. Dropzone + designFirm + rights. */}
            {mode === 'photo' && (
                <PhotoUploadSection
                    photoDataUrl={photoDataUrl}
                    onPhotoFile={onPhotoFile}
                    onClearPhoto={onClearPhoto}
                    designFirm={designFirm}
                    setDesignFirm={setDesignFirm}
                    rightsConfirmed={rightsConfirmed}
                    setRightsConfirmed={setRightsConfirmed}
                />
            )}

            {/* Parent SpaceType picker · grid 4-col responsive con thumbnail + icon */}
            <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">
                    Parent space type <span className="text-destructive">*</span>
                    <span className="ml-1 font-normal normal-case text-muted-foreground">({SPACE_TYPES.length} options)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {SPACE_TYPES.map(t => {
                        const active = t.id === spaceTypeId
                        return (
                            <button key={t.id} type="button" onClick={() => setSpaceTypeId(t.id)}
                                className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${active ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/50'}`}>
                                <div className="relative aspect-video bg-muted overflow-hidden">
                                    <img src={t.imageUrl} alt={t.name} loading="lazy"
                                        className={`absolute inset-0 h-full w-full object-cover transition-all ${active ? 'brightness-90' : 'group-hover:brightness-95'}`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                    <span className="absolute bottom-1 left-1.5 text-lg drop-shadow-md" aria-hidden="true">{t.icon}</span>
                                    {active && (
                                        <div className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="px-2 py-1.5 bg-card">
                                    <div className="text-[11px] font-semibold text-foreground truncate">{t.name}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
                {parentType && (
                    <p className="text-[11px] text-muted-foreground mt-2 italic">{parentType.description}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                        Setting code <span className="text-destructive">*</span>
                    </label>
                    <input value={code} onChange={e => setCode(e.target.value)}
                        placeholder="F1-custom, WC-lux, R-boardroom"
                        maxLength={20}
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Short code shown as badge in the card (max 20 chars).</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                        Name <span className="text-destructive">*</span>
                    </label>
                    <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="Focus Room · Private Executive"
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                    Description
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Short description of the setting purpose and target user."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
            </div>

            <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                    Notes (optional · one per line)
                </label>
                <textarea value={notesText} onChange={e => setNotesText(e.target.value)}
                    rows={2}
                    placeholder={'Rendering is for reference only\nProducts can be swapped at quote time'}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
            </div>
        </div>
    )
}

function ProductPickerStep(props: {
    search: string
    setSearch: (s: string) => void
    brands: string[]
    selectedBrands: Set<string>
    setSelectedBrands: React.Dispatch<React.SetStateAction<Set<string>>>
    products: Product[]
    draftItems: DraftItem[]
    onAdd: (product: Product) => void
    onQty: (productId: string, delta: number) => void
    onRemove: (productId: string) => void
}) {
    const { search, setSearch, brands, selectedBrands, setSelectedBrands, products, draftItems, onAdd, onQty, onRemove } = props
    const toggleBrand = (b: string) => {
        setSelectedBrands(prev => {
            const next = new Set(prev)
            next.has(b) ? next.delete(b) : next.add(b)
            return next
        })
    }
    const selectedIds = new Set(draftItems.map(d => d.productId))

    return (
        <div className="grid grid-cols-[2fr_1fr] gap-0 h-full">
            {/* Left · product catalog */}
            <div className="border-r border-border p-4 overflow-y-auto">
                <div className="sticky top-0 bg-card pb-3 space-y-2 z-10">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, brand, category…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {brands.map(b => {
                            const active = selectedBrands.has(b)
                            return (
                                <button key={b} type="button" onClick={() => toggleBrand(b)}
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors ${active ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}>
                                    {b}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {products.slice(0, 40).map(p => {
                        const selected = selectedIds.has(p.id)
                        return (
                            <button key={p.id} type="button" onClick={() => onAdd(p)}
                                className={`text-left rounded-lg border overflow-hidden transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}>
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    <img src={p.images?.[0]} alt={p.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                                    {selected && (
                                        <div className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-2">
                                    <div className="text-[10px] text-muted-foreground truncate">{p.brand}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                                    <div className="text-[11px] font-bold text-foreground mt-0.5">{formatPrice(p.price, p.currencyId)}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
                {products.length > 40 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                        Showing 40 of {products.length}. Refine search to see more.
                    </p>
                )}
                {products.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground mt-4">
                        No products match your search.
                    </div>
                )}
            </div>

            {/* Right · selected items */}
            <div className="p-4 overflow-y-auto">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Bundle items ({draftItems.length})
                </h3>
                {draftItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                        Click a product to add it to the bundle.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {draftItems.map((d, idx) => (
                            <li key={d.productId} className="rounded-lg border border-border bg-card p-2 space-y-1.5">
                                <div className="flex items-start gap-2">
                                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] text-muted-foreground truncate">{d.productBrand}</div>
                                        <div className="text-xs font-semibold text-foreground truncate">{d.productName}</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {formatPrice(d.estimatedPrice * d.qty)}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => onRemove(d.productId)}
                                        className="text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                    <button type="button" onClick={() => onQty(d.productId, -1)} disabled={d.qty <= 1}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-xs font-semibold text-foreground tabular-nums w-6 text-center">{d.qty}</span>
                                    <button type="button" onClick={() => onQty(d.productId, 1)}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

// F58a.4 · Sub-sección del BasicInfoStep visible solo en photo mode.
// Dropzone (con a11y keyboard-accesible del F57.3) + designFirm input +
// rights checkbox (stub del gap real de content de design firms).
function PhotoUploadSection(props: {
    photoDataUrl: string | null
    onPhotoFile: (f: File) => void
    onClearPhoto: () => void
    designFirm: string
    setDesignFirm: (s: string) => void
    rightsConfirmed: boolean
    setRightsConfirmed: (b: boolean) => void
}) {
    const {
        photoDataUrl, onPhotoFile, onClearPhoto,
        designFirm, setDesignFirm, rightsConfirmed, setRightsConfirmed,
    } = props
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) onPhotoFile(file)
        // reset para que reseleccionar el mismo file dispare el change
        e.target.value = ''
    }
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onPhotoFile(file)
    }
    const openPicker = () => fileInputRef.current?.click()

    return (
        <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block">
                Installation photo <span className="text-destructive">*</span>
            </label>
            {!photoDataUrl ? (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Drop an image or click to select"
                    onClick={openPicker}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openPicker()
                        }
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary hover:bg-primary/5'}`}
                >
                    <ImageIcon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Drop an image or click to select</p>
                    <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP · stored locally in your browser</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                    <img src={photoDataUrl} alt="Installation preview" className="max-h-56 w-full object-cover" />
                    <button
                        type="button"
                        onClick={onClearPhoto}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        aria-label="Replace image"
                        title="Replace image"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                    Design firm (optional)
                </label>
                <input
                    type="text"
                    value={designFirm}
                    onChange={(e) => setDesignFirm(e.target.value)}
                    placeholder="e.g. Gensler, Perkins&Will, HOK"
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                    Attribution shown on the setting card. Leave blank for internal installations.
                </p>
            </div>

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
    )
}

// F58a.4 · Step 2 en photo mode · absorbe UI del ex InstallationDetailModal.
// Split screen · imagen full en la izquierda con hotspots numerados + panel
// producto en la derecha. Flow · click producto → arma pending → click imagen
// coloca tag. Click en tag existente lo remueve.
function PhotoTaggerStep(props: {
    photoUrl: string
    tags: DraftTag[]
    pendingTagProductId: string | null
    onPickTagProduct: (productId: string) => void
    onPlaceTag: (xPct: number, yPct: number) => void
    onRemoveTag: (index: number) => void
    search: string
    setSearch: (s: string) => void
    brands: string[]
    selectedBrands: Set<string>
    setSelectedBrands: React.Dispatch<React.SetStateAction<Set<string>>>
    products: Product[]
}) {
    const {
        photoUrl, tags, pendingTagProductId,
        onPickTagProduct, onPlaceTag, onRemoveTag,
        search, setSearch, brands, selectedBrands, setSelectedBrands, products,
    } = props
    const toggleBrand = (b: string) => {
        setSelectedBrands(prev => {
            const next = new Set(prev)
            next.has(b) ? next.delete(b) : next.add(b)
            return next
        })
    }
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!pendingTagProductId) return
        const rect = e.currentTarget.getBoundingClientRect()
        const xPct = ((e.clientX - rect.left) / rect.width) * 100
        const yPct = ((e.clientY - rect.top) / rect.height) * 100
        onPlaceTag(xPct, yPct)
    }
    const pendingProduct = pendingTagProductId
        ? UNIFIED_PRODUCTS.find(p => p.id === pendingTagProductId) ?? null
        : null

    return (
        <div className="grid grid-cols-[2fr_1fr] gap-0 h-full">
            {/* Left · imagen + hotspots + picker de producto pendiente */}
            <div className="flex flex-col border-r border-border overflow-hidden bg-muted">
                <div
                    className={`relative flex-1 min-h-[280px] ${pendingTagProductId ? 'cursor-crosshair' : ''}`}
                    onClick={handleImageClick}
                >
                    <img
                        src={photoUrl}
                        alt="Installation being tagged"
                        className="absolute inset-0 h-full w-full object-contain"
                        draggable={false}
                    />
                    {tags.map((t, i) => {
                        const product = UNIFIED_PRODUCTS.find(p => p.id === t.productId)
                        const label = product?.name ?? 'Product'
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRemoveTag(i)
                                }}
                                aria-label={`Remove tag ${i + 1} · ${label}`}
                                title={`${label} · click to remove`}
                                className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-foreground shadow-lg ring-2 ring-primary transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4"
                                style={{ left: `${t.xPct}%`, top: `${t.yPct}%` }}
                            >
                                {i + 1}
                            </button>
                        )
                    })}
                    {pendingTagProductId && (
                        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            Click on the photo to place the tag
                        </div>
                    )}
                </div>
                {/* Pending product bar · confirma qué producto se está colocando */}
                {pendingProduct && (
                    <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Placing:</span>
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                            {pendingProduct.images?.[0] && (
                                <img src={pendingProduct.images[0]} alt="" className="h-8 w-10 flex-shrink-0 rounded object-cover" />
                            )}
                            <div className="min-w-0">
                                <div className="text-[10px] text-muted-foreground truncate">{pendingProduct.brand}</div>
                                <div className="text-xs font-semibold text-foreground truncate">{pendingProduct.name}</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onPickTagProduct(pendingProduct.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-3 w-3" /> Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Right · product picker */}
            <div className="flex flex-col overflow-hidden">
                <div className="border-b border-border p-3 space-y-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search product to tag…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {brands.slice(0, 8).map(b => {
                            const active = selectedBrands.has(b)
                            return (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => toggleBrand(b)}
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors ${active ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                                >
                                    {b}
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {products.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-[11px] text-muted-foreground">
                            No products match your search.
                        </div>
                    )}
                    {products.slice(0, 30).map(p => {
                        const isPending = pendingTagProductId === p.id
                        const tagCount = tags.filter(t => t.productId === p.id).length
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onPickTagProduct(p.id)}
                                className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition-colors ${isPending ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}
                                aria-pressed={isPending}
                            >
                                {p.images?.[0] && (
                                    <img src={p.images[0]} alt="" className="h-9 w-12 flex-shrink-0 rounded object-cover" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] text-muted-foreground truncate">{p.brand}</div>
                                    <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                                </div>
                                {tagCount > 0 && (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                        {tagCount}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                    {products.length > 30 && (
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                            Showing 30 of {products.length}. Refine search to see more.
                        </p>
                    )}
                </div>
                {tags.length > 0 && (
                    <div className="border-t border-border bg-muted/20 p-2 text-[10px] text-muted-foreground text-center">
                        Click any numbered pin on the photo to remove that tag.
                    </div>
                )}
            </div>
        </div>
    )
}
