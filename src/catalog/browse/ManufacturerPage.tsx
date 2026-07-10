// MRL Detail Fase D2 (2026-07-10) · refactor a la estructura del referente
// myresourcelibrary.com/library/{brand}. Layout full-width con max container ·
// sin sidebar lateral (decisión Diego).
//
// Fase D7 (2026-07-10) · reorganización pedida por Diego para acercarse
// visualmente al referente:
// - Columna IZQ (col-span-2 de 5) · hero apilado + logo + descripción abajo.
// - Columna DER (col-span-3 de 5) · grid 3-cols de category cards al costado
//   del hero (no debajo).
// - InfoBar full-width abajo (donde caben mejor las 4 secciones).

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
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Breadcrumb · reusa el shared component. */}
        <Breadcrumbs
          items={[
            { label: 'Library', onClick: onBack },
            { label: manufacturer.name, active: true },
          ]}
        />

        {/* Layout 2-col principal · IZQ hero+description (col-span-2 de 5) ·
            DER category grid (col-span-3 de 5). En mobile se apila. */}
        <div className="mt-6 grid gap-8 lg:grid-cols-5">

          {/* ─── Columna izq · hero + logo + description apilados ─── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Hero media · botones flotantes expand/download + modal fullscreen. */}
            <ManufacturerHero manufacturer={manufacturer} />

            {/* Brand block · logo (fallback texto) + descripción rich-text.
                Diego ask · queda DEBAJO del hero, no al lado. */}
            <div className="flex flex-col">
              {manufacturer.logo ? (
                <img
                  src={manufacturer.logo}
                  alt={`${manufacturer.name} logo`}
                  className="h-10 w-auto object-contain mb-3 self-start"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-3">
                  {manufacturer.name}
                </h1>
              )}

              {blocks && blocks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {blocks.map((block, i) => (
                    <div key={i}>
                      {block.heading && (
                        <h3 className="font-semibold text-foreground mb-1 text-sm">{block.heading}</h3>
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

          {/* ─── Columna der · category grid al costado del hero ─── */}
          <div className="lg:col-span-3">
            {manufacturer.categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                <p className="text-sm text-foreground font-medium">No categories yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The editor hasn't populated categories for this brand.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

        {/* InfoBar full-width abajo · Filter · Resources · Links · Contacts.
            El componente se skipea a null si el manufacturer no tiene ninguna
            de las 4 secciones (Nielsen H8). */}
        <ManufacturerInfoBar manufacturer={manufacturer} />
      </div>
    </div>
  )
}
