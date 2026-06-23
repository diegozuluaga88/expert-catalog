import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, PencilSquareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { AssetType } from '../AssetReviewArtifact';

interface EditAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: AssetType | null;
    onSave: (updatedAsset: AssetType) => void;
}

export default function EditAssetModal({ isOpen, onClose, asset, onSave }: EditAssetModalProps) {
    const [formData, setFormData] = useState<Partial<AssetType>>({});

    // Mock suggestions validation (simulated for UI demo)
    const [suggestions] = useState({
        description: "Premium Leather Conference Chair", // Suggestion for description
        sku: "CHR-CONF-LTH-PRO" // Suggestion for SKU
    });

    useEffect(() => {
        if (asset) {
            setFormData({ ...asset });
        }
    }, [asset]);

    if (!isOpen || !asset) return null;

    const handleChange = (field: keyof AssetType, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleApplySuggestion = (field: keyof AssetType, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyAll = () => {
        setFormData(prev => ({
            ...prev,
            description: suggestions.description,
            sku: suggestions.sku
        }));
    };

    const handleSave = () => {
        onSave({ ...asset, ...formData } as AssetType);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2 text-foreground">
                        {asset.status === 'review' ? (
                            <>
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold">Review Required</h3>
                            </>
                        ) : (
                            <>
                                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                                    <PencilSquareIcon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold">Edit Asset</h3>
                            </>
                        )}
                        <span className="text-muted-foreground font-normal text-sm ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-2">{asset.description}</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto scrollbar-micro">

                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <PencilSquareIcon className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-foreground">Manual Edit Asset</h4>
                        </div>
                        <button
                            onClick={handleApplyAll}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Apply All AI Suggestions
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Asset Name (Description) */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">Asset Name</label>
                            <input
                                type="text"
                                value={formData.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-amber-50/50 dark:bg-zinc-800/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                            {/* Inline Suggestion */}
                            {asset.issues?.length && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        <span>AI suggests: "{suggestions.description}"</span>
                                    </div>
                                    <button
                                        onClick={() => handleApplySuggestion('description', suggestions.description)}
                                        className="text-[10px] font-bold bg-white dark:bg-blue-900 shadow-sm border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SKU */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">SKU</label>
                            <input
                                type="text"
                                value={formData.sku || ''}
                                onChange={(e) => handleChange('sku', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        {/* Category (Mock) */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">Category</label>
                            <input
                                type="text"
                                defaultValue="Office Furniture"
                                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-amber-50/50 dark:bg-zinc-800/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                            {/* Inline Suggestion */}
                            {asset.issues?.length && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        <span>AI suggests: "Seating" (optimized)</span>
                                    </div>
                                    <button className="text-[10px] font-bold bg-white dark:bg-blue-900 shadow-sm border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description Field */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">Description</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            ></textarea>
                        </div>

                        {/* Price & Qty */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">Unit Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                <input
                                    type="number"
                                    value={formData.unitPrice || 0}
                                    onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value))}
                                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-foreground mb-1.5">Quantity</label>
                            <input
                                type="number"
                                value={formData.qty || 0}
                                onChange={(e) => handleChange('qty', parseInt(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex flex-col items-center gap-4 shrink-0">

                    <div className="w-full flex justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                        >
                            Save Changes
                        </button>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-slate-500">Needs Manual Validation</span>
                        <span className="text-xs text-slate-400">Please review and validate or edit the asset details above</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
