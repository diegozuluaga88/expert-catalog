import { Fragment, useState } from 'react';
import { Dialog, Transition, Switch, Popover } from '@headlessui/react';
import {
    XMarkIcon,
    SparklesIcon,
    CalculatorIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ScaleIcon,
    CheckIcon,
    ShieldCheckIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface QuoteSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    catalogName: string;
}

const AVAILABLE_RULES = [
    { id: 'margin', name: 'Margin Protection', desc: 'Enforce min 20% margin', icon: ShieldCheckIcon },
    { id: 'contract', name: 'Contract Compliance', desc: 'Validates against master agreement', icon: DocumentCheckIcon },
    { id: 'approval', name: 'Force Approval > $10k', desc: 'Requires manager sign-off', icon: ExclamationTriangleIcon },
    { id: 'finishes', name: 'Standard Finishes Only', desc: 'Restrict custom finish options', icon: ScaleIcon },
];

export default function QuoteSetupModal({ isOpen, onClose, catalogName }: QuoteSetupModalProps) {
    const [copilotEnabled, setCopilotEnabled] = useState(true);
    const [volumeDiscount, setVolumeDiscount] = useState(true);

    // Business Rules State
    const [activeRules, setActiveRules] = useState<string[]>(['margin', 'contract']);

    // Mock Calculation State
    const [leadTime, setLeadTime] = useState('4-6 Weeks');

    const handleCreateQuote = () => {
        // In a real app, this would redirect to the quote builder with these params
        console.log('Creating quote for', catalogName, {
            copilotEnabled,
            volumeDiscount,
            activeRules
        });
        onClose();
    };

    const toggleRule = (id: string) => {
        setActiveRules(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative overflow-visible">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <Dialog.Title className="text-xl font-medium text-white">Create Quote for {catalogName}</Dialog.Title>
                                    <p className="text-sm text-zinc-400 mt-1">Configure initial settings and AI assistance.</p>
                                </div>
                                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Context Badge */}
                            <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <span className="text-indigo-400 font-bold text-lg">A</span>
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Quoting For</div>
                                    <div className="text-white font-medium">Acme Corp <span className="text-zinc-500 font-normal ml-2">Global Master Agreement</span></div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Assignee Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Assign to (Responsible)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <select
                                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2.5 pl-3 pr-10 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
                                                defaultValue="currentUser"
                                            >
                                                <option value="currentUser">Me (Jane Doe)</option>
                                                <option value="john">John Smith - Sales Director</option>
                                                <option value="sarah">Sarah Connor - Account Manager</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Suggestions Panel */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-indigo-400" />
                                            <div className="text-sm font-medium text-indigo-100">Copilot Suggestions</div>
                                        </div>

                                        {/* Business Rules Popover */}
                                        <Popover className="relative">
                                            {({ open }) => (
                                                <>
                                                    <Popover.Button className={clsx(
                                                        "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors outline-none",
                                                        open || activeRules.length > 0 ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-zinc-800 text-zinc-400 hover:text-white border border-transparent"
                                                    )}>
                                                        <ScaleIcon className="w-3.5 h-3.5" />
                                                        Business Rules
                                                        {activeRules.length > 0 && <span className="bg-blue-500 text-white text-[9px] px-1 rounded-full">{activeRules.length}</span>}
                                                    </Popover.Button>

                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-200"
                                                        enterFrom="opacity-0 translate-y-2"
                                                        enterTo="opacity-100 translate-y-0"
                                                        leave="transition ease-in duration-150"
                                                        leaveFrom="opacity-100 translate-y-0"
                                                        leaveTo="opacity-0 translate-y-2"
                                                    >
                                                        <Popover.Panel className="absolute right-0 bottom-8 z-50 w-72 origin-bottom-right rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl p-4 ring-1 ring-black/5">
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <h4 className="text-sm font-medium text-white">Project Rules</h4>
                                                                <span className="text-xs text-zinc-500 px-1.5 py-0.5 bg-zinc-900 rounded">Global</span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {AVAILABLE_RULES.map((rule) => {
                                                                    const Icon = rule.icon;
                                                                    const active = activeRules.includes(rule.id);
                                                                    return (
                                                                        <div key={rule.id} className="flex items-start justify-between gap-3 group">
                                                                            <div className="flex items-start gap-2.5">
                                                                                <div className={clsx("mt-0.5 p-1 rounded-md", active ? "bg-blue-500/20 text-blue-400" : "bg-zinc-700/50 text-zinc-500")}>
                                                                                    <Icon className="w-3.5 h-3.5" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className={clsx("text-xs font-medium transition-colors", active ? "text-zinc-200" : "text-zinc-500")}>{rule.name}</div>
                                                                                    <div className="text-[10px] text-zinc-500">{rule.desc}</div>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => toggleRule(rule.id)}
                                                                                className={clsx(
                                                                                    "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75",
                                                                                    active ? 'bg-blue-600' : 'bg-zinc-700'
                                                                                )}
                                                                            >
                                                                                <span
                                                                                    aria-hidden="true"
                                                                                    className={clsx(
                                                                                        active ? 'translate-x-3' : 'translate-x-0',
                                                                                        'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out'
                                                                                    )}
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </Popover.Panel>
                                                    </Transition>
                                                </>
                                            )}
                                        </Popover>
                                    </div>
                                    <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-indigo-100">Recommended Assets Only</div>
                                                <div className="text-xs text-indigo-300/70">Filter for high-margin & contract compliant</div>
                                            </div>
                                            <Switch
                                                checked={copilotEnabled}
                                                onChange={setCopilotEnabled}
                                                className={clsx(
                                                    copilotEnabled ? 'bg-indigo-600' : 'bg-zinc-700',
                                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900'
                                                )}
                                            >
                                                <span className={clsx(copilotEnabled ? 'translate-x-6' : 'translate-x-1', 'inline-block h-4 w-4 transform rounded-full bg-white transition')} />
                                            </Switch>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-indigo-500/10 pt-3">
                                            <div>
                                                <div className="text-sm font-medium text-indigo-100">Apply Volume Discounts</div>
                                                <div className="text-xs text-indigo-300/70">Using Tier 2 rates based on history</div>
                                            </div>
                                            <Switch
                                                checked={volumeDiscount}
                                                onChange={setVolumeDiscount}
                                                className={clsx(
                                                    volumeDiscount ? 'bg-indigo-600' : 'bg-zinc-700',
                                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900'
                                                )}
                                            >
                                                <span className={clsx(volumeDiscount ? 'translate-x-6' : 'translate-x-1', 'inline-block h-4 w-4 transform rounded-full bg-white transition')} />
                                            </Switch>
                                        </div>

                                        {copilotEnabled && (
                                            <div className="mt-2 text-xs text-indigo-200 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                                                AI Insight: Acme prefers "Task Seating" and "Herman Miller". We've highlighted these categories.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Forecasting Widget */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CalculatorIcon className="w-4 h-4 text-green-400" />
                                        <div className="text-sm font-medium text-green-100">Forecast</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
                                                <ClockIcon className="w-3.5 h-3.5" />
                                                Est. Lead Time
                                            </div>
                                            <div className="text-xl font-semibold text-white">{leadTime}</div>
                                        </div>
                                        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
                                                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                                Proj. Margin
                                            </div>
                                            <div className="text-xl font-semibold text-green-400">{volumeDiscount ? '22%' : '26%'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 z-0">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateQuote}
                                    className="px-6 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-brand-300 dark:bg-brand-500 transition-colors flex items-center gap-2"
                                >
                                    Create Quote
                                    <span className="opacity-60">→</span>
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
