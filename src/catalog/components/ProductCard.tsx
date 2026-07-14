import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const thumb = product.images[0]

  return (
    <button
      onClick={onClick}
      aria-label={`View ${product.name} details`}
      className="group text-left w-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
            📦
          </div>
        )}

        {/* Colorways count badge · Diego a11y ask (2026-07-10):
            border-white / text-white / bg-black eran raw · reemplazados
            por tokens semánticos (background/foreground) que respetan DS
            y hacen swap en dark mode. */}
        {product.colorways.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
            {product.colorways.slice(0, 5).map(cw => (
              <div
                key={cw.code}
                className="w-3.5 h-3.5 rounded-full border border-background/70 shadow-sm"
                style={{ backgroundColor: cw.hex }}
                title={cw.name}
              />
            ))}
            {product.colorways.length > 5 && (
              <span className="text-[9px] text-background bg-foreground/50 backdrop-blur-sm rounded-full px-1 ml-0.5">
                +{product.colorways.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info · Diego a11y ask · el hover en text-primary (lime) sobre
          bg-card blanco tenía contraste bajo (WCAG AA fail). Cambio a
          underline dashed con decoration-primary en hover · el text-
          foreground queda siempre AAA y el lime aparece solo como signal
          en el underline (donde el 2px sí pasa AA). */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-foreground group-hover:underline group-hover:decoration-primary group-hover:decoration-2 group-hover:underline-offset-4 transition-all truncate">
          {product.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </div>
    </button>
  )
}
