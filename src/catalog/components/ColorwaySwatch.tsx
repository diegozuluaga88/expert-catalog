import type { Colorway } from '../types'

interface ColorwaySwatchProps {
  colorways: Colorway[]
  selected: string | null
  onSelect: (code: string) => void
}

export default function ColorwaySwatch({ colorways, selected, onSelect }: ColorwaySwatchProps) {
  if (colorways.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Colorways</h4>
      <div className="flex flex-wrap gap-3">
        {colorways.map(cw => (
          <button
            key={cw.code}
            onClick={() => onSelect(cw.code)}
            aria-label={`Select ${cw.name} (${cw.code})`}
            className={`flex flex-col items-center gap-1 group transition-transform hover:scale-105 ${
              selected === cw.code ? 'scale-105' : ''
            }`}
          >
            <div
              className={`w-12 h-12 rounded-sm border-2 transition-all shadow-sm ${
                selected === cw.code
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border/60 hover:border-foreground/30'
              }`}
              style={{ backgroundColor: cw.hex }}
            />
            <span className="text-[9px] text-muted-foreground font-mono leading-tight">{cw.code}</span>
          </button>
        ))}
      </div>

      {/* Selected swatch info */}
      {selected && (() => {
        const cw = colorways.find(c => c.code === selected)
        return cw ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm border border-border" style={{ backgroundColor: cw.hex }} />
            <span className="text-sm font-medium text-foreground">{cw.name}</span>
            <span className="text-xs text-muted-foreground font-mono">· {cw.code}</span>
          </div>
        ) : null
      })()}
    </div>
  )
}
