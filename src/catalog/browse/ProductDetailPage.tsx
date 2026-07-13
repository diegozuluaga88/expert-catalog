// MRL Product Detail Fase P2 (2026-07-10) · refactor a la estructura del
// referente myresourcelibrary.com/library/{brand}/{category}/{product}.
// Layout · max-w-7xl mx-auto + Breadcrumbs shared + hero grande + info panel
// side-by-side. Sin el image-tab switcher (Images/Galleries) · imágenes y
// galleries se combinan en un solo strip de thumbnails. Sin sidebar propio
// (Diego decisión previa).
//
// Cambios vs versión anterior:
// - Descartado el aside w-420px con image switcher + colorways · su contenido
//   migra a la columna izq del grid principal.
// - Breadcrumb inline reemplazado por src/components/Breadcrumbs.tsx.
// - Se aplica `enrichProductForDetail(product)` para tener parts + options
//   disponibles (consumidos por Fases P3-P6).
// - Se mantienen las 6 tabs actuales (Overview/Specs/Perf/Cleaning/Docs/
//   Symbols) tal cual en el info panel derecho (Diego decisión · Fase P1).
// - Tab strip primaria Images/Parts/Options se agrega en Fase P3.

import { useState } from 'react'
import {
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon, ChevronDownIcon, ChevronUpIcon,
  PhotoIcon, Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import type { Manufacturer, Category, Product } from '../types'
import ColorwaySwatch from '../components/ColorwaySwatch'
import CatalogVerifyPill from '../../components/ocr/CatalogVerifyPill'
import Breadcrumbs from '../../components/Breadcrumbs'
import SegmentedTabs from '../components/SegmentedTabs'
import ManufacturerInfoBar from '../components/ManufacturerInfoBar'
import { enrichProductForDetail } from '../data/mockProductFallbacks'
import { enrichManufacturerForDetail } from '../data/mockBrandFallbacks'
import { skuForProduct } from './catalogSku'

// MRL Product Detail P9 (2026-07-10) · Diego pidió integrar las 2 tab bars
// (info-panel + primaria Images/Parts/Options) en una sola · unificamos
// bajo un mismo tipo `Tab`. Ahora hay una única navegación tabular
// full-width debajo del bloque hero+info.
type Tab =
  | 'overview' | 'specs' | 'performance' | 'cleaning' | 'documents' | 'symbols'
  | 'images' | 'parts' | 'options'
type OptionsSubtab = 'bases' | 'frameColors' | 'glides'

interface ProductDetailPageProps {
  manufacturer: Manufacturer
  category: Category
  product: Product
  onBack: () => void
  onGoToLibrary?: () => void
  onGoToManufacturer?: () => void
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <p className="text-sm text-foreground font-medium">{label}</p>
    </div>
  )
}

function InfoTable({ data }: { data: Record<string, string> }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(data).map(([key, val]) => (
          <tr key={key} className="border-b border-border last:border-0">
            <td className="py-2.5 pr-4 font-semibold text-foreground uppercase text-xs tracking-wide w-52 shrink-0 align-top">
              {key}
            </td>
            <td className="py-2.5 text-muted-foreground leading-relaxed">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FeatureList({ title, items, note }: { title: string; items: string[]; note?: string }) {
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 5
  const visible = expanded ? items : items.slice(0, LIMIT)

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {title}
        {note && <span className="font-normal text-muted-foreground ml-1">{note}</span>}
      </h3>
      <ul className="space-y-1">
        {visible.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="mt-2 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      {items.length > LIMIT && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
        >
          {expanded ? (
            <><ChevronUpIcon className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDownIcon className="w-3.5 h-3.5" /> {items.length - LIMIT} more...</>
          )}
        </button>
      )}
    </div>
  )
}

export default function ProductDetailPage({
  manufacturer: rawManufacturer, category, product: rawProduct, onBack, onGoToLibrary, onGoToManufacturer,
}: ProductDetailPageProps) {
  // Enrich · aplica mock parts + options si el producto no los trae. Consumido
  // por las Fases P3-P6 (tab strip Images/Parts/Options).
  const product = enrichProductForDetail(rawProduct)
  // Enrich del manufacturer · reusa el mock fallback del MRL Detail para
  // tener Brand Resources + Contacts + Links siempre presentes en el
  // InfoBar del col izq (mirror del sidebar del referente).
  const manufacturer = enrichManufacturerForDetail(rawManufacturer)

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [optionsSubtab, setOptionsSubtab] = useState<OptionsSubtab>('bases')
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(
    product.colorways[0]?.code ?? null
  )

  // Combina images + galleries en un solo pool · el switcher se elimina en
  // este refactor · el usuario ve todos los thumbnails abajo del hero.
  const galleryPool = [...product.images, ...(product.galleries ?? [])]

  const hasSymbols = product.symbols && product.symbols.length > 0
  const hasStdFeatures = product.standardFeatures && product.standardFeatures.length > 0
  const hasOptFeatures = product.optionalFeatures && product.optionalFeatures.length > 0

  // Fase P11 · dos zonas de content según la naturaleza del tab:
  // - content-tabs (Overview/Specs/etc) · text-heavy · vive en col der al
  //   lado del hero · caben cómodos en ~50% del ancho.
  // - resource-tabs (Images/Parts/Options) · grid-heavy · vive full-width
  //   debajo del grid principal · necesitan aire horizontal para no
  //   apretar los cards a 2 cols.
  const RESOURCE_TABS: Tab[] = ['images', 'parts', 'options']
  const isResourceTab = RESOURCE_TABS.includes(activeTab)

  // Tab bar unificada · content-first tabs primero (Overview/Specs/etc),
  // luego resources (Images/Parts/Options). Todas usan la misma UI · el
  // user encuentra todo en un solo strip sin duplicaciones visuales.
  type TabItem = { id: Tab; label: string; count?: number }
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specs' },
    { id: 'performance', label: 'Performance' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'documents', label: 'Documents', count: product.documents.length },
    ...(hasSymbols ? [{ id: 'symbols' as Tab, label: 'Symbols' }] : []),
    { id: 'images', label: 'Images', count: galleryPool.length },
    { id: 'parts', label: 'Parts', count: product.parts?.length ?? 0 },
    { id: 'options', label: 'Options' },
  ]

  return (
    <div className="min-h-[calc(100vh-96px)] bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Breadcrumb 4-nivel · reusa shared Breadcrumbs component. */}
        <Breadcrumbs
          items={[
            { label: 'Library', onClick: onGoToLibrary },
            { label: manufacturer.name, onClick: onGoToManufacturer },
            { label: category.name, onClick: onBack },
            { label: product.name, active: true },
          ]}
        />

        {/* Hero + Info panel · 2 columnas en lg+, apiladas en mobile. */}
        <div className="mt-6 grid gap-8 lg:grid-cols-2">

          {/* ─── Columna izq · hero grande + thumbnails + colorways ─── */}
          <div className="flex flex-col gap-4">
            {/* Hero image · aspect-[4/3] · placeholder si no hay images. */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
              {galleryPool[selectedImage] ? (
                <img
                  src={galleryPool[selectedImage]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <PhotoIcon className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Thumbnail strip · combina images + galleries. */}
            {galleryPool.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {galleryPool.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Image ${i + 1}`}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === i ? 'border-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Colorways section */}
            {product.colorways.length > 0 && (
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Colorways
                    <span className="ml-1.5 text-muted-foreground font-normal">({product.colorways.length})</span>
                  </p>
                  {selectedSwatch && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {product.colorways.find(c => c.code === selectedSwatch)?.name}
                    </span>
                  )}
                </div>
                <ColorwaySwatch
                  colorways={product.colorways}
                  selected={selectedSwatch}
                  onSelect={setSelectedSwatch}
                />
              </div>
            )}

            {/* Brand info · Contacts / Resources / Links del brand, reusando
                el componente del MRL Detail (Fase P8 · Diego consistency
                ask · el user debe encontrar los mismos accesos que en la
                brand page). Se skipea a null si el manufacturer no tiene
                ninguna de las 4 secciones. */}
            <ManufacturerInfoBar manufacturer={manufacturer} layout="stack" />
          </div>

          {/* ─── Columna der · header + description + tab strip + content ─── */}
          <div className="flex flex-col">
            {/* Header · CTA + verify pill arriba (Fitts · action prominente),
                title grande abajo (mirror del referente MRL · el nombre del
                producto es el elemento visualmente más pesado). */}
            <div className="mb-5">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg hover:opacity-95 transition-all">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" strokeWidth={2.5} />
                  See Details
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Catalog status:</span>
                  <CatalogVerifyPill sku={skuForProduct(product.id)} onUseReplacement={() => {}} />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                {manufacturer.name} · {category.name}
              </p>
              <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Description · siempre visible arriba de las tabs (referente).
                Antes vivía dentro del tab Overview · movida acá para que el
                user tenga contexto sin cambiar de tab (Nielsen H1 · visibility). */}
            <p className="mb-6 text-sm text-foreground leading-relaxed">
              {product.description}
            </p>

            {/* ═══ Tab bar UNIFICADA · Fase P10 · vive al lado de la imagen
                (dentro del info panel derecho) como en el layout original.
                Content se renderiza abajo full-width. Diego ask 2026-07-10. ═══ */}
            <SegmentedTabs<Tab>
              items={tabs}
              value={activeTab}
              onChange={setActiveTab}
              variant="underline"
              ariaLabel="Product content sections"
            />

            {/* Content de TODAS las tabs · queda al lado del hero (dentro
                del col der debajo de la tab bar). Diego ask · el content
                de resource-tabs también acá para que no aparezca huérfano
                debajo del col izq (Fase P12 · 2026-07-10). */}
            <div className="py-6">
                {activeTab === 'overview' && (
                  <div>
                    {hasStdFeatures && (
                      <FeatureList
                        title="Standard Features"
                        note="(*Selected models only)"
                        items={product.standardFeatures!}
                      />
                    )}

                    {hasOptFeatures && (
                      <FeatureList
                        title="Optional Features"
                        items={product.optionalFeatures!}
                      />
                    )}

                    {!hasStdFeatures && !hasOptFeatures && Object.keys(product.specs).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Key Specifications</h3>
                        <InfoTable data={Object.fromEntries(Object.entries(product.specs).slice(0, 5))} />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  Object.keys(product.specs).length > 0
                    ? <InfoTable data={product.specs} />
                    : <p className="text-sm text-muted-foreground">No specification data available.</p>
                )}

                {activeTab === 'performance' && (
                  Object.keys(product.performance).length > 0
                    ? <InfoTable data={product.performance} />
                    : <p className="text-sm text-muted-foreground">No performance data available.</p>
                )}

                {activeTab === 'cleaning' && (
                  <div>
                    {product.cleaning ? (
                      <>
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Cleaning Method</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{product.cleaning}</p>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-4">
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">General Guidelines</p>
                          <ul className="space-y-2">
                            {[
                              'Blot spills immediately — do not rub',
                              'Test any cleaning agent in an inconspicuous area first',
                              'Allow fabric to air dry completely before use',
                              'For stubborn stains, consult a professional cleaner',
                            ].map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No cleaning instructions available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    {product.documents.length > 0 ? (
                      <div className="space-y-2">
                        {product.documents.map((doc, i) => (
                          <button
                            key={i}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-muted/30 transition-all group text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                              <DocumentArrowDownIcon className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">{doc.type}</p>
                            </div>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents available.</p>
                    )}
                  </div>
                )}

                {activeTab === 'symbols' && hasSymbols && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download CAD files, Revit families, and SketchUp models for use in your design software.
                    </p>
                    <div className="space-y-2">
                      {product.symbols!.map((folder, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-muted/30 transition-all group text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Square3Stack3DIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{folder.name}</p>
                            {folder.files != null && (
                              <p className="text-xs text-muted-foreground">{folder.files} file{folder.files !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                          <DocumentArrowDownIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content de resource-tabs (Images/Parts/Options) también
                    dentro del col der bajo la tab bar · Diego ask P12.
                    Grids ajustados a menos cols porque el col der ocupa
                    ~50%: Images 2/3, Parts 2/3, Options subtabs 2/3. */}
                {activeTab === 'images' && (
              galleryPool.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryPool.map((img, i) => {
                    const active = selectedImage === i
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        aria-label={`View image ${i + 1} of ${product.name}`}
                        aria-pressed={active}
                        className={`group relative aspect-square rounded-lg overflow-hidden bg-card border transition-all ${
                          active
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/60 hover:ring-2 hover:ring-primary/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} · view ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          draggable={false}
                        />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <p className="text-sm text-foreground font-medium">No images available</p>
                </div>
              )
            )}

              {activeTab === 'parts' && (
              product.parts && product.parts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {product.parts.map(part => (
                    <div key={part.sku} className="flex flex-col">
                      {/* Card shell · mirror del CategoryCard (Nielsen H4 · consistency) */}
                      <div className="group relative aspect-square rounded-lg overflow-hidden bg-card border border-border transition-all hover:border-primary/60 hover:ring-2 hover:ring-primary/30">
                        {part.image ? (
                          <img
                            src={part.image}
                            alt={`Part ${part.sku}`}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            draggable={false}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/20" />
                        )}
                      </div>

                      {/* Label bloque · SKU tabular arriba + subline muted debajo.
                          Diego decisión (Fase D1 MRL Detail) · mismo pattern que
                          CategoryCard.cardSubtitle. */}
                      <div className="mt-2 text-center">
                        <p className="text-sm font-semibold text-foreground tabular-nums leading-snug">
                          {part.sku}
                        </p>
                        {part.subline && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                            {part.subline}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                  <p className="text-sm text-foreground font-medium">No parts available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This product doesn't list replacement parts.
                  </p>
                </div>
              )
            )}

              {activeTab === 'options' && (
              <div>
                {/* Subtabs Bases · Frame Colors · Glide · pill variant. */}
                <SegmentedTabs<OptionsSubtab>
                  items={[
                    { id: 'bases',       label: 'Bases',        count: product.options?.bases?.length ?? 0 },
                    { id: 'frameColors', label: 'Frame Colors', count: product.options?.frameColors?.length ?? 0 },
                    { id: 'glides',      label: 'Glide',        count: product.options?.glides?.length ?? 0 },
                  ]}
                  value={optionsSubtab}
                  onChange={setOptionsSubtab}
                  variant="pill"
                  size="sm"
                  ariaLabel="Product options"
                  className="mb-6"
                />

                {/* Bases · card grid con imagen + label descriptivo */}
                {optionsSubtab === 'bases' && (
                  product.options?.bases && product.options.bases.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {product.options.bases.map(base => (
                        <div key={base.id} className="flex flex-col">
                          <div className="group relative aspect-square rounded-lg overflow-hidden bg-card border border-border transition-all hover:border-primary/60 hover:ring-2 hover:ring-primary/30">
                            {base.image ? (
                              <img
                                src={base.image}
                                alt={base.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                draggable={false}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/20" />
                            )}
                          </div>
                          <p className="mt-2 text-sm text-foreground text-center leading-snug">
                            {base.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No base options" />
                  )
                )}

                {/* Frame Colors · swatch grid con background hex + label */}
                {optionsSubtab === 'frameColors' && (
                  product.options?.frameColors && product.options.frameColors.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {product.options.frameColors.map(fc => (
                        <div key={fc.id} className="flex flex-col">
                          <div
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border transition-all hover:border-primary/60 hover:ring-2 hover:ring-primary/30"
                            style={{ backgroundColor: fc.hex }}
                            aria-label={`${fc.name} · ${fc.hex}`}
                            role="img"
                          />
                          <p className="mt-2 text-sm text-foreground text-center leading-snug">
                            {fc.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No frame colors" />
                  )
                )}

                {/* Glide · idéntico shell que Bases */}
                {optionsSubtab === 'glides' && (
                  product.options?.glides && product.options.glides.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {product.options.glides.map(glide => (
                        <div key={glide.id} className="flex flex-col">
                          <div className="group relative aspect-square rounded-lg overflow-hidden bg-card border border-border transition-all hover:border-primary/60 hover:ring-2 hover:ring-primary/30">
                            {glide.image ? (
                              <img
                                src={glide.image}
                                alt={glide.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                draggable={false}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-primary/20" />
                            )}
                          </div>
                          <p className="mt-2 text-sm text-foreground text-center leading-snug">
                            {glide.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No glide options" />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
