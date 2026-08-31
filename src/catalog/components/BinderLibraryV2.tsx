// F50 · Wave 2 · v2 · duplicado de BinderLibrary.tsx. V1 queda intocada.
// Único cambio: importa BinderSpineV2 y BinderWideV2 (con save-binder al
// 100% de opacidad). La lógica del wrapper (useMyBinders + toast Undo)
// es idéntica a v1.
//
// Referencia legacy de v1:
// MRL Fase 3 (2026-07-09) · BinderLibrary wrapper.
// Dado un manufacturer, decide qué componente renderizar (BinderSpine
// vs BinderWide según `variant`) e integra el hook useMyBinders para el
// círculo stateful + toast confirmatorio via useToast.

import type { Manufacturer } from '../types'
import BinderSpine from './BinderSpineV2'
import BinderWide from './BinderWideV2'
import { useMyBinders } from '../browse/useMyBinders'
import type { ToastAction, ToastType } from '../../components/AuthToast'

interface BinderLibraryV2Props {
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

/** F50 · Wave 2 · v2 · consumidor de BinderSpineV2 / BinderWideV2. */
export default function BinderLibraryV2({
  manufacturer,
  onClick,
  label,
  size,
  onToast,
}: BinderLibraryV2Props) {
  const { isInMyBinders, toggleBinder } = useMyBinders()

  const saved = isInMyBinders(manufacturer.id)

  const handleToggle = (id: string) => {
    const wasSaved = isInMyBinders(id)
    toggleBinder(id)
    if (!onToast) return
    // Nielsen H3 · user control + freedom · toast con Undo.
    const message = wasSaved
      ? `Removed ${manufacturer.name} from Custom Library`
      : `Added ${manufacturer.name} to Custom Library`
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
