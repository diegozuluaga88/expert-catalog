import { useState } from 'react'
import { X, FileText, Table2, Braces, FileType2, Check } from 'lucide-react'
import type { ReportFormat } from '../types'

// Etapa 8.4 — Modal Generate Report / Export (Figma · Export). Mock (sin backend).

interface GenerateReportModalProps {
  onClose: () => void
  onExport: (format: ReportFormat) => void
}

const FORMATS: { key: ReportFormat; title: string; subtitle: string; icon: typeof FileText }[] = [
  { key: 'csv', title: 'CSV', subtitle: 'Comma-Separated Values (.csv)', icon: Table2 },
  { key: 'excel', title: 'Excel', subtitle: 'Microsoft Excel Format (.xlsx)', icon: FileText },
  { key: 'json', title: 'JSON', subtitle: 'JavaScript Object Notation (.json)', icon: Braces },
  { key: 'pdf', title: 'PDF', subtitle: 'Portable Document Format (.pdf)', icon: FileType2 },
]

export default function GenerateReportModal({ onClose, onExport }: GenerateReportModalProps) {
  const [format, setFormat] = useState<ReportFormat>('csv')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-brand text-lg font-bold text-foreground">Generate Report</h2>
            <p className="text-sm text-muted-foreground">Choose your preferred format and customize what to include in the report.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-sm font-bold text-foreground">Format</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {FORMATS.map((f) => {
              const active = format === f.key
              const Icon = f.icon
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-foreground">{f.title}</span>
                    <span className="block text-xs text-muted-foreground">{f.subtitle}</span>
                  </span>
                  {active && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

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
            onClick={() => onExport(format)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
