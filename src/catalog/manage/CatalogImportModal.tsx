import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Building2, CheckCircle2, ChevronRight, CloudUpload, FileSearch, Globe, ImageIcon, RefreshCw, Server, Users, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface CatalogImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (data: unknown) => void;
}

type ImportStep = 'select' | 'configure' | 'processing' | 'complete';
type ProcessStage = 'scanning' | 'extracting' | 'homologating' | 'assets' | 'finalizing';
type SourceType = 'url' | 'file' | 'erp';
type TenantScope = 'current' | 'all' | 'select';

// Mock Data
const MOCK_ERP_CATALOGS = [
    { id: 'erp-1', name: 'Steelcase Matrix', version: '2024.1', items: 4500, updated: '2 days ago' },
    { id: 'erp-2', name: 'Herman Miller C-Spec', version: 'V8.2', items: 3200, updated: '1 week ago' },
    { id: 'erp-3', name: 'Haworth XML', version: '2023 Q4', items: 1800, updated: '3 weeks ago' },
    { id: 'erp-4', name: 'Knoll Auto-Sync', version: 'Live', items: 2100, updated: 'Yesterday' },
];

const MOCK_TENANTS = [
    { id: 't-1', name: 'Acme Corp HQ' },
    { id: 't-2', name: 'West Coast Branch' },
    { id: 't-3', name: 'Euro Division' },
    { id: 't-4', name: 'Retail Showrooms' },
];

export default function CatalogImportModal({ isOpen, onClose, onImportComplete }: CatalogImportModalProps) {
    const [step, setStep] = useState<ImportStep>('select');
    const [sourceType, setSourceType] = useState<SourceType>('url');
    const [url, setUrl] = useState('');

    // ERP State
    const [selectedErpCatalog, setSelectedErpCatalog] = useState<string | null>(null);

    // Tenant Selection State
    const [tenantScope, setTenantScope] = useState<TenantScope>('current');
    const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

    // Processing State
    const [processStage, setProcessStage] = useState<ProcessStage>('scanning');
    const [progress, setProgress] = useState(0);
    const [suggestedName, setSuggestedName] = useState('');

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setSourceType('url');
            setProcessStage('scanning');
            setProgress(0);
            setUrl('');
            setSelectedErpCatalog(null);
            setTenantScope('current');
            setSelectedTenants([]);
            setSuggestedName('');
        }
    }, [isOpen]);

    const handleNext = () => {
        if (step === 'select') {
            setStep('configure');
        }
    };

    const startImport = () => {
        setStep('processing');
        setProgress(0);

        // Simulate a complex scraping/homologation process
        const stages: { stage: ProcessStage; duration: number; progressCheck: number }[] = [
            { stage: 'scanning', duration: 1500, progressCheck: 20 },
            { stage: 'extracting', duration: 2000, progressCheck: 45 },
            { stage: 'homologating', duration: 2500, progressCheck: 70 },
            { stage: 'assets', duration: 2000, progressCheck: 90 },
            { stage: 'finalizing', duration: 1000, progressCheck: 100 },
        ];

        let currentStageIndex = 0;

        const runStage = () => {
            if (currentStageIndex >= stages.length) {
                let defaultName = 'Imported Catalog';
                if (sourceType === 'url') defaultName = 'Web Import ' + new Date().toLocaleDateString();
                if (sourceType === 'erp' && selectedErpCatalog) {
                    const cat = MOCK_ERP_CATALOGS.find(c => c.id === selectedErpCatalog);
                    defaultName = cat ? cat.name : 'ERP Catalog';
                }
                setSuggestedName(defaultName);

                setStep('complete');
                return;
            }

            const current = stages[currentStageIndex];
            setProcessStage(current.stage);

            // Smooth progress update
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= current.progressCheck) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, current.duration / 20);

            setTimeout(() => {
                clearInterval(interval);
                setProgress(current.progressCheck);
                currentStageIndex++;
                runStage();
            }, current.duration);
        };

        runStage();
    };

    const handleComplete = () => {
        onImportComplete({
            name: suggestedName || 'Imported Catalog',
            source: sourceType,
            items: sourceType === 'erp' ? 4500 : 124, // Mock
            syncStatus: 'Synced'
        });
        onClose();
    };

    const toggleTenant = (id: string) => {
        setSelectedTenants(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const renderProcessingState = () => {
        const stageInfo = {
            scanning: { label: 'Scanning Source', icon: FileSearch, detail: 'Analyzing structure and taxonomy...' },
            extracting: { label: 'Extracting Products', icon: Server, detail: 'Found Items. Parsing attributes...' },
            homologating: { label: 'Homologating Data', icon: RefreshCw, detail: 'Mapping fields to DS Standard...' },
            assets: { label: 'Downloading Assets', icon: ImageIcon, detail: 'Optimizing product images...' },
            finalizing: { label: 'Finalizing Import', icon: CheckCircle2, detail: 'Indexing for search...' },
        }[processStage];

        const Icon = stageInfo.icon;

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="relative bg-background p-4 rounded-full border border-primary/20 shadow-xl shadow-primary/10">
                        <Icon className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>

                <h3 className="text-lg font-medium text-foreground mb-2">{stageInfo.label}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">{stageInfo.detail}</p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs bg-secondary rounded-full h-2 mb-2 overflow-hidden">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between w-full max-w-xs text-xs text-muted-foreground">
                    <span>{progress}% Complete</span>
                    <span className="capitalize">{processStage}</span>
                </div>

                {/* Terminal Effect Log */}
                <div className="mt-8 w-full max-w-sm bg-zinc-900 rounded-lg p-3 text-left font-mono text-xs text-green-400 opacity-80 shadow-inner">
                    <p>{'>'} connect --source="{sourceType}"</p>
                    <p className={cn(progress > 10 && 'block', 'hidden')}>{'>'} connection established</p>
                    <p className={cn(progress > 30 && 'block', 'hidden')}>{'>'} schema validated</p>
                    {tenantScope !== 'current' && (
                        <p className={cn(progress > 40 && 'block', 'hidden')}>{'>'} applying to {tenantScope === 'all' ? 'all tenants' : `${selectedTenants.length} tenants`}</p>
                    )}
                    <p className={cn(progress > 50 && 'block', 'hidden')}>{'>'} mapping categories...</p>
                    <span className="animate-pulse">_</span>
                </div>
            </div>
        );
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog onClose={step === 'processing' ? () => { } : onClose} className="relative z-50">
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-2xl bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <Dialog.Title className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <CloudUpload className="w-5 h-5 text-zinc-500" />
                                    Import Catalog
                                </Dialog.Title>
                                {step !== 'processing' && (
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-zinc-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* STEP 1: SELECT SOURCE */}
                                {step === 'select' && (
                                    <div className="p-6">
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <button
                                                onClick={() => setSourceType('url')}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                                                    sourceType === 'url'
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-input hover:border-input text-muted-foreground"
                                                )}
                                            >
                                                <Globe className="w-8 h-8" />
                                                <span className="font-medium text-sm">Web Scraper</span>
                                            </button>
                                            <button
                                                onClick={() => setSourceType('file')}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                                                    sourceType === 'file'
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-input hover:border-input text-muted-foreground"
                                                )}
                                            >
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="font-medium text-sm">File Upload</span>
                                            </button>
                                            <button
                                                onClick={() => setSourceType('erp')}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all",
                                                    sourceType === 'erp'
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-input hover:border-input text-muted-foreground"
                                                )}
                                            >
                                                <Server className="w-8 h-8" />
                                                <span className="font-medium text-sm">ERP Sync</span>
                                            </button>
                                        </div>

                                        {sourceType === 'url' && (
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-foreground">Catalog URL</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        placeholder="https://manufacturer.com/catalog/2026/q1"
                                                        className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                                        value={url}
                                                        onChange={(e) => setUrl(e.target.value)}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                    <span className="font-semibold">AI Assistant:</span> I will traverse the manufacturer's site and extract product data.
                                                </p>
                                            </div>
                                        )}

                                        {sourceType === 'file' && (
                                            <div className="border-2 border-dashed border-input rounded-xl p-8 text-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                                                <CloudUpload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-foreground">Click to upload catalog file</p>
                                                <p className="text-xs text-muted-foreground mt-1">Supports JSON, CSV, XML</p>
                                            </div>
                                        )}

                                        {sourceType === 'erp' && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                <label className="block text-sm font-medium text-foreground">Available ERP Catalogs</label>
                                                <div className="border border-input rounded-xl overflow-hidden">
                                                    <div className="max-h-[200px] overflow-y-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                                                                <tr>
                                                                    <th className="px-4 py-3 font-medium">Catalog Name</th>
                                                                    <th className="px-4 py-3 font-medium">Version</th>
                                                                    <th className="px-4 py-3 font-medium">Items</th>
                                                                    <th className="px-4 py-3 font-medium">Updated</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {MOCK_ERP_CATALOGS.map(cat => (
                                                                    <tr
                                                                        key={cat.id}
                                                                        onClick={() => setSelectedErpCatalog(cat.id)}
                                                                        className={cn(
                                                                            "cursor-pointer transition-colors",
                                                                            selectedErpCatalog === cat.id
                                                                                ? "bg-primary/10 dark:bg-primary/20"
                                                                                : "hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        <td className="px-4 py-3 font-medium text-foreground">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedErpCatalog === cat.id ? "border-primary bg-primary" : "border-input")}>
                                                                                    {selectedErpCatalog === cat.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                                </div>
                                                                                {cat.name}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-muted-foreground">{cat.version}</td>
                                                                        <td className="px-4 py-3 text-muted-foreground">{cat.items}</td>
                                                                        <td className="px-4 py-3 text-muted-foreground">{cat.updated}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 2: CONFIGURE TENANTS */}
                                {step === 'configure' && (
                                    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-1">Catalog Availability</h3>
                                            <p className="text-sm text-muted-foreground">Select which tenants will have access to this catalog.</p>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Option 1: Current Tenant */}
                                            <label className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                tenantScope === 'current' ? "border-primary bg-primary/5" : "border-input hover:border-input"
                                            )}>
                                                <input
                                                    type="radio"
                                                    name="tenantScope"
                                                    value="current"
                                                    checked={tenantScope === 'current'}
                                                    onChange={() => setTenantScope('current')}
                                                    className="w-5 h-5 text-primary border-zinc-300 focus:ring-primary"
                                                />
                                                <div>
                                                    <div className="font-medium text-foreground">Current Tenant Only</div>
                                                    <div className="text-xs text-muted-foreground">Available only to users in this workspace.</div>
                                                </div>
                                                <Building2 className="w-6 h-6 text-zinc-400 ml-auto" />
                                            </label>

                                            {/* Option 2: All Tenants */}
                                            <label className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                tenantScope === 'all' ? "border-primary bg-primary/5" : "border-input hover:border-input"
                                            )}>
                                                <input
                                                    type="radio"
                                                    name="tenantScope"
                                                    value="all"
                                                    checked={tenantScope === 'all'}
                                                    onChange={() => setTenantScope('all')}
                                                    className="w-5 h-5 text-primary border-zinc-300 focus:ring-primary"
                                                />
                                                <div>
                                                    <div className="font-medium text-foreground">All Tenants</div>
                                                    <div className="text-xs text-muted-foreground">Make this catalog globally available to all organizations.</div>
                                                </div>
                                                <Globe className="w-6 h-6 text-zinc-400 ml-auto" />
                                            </label>

                                            {/* Option 3: Specific Tenants */}
                                            <label className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                tenantScope === 'select' ? "border-primary bg-primary/5" : "border-input hover:border-input"
                                            )}>
                                                <input
                                                    type="radio"
                                                    name="tenantScope"
                                                    value="select"
                                                    checked={tenantScope === 'select'}
                                                    onChange={() => setTenantScope('select')}
                                                    className="w-5 h-5 text-primary border-zinc-300 focus:ring-primary"
                                                />
                                                <div>
                                                    <div className="font-medium text-foreground">Specific Tenants</div>
                                                    <div className="text-xs text-muted-foreground">Choose specific organizations from the list.</div>
                                                </div>
                                                <Users className="w-6 h-6 text-zinc-400 ml-auto" />
                                            </label>
                                        </div>

                                        {/* Multi-select List */}
                                        {tenantScope === 'select' && (
                                            <div className="mt-4 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                <div className="bg-muted/50 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                                                    Select Tenants
                                                </div>
                                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[150px] overflow-y-auto">
                                                    {MOCK_TENANTS.map(tenant => (
                                                        <div
                                                            key={tenant.id}
                                                            onClick={() => toggleTenant(tenant.id)}
                                                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer"
                                                        >
                                                            <div className={cn(
                                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                                selectedTenants.includes(tenant.id)
                                                                    ? "bg-primary border-primary text-white"
                                                                    : "border-input bg-background"
                                                            )}>
                                                                {selectedTenants.includes(tenant.id) && <X className="w-3 h-3 rotate-45" style={{ transform: 'rotate(0deg)' }} />}
                                                                {/* Using Check icon but XMark is imported, let me just use absolute check logic or generic svg */}
                                                                {selectedTenants.includes(tenant.id) && (
                                                                    <svg viewBox="0 0 14 14" className="w-3 h-3 fill-current"><path d="M3,7 L6,10 L11,4" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-foreground">{tenant.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}


                                {step === 'processing' && renderProcessingState()}

                                {step === 'complete' && (
                                    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">Import Successful!</h3>
                                        <p className="text-muted-foreground mb-8">
                                            Successfully processed {sourceType === 'erp' ? 'ERP catalog' : 'catalog'} data.
                                            <br />
                                            {tenantScope === 'all' && <span className="text-xs bg-secondary px-2 py-1 rounded mt-2 inline-block">Applies to All Tenants</span>}
                                            {tenantScope === 'select' && <span className="text-xs bg-secondary px-2 py-1 rounded mt-2 inline-block">Applies to {selectedTenants.length} Tenants</span>}
                                        </p>

                                        {/* AI Suggested Name Input */}
                                        <div className="w-full max-w-sm mb-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
                                            <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                                                <span>A.I. Suggested Name</span>
                                                <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Editable</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={suggestedName}
                                                onChange={(e) => setSuggestedName(e.target.value)}
                                                className="w-full px-4 py-3 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background outline-none transition-all text-foreground font-medium shadow-sm"
                                                placeholder="Enter catalog name..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center mb-8">
                                            <div className="bg-secondary/50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-foreground">{sourceType === 'erp' ? 4500 : 124}</div>
                                                <div className="text-xs text-muted-foreground">Products</div>
                                            </div>
                                            <div className="bg-secondary/50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-foreground">Active</div>
                                                <div className="text-xs text-muted-foreground">Status</div>
                                            </div>
                                            <div className="bg-secondary/50 p-3 rounded-lg">
                                                <div className="text-2xl font-bold text-foreground">100%</div>
                                                <div className="text-xs text-muted-foreground">Accuracy</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {(step === 'select' || step === 'configure') && (
                                <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/50">
                                    <button
                                        onClick={step === 'configure' ? () => setStep('select') : onClose}
                                        className="px-4 py-2 bg-background border border-input hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                                    >
                                        {step === 'configure' ? 'Back' : 'Cancel'}
                                    </button>

                                    {step === 'select' ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={(sourceType === 'url' && !url) || (sourceType === 'erp' && !selectedErpCatalog)}
                                            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={startImport}
                                            disabled={tenantScope === 'select' && selectedTenants.length === 0}
                                            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Start Import
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === 'complete' && (
                                <div className="p-4 border-t border-border flex justify-center w-full">
                                    <button
                                        onClick={handleComplete}
                                        className="w-full max-w-sm px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
