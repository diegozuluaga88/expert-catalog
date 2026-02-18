
import {
    CurrencyDollarIcon,
    TruckIcon,
    CubeIcon,
    ChatBubbleLeftRightIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const stats = [
    {
        id: 1,
        title: 'Total Revenue',
        value: '$124,500',
        change: '+12.5% vs last week',
        trend: 'up',
        icon: CurrencyDollarIcon,
        iconColor: 'bg-brand-500/10 text-brand-500' // Using brand token
    },
    {
        id: 2,
        title: 'Orders To Ship',
        value: '42',
        change: '+5.2% vs last week',
        trend: 'up',
        icon: TruckIcon,
        iconColor: 'bg-brand-500/10 text-brand-500'
    },
    {
        id: 3,
        title: 'Low Stock Items',
        value: '14',
        change: '2 items vs last week',
        trend: 'down',
        trendColor: 'text-red-500',
        icon: CubeIcon,
        iconColor: 'bg-brand-500/10 text-brand-500'
    },
    {
        id: 4,
        title: 'Active Inquiries',
        value: '8',
        change: '1 inquiry vs last week',
        trend: 'up',
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'bg-brand-500/10 text-brand-500'
    }
];


interface StatsRowProps {
    activeStatId?: number | null;
    onStatClick?: (id: number) => void;
}

export default function StatsRow({ activeStatId, onStatClick }: StatsRowProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {stats.map((stat) => {
                const isActive = activeStatId === stat.id;
                return (
                    <div
                        key={stat.id}
                        onClick={() => onStatClick?.(stat.id)}
                        className={`
                            bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm transition-all cursor-pointer
                            ${isActive ? 'rounded-b-none border-b-zinc-800 dark:border-b-zinc-800 z-20 relative ring-0' : 'hover:border-zinc-300 dark:hover:border-zinc-600'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                            <div className={`p-2 rounded-full ${stat.iconColor}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                            <div className="flex items-center gap-1 mt-1 text-xs">
                                {stat.trend === 'up' ? (
                                    <ArrowTrendingUpIcon className="w-3 h-3 text-brand-500" />
                                ) : (
                                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />
                                )}
                                <span className={stat.trend === 'down' ? 'text-red-500' : 'text-brand-500'}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                        {/* Connector Bridge */}
                        {isActive && (
                            <>
                                {/* Hides card bottom border */}
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white dark:bg-zinc-800 z-30" />
                                {/* Bridges the gap to the panel below */}
                                <div className="absolute -bottom-6 left-[-1px] right-[-1px] h-6 bg-white dark:bg-zinc-800 border-l border-r border-zinc-200 dark:border-zinc-700 z-20" />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

