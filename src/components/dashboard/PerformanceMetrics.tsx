import React, { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils'

const metrics = [
    { label: 'Quote win rate', value: 68, target: '65% TARGET', color: 'bg-lime-400' },
    { label: 'On-time delivery', value: 92, target: '90% TARGET', color: 'bg-lime-400' },
    { label: 'Discrepancy resolution', value: 45, target: '80% TARGET', color: 'bg-orange-400' },
    { label: 'Payment speed', value: 78, target: '75% TARGET', color: 'bg-lime-400' },
    { label: 'Inventory accuracy', value: 99, target: '98% TARGET', color: 'bg-lime-400' },
];

export function PerformanceMetrics() {
    const [viewMode, setViewMode] = useState<'percentage' | 'hours'>('percentage');

    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 h-full flex flex-col shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">This Month's Performance</h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white dark:text-zinc-950 bg-lime-500 dark:bg-lime-400 rounded-md hover:bg-lime-600 dark:hover:bg-lime-500 transition-colors">
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                </button>
            </div>

            <div className="flex justify-center mb-8">
                <div className="p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex gap-1">
                    <button
                        onClick={() => setViewMode('percentage')}
                        className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === 'percentage' ? "bg-white dark:bg-lime-400 text-zinc-900 dark:text-zinc-950 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white")}
                    >
                        Percentage
                    </button>
                    <button
                        onClick={() => setViewMode('hours')}
                        className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === 'hours' ? "bg-white dark:bg-lime-400 text-zinc-900 dark:text-zinc-950 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white")}
                    >
                        Hours Saved
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-7">
                {metrics.map((metric, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{metric.label}</span>
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">{metric.value}%</span>
                        </div>
                        <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700/50 rounded-full overflow-hidden">
                            <div
                                className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500", metric.color)}
                                style={{ width: `${metric.value}%` }}
                            />
                        </div>
                        <div className="flex justify-end mt-1.5">
                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">{metric.target}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
