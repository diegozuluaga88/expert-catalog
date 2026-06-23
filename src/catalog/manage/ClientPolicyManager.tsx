import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Info, List, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Switch } from '@headlessui/react';
import SmartRuleBuilderModal, { type CustomRule } from './SmartRuleBuilderModal';

const MOCK_CLIENTS = [
    { id: '1', name: 'Wells Fargo', contractId: 'WF-2024-QX' },
    { id: '2', name: 'Google REWS', contractId: 'GOOG-Bay-01' },
    { id: '3', name: 'Salesforce', contractId: 'SF-Tower-V2' }
];

const MOCK_PRODUCTS = [
    { name: 'Lateral File Cabinet', sku: 'X-LAT2DFS301BRO', list: 59500, active: true },
    { name: 'Box/Box/File Pedestal', sku: 'X-BBFPFS23RO', list: 84000, active: true },
    { name: 'Executive Task Chair', sku: 'CHAIR-EXEC-2024', list: 105000, active: true },
    { name: 'Sit-Stand Desk Pro', sku: 'DSK-SITSTAND-PRO', list: 120000, active: false }
];

export default function ClientPolicyManager() {
    const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTS[0]);

    // Toggles for Discounts
    const [useContractPricing, setUseContractPricing] = useState(true);
    const [useSpecialAuth, setUseSpecialAuth] = useState(false);
    const [useVolumeDiscount, setUseVolumeDiscount] = useState(false);
    const [usePromotions, setUsePromotions] = useState(true);

    // AI Rule Builder State
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [customRules, setCustomRules] = useState<CustomRule[]>([]);

    // Derived Logic
    const baseTotalList = MOCK_PRODUCTS.filter(p => p.active).reduce((acc, p) => acc + p.list, 0);

    // Discount Calculation Logic
    const calculateDiscounts = () => {
        let net = baseTotalList;
        let activeDiscountsCount = 0;
        const savingsBreakdown = [];

        // 1. Contract Pricing using Base Discount (e.g., 50% off List)
        if (useContractPricing) {
            const discount = baseTotalList * 0.45; // 45% discount
            net -= discount;
            activeDiscountsCount++;
            savingsBreakdown.push({ label: 'Contract Base (45%)', amount: discount });
        }

        // 2. Special Authorization (Project Specific, usually stacks or replaces)
        // Scenario: If Special Auth is ON, it might add an extra 5% on top of net
        if (useSpecialAuth) {
            const discount = net * 0.05;
            net -= discount;
            activeDiscountsCount++;
            savingsBreakdown.push({ label: 'Special Auth. (5%)', amount: discount });
        }

        // 3. Volume Discount (Tier based on total value)
        if (useVolumeDiscount) {
            // Simple Logic: if > 100k net, take 3% off
            if (net > 100000) {
                const discount = net * 0.03;
                net -= discount;
                activeDiscountsCount++;
                savingsBreakdown.push({ label: 'Volume Tier 1 (3%)', amount: discount });
            }
        }

        // 4. Promotions (Seasonal)
        if (usePromotions) {
            const discount = 2500; // Flat promo
            net -= discount;
            activeDiscountsCount++;
            savingsBreakdown.push({ label: 'Q3 Promo (Flat)', amount: discount });
        }

        // 5. Custom Rules (AI Generated)
        customRules.forEach(rule => {
            if (net >= rule.conditionThreshold) {
                const discount = rule.type === 'percentage'
                    ? net * (rule.value / 100)
                    : rule.value;
                net -= discount;
                activeDiscountsCount++;
                savingsBreakdown.push({ label: rule.name, amount: discount });
            }
        });

        return {
            net,
            savings: baseTotalList - net,
            count: activeDiscountsCount,
            breakdown: savingsBreakdown
        };
    };

    const results = calculateDiscounts();
    const discountRate = ((results.savings / baseTotalList) * 100).toFixed(1);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Col: Scope & Products */}
            <div className="flex-1 space-y-6">

                {/* Client Selector (Header Context) */}
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Configure Policy For</label>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-900 dark:text-zinc-100">
                            <Users className="w-6 h-6" />
                        </div>
                        <select
                            className="flex-1 text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-foreground cursor-pointer"
                            value={selectedClient.id}
                            onChange={(e) => setSelectedClient(MOCK_CLIENTS.find(c => c.id === e.target.value) || MOCK_CLIENTS[0])}
                        >
                            {MOCK_CLIENTS.map(client => (
                                <option key={client.id} value={client.id}>{client.name} ({client.contractId})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product List Simulation */}
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <List className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                            Reference Basket
                        </h3>
                        <span className="text-xs text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Simulation Only</span>
                    </div>

                    <div className="space-y-4">
                        {MOCK_PRODUCTS.map((prod, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${prod.active ? 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20' : 'border-dashed border-zinc-200 dark:border-zinc-700 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-md" /> { /* Placeholder Image */}
                                    <div>
                                        <div className="font-medium text-sm text-foreground">{prod.name}</div>
                                        <div className="text-xs text-muted-foreground">{prod.sku}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground uppercase">List</div>
                                    <div className="font-mono text-sm">{formatCurrency(prod.list)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Col: Interactive Rules Engine */}
            <div className="w-full lg:max-w-md space-y-6">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-black/20 sticky top-6">

                    {/* Header Results */}
                    <div className="bg-green-50 dark:bg-green-900/10 p-6 border-b border-green-100 dark:border-green-900/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-green-900 dark:text-green-400 flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Interactive Pricing
                            </h3>
                            <span className="text-xs font-medium bg-green-200/50 dark:bg-green-500/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                {results.count} Active Rules
                            </span>
                        </div>

                        <div className="mb-1">
                            <span className="text-sm text-green-700 dark:text-green-500">Net Simulation Total</span>
                            <div className="text-4xl font-bold text-green-700 dark:text-green-400 tracking-tight">
                                {formatCurrency(results.net)}
                            </div>
                        </div>

                        <div className="flex justify-between items-end mt-4 text-sm">
                            <div>
                                <div className="text-green-600/70 dark:text-green-400/60 pb-0.5">Total Savings</div>
                                <div className="font-semibold text-green-700 dark:text-green-500">{formatCurrency(results.savings)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-600/70 dark:text-green-400/60 pb-0.5">Discount Rate</div>
                                <div className="font-semibold text-green-700 dark:text-green-500">{discountRate}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="p-6 space-y-4">

                        {/* Add Rule Button */}
                        <button
                            onClick={() => setIsRuleModalOpen(true)}
                            className="w-full py-3 mb-2 border-2 border-dashed border-ai/20 dark:border-ai/20 rounded-xl text-ai font-medium hover:bg-ai-light dark:hover:bg-ai/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            Use A.I. to create a rule
                        </button>

                        {/* 1. Contract Pricing */}
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                            <div>
                                <div className="font-medium text-blue-900 dark:text-blue-300">Contract Pricing</div>
                                <div className="text-xs text-blue-700/70 dark:text-blue-400/70">Master Agreement (45% Base)</div>
                            </div>
                            <Switch
                                checked={useContractPricing}
                                onChange={setUseContractPricing}
                                className={`${useContractPricing ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                                <span className={`${useContractPricing ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>

                        {/* 2. Special Authorization */}
                        <div className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                            <div>
                                <div className="font-medium text-amber-900 dark:text-amber-300">Special Authorization</div>
                                <div className="text-xs text-amber-700/70 dark:text-amber-400/70">Project Specific Stack (+5%)</div>
                            </div>
                            <Switch
                                checked={useSpecialAuth}
                                onChange={setUseSpecialAuth}
                                className={`${useSpecialAuth ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
                            >
                                <span className={`${useSpecialAuth ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>

                        {/* 3. Volume Discounts */}
                        <div className="flex items-center justify-between p-4 bg-ai-light/50 dark:bg-ai/10 rounded-xl border border-ai/10 dark:border-ai/20">
                            <div>
                                <div className="font-medium text-ai dark:text-ai">Volume Tier 2</div>
                                <div className="text-xs text-ai/70 dark:text-ai/70">Orders &gt; $100k Net (3%)</div>
                            </div>
                            <Switch
                                checked={useVolumeDiscount}
                                onChange={setUseVolumeDiscount}
                                disabled={results.net <= 100000 && !useVolumeDiscount} // Disable if threshold not met in simulation
                                className={`${useVolumeDiscount ? 'bg-ai' : 'bg-zinc-200 dark:bg-zinc-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50`}
                            >
                                <span className={`${useVolumeDiscount ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>

                        {/* 4. Global Promotions */}
                        <div className="flex items-center justify-between p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-900/20">
                            <div>
                                <div className="font-medium text-pink-900 dark:text-pink-300">Q3 Promotion</div>
                                <div className="text-xs text-pink-700/70 dark:text-pink-400/70">Seasonal Flat Discount (-$2,500)</div>
                            </div>
                            <Switch
                                checked={usePromotions}
                                onChange={setUsePromotions}
                                className={`${usePromotions ? 'bg-pink-500' : 'bg-zinc-200 dark:bg-zinc-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                            >
                                <span className={`${usePromotions ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </Switch>
                        </div>

                        {/* Custom AI Rules */}
                        {customRules.map(rule => {
                            const conditionMet = results.net > rule.conditionThreshold;
                            return (
                                <div key={rule.id} className="flex items-center justify-between p-4 bg-ai-light/50 dark:bg-ai/10 rounded-xl border border-ai/10 dark:border-ai/20">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 font-medium text-ai dark:text-ai">
                                            <Sparkles className="w-4 h-4 text-ai" />
                                            {rule.name}
                                        </div>
                                        <div className="text-xs text-ai/70 dark:text-ai/70 mt-0.5">{rule.description}</div>
                                        {!conditionMet && (
                                            <div className="text-[10px] uppercase text-ai/70 font-semibold mt-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Condition not met (Net &lt; ${rule.conditionThreshold.toLocaleString()})</div>
                                        )}
                                    </div>
                                    <Switch
                                        checked={true} // Custom rules are always on once saved in this simplified flow, could add toggle later
                                        onChange={() => { }}
                                        className={`bg-ai relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors`}
                                    >
                                        <span className={`translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                    </Switch>
                                </div>
                            );
                        })}

                    </div>

                    {/* Footer / Warranty Actions */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Standard Warranty Applied (12 Years)
                    </div>
                </div>
            </div>

            <SmartRuleBuilderModal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                onSaveRule={(rule, disableConflict) => {
                    setCustomRules([...customRules, rule]);
                    if (disableConflict) {
                        setUseVolumeDiscount(false);
                    }
                }}
                currentNet={results.net}
                existingRulesCount={results.count}
            />
        </div>
    );
}
