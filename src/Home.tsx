import React from 'react';
import {
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import { StatCard } from './components/dashboard/StatCard';
import { AiActionsAccordion } from './components/dashboard/AiActionsAccordion';
import { RecentActivityList } from './components/dashboard/RecentActivityList';
import { PerformanceMetrics } from './components/dashboard/PerformanceMetrics';

export default function Home() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground pb-24 relative transition-colors duration-200">
            <div className="pt-24 px-4 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-brand tracking-tight text-foreground">Good morning, Alex</h1>
                    <p className="text-muted-foreground mt-1">You have 14 active orders and 6 items requiring action.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Orders"
                        value="14"
                        icon={ClipboardDocumentCheckIcon}
                        trend="1.3%"
                        trendLabel="vs last week"
                        trendPositive={true}
                        statusColor="bg-lime-400/20 text-lime-600 dark:text-lime-400 border-lime-400/20"
                    />
                    <StatCard
                        title="Discrepancies"
                        value="3"
                        icon={ExclamationTriangleIcon}
                        statusColor="bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border-yellow-400/20"
                    />
                    <StatCard
                        title="Shipments"
                        value="35"
                        icon={TruckIcon}
                        trend="1.3%"
                        trendLabel="vs last week"
                        trendPositive={false}
                        statusColor="bg-lime-400/20 text-lime-600 dark:text-lime-400 border-lime-400/20"
                    />
                    <StatCard
                        title="Payments"
                        value="2"
                        icon={CreditCardIcon}
                        statusColor="bg-lime-400/20 text-lime-600 dark:text-lime-400 border-lime-400/20"
                    />
                </div>

                {/* AI Actions */}
                <div className="w-full">
                    <AiActionsAccordion />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RecentActivityList />
                    <PerformanceMetrics />
                </div>

                {/* Footer Banner */}
                <div className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-center justify-between shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            <div className="w-5 h-5 border-2 border-zinc-400 dark:border-zinc-500 rounded-sm"></div>
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-sm">4.2 hours saved today</p>
                            <p className="text-xs text-zinc-500">Through automated workflows and AI recommendations</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        View automation report
                        <span>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
