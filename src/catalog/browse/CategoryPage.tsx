import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import type { Manufacturer, Category, Product } from '../types'
import ProductCard from '../components/ProductCard'

interface CategoryPageProps {
  manufacturer: Manufacturer
  category: Category
  onBack: () => void
  onGoToLibrary?: () => void
  onSelectProduct: (p: Product) => void
}

export default function CategoryPage({ manufacturer, category, onBack, onGoToLibrary, onSelectProduct }: CategoryPageProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-1.5 text-sm flex-wrap">
          <button
            onClick={onGoToLibrary}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to library"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Library</span>
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {manufacturer.name}
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-medium">{category.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-xl font-semibold text-foreground">{category.name}</h1>
          <span className="text-sm text-muted-foreground">{category.products.length} products</span>
        </div>

        {category.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-medium text-foreground">No products in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {category.products.map(product => (
              <ProductCard key={product.id} product={product} onClick={() => onSelectProduct(product)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
