import { useMemo } from 'react'
import { ChevronRight, MapPin, FilterX, Sparkles } from 'lucide-react'
import {
    SPACE_TYPES, SPACE_TYPE_SETTINGS,
    spaceTypeMinCost, spaceTypeMaxCost, spaceTypeSettingsCount,
    getBrandsInSpaceType, spaceTypeMatchesSearch,
} from '../data/spaceTypes'
import type { SpaceType } from '../types'

export type SpacesSortKey = 'alpha' | 'cost-asc' | 'cost-desc' | 'settings-count'

/** Cost bucket exportado · reusado por ShowroomPage para poblar el FilterSection. */
export const SPACES_COST_BUCKETS = [
    { label: 'Under $2,000', min: 0, max: 2000 },
    { label: '$2,000–$5,000', min: 2000, max: 5000 },
    { label: '$5,000–$10,000', min: 5000, max: 10000 },
    { label: '$10,000+', min: 10000, max: Infinity },
] as const

export interface SpacesFilters {
    search: string
    profiles: Set<'CCO' | 'GW' | 'CI'>
    costBuckets: Set<string>
    brands: Set<string>
}

interface Props {
    onSelectSpaceType: (type: SpaceType) => void
    filters?: SpacesFilters
    sort?: SpacesSortKey
    /** Callback opcional para el botón "Clear filters" del empty-state. */
    onClearFilters?: () => void
    /** Fase 5 · count de custom spaces por parent SpaceType id · muestra badge. */
    customCountByParent?: Record<string, number>
    /** Fase 5 · callback para el botón "Create custom" del empty state. */
    onCreateCustom?: () => void
}

const EMPTY_FILTERS: SpacesFilters = {
    search: '',
    profiles: new Set(),
    costBuckets: new Set(),
    brands: new Set(),
}

// Page inicial del módulo Space Types · muestra las 6 tipologías (Focus Room,
// Work Cafe, etc) con description + count de settings + botón "View settings".
// Fase 4 · acepta filters/sort desde ShowroomPage sidebar.
export default function SpaceTypesPage({
    onSelectSpaceType,
    filters = EMPTY_FILTERS,
    sort = 'alpha',
    onClearFilters,
    customCountByParent = {},
    onCreateCustom,
}: Props) {
    const sorted = useMemo(() => {
        const filtered = SPACE_TYPES.filter(type => {
            if (filters.search && !spaceTypeMatchesSearch(type, filters.search)) return false
            if (filters.profiles.size > 0 && !type.spaceProfile.some(sp => filters.profiles.has(sp))) return false
            if (filters.costBuckets.size > 0) {
                const min = spaceTypeMinCost(type)
                const inBucket = SPACES_COST_BUCKETS.some(
                    b => filters.costBuckets.has(b.label) && min >= b.min && min < b.max,
                )
                if (!inBucket) return false
            }
            if (filters.brands.size > 0) {
                const brands = getBrandsInSpaceType(type)
                if (!brands.some(b => filters.brands.has(b))) return false
            }
            return true
        })
        const arr = [...filtered]
        switch (sort) {
            case 'cost-asc':
                arr.sort((a, b) => spaceTypeMinCost(a) - spaceTypeMinCost(b))
                break
            case 'cost-desc':
                arr.sort((a, b) => spaceTypeMaxCost(b) - spaceTypeMaxCost(a))
                break
            case 'settings-count':
                arr.sort((a, b) => spaceTypeSettingsCount(b) - spaceTypeSettingsCount(a))
                break
            default:
                arr.sort((a, b) => a.name.localeCompare(b.name))
        }
        return arr
    }, [filters, sort])

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.profiles.size > 0 ||
        filters.costBuckets.size > 0 ||
        filters.brands.size > 0

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

            {/* Grid de Space Types · filtered + sorted */}
            {sorted.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map(type => {
                        const settings = SPACE_TYPE_SETTINGS.filter(s => s.spaceTypeId === type.id)
                        const costMin = spaceTypeMinCost(type)
                        return (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => onSelectSpaceType(type)}
                                className="group text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden"
                            >
                                {/* Fase 3.1 · thumbnail arriba con emoji sobre-impuesto bottom-left */}
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    <img
                                        src={type.imageUrl}
                                        alt={type.name}
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                                    <span className="absolute bottom-2 left-2 text-2xl drop-shadow-md" role="img" aria-hidden="true">
                                        {type.icon}
                                    </span>
                                    <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
                                        {type.spaceProfile.map(sp => (
                                            <span
                                                key={sp}
                                                className="inline-flex items-center rounded-full bg-card/85 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/60"
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
                                    {/* Fase 5 · badge de custom count top-left · muestra cuántos custom settings tiene este parent */}
                                    {customCountByParent[type.id] > 0 && (
                                        <span
                                            className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm"
                                            title={`${customCountByParent[type.id]} custom setting(s) created by you`}
                                        >
                                            <Sparkles className="h-2.5 w-2.5" />
                                            {customCountByParent[type.id]} custom
                                        </span>
                                    )}
                                </div>
                                <div className="p-5">
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
            ) : (
                /* Fase 4 · Empty state cuando los filtros dejan 0 matches */
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                    <FilterX className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground mb-1">No space types match your filters</p>
                    <p className="text-xs text-muted-foreground mb-4">Try adjusting or clearing the filters in the sidebar.</p>
                    <div className="inline-flex items-center gap-2">
                        {hasActiveFilters && onClearFilters && (
                            <button
                                type="button"
                                onClick={onClearFilters}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                        {onCreateCustom && (
                            <button
                                type="button"
                                onClick={onCreateCustom}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Sparkles className="h-3 w-3" />
                                Create custom space
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{sorted.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{SPACE_TYPES.length}</span> space types ·{' '}
                    <span className="font-semibold text-foreground">{SPACE_TYPE_SETTINGS.length}</span> pre-configured settings ·
                    inspired by Steelcase Furniture Playbook + MillerKnoll Catalog Q3 2023
                </p>
            </div>
        </div>
    )
}
