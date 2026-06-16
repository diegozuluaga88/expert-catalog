import { useState } from 'react'
import {
    ArrowRightIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline'
import { type AckFormData } from './AckImportFlow'

interface AckCreationFormProps {
    initialData?: Partial<AckFormData>
    onSubmit: (data: AckFormData) => void
    onCancel: () => void
}

const emptyItem = { id: '', description: '', qty: 1, unitPrice: 0, total: 0, status: 'Confirmed' }

export default function AckCreationForm({ initialData, onSubmit, onCancel }: AckCreationFormProps) {
    const [formData, setFormData] = useState<AckFormData>({
        ackNumber: initialData?.ackNumber || '',
        ackDate: initialData?.ackDate || new Date().toISOString().split('T')[0],
        poNumber: initialData?.poNumber || '',
        orderNumber: initialData?.orderNumber || '',
        shipDate: initialData?.shipDate || '',
        vendorName: initialData?.vendorName || '',
        vendorAddress: initialData?.vendorAddress || '',
        billToName: initialData?.billToName || 'Strata Workplace Solutions',
        billToAddress: initialData?.billToAddress || '',
        shipTo: initialData?.shipTo || '',
        shipVia: initialData?.shipVia || '',
        freightTerms: initialData?.freightTerms || '',
        salesRep: initialData?.salesRep || '',
        salesEmail: initialData?.salesEmail || '',
        notes: initialData?.notes || '',
        items: initialData?.items || [{ ...emptyItem, id: 'item-1' }],
    })

    const [submitted, setSubmitted] = useState(false)

    const updateField = (field: keyof AckFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateItem = (index: number, field: string, value: string | number) => {
        setFormData(prev => {
            const items = [...prev.items]
            items[index] = { ...items[index], [field]: value }
            if (field === 'qty' || field === 'unitPrice') {
                items[index].total = Number(items[index].qty) * Number(items[index].unitPrice)
            }
            return { ...prev, items }
        })
    }

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...emptyItem, id: `item-${prev.items.length + 1}` }]
        }))
    }

    const removeItem = (index: number) => {
        if (formData.items.length <= 1) return
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = () => {
        setSubmitted(true)
        setTimeout(() => {
            onSubmit(formData)
        }, 1500)
    }

    const total = formData.items.reduce((s, i) => s + i.total, 0)

    if (submitted) {
        return (
            <div className="h-[90vh] flex flex-col items-center justify-center bg-muted/30 animate-in fade-in duration-500">
                <div className="p-6 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                    <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Acknowledgement Created</h3>
                <p className="text-muted-foreground mb-1">{formData.ackNumber || 'ACK-NEW'} for PO {formData.poNumber || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{formData.items.length} items · ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
        )
    }

    const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
    const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block"

    return (
        <div className="h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-5 border-b border-border bg-background flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
                        <ArrowRightIcon className="w-5 h-5 rotate-180 text-muted-foreground" />
                    </button>
                    <div>
                        <h2 className="text-xl font-brand font-bold text-foreground">Manual Acknowledgement Entry</h2>
                        <p className="text-sm text-muted-foreground">Enter acknowledgement details line by line.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit}
                        className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                        Create Acknowledgement
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-muted/30">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* ACK Info + Reference */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-sm font-bold text-foreground mb-4">Acknowledgement Information</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>ACK Number *</label>
                                <input className={inputClass} placeholder="ACK-XXXX" value={formData.ackNumber} onChange={e => updateField('ackNumber', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>ACK Date *</label>
                                <input className={inputClass} type="date" value={formData.ackDate} onChange={e => updateField('ackDate', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>Acknowledged Ship Date</label>
                                <input className={inputClass} type="date" value={formData.shipDate} onChange={e => updateField('shipDate', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>Reference PO *</label>
                                <input className={inputClass} placeholder="ORD-XXXX" value={formData.poNumber} onChange={e => updateField('poNumber', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>Sales Order #</label>
                                <input className={inputClass} placeholder="SO XXXXXXX" value={formData.orderNumber} onChange={e => updateField('orderNumber', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Vendor + Shipping */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-card rounded-xl border border-border p-6">
                            <h3 className="text-sm font-bold text-foreground mb-4">Vendor</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>Vendor Name *</label>
                                    <input className={inputClass} placeholder="Vendor company name" value={formData.vendorName} onChange={e => updateField('vendorName', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Vendor Address</label>
                                    <input className={inputClass} placeholder="Full address" value={formData.vendorAddress} onChange={e => updateField('vendorAddress', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Sales Rep</label>
                                        <input className={inputClass} placeholder="Name" value={formData.salesRep} onChange={e => updateField('salesRep', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input className={inputClass} placeholder="rep@vendor.com" value={formData.salesEmail} onChange={e => updateField('salesEmail', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border p-6">
                            <h3 className="text-sm font-bold text-foreground mb-4">Shipping & Billing</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClass}>Ship To *</label>
                                    <input className={inputClass} placeholder="Delivery address" value={formData.shipTo} onChange={e => updateField('shipTo', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Bill To</label>
                                    <input className={inputClass} placeholder="Billing address" value={formData.billToAddress} onChange={e => updateField('billToAddress', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Ship Via</label>
                                        <input className={inputClass} placeholder="Carrier" value={formData.shipVia} onChange={e => updateField('shipVia', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Freight Terms</label>
                                        <input className={inputClass} placeholder="e.g. Prepaid" value={formData.freightTerms} onChange={e => updateField('freightTerms', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">Line Items</h3>
                            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                                <PlusIcon className="w-4 h-4" /> Add Item
                            </button>
                        </div>
                        <div className="bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex border-b border-border">
                            <div className="flex-1">Description</div>
                            <div className="w-20 text-center">Qty</div>
                            <div className="w-28 text-right">Unit Price</div>
                            <div className="w-28 text-right">Total</div>
                            <div className="w-10"></div>
                        </div>
                        <div className="divide-y divide-border">
                            {formData.items.map((item, i) => (
                                <div key={i} className="px-4 py-3 flex items-center gap-2">
                                    <input className="flex-1 px-2 py-1.5 text-sm rounded border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Product description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                                    <input className="w-20 px-2 py-1.5 text-sm text-center rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} />
                                    <input className="w-28 px-2 py-1.5 text-sm text-right rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        type="number" step="0.01" min="0" placeholder="0.00" value={item.unitPrice || ''} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} />
                                    <div className="w-28 text-right text-sm font-medium text-foreground pr-1">
                                        ${item.total.toFixed(2)}
                                    </div>
                                    <button onClick={() => removeItem(i)} className="w-10 flex justify-center text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end">
                            <div className="text-sm">
                                <span className="text-muted-foreground mr-3">Total:</span>
                                <span className="font-bold text-foreground text-base">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-sm font-bold text-foreground mb-3">Notes</h3>
                        <textarea className={inputClass + " min-h-[80px] resize-none"} placeholder="Additional notes or comments..."
                            value={formData.notes} onChange={e => updateField('notes', e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    )
}
