import type { Manufacturer } from '../types'
import BinderSpine from './BinderSpine'

interface ShelfViewProps {
  manufacturers: Manufacturer[]
  onSelect: (m: Manufacturer) => void
}

const BINDERS_PER_SHELF = 14

export default function ShelfView({ manufacturers, onSelect }: ShelfViewProps) {
  // Expand manufacturers with multiple binders (e.g. Camira Fabrics with binderCount=4)
  const expanded: Array<{ manufacturer: Manufacturer; label: string; index: number }> = []
  for (const m of manufacturers) {
    const count = m.binderCount ?? 1
    if (count > 1) {
      for (let i = 0; i < count; i++) {
        expanded.push({ manufacturer: m, label: `${m.binderLabel ?? m.name} ${i + 1}`, index: i })
      }
    } else {
      expanded.push({ manufacturer: m, label: m.binderLabel ?? m.name, index: 0 })
    }
  }

  // Split into rows
  const rows: typeof expanded[] = []
  for (let i = 0; i < expanded.length; i += BINDERS_PER_SHELF) {
    rows.push(expanded.slice(i, i + BINDERS_PER_SHELF))
  }

  return (
    <div className="space-y-2">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="relative">
          {/* Shelf background */}
          <div className="bg-muted/50 border border-border/60 rounded-lg px-6 pt-5 pb-2">
            {/* Brick wall texture simulation (subtle) */}
            <div className="absolute inset-0 rounded-lg opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_24px,#000_24px,#000_25px),repeating-linear-gradient(90deg,transparent,transparent_47px,#000_47px,#000_48px)]" />

            {/* Binders row */}
            <div className="flex items-end gap-1 flex-wrap min-h-[210px] relative z-10">
              {row.map((item, i) => (
                <BinderSpine
                  key={`${item.manufacturer.id}-${item.index}-${i}`}
                  manufacturer={item.manufacturer}
                  label={item.label}
                  onClick={() => onSelect(item.manufacturer)}
                />
              ))}
            </div>
          </div>

          {/* Shelf plank */}
          <div className="h-3 bg-gradient-to-b from-[#c8a96e] to-[#a07850] rounded-b-sm shadow-md" />
        </div>
      ))}
    </div>
  )
}
