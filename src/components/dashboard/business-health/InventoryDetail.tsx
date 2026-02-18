import React from 'react';

const lowStockItems = [
    {
        sku: 'SKU-0891',
        name: 'Wireless Headphones',
        stockLeft: '2 units',
        reorderPoint: '10 units',
        lastRestocked: '01/02/2026',
        status: 'Critical',
        statusColor: 'text-red-500',
        action: 'REORDER',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    },
    {
        sku: 'SKU-0455',
        name: 'USB-C Hub Pro',
        stockLeft: '4 units',
        reorderPoint: '15 units',
        lastRestocked: '12/28/2025',
        status: 'Critical',
        statusColor: 'text-red-500',
        action: 'REORDER',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    },
    {
        sku: 'SKU-0332',
        name: 'Laptop Stand',
        stockLeft: '8 units',
        reorderPoint: '20 units',
        lastRestocked: '01/05/2026',
        status: 'Low Stock',
        statusColor: 'text-yellow-500',
        action: 'ORDER PLACED',
        actionColor: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    },
    {
        sku: 'SKU-0776',
        name: 'Mechanical Keyboard',
        stockLeft: '12 units',
        reorderPoint: '25 units',
        lastRestocked: '01/10/2026',
        status: 'Low Stock',
        statusColor: 'text-yellow-500',
        action: 'MONITOR',
        actionColor: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    },
    {
        sku: 'SKU-0219',
        name: 'Monitor Arm',
        stockLeft: '15 units',
        reorderPoint: '20 units',
        lastRestocked: '01/08/2026',
        status: 'Adequate',
        statusColor: 'text-brand-500',
        action: 'MONITOR',
        actionColor: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    }
];

export default function InventoryDetail({ className }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 -mt-[1px] relative z-0 ${className}`}>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Showing 5 of 14 items</span>
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
                            placeholder="Search low stock items..."
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
                <div className="col-span-3">Product</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-2">Stock Left</div>
                <div className="col-span-2">Last Restocked</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
                {lowStockItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center text-sm px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer group">
                        <div className="col-span-3 font-medium text-foreground">{item.name}</div>
                        <div className="col-span-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                                {item.sku}
                            </span>
                        </div>
                        <div className="col-span-2 font-medium">{item.stockLeft}</div>
                        <div className="col-span-2 text-muted-foreground">{item.lastRestocked}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Critical' ? 'bg-red-500' : item.status === 'Low Stock' ? 'bg-yellow-500' : 'bg-brand-500'}`}></div>
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
