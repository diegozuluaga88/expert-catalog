import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Star, Plus } from 'lucide-react'
import type { Product } from '../types'
import { resolveInternalSku, resolveManufacturerSku } from '../browse/catalogSku'
import { getProductVariants } from '../data/productVariants'
import { computeLineItemTotals } from '../../quote/helpers'
import { useQuote } from '../../quote/QuoteContext'

// Etapa 8.4 — Modal Compare Products (Figma · Compare 1329:27352).
// Tabla comparativa. Campos no presentes en el mock se muestran como "—" (sin inventar datos).
// Diego polish · SKU (MFR + Internal) visibles + botón "Add to Quote" por column.

interface CompareModalProps {
  products: Product[]
  onClose: () => void
}

export default function CompareModal({ products, onClose }: CompareModalProps) {
  const cols = products.slice(0, 4)
  const dash = <span className="text-muted-foreground">—</span>
  const { addItems } = useQuote()

  const handleAddToQuote = (p: Product) => {
    const variants = getProductVariants(p)
    const colorway = p.colorways[0]
    const finishId = variants.finishes?.[0]?.id
    const fabricId = variants.fabricOptions?.find(f => f.type === 'standard')?.id
    const materialTierId = variants.materialTiers?.[0]?.id
    const totals = computeLineItemTotals(p, { qty: 1, colorwayCode: colorway?.code, finishId, fabricId, materialTierId })
    const finish = variants.finishes?.find(f => f.id === finishId)
    const fabric = variants.fabricOptions?.find(f => f.id === fabricId)
    const tier = variants.materialTiers?.find(t => t.id === materialTierId)
    addItems([{
      productId: p.id,
      productName: p.name,
      productBrand: p.brand,
      productImage: p.images[0],
      qty: 1,
      colorwayCode: colorway?.code,
      colorwayName: colorway?.name,
      colorwayHex: colorway?.hex,
      finishId: finish?.id,
      finishName: finish?.name,
      fabricId: fabric?.id,
      fabricName: fabric?.name,
      fabricIsPremium: fabric?.type === 'special',
      materialTierId: tier?.id,
      materialTierName: tier?.name,
      unitPrice: totals.unitPrice,
      totalPrice: totals.totalPrice,
      leadTimeDays: totals.leadTimeDays,
    }])
  }

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: 'Brand', render: (p) => p.brand ?? dash },
    {
      label: 'MFR SKU',
      render: (p) => (
        <span className="font-mono text-xs text-foreground">{resolveManufacturerSku(p)}</span>
      ),
    },
    {
      label: 'Internal SKU',
      render: (p) => (
        <span className="font-mono text-xs text-foreground">{resolveInternalSku(p)}</span>
      ),
    },
    { label: 'Tags', render: (p) => (p.tags && p.tags.length ? p.tags.join(', ') : dash) },
    {
      label: 'Rating',
      render: (p) => (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 fill-foreground text-foreground" />
          {p.dealerRating?.toFixed(1) ?? '—'}
        </span>
      ),
    },
  ]

  const groups: { title: string; rows: { label: string; render: (p: Product) => React.ReactNode }[] }[] = [
    {
      title: 'Variants & Finish',
      rows: [
        {
          label: 'Color Options',
          render: (p) => (
            <span className="flex items-center gap-1">
              {p.colorways.slice(0, 5).map((c) => (
                <span key={c.code} title={c.name} className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
              ))}
            </span>
          ),
        },
        { label: 'Material', render: (p) => p.material ?? dash },
        { label: 'Upholstery', render: (p) => p.upholstery ?? dash },
      ],
    },
    {
      title: 'Dimensions',
      rows: [
        { label: 'Width', render: (p) => p.dimensions?.width ?? dash },
        { label: 'Depth', render: (p) => p.dimensions?.depth ?? dash },
        { label: 'Height', render: (p) => p.dimensions?.height ?? dash },
        { label: 'Weight', render: (p) => p.dimensions?.weight ?? dash },
      ],
    },
    {
      title: 'Pricing & Availability',
      rows: [
        { label: 'Lead Time', render: (p) => p.leadTime ?? dash },
        { label: 'Price', render: (p) => <span className="font-bold text-foreground">${p.price?.toLocaleString()}</span> },
      ],
    },
  ]

  return (
    <Transition show as={Fragment} appear>
      <Dialog onClose={onClose} className="relative z-[70]">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-brand text-lg font-bold text-foreground">Compare Products</h2>
            <p className="text-sm text-muted-foreground">Compare key details and add directly to your quote · per item.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto p-5">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Image + Name + Add to Quote button per column */}
              <tr>
                <td className="w-40 align-bottom" />
                {cols.map((p) => (
                  <td key={p.id} className="p-2 align-bottom">
                    <img src={p.images[0]} alt={p.name} className="mb-2 h-24 w-full rounded-lg object-cover" />
                    <div className="font-bold text-foreground">{p.name}</div>
                    <button
                      type="button"
                      onClick={() => handleAddToQuote(p)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                      title={`Add ${p.name} to your active quote`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Quote
                    </button>
                  </td>
                ))}
              </tr>

              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.label}</td>
                  {cols.map((p) => (
                    <td key={p.id} className="px-2 py-2.5 text-foreground">{r.render(p)}</td>
                  ))}
                </tr>
              ))}

              {groups.map((g) => (
                <Fragment key={g.title}>
                  <tr>
                    <td colSpan={cols.length + 1} className="pt-4 pb-1 text-sm font-bold text-foreground">{g.title}</td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-border">
                      <td className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.label}</td>
                      {cols.map((p) => (
                        <td key={p.id} className="px-2 py-2.5 text-foreground">{r.render(p)}</td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
