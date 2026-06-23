import { Fragment } from 'react'
import { X, Star } from 'lucide-react'
import type { Product } from '../types'

// Etapa 8.4 — Modal Compare Products (Figma · Compare 1329:27352).
// Tabla comparativa. Campos no presentes en el mock se muestran como "—" (sin inventar datos).

interface CompareModalProps {
  products: Product[]
  onClose: () => void
}

export default function CompareModal({ products, onClose }: CompareModalProps) {
  const cols = products.slice(0, 4)
  const dash = <span className="text-muted-foreground">—</span>

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: 'Brand', render: (p) => p.brand ?? dash },
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
        { label: 'Material', render: () => dash },
        { label: 'Upholstery', render: () => dash },
      ],
    },
    {
      title: 'Dimensions',
      rows: [
        { label: 'Width', render: () => dash },
        { label: 'Depth', render: () => dash },
        { label: 'Height', render: () => dash },
        { label: 'Weight', render: () => dash },
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-brand text-lg font-bold text-foreground">Compare Products</h2>
            <p className="text-sm text-muted-foreground">Compare key details to choose the right option.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto p-5">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Image + Name */}
              <tr>
                <td className="w-40 align-bottom" />
                {cols.map((p) => (
                  <td key={p.id} className="p-2 align-bottom">
                    <img src={p.images[0]} alt={p.name} className="mb-2 h-24 w-full rounded-lg object-cover" />
                    <div className="font-bold text-foreground">{p.name}</div>
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
      </div>
    </div>
  )
}
