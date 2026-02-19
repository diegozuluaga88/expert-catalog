import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { cn } from '../../lib/utils'

export function AiActionsAccordion() {
    return (
        <div className="w-full">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold tracking-wider text-green-600 dark:text-brand-400 uppercase">
                <SparklesIcon className="w-3.5 h-3.5" />
                AI ACTIONS
            </div>

            <Disclosure defaultOpen>
                {({ open }) => (
                    <div className="overflow-hidden border rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm dark:shadow-none">
                        <Disclosure.Button className="flex items-center justify-between w-full px-5 py-3 text-left transition-colors bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 dark:bg-brand-500/10 text-green-600 dark:text-brand-400">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-zinc-900 dark:text-white">Auto-fix discrepancies (3)</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    className="px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-950 bg-green-500 dark:bg-brand-400 rounded-md hover:bg-green-600 dark:hover:bg-brand-500 transition-colors shadow-sm"
                                    onClick={(e) => { e.stopPropagation(); /* Handler */ }}
                                >
                                    Fix with AI
                                </button>
                                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    Fix Manually
                                    <ChevronDownIcon className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
                                </span>
                            </div>
                        </Disclosure.Button>

                        <Transition
                            enter="transition duration-200 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-150 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="px-0 pb-0">
                                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                    {/* Item 1 */}
                                    <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 group transition-colors">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Missing Unit Price</span>
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 rounded border border-red-200 dark:border-red-400/20">HIGH</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">Oak Dining Table</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">+ Total Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Partial Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Assign To</button>
                                        </div>
                                    </div>
                                    {/* Item 2 */}
                                    <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 group transition-colors">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Missing SKU/Item Number</span>
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 rounded border border-yellow-200 dark:border-yellow-400/20">MEDIUM</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">Mid-Century Modern Sofa</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">+ Total Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Partial Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Assign To</button>
                                        </div>
                                    </div>
                                    {/* Item 3 */}
                                    <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 group transition-colors">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Missing Measurement</span>
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 rounded border border-blue-200 dark:border-blue-400/20">LOW</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">King Size Platform Bed</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">+ Total Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Partial Fix</button>
                                            <button className="hover:text-zinc-900 dark:hover:text-white flex items-center gap-1">Assign To</button>
                                        </div>
                                    </div>
                                </div>
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>
        </div>
    )
}
