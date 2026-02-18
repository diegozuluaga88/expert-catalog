
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    ExclamationCircleIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

const orders = [
    { customer: 'John Doe', ticket: '#TK-1102', subject: 'Missing item in order', received: '01/16/2026', status: 'Escalated', statusColor: 'text-red-500', action: 'Urgent', actionColor: 'bg-red-500/10 text-red-500' },
    { customer: 'Sarah Kim', ticket: '#TK-1102', subject: 'Return request', received: '01/14/2026', status: 'Awaiting Reply', statusColor: 'text-yellow-500', action: 'Reply', actionColor: 'bg-yellow-500/10 text-yellow-500' },
    { customer: 'Mike Chen', ticket: '#TK-1103', subject: 'Product Inquiry', received: '01/14/2026', status: 'Replied', statusColor: 'text-brand-500', action: 'Closed', actionColor: 'bg-brand-500/10 text-brand-500' },
    { customer: 'Lisa Park', ticket: '#TK-1104', subject: 'Shipping delay', received: '01/13/2026', status: 'In Progress', statusColor: 'text-blue-500', action: 'Review', actionColor: 'bg-blue-500/10 text-blue-500' },
    { customer: 'Alex Rivera', ticket: '#TK-1105', subject: 'Bulk order pricing', received: '01/13/2026', status: 'Replied', statusColor: 'text-brand-500', action: 'Closed', actionColor: 'bg-brand-500/10 text-brand-500' },
];

export default function OrdersTable() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm mb-6">
            {/* Header */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Showing 5 of 42 results</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                            &lt;
                        </button>
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                            &gt;
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search inquiries..."
                            className="bg-zinc-950/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-auto"
                        />
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/50 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <FunnelIcon className="w-3.5 h-3.5" />
                        Filter
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/50 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowsUpDownIcon className="w-3.5 h-3.5" />
                        Sort
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Customer</th>
                            <th className="px-4 py-3 font-medium">Ticket</th>
                            <th className="px-4 py-3 font-medium">Subject</th>
                            <th className="px-4 py-3 font-medium">Received</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order, index) => (
                            <tr key={index} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-4 py-3 text-foreground font-medium">{order.customer}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs font-mono">{order.ticket}</span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{order.subject}</td>
                                <td className="px-4 py-3 text-muted-foreground">{order.received}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {/* Status Icon Logic (Simplified for demo) */}
                                        <div className={`w-1.5 h-1.5 rounded-full ${order.statusColor.replace('text-', 'bg-')}`}></div>
                                        <span className={order.statusColor + ' text-xs font-medium'}>{order.status}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${order.actionColor}`}>
                                        {order.action}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
