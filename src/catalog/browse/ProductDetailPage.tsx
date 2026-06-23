import { useState } from 'react'
import {
  ChevronRightIcon, HomeIcon, ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon, ChevronDownIcon, ChevronUpIcon,
  PhotoIcon, Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import type { Manufacturer, Category, Product } from '../types'
import ColorwaySwatch from '../components/ColorwaySwatch'
import CatalogVerifyPill from '../../components/ocr/CatalogVerifyPill'
import { skuForProduct } from './catalogSku'

type Tab = 'overview' | 'specs' | 'performance' | 'cleaning' | 'documents' | 'symbols'
type ImageTab = 'images' | 'galleries'

interface ProductDetailPageProps {
  manufacturer: Manufacturer
  category: Category
  product: Product
  onBack: () => void
  onGoToLibrary?: () => void
  onGoToManufacturer?: () => void
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
  manufacturer, category, product, onBack, onGoToLibrary, onGoToManufacturer
}: ProductDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [imageTab, setImageTab] = useState<ImageTab>('images')
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(
    product.colorways[0]?.code ?? null
  )

  const hasGalleries = product.galleries && product.galleries.length > 0
  const hasSymbols = product.symbols && product.symbols.length > 0
  const hasStdFeatures = product.standardFeatures && product.standardFeatures.length > 0
  const hasOptFeatures = product.optionalFeatures && product.optionalFeatures.length > 0

  const displayImages = imageTab === 'galleries' && hasGalleries
    ? product.galleries!
    : product.images

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specs' },
    { id: 'performance', label: 'Performance' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'documents', label: 'Documents' },
    ...(hasSymbols ? [{ id: 'symbols' as Tab, label: 'Symbols' }] : []),
  ]

  return (
    <div className="min-h-[calc(100vh-96px)] bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-1.5 text-sm flex-wrap">
          <button
            onClick={onGoToLibrary}
            aria-label="Library"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Library</span>
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <button onClick={onGoToManufacturer} className="text-muted-foreground hover:text-foreground transition-colors">
            {manufacturer.name}
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            {category.name}
          </button>
          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-medium">{product.name}</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: image panel */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-border bg-card overflow-y-auto">

          {/* Images / Galleries tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setImageTab('images'); setSelectedImage(0) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                imageTab === 'images'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <PhotoIcon className="w-3.5 h-3.5" />
              Images
            </button>
            {hasGalleries && (
              <button
                onClick={() => { setImageTab('galleries'); setSelectedImage(0) }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  imageTab === 'galleries'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Square3Stack3DIcon className="w-3.5 h-3.5" />
                Galleries
              </button>
            )}
          </div>

          {/* Main image */}
          <div className="aspect-square bg-muted overflow-hidden">
            {displayImages[selectedImage] ? (
              <img
                src={displayImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl text-muted-foreground">
                <PhotoIcon className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {displayImages.length > 1 && (
            <div className="flex gap-2 p-3 flex-wrap border-b border-border">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === i ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Colorways section */}
          {product.colorways.length > 0 && (
            <div className="p-4 border-b border-border">
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
        </div>

        {/* Right: details panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-0 bg-background border-b border-border">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                  {manufacturer.name} · {category.name}
                </p>
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                {/* Etapa 6a — verificación de catálogo (reusa CatalogVerifyPill de OCR) */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Catalog status:</span>
                  <CatalogVerifyPill sku={skuForProduct(product.id)} onUseReplacement={() => {}} />
                </div>
              </div>
              <button className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                See Details
              </button>
            </div>

            {/* Content tabs */}
            <div className="flex gap-0 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {activeTab === 'overview' && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>

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
          </div>
        </div>
      </div>
    </div>
  )
}
