
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
];

export default function SalesChart() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sales Performance</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-foreground">$124,500</span>
                        <span className="text-xs font-medium text-brand-500">+5.2% vs last week</span>
                    </div>
                </div>

                <div className="flex items-center bg-zinc-950/50 border border-border rounded-lg p-1">
                    <button className="px-3 py-1 text-xs font-medium bg-brand-500 text-brand-950 rounded-md shadow-sm">By Day</button>
                    <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">By Week</button>
                    <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">By Month</button>
                </div>
            </div>

            <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-zinc-500)', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-foreground)',
                                borderRadius: '8px'
                            }}
                            itemStyle={{ color: 'var(--color-brand-500)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-brand-500)"
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
