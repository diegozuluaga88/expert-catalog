import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Switch } from '@headlessui/react';
import { AlertTriangle, BarChart3, CheckCircle2, RefreshCw, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export interface CustomRule {
    id: string;
    name: string;
    description: string;
    type: 'percentage' | 'flat';
    value: number;
    conditionThreshold: number; // e.g. active if net > this value
}

interface SmartRuleBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveRule: (rule: CustomRule, disableConflict: boolean) => void;
    currentNet: number;
    existingRulesCount: number;
}

type Step = 'prompt' | 'analyzing' | 'review' | 'success';

export default function SmartRuleBuilderModal({ isOpen, onClose, onSaveRule, currentNet, existingRulesCount }: SmartRuleBuilderModalProps) {
    const [step, setStep] = useState<Step>('prompt');
    const [prompt, setPrompt] = useState('');

    // Parsed Rule State
    const [ruleName, setRuleName] = useState('');
    const [ruleDesc, setRuleDesc] = useState('');
    const [ruleType, setRuleType] = useState<'percentage' | 'flat'>('percentage');
    const [ruleValue, setRuleValue] = useState(0);
    const [ruleThreshold, setRuleThreshold] = useState(0);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [disableConflict, setDisableConflict] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('prompt');
            setPrompt('');
            setRuleName('');
            setRuleDesc('');
            setRuleValue(0);
            setRuleThreshold(0);
            setDisableConflict(false);
        }
    }, [isOpen]);

    const handleGenerate = () => {
        if (!prompt) return;
        setStep('analyzing');
        setIsAnalyzing(true);

        // Simulate AI parsing and forecasting
        setTimeout(() => {
            // Mock parsing logic based on common prompts
            let type: 'percentage' | 'flat' = 'percentage';
            let val = 5;
            let thresh = 50000;
            let name = 'Custom AI Discount';
            let desc = 'Generated from user request';

            if (prompt.toLowerCase().includes('flat') || prompt.includes('$')) {
                type = 'flat';
                const match = prompt.match(/\$(\d+(?:,\d+)?)/);
                val = match ? parseInt(match[1].replace(',', '')) : 5000;
            } else {
                const percMatch = prompt.match(/(\d+)%/);
                if (percMatch) val = parseInt(percMatch[1]);
            }

            if (prompt.toLowerCase().includes('over') || prompt.toLowerCase().includes('>')) {
                const threshMatch = prompt.match(/\$?(?:over\s+)?(\d+(?:,\d+)?(?:k|m)?)/i);
                if (threshMatch) {
                    let tStr = threshMatch[1].replace(',', '').toLowerCase();
                    if (tStr.endsWith('k')) thresh = parseInt(tStr) * 1000;
                    else if (tStr.endsWith('m')) thresh = parseInt(tStr) * 1000000;
                    else thresh = parseInt(tStr);
                }
            }

            setRuleName(`Custom: ${prompt.substring(0, 20)}...`);
            setRuleDesc(`Applies ${type === 'percentage' ? val + '%' : '$' + val} discount for baskets over $${thresh.toLocaleString()}`);
            setRuleType(type);
            setRuleValue(val);
            setRuleThreshold(thresh);

            setIsAnalyzing(false);
            setStep('review');
        }, 2500);
    };

    const handleSave = () => {
        const newRule: CustomRule = {
            id: 'rule-' + Date.now(),
            name: ruleName,
            description: ruleDesc,
            type: ruleType,
            value: ruleValue,
            conditionThreshold: ruleThreshold
        };
        onSaveRule(newRule, disableConflict);
        setStep('success');
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    const forecastedDiscount = ruleType === 'percentage'
        ? (currentNet >= ruleThreshold ? currentNet * (ruleValue / 100) : 0)
        : (currentNet >= ruleThreshold ? ruleValue : 0);

    const willApply = currentNet >= ruleThreshold;

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog onClose={step === 'analyzing' ? () => { } : onClose} className="relative z-50">
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                        <Dialog.Panel className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                                <Dialog.Title className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-ai" />
                                    A.I. Rule Builder
                                </Dialog.Title>
                                {step !== 'analyzing' && (
                                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-zinc-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {step === 'prompt' && (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="w-12 h-12 bg-ai-light dark:bg-ai/10 rounded-2xl flex items-center justify-center mx-auto text-ai">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground">Describe your business rule</h3>
                                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                                Tell the AI what kind of pricing policy you want to implement. It will generate the rule and forecast its impact.
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                className="w-full h-32 p-4 bg-background border border-input rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-ai/50 outline-none resize-none disabled:opacity-50"
                                                placeholder="e.g. Give a 10% discount on all orders over $50,000 for standard accounts..."
                                                value={prompt}
                                                onChange={e => setPrompt(e.target.value)}
                                            />
                                            <div className="absolute bottom-3 text-xs right-3 flex gap-2">
                                                <button onClick={() => setPrompt("Offer an extra 5% off if order is over $25,000")} className="px-2 py-1 bg-muted rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition">Example 1</button>
                                                <button onClick={() => setPrompt("Apply flat $5000 rebate on $100k baskets")} className="px-2 py-1 bg-muted rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition">Example 2</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 'analyzing' && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-ai/20 rounded-full animate-ping" />
                                            <div className="relative bg-background p-4 rounded-full border border-ai/20 shadow-xl shadow-ai/10">
                                                <RefreshCw className="w-8 h-8 text-ai animate-spin" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-1">Synthesizing Rule & Simulating Impact</h3>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                Checking current reference basket and evaluating conflicts with {existingRulesCount} active policies...
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-ai h-full rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                                        </div>
                                    </div>
                                )}

                                {step === 'review' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4">

                                        {/* AI Analysis Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-ai-light dark:bg-ai/5 border border-ai/10 dark:border-ai/20 p-4 rounded-xl">
                                                <div className="flex items-center gap-2 text-ai dark:text-ai font-semibold mb-2">
                                                    <BarChart3 className="w-5 h-5" />
                                                    Forecasted Impact
                                                </div>
                                                <p className="text-sm text-ai/80 dark:text-ai-light/80 mb-3">
                                                    Based on the current Reference Basket net value of {formatCurrency(currentNet)}.
                                                </p>
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wider text-ai/60 dark:text-ai/60 font-medium">Estimated Discount</div>
                                                        <div className="text-2xl font-bold text-ai">
                                                            -{formatCurrency(forecastedDiscount)}
                                                        </div>
                                                    </div>
                                                    <div className={cn("px-2 py-1 rounded text-xs font-semibold", willApply ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400")}>
                                                        {willApply ? 'Condition Met' : 'Condition Not Met'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                                                        <AlertTriangle className="w-5 h-5" />
                                                        Conflict Analysis
                                                    </div>
                                                    <p className="text-sm text-amber-800 dark:text-amber-200/80 mt-2">
                                                        This rule potentially stacks with <span className="font-semibold">Volume Tier 2</span> if total net exceeds $100,000, creating an aggressive discount compounding.
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between">
                                                    <div className="text-sm font-medium text-amber-900 dark:text-amber-300">
                                                        Deactivate Volume Tier 2
                                                    </div>
                                                    <Switch
                                                        checked={disableConflict}
                                                        onChange={setDisableConflict}
                                                        className={`${disableConflict ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900/40'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
                                                    >
                                                        <span className={`${disableConflict ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                    </Switch>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Configuration Tweaks */}
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                <SlidersHorizontal className="w-5 h-5" />
                                                Rule Configuration
                                            </h4>

                                            <div className="space-y-4 bg-muted/30 p-5 rounded-xl border border-input">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Rule Name</label>
                                                        <input
                                                            type="text"
                                                            value={ruleName}
                                                            onChange={e => setRuleName(e.target.value)}
                                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Trigger Threshold (Net &gt; $)</label>
                                                        <input
                                                            type="number"
                                                            value={ruleThreshold || ''}
                                                            onChange={e => setRuleThreshold(parseFloat(e.target.value))}
                                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Discount Type</label>
                                                        <select
                                                            value={ruleType}
                                                            onChange={e => setRuleType(e.target.value as any)}
                                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            <option value="percentage">Percentage (%)</option>
                                                            <option value="flat">Flat Amount ($)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase">Discount Value</label>
                                                        <div className="relative">
                                                            {ruleType === 'flat' && <span className="absolute left-3 top-2 text-muted-foreground">$</span>}
                                                            <input
                                                                type="number"
                                                                value={ruleValue || ''}
                                                                onChange={e => setRuleValue(parseFloat(e.target.value))}
                                                                className={cn(
                                                                    "w-full bg-background border border-input rounded-lg py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none",
                                                                    ruleType === 'flat' ? 'pl-8 pr-3' : 'px-3',
                                                                    ruleType === 'percentage' && 'pr-8'
                                                                )}
                                                            />
                                                            {ruleType === 'percentage' && <span className="absolute right-3 top-2 text-muted-foreground">%</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {step === 'success' && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-300">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">Rule Added!</h3>
                                        <p className="text-muted-foreground text-sm">
                                            "{ruleName}" has been activated in the policy manager.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {(step === 'prompt' || step === 'review') && (
                                <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-3">
                                    <button
                                        onClick={step === 'review' ? () => setStep('prompt') : onClose}
                                        className="px-4 py-2 bg-background border border-input hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                                    >
                                        {step === 'review' ? 'Back' : 'Cancel'}
                                    </button>

                                    {step === 'prompt' ? (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={!prompt}
                                            className="px-6 py-2 bg-ai text-white font-medium rounded-lg hover:bg-ai transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            Generate Rule
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                        >
                                            Save & Activate
                                        </button>
                                    )}
                                </div>
                            )}

                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
