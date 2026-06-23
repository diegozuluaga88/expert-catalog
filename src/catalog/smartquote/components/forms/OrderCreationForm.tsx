import { useState, useEffect } from 'react'
import {
    CalendarIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    TruckIcon
} from '@heroicons/react/24/outline'
import Select from '../Select'
import { clsx } from 'clsx'

interface LineItem {
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface OrderFormData {
    customerId: string;
    poNumber: string;
    projectRef: string;
    shippingAddress: string;
    billingAddress: string;
    requestedDate: string;
    items: LineItem[];
    notes: string;
}

interface OrderCreationFormProps {
    initialData?: Partial<OrderFormData>;
    onSubmit: (data: OrderFormData) => void;
    onCancel: () => void;
    isTemplate?: boolean;
}

const MOCK_CUSTOMERS = [
    { id: 'CUST-001', name: 'City Builders Inc.' },
    { id: 'CUST-002', name: 'Metro Construction' },
    { id: 'CUST-003', name: 'Riverside Developers' },
    { id: 'CUST-004', name: 'Apex Architecture' },
];

export default function OrderCreationForm({ initialData, onSubmit, onCancel, isTemplate }: OrderCreationFormProps) {
    const [formData, setFormData] = useState<OrderFormData>({
        customerId: '',
        poNumber: '',
        projectRef: '',
        shippingAddress: '',
        billingAddress: '',
        requestedDate: '',
        items: [],
        notes: '',
        ...initialData
    });

    // Update form data when initialData changes (e.g. template selection)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleAddItem = () => {
        const newItem: LineItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            qty: 1,
            unitPrice: 0,
            total: 0
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
    };

    const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id !== id) return item;
                const updates = { [field]: value };
                if (field === 'qty' || field === 'unitPrice') {
                    const qty = field === 'qty' ? Number(value) : item.qty;
                    const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
                    updates.total = qty * price;
                }
                return { ...item, ...updates };
            })
        }));
    };

    const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 0.0825; // Example tax rate
    const subtotal = calculateSubtotal();
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return (
        <div className="flex flex-col h-full bg-muted/10">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-background flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div>
                    <h2 className="text-2xl font-brand font-bold text-foreground">
                        {isTemplate ? 'New Order from Template' : 'New Order'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Fill in the details below to create a new order.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(formData)}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                    >
                        Create Order
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Customer & Project Info */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <UserIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Customer</label>
                                <select
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                                >
                                    <option value="">Select a customer...</option>
                                    {MOCK_CUSTOMERS.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">PO Number</label>
                                <div className="relative">
                                    <DocumentTextIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="e.g. PO-2024-001"
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={formData.poNumber}
                                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-foreground">Project Reference</label>
                                <div className="relative">
                                    <BuildingOfficeIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Project Name or ID"
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={formData.projectRef}
                                        onChange={(e) => setFormData({ ...formData, projectRef: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Logistics */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <TruckIcon className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-semibold text-foreground">Logistics & Delivery</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Requested Delivery Date</label>
                                <div className="relative">
                                    <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="date"
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={formData.requestedDate}
                                        onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Shipping Address</label>
                                <div className="relative">
                                    <MapPinIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                    <textarea
                                        rows={2}
                                        placeholder="Enter full shipping address"
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                                        value={formData.shippingAddress}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Line Items */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Line Items</h3>
                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg w-[40%]">Description</th>
                                        <th className="px-4 py-3 w-[15%] text-center">Qty</th>
                                        <th className="px-4 py-3 w-[20%] text-right">Unit Price</th>
                                        <th className="px-4 py-3 w-[20%] text-right">Total</th>
                                        <th className="px-4 py-3 rounded-r-lg w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {formData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                                                No items added yet. Click "Add Item" to start.
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.items.map((item) => (
                                            <tr key={item.id} className="group hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Item Name / SKU"
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-foreground placeholder:text-muted-foreground/50 font-medium"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-center text-foreground focus:ring-1 focus:ring-primary"
                                                        value={item.qty}
                                                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="relative">
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded pl-4 pr-2 py-1 text-right text-foreground focus:ring-1 focus:ring-primary"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-foreground">
                                                    ${item.total.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title="Remove Item"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Summary */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-full md:w-1/3 bg-muted/50 rounded-lg p-6 space-y-3">
                                <div className="flex justify-between text-sm text-foreground">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-foreground">
                                    <span>Tax (8.25%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Internal Notes</label>
                        <textarea
                            rows={3}
                            placeholder="Add any internal notes regarding this order..."
                            className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}
