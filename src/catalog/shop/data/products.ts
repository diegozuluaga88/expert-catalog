// Etapa 8.1/8.6 — Mock de productos para la vista "Product Catalog" (Figma · file Expert-Hub).
// Transcrito de los frames del diseño (Dashboard 1285:10432 / Search 1295:10559 / Compare 1329:27352).
// Usa el tipo `Product` ya extendido (campos dealer opcionales). Imágenes = Unsplash representativas.

import type { Colorway, Product } from '../../types'

type DealerSeed = {
  id: string
  name: string
  brand: string
  category: string
  price: number
  listPrice: number
  dealerRating: number
  leadTime: string
  tags: string[]
  image: string
  colorways: Colorway[]
  material: string
  upholstery: string
  dimensions: { width: string; depth: string; height: string; weight: string }
  popular?: boolean
}

function mk(s: DealerSeed): Product {
  return {
    id: s.id,
    name: s.name,
    description: `${s.name} by ${s.brand}.`,
    images: [s.image],
    galleries: [],
    colorways: s.colorways,
    standardFeatures: [],
    optionalFeatures: [],
    specs: {},
    performance: {},
    cleaning: '',
    documents: [],
    brand: s.brand,
    category: s.category,
    price: s.price,
    listPrice: s.listPrice,
    dealerRating: s.dealerRating,
    leadTime: s.leadTime,
    tags: s.tags,
    popular: s.popular,
    material: s.material,
    upholstery: s.upholstery,
    dimensions: s.dimensions,
  }
}

const cw = (name: string, hex: string): Colorway => ({ name, code: hex, hex })
const dim = (width: string, depth: string, height: string, weight: string) => ({ width, depth, height, weight })

const IMG = {
  sofa1: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
  chair1: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800',
  sectional: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800',
  loft: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&q=80&w=800',
  loveseat: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=800',
  daybed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
  accent: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800',
  table: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=800',
  dining: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&q=80&w=800',
  shelf: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800',
  ottoman: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800',
  sideboard: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800',
}

export const SHOP_PRODUCTS: Product[] = [
  mk({ id: 'sp-01', name: 'Mid-Century Velvet Sofa', brand: 'Avanto', category: 'Sofas', price: 899, listPrice: 1050, dealerRating: 4.7, leadTime: '6-8 week shipping', tags: ['Quick Ship', 'Commercial Use'], image: IMG.sofa1, popular: true, material: 'Solid Oak Frame', upholstery: 'Velvet', dimensions: dim('84 in', '37 in', '32 in', '115 lbs'), colorways: [cw('Rust', '#C77F4D'), cw('Teal', '#2E8B8B'), cw('Crimson', '#C0392B'), cw('Slate', '#2C3E50')] }),
  mk({ id: 'sp-02', name: 'Oslo Lounge Chair', brand: 'Nordic Design', category: 'Chairs', price: 450, listPrice: 599, dealerRating: 4.9, leadTime: '2-3 week shipping', tags: ['Best Seller'], image: IMG.chair1, popular: true, material: 'Ash Wood', upholstery: 'Wool Blend', dimensions: dim('30 in', '32 in', '40 in', '38 lbs'), colorways: [cw('Olive', '#6B7A4F'), cw('Sand', '#D9C7A3'), cw('Charcoal', '#33373B')] }),
  mk({ id: 'sp-03', name: 'Modular Sectional Piece', brand: 'Urban Comfort', category: 'Sofas', price: 1299, listPrice: 1500, dealerRating: 4.3, leadTime: 'In Stock', tags: ['Modular', 'New'], image: IMG.sectional, material: 'Engineered Hardwood', upholstery: 'Performance Linen', dimensions: dim('120 in', '40 in', '34 in', '210 lbs'), colorways: [cw('Graphite', '#3A3A3A'), cw('Stone', '#9AA0A6'), cw('Forest', '#2F4F3E')] }),
  mk({ id: 'sp-04', name: 'Industrial Loft Sofa', brand: 'Foundry', category: 'Sofas', price: 1500, listPrice: 1900, dealerRating: 4.6, leadTime: 'Custom Order', tags: ['Customizable'], image: IMG.loft, popular: true, material: 'Steel + Walnut', upholstery: 'Top-grain Leather', dimensions: dim('88 in', '38 in', '33 in', '160 lbs'), colorways: [cw('Cognac', '#8A5A30'), cw('Black', '#1B1B1B'), cw('Sage', '#7E8C77')] }),
  mk({ id: 'sp-05', name: 'Minimalist Loveseat', brand: 'Simple', category: 'Sofas', price: 699, listPrice: 799, dealerRating: 4.3, leadTime: '1 week shipping', tags: ['Small Spaces'], image: IMG.loveseat, material: 'Birch Plywood', upholstery: 'Cotton Weave', dimensions: dim('58 in', '34 in', '31 in', '92 lbs'), colorways: [cw('Coral', '#E07856'), cw('Mustard', '#D4A23B'), cw('Navy', '#27374D')] }),
  mk({ id: 'sp-06', name: 'Velvet Daybed', brand: 'Luxe Living', category: 'Beds', price: 799, listPrice: 850, dealerRating: 4.8, leadTime: '4-6 week shipping', tags: ['Limited Edition'], image: IMG.daybed, material: 'Brass + Hardwood', upholstery: 'Velvet', dimensions: dim('78 in', '40 in', '28 in', '130 lbs'), colorways: [cw('Emerald', '#1F7A5A'), cw('Blush', '#D6A0A0'), cw('Ink', '#222933')] }),
  mk({ id: 'sp-07', name: 'Avanto Accent Chair', brand: 'Avanto', category: 'Chairs', price: 349, listPrice: 420, dealerRating: 4.5, leadTime: '3-4 week shipping', tags: ['Quick Ship'], image: IMG.accent, material: 'Beech Wood', upholstery: 'Bouclé', dimensions: dim('29 in', '30 in', '31 in', '34 lbs'), colorways: [cw('Terracotta', '#B5651D'), cw('Teal', '#2E8B8B'), cw('Cream', '#EDE6D6')] }),
  mk({ id: 'sp-08', name: 'Foundry Coffee Table', brand: 'Foundry', category: 'Tables', price: 280, listPrice: 320, dealerRating: 4.4, leadTime: 'In Stock', tags: ['New'], image: IMG.table, material: 'Walnut + Steel', upholstery: '—', dimensions: dim('48 in', '24 in', '17 in', '55 lbs'), colorways: [cw('Walnut', '#5B3A29'), cw('Oak', '#C8A165'), cw('Black', '#1B1B1B')] }),
  mk({ id: 'sp-09', name: 'Nordic Dining Chair', brand: 'Nordic Design', category: 'Chairs', price: 190, listPrice: 240, dealerRating: 4.6, leadTime: '2 week shipping', tags: ['Best Seller'], image: IMG.dining, popular: true, material: 'Solid Ash', upholstery: 'Leather Seat', dimensions: dim('20 in', '22 in', '32 in', '14 lbs'), colorways: [cw('Ash', '#CFC6B8'), cw('Graphite', '#3A3A3A'), cw('Olive', '#6B7A4F')] }),
  mk({ id: 'sp-10', name: 'Urban Bookshelf', brand: 'Urban Comfort', category: 'Storage', price: 540, listPrice: 600, dealerRating: 4.2, leadTime: 'Custom Order', tags: ['Customizable'], image: IMG.shelf, material: 'Powder-coated Steel', upholstery: '—', dimensions: dim('36 in', '14 in', '72 in', '88 lbs'), colorways: [cw('Stone', '#9AA0A6'), cw('Walnut', '#5B3A29')] }),
  mk({ id: 'sp-11', name: 'Luxe Ottoman', brand: 'Luxe Living', category: 'Ottomans', price: 220, listPrice: 260, dealerRating: 4.7, leadTime: '1 week shipping', tags: ['Small Spaces'], image: IMG.ottoman, material: 'Hardwood', upholstery: 'Velvet', dimensions: dim('24 in', '24 in', '17 in', '22 lbs'), colorways: [cw('Blush', '#D6A0A0'), cw('Emerald', '#1F7A5A'), cw('Ink', '#222933')] }),
  mk({ id: 'sp-12', name: 'Avanto Sideboard', brand: 'Avanto', category: 'Storage', price: 980, listPrice: 1100, dealerRating: 4.5, leadTime: '5-6 week shipping', tags: ['Commercial Use'], image: IMG.sideboard, material: 'Oak Veneer', upholstery: '—', dimensions: dim('64 in', '18 in', '30 in', '120 lbs'), colorways: [cw('Cognac', '#8A5A30'), cw('Sand', '#D9C7A3'), cw('Slate', '#2C3E50')] }),
]

/** Marcas únicas para los pills/filtro (orden de aparición). */
export const SHOP_BRANDS: string[] = Array.from(new Set(SHOP_PRODUCTS.map((p) => p.brand!)))

/** Categorías únicas para el filtro del sidebar. */
export const SHOP_CATEGORIES: string[] = Array.from(new Set(SHOP_PRODUCTS.map((p) => p.category!)))

/** Features (tags) únicas para el filtro del sidebar. */
export const SHOP_FEATURES: string[] = Array.from(new Set(SHOP_PRODUCTS.flatMap((p) => p.tags ?? [])))

/** Rangos de precio para el filtro del sidebar. */
export const PRICE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Under $300', min: 0, max: 300 },
  { label: '$300 – $700', min: 300, max: 700 },
  { label: '$700 – $1,200', min: 700, max: 1200 },
  { label: 'Over $1,200', min: 1200, max: Infinity },
]
