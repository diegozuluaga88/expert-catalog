
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const inventory = [
    {
        id: 'MS-001',
        name: 'Modern Sectional Grey',
        desc: 'Couch, linen, grey',
        category: 'Living Room',
        stock: 8,
        message: 'Stock might run out in 3 days',
        status: 'Low Stock',
        statusColor: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&q=80'
    },
    {
        id: 'OT-204',
        name: 'Oak Dining Table',
        desc: 'Table, oak, natural wood',
        category: 'Dining Room',
        stock: 24,
        message: 'Overstock risk',
        status: 'In Stock',
        statusColor: 'bg-green-500/10 text-green-500 border-green-500/20',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=100&q=80'
    },
    {
        id: 'LA-001',
        name: 'Leather Armchair',
        desc: 'Armchair, leather, brown',
        category: 'Living Room',
        stock: 45,
        message: 'Overstock risk',
        status: 'In Stock',
        statusColor: 'bg-green-500/10 text-green-500 border-green-500/20',
        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100&q=80'
    }
];

export default function InventoryHealthList() {
    return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-lg font-semibold text-foreground">Inventory Health</span>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            className="bg-zinc-950/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-64"
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

            <div className="divide-y divide-border">
                {inventory.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4 flex-1">
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                            <div>
                                <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                        </div>

                        <div className="hidden sm:block w-32 text-xs text-muted-foreground">
                            {item.id}
                        </div>

                        <div className="hidden md:block w-32 text-xs text-muted-foreground">
                            {item.category}
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <span className="block text-sm font-bold text-foreground">{item.stock}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Stock Level</span>
                            </div>

                            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground w-48">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                {item.message}
                            </div>

                            <span className={`px-2 py-1 rounded text-xs font-medium border ${item.statusColor}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-muted/20 border-t border-border flex justify-end">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Showing 3 of 20 results</span>
                    <div className="flex gap-1">
                        <button className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50">&lt;</button>
                        <button className="p-1 text-muted-foreground hover:text-foreground">&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
