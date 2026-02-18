
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    ChatBubbleLeftEllipsisIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const inquiries = [
    {
        id: 1,
        user: 'Michael Scott',
        avatar: 'MS',
        message: "Can we get an update on the bulk shipping rates for the Q1 furniture collection? We're seeing a slight discrepancy in the automated quotes.",
        time: '3 hours ago',
        replies: [
            {
                user: 'Dwight Schrute',
                avatar: 'DS',
                isAi: true,
                message: "I've checked with the logistics team. The discrepancy was due to a temporary surcharge on oversized items. It should be resolved now.",
                time: '2 hours ago'
            }
        ]
    },
    {
        id: 2,
        user: 'Michael Scott',
        avatar: 'MS',
        message: "The client is requesting a priority status for order #SH-2387 due to a project deadline on Friday. They are concerned about potential delays.",
        time: '3 hours ago',
        replies: []
    },
    {
        id: 3,
        user: 'Michael Scott',
        avatar: 'MS',
        message: "I suggest we should increase the reorder point to avoid stockouts during the holiday rush for the Leather Armchair series.",
        time: '3 hours ago',
        replies: []
    }
];

export default function RecentInquiries() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm h-full">
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Recent Inquiries</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-3 h-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search Inquiries..."
                                className="bg-black/20 border border-border rounded pl-7 pr-2 py-1 text-xs text-foreground focus:outline-none focus:border-brand-500 w-40"
                            />
                        </div>
                        <button className="p-1 bg-black/20 border border-border rounded hover:bg-muted/50 text-muted-foreground">
                            <FunnelIcon className="w-3 h-3" />
                        </button>
                        <button className="p-1 bg-black/20 border border-border rounded hover:bg-muted/50 text-muted-foreground">
                            <ArrowsUpDownIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="relative pl-4 border-l border-border hover:border-brand-500/50 transition-colors pb-4">
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-background"></div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                                    {inquiry.avatar}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">{inquiry.user}</span>
                                        <span className="text-xs text-muted-foreground">{inquiry.time}</span>
                                    </div>

                                    <div className="mt-2 bg-muted/30 border border-border/50 rounded-lg p-3 text-sm text-muted-foreground">
                                        {inquiry.message}
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 mb-4">
                                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-500 transition-colors">
                                            <HandThumbUpIcon className="w-3 h-3" />
                                        </button>
                                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                                            <HandThumbDownIcon className="w-3 h-3" />
                                        </button>
                                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <ChatBubbleLeftEllipsisIcon className="w-3 h-3" />
                                            Reply ({inquiry.replies.length})
                                        </button>
                                    </div>

                                    {inquiry.replies.map((reply, idx) => (
                                        <div key={idx} className="ml-4 mt-2 flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-400 mt-1">
                                                {reply.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-foreground">{reply.user}</span>
                                                    {reply.isAi && (
                                                        <span className="text-[10px] bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                                            AI Summary
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {reply.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <button className="text-muted-foreground hover:text-foreground"><HandThumbUpIcon className="w-3 h-3" /></button>
                                                    <button className="text-muted-foreground hover:text-foreground"><HandThumbDownIcon className="w-3 h-3" /></button>
                                                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                                        <PlusIcon className="w-3 h-3" /> Write a reply
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{reply.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
