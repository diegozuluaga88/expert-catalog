// Etapa 6a — mapeo ILUSTRATIVO product → SKU para demostrar la verificación de catálogo
// reutilizando el CatalogVerifyPill + catalogMock que ya existen en expert-hub (src/components/ocr).
// Los productos del browse no traen SKU real, así que se asigna determinísticamente uno de los
// SKUs conocidos del catalogMock (la mayoría "verified"; MFB5P245-D dispara el flujo de
// reemplazo sugerido por IA), para mostrar ambos estados.

const DEMO_SKUS = [
  'HMBS244-D', // verified
  'MCTNP488-42-D', // verified
  'MST1012-D', // verified
  'PTRX4230-D', // verified
  'MFB5P245-D', // NOT verified → muestra sugerencias de reemplazo
] as const

export function skuForProduct(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return DEMO_SKUS[h % DEMO_SKUS.length]
}
