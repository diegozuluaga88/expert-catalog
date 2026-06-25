// Panel global de edit · escucha editingItem del QuoteContext · cuando set,
// renderea ProductDetailPanel en modo Update con la config del line item
// prellenada. Al cerrar o submit, limpia editingItem.

import { useQuote } from './QuoteContext'
import ProductDetailPanel from '../catalog/browse/ProductDetailPanel'
import { findProductById } from '../catalog/productLookup'

export default function EditQuoteItemPanel() {
    const { editingItem, stopEditingItem } = useQuote()
    if (!editingItem) return null
    const product = findProductById(editingItem.item.productId)
    if (!product) {
        // Product no encontrado · cerrar editing silenciosamente
        stopEditingItem()
        return null
    }
    return (
        <ProductDetailPanel
            open={true}
            product={product}
            manufacturer={undefined}
            category={undefined}
            onClose={stopEditingItem}
            editingItem={editingItem}
        />
    )
}
