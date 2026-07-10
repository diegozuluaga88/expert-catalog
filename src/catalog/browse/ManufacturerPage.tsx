// MRL Detail Fase D2 (2026-07-10) · refactor a la estructura del referente
// myresourcelibrary.com/library/{brand}. Layout full-width con max container ·
// bloque hero + descripción en 2 columnas · info bar inline (D4) · grid 3-col
// de category cards (variantes en D3). Sin sidebar lateral (decisión Diego).
//
// Cambios vs versión anterior:
// - Descartados el aside w-52 (Filter/Resources/Contacts) y el aside w-72
//   (descripción centrada) · su contenido migra a la InfoBar inline en D4.
// - Descartados los `text-white` / `from-black/60 via-black/30` del overlay
//   del hero · sustituidos por tokens (`text-background` + `bg-foreground/40
//   backdrop-blur-sm`) para dark mode automático.
// - Breadcrumb inline reemplazado por el shared `Breadcrumbs` component de
//   `src/components/Breadcrumbs.tsx`.
// - CategoryCard actual (emoji-circle) queda como render temporal · será
//   reemplazado por la CategoryCard polimórfica de Fase D3.

import type { Manufacturer, Category } from '../types'
import Breadcrumbs from '../../components/Breadcrumbs'
import CategoryCard from '../components/CategoryCard'
import ManufacturerInfoBar from '../components/ManufacturerInfoBar'
import ManufacturerHero from '../components/ManufacturerHero'

interface ManufacturerPageProps {
  manufacturer: Manufacturer
  onBack: () => void
  onSelectCategory: (c: Category) => void
}

export default function ManufacturerPage({ manufacturer, onBack, onSelectCategory }: ManufacturerPageProps) {
  const blocks = manufacturer.descriptionBlocks

  return (
    <div className="min-h-[calc(100vh-96px)] bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Breadcrumb · reusa el shared component. Brand name en `active`
            queda con text-foreground medium (comportamiento default del
            componente); si Diego quiere primary color, se ajusta en D6. */}
        <Breadcrumbs
          items={[
            { label: 'Library', onClick: onBack },
            { label: manufacturer.name, active: true },
          ]}
        />

        {/* Hero + Descripción · 2 columnas en md+, apiladas en mobile */}
        <div className="mt-6 grid md:grid-cols-2 gap-8">

          {/* Hero media · componente extraído · incluye botones flotantes
              expand/download + modal fullscreen (Fase D5). */}
          <ManufacturerHero manufacturer={manufacturer} />

          {/* Brand block · logo (fallback texto) + descripción rich-text */}
          <div className="flex flex-col justify-center">
            {manufacturer.logo ? (
              <img
                src={manufacturer.logo}
                alt={`${manufacturer.name} logo`}
                className="h-12 w-auto object-contain mb-4 self-start"
              />
            ) : (
              <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight mb-4">
                {manufacturer.name}
              </h1>
            )}

            {blocks && blocks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {blocks.map((block, i) => (
                  <div key={i}>
                    {block.heading && (
                      <h3 className="font-semibold text-foreground mb-1">{block.heading}</h3>
                    )}
                    <p className="text-foreground/85 leading-relaxed text-sm">
                      {block.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/85 leading-relaxed text-sm">
                {manufacturer.description}
              </p>
            )}
          </div>
        </div>

        {/* InfoBar inline · Filter · Resources · Links · Contacts.
            El componente se skipea a null si el manufacturer no tiene
            ninguna de las 4 secciones (Nielsen H8). */}
        <ManufacturerInfoBar manufacturer={manufacturer} />

        {/* Category grid · Fase D3 reemplazará `CategoryCard` emoji-circle
            por la polimórfica con 5 variantes. */}
        <div className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Explore {manufacturer.categories.length} categories
          </h2>
          {manufacturer.categories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm text-foreground font-medium">No categories yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                The editor hasn't populated categories for this brand.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {manufacturer.categories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  manufacturer={manufacturer}
                  onClick={() => onSelectCategory(cat)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
