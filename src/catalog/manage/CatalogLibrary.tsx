import React, { useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { AlertCircle, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, CircleUser, Clock, CloudUpload, Filter, RefreshCw, Search, Sparkles, Store, Tag, Trash2, TrendingDown, TrendingUp, Wrench, X } from 'lucide-react';
import CatalogImportModal from './CatalogImportModal';
import QuoteSetupModal from './QuoteSetupModal';

// Mock Data for Initial State
const INITIAL_CATALOGS = [
    {
        id: 1,
        name: 'Steelcase',
        version: 'July 2023',
        items: 86,
        lastSync: '2 hrs ago',
        cover: 'bg-red-600',
        status: 'Active',
        owner: 'John Doe',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 2,
        name: 'MillerKnoll',
        version: 'Q3 2023',
        items: 124,
        lastSync: '1 day ago',
        cover: 'bg-zinc-800',
        status: 'Active',
        owner: 'Sarah Smith',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 3,
        name: 'Herman Miller',
        version: '2023 Master',
        items: 312,
        lastSync: '4 days ago',
        cover: 'bg-blue-600',
        status: 'Update Avail.',
        owner: 'John Doe',
        image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 4,
        name: 'Haworth',
        version: 'Seating 2023',
        items: 54,
        lastSync: '1 week ago',
        cover: 'bg-amber-500',
        status: 'Active',
        owner: 'Mike Johnson',
        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800'
    },
];

interface SyncResult {
    id: string;
    name: string;
    type: 'price_increase' | 'price_decrease' | 'discontinued' | 'new' | 'spec_update';
    details: string;
}

// Mock logs generator
const generateLogs = (id: number) => [
    { type: 'price_increase', msg: 'Price increased by 5%', details: 'Aeron Chair', time: '2 hours ago' },
    { type: 'spec_update', msg: 'New fabric options added', details: 'Embody Gaming', time: '1 day ago' },
    { type: 'new', msg: 'New variant added to catalog', details: 'Sayl Chair', time: 'Yesterday' },
    { type: 'discontinued', msg: 'Item Discontinued', details: 'Canvas Channel', time: '3 days ago' },
];

export default function CatalogLibrary() {
    const [catalogs, setCatalogs] = useState(INITIAL_CATALOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        owner: 'All',
        status: 'All',
        manufacturer: 'All'
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Quote Flow State
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [selectedCatalogForQuote, setSelectedCatalogForQuote] = useState<string>('');

    // Sync Simulation State
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [syncStatus, setSyncStatus] = useState<string>('');
    const [syncResults, setSyncResults] = useState<Record<number, SyncResult[]>>({});
    const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);

    // History View State
    const [historyView, setHistoryView] = useState<Record<number, boolean>>({});

    // Derived Lists for Filters
    const owners = ['All', ...new Set(INITIAL_CATALOGS.map(c => c.owner))];
    const statuses = ['All', ...new Set(INITIAL_CATALOGS.map(c => c.status))];
    const manufacturers = ['All', ...new Set(INITIAL_CATALOGS.map(c => c.name.split(' ')[0]))]; // Simple split implementation

    const handleImportComplete = (newCatalog: any) => {
        setCatalogs(prev => [
            {
                id: Date.now(),
                name: newCatalog.name,
                version: 'Imported v1',
                items: newCatalog.items,
                lastSync: 'Just now',
                cover: 'bg-green-600',
                status: 'Processing',
                owner: 'Current User',
                image: ''
            },
            ...prev
        ]);
        showNotification('Catalog imported successfully', 'success');
    };

    const confirmDelete = () => {
        if (deleteId) {
            setCatalogs(prev => prev.filter(c => c.id !== deleteId));
            showNotification('Catalog deleted successfully', 'success'); // Changed to success for verify
            setDeleteId(null);
        }
    };

    const handleSync = async (id: number) => {
        setSyncingId(id);
        setSyncResults(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        setSyncStatus('Connecting to manufacturer...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSyncStatus('Downloading asset manifest...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSyncStatus('Processing delta updates...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        setCatalogs(prev => prev.map(cat => {
            if (cat.id === id) {
                return { ...cat, lastSync: 'Just now', status: 'Active', items: cat.items + Math.floor(Math.random() * 5) };
            }
            return cat;
        }));

        const mockResults: SyncResult[] = [
            { id: '1', name: 'Aeron Chair', type: 'price_increase' as const, details: 'Price increased by 5%' },
            { id: '2', name: 'Embody Gaming', type: 'spec_update' as const, details: 'New fabric options added' },
            { id: '3', name: 'Sayl Chair', type: 'new' as const, details: 'New variant added to catalog' },
            { id: '4', name: 'Canvas Channel', type: 'discontinued' as const, details: 'Item Discontinued' },
        ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);

        setSyncResults(prev => ({ ...prev, [id]: mockResults }));
        setSyncingId(null);
        setSyncStatus('');
        showNotification(`Sync complete: ${mockResults.length} assets updated`, 'success');
    };

    const toggleResults = (id: number) => {
        setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleHistory = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setHistoryView(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const clearResults = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSyncResults(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleOpenQuote = (catalogName: string) => {
        setSelectedCatalogForQuote(catalogName);
        setQuoteModalOpen(true);
    };

    const showNotification = (msg: string, type: 'success' | 'info' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredCatalogs = catalogs.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOwner = filters.owner === 'All' || cat.owner === filters.owner;
        const matchesStatus = filters.status === 'All' || cat.status === filters.status;
        const matchesManufacturer = filters.manufacturer === 'All' || cat.name.toLowerCase().includes(filters.manufacturer.toLowerCase());
        return matchesSearch && matchesOwner && matchesStatus && matchesManufacturer;
    });

    const activeFilterCount = Object.values(filters).filter(v => v !== 'All').length;

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-zinc-800">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-sm">{notification.msg}</span>
                    </div>
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search catalogs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium shadow-sm",
                                showFilters || activeFilterCount > 0
                                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-brand-300 dark:hover:bg-brand-600/50 text-foreground"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm shadow-primary/20"
                        >
                            <CloudUpload className="w-5 h-5" />
                            Import Catalog
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Product Owner</label>
                            <select
                                value={filters.owner}
                                onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                            >
                                {owners.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                            >
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Manufacturer</label>
                            <select
                                value={filters.manufacturer}
                                onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                            >
                                {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                            <button
                                onClick={() => setFilters({ owner: 'All', status: 'All', manufacturer: 'All' })}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCatalogs.map(catalog => (
                    <div key={catalog.id} className="group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-glow-sm transition-all hover:border-primary/50 cursor-pointer flex flex-col relative z-0 h-[380px]">
                        {/* Cover Area */}
                        <div
                            className={`h-32 ${catalog.cover} p-6 flex items-end relative rounded-t-2xl shrink-0`}
                            style={catalog.image ? { backgroundImage: `url(${catalog.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-2xl" />
                            <h3 className="text-white font-bold text-xl relative z-10">{catalog.name}</h3>
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-medium border border-white/10 z-10">
                                {catalog.items} Items
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4 rounded-b-2xl overflow-hidden bg-white dark:bg-zinc-800">
                            {historyView[catalog.id] ? (
                                // History View
                                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
                                        <h4 className="text-sm font-semibold text-foreground">History Log</h4>
                                        <button
                                            onClick={(e) => toggleHistory(catalog.id, e)}
                                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {generateLogs(catalog.id).map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-xs border border-zinc-100 dark:border-zinc-800">
                                                <div className="mt-0.5 shrink-0">
                                                    {item.type === 'price_increase' && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                                                    {item.type === 'spec_update' && <Wrench className="w-3.5 h-3.5 text-blue-500" />}
                                                    {item.type === 'new' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                                                    {item.type === 'discontinued' && <Trash2 className="w-3.5 h-3.5 text-zinc-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{item.details}</p>
                                                    <p className="text-muted-foreground">{item.msg}</p>
                                                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 mt-auto text-center border-t border-zinc-100 dark:border-zinc-800">
                                        <button className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium hover:underline transition-colors">
                                            View Full Audit Trail
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Standard View
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {catalog.version}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catalog.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                catalog.status === 'Processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {catalog.status}
                                            </span>
                                        </div>

                                        {/* Owner Info (New) */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CircleUser className="w-4 h-4" />
                                            Owner: {catalog.owner}
                                        </div>

                                        {/* Last Sync Text */}
                                        <div className="text-[10px] text-zinc-400 h-4">
                                            {syncingId === catalog.id ? (
                                                <span className="text-zinc-700 dark:text-zinc-300 animate-pulse font-medium">{syncStatus}</span>
                                            ) : (
                                                `Last synced ${catalog.lastSync}`
                                            )}
                                        </div>

                                        {/* Sync Results Expansion */}
                                        {syncResults[catalog.id] && (
                                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleResults(catalog.id); }}
                                                    className="w-full flex items-center justify-between text-xs px-2 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {syncResults[catalog.id].length} updates available
                                                    </div>
                                                    {expandedResults[catalog.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>

                                                {expandedResults[catalog.id] && (
                                                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar pr-1">
                                                        {syncResults[catalog.id].map((result, idx) => (
                                                            <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 text-[11px]">
                                                                {result.type === 'price_increase' && <TrendingUp className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />}
                                                                {result.type === 'price_decrease' && <TrendingDown className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />}
                                                                {result.type === 'discontinued' && <Trash2 className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />}
                                                                {result.type === 'new' && <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
                                                                {result.type === 'spec_update' && <Wrench className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />}

                                                                <div className="flex-1">
                                                                    <div className="font-medium text-foreground">{result.name}</div>
                                                                    <div className="text-muted-foreground">{result.details}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={(e) => clearResults(catalog.id, e)}
                                                            className="w-full text-center text-[10px] text-zinc-400 hover:text-foreground py-1 mt-1 transition-colors"
                                                        >
                                                            Dismiss Report
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                                        <div className="flex items-center gap-1">
                                            {/* Sync Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSync(catalog.id); }}
                                                disabled={syncingId === catalog.id}
                                                className={`p-2 rounded-lg transition-colors ${syncingId === catalog.id ? 'animate-spin text-zinc-500' : 'hover:bg-brand-300 dark:hover:bg-brand-600/50 text-muted-foreground hover:text-zinc-900 dark:hover:text-white'}`}
                                                title="Sync Catalog"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>

                                            {/* History Toggle Button */}
                                            <button
                                                onClick={(e) => toggleHistory(catalog.id, e)}
                                                className={`p-2 rounded-lg transition-colors ${historyView[catalog.id] ? 'bg-zinc-100 dark:bg-zinc-800 text-foreground' : 'hover:bg-brand-300 dark:hover:bg-brand-600/50 text-muted-foreground hover:text-zinc-900 dark:hover:text-white'}`}
                                                title="View History Log"
                                            >
                                                <Clock className="w-4 h-4" />
                                            </button>

                                            {/* Delete Button (New) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(catalog.id); }}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                                                title="Delete Catalog"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenQuote(catalog.name); }}
                                            className="text-zinc-900 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white text-xs font-semibold bg-zinc-100 hover:bg-brand-300 dark:bg-zinc-800 dark:hover:bg-brand-600/50 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                                        >
                                            Create Quote
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Simulated Empty State */}
                {filteredCatalogs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        <Store className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                        <p>No catalogs found matching your filters.</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilters({ owner: 'All', status: 'All', manufacturer: 'All' });
                            }}
                            className="mt-4 text-zinc-500 hover:text-zinc-900 underline hover:no-underline transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Transition appear show={deleteId !== null} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setDeleteId(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 p-6 text-left align-middle shadow-xl transition-all border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-foreground"
                                        >
                                            Delete Catalog?
                                        </Dialog.Title>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground">
                                            Are you sure you want to delete this catalog? This action cannot be undone and will remove all associated pricing and rule configurations.
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                            onClick={() => setDeleteId(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                                            onClick={confirmDelete}
                                        >
                                            Delete Catalog
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <CatalogImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={handleImportComplete}
            />

            <QuoteSetupModal
                isOpen={quoteModalOpen}
                onClose={() => setQuoteModalOpen(false)}
                catalogName={selectedCatalogForQuote}
            />
        </div>
    );
}

function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}
