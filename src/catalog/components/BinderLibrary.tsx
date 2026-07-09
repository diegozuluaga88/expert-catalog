// MRL Fase 3 (2026-07-09) · BinderLibrary wrapper.
// Dado un manufacturer, decide qué componente renderizar (BinderSpine
// vs BinderWide según `variant`) e integra el hook useMyBinders para el
// círculo stateful + toast confirmatorio via useToast.
//
// Este wrapper es el punto de entrada canónico desde ShelfView: en vez
// de que ShelfView conozca la existencia de spine vs wide, delega en
// BinderLibrary. Fase 4 modifica ShelfView solo para llamar a este
// wrapper por cada manufacturer.

import type { Manufacturer } from '../types'
import BinderSpine from './BinderSpine'
import BinderWide from './BinderWide'
import { useMyBinders } from '../browse/useMyBinders'
import type { ToastAction, ToastType } from '../../components/AuthToast'

interface BinderLibraryProps {
  manufacturer: Manufacturer
  onClick: () => void
  /** Override del label (usado por ShelfView cuando renderea copias por
   *  `binderCount` con label indexado tipo "Vol. 2"). Solo aplica a
   *  variant='spine'. */
  label?: string
  /** Force size override · solo aplica a variant='spine'. */
  size?: 'sm' | 'md' | 'lg'
  /** Toast dispatcher levantado en LibraryPage · centraliza el
   *  ToastContainer y evita múltiples instancias del hook. */
  onToast?: (type: ToastType, message: string, action?: ToastAction) => void
}

/** Componente presentational que consume el hook useMyBinders y opcionalmente
 *  reporta feedback via el toast levantado en LibraryPage. Las copias por
 *  binderCount se hacen a nivel de ShelfView (afuera), no acá. */
export default function BinderLibrary({
  manufacturer,
  onClick,
  label,
  size,
  onToast,
}: BinderLibraryProps) {
  const { isInMyBinders, toggleBinder } = useMyBinders()

  const saved = isInMyBinders(manufacturer.id)

  const handleToggle = (id: string) => {
    const wasSaved = isInMyBinders(id)
    toggleBinder(id)
    if (!onToast) return
    // Nielsen H3 · user control + freedom · toast con Undo.
    const message = wasSaved
      ? `Removed ${manufacturer.name} from My Binders`
      : `Added ${manufacturer.name} to My Binders`
    onToast('success', message, {
      label: 'Undo',
      onClick: () => toggleBinder(id),
    })
  }

  if (manufacturer.variant === 'wide') {
    return (
      <BinderWide
        manufacturer={manufacturer}
        onClick={onClick}
        isInMyBinders={saved}
        onToggleBinder={handleToggle}
      />
    )
  }

  return (
    <BinderSpine
      manufacturer={manufacturer}
      onClick={onClick}
      label={label}
      size={size}
      isInMyBinders={saved}
      onToggleBinder={handleToggle}
    />
  )
}
