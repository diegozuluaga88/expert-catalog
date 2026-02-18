import React from 'react';

const transactions = [
    {
        transaction: 'Online Store Sale',
        reference: '#TK-4201',
        amount: 'USD 12,450.00',
        date: '01/16/2026',
        status: 'Completed',
        statusColor: 'text-brand-500',
        action: 'View',
        actionColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20'
    },
    {
        transaction: 'Subscription Renewal',
        reference: '#TK-4202',
        amount: 'USD 2,400.00',
        date: '01/15/2026',
        status: 'Completed',
        statusColor: 'text-brand-500',
        action: 'View',
        actionColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20'
    },
    {
        transaction: 'In-Store Purchase',
        reference: '#TK-4203',
        amount: 'USD 8,750.00',
        date: '01/14/2026',
        status: 'Pending Review',
        statusColor: 'text-yellow-500',
        action: 'Review',
        actionColor: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    },
    {
        transaction: 'Wholesale Order',
        reference: '#TK-4204',
        amount: 'USD 34,200.00',
        date: '01/14/2026',
        status: 'Completed',
        statusColor: 'text-brand-500',
        action: 'View',
        actionColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20'
    },
    {
        transaction: 'Refund Processed',
        reference: '#TK-4205',
        amount: '-USD 150.00',
        amountColor: 'text-red-500',
        date: '01/13/2026',
        status: 'Refunded',
        statusColor: 'text-yellow-500',
        action: 'Review',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    }
];

export default function RevenueDetail({ className }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 -mt-[1px] relative z-0 ${className}`}>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Showing 5 of 42 results</span>
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded">
                        <span className="text-xs">‹</span>
                    </button>
                    <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded">
                        <span className="text-xs">›</span>
                    </button>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search total revenue..."
                            className="bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm px-3 py-1.5 w-64 focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        Filter
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                        Sort
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground mb-4 px-2">
                <div className="col-span-3">Transaction</div>
                <div className="col-span-2">Reference</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
                {transactions.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center text-sm px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer group">
                        <div className="col-span-3 font-medium text-foreground">{item.transaction}</div>
                        <div className="col-span-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                                {item.reference}
                            </span>
                        </div>
                        <div className={`col-span-2 ${item.amountColor || 'text-foreground'}`}>{item.amount}</div>
                        <div className="col-span-2 text-muted-foreground">{item.date}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-brand-500' : item.status === 'Refunded' ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
                            <span className={item.statusColor}>{item.status}</span>
                        </div>
                        <div className="col-span-1 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${item.actionColor}`}>
                                {item.action}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
