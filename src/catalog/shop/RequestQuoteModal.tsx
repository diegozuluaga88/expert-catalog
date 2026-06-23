import { X, Star } from 'lucide-react'
import type { Product } from '../types'

// Etapa 8.4 — Modal Request Quote (Figma · Request Quote 1348:9022).
// Form de cotización; mock (sin backend). DS-compliant (tokens; lima solo en CTA).

interface RequestQuoteModalProps {
  products: Product[]
  onClose: () => void
}

const inputCls =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-muted-foreground'
const sectionTitle = 'text-sm font-bold text-foreground'

export default function RequestQuoteModal({ products, onClose }: RequestQuoteModalProps) {
  const lead = products[0]
  const extra = products.length - 1

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-brand text-lg font-bold text-foreground">Request Quote</h2>
            <p className="text-sm text-muted-foreground">Fill out the form below to request a quote for this product.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex-1 overflow-y-auto p-5"
          onSubmit={(e) => {
            e.preventDefault()
            onClose()
          }}
        >
          {/* Product summary */}
          {lead && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <img src={lead.images[0]} alt={lead.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{lead.brand}</p>
                <p className="truncate text-sm font-bold text-foreground">{lead.name}</p>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-foreground text-foreground" /> {lead.dealerRating?.toFixed(1)} Dealer Rated
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">${lead.price?.toLocaleString()}</span>
                {extra > 0 && <span className="block text-[11px] text-muted-foreground">+{extra} more</span>}
              </div>
            </div>
          )}

          {/* Company Information */}
          <h3 className={sectionTitle}>Company Information</h3>
          <div className="mb-5 mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Company Name</label>
              <input className={inputCls} placeholder="Eg. Acme Corp." />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <select className={inputCls} defaultValue="">
                <option value="" disabled>Select an industry</option>
                <option>Furniture</option>
                <option>Architecture</option>
                <option>Corporate</option>
                <option>Healthcare</option>
                <option>Education</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <h3 className={sectionTitle}>Contact Information</h3>
          <div className="mb-5 mt-2 grid gap-3">
            <div>
              <label className={labelCls}>Contact Name</label>
              <input className={inputCls} placeholder="Eg. John Doe" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" className={inputCls} placeholder="Eg. jdoe@acme.com" />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input className={inputCls} placeholder="Eg. 555 123 4567" />
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <h3 className={sectionTitle}>Quote Details</h3>
          <div className="mb-5 mt-2 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" min={1} className={inputCls} placeholder="Eg. 2" />
            </div>
            <div>
              <label className={labelCls}>Preferred Color</label>
              <select className={inputCls} defaultValue="">
                <option value="" disabled>Select a color</option>
                {lead?.colorways.map((c) => (
                  <option key={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fabric Type</label>
              <select className={inputCls} defaultValue="">
                <option value="" disabled>Select a fabric</option>
                <option>Velvet</option>
                <option>Leather</option>
                <option>Linen</option>
                <option>Wool</option>
              </select>
            </div>
          </div>

          {/* Project Details */}
          <h3 className={sectionTitle}>Project Details</h3>
          <div className="mb-5 mt-2 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Budget Range</label>
                <select className={inputCls} defaultValue="">
                  <option value="" disabled>Select a budget</option>
                  <option>&lt; $5,000</option>
                  <option>$5,000 – $20,000</option>
                  <option>$20,000 – $100,000</option>
                  <option>&gt; $100,000</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Expected Delivery Date</label>
                <input type="date" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Delivery Address</label>
              <input className={inputCls} placeholder="Eg. 425 Cayuga Rd." />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} placeholder="Eg. Cheektowaga" />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input className={inputCls} placeholder="Eg. New York, NY" />
              </div>
              <div>
                <label className={labelCls}>Zip Code</label>
                <input className={inputCls} placeholder="Eg. 14225" />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <h3 className={sectionTitle}>Additional Information</h3>
          <div className="mt-2">
            <label className={labelCls}>Additional Notes or Special Requirements</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              placeholder="Eg. matte finish"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Submit Quote Request
          </button>
        </div>
      </div>
    </div>
  )
}
