import type { Category } from '../types'

interface CategoryCardProps {
  category: Category
  onClick: () => void
}

const ICONS: Record<string, string> = {
  'Chairs': '🪑',
  'Sofas': '🛋️',
  'Conference Chairs and Pods': '💼',
  'Ottomans & Benches': '🪵',
  'Soft Seating': '☁️',
  'Stools': '🪑',
  'Tables': '🪞',
  'Seating & Collaboration': '🤝',
  'Systems & Storage': '🗄️',
  'Systems Casegoods': '📐',
  'Upholstery': '🧵',
  'Panel': '🟦',
  'Acoustics': '🔊',
  'Cubicle & Drapery': '🪟',
  'Panels': '🟦',
  'A–G': '📗',
  'H–M': '📘',
  'N–T': '📙',
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  const icon = category.icon ?? ICONS[category.name] ?? '📁'

  return (
    <button
      onClick={onClick}
      aria-label={`Browse ${category.name}`}
      className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors duration-150"
    >
      {/* Circle icon */}
      <div className="w-24 h-24 rounded-full bg-muted border border-border flex items-center justify-center text-3xl transition-all duration-200 group-hover:bg-card group-hover:shadow-md group-hover:border-primary/30 group-hover:scale-105">
        {icon}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
          {category.name}
        </p>
        {category.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{category.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {category.products.length} {category.products.length === 1 ? 'product' : 'products'}
        </p>
      </div>
    </button>
  )
}
