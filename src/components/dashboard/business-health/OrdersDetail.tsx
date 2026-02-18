import React from 'react';

const orders = [
    {
        orderId: '#ORD-7829',
        customer: 'Acme Corp',
        items: '5 items',
        total: '$1,240.00',
        status: 'Ready to Ship',
        statusColor: 'text-brand-500',
        date: 'Today, 10:30 AM',
        action: 'SHIP',
        actionColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20'
    },
    {
        orderId: '#ORD-7828',
        customer: 'Globex Inc',
        items: '2 items',
        total: '$450.50',
        status: 'Key Missing',
        statusColor: 'text-red-500',
        date: 'Today, 09:15 AM',
        action: 'ALERT',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    },
    {
        orderId: '#ORD-7827',
        customer: 'Soylent Corp',
        items: '12 items',
        total: '$3,890.00',
        status: 'Processing',
        statusColor: 'text-yellow-500',
        date: 'Yesterday',
        action: 'VIEW',
        actionColor: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    },
    {
        orderId: '#ORD-7826',
        customer: 'Initech',
        items: '1 item',
        total: '$85.00',
        status: 'Ready to Ship',
        statusColor: 'text-brand-500',
        date: 'Yesterday',
        action: 'SHIP',
        actionColor: 'bg-brand-500/10 text-brand-500 border-brand-500/20'
    },
    {
        orderId: '#ORD-7825',
        customer: 'Umbrella Corp',
        items: '8 items',
        total: '$2,100.00',
        status: 'On Hold',
        statusColor: 'text-red-500',
        date: '01/14/2026',
        action: 'REVIEW',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    }
];

export default function OrdersDetail({ className }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 -mt-[1px] relative z-0 ${className}`}>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Showing 5 of 42 orders</span>
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
                            placeholder="Search orders..."
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
                <div className="col-span-2">Order ID</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Items</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
                {orders.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center text-sm px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer group">
                        <div className="col-span-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                                {item.orderId}
                            </span>
                        </div>
                        <div className="col-span-3 font-medium text-foreground">{item.customer}</div>
                        <div className="col-span-2 text-muted-foreground">{item.items}</div>
                        <div className="col-span-2 font-medium">{item.total}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Ready to Ship' ? 'bg-brand-500' : 'bg-red-500'}`}></div>
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
