// F50 · Wave 2 (extensión post-approval) · Grid density selector para V2.
// Permite al usuario elegir entre Auto (recomendado según pantalla), 2, 3
// o 4 columnas. La preferencia persiste en localStorage.
//
// Auto usa el default responsive:
//   base: 1 col · sm: 2 col · lg: 3 col · xl: 3 col
// 2 / 3 / 4 fuerzan un techo específico en xl+ (los breakpoints menores
// mantienen densidades progresivas para no romper mobile).
//
// Implementación · segmented-pill built con tokens del DS (bg-card,
// border-border, bg-primary, text-primary-foreground, text-muted-foreground).
// Mismo pattern que usa hoy el toggle Products/Materials/Spaces en el
// ShowroomPage. El bundle deployado de strata-design-system no exporta
// ToggleGroup/ToggleGroupItem, así que armamos el segmented control con
// buttons nativos + tokens del DS. Cero componentes ad-hoc; los estilos
// vienen 100% de los tokens semánticos.
//
// Skills · Refactoring UI · Spacing (control del usuario sobre densidad).

import { LayoutGrid, Columns2, Columns3, Columns4 } from 'lucide-react'

export type GridDensity = 'auto' | '2' | '3' | '4'

interface GridDensitySelectorProps {
    value: GridDensity
    onChange: (value: GridDensity) => void
    /** Etiqueta opcional a la izquierda del selector (ej: "Density"). */
    label?: string
}

const OPTIONS: Array<{
    value: GridDensity
    icon: React.ComponentType<{ className?: string }>
    hint: string
}> = [
    { value: 'auto', icon: LayoutGrid, hint: 'Auto · adapts to screen size' },
    { value: '2', icon: Columns2, hint: '2 columns' },
    { value: '3', icon: Columns3, hint: '3 columns' },
    { value: '4', icon: Columns4, hint: '4 columns' },
]

export default function GridDensitySelector({ value, onChange, label }: GridDensitySelectorProps) {
    return (
        <div className="inline-flex items-center gap-2">
            {label && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            )}
            <div
                role="radiogroup"
                aria-label="Grid density"
                className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
            >
                {OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isActive = value === opt.value
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            title={opt.hint}
                            aria-label={opt.hint}
                            onClick={() => onChange(opt.value)}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Devuelve las Tailwind classes del grid según la densidad seleccionada.
 * Los breakpoints menores siempre progresan de 1 a N para no romper mobile.
 */
export function gridClassesFor(density: GridDensity): string {
    switch (density) {
        case '2':
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2'
        case '3':
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
        case '4':
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        case 'auto':
        default:
            // Wave 2.b default · 3-col en xl para aire editorial.
            return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
    }
}

const STORAGE_KEY = 'catalog-grid-density-v2'

/** Lee la preferencia de density del localStorage; default 'auto'. */
export function loadGridDensity(): GridDensity {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === '2' || saved === '3' || saved === '4' || saved === 'auto') return saved
    } catch {
        /* private mode · noop */
    }
    return 'auto'
}

/** Persiste la preferencia de density en el localStorage. */
export function saveGridDensity(density: GridDensity): void {
    try {
        localStorage.setItem(STORAGE_KEY, density)
    } catch {
        /* private mode · noop */
    }
}
