import { CheckBadgeIcon, ArrowDownTrayIcon, ShareIcon, ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface SuccessModalProps {
    isOpen: boolean;
    type?: 'quote' | 'po';
    poNumber?: string;
    onClose: () => void;
    onCreateNew?: () => void;
}

export default function SuccessModal({ isOpen, type = 'po', poNumber = 'PO-2026-001', onClose, onCreateNew }: SuccessModalProps) {
    if (!isOpen) return null;

    const isPO = type === 'po';

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 text-center p-8 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isPO ? 'from-green-400 to-emerald-600' : 'from-amber-400 to-orange-600'}`}></div>

                <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in spin-in-12 duration-500 ${isPO ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        {isPO ? (
                            <CheckBadgeIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
                        ) : (
                            <DocumentTextIcon className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                    {isPO ? 'Order Submitted!' : 'Quote Created!'}
                </h2>
                <p className="text-muted-foreground mb-6">
                    {isPO ? 'Purchase Order' : 'Quote Reference'} <span className="font-mono font-medium text-foreground">{poNumber}</span> has been successfully created and sent for processing.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.href = `/transactions?tab=${isPO ? 'orders' : 'quotes'}&id=${poNumber}`}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        View in Transactions
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onCreateNew || onClose}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                    >
                        Create New Quote
                    </button>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download PDF
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors">
                            <ShareIcon className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-muted-foreground">
                    A confirmation email has been sent to accounting@dealer.com
                </div>
            </div>
        </div>
    );
}
