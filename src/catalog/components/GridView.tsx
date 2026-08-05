import type { Manufacturer } from '../types'
import ManufacturerCard from './ManufacturerCard'
import type { ToastAction, ToastType } from '../../components/AuthToast'

interface GridViewProps {
  manufacturers: Manufacturer[]
  onSelect: (m: Manufacturer) => void
  /** F62 · toast dispatcher opcional · se propaga a cada ManufacturerCard
   *  para el feedback del My Binders toggle. LibraryPageV2 pasa el mismo
   *  `addToast` que ya usa para el ShelfViewV2. */
  onToast?: (type: ToastType, message: string, action?: ToastAction) => void
}

export default function GridView({ manufacturers, onSelect, onToast }: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {manufacturers.map((m) => (
        <ManufacturerCard
          key={m.id}
          manufacturer={m}
          onClick={() => onSelect(m)}
          onToast={onToast}
        />
      ))}
    </div>
  )
}
