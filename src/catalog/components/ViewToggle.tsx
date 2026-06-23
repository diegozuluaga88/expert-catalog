import { Squares2X2Icon, RectangleStackIcon } from '@heroicons/react/24/outline'
import type { ViewMode } from '../types'

interface ViewToggleProps {
  value: ViewMode
  onChange: (v: ViewMode) => void
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1" role="group" aria-label="View mode">
      <button
        onClick={() => onChange('shelf')}
        aria-label="Shelf view"
        aria-pressed={value === 'shelf'}
        className={`p-1.5 rounded-md transition-colors ${
          value === 'shelf'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <RectangleStackIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
        className={`p-1.5 rounded-md transition-colors ${
          value === 'grid'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Squares2X2Icon className="w-4 h-4" />
      </button>
    </div>
  )
}
