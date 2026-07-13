// MRL Product Detail P3 (2026-07-10) · SegmentedTabs polymórfico.
//
// Un solo componente para navegación tabular con dos variants visuales:
//
//   underline  → tab strip primaria (Images/Parts/Options del referente MRL).
//                Border-bottom + underline color primary en la activa.
//   pill       → subtabs (Bases/Frame Colors/Glide dentro de Options).
//                Fondo bg-primary rounded-md en la activa.
//
// Generic tipado por `T extends string` para que el consumidor tenga
// type-safety en `value` y `onChange` con los ids específicos.
//
// Reusable en Fase P3 (primary), P6 (Options subtabs), y P7 si Diego
// quiere Overview/Specs pill tabs en el info panel.

import type { ReactNode } from 'react'

export interface SegmentedTabItem<T extends string> {
    id: T
    label: string
    /** Contador opcional al lado del label · "Images (12)". */
    count?: number
    /** Icon opcional a la izq del label. */
    icon?: ReactNode
}

interface SegmentedTabsProps<T extends string> {
    items: SegmentedTabItem<T>[]
    value: T
    onChange: (id: T) => void
    variant?: 'underline' | 'pill'
    /** Tamaño de los tabs · default `md`. `sm` para subtabs compactos. */
    size?: 'sm' | 'md'
    /** Clases extra al contenedor. */
    className?: string
    /** aria-label del wrapper (`<nav>`) para accessibility. */
    ariaLabel?: string
}

export default function SegmentedTabs<T extends string>({
    items,
    value,
    onChange,
    variant = 'underline',
    size = 'md',
    className = '',
    ariaLabel,
}: SegmentedTabsProps<T>) {
    if (variant === 'pill') {
        const padClass = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        return (
            <nav
                aria-label={ariaLabel}
                className={`inline-flex items-center gap-1 rounded-lg bg-muted p-1 ${className}`}
                role="tablist"
            >
                {items.map(item => {
                    const active = item.id === value
                    return (
                        <button
                            key={item.id}
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(item.id)}
                            className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors ${padClass} ${
                                active
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-foreground/75 hover:text-foreground hover:bg-background/60'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                            {item.count != null && (
                                <span className={active ? 'opacity-90' : 'text-muted-foreground'}>
                                    ({item.count})
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>
        )
    }

    // variant === 'underline' (default)
    const padClass = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
    return (
        <nav
            aria-label={ariaLabel}
            className={`flex gap-0 border-b border-border overflow-x-auto ${className}`}
            role="tablist"
        >
            {items.map(item => {
                const active = item.id === value
                return (
                    <button
                        key={item.id}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.id)}
                        className={`inline-flex items-center gap-1.5 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${padClass} ${
                            active
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                        {item.count != null && (
                            <span className={active ? 'text-muted-foreground' : 'text-muted-foreground/70'}>
                                ({item.count})
                            </span>
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
