import { useState } from 'react';
import {
    TagIcon,
    CalculatorIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    ShieldCheckIcon,
    GiftIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

interface DiscountStructureWidgetProps {
    subtotal: number;
    onApply: (finalTotal: number) => void;
}

type DiscountCategory = 'contract' | 'special' | 'volume' | 'promo' | 'additional';

interface DiscountItem {
    id: string;
    label: string;
    description?: string;
    rate: number; // Percentage
    enabled: boolean;
    type: 'percentage' | 'fixed'; // Simplified for demo, mostly using percentage
}

interface SectionState {
    id: DiscountCategory;
    title: string;
    color: string; // Tailwind color class prefix (e.g., 'blue', 'orange')
    icon: any;
    items: DiscountItem[];
    expanded: boolean;
}

export default function DiscountStructureWidget({ subtotal, onApply }: DiscountStructureWidgetProps) {
    const [sections, setSections] = useState<SectionState[]>([
        {
            id: 'contract',
            title: 'Contract Pricing',
            color: 'blue',
            icon: BriefcaseIcon,
            expanded: false,
            items: [
                { id: 'c1', label: 'GSA Schedule Header', description: 'Federal government base rate', rate: 45, enabled: true, type: 'percentage' },
                { id: 'c2', label: 'Tier 1 Agreement', description: 'Priority client discount', rate: 5, enabled: false, type: 'percentage' }
            ]
        },
        {
            id: 'special',
            title: 'Special Authorizations',
            color: 'orange',
            icon: ShieldCheckIcon,
            expanded: false,
            items: [
                { id: 's1', label: 'Director Approval', description: 'Manual override code: DIR-2024', rate: 2, enabled: false, type: 'percentage' }
            ]
        },
        {
            id: 'volume',
            title: 'Volume Discounts',
            color: 'purple',
            icon: CalculatorIcon,
            expanded: false,
            items: [
                { id: 'v1', label: 'Bulk Order > $50k', description: 'Automated volume tier 1', rate: 3, enabled: false, type: 'percentage' },
                { id: 'v2', label: 'Container Load', description: 'Direct from factory', rate: 12, enabled: false, type: 'percentage' }
            ]
        },
        {
            id: 'promo',
            title: 'Promotions',
            color: 'green',
            icon: GiftIcon,
            expanded: false,
            items: [
                { id: 'p1', label: 'Q1 Sales Kickoff', description: 'Seasonal promotion', rate: 5, enabled: false, type: 'percentage' },
                { id: 'p2', label: 'New Client Bonus', description: 'One-time signup bonus', rate: 5, enabled: false, type: 'percentage' }
            ]
        },
        {
            id: 'additional',
            title: 'Additional Discounts',
            color: 'teal',
            icon: PlusCircleIcon,
            expanded: true, // Default expanded as per reference
            items: [
                { id: 'a1', label: 'Early Payment Discount', description: '2% discount for payment within 10 days', rate: 2, enabled: true, type: 'percentage' },
                { id: 'a2', label: 'Mixed Category Bonus', description: '2% bonus for purchasing multiple categories', rate: 2, enabled: true, type: 'percentage' },
                { id: 'a3', label: 'Loyalty Points Redemption', description: 'Redeem 5000 points', rate: 1.5, enabled: false, type: 'percentage' }
            ]
        }
    ]);

    const toggleSection = (id: DiscountCategory) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
    };

    const toggleItem = (sectionId: DiscountCategory, itemId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: s.items.map(i => i.id === itemId ? { ...i, enabled: !i.enabled } : i)
                };
            }
            return s;
        }));
    };

    const toggleAllInSection = (sectionId: DiscountCategory, enable: boolean) => {
        setSections(prev => prev.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    items: s.items.map(i => ({ ...i, enabled: enable }))
                };
            }
            return s;
        }));
    };

    // Calculate Totals
    let totalDiscountAmount = 0;
    let activeCount = 0;

    sections.forEach(section => {
        section.items.forEach(item => {
            if (item.enabled) {
                activeCount++;
                if (item.type === 'percentage') {
                    totalDiscountAmount += subtotal * (item.rate / 100);
                }
            }
        });
    });

    const finalTotal = subtotal - totalDiscountAmount;
    const totalDiscountRate = (totalDiscountAmount / subtotal) * 100;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="w-full bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full max-h-[800px]">

            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <CalculatorIcon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Interactive Discount Structure</h2>
                        <p className="text-sm text-muted-foreground">Activate or deactivate discounts to see real-time impact</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-micro p-6 space-y-6">

                {/* Summary Card (Green) */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-green-800 dark:text-green-400 font-semibold text-sm tracking-wide uppercase">Active Discounts</span>
                        <span className="bg-green-200/50 dark:bg-green-500/20 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full font-bold">
                            {activeCount} applied
                        </span>
                    </div>

                    <div className="mb-6">
                        <div className="text-sm text-green-600 dark:text-green-500 mb-1">Net Total</div>
                        <div className="text-4xl font-black text-green-700 dark:text-green-400 tracking-tight">
                            {formatCurrency(finalTotal)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-green-200/50 dark:border-green-800/30 pt-4">
                        <div>
                            <div className="text-xs text-green-600 dark:text-green-500">Total Savings</div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalDiscountAmount)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-green-600 dark:text-green-500">Discount Rate</div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-400">{totalDiscountRate.toFixed(1)}%</div>
                            <InformationCircleIcon className="w-4 h-4 text-green-400 absolute bottom-5 right-6" />
                        </div>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-3">
                    {sections.map(section => {
                        const activeInSection = section.items.filter(i => i.enabled).length;
                        const isAllEnabled = activeInSection === section.items.length && section.items.length > 0;

                        // Dynamic Colors
                        const colorMap: Record<string, any> = {
                            blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-800' },
                            orange: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-800/30', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-800' },
                            purple: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-800/30', text: 'text-indigo-700 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-800' },
                            green: { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-800/30', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-100 dark:bg-green-800' },
                            teal: { bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-100 dark:border-teal-800/30', text: 'text-teal-700 dark:text-teal-400', badge: 'bg-teal-100 dark:bg-teal-800' },
                        };
                        const theme = colorMap[section.color];

                        return (
                            <div key={section.id} className={`border rounded-xl transition-all duration-300 ${section.expanded ? `${theme.bg} ${theme.border}` : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>
                                {/* Section Header */}
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <section.icon className={`w-5 h-5 ${section.expanded ? theme.text : 'text-muted-foreground'}`} />
                                        <span className={`font-semibold ${section.expanded ? theme.text : 'text-foreground'}`}>{section.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${section.expanded ? `${theme.badge} ${theme.text}` : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground'}`}>
                                            {activeInSection}/{section.items.length}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${section.expanded ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Section Content */}
                                {section.expanded && (
                                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">

                                        {/* Toggle All Bar */}
                                        <div className={`flex items-center justify-between p-3 mb-3 rounded-lg border border-dashed ${theme.border} bg-white/50 dark:bg-black/20`}>
                                            <span className={`text-sm font-medium ${theme.text}`}>Toggle All {section.title}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleAllInSection(section.id, !isAllEnabled); }}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isAllEnabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-800 transition-transform ${isAllEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {section.items.map(item => (
                                                <div key={item.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-foreground">{item.label}</span>
                                                            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold rounded uppercase tracking-wider border border-zinc-200 dark:border-zinc-700">
                                                                {item.rate}%
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                                        {item.enabled && (
                                                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                                <span>Applied: -{formatCurrency(subtotal * (item.rate / 100))}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Toggle Switch */}
                                                    <button
                                                        onClick={() => toggleItem(section.id, item.id)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${item.enabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-800 transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Info Footer */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 flex gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">How Discounts Are Applied:</h4>
                        <ul className="text-xs text-blue-600 dark:text-blue-300 list-disc list-inside space-y-1">
                            <li>Rules are evaluated by priority (lower number = higher priority)</li>
                            <li>Only active rules with met conditions are applied</li>
                            <li>Toggle any discount to see instant pricing updates</li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Bottom Action Bar */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 shrink-0">
                <button
                    onClick={() => onApply(finalTotal)}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 hover:scale-[1.01] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    <CalculatorIcon className="w-5 h-5" />
                    Confirm Quote Pricing
                </button>
            </div>
        </div>
    );
}
