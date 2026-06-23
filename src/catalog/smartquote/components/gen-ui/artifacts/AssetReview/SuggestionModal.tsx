import { XMarkIcon, SparklesIcon, ArrowLongRightIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { AssetType } from '../AssetReviewArtifact';

interface SuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: AssetType | null;
    onAccept: () => void;
    onReject: () => void;
}

export default function SuggestionModal({ isOpen, onClose, asset, onAccept, onReject }: SuggestionModalProps) {
    if (!isOpen || !asset) return null;

    // Mock Options based on reference image
    const options = [
        {
            id: 'budget',
            badge: { text: 'Cost Savings', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            title: 'Budget-Friendly Height Adjustable Workstation',
            sku: 'DESK-ELECTRIC-7230-BUDGET',
            total: 95000,
            savings: -23750
        },
        {
            id: 'premium',
            badge: { text: 'Premium Quality', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
            title: 'Premium Height Adjustable Workstation',
            sku: 'DESK-ELECTRIC-7230-PREMIUM',
            total: 148437.5,
            savings: null
        },
        {
            id: 'express',
            badge: { text: 'Fast Delivery', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            title: 'Express Height Adjustable Workstation',
            sku: 'DESK-ELECTRIC-7230-EXPRESS',
            total: 130625,
            savings: null
        },
        {
            id: 'eco',
            badge: { text: 'Eco-Friendly', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            title: 'Eco-Friendly Height Adjustable Workstation',
            sku: 'DESK-ELECTRIC-7230-ECO',
            total: 124687.5,
            savings: null
        }
    ];

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <SparklesIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-foreground">AI Suggestions</h3>
                            <span className="text-muted-foreground font-normal ml-2">{asset.description}</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            <span className="inline-block mr-2">💡</span>
                            Choose the best option for your needs
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onAccept}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Apply Best Option
                        </button>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="p-6 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-800/50 scrollbar-micro">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {options.map((opt) => (
                            <div key={opt.id} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${opt.badge.color}`}>
                                            {opt.badge.text}
                                        </span>
                                        {opt.savings && (
                                            <span className="text-green-600 font-bold text-sm">
                                                {formatCurrency(opt.savings)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                                            {/* Placeholder Item Icon */}
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h4 className="font-bold text-foreground text-sm mb-1">{opt.title}</h4>
                                    <p className="text-xs text-muted-foreground font-mono mb-4">{opt.sku}</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                        <span className="text-xs text-muted-foreground">Total:</span>
                                        <span className="text-lg font-bold text-foreground">{formatCurrency(opt.total)}</span>
                                    </div>

                                    <button
                                        onClick={onAccept}
                                        className="w-full py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shrink-0 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full max-w-sm py-2.5 text-sm font-bold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
