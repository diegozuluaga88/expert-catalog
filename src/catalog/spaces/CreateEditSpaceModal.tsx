// Fase 5 · CreateEditSpaceModal (2026-07-06)
// Wizard 2 pasos para crear/editar un Custom Space Setting.
//   Paso 1 · Basic info: parent SpaceType, code, name, description
//   Paso 2 · Product picker: search + filtros de brand + add items con qty
// Reusa Headless UI Dialog (mismo pattern que ProductDetailPanel) y los
// UNIFIED_PRODUCTS del showroom como fuente del picker.

import { Fragment, useMemo, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ChevronLeft, ChevronRight, Plus, Minus, Search, Check, Trash2, Sparkles } from 'lucide-react'
import { SPACE_TYPES } from '../data/spaceTypes'
import { UNIFIED_PRODUCTS } from '../showroom/data/unifiedProducts'
import { inferProductGroupCode } from '../data/productGroups'
import type { Product, SpaceType, SpaceTypeSetting } from '../types'
import type { CreateCustomSpaceInput } from './useCustomSpaces'

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
        }
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

    const canProceedToStep2 = code.trim() !== '' && name.trim() !== ''
    const canSubmit = canProceedToStep2 && draftItems.length > 0

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

    const handleSubmit = () => {
        const notes = notesText.split('\n').map(l => l.trim()).filter(Boolean)
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
                                            Step {step} of 2 · {step === 1 ? 'Basic info' : 'Product picker'}
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
                                    />
                                ) : (
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
                                )}
                            </div>

                            {/* Footer · nav + submit */}
                            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                                <div className="text-[11px] text-muted-foreground">
                                    {step === 2 && (
                                        <span>
                                            <span className="font-bold text-foreground">{draftItems.length}</span> items ·{' '}
                                            <span className="font-bold text-foreground">{totalUnits}</span> units ·{' '}
                                            <span className="font-bold text-foreground">${totalEstimate.toLocaleString()}</span> estimated
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
                                            Next · Product picker
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Check className="h-3.5 w-3.5" />
                                            {isEditing ? 'Save changes' : 'Create space'}
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
}) {
    const { spaceTypeId, setSpaceTypeId, code, setCode, name, setName, description, setDescription, notesText, setNotesText, parentType } = props
    return (
        <div className="p-5 space-y-5">
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
                                    <div className="text-[11px] font-bold text-foreground mt-0.5">${(p.price ?? 0).toLocaleString()}</div>
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
                                            ${(d.estimatedPrice * d.qty).toLocaleString()}
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
