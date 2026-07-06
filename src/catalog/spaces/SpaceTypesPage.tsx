import { ChevronRight, MapPin } from 'lucide-react'
import { SPACE_TYPES, SPACE_TYPE_SETTINGS } from '../data/spaceTypes'
import type { SpaceType } from '../types'

interface Props {
    onSelectSpaceType: (type: SpaceType) => void
}

// Page inicial del módulo Space Types · muestra las 6 tipologías (Focus Room,
// Work Cafe, etc) con description + count de settings + botón "View settings".
export default function SpaceTypesPage({ onSelectSpaceType }: Props) {
    return (
        <div className="space-y-6">
            {/* Header · onboarding */}
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/15 p-2">
                        <MapPin className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Space Type Settings</h2>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                            Pre-configured furniture bundles for common workplace scenarios · Focus Rooms, Work Cafes,
                            Huddle Rooms, Meeting Rooms, and more. Each setting comes with an item list, estimated cost
                            range and can be added to your selection in one click.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de Space Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPACE_TYPES.map(type => {
                    const settings = SPACE_TYPE_SETTINGS.filter(s => s.spaceTypeId === type.id)
                    const costMin = Math.min(...settings.map(s => s.bundle.estimatedCostMin))
                    const costMax = Math.max(...settings.map(s => s.bundle.estimatedCostMax))
                    return (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => onSelectSpaceType(type)}
                            className="group text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="text-3xl">{type.icon}</div>
                                    <div className="flex flex-wrap gap-1">
                                        {type.spaceProfile.map(sp => (
                                            <span
                                                key={sp}
                                                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                                title={
                                                    sp === 'CCO' ? 'Contact Center / Operations'
                                                        : sp === 'GW' ? 'General Workspace'
                                                            : 'Client Interact'
                                                }
                                            >
                                                {sp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-1">{type.name}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                                    {type.description}
                                </p>
                                <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                                    <div>
                                        <span className="font-semibold text-foreground">{settings.length}</span>
                                        <span className="text-muted-foreground ml-1">
                                            {settings.length === 1 ? 'setting' : 'settings'}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        From <span className="font-semibold text-foreground">${costMin.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-border bg-muted/20 px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-foreground group-hover:bg-muted/40 transition-colors">
                                <span>View settings</span>
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{SPACE_TYPES.length}</span> space types ·{' '}
                    <span className="font-semibold text-foreground">{SPACE_TYPE_SETTINGS.length}</span> pre-configured settings ·
                    inspired by Steelcase Furniture Playbook + MillerKnoll Catalog Q3 2023
                </p>
            </div>
        </div>
    )
}
