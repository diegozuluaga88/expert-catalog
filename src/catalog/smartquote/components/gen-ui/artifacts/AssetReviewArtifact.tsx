import { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    FunnelIcon,
    ChevronDownIcon,
    PencilSquareIcon,
    TrashIcon,
    BoltIcon,
    SparklesIcon,
    ArrowLongRightIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ArrowLeftIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useGenUI } from '../../../context/GenUIContext';
import EditAssetModal from './AssetReview/EditAssetModal';
import AISuggestionPanel from './AssetReview/AISuggestionPanel';
import DiscountStructureWidget from './AssetReview/DiscountStructureWidget';
import SuccessModal from './AssetReview/SuccessModal';

import MappingField from './AssetReview/MappingField';
import SuggestionModal from './AssetReview/SuggestionModal';
import DiscrepancyResolverArtifact, { type DiscrepancyItem } from './DiscrepancyResolverArtifact';

// Types
export interface AssetType {
    id: string;
    description: string;
    sku: string;
    qty: number;
    unitPrice: number;
    basePrice: number;
    totalPrice: number;
    status: 'validated' | 'review' | 'suggestion';
    issues?: string[];
    warranty?: string; // New field
    suggestion?: {
        sku: string;
        price: number;
        reason: string;
    };
}

export default function AssetReviewArtifact({ data, source = 'upload' }: { data: any, source?: 'upload' | 'erp' }) {
    const { sendMessage } = useGenUI();
    const [filter, setFilter] = useState<'all' | 'attention' | 'validated'>('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<AssetType | null>(null);

    // Initialize step based on source: ERP data is pre-mapped, so skip to review
    // Modified: Autonomous flow now starts at 'report' instead of 'map'
    const [currentStep, setCurrentStep] = useState<'map' | 'report' | 'review' | 'discount' | 'finalize'>(source === 'erp' ? 'review' : 'report');
    const [finalType, setFinalType] = useState<'quote' | 'po'>('po');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isMappingExpanded, setIsMappingExpanded] = useState(true);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [selectedSuggestionAsset, setSelectedSuggestionAsset] = useState<AssetType | null>(null);
    const [isResolverOpen, setIsResolverOpen] = useState(false);

    // Mock Header & Rule Issues (New for Unified Resolution)
    const [headerIssues, setHeaderIssues] = useState<DiscrepancyItem[]>([
        {
            id: 'h-1',
            type: 'header',
            title: 'Reference Number Mismatch',
            description: 'PO #12345 vs Extracted "PO-12345-RevA"',
            severity: 'medium',
            original: { label: 'Input PO', value: '12345' },
            suggestion: {
                label: 'Extracted PO',
                value: 'PO-12345-RevA',
                reason: 'Document header contains Revision suffix.',
                confidence: 92
            }
        }
    ]);

    const [ruleIssues, setRuleIssues] = useState<DiscrepancyItem[]>([
        {
            id: 'r-1',
            type: 'rule',
            title: 'Margin Threshold Alert',
            description: 'Project margin below 25% target',
            severity: 'high',
            original: { label: 'Current Margin', value: '22%' },
            suggestion: {
                label: 'Target Margin',
                value: '25%',
                reason: 'Standard dealer policy requires 25% min margin.',
                confidence: 100
            }
        }
    ]);

    // Mock Mapping Data
    const [mappingFields, setMappingFields] = useState<{
        label: string;
        originalField: string;
        description: string;
        status: 'review' | 'matched';
        confidence: number;
        value: string;
        suggestions: { value: string; confidence: number; description: string; }[];
    }[]>([
        {
            label: "Delivery Date",
            originalField: "date_req",
            description: "2024-03-15",
            status: "review",
            confidence: 75,
            value: "Requested Delivery Date",
            suggestions: [
                { value: "Requested Delivery Date", confidence: 75, description: "Matches date format and 'req' suffix context." },
                { value: "Ship By Date", confidence: 60, description: "Alternative date field found in header." },
                { value: "Project Start Date", confidence: 45, description: "Less likely based on context." }
            ]
        },
        {
            label: "Finish / Color",
            originalField: "item_finish_code",
            description: "WAL-001 (Walnut)",
            status: "review",
            confidence: 70,
            value: "Material Finish",
            suggestions: [
                { value: "Material Finish", confidence: 70, description: "Detected 'finish' keyword and material code pattern." },
                { value: "Color Option", confidence: 65, description: "Could map to generic color field." }
            ]
        },
        {
            label: "Delivery Address",
            originalField: "ship_addr_l1",
            description: "10948 WILLOW COURT, #200, San Diego CA...",
            status: "review",
            confidence: 65,
            value: "Ship To Address",
            suggestions: [
                { value: "Ship To Address", confidence: 65, description: "Address format detected." },
                { value: "Bill To Address", confidence: 40, description: "Address format, but 'ship' prefix suggests otherwise." }
            ]
        },
        {
            label: "Quantity",
            originalField: "qty_ordered",
            description: "45",
            status: "review",
            confidence: 60,
            value: "Item Quantity",
            suggestions: [
                { value: "Item Quantity", confidence: 85, description: "Numeric field with 'qty' label." },
                { value: "Pack Size", confidence: 30, description: "Unlikely for main order line." }
            ]
        }
    ]);

    const handleApplyMapping = (label: string, newValue: string) => {
        setMappingFields(prev => prev.map(f =>
            f.label === label
                ? { ...f, value: newValue, status: 'matched', confidence: 100 }
                : f
        ));
    };

    // Derived State
    const unmappedFields = mappingFields.filter(f => f.status !== 'matched');
    const matchedFields = mappingFields.filter(f => f.status === 'matched');

    // Mock Data (will come from `data` prop later)
    const [assets, setAssets] = useState<AssetType[]>(data?.assets?.map((a: any) => ({ ...a, warranty: 'Standard Warranty' })) || [
        {
            id: '1',
            description: 'Executive Task Chair',
            sku: 'CHAIR-EXEC-2024',
            qty: 150,
            unitPrice: 895.00,
            totalPrice: 134250.00,
            status: 'validated',
            warranty: 'Standard Warranty'
        },
        {
            id: '2',
            description: 'Conf Chair (Leather)',
            sku: 'CHR-CONF-LTH',
            qty: 8,
            unitPrice: 850.00,
            totalPrice: 6800.00,
            status: 'review',
            issues: ['Needs review'],
            warranty: 'Standard Warranty'
        },
        {
            id: '3',
            description: 'Height Adjustable Workstation',
            sku: 'DESK-ELECTRIC-7230',
            qty: 95,
            unitPrice: 1250.00,
            totalPrice: 118750.00,
            status: 'suggestion',
            suggestion: {
                sku: 'DESK-ELECTRIC-7230-BUDGET',
                price: 1100.00,
                reason: 'Budget alternative available (Save $150/unit)'
            },
            warranty: 'Standard Warranty'
        },
        {
            id: '4',
            description: 'Ergonomic Office Chair',
            sku: 'CHAIR-ERG-001',
            qty: 85,
            unitPrice: 425.00,
            totalPrice: 36125.00,
            status: 'validated',
            warranty: 'Standard Warranty'
        }
    ]);

    const [isWarrantyMenuOpen, setIsWarrantyMenuOpen] = useState(false);
    const [pricingStep, setPricingStep] = useState<'warranties' | 'discounts'>('warranties');

    const handleApplyWarranty = (warrantyName: string, scope: 'all' | 'single' = 'single', assetId?: string) => {
        const getPriceIncrease = (w: string) => {
            if (w.includes('Extended')) return 50;
            if (w.includes('Premium')) return 120;
            return 0;
        };

        setAssets(prev => prev.map(a => {
            const base = a.basePrice !== undefined ? a.basePrice : a.unitPrice;
            const shouldUpdate = scope === 'all' || (scope === 'single' && a.id === assetId);

            if (shouldUpdate) {
                const increase = getPriceIncrease(warrantyName);
                const newUnitPrice = base + increase;
                return {
                    ...a,
                    basePrice: base,
                    warranty: warrantyName,
                    unitPrice: newUnitPrice,
                    totalPrice: newUnitPrice * a.qty
                };
            }
            // Ensure basePrice is preserved/set
            return { ...a, basePrice: base };
        }));
        setIsWarrantyMenuOpen(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleEdit = (asset: AssetType) => {
        setEditingAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleViewSuggestion = (asset: AssetType) => {
        setSelectedSuggestionAsset(asset);
        setIsSuggestionModalOpen(true);
    };

    const handleSaveAsset = (updatedAsset: AssetType) => {
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? { ...updatedAsset, status: 'validated', issues: [] } : a));
    };

    const handleAcceptSuggestion = (assetId: string) => {
        setAssets(prev => prev.map(a => {
            if (a.id === assetId && a.suggestion) {
                return {
                    ...a,
                    sku: a.suggestion.sku,
                    unitPrice: a.suggestion.price,
                    totalPrice: a.qty * a.suggestion.price,
                    status: 'validated',
                    suggestion: undefined
                };
            }
            return a;
        }));
        setIsSuggestionModalOpen(false); // Close modal on accept
    };

    const handleRejectSuggestion = (assetId: string) => {
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'validated', suggestion: undefined } : a));
        setIsSuggestionModalOpen(false); // Close modal on reject
    };

    const [activeAccordion, setActiveAccordion] = useState<string | null>('assets');

    const handleResolveDiscrepancy = (id: string, action: 'accept' | 'keep' | 'manual', data?: any) => {
        // Handle Header/Rule issues
        if (id.startsWith('h-')) {
            setHeaderIssues(prev => prev.filter(i => i.id !== id));
            return;
        }
        if (id.startsWith('r-')) {
            setRuleIssues(prev => prev.filter(i => i.id !== id));
            return;
        }

        // Handle Asset issues
        setAssets(prev => prev.map(a => {
            if (a.id !== id) return a;

            if (action === 'accept') {
                if (a.suggestion) {
                    return {
                        ...a,
                        sku: a.suggestion.sku,
                        unitPrice: a.suggestion.price,
                        totalPrice: a.qty * a.suggestion.price,
                        status: 'validated',
                        suggestion: undefined,
                        issues: []
                    };
                } else {
                    // Accept without suggestion (resolve warning)
                    return {
                        ...a,
                        status: 'validated',
                        suggestion: undefined,
                        issues: []
                    };
                }
            }
            if (action === 'keep') {
                return {
                    ...a,
                    status: 'validated',
                    suggestion: undefined,
                    issues: []
                };
            }
            return a;
        }));
    };

    const filteredAssets = assets.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'attention') return a.status === 'review' || a.status === 'suggestion';
        if (filter === 'validated') return a.status === 'validated';
        return true;
    });

    const stats = {
        total: assets.length,
        attention: assets.filter(a => a.status === 'review' || a.status === 'suggestion').length,
        validated: assets.filter(a => a.status === 'validated').length,
        totalValue: assets.reduce((acc, curr) => acc + curr.totalPrice, 0)
    };

    const totalIssues = headerIssues.length + ruleIssues.length + stats.attention;

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
            {/* Header / Status Bar */}
            <div className="shrink-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold font-brand text-foreground flex items-center gap-2">
                            A.I. Asset Processing
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Beta</span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {totalIssues > 0
                                ? `${totalIssues} items require human review`
                                : "All assets validated. Ready for submission."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Optional Actions Menu */}
                    <div className="flex items-center border-r border-zinc-200 dark:border-zinc-800 pr-3 gap-2">
                        <button
                            onClick={() => setIsWarrantyMenuOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            Warranties
                        </button>
                        <button
                            onClick={() => setPricingStep('discounts')} // Re-using state for now to show discount widget
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <TagIcon className="w-4 h-4" />
                            Discounts
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors text-foreground">
                        <DocumentTextIcon className="w-4 h-4" />
                        Save Draft
                    </button>

                    <button
                        onClick={() => {
                            if (totalIssues === 0) setCurrentStep('finalize');
                        }}
                        disabled={totalIssues > 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${totalIssues > 0
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                            }`}
                    >
                        {totalIssues > 0 ? (
                            <>
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                Resolve Issues
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Finalize & Submit
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Unified Dashboard */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-800/50">

                    {/* Status Summary & Exceptions */}
                    <div className="p-6 pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Validated Stats */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Validated Assets</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{stats.validated}</p>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-lg">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Total Value */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Value</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.totalValue)}</p>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-lg">
                                    <ChartBarIcon className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${totalIssues > 0
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
                                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800'
                                }`}>
                                <div>
                                    <p className={`text-xs font-medium uppercase tracking-wider ${totalIssues > 0 ? 'text-amber-700 dark:text-amber-500' : 'text-muted-foreground'}`}>
                                        {totalIssues > 0 ? 'Action Required' : 'Status'}
                                    </p>
                                    <p className={`text-lg font-bold mt-1 ${totalIssues > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-foreground'}`}>
                                        {totalIssues > 0 ? `${totalIssues} Issues Found` : 'Ready to Process'}
                                    </p>
                                </div>
                                {totalIssues > 0 && (
                                    <button
                                        onClick={() => setIsResolverOpen(true)}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md transition-transform active:scale-95"
                                    >
                                        Resolve Now
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* AI Mappings / Context (Collapsible) */}
                        <div className="mb-4">
                            <button
                                onClick={() => setIsMappingExpanded(!isMappingExpanded)}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
                            >
                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isMappingExpanded ? '' : '-rotate-90'}`} />
                                Detected Context & Mappings
                            </button>

                            {isMappingExpanded && (
                                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {mappingFields.slice(0, 4).map(field => (
                                            <div key={field.label} className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{field.value}</span>
                                                <span className="text-sm font-medium text-foreground truncate" title={field.description}>{field.description}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${field.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {field.confidence}% Confidence
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'all'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                All Assets ({stats.total})
                            </button>
                            <button
                                onClick={() => setFilter('attention')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${filter === 'attention'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Needs Attention
                                {stats.attention > 0 && (
                                    <span className="bg-amber-100 text-amber-700 px-1.5 rounded-full text-xs">{stats.attention}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter('validated')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'validated'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Validated
                            </button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 scrollbar-micro">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className={`group bg-white dark:bg-zinc-800 rounded-xl border p-4 shadow-sm transition-all ${asset.status === 'review' || asset.status === 'suggestion'
                                ? 'border-amber-200 dark:border-amber-800/30'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}>
                                <div className="flex gap-4 items-start">
                                    {/* Status Icon */}
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${asset.status === 'review' ? 'bg-amber-100 text-amber-600' :
                                        asset.status === 'suggestion' ? 'bg-blue-100 text-blue-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {asset.status === 'review' && <ExclamationTriangleIcon className="w-5 h-5" />}
                                        {asset.status === 'suggestion' && <SparklesIcon className="w-5 h-5" />}
                                        {asset.status === 'validated' && <CheckCircleIcon className="w-5 h-5" />}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm truncate">{asset.description}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{asset.sku}</span>
                                                    <span className="text-xs text-muted-foreground">Qty: {asset.qty}</span>

                                                    {asset.warranty && asset.warranty !== 'Standard Warranty' && (
                                                        <span className="text-[10px] flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/30">
                                                            <ShieldCheckIcon className="w-3 h-3" />
                                                            {asset.warranty}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-foreground text-sm">{formatCurrency(asset.totalPrice)}</div>
                                                <div className="text-xs text-muted-foreground">{formatCurrency(asset.unitPrice)} ea</div>
                                            </div>
                                        </div>

                                        {/* Issues / Suggestions Bar */}
                                        {(asset.status === 'review' || asset.status === 'suggestion') && (
                                            <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                                <div className="flex items-center gap-2 text-xs">
                                                    {asset.status === 'review' ? (
                                                        <>
                                                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                                                            <span className="text-amber-700 dark:text-amber-500 font-medium">Issue Detected:</span>
                                                            <span className="text-zinc-600 dark:text-zinc-400">{asset.issues?.join(', ')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SparklesIcon className="w-4 h-4 text-blue-600" />
                                                            <span className="text-blue-700 dark:text-blue-500 font-medium">AI Suggestion:</span>
                                                            <span className="text-zinc-600 dark:text-zinc-400">{asset.suggestion?.reason}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setIsResolverOpen(true)} // Open unified resolver mainly
                                                    className="text-xs font-bold text-primary hover:underline"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Actions (Hover) */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        <button
                                            onClick={() => handleEdit(asset)}
                                            className="p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                            title="Edit Asset"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                                            title="Remove Asset"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Preview / Context */}
                <div className="w-[380px] border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hidden xl:flex flex-col">
                    {pricingStep === 'discounts' ? (
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <TagIcon className="w-5 h-5" />
                                    Discounts & Pricing
                                </h3>
                                <button onClick={() => setPricingStep('warranties')} className="text-xs text-primary hover:underline">Close</button>
                            </div>
                            <div className="flex-1 overflow-hidden p-4">
                                <DiscountStructureWidget
                                    subtotal={stats.totalValue}
                                    onApply={(total) => {
                                        // Handle apply logic
                                        setPricingStep('warranties'); // Close/Reset
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        // Default PDF Preview (Simplified)
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 flex justify-between items-center text-sm font-medium">
                                <span className="flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4" />
                                    Source Document
                                </span>
                                <div className="flex gap-2">
                                    <button className="p-1 hover:bg-zinc-100 rounded"><ArrowPathIcon className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Mock PDF Viewer */}
                            <div className="flex-1 p-8 overflow-y-auto flex justify-center scrollbar-micro bg-zinc-100/50 dark:bg-zinc-950">
                                <div className="bg-white w-full shadow-lg rounded-sm border border-zinc-200 p-8 text-[10px] leading-relaxed relative text-zinc-900 h-fit min-h-[600px]">
                                    <div className="font-bold text-lg mb-4 text-center text-zinc-900">PURCHASE ORDER</div>
                                    <div className="flex justify-between mb-6">
                                        <div>
                                            <div className="font-bold">BILL TO:</div>
                                            <div>ENTERPRISE CORP</div>
                                            <div>1234 BUSINESS WAY</div>
                                            <div>Atlanta, GA 30318</div>
                                        </div>
                                        <div>
                                            <div className="font-bold">VENDOR:</div>
                                            <div>Office Furniture Co.</div>
                                            <div>5678 SUPPLIER ST</div>
                                            <div>Atlanta, GA 30309</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className="flex justify-between border-b border-zinc-100 pb-1">
                                                <div className="w-8">#{i}024</div>
                                                <div className="flex-1 ml-2">Office Chair ergonomic black mesh...</div>
                                                <div className="w-16 text-right">$450.00</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-8 right-8 text-right">
                                        <div className="font-bold text-lg">TOTAL: $68,650.00</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Render 'Report' Step Overlay */}
            {currentStep === 'report' && (
                <div className="absolute inset-0 z-20 bg-zinc-50 dark:bg-zinc-800 flex flex-col p-8 items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-3xl w-full">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold font-brand text-foreground mb-2">Analysis Complete</h2>
                            <p className="text-muted-foreground">The AI has analyzed your document and found the following items requiring attention.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {/* Context & Rules Card */}
                            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    Context & Rules
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                        <span className="text-sm font-medium">Header Discrepancies</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${headerIssues.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {headerIssues.length} Issues
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                        <span className="text-sm font-medium">Business Rule Alerts</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ruleIssues.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                            {ruleIssues.length} Alerts
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Card */}
                            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                        <BoltIcon className="w-5 h-5" />
                                    </div>
                                    Line Items
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                        <span className="text-sm font-medium">Confident Matches</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                                            {stats.validated} Items
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                        <span className="text-sm font-medium">Needs Verification</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stats.attention > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                            {stats.attention} Items
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            {totalIssues > 0 ? (
                                <button
                                    onClick={() => setIsResolverOpen(true)}
                                    className="px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform animate-pulse"
                                >
                                    Resolve {totalIssues} Issues to Proceed
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentStep('review')}
                                    className="px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="w-6 h-6" />
                                    Proceed to Review
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Discrepancy Resolver Modal */}
            {isResolverOpen && (
                <DiscrepancyResolverArtifact
                    issues={[
                        ...headerIssues,
                        ...ruleIssues,
                        ...assets
                            .filter(a => a.status === 'review' || a.status === 'suggestion')
                            .map(a => ({
                                id: a.id,
                                type: 'line_item' as const,
                                title: a.description,
                                description: a.issues?.join(', ') || 'Potential Mismatch',
                                severity: 'medium' as const,
                                original: {
                                    label: 'Extracted Item',
                                    value: a.sku,
                                    subText: `Qty: ${a.qty} @ $${a.unitPrice}`
                                },
                                suggestion: {
                                    label: 'Catalog Match',
                                    value: a.suggestion?.sku || a.sku + '?',
                                    subText: a.suggestion ? `$${a.suggestion.price}` : 'No match found',
                                    reason: a.suggestion?.reason || 'Confidence low',
                                    confidence: 85
                                }
                            }))
                    ]}
                    onResolve={handleResolveDiscrepancy}
                    onClose={() => {
                        setIsResolverOpen(false);
                        // Auto-advance if clean
                        const remaining = headerIssues.length + ruleIssues.length + assets.filter(a => a.status !== 'validated').length;
                        if (remaining === 0) setCurrentStep('review');
                    }}
                />
            )}

            {currentStep === 'finalize' && (
                <div className="absolute inset-0 z-20 bg-white dark:bg-zinc-800 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 sticky top-0 bg-white dark:bg-zinc-800 z-10">
                        <button onClick={() => setCurrentStep('review')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ChevronDownIcon className="w-4 h-4 rotate-90" /> Back to Review
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-800/50 scrollbar-micro p-4 md:p-8">
                        <div className="max-w-3xl mx-auto space-y-6 pb-20">

                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold font-brand mb-2">Final Review</h2>
                                <p className="text-muted-foreground">Please review all details before submitting.</p>
                            </div>

                            {/* Accordion 1: Asset Summary */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <button
                                    className="w-full p-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'assets' ? null : 'assets')}
                                >
                                    <div className="flex items-center gap-3 font-bold text-lg">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                            <BoltIcon className="w-5 h-5" />
                                        </div>
                                        Assets ({stats.total})
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-mono font-medium text-muted-foreground">{formatCurrency(stats.totalValue)}</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${activeAccordion === 'assets' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {activeAccordion === 'assets' && (
                                    <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-[300px] overflow-y-auto scrollbar-micro border-t border-zinc-100 dark:border-zinc-800">
                                            {assets.map((a, idx) => (
                                                <div key={a.id} className={`flex justify-between items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${idx !== assets.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="font-medium text-sm truncate" title={a.description}>{a.description}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                                                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{a.sku}</span>
                                                            <span>Qty: {a.qty}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right whitespace-nowrap">
                                                        <div className="font-mono text-sm font-medium">{formatCurrency(a.totalPrice)}</div>
                                                        <div className="text-[10px] text-muted-foreground">{formatCurrency(a.unitPrice)} ea</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Warranties */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <button
                                    className="w-full p-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'warranties' ? null : 'warranties')}
                                >
                                    <div className="flex items-center gap-3 font-bold text-lg">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                            <ShieldCheckIcon className="w-5 h-5" />
                                        </div>
                                        Warranties
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-muted-foreground">Standard & Extended</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${activeAccordion === 'warranties' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {activeAccordion === 'warranties' && (
                                    <div className="p-6 animate-in slide-in-from-top-2 duration-200 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                                <ShieldCheckIcon className="w-6 h-6 text-indigo-600 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Coverage Summary</h4>
                                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                                                        Standard Manufacturer Warranty applies to all items unless otherwise specified.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setIsWarrantyMenuOpen(true)}
                                                className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                                Modify Warranty Selections
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Discounts */}
                            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <button
                                    className="w-full p-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => setActiveAccordion(activeAccordion === 'discounts' ? null : 'discounts')}
                                >
                                    <div className="flex items-center gap-3 font-bold text-lg">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                            <TagIcon className="w-5 h-5" />
                                        </div>
                                        Discounts
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded font-medium">Applied</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${activeAccordion === 'discounts' ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {activeAccordion === 'discounts' && (
                                    <div className="p-6 animate-in slide-in-from-top-2 duration-200 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="space-y-4">
                                            <DiscountStructureWidget
                                                subtotal={stats.totalValue}
                                                onApply={(total) => {
                                                    // console.log('Applied', total);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Totals & Submit Section */}
                            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 md:p-8 mt-8 sticky bottom-4 z-20">
                                <div className="flex flex-col md:flex-row justify-between items-end mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="mb-4 md:mb-0">
                                        <span className="block text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Estimated Total</span>
                                        <span className="text-xs text-muted-foreground">*Excludes tax & shipping</span>
                                    </div>
                                    <span className="text-4xl font-bold font-brand text-foreground bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                                        {formatCurrency(stats.totalValue)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setFinalType('quote');
                                            setShowSuccess(true);
                                        }}
                                        className="w-full py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-foreground rounded-xl font-bold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                    >
                                        Create Quote Only
                                    </button>

                                    <button
                                        onClick={() => {
                                            setFinalType('po');
                                            setShowSuccess(true);
                                        }}
                                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <DocumentTextIcon className="w-6 h-6" />
                                        Submit Purchase Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EditAssetModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                asset={editingAsset}
                onSave={handleSaveAsset}
            />

            <SuggestionModal
                isOpen={isSuggestionModalOpen}
                onClose={() => setIsSuggestionModalOpen(false)}
                asset={selectedSuggestionAsset}
                onAccept={() => selectedSuggestionAsset && handleAcceptSuggestion(selectedSuggestionAsset.id)}
                onReject={() => selectedSuggestionAsset && handleRejectSuggestion(selectedSuggestionAsset.id)}
            />

            <SuccessModal
                isOpen={showSuccess}
                type={finalType}
                poNumber={finalType === 'po' ? "PO-2026-001" : "QT-2026-892"}
                onClose={() => {
                    setShowSuccess(false);
                    setCurrentStep('review');
                    const id = finalType === 'po' ? 'PO-2026-001' : 'QT-2026-892';
                    const msg = finalType === 'po'
                        ? `Purchase Order **${id}** has been submitted. [View in Transactions](/transactions?tab=orders&id=${id})`
                        : `Quote **${id}** has been created. [View in Transactions](/transactions?tab=quotes&id=${id})`;
                    sendMessage(msg, 'system');
                }}
                onCreateNew={() => {
                    setShowSuccess(false);
                    sendMessage('Start New Quote', 'user');
                }}
            />
        </div>
    );
}
