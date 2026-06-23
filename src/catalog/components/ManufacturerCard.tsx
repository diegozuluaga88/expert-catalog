import type { Manufacturer } from '../types'

interface ManufacturerCardProps {
  manufacturer: Manufacturer
  onClick: () => void
}

export default function ManufacturerCard({ manufacturer, onClick }: ManufacturerCardProps) {
  const totalProducts = manufacturer.categories.reduce((acc, c) => acc + c.products.length, 0)

  return (
    <button
      onClick={onClick}
      aria-label={`Open ${manufacturer.name} catalog`}
      className="group text-left w-full bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Color swatch strip */}
      <div
        className="w-full h-16 rounded-lg mb-3 flex items-center justify-center transition-opacity group-hover:opacity-90"
        style={{ backgroundColor: manufacturer.bgColor }}
      >
        <span
          className="text-sm font-bold tracking-wide uppercase"
          style={{ color: manufacturer.textColor }}
        >
          {manufacturer.binderLabel ?? manufacturer.name.split(' ')[0]}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {manufacturer.name}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        {manufacturer.categories.length} {manufacturer.categories.length === 1 ? 'category' : 'categories'} · {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
      </p>
    </button>
  )
}
