
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const data = [
    { name: 'Electronics', value: 400, color: 'var(--color-brand-500)' },
    { name: 'Furniture', value: 300, color: '#52525b' }, // Zinc 600
    { name: 'Accessories', value: 150, color: '#71717a' }, // Zinc 500
    { name: 'Fixtures', value: 150, color: '#a1a1aa' }, // Zinc 400
];

export default function CategoriesChart() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Top Categories</h3>

                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    Filter
                    <ChevronDownIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">100%</span>
                    <span className="text-xs text-muted-foreground">Distribution</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-card)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-foreground)',
                                borderRadius: '8px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">
                            {Math.round((item.value / 1000) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
