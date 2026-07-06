import { useState } from 'react'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { settingsForSpaceType } from '../data/spaceTypes'
import type { SpaceType, SpaceTypeSetting } from '../types'
import SpaceBundleCard from './SpaceBundleCard'
import { useQuote } from '../../quote/QuoteContext'

interface Props {
    spaceType: SpaceType
    onBack: () => void
    onViewSelection: () => void
}

// Detail page de un Space Type · muestra los settings (F1-F4, WC1-WC2, etc)
// como grid de cards. Cada card tiene botón "Add all to Selection" que llama
// a QuoteContext.addBundle(setting).
export default function SpaceTypeDetailPage({ spaceType, onBack, onViewSelection }: Props) {
    const settings = settingsForSpaceType(spaceType.id)
    const { addBundle } = useQuote()

    // Toast confirmación · usa el pattern del modal existente
    const [toast, setToast] = useState<{ code: string; itemCount: number } | null>(null)

    const handleAdd = (setting: SpaceTypeSetting) => {
        addBundle(setting)
        const itemCount = setting.bundle.items.reduce((s, i) => s + i.qty, 0)
        setToast({ code: setting.code, itemCount })
        setTimeout(() => setToast(null), 4000)
    }

    return (
        <div className="space-y-6 relative">
            {/* Breadcrumb + back */}
            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Space Types
                </button>
                <div className="flex items-start gap-3">
                    <div className="text-4xl">{spaceType.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-foreground">{spaceType.name}</h1>
                            <div className="flex flex-wrap gap-1">
                                {spaceType.spaceProfile.map(sp => (
                                    <span
                                        key={sp}
                                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                    >
                                        {sp}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                            {spaceType.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de settings · 2 columnas en desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.map(setting => (
                    <SpaceBundleCard
                        key={setting.id}
                        setting={setting}
                        onAddToSelection={handleAdd}
                    />
                ))}
            </div>

            {settings.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">No settings configured for this space type yet.</p>
                </div>
            )}

            {/* Toast · confirmación con CTA a la selection */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground" />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                            {toast.itemCount} items added from {toast.code}
                        </span>
                        <button
                            type="button"
                            onClick={onViewSelection}
                            className="self-start text-xs font-semibold text-foreground underline hover:no-underline"
                        >
                            View My Selection →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
