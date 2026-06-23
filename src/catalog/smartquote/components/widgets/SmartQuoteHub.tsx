import { useState, useEffect } from 'react';
import { useGenUI, GenUIProvider } from '../../context/GenUIContext';
import ModeSelectionArtifact from '../gen-ui/artifacts/ModeSelectionArtifact';
import AssetReviewArtifact from '../gen-ui/artifacts/AssetReviewArtifact';
import ERPSystemSelectorArtifact from '../gen-ui/artifacts/ERPSystemSelectorArtifact';
import QuoteExtractionArtifact from '../gen-ui/artifacts/QuoteExtractionArtifact';
import QuoteSetupModal from '../catalogs/QuoteSetupModal';
import OrderImportFlow from '../forms/OrderImportFlow';
import {
    CheckCircleIcon,
    DocumentPlusIcon,
    ArrowRightIcon,
    WrenchScrewdriverIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

// Wrapper to intercept context messages
function SmartQuoteHubContent({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const { messages, sendMessage } = useGenUI();
    const [mode, setMode] = useState<'selection' | 'erp_selection' | 'processing' | 'review' | 'success'>('selection');
    const [reviewData, setReviewData] = useState<any>(null);

    // Legacy Modes State
    const [showManualQuote, setShowManualQuote] = useState(false);
    const [showImportFlow, setShowImportFlow] = useState(false);

    // Intercept messages to drive state
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        const content = lastMsg.content.toLowerCase();

        // 1. Transition: Selection -> Processing/Review OR ERP Selection
        if (mode === 'selection') {
            if (content.includes('mode selected: file') || content.includes('upload request') || content.includes('magic upload')) {
                setMode('processing');
                // Initialize artifact with filename
                setReviewData({ source: 'upload', fileName: 'Request_Upload.pdf' });
            } else if (content.includes('processed upload')) {
                setMode('processing');
                setReviewData({ source: 'upload', fileName: 'Request_Upload.pdf' });
            } else if (content.includes('mode selected: connect erp')) {
                setMode('erp_selection');
            }
        }

        // 2. Transition: ERP Selection -> Processing -> Review
        if (mode === 'erp_selection') {
            if (content.includes('system selected')) {
                setMode('processing');
                setReviewData({ source: 'erp', fileName: 'NetSuite Import #4921' });
            }
        }

        // 3. Transition: Review -> Success/Redirect
        if (mode === 'review') {
            if ((content.includes('purchase order') && content.includes('submitted')) || (content.includes('quote') && content.includes('created'))) {
                if (!content.includes('start new quote')) {
                    setMode('success');
                    setTimeout(() => {
                        if (onNavigate) onNavigate('transactions');
                    }, 1500);
                }
            } else if (content.includes('start new quote')) {
                setMode('selection');
                setReviewData(null);
            }
        }

    }, [messages, mode, onNavigate]);

    // Handlers
    const handleExtractionComplete = (data: any) => {
        setReviewData(data);
        setMode('review');
    };

    const handleManualQuoteComplete = () => {
        setShowManualQuote(false);
        if (onNavigate) onNavigate('transactions');
    };

    const handleImportComplete = (data: any) => {
        setShowImportFlow(false);
        if (onNavigate) onNavigate('transactions');
    };

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-[600px] flex flex-col relative">
            {/* Header (Shared) */}
            {mode === 'selection' && (
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <DocumentPlusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-brand font-semibold text-foreground">Quick Quote</h3>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                Autonomous Mode
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">AI-Powered Quote Generation</p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative flex flex-col">
                {mode === 'selection' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-micro">
                            <ModeSelectionArtifact />
                        </div>

                        {/* Legacy Modes Footer */}
                        <div className="p-4 bg-muted/20 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Other Methods (Legacy)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowManualQuote(true)}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left group"
                                >
                                    <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                                        <WrenchScrewdriverIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Manual Builder</div>
                                        <div className="text-[10px] text-muted-foreground">Standard catalog browser</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setShowImportFlow(true)}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left group"
                                >
                                    <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Standard Import</div>
                                        <div className="text-[10px] text-muted-foreground">CSV/Excel Template</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {mode === 'erp_selection' && (
                    <div className="h-full overflow-y-auto p-4 animate-in slide-in-from-right duration-500 scrollbar-micro">
                        <ERPSystemSelectorArtifact />
                    </div>
                )}

                {mode === 'processing' && reviewData && (
                    <QuoteExtractionArtifact
                        fileName={reviewData.fileName || 'Document.pdf'}
                        onComplete={handleExtractionComplete}
                    />
                )}

                {mode === 'review' && reviewData && (
                    <div className="h-full animate-in slide-in-from-right duration-500">
                        <AssetReviewArtifact data={reviewData} source={reviewData.source} />
                    </div>
                )}

                {mode === 'success' && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Order Submitted!</h3>
                        <p className="text-muted-foreground mb-8">Redirecting to Transactions...</p>
                        <button onClick={() => onNavigate && onNavigate('transactions')} className="flex items-center gap-2 text-primary font-medium hover:underline">
                            Go to Transactions Now <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Legacy Modals */}
            <QuoteSetupModal
                isOpen={showManualQuote}
                onClose={() => setShowManualQuote(false)}
                catalogName="General Catalog"
            />
            {showImportFlow && (
                <div className="absolute inset-0 bg-card z-50 animate-in slide-in-from-bottom duration-300">
                    <OrderImportFlow
                        onImportComplete={handleImportComplete}
                        onCancel={() => setShowImportFlow(false)}
                    />
                </div>
            )}
        </div>
    );
}

export default function SmartQuoteHub(props: { onNavigate?: (page: string) => void }) {
    return (
        <GenUIProvider>
            <SmartQuoteHubContent {...props} />
        </GenUIProvider>
    );
}
