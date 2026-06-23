import { ArrowLongRightIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { AssetType } from '../AssetReviewArtifact';

interface AISuggestionPanelProps {
    originalAsset: AssetType;
    suggestion: NonNullable<AssetType['suggestion']>;
    onAccept: () => void;
    onReject: () => void;
}

export default function AISuggestionPanel({ originalAsset, suggestion, onAccept, onReject }: AISuggestionPanelProps) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const savings = (originalAsset.unitPrice - suggestion.price) * originalAsset.qty;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 shadow-sm my-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Optimization Suggestion</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{suggestion.reason}</p>

                    <div className="mt-3 flex items-center justify-between bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
                        {/* Original */}
                        <div className="text-center">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Original SKU</div>
                            <div className="font-mono text-xs font-medium mt-0.5">{originalAsset.sku}</div>
                            <div className="text-sm font-semibold line-through opacity-70 mt-1">{formatCurrency(originalAsset.unitPrice)}</div>
                        </div>

                        <ArrowLongRightIcon className="w-5 h-5 text-blue-400" />

                        {/* Suggestion */}
                        <div className="text-center">
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Proposed SKU</div>
                            <div className="font-mono text-xs font-medium mt-0.5 text-blue-700 dark:text-blue-300">{suggestion.sku}</div>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(suggestion.price)}</div>
                        </div>
                    </div>

                    <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800/50">
                            Potential Savings: {formatCurrency(savings)}
                        </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onAccept}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Accept Change
                        </button>
                        <button
                            onClick={onReject}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-medium rounded-lg transition-colors"
                        >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
