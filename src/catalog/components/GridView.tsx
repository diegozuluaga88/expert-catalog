import type { Manufacturer } from '../types'
import ManufacturerCard from './ManufacturerCard'

interface GridViewProps {
  manufacturers: Manufacturer[]
  onSelect: (m: Manufacturer) => void
}

export default function GridView({ manufacturers, onSelect }: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {manufacturers.map((m) => (
        <ManufacturerCard key={m.id} manufacturer={m} onClick={() => onSelect(m)} />
      ))}
    </div>
  )
}
