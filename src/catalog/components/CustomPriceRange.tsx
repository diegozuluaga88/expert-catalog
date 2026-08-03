// F50 · Wave 2 (extensión post-approval) · Custom price range input · V2.
// Permite al usuario ingresar un rango de precio custom (min y max) además
// de los presets del filtro de Price Range. Coexiste con los presets — si
// hay un custom activo, el filtro incluye ambos (OR).
//
// Usa átomos del Strata Design System: Input (con prefix "$"), Button,
// Field + FieldLabel + FieldDescription para etiquetado accesible.
//
// Skills · Nielsen H7 · Flexibility & efficiency of use.

import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
// El bundle deployado de strata-design-system exporta Field y Label desde
// el catalyst (HeadlessUI-based). FieldLabel del source no está en el
// bundle publicado · usamos Label del catalyst asociado a Field.
import { Input, Button, Field, Label } from 'strata-design-system'

export interface PriceRangeValue {
    min: number
    max: number
}

interface CustomPriceRangeProps {
    /** Rango custom activo · null si no hay custom aplicado. */
    value: PriceRangeValue | null
    onChange: (range: PriceRangeValue | null) => void
}

export default function CustomPriceRange({ value, onChange }: CustomPriceRangeProps) {
    // State local del formulario · commit al Apply, no on-change (evita
    // re-renderar el grid completo por cada tecla).
    const [minInput, setMinInput] = useState<string>(value ? String(value.min) : '')
    const [maxInput, setMaxInput] = useState<string>(value ? String(value.max) : '')

    const handleApply = (e?: FormEvent) => {
        if (e) e.preventDefault()
        const min = parseFloat(minInput)
        const max = parseFloat(maxInput)
        // Validación mínima · min >= 0, max > min. Si el par es inválido,
        // no aplica (el user ve los inputs en rojo sería otro nice-to-have).
        if (!isNaN(min) && !isNaN(max) && min >= 0 && max > min) {
            onChange({ min, max })
        }
    }

    const handleClear = () => {
        setMinInput('')
        setMaxInput('')
        onChange(null)
    }

    const isValid = () => {
        const min = parseFloat(minInput)
        const max = parseFloat(maxInput)
        return !isNaN(min) && !isNaN(max) && min >= 0 && max > min
    }

    return (
        <form onSubmit={handleApply} className="mt-2 space-y-2">
            <div className="flex items-end gap-2">
                <Field className="flex-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Min
                    </Label>
                    <Input
                        id="custom-price-min"
                        type="number"
                        min={0}
                        step={100}
                        placeholder="0"
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        prefix={<span className="text-xs text-muted-foreground">$</span>}
                        className="h-8 text-sm"
                    />
                </Field>
                <Field className="flex-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Max
                    </Label>
                    <Input
                        id="custom-price-max"
                        type="number"
                        min={0}
                        step={100}
                        placeholder="10000"
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        prefix={<span className="text-xs text-muted-foreground">$</span>}
                        className="h-8 text-sm"
                    />
                </Field>
                <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    disabled={!isValid()}
                    className="h-8"
                >
                    Apply
                </Button>
            </div>
            {value && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 px-2 py-1 text-[11px]">
                    <span className="text-foreground font-medium">
                        Custom range · ${value.min.toLocaleString()} – ${value.max.toLocaleString()}
                    </span>
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Clear custom range"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
                    >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </form>
    )
}
