import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function BusinessHealthHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Business Health</h1>
                <p className="text-sm text-muted-foreground mt-1">Overview of your store's performance</p>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center bg-card border border-border rounded-lg p-1">
                    {['Today', 'Week', 'Month', 'Quarter', 'Year'].map((range, idx) => (
                        <button
                            key={range}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${idx === 0
                                    ? 'bg-brand-500 text-brand-950 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-brand-950 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <PlusIcon className="w-4 h-4" />
                    New Order
                </button>
            </div>
        </div>
    );
}
