import { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    CpuChipIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    TagIcon,
    BuildingOfficeIcon,
    CalculatorIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface QuoteExtractionArtifactProps {
    fileName: string;
    onComplete: (data: any) => void;
}

type StepStatus = 'pending' | 'active' | 'complete';

interface ProcessingStep {
    id: string;
    label: string;
    icon: React.ElementType;
    status: StepStatus;
    logs: string[];
}

export default function QuoteExtractionArtifact({ fileName, onComplete }: QuoteExtractionArtifactProps) {
    const [steps, setSteps] = useState<ProcessingStep[]>([
        {
            id: 'context',
            label: 'Analyzing Context',
            icon: BuildingOfficeIcon,
            status: 'active',
            logs: []
        },
        {
            id: 'rules',
            label: 'Applying Business Rules',
            icon: ShieldCheckIcon,
            status: 'pending',
            logs: []
        },
        {
            id: 'extraction',
            label: 'Extracting Line Items',
            icon: TagIcon,
            status: 'pending',
            logs: []
        },
        {
            id: 'validation',
            label: 'Validating Catalog Data',
            icon: CheckCircleIcon,
            status: 'pending',
            logs: []
        }
    ]);

    const [currentLog, setCurrentLog] = useState<string>('Initializing agents...');

    useEffect(() => {
        let mounted = true;
        const timeouts: any[] = [];

        const addLog = (stepId: string, message: string) => {
            if (!mounted) return;
            setCurrentLog(message);
            setSteps(prev => prev.map(s =>
                s.id === stepId ? { ...s, logs: [...s.logs, message] } : s
            ));
        };

        const updateStatus = (stepId: string, status: StepStatus) => {
            if (!mounted) return;
            setSteps(prev => prev.map(s =>
                s.id === stepId ? { ...s, status } : s
            ));
        };

        // Timeline Simulation
        // This simulates the "Process Twin" logic: mapping context, rules, extraction, validation
        const timeline = [
            // Step 1: Context (0-1.5s)
            { time: 500, action: () => addLog('context', `Reading "${fileName}" header data...`) },
            { time: 1000, action: () => addLog('context', 'Identified Customer: City Builders Inc.') },
            { time: 1500, action: () => addLog('context', 'Project Detected: "Seaport Reno Phase 2"') },
            {
                time: 1800, action: () => {
                    updateStatus('context', 'complete');
                    updateStatus('rules', 'active');
                }
            },

            // Step 2: Rules (1.8s - 2.8s)
            { time: 2000, action: () => addLog('rules', 'Retrieving Contract: CB-2024-MSA') },
            { time: 2300, action: () => addLog('rules', 'Applied Margin: 18% (Contract Rate)') },
            { time: 2500, action: () => addLog('rules', 'Payment Terms: Net 45 applied') },
            {
                time: 2800, action: () => {
                    updateStatus('rules', 'complete');
                    updateStatus('extraction', 'active');
                }
            },

            // Step 3: Extraction (2.8s - 3.9s)
            { time: 3000, action: () => addLog('extraction', 'Scanning page 1... Found 3 distinct item groups') },
            // Simulating "Fuzzy Logic" mapping mentioned in plan
            { time: 3300, action: () => addLog('extraction', 'Parsing "Aeron Size B" -> Mapped to SKU HM-AER-B (98% Conf)') },
            { time: 3600, action: () => addLog('extraction', 'Parsing "Conf Table" -> Mapped to SKU TBL-CONF-01') },
            {
                time: 3900, action: () => {
                    updateStatus('extraction', 'complete');
                    updateStatus('validation', 'active');
                }
            },

            // Step 4: Validation (3.9s - 4.8s)
            { time: 4200, action: () => addLog('validation', 'Checking Live Inventory...') },
            { time: 4500, action: () => addLog('validation', 'All SKUs active. 1 item low stock.') },
            {
                time: 4800, action: () => {
                    updateStatus('validation', 'complete');
                    onComplete({
                        source: 'autonomous',
                        fileName: fileName,
                        assets: [
                            { id: '1', description: 'Herman Miller Aeron - Size B', sku: 'HM-AER-B', qty: 45, unitPrice: 1250.00, totalPrice: 56250.00, status: 'validated', notes: 'Contract Price Applied' },
                            { id: '2', description: 'Conference Table (Mahogany)', sku: 'TBL-CONF-01', qty: 2, unitPrice: 3500.00, totalPrice: 7000.00, status: 'validated' },
                            { id: '3', description: 'Side Chair', sku: 'CH-SIDE-01', qty: 12, unitPrice: 450.00, totalPrice: 5400.00, status: 'review', issues: ['Low Stock Warning'] }
                        ]
                    });
                }
            }
        ];

        timeline.forEach(({ time, action }) => {
            const timeout = setTimeout(action, time);
            timeouts.push(timeout);
        });

        return () => {
            mounted = false;
            timeouts.forEach(clearTimeout);
        };
    }, [fileName, onComplete]);

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="text-center mb-6 shrink-0">
                <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-full mb-3 relative">
                    <div className="absolute inset-0 rounded-full border border-indigo-500/20 w-full h-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    <CpuChipIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Autonomous Processing</h3>
                <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider h-4 overflow-visible whitespace-nowrap">{currentLog}</p>
            </div>

            <div className="flex-1 space-y-4 max-w-md mx-auto w-full overflow-y-auto pr-2 scrollbar-micro">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative pl-6 pb-2 group">
                        {/* Connecting Line */}
                        {index !== steps.length - 1 && (
                            <div className={clsx(
                                "absolute left-[11px] top-6 w-0.5 h-full -z-10 transition-colors duration-500",
                                step.status === 'complete' ? "bg-indigo-200 dark:bg-indigo-700/50" : "bg-zinc-100 dark:bg-zinc-800"
                            )}></div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 z-10 bg-white dark:bg-zinc-800",
                                step.status === 'complete'
                                    ? "border-green-500 text-green-500 bg-green-50 dark:bg-green-900/10"
                                    : step.status === 'active'
                                        ? "border-indigo-500 text-indigo-500 animate-pulse bg-indigo-50 dark:bg-indigo-900/10"
                                        : "border-zinc-200 dark:border-zinc-700 text-zinc-300"
                            )}>
                                {step.status === 'complete' ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                ) : (
                                    <step.icon className="w-3.5 h-3.5" />
                                )}
                            </div>

                            <div className="flex-1 pt-0.5">
                                <div className="flex items-center justify-between">
                                    <h4 className={clsx(
                                        "text-sm font-medium transition-colors",
                                        step.status === 'pending' ? "text-muted-foreground" : "text-foreground"
                                    )}>
                                        {step.label}
                                    </h4>
                                    {step.status === 'active' && <span className="text-[10px] text-indigo-500 font-mono animate-pulse">PROCESSING</span>}
                                </div>

                                {/* Logs for this step */}
                                {(step.status === 'active' || (step.status === 'complete' && step.logs.length > 0)) && (
                                    <div className="mt-2 space-y-1">
                                        {step.logs.map((log, i) => (
                                            <div key={i} className="flex gap-2 text-[11px] font-mono text-indigo-600/80 dark:text-indigo-400/80 animate-in slide-in-from-left-2 fade-in duration-300">
                                                <span className="shrink-0 opacity-50">{'>'}</span>
                                                <span>{log}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
