import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
    DocumentTextIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline'; // Using Heroicons for now as placeholders for activity icons

const activities = [
    { id: 1, title: 'Quote converted to PO', time: '2 hours ago', icon: DocumentTextIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100/50 dark:bg-green-400/10', ref: '#QT-2841' },
    { id: 2, title: 'Payment received', time: '3 hours ago', description: 'Payment for USD 745.00 was received ->', icon: CurrencyDollarIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100/50 dark:bg-blue-400/10', ref: '#INV-7828' },
    { id: 3, title: 'Discrepancy detected', time: '4 hours ago', icon: ExclamationTriangleIcon, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100/50 dark:bg-yellow-400/10', ref: '#DR-9823' },
    { id: 4, title: 'Shipment delayed', time: '5 hours ago', description: 'Shipment delayed due to bad weather ->', icon: TruckIcon, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100/50 dark:bg-red-400/10', ref: '#SH-4519' },
    { id: 5, title: 'New quote created', time: '6 hours ago', icon: PlusCircleIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100/50 dark:bg-green-400/10', ref: '#QT-2848' },
];

export function RecentActivityList() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 h-full shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                        Workvel <ChevronDownIcon className="w-3 h-3" />
                    </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 rounded-md hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Related to You
                    <ChevronDownIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between group">
                        <div className="flex gap-4">
                            <div className={`p-2 rounded-full ${activity.bg} ${activity.color} shrink-0`}>
                                <activity.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{activity.title}</span>
                                <span className="text-xs text-zinc-500">{activity.time}</span>
                                {activity.description && (
                                    <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">{activity.description}</span>
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">{activity.ref}</span>
                    </div>
                ))}
            </div>
            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mt-6 transition-colors">See all</button>
        </div>
    );
}
