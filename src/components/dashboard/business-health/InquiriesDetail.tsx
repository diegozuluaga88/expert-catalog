
import React from 'react';

const inquiries = [
    {
        id: 'TK-1102',
        customer: 'John Doe',
        subject: 'Missing item in order',
        date: '01/16/2026',
        status: 'Escalated',
        statusColor: 'text-red-500',
        action: 'URGENT',
        actionColor: 'bg-red-500/10 text-red-500 border-red-500/20'
    },
    {
        id: 'TK-1102',
        customer: 'Sarah Kim',
        subject: 'Return request',
        date: '01/14/2026',
        status: 'Awaiting Reply',
        statusColor: 'text-yellow-500',
        action: 'REPLY',
        actionColor: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    },
    {
        id: 'TK-1103',
        customer: 'Mike Chen',
        subject: 'Product Inquiry',
        date: '01/14/2026',
        status: 'Replied',
        statusColor: 'text-green-500',
        action: 'CLOSED',
        actionColor: 'bg-green-500/10 text-green-500 border-green-500/20'
    },
    {
        id: 'TK-1104',
        customer: 'Lisa Park',
        subject: 'Shipping delay',
        date: '01/13/2026',
        status: 'In Progress',
        statusColor: 'text-blue-500',
        action: 'REVIEW',
        actionColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
        id: 'TK-1105',
        customer: 'Alex Rivera',
        subject: 'Bulk order pricing',
        date: '01/13/2026',
        status: 'Replied',
        statusColor: 'text-green-500',
        action: 'CLOSED',
        actionColor: 'bg-green-500/10 text-green-500 border-green-500/20'
    }
];

export default function InquiriesDetail({ className }: { className?: string }) {
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
                            placeholder="Search inquiries..."
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
                <div className="col-span-2">Customer</div>
                <div className="col-span-1">Ticket</div>
                <div className="col-span-4">Subject</div>
                <div className="col-span-2">Received</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List Items */}
            <div className="space-y-2">
                {inquiries.map((inquiry, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center text-sm px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors cursor-pointer group">
                        <div className="col-span-2 font-medium text-foreground">{inquiry.customer}</div>
                        <div className="col-span-1">
                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                                {inquiry.id}
                            </span>
                        </div>
                        <div className="col-span-4 text-foreground">{inquiry.subject}</div>
                        <div className="col-span-2 text-muted-foreground">{inquiry.date}</div>
                        <div className="col-span-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${inquiry.status === 'Escalated' ? 'bg-red-500' : inquiry.status === 'Replied' ? 'bg-green-500' : inquiry.status === 'In Progress' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                            <span className={inquiry.statusColor}>{inquiry.status}</span>
                        </div>
                        <div className="col-span-1 text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${inquiry.actionColor}`}>
                                {inquiry.action}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
