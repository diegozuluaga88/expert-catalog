import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    EllipsisHorizontalIcon, // For Kebab menu
    CubeIcon, // Total Items
    CurrencyDollarIcon, // Total Value
    ArrowTrendingUpIcon, // Weekly Trend
    DocumentTextIcon, // Generate Report
    TableCellsIcon, // Columns as List
    Squares2X2Icon, // Grid View
    FunnelIcon, // Sort
    ChevronLeftIcon,
    ChevronRightIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// --- Mock Data ---

interface InventoryItem {
    id: string;
    thumbnail?: string;
    name: string;
    description: string;
    sku: string;
    category: 'Living Room' | 'Dining Room' | 'Bedroom' | 'Kitchen' | 'Office';
    stockLevel: number;
    price: number;
    aiPricing: {
        status: 'Competitive' | 'Below Market' | 'Above Market';
        insight: string;
    };
    aiInventory: {
        target: number;
        current: number;
        toBuild: number;
        statusPercentage: number; // 0-100
    };
    warehouse: string;
    location: string;
}

const MOCK_DATA: InventoryItem[] = [
    {
        id: '1',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
        name: 'Mid-Century Modern Sofa',
        description: 'Couch, linen, green',
        sku: 'SF-902-GRN',
        category: 'Living Room',
        stockLevel: 156,
        price: 899.00,
        aiPricing: { status: 'Competitive', insight: 'Price is within market range.' },
        aiInventory: { target: 200, current: 156, toBuild: 44, statusPercentage: 78 },
        warehouse: 'Aisle 4-B',
        location: 'Los Angeles, CA, USA'
    },
    {
        id: '2',
        thumbnail: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&q=80&w=600',
        name: 'Oak Dining Table',
        description: 'Table, oak, natural wood',
        sku: 'TB-104-OAK',
        category: 'Dining Room',
        stockLevel: 24,
        price: 450.00,
        aiPricing: { status: 'Below Market', insight: '15% below market average.' },
        aiInventory: { target: 41, current: 24, toBuild: 17, statusPercentage: 58 },
        warehouse: 'Aisle 2-A',
        location: 'Seattle, WA, USA'
    },
    {
        id: '3',
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-b0346efee539?auto=format&fit=crop&q=80&w=600',
        name: 'King Size Platform Bed',
        description: 'Bed, birch, white',
        sku: 'BD-550-WHT',
        category: 'Bedroom',
        stockLevel: 45,
        price: 450.00,
        aiPricing: { status: 'Above Market', insight: '10% above market average.' },
        aiInventory: { target: 53, current: 45, toBuild: 8, statusPercentage: 85 },
        warehouse: 'Aisle 1-D',
        location: 'San Diego, CA, USA'
    },
    {
        id: '4',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
        name: 'Mid-Century Modern Sofa',
        description: 'Couch, linen, green',
        sku: 'SF-902-GRN',
        category: 'Living Room',
        stockLevel: 156,
        price: 899.00,
        aiPricing: { status: 'Competitive', insight: 'Price is within market range.' },
        aiInventory: { target: 200, current: 156, toBuild: 44, statusPercentage: 78 },
        warehouse: 'Aisle 4-9',
        location: 'Los Angeles, CA, USA'
    },
    {
        id: '5',
        thumbnail: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&q=80&w=600',
        name: 'Oak Dining Table',
        description: 'Table, oak, natural wood',
        sku: 'TB-104-OAK',
        category: 'Dining Room',
        stockLevel: 24,
        price: 450.00,
        aiPricing: { status: 'Below Market', insight: '15% below market average.' },
        aiInventory: { target: 41, current: 24, toBuild: 17, statusPercentage: 58 },
        warehouse: 'Aisle 2-A',
        location: 'Seattle, WA, USA'
    },
    {
        id: '6',
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-b0346efee539?auto=format&fit=crop&q=80&w=600',
        name: 'King Size Platform Bed',
        description: 'Bed, birch, white',
        sku: 'BD-550-WHT',
        category: 'Bedroom',
        stockLevel: 45,
        price: 450.00,
        aiPricing: { status: 'Above Market', insight: '10% above market average.' },
        aiInventory: { target: 53, current: 45, toBuild: 8, statusPercentage: 85 },
        warehouse: 'Aisle 1-D',
        location: 'San Diego, CA, USA'
    },
    {
        id: '7',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
        name: 'Mid-Century Modern Sofa',
        description: 'Couch, linen, green',
        sku: 'SF-902-GRN',
        category: 'Living Room',
        stockLevel: 156,
        price: 899.00,
        aiPricing: { status: 'Competitive', insight: 'Price is within market range.' },
        aiInventory: { target: 200, current: 156, toBuild: 44, statusPercentage: 78 },
        warehouse: 'Aisle 4-8',
        location: 'Los Angeles, CA, USA'
    },
    {
        id: '8',
        thumbnail: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&q=80&w=600',
        name: 'Oak Dining Table',
        description: 'Table, oak, natural wood',
        sku: 'TB-104-OAK',
        category: 'Dining Room',
        stockLevel: 24,
        price: 450.00,
        aiPricing: { status: 'Below Market', insight: '15% below market average.' },
        aiInventory: { target: 41, current: 24, toBuild: 17, statusPercentage: 58 },
        warehouse: 'Aisle 2-A',
        location: 'Seattle, WA, USA'
    },
    {
        id: '9',
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-b0346efee539?auto=format&fit=crop&q=80&w=600',
        name: 'King Size Platform Bed',
        description: 'Bed, birch, white',
        sku: 'BD-550-WHT',
        category: 'Bedroom',
        stockLevel: 45,
        price: 450.00,
        aiPricing: { status: 'Above Market', insight: '10% above market average.' },
        aiInventory: { target: 53, current: 45, toBuild: 8, statusPercentage: 85 },
        warehouse: 'Aisle 1-D',
        location: 'San Diego, CA, USA'
    },
    {
        id: '10',
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
        name: 'Mid-Century Modern Sofa',
        description: 'Couch, linen, green',
        sku: 'SF-902-GRN',
        category: 'Living Room',
        stockLevel: 156,
        price: 899.00,
        aiPricing: { status: 'Competitive', insight: 'Price is within market range.' },
        aiInventory: { target: 200, current: 156, toBuild: 44, statusPercentage: 78 },
        warehouse: 'Aisle 4-B',
        location: 'Los Angeles, CA, USA'
    },
];

// --- KPIs Data ---
const KPIS = [
    { label: 'Total Items', value: '1,240', icon: CubeIcon, color: 'text-brand-400' },
    { label: 'Total Value', value: '$450K', icon: CurrencyDollarIcon, color: 'text-brand-400' },
    { label: 'Weekly Trend', value: '+2.4%', icon: ArrowTrendingUpIcon, color: 'text-brand-400' },
];

export default function Inventory() {
    const [selectedCategory, setSelectedCategory] = useState('All Items');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); // Default to Grid view as requested by user image

    // Filter Logic
    const filteredData = MOCK_DATA.filter(item => {
        if (selectedCategory !== 'All Items' && item.category !== selectedCategory) return false;
        // Mock status logic for filter demo
        if (selectedStatus === 'Critical' && item.stockLevel > 20) return false;
        if (selectedStatus === 'Low Stock' && (item.stockLevel <= 20 || item.stockLevel > 50)) return false;
        if (selectedStatus === 'In Stock' && item.stockLevel <= 50) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            <div className="pt-24 px-4 max-w-7xl mx-auto space-y-8">

                {/* Top Header & KPIs */}
                <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Inventory Overview</h1>
                        <p className="text-muted-foreground mt-1">AI-powered pricing and insights for your products</p>
                    </div>

                    <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                        {KPIS.map((kpi, idx) => (
                            <div key={idx} className="bg-card p-4 rounded-xl border border-border flex items-center justify-between min-w-[200px] shadow-sm hover:shadow-glow-sm transition-shadow">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                                </div>
                                <div className={cn("p-2 rounded-full bg-secondary border border-border", kpi.color)}>
                                    <kpi.icon className="w-5 h-5 text-zinc-500 dark:text-brand-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-4">
                    {/* Row 1: Reporting & Add (Right Aligned) */}
                    <div className="flex justify-end gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-brand-300 hover:text-zinc-900 hover:border-brand-300 dark:hover:bg-brand-400 dark:hover:text-zinc-900 transition-colors">
                            <DocumentTextIcon className="w-4 h-4" />
                            Generate Report
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-brand-300 text-zinc-900 hover:bg-brand-400 dark:bg-brand-400 dark:text-zinc-900 rounded-lg transition-colors shadow-glow-sm">
                            <PlusIcon className="w-4 h-4" />
                            Add Product
                        </button>
                    </div>

                    {/* Row 2: Filters & Search */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-sm">
                        {/* Left Filters */}
                        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto border-b border-border pb-2 lg:border-none lg:pb-0">
                            {/* Categories */}
                            <div className="flex gap-4 text-muted-foreground">
                                {['All Items', 'Sofas', 'Tables', 'Bedroom'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "hover:text-foreground transition-colors pb-2 lg:pb-0 border-b-2 lg:border-none border-transparent",
                                            selectedCategory === cat ? "text-zinc-900 dark:text-brand-400 font-bold border-brand-400" : ""
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-4 bg-border hidden lg:block"></div>

                            {/* Stock Status */}
                            <div className="flex gap-4 text-muted-foreground">
                                {['Critical', 'Low Stock', 'In Stock'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                                        className={cn(
                                            "hover:text-foreground transition-colors",
                                            selectedStatus === status ? "text-foreground font-medium" : ""
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-4 bg-border hidden lg:block"></div>

                            {/* Market Position */}
                            <div className="flex gap-4 text-muted-foreground">
                                {['Below Market', 'Competitive', 'Above Market'].map(pos => (
                                    <button key={pos} className="hover:text-foreground transition-colors">{pos}</button>
                                ))}
                            </div>
                        </div>

                        {/* Right Search & Tools */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all font-sans"
                                />
                            </div>

                            <div className="flex bg-secondary border border-border rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 rounded transition-all",
                                        viewMode === 'list' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <TableCellsIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-1.5 rounded transition-all",
                                        viewMode === 'grid' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Squares2X2Icon className="w-4 h-4" />
                                </button>
                            </div>

                            <button className="flex items-center gap-2 px-3 py-2 text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-brand-300 hover:text-zinc-900 hover:border-brand-300 dark:hover:bg-brand-400 dark:hover:text-zinc-900 transition-colors">
                                <FunnelIcon className="w-4 h-4" />
                                Sort
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content View */}
                {viewMode === 'list' ? (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4 w-12 text-center">
                                            <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-brand-400 focus:ring-0 focus:ring-offset-0" />
                                        </th>
                                        <th className="p-4">Thumbnail</th>
                                        <th className="p-4">Item Information</th>
                                        <th className="p-4">SKU</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Stock Level</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">AI Pricing Insight</th>
                                        <th className="p-4 min-w-[200px]">AI Inventory Analysis</th>
                                        <th className="p-4">Warehouse</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredData.map((item, i) => (
                                        <tr key={i} className="group hover:bg-secondary/30 transition-colors">
                                            <td className="p-4 text-center">
                                                <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-brand-400 focus:ring-0 focus:ring-offset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </td>
                                            <td className="p-4">
                                                <div className="w-10 h-10 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                                                    {item.thumbnail ? (
                                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <CubeIcon className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-foreground">{item.name}</p>
                                                <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
                                            </td>
                                            <td className="p-4 text-muted-foreground font-mono text-xs">{item.sku}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded border border-border text-xs text-muted-foreground bg-secondary">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-foreground font-medium">{item.stockLevel} units</td>
                                            <td className="p-4 text-foreground font-medium">${item.price.toFixed(2)}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                                        item.aiPricing.status === 'Competitive' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                                            item.aiPricing.status === 'Below Market' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                                                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    )}>
                                                        {item.aiPricing.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{item.aiPricing.insight}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5 w-full">
                                                    <div className="flex justify-between text-[10px] uppercase tracking-wide font-medium">
                                                        <span className="text-muted-foreground">Target: {item.aiInventory.target}</span>
                                                        <span className={cn(
                                                            item.aiInventory.statusPercentage < 40 ? "text-amber-400" :
                                                                item.aiInventory.statusPercentage > 80 ? "text-green-600 dark:text-green-400" : "text-brand-700 dark:text-brand-400"
                                                        )}>{item.aiInventory.statusPercentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                item.aiInventory.statusPercentage < 40 ? "bg-amber-500/50" :
                                                                    item.aiInventory.statusPercentage > 80 ? "bg-green-500/50" : "bg-brand-400"
                                                            )}
                                                            style={{ width: `${Math.min(item.aiInventory.statusPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        <span className="text-zinc-300">{item.aiInventory.current} units</span> in stock •
                                                        <span className="text-red-400 ml-1">{item.aiInventory.toBuild} to build</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground text-xs">{item.warehouse}</td>
                                            <td className="p-4 text-right">
                                                <button className="p-1 text-muted-foreground hover:text-white transition-colors">
                                                    <EllipsisHorizontalIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((item, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-glow-sm hover:border-brand-400/30 transition-all group flex flex-col gap-4">
                                {/* Top Section: Image & Info */}
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <CubeIcon className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground truncate">{item.name}</h3>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-mono text-zinc-500 dark:text-brand-400">{item.sku}</span>
                                                    <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                                                    <span className="text-xs border border-border px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{item.category}</span>
                                                </div>
                                            </div>
                                            <p className="font-bold text-foreground text-lg">${item.price.toFixed(2)}</p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{item.stockLevel} units</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                                                item.stockLevel > 50 ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    item.stockLevel < 20 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {item.stockLevel > 50 ? 'In Stock' : item.stockLevel < 20 ? 'Critical' : 'Low Stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-border"></div>

                                {/* AI Insights Section */}
                                <div className="space-y-3">
                                    {/* Inventory Progress */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wide">
                                            <span className="text-muted-foreground">Target: {item.aiInventory.target}</span>
                                            <span className={cn(
                                                item.aiInventory.statusPercentage < 40 ? "text-amber-400" :
                                                    item.aiInventory.statusPercentage > 80 ? "text-green-600 dark:text-green-400" : "text-brand-700 dark:text-brand-400"
                                            )}>{item.aiInventory.statusPercentage}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    item.aiInventory.statusPercentage < 40 ? "bg-amber-500/50" :
                                                        item.aiInventory.statusPercentage > 80 ? "bg-green-500/50" : "bg-brand-400"
                                                )}
                                                style={{ width: `${Math.min(item.aiInventory.statusPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-muted-foreground">{item.aiInventory.current} units in stock</span>
                                            <span className="text-red-400 font-medium">{item.aiInventory.toBuild} to build</span>
                                        </div>
                                    </div>

                                    {/* Pricing Insight */}
                                    <div className="bg-secondary/50 rounded-lg p-3 border border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ArrowTrendingUpIcon className="w-4 h-4 text-brand-400" />
                                            <span className={cn(
                                                "text-xs font-bold uppercase",
                                                item.aiPricing.status === 'Competitive' ? "text-green-400" :
                                                    item.aiPricing.status === 'Below Market' ? "text-amber-400" : "text-blue-400"
                                            )}>{item.aiPricing.status}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{item.aiPricing.insight}</p>
                                    </div>
                                </div>

                                {/* Footer Location */}
                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto pt-2">
                                    <div className="flex items-center gap-1.5">
                                        <CubeIcon className="w-3.5 h-3.5" />
                                        {item.warehouse}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPinIcon className="w-3.5 h-3.5" />
                                        {item.location}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}


                {/* Pagination - Simplified for demo */}
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t border-border">
                    <span>Showing 10 of 50 results</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 rounded bg-secondary text-muted-foreground hover:bg-zinc-700 hover:text-white transition-colors">Previous</button>
                        <button className="px-3 py-1 rounded bg-zinc-700 text-white">1</button>
                        <button className="px-3 py-1 rounded bg-secondary text-muted-foreground hover:bg-zinc-700 hover:text-white transition-colors">2</button>
                        <span className="px-2 py-1">...</span>
                        <button className="px-3 py-1 rounded bg-secondary text-muted-foreground hover:bg-zinc-700 hover:text-white transition-colors">Next</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
