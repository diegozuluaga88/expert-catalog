import { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    SparklesIcon,
    Bars2Icon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Suggestion {
    value: string;
    confidence: number;
    description: string;
}

interface MappingFieldProps {
    label: string;
    originalField: string;
    description?: string;
    status: 'matched' | 'review';
    confidence: number;
    suggestions?: Suggestion[];
    value: string;
    onApply?: (value: string) => void;
}

export default function MappingField({ field }: { field: MappingFieldProps }) {
    const [isOpen, setIsOpen] = useState(field.status === 'review');
    const [selectedValue, setSelectedValue] = useState(field.value);
    const [isApplied, setIsApplied] = useState(false);

    const isMatched = field.status === 'matched' || isApplied;

    // Status color logic (unused variable removed or kept if needed for complex logic, but simplifying here)
    const getConfidenceColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-amber-600';
        return 'text-red-600';
    };

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsApplied(true);
        setTimeout(() => {
            if (field.onApply) {
                field.onApply(selectedValue);
            }
        }, 800); // 0.8s delay for visual feedback
    };

    return (
        <div className={`bg-white dark:bg-zinc-800 border ${isMatched ? 'border-green-200 dark:border-green-900' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            {/* Header / Summary */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMatched ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                        {isMatched ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {field.label}
                            {!isMatched && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Review Needed</span>}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">{field.originalField}</span>
                            <span>•</span>
                            <span className={getConfidenceColor(field.confidence)}>{field.confidence}% Match</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isMatched && (
                        <div className="text-right mr-2">
                            <div className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" /> Validated
                            </div>
                        </div>
                    )}
                    <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Source Data */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                                <Bars2Icon className="w-4 h-4" /> Source Data
                            </div>
                            <div className="font-mono text-sm text-foreground bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                {field.description || "Sample data not available"}
                            </div>
                        </div>

                        {/* Column 2: AI Suggestions & Action */}
                        <div className="flex flex-col gap-1">
                            {field.suggestions && field.suggestions.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                                        <SparklesIcon className="w-4 h-4" /> Best Match
                                    </div>
                                    <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-2.5 relative group hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => setSelectedValue(field.suggestions![0].value)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-sm text-indigo-900 dark:text-indigo-200">{field.suggestions[0].value}</div>
                                                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5">{field.suggestions[0].description}</div>
                                            </div>
                                            <span className="text-[10px] font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-600 shadow-sm float-right">
                                                {field.suggestions[0].confidence}%
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800 pt-3">
                        <div className="flex-1 max-w-[200px]">
                            {field.suggestions && field.suggestions.length > 1 && (
                                <div className="relative">
                                    <select
                                        onChange={(e) => setSelectedValue(e.target.value)}
                                        className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800 border-none text-xs rounded-lg py-1.5 pl-2 pr-6 text-muted-foreground focus:ring-1 focus:ring-primary cursor-pointer hover:bg-zinc-100 transition-colors"
                                        value={selectedValue}
                                    >
                                        <option disabled>Alternative options...</option>
                                        {field.suggestions.slice(1).map((sugg, idx) => (
                                            <option key={idx} value={sugg.value}>{sugg.value} ({sugg.confidence}%)</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-400 pointer-events-none" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleApply}
                            disabled={isMatched}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm ml-auto ${isMatched ? 'bg-green-100 text-green-700 cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                        >
                            {isMatched ? (
                                <>Validated <CheckCircleIcon className="w-3 h-3" /></>
                            ) : (
                                <>Apply Match <ArrowRightIcon className="w-3 h-3" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


