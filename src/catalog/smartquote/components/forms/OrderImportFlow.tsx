import { useState, useEffect } from 'react'
import {
    CloudArrowUpIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { type OrderFormData } from './OrderCreationForm'

interface OrderImportFlowProps {
    onImportComplete: (data: OrderFormData) => void;
    onCancel: () => void;
}

// Mock Data for Extracted Items
const MOCK_EXTRACTED_DATA: OrderFormData = {
    customerId: 'CUST-002', // Auto-detected from file
    poNumber: 'PO-IMPORT-8821',
    projectRef: 'Q1 Renovations',
    shippingAddress: '123 Warehouse Dr, Industrial Park, NY 10001',
    billingAddress: '500 Corporate Way, Suite 200, NY 10001',
    requestedDate: '2024-03-15',
    notes: 'Imported from "Order_Request_Q1.pdf"',
    items: [
        { id: 'imp-1', description: 'Executive Task Chair', qty: 15, unitPrice: 895.00, total: 13425.00 },
        { id: 'imp-2', description: 'Conf Chair (Leather)', qty: 4, unitPrice: 850.00, total: 3400.00 },
        { id: 'imp-3', description: 'Standing Desk Unit', qty: 10, unitPrice: 1200.00, total: 12000.00 },
    ]
}

export default function OrderImportFlow({ onImportComplete, onCancel }: OrderImportFlowProps) {
    const [status, setStatus] = useState<'upload' | 'processing' | 'review'>('upload');
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    // Simulate Processing
    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus('review');
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [status]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setStatus('processing');
        }
    };

    const handleFileSelect = () => {
        // Mock file selection
        setStatus('processing');
    };

    return (
        <div className="h-[600px] flex flex-col bg-muted/30">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border bg-background flex items-center gap-4">
                <button
                    onClick={onCancel}
                    className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
                >
                    <ArrowPathIcon className="w-5 h-5 text-muted-foreground rotate-90" /> {/* Simulating 'Back' icon logic */}
                </button>
                <div>
                    <h2 className="text-xl font-brand font-bold text-foreground">
                        Import Order from File
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Upload a PDF, CSV, or Excel file to auto-generate your order.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">

                {/* 1. Upload State */}
                {status === 'upload' && (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div
                            className={clsx(
                                "w-full max-w-xl p-12 rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer",
                                dragActive
                                    ? "border-primary bg-primary/5 scale-[1.02]"
                                    : "border-input hover:border-primary/50 hover:bg-accent/50"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={handleFileSelect}
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                <CloudArrowUpIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Drop your file here to upload
                            </h3>
                            <p className="text-muted-foreground mb-8 max-w-sm">
                                Support for PDF orders, Excel spreadsheets (.xlsx), and CSV files. We'll automatically extract line items.
                            </p>
                            <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm">
                                Select File
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Processing State */}
                {status === 'processing' && (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                        <div className="w-full max-w-md space-y-8">
                            <div className="relative w-24 h-24 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-zinc-200 dark:text-zinc-800"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * progress / 100)}
                                        className="text-primary transition-all duration-300 ease-linear"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
                                    {progress}%
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Document...</h3>
                                <p className="text-muted-foreground animate-pulse">
                                    Identifying customer data, extracting line items, and validating SKUs.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Review State */}
                {status === 'review' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
                            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">Analysis Complete</h4>
                                        <p className="text-xs text-muted-foreground">Extracted {MOCK_EXTRACTED_DATA.items.length} items from "Order_Request_Q1.pdf"</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Confidence: High
                                </span>
                            </div>

                            <div className="p-6 grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Detected Customer</label>
                                    <div className="font-medium text-foreground">City Builders Inc. (CUST-002)</div>
                                    <div className="text-sm text-muted-foreground">{MOCK_EXTRACTED_DATA.shippingAddress}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Order Details</label>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">PO Number:</span>
                                        <span className="font-medium text-foreground">{MOCK_EXTRACTED_DATA.poNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Req. Date:</span>
                                        <span className="font-medium text-foreground">{MOCK_EXTRACTED_DATA.requestedDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border">
                                <div className="bg-muted/50 px-6 py-2 text-xs font-semibold text-muted-foreground uppercase flex">
                                    <div className="flex-1">Item Description</div>
                                    <div className="w-20 text-center">Qty</div>
                                    <div className="w-24 text-right">Price</div>
                                    <div className="w-24 text-right">Total</div>
                                    <div className="w-8"></div>
                                </div>
                                <div className="divide-y divide-border">
                                    {MOCK_EXTRACTED_DATA.items.map((item) => (
                                        <div key={item.id} className="px-6 py-3 flex items-center text-sm group hover:bg-accent/50 transition-colors">
                                            <div className="flex-1 font-medium text-foreground">{item.description}</div>
                                            <div className="w-20 text-center text-muted-foreground">{item.qty}</div>
                                            <div className="w-24 text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</div>
                                            <div className="w-24 text-right font-medium text-foreground">${item.total.toFixed(2)}</div>
                                            <div className="w-8 flex justify-center text-green-500">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setStatus('upload')}
                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors font-medium text-sm"
                            >
                                Try Different File
                            </button>
                            <button
                                onClick={() => onImportComplete(MOCK_EXTRACTED_DATA)}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                Continue to Order Creation
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
