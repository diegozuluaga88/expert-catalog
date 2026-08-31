import { FolderPlus, Package } from 'lucide-react'
import type { Product } from '../types'
import CustomItemBadge from './CustomItemBadge'

interface ProductCardProps {
  product: Product
  onClick: () => void
  /** F50 · Etapa 10.d (MRL adapt) · v2 · si llega, aparece un botón
   *  FolderPlus overlay top-right (visible al hover) que abre el modal
   *  "Add to project". stopPropagation para no gatillar el onClick de
   *  la card. Fallback seguro para v1 · si no llega, no se renderea. */
  onAddToProject?: (product: Product) => void
  /** F50 · sample flow (MRL adapt · 2026-08-03) · v2 · si llega Y el
   *  producto es material, aparece un botón Package overlay top-left
   *  (visible al hover) que agrega al sample draft. Fallback seguro:
   *  si no llega o no es material, no se renderea. */
  onRequestSample?: (product: Product) => void
}

export default function ProductCard({ product, onClick, onAddToProject, onRequestSample }: ProductCardProps) {
  const thumb = product.images[0]

  return (
    <div
      // F51 · B.1 · P2 drag from binder · el card del MRL es draggable ·
      // drop target = ProjectCard en el tab My Projects. Reusa el
      // protocol `application/x-product-id` del ProjectDetailView picker.
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-product-id', product.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`View ${product.name} details`}
        className="text-left w-full"
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

        {/* US-013 · el indicador custom tiene que viajar con el ítem a
            resultados y listas, no vivir solo en el registro. Arriba a
            la izquierda porque las acciones de hover ocupan la derecha. */}
        <div className="absolute left-2 top-2 z-10">
          <CustomItemBadge product={product} onImage />
        </div>

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

      {/* F50 · Etapa 10.d (MRL adapt) · botón overlay Add-to-project ·
          top-right del card · visible en hover. stopPropagation para no
          disparar el onClick de la card (que abre el detail).
          F54 · fallback touch · [@media(hover:none)]:opacity-100 para
          que el overlay siempre esté visible en devices sin hover
          capability (consistente con el pattern F53 del ProductCatalogCardV2). */}
      {onAddToProject && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAddToProject(product)
          }}
          aria-label={`Add ${product.name} to a project`}
          title="Add to a project"
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:bg-card hover:text-foreground group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      )}

      {/* F50 · sample flow · botón overlay Request-sample · top-left del
          card · visible en hover · solo si el producto es material.
          F54 · idem mobile fallback. */}
      {onRequestSample && product.isMaterial && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRequestSample(product)
          }}
          aria-label={`Add ${product.name} to sample draft`}
          title="Add to sample draft"
          className="absolute left-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:bg-card hover:text-foreground group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <Package className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
