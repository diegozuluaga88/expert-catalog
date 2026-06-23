import { DocumentTextIcon } from '@heroicons/react/24/outline'
import type { CatalogDocument } from '../types'

interface DocumentsListProps {
  documents: CatalogDocument[]
  fromLabel?: string
}

export default function DocumentsList({ documents, fromLabel }: DocumentsListProps) {
  if (documents.length === 0) return null

  return (
    <div>
      {fromLabel && (
        <p className="text-xs text-muted-foreground mb-3">From {fromLabel}</p>
      )}
      <div className="space-y-1">
        {documents.map((doc, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-1 shrink-0">
              <DocumentTextIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">PDF</span>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {doc.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
