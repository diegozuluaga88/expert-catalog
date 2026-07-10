import type { Manufacturer } from '../types'

export const MANUFACTURERS: Manufacturer[] = [
  // ─── PRODUCTS (Furniture) ────────────────────────────────────────────────
  {
    id: 'allermuir',
    name: 'Allermuir',
    description:
      'At Allermuir, we create great contemporary furniture for offices, homes and public spaces. We believe in moving on, growing, challenging — exploring worlds of interiors, design, engineering and furniture voraciously, and looking beyond. Quality of thought, quality of design and quality of build are equal partners in our process.',
    bgColor: '#2d3748',
    textColor: '#ffffff',
    type: 'products',
    tags: ['quickship', 'gsa'],
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    heroTagline: 'Great contemporary furniture.',
    categoryCardStyle: 'photo',
    filterOptions: ['Chairs', 'Sofas', 'Ottomans', 'Tables'],
    brandResources: [
      { name: 'Allermuir Website', href: 'https://allermuir.com' },
      { name: 'Product Catalog PDF', href: '#' },
      { name: 'Specification Guide', href: '#' },
    ],
    contacts: [
      { name: 'Sarah Mitchell', title: 'Territory Sales Manager', email: 'smitchell@allermuir.com', phone: '+1 800 555 0101' },
      { name: 'James O\'Brien', title: 'A&D Specialist', email: 'jobrien@allermuir.com' },
    ],
    categories: [
      {
        id: 'chairs',
        name: 'Chairs',
        cardImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
        products: [
          {
            id: 'axyl',
            name: 'Axyl',
            description:
              'Axyl is a seating collection offering a sophisticated combination of recognisable elements. Comprising of an arm chair, and stool, Axyl utilises a strong geometric design language that is entirely original yet draws on familiar references to create a range of highly functional seating.',
            images: [
              'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
            ],
            galleries: [
              'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
              'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
              'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80',
            ],
            standardFeatures: [
              'Cast aluminium four-leg base, glides standard',
              'Upholstered seat pad in COM or standard fabric grades',
              'Polypropylene back shell in 6 standard colours',
              'Ganging capability for multiple-seat configurations',
              'Stackable up to 4 high without upholstery',
              'Meets or exceeds BIFMA X5.1 seating standard',
            ],
            optionalFeatures: [
              'Upholstered back pad (fabric or leather)',
              'Swivel base with or without castors',
              'Height-adjustable gas lift mechanism',
              'Writing tablet (fixed or folding)',
              'Connecting linking device for ganging',
              'Polished chrome base finish',
              'Two-tone colour combination shell/base',
            ],
            symbols: [
              // Fase P2.4 · dimension discriminada · alineado con silver drawingName2D/3D
              { name: 'AutoCAD (DWG)', files: 12, dimension: '2D' },
              { name: 'Revit Family (RFA)', files: 8, dimension: '3D' },
              { name: 'SketchUp (SKP)', files: 12, dimension: '3D' },
              { name: '3DS Max', files: 6, dimension: '3D' },
            ],
            colorways: [
              { name: 'Slate Grey', code: 'SG01', hex: '#6b7280' },
              { name: 'Coral Red', code: 'CR02', hex: '#ef4444' },
              { name: 'Forest Green', code: 'FG03', hex: '#166534' },
              { name: 'Midnight Blue', code: 'MB04', hex: '#1e3a5f' },
              { name: 'Warm Sand', code: 'WS05', hex: '#d4a574' },
            ],
            specs: {
              'COMPOSITION': 'Cast Aluminium frame with polypropylene shell',
              'GUARANTEE': '10 Years',
              'APPLICATION': 'Task Seating / Lounge Seating',
              'STACKING': 'Up to 4 high',
              'ACT CERTIFICATIONS': 'Flammability, Wet & Dry Crocking, Light Fastness',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'FLAMMABILITY (UK)': 'BS 7176 Low Hazard',
              'ABRASION RESISTANCE': 'ASTM D4157 ≥75,000 double rubs (Wyzenbeek)',
              'COLOR FASTNESS TO CROCKING': 'AATCC-8 (Dry: 4, Wet: 3)',
              'COLOR FASTNESS TO LIGHT': 'AATCC-16 (40 hours) Class 4',
            },
            cleaning: 'W/S Clean — use a dry-cleaning solvent or the foam of a mild detergent. Blot; do not rub.',
            documents: [
              { name: '10 Year Guarantee', type: 'pdf' },
              { name: 'ASTM E84 Class 1 Certificate (Adhered)', type: 'pdf' },
              { name: 'Abrasion Certificate', type: 'pdf' },
              { name: 'Product Brochure', type: 'pdf' },
            ],
          },
          {
            id: 'bastille',
            name: 'Bastille',
            description:
              'The Bastille chair features a distinctive shell silhouette that balances visual lightness with structural integrity. Available in a palette of bold upholstery options.',
            images: [
              'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
            ],
            colorways: [
              { name: 'Olive', code: 'OL01', hex: '#4a5240' },
              { name: 'Charcoal', code: 'CH02', hex: '#374151' },
              { name: 'Ivory', code: 'IV03', hex: '#f5f0e8' },
            ],
            specs: {
              'COMPOSITION': 'Steel frame, upholstered seat and back',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Dining / Café / Breakout',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'ABRASION RESISTANCE': '≥50,000 double rubs (Wyzenbeek)',
            },
            cleaning: 'W Clean only — use the foam of a mild detergent. Do not wet.',
            documents: [
              { name: 'Product Specification Sheet', type: 'pdf' },
              { name: '5 Year Guarantee', type: 'pdf' },
            ],
          },
          {
            id: 'famiglia',
            name: 'Famiglia',
            description:
              'Famiglia is a family of soft seating and chairs that blends comfort with refined aesthetics. Its sweeping curved silhouette and generous proportions create a welcoming presence.',
            images: [
              'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=800&q=80',
            ],
            colorways: [
              { name: 'Stone', code: 'ST01', hex: '#9ca3af' },
              { name: 'Rust', code: 'RU02', hex: '#c2410c' },
              { name: 'Sage', code: 'SA03', hex: '#86a07e' },
              { name: 'Navy', code: 'NV04', hex: '#1e3a5f' },
            ],
            specs: {
              'COMPOSITION': 'Steel frame, foam seat, fabric or leather upholstery',
              'GUARANTEE': '7 Years',
              'APPLICATION': 'Lounge / Soft Seating / Breakout',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117 / BS 7176',
              'ABRASION RESISTANCE': '≥60,000 double rubs',
            },
            cleaning: 'W/S Clean — mild detergent foam or dry-cleaning solvent.',
            documents: [
              { name: 'Famiglia Brochure', type: 'pdf' },
              { name: '7 Year Guarantee', type: 'pdf' },
              { name: 'Flammability Certificate', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'sofas',
        name: 'Sofas',
        cardImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
        isVideo: true,
        videoDuration: '02:14',
        products: [
          {
            id: 'kite-sofa',
            name: 'Kite Sofa',
            description:
              'The Kite sofa series delivers a refined profile with structured cushioning for both formal and informal environments. Available in 2- and 3-seat configurations.',
            images: [
              'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
            ],
            colorways: [
              { name: 'Cream', code: 'CR01', hex: '#fef9c3' },
              { name: 'Graphite', code: 'GP02', hex: '#4b5563' },
              { name: 'Terracotta', code: 'TC03', hex: '#c2410c' },
            ],
            specs: {
              'COMPOSITION': 'Solid beech frame, HR foam, removable covers',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Lounge / Reception / Soft Seating',
              'CONFIGURATION': '2-seat, 3-seat',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
            },
            cleaning: 'W/S Clean — mild detergent or dry solvent.',
            documents: [
              { name: 'Kite Series Brochure', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'ottomans',
        name: 'Ottomans & Benches',
        cardImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80',
        isVideo: true,
        videoDuration: '00:47',
        products: [
          {
            id: 'hive-ottoman',
            name: 'Hive Ottoman',
            description:
              'The Hive ottoman is a modular upholstered seating element designed for flexible configurations. Hexagonal modules connect to form custom seating arrangements for open-plan spaces.',
            images: [
              'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&q=80',
            ],
            colorways: [
              { name: 'Mustard', code: 'MU01', hex: '#d97706' },
              { name: 'Teal', code: 'TL02', hex: '#0d9488' },
              { name: 'Blush', code: 'BL03', hex: '#fbcfe8' },
            ],
            specs: {
              'COMPOSITION': 'Plywood core, HR foam, fabric upholstery',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Breakout / Lounge / Open Plan',
              'MODULAR': 'Yes — connectable hex modules',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
            },
            cleaning: 'W Clean — mild detergent foam only.',
            documents: [
              { name: 'Hive Configuration Guide', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'allsteel',
    name: 'Allsteel',
    description:
      'Allsteel designs workspaces that help people do their best work — seating systems and storage that are functional, flexible, and built to last. Every Allsteel product reflects a deep commitment to ergonomic support and workplace efficiency.',
    bgColor: '#1a202c',
    textColor: '#e2e8f0',
    type: 'products',
    tags: ['gsa', 'cet', 'cil'],
    heroImage: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1200&q=80',
    heroTagline: 'Design the way people work.',
    categoryCardStyle: 'brand-typo',
    descriptionBlocks: [
      {
        heading: 'Purpose',
        body: 'We design workplaces that help people do their best work — seating systems and storage that are functional, flexible, and built to last.',
      },
      {
        heading: 'Craft',
        body: 'Every Allsteel product reflects a deep commitment to ergonomic support, environmental responsibility, and workplace efficiency.',
      },
    ],
    brandResources: [
      { name: 'Allsteel.com', href: 'https://allsteeloffice.com' },
      { name: 'Product Catalog PDF', href: '#' },
    ],
    contacts: [
      { name: 'David Chen', title: 'Regional Sales', email: 'dchen@allsteel.com', phone: '+1 800 555 0202' },
    ],
    links: [
      { name: 'Brochures', href: '#' },
      { name: 'Installation Instructions', href: '#' },
      { name: 'Request a Quote', href: '#' },
    ],
    categories: [
      {
        id: 'seating',
        name: 'Seating & Collaboration',
        subtitle: 'Task, Side & Guest',
        cardSubtitle: 'Acuity · Relate · Access',
        products: [
          {
            id: 'acuity',
            name: 'Acuity',
            description:
              'Acuity is a high-performance task chair engineered for all-day comfort. Its fully adjustable mechanism, lumbar support, and armrests adapt to a wide range of body types and work styles.',
            images: [
              'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=800&q=80',
            ],
            colorways: [
              { name: 'Black', code: 'BK01', hex: '#111827' },
              { name: 'Platinum', code: 'PL02', hex: '#9ca3af' },
              { name: 'Urban Bronze', code: 'UB03', hex: '#78716c' },
            ],
            specs: {
              'MECHANISM': 'Synchronized multi-function with tilt limiter',
              'LUMBAR': 'Adjustable lumbar support (height + depth)',
              'ARMRESTS': '4D adjustable',
              'SEAT ADJUSTMENT': 'Seat depth + seat height',
              'GUARANTEE': '12 Years',
              'APPLICATION': 'Task Seating / Intensive Use',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'GREENGUARD': 'Gold Certified',
              'BIFMA': 'Exceeds BIFMA X5.1 standards',
            },
            cleaning: 'W/S Clean — mild soap and warm water. Avoid solvents on mesh back.',
            documents: [
              { name: '12 Year Guarantee', type: 'pdf' },
              { name: 'GREENGUARD Certificate', type: 'pdf' },
              { name: 'BIFMA Compliance Sheet', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'storage',
        name: 'Systems & Storage',
        subtitle: 'Panels & Storage',
        cardSubtitle: 'Essence · Terrace',
        products: [
          {
            id: 'essence-storage',
            name: 'Essence Storage',
            description:
              'Essence storage solutions combine lateral files, towers, and overhead bins in a cohesive system that integrates with open-plan environments.',
            images: [
              'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
            ],
            colorways: [
              { name: 'White', code: 'WH01', hex: '#ffffff' },
              { name: 'Light Grey', code: 'LG02', hex: '#e5e7eb' },
              { name: 'Charcoal', code: 'CH03', hex: '#374151' },
            ],
            specs: {
              'MATERIALS': 'Cold-rolled steel, powder coated',
              'GUARANTEE': '10 Years',
              'OPTIONS': 'Lateral files, towers, overhead bins, pedestals',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 133',
              'GREENGUARD': 'Gold Certified',
            },
            cleaning: 'Wipe with damp cloth. Use mild all-purpose cleaner for stubborn stains.',
            documents: [
              { name: 'Essence Planning Guide', type: 'pdf' },
              { name: '10 Year Guarantee', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'ais',
    name: 'AIS',
    description:
      'AIS designs and manufactures systems furniture, casegoods, and seating for commercial interiors. Known for quality craftsmanship and competitive lead times, AIS offers highly configurable solutions for open office and private office environments.',
    bgColor: '#003087',
    textColor: '#ffffff',
    type: 'products',
    tags: ['quickship', 'cet'],
    categories: [
      {
        id: 'casegoods',
        name: 'Systems Casegoods',
        products: [
          {
            id: 'calibrate',
            name: 'Calibrate',
            description:
              'Calibrate is a versatile systems casegood solution that bridges the gap between panel systems and freestanding furniture. Clean lines and refined details create a sophisticated workspace.',
            images: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
            ],
            colorways: [
              { name: 'Natural Maple', code: 'NM01', hex: '#c8a96e' },
              { name: 'Espresso', code: 'ES02', hex: '#3d2008' },
              { name: 'Graphite Walnut', code: 'GW03', hex: '#5c4a3a' },
            ],
            specs: {
              'MATERIALS': 'Thermally fused laminate on particleboard substrate',
              'GUARANTEE': '7 Years',
              'APPLICATION': 'Open Office / Private Office / Benching',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'GREENGUARD': 'Certified',
            },
            cleaning: 'Wipe with slightly damp cloth. Avoid abrasive cleaners.',
            documents: [
              { name: 'Calibrate Planning Guide', type: 'pdf' },
              { name: 'GREENGUARD Certificate', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  // ─── MATERIALS (Textiles) ─────────────────────────────────────────────────
  {
    id: 'camira-acoustics',
    name: 'Camira — Acoustics',
    description:
      'At Camira, we specialize in designing and manufacturing premium contract fabrics suitable for a variety of commercial environments, including offices, universities, hotels, and hospitals. Creating material moments where textile style meets real world substance.',
    bgColor: '#374151',
    textColor: '#f9fafb',
    type: 'materials',
    categories: [
      {
        id: 'acoustics-ag',
        name: 'A–G',
        products: [
          {
            id: 'blazer',
            name: 'Blazer',
            description:
              'Blazer is a 100% Pure New Wool acoustic fabric certified to the EU Ecolabel. Acoustically transparent and suitable for panel, upholstery, and drapery applications when treated.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Perth', code: 'CUZ4H', hex: '#6b9bb8' },
              { name: 'Plymouth', code: 'CUZ1R', hex: '#8fafc0' },
              { name: 'Manchester', code: 'CUZ1V', hex: '#2563ab' },
              { name: 'Ellesmere', code: 'CUZ3Z', hex: '#1d4ed8' },
              { name: 'Dundee', code: 'CUZ4P', hex: '#1e3a8a' },
              { name: 'Tettenhall', code: 'CUZ3X', hex: '#1e3a6e' },
              { name: 'Oxford', code: 'CUZ09', hex: '#172554' },
              { name: 'Norland', code: 'CUZ4J', hex: '#94a3b8' },
            ],
            specs: {
              'ACOUSTIC': 'Acoustically transparent',
              'COMPOSITION': '100% Pure New Wool',
              'GUARANTEE': '10 Years',
              'WEIGHT': '13 1/2 oz/sq yd ±5%',
              'WIDTH': '54 inches minimum',
              'APPLICATION': 'Task Seating / Lounge Seating / Panel / Drapery (when treated)',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'FLAMMABILITY (UK)': 'BS 7176 Low Hazard',
              'FLAMMABILITY (ASTM)': 'ASTM E84 Class 1 or A (Adhered)',
              'ABRASION RESISTANCE': 'ASTM D4157 Wyzenbeek ≥75,000 double rubs (independently certified, 10-year guarantee)',
              'COLOR FASTNESS TO CROCKING': 'AATCC-8 (Dry: 4, Wet: 3)',
              'COLOR FASTNESS TO LIGHT': 'AATCC-16 (40 hours) Class 4',
              'ENVIRONMENTAL': 'Certified to the EU Ecolabel',
            },
            cleaning: 'W/S Clean — use a dry-cleaning solvent, the foam of a mild detergent, or upholstery shampoo depending on the stain.',
            documents: [
              { name: '10 Year Guarantee', type: 'pdf' },
              { name: 'ASTM E84 Class 1 or A (Adhered)', type: 'pdf' },
              { name: 'ASTM E84 Class 1 or A (Un-adhered)', type: 'pdf' },
              { name: 'Abrasion Certificate', type: 'pdf' },
              { name: 'Acoustic Brochure', type: 'pdf' },
              { name: 'Acoustic Certificate', type: 'pdf' },
              { name: 'BS 7176 Low Hazard', type: 'pdf' },
            ],
          },
          {
            id: 'era',
            name: 'Era',
            description:
              'Era is a premium woven wool blend acoustic fabric offering a rich texture and extensive colour range for panel and upholstery applications.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Crimson', code: 'ERR01', hex: '#7f1d1d' },
              { name: 'Ivory', code: 'ERW02', hex: '#fef9c3' },
              { name: 'Slate', code: 'ERS03', hex: '#64748b' },
              { name: 'Forest', code: 'ERG04', hex: '#166534' },
            ],
            specs: {
              'COMPOSITION': '70% Wool / 30% Polyester',
              'GUARANTEE': '5 Years',
              'WEIGHT': '15 oz/sq yd',
              'WIDTH': '54 inches',
              'APPLICATION': 'Panel / Upholstery / Wrapped Wall',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117 / BS 7176',
              'ABRASION RESISTANCE': '≥50,000 double rubs',
            },
            cleaning: 'W/S Clean.',
            documents: [
              { name: 'Era Product Sheet', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'acoustics-hm',
        name: 'H–M',
        products: [
          {
            id: 'herald',
            name: 'Herald',
            description:
              'Herald is a mid-weight wool acoustic fabric with excellent acoustic transparency and a subtle herringbone pattern.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Pewter', code: 'HRP01', hex: '#9ca3af' },
              { name: 'Moss', code: 'HRM02', hex: '#4b5563' },
              { name: 'Indigo', code: 'HRI03', hex: '#312e81' },
            ],
            specs: {
              'COMPOSITION': '100% Pure New Wool',
              'GUARANTEE': '10 Years',
              'WIDTH': '54 inches',
              'APPLICATION': 'Panel / Upholstery',
            },
            performance: {
              'FLAMMABILITY': 'BS 7176 Low Hazard / California Technical Bulletin 117',
              'ABRASION RESISTANCE': '≥75,000 double rubs',
            },
            cleaning: 'W/S Clean.',
            documents: [
              { name: 'Herald Spec Sheet', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'acoustics-nt',
        name: 'N–T',
        products: [
          {
            id: 'nova',
            name: 'Nova',
            description:
              'Nova is a lightweight acoustic fabric developed for ceiling tiles and wall panel applications. Available in a wide range of neutral tones.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Cloud', code: 'NVC01', hex: '#f3f4f6' },
              { name: 'Ash', code: 'NVA02', hex: '#d1d5db' },
              { name: 'Dune', code: 'NVD03', hex: '#d4a15a' },
            ],
            specs: {
              'COMPOSITION': '100% Polyester — recycled content',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Ceiling Tiles / Wrapped Panel / Wall',
            },
            performance: {
              'FLAMMABILITY': 'ASTM E84 Class A',
            },
            cleaning: 'Dry clean only.',
            documents: [
              { name: 'Nova Technical Sheet', type: 'pdf' },
              { name: 'ASTM E84 Certificate', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'camira-fabrics',
    name: 'Camira — Fabrics',
    description:
      'Camira Fabrics offers a curated collection of high-performance contract textiles for upholstery, seating, and wall applications. Each fabric is rigorously tested to meet the demands of commercial interiors.',
    bgColor: '#d97706',
    textColor: '#1c1917',
    type: 'materials',
    binderCount: 4,
    binderLabel: 'Camira — Fabrics',
    tags: ['quickship'],
    categories: [
      {
        id: 'upholstery',
        name: 'Upholstery',
        products: [
          {
            id: 'main-line-flax',
            name: 'Main Line Flax',
            description:
              'Main Line Flax is a durable linen-look fabric crafted from recycled polyester fibres. Its natural aesthetic and extensive palette make it ideal for task seating and lounge applications.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Cream', code: 'MLF-C', hex: '#fef3c7' },
              { name: 'Biscuit', code: 'MLF-B', hex: '#d4a15a' },
              { name: 'Storm', code: 'MLF-S', hex: '#6b7280' },
              { name: 'Navy', code: 'MLF-N', hex: '#1e3a5f' },
              { name: 'Olive', code: 'MLF-O', hex: '#4a5240' },
            ],
            specs: {
              'COMPOSITION': '100% Recycled Polyester',
              'GUARANTEE': '5 Years',
              'WEIGHT': '12 oz/sq yd',
              'APPLICATION': 'Task Seating / Lounge',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117 / BS 7176',
              'ABRASION RESISTANCE': '≥100,000 Martindale cycles',
              'ENVIRONMENTAL': 'GRS certified recycled content',
            },
            cleaning: 'W Clean — mild detergent only.',
            documents: [
              { name: 'Main Line Flax Brochure', type: 'pdf' },
              { name: 'GRS Certificate', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hbf-textiles',
    name: 'HBF Textiles',
    description:
      'HBF Textiles produces innovative performance textiles for commercial furniture and architectural applications. Our fabrics combine design leadership with advanced technical performance.',
    bgColor: '#4b5563',
    textColor: '#f9fafb',
    type: 'materials',
    binderCount: 3,
    binderLabel: 'HBF Textiles',
    categories: [
      {
        id: 'upholstery',
        name: 'Upholstery',
        products: [
          {
            id: 'rime',
            name: 'Rime',
            description:
              'Rime is a textured performance fabric with a subtle crosshatch weave. Engineered for high-traffic commercial environments.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Arctic', code: 'RM-A', hex: '#e5e7eb' },
              { name: 'Frost', code: 'RM-F', hex: '#93c5fd' },
              { name: 'Glacier', code: 'RM-G', hex: '#bfdbfe' },
              { name: 'Carbon', code: 'RM-C', hex: '#374151' },
            ],
            specs: {
              'COMPOSITION': '100% Solution-Dyed Polyester',
              'GUARANTEE': '5 Years',
              'WEIGHT': '14 oz/sq yd',
              'WIDTH': '54 inches',
              'APPLICATION': 'Task Seating / Panel / Upholstery',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'ABRASION RESISTANCE': '≥100,000 Martindale cycles',
              'STAIN RESISTANCE': 'Soil and stain resistant finish',
            },
            cleaning: 'W Clean — mild detergent or commercial upholstery cleaner.',
            documents: [
              { name: 'Rime Specification Sheet', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'luum',
    name: 'Luum',
    description:
      'Luum makes textiles that are grounded in material exploration and elevated by expert craftsmanship. Our collections range from architectural-scale performance wovens to fine, hand-finished upholstery fabrics.',
    bgColor: '#d4a15a',
    textColor: '#1c1917',
    type: 'materials',
    tags: ['quickship'],
    categories: [
      {
        id: 'upholstery-1',
        name: 'No.1 Upholstery',
        subtitle: 'Textures · Patterns · Solids',
        products: [
          {
            id: 'canter',
            name: 'Canter',
            description:
              'Canter is a versatile mid-weight upholstery fabric with a subtle texture and excellent durability for commercial applications.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Flax', code: 'CA-FL', hex: '#d4a15a' },
              { name: 'Pewter', code: 'CA-PE', hex: '#9ca3af' },
              { name: 'Midnight', code: 'CA-MI', hex: '#1e3a5f' },
              { name: 'Berry', code: 'CA-BE', hex: '#86198f' },
            ],
            specs: {
              'COMPOSITION': '66% Polyester / 34% Nylon',
              'GUARANTEE': '5 Years',
              'WEIGHT': '11 oz/sq yd',
              'APPLICATION': 'Upholstery / Panel / Drapery',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'ABRASION RESISTANCE': '≥75,000 double rubs',
            },
            cleaning: 'W/S Clean.',
            documents: [
              { name: 'Canter Product Sheet', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'panel-wrapped-wall',
        name: 'No.1 Panel & Wrapped Wall',
        subtitle: 'Bleach Cleanable · Recycled Content',
        products: [
          {
            id: 'motif',
            name: 'Motif',
            description:
              'Motif is a bleach-cleanable panel fabric with a geometric pattern optimized for wrapped panel applications.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Linen', code: 'MO-LI', hex: '#e8d5b7' },
              { name: 'Zinc', code: 'MO-ZN', hex: '#71717a' },
              { name: 'Cobalt', code: 'MO-CO', hex: '#1d4ed8' },
            ],
            specs: {
              'COMPOSITION': '100% Polyester — recycled content',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Panel / Wrapped Wall',
              'SPECIAL': 'Bleach cleanable',
            },
            performance: {
              'FLAMMABILITY': 'ASTM E84 Class A',
              'ENVIRONMENTAL': 'Recycled content',
            },
            cleaning: 'Can be cleaned with diluted bleach solution (10:1 water/bleach ratio).',
            documents: [
              { name: 'Motif Spec Sheet', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'mayer-fabrics',
    name: 'Mayer Fabrics',
    description:
      'Mayer Fabrics creates high-performance textiles for healthcare, hospitality, and corporate environments. Our portfolio spans upholstery, panel, privacy, and drapery fabrics engineered for demanding commercial use.',
    bgColor: '#1f2937',
    textColor: '#f9fafb',
    type: 'materials',
    categories: [
      {
        id: 'upholstery',
        name: 'Upholstery',
        products: [
          {
            id: 'silverguard',
            name: 'Silverguard',
            description:
              'Silverguard is an antimicrobial vinyl fabric designed for healthcare seating. Its silver-ion technology provides continuous protection against microorganisms.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'White', code: 'SG-W', hex: '#f9fafb' },
              { name: 'Light Grey', code: 'SG-LG', hex: '#d1d5db' },
              { name: 'Taupe', code: 'SG-T', hex: '#a8956a' },
              { name: 'Navy', code: 'SG-N', hex: '#1e3a5f' },
              { name: 'Red', code: 'SG-R', hex: '#dc2626' },
            ],
            specs: {
              'COMPOSITION': 'Vinyl with antimicrobial silver-ion treatment',
              'GUARANTEE': '5 Years',
              'WEIGHT': '30 oz/sq yd',
              'APPLICATION': 'Healthcare Seating / High-Traffic Upholstery',
              'SPECIAL': 'Antimicrobial, fluid resistant',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117 / 133',
              'ABRASION RESISTANCE': '≥500,000 Martindale cycles',
              'ANTIMICROBIAL': 'Silver-ion technology — EPA registered',
            },
            cleaning: 'Use diluted bleach (1:10) or hospital-grade disinfectant. Wipe; do not soak.',
            documents: [
              { name: 'Silverguard Technical Spec', type: 'pdf' },
              { name: 'Antimicrobial Certificate', type: 'pdf' },
              { name: 'California TB 133 Certificate', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'panel',
        name: 'Panel',
        products: [
          {
            id: 'connect',
            name: 'Connect',
            description:
              'Connect is a tightly woven panel fabric engineered for acoustic performance and color consistency across large panel installations.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Pebble', code: 'CN-PB', hex: '#d1d5db' },
              { name: 'Slate', code: 'CN-SL', hex: '#64748b' },
              { name: 'Chocolate', code: 'CN-CH', hex: '#431407' },
            ],
            specs: {
              'COMPOSITION': '100% Polyester',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Panel Fabric / Wrapped Wall',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'ACOUSTIC': 'NRC 0.65',
            },
            cleaning: 'W Clean — mild detergent.',
            documents: [
              { name: 'Connect Panel Spec', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pallas',
    name: 'Pallas',
    description:
      'Pallas designs performance textiles with an artful sensibility — fabrics that are technically advanced yet visually refined. Our collection spans privacy sheers, panel fabrics, and upholstery for commercial interiors.',
    bgColor: '#374151',
    textColor: '#f9fafb',
    type: 'materials',
    categories: [
      {
        id: 'cubicle-drapery',
        name: 'Cubicle & Drapery',
        products: [
          {
            id: 'sheer-delight',
            name: 'Sheer Delight',
            description:
              'Sheer Delight is a privacy curtain fabric for healthcare and hospitality applications. Its open weave allows light diffusion while maintaining visual separation.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Mist', code: 'SD-M', hex: '#e5e7eb' },
              { name: 'Sky', code: 'SD-S', hex: '#bfdbfe' },
              { name: 'Sage', code: 'SD-G', hex: '#86efac' },
            ],
            specs: {
              'COMPOSITION': '100% Polyester',
              'GUARANTEE': '3 Years',
              'WIDTH': '118 inches (10 inch repeat)',
              'APPLICATION': 'Cubicle Curtain / Drapery / Privacy Screen',
            },
            performance: {
              'FLAMMABILITY': 'NFPA 701 / California Technical Bulletin 117',
              'LIGHT TRANSMISSION': '55%',
            },
            cleaning: 'Machine wash cold, gentle cycle. Do not bleach.',
            documents: [
              { name: 'Sheer Delight Spec', type: 'pdf' },
              { name: 'NFPA 701 Certificate', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'panels',
        name: 'Panels',
        products: [
          {
            id: 'tessera',
            name: 'Tessera',
            description:
              'Tessera is a geometric pattern fabric for panel systems. Its modular motif creates rhythm and visual interest across large panel installations.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Dove', code: 'TS-D', hex: '#d1d5db' },
              { name: 'Graphite', code: 'TS-G', hex: '#4b5563' },
              { name: 'Ocean', code: 'TS-O', hex: '#0369a1' },
              { name: 'Terra', code: 'TS-T', hex: '#c2410c' },
            ],
            specs: {
              'COMPOSITION': '100% Polyester',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Panel Fabric / Wrapped Wall',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
            },
            cleaning: 'W Clean — mild detergent.',
            documents: [
              { name: 'Tessera Product Sheet', type: 'pdf' },
            ],
          },
        ],
      },
      {
        id: 'upholstery',
        name: 'Upholstery',
        products: [
          {
            id: 'cipher',
            name: 'Cipher',
            description:
              'Cipher is a dense bouclé-inspired upholstery fabric with a rich textural quality and strong colorfast performance.',
            images: [
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
            ],
            colorways: [
              { name: 'Ivory', code: 'CP-I', hex: '#fef9c3' },
              { name: 'Camel', code: 'CP-CA', hex: '#d4a15a' },
              { name: 'Charcoal', code: 'CP-CH', hex: '#374151' },
              { name: 'Violet', code: 'CP-V', hex: '#6d28d9' },
            ],
            specs: {
              'COMPOSITION': '57% Polyester / 43% Acrylic',
              'GUARANTEE': '5 Years',
              'APPLICATION': 'Lounge / Soft Seating / Upholstery',
            },
            performance: {
              'FLAMMABILITY': 'California Technical Bulletin 117',
              'ABRASION RESISTANCE': '≥60,000 Martindale cycles',
            },
            cleaning: 'W/S Clean.',
            documents: [
              { name: 'Cipher Technical Sheet', type: 'pdf' },
            ],
          },
        ],
      },
    ],
  },

  /* ═════════════════════════════════════════════════════════════════════
     MRL Fase 1 (2026-07-09) · 16 manufacturers adicionales para densidad
     de biblioteca tipo referente (myresourcelibrary.com). Nombres inventados
     variados (decisión Diego · zero brands reales). Categorías vacías por
     ahora — foco de esta fase es llegar a 25 spines en el shelf; drill-down
     se enriquece cuando aplique.

     Distribución:
     - 3 lg · 9 md (incl. 3 wide) · 4 sm
     - 5 con tagline
     - 10 products · 6 materials
     - Colores brand plausibles y variados
     ═════════════════════════════════════════════════════════════════════ */

  /* ── Products ────────────────────────────────────────────────────────── */
  {
    id: 'corva',
    name: 'Corva',
    description: 'Contemporary contract seating for hospitality and workplace environments. Modular, refined, made in the Pacific Northwest.',
    bgColor: '#1E3A5F',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'md',
    tagline: 'Contract Seating',
    tags: ['quickship'],
    heroImage: 'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=1200&q=80',
    heroTagline: 'Modular. Refined. Made in the Pacific Northwest.',
    categoryCardStyle: 'line-icon',
    brandResources: [
      { name: 'Corva.com', href: '#' },
      { name: 'Finishes Guide', href: '#' },
    ],
    contacts: [
      { name: 'Lena Whittaker', title: 'Territory Manager', email: 'lena@corva.com' },
    ],
    categories: [
      {
        id: 'lounge',
        name: 'Lounge',
        cardIconSvg: '<path d="M15 40 L15 65 L65 65 L65 40 L60 40 L60 30 L20 30 L20 40 Z M10 65 L70 65" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        products: [],
      },
      {
        id: 'side-chairs',
        name: 'Side Chairs',
        cardIconSvg: '<path d="M30 20 L30 45 M50 20 L50 45 M25 45 L55 45 L55 55 L25 55 Z M30 55 L30 68 M50 55 L50 68" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        products: [],
      },
      {
        id: 'benches',
        name: 'Benches',
        cardIconSvg: '<path d="M12 40 L68 40 L68 48 L12 48 Z M18 48 L18 68 M62 48 L62 68 M18 55 L62 55" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        products: [],
      },
      {
        id: 'ottomans',
        name: 'Ottomans',
        cardIconSvg: '<ellipse cx="40" cy="45" rx="28" ry="8" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M12 45 L12 58 Q12 68 40 68 Q68 68 68 58 L68 45" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
        products: [],
      },
    ],
  },
  {
    id: 'merida',
    name: 'Merida',
    description: 'Bold architectural furniture · benches, tables and lounge collections that anchor open spaces.',
    bgColor: '#C2410C',
    textColor: '#FFFFFF',
    type: 'products',
    size: 'lg',
    tags: ['gsa', 'cet'],
    categories: [],
  },
  {
    id: 'onyx-elm',
    name: 'Onyx & Elm',
    description: 'Handcrafted casegoods · a partnership between traditional joinery and contemporary form language.',
    bgColor: '#0B0B0C',
    textColor: '#FFFFFF',
    type: 'products',
    size: 'md',
    tagline: 'CONTRACT',
    tags: ['cet', 'cil'],
    categories: [],
  },
  {
    id: 'fenwick-studio',
    name: 'Fenwick Studio',
    description: 'Design-forward accent chairs and side tables from a small studio in Portland.',
    bgColor: '#14532D',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'sm',
    categories: [],
  },
  {
    id: 'vestige',
    name: 'Vestige',
    description: 'Modular storage systems for the modern workplace · panels, credenzas, media walls.',
    bgColor: '#F5F0E8',
    textColor: '#0B0B0C',
    type: 'products',
    size: 'md',
    tagline: 'Systems & Storage',
    tags: ['gsa'],
    categories: [],
  },
  {
    id: 'arboria',
    name: 'Arboria',
    description: 'Warm-wood seating and lounge collections inspired by Scandinavian and Japandi traditions.',
    bgColor: '#B8956A',
    textColor: '#0B0B0C',
    type: 'products',
    size: 'md',
    variant: 'wide',
    wideImageUrl: 'https://images.unsplash.com/photo-1567538096631-e0c55bd6374c?w=400&q=80',
    categories: [],
  },
  {
    id: 'novara',
    name: 'Novara',
    description: 'Italian-designed ergonomic seating engineered for long sessions of collaborative work.',
    bgColor: '#0F766E',
    textColor: '#FFFFFF',
    accentColor: '#ec4899',
    type: 'products',
    size: 'lg',
    binderCount: 2,
    tags: ['cet', 'cil'],
    heroImage: 'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=1200&q=80',
    heroTagline: 'Ergonomics for the long session.',
    categoryCardStyle: 'silhouette',
    links: [
      { name: 'Product Catalog', href: '#' },
      { name: 'CAD Symbols Library', href: '#' },
      { name: 'Fabric Database', href: '#' },
    ],
    categories: [
      {
        id: 'task',
        name: 'Task',
        cardIconSvg: '<path d="M40 12 Q30 12 30 22 L30 38 Q30 42 34 42 L46 42 Q50 42 50 38 L50 22 Q50 12 40 12 Z M32 42 L32 56 L48 56 L48 42 M40 56 L40 66 M28 66 L52 66 M22 62 L28 66 M58 62 L52 66" fill="currentColor"/>',
        products: [],
      },
      {
        id: 'executive',
        name: 'Executive',
        cardIconSvg: '<path d="M28 10 Q22 10 22 18 L22 40 Q22 46 28 46 L52 46 Q58 46 58 40 L58 18 Q58 10 52 10 Z M25 46 L25 60 L55 60 L55 46 M40 60 L40 68 M28 68 L52 68" fill="currentColor"/>',
        products: [],
      },
      {
        id: 'stools',
        name: 'Stools',
        cardIconSvg: '<path d="M32 10 L32 30 L48 30 L48 10 Q48 6 40 6 Q32 6 32 10 Z M28 30 L52 30 L50 66 L30 66 Z M25 66 L55 66" fill="currentColor"/>',
        products: [],
      },
      {
        id: 'lounge',
        name: 'Lounge',
        cardIconSvg: '<path d="M14 32 Q14 24 22 24 L58 24 Q66 24 66 32 L66 48 Q66 56 58 56 L22 56 Q14 56 14 48 Z M14 56 L14 68 M66 56 L66 68 M22 40 L58 40" fill="currentColor"/>',
        products: [],
      },
    ],
  },
  {
    id: 'salter',
    name: 'Salter',
    description: 'Task tools and ergonomic accessories · monitor arms, keyboard trays, cable management.',
    bgColor: '#6B21A8',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'sm',
    categories: [],
  },
  {
    id: 'braemar',
    name: 'Braemar',
    description: 'Height-adjustable desking and benching systems for the hybrid workplace.',
    bgColor: '#7F1D1D',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'md',
    tagline: 'Powering Innovation',
    tags: ['quickship', 'gsa'],
    categories: [],
  },
  {
    id: 'ridgeline',
    name: 'Ridgeline',
    description: 'Executive office furniture and boardroom tables · veneers, mixed materials, quiet detailing.',
    bgColor: '#27272A',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'lg',
    tags: ['gsa', 'cet'],
    categories: [],
  },

  /* ── Materials ───────────────────────────────────────────────────────── */
  {
    id: 'terracotta-row',
    name: 'Terracotta Row',
    description: 'Wallcoverings and dimensional tiles inspired by Mediterranean earthenware traditions.',
    bgColor: '#C0532A',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'md',
    categories: [],
  },
  {
    id: 'amberwood-textiles',
    name: 'Amberwood Textiles',
    description: 'Luxury upholstery textiles · wools, mohairs, boucles woven in Belgium and Italy.',
    bgColor: '#B45309',
    textColor: '#FFFFFF',
    type: 'materials',
    size: 'md',
    variant: 'wide',
    wideImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    binderCount: 2,
    categories: [],
  },
  {
    id: 'halden-fabrics',
    name: 'Halden Fabrics',
    description: 'Performance textiles for healthcare and hospitality · antimicrobial, bleach-cleanable.',
    bgColor: '#D4A574',
    textColor: '#0B0B0C',
    type: 'materials',
    size: 'sm',
    categories: [],
  },
  {
    id: 'bloom-textiles',
    name: 'Bloom Textiles',
    description: 'Recycled-content upholstery and drapery · closed-loop supply chain, cradle-to-cradle certified.',
    bgColor: '#A87A80',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'md',
    tagline: 'Sustainable Weaves',
    categories: [],
  },
  {
    id: 'fasson-studio',
    name: 'Fasson',
    description: 'Architectural surfaces · digital printed wallcoverings and custom mural installations.',
    bgColor: '#F4EFE6',
    textColor: '#0B0B0C',
    type: 'materials',
    size: 'sm',
    categories: [],
  },
  {
    id: 'elston-acoustics',
    name: 'Elston Acoustics',
    description: 'Acoustic panels, ceiling clouds and dimensional wall systems for open-plan environments.',
    bgColor: '#1F2937',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'md',
    variant: 'wide',
    wideImageUrl: 'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?w=400&q=80',
    categories: [],
  },

  /* ═════════════════════════════════════════════════════════════════════
     MRL Fase 1 · batch 2 (2026-07-09) · 10 manufacturers adicionales
     agregados a pedido de Diego para llegar a 3 filas visibles por tab
     con el BINDERS_PER_SHELF actual (14). Total ahora: 35 items.
     ═════════════════════════════════════════════════════════════════════ */

  /* ── Products (5 nuevos) ─────────────────────────────────────────────── */
  {
    id: 'kessler-muir',
    name: 'Kessler-Muir',
    description: 'Executive casegoods and boardroom collections · veneers sourced from certified sustainable forests.',
    bgColor: '#365845',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'md',
    tagline: 'Executive Casegoods',
    tags: ['cet'],
    categories: [],
  },
  {
    id: 'kilbourne',
    name: 'Kilbourne',
    description: 'Compact side chairs and stools for education and hospitality environments.',
    bgColor: '#7C3AED',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'sm',
    categories: [],
  },
  {
    id: 'skyway-studio',
    name: 'Skyway Studio',
    description: 'Modular workstations and phone booths for the hybrid workplace · quiet acoustics, elegant lines.',
    bgColor: '#94A3B8',
    textColor: '#0B0B0C',
    type: 'products',
    size: 'md',
    variant: 'wide',
    wideImageUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&q=80',
    tags: ['quickship'],
    categories: [],
  },
  {
    id: 'cordwain',
    name: 'Cordwain',
    description: 'Leather-forward lounge seating and executive chairs · full-grain hides, hand-finished.',
    bgColor: '#78350F',
    textColor: '#F5F0E8',
    type: 'products',
    size: 'lg',
    categories: [],
  },
  {
    id: 'motif-contract',
    name: 'Motif Contract',
    description: 'Task seating and collaborative furniture engineered for high-traffic office environments.',
    bgColor: '#18181B',
    textColor: '#FFFFFF',
    type: 'products',
    size: 'md',
    tagline: 'Task Seating',
    binderCount: 2,
    tags: ['cil'],
    categories: [],
  },

  /* ── Materials (5 nuevos) ────────────────────────────────────────────── */
  {
    id: 'meridian-grove',
    name: 'Meridian Grove',
    description: 'Botanical-inspired wallcoverings and dimensional wood panels · biophilic design library.',
    bgColor: '#84A98C',
    textColor: '#0B0B0C',
    type: 'materials',
    size: 'md',
    tagline: 'Wallcoverings',
    categories: [],
  },
  {
    id: 'vellum',
    name: 'Vellum',
    description: 'Paper-based specialty finishes and textile prints for architectural millwork installations.',
    bgColor: '#FDE68A',
    textColor: '#0B0B0C',
    type: 'materials',
    size: 'sm',
    categories: [],
  },
  {
    id: 'redwood-bench-co',
    name: 'Redwood Bench Co.',
    description: 'Reclaimed timber tabletops and benching · certified sources, hand-finished in Northern California.',
    bgColor: '#7C2D12',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'md',
    variant: 'wide',
    wideImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
    tagline: 'Reclaimed Wood',
    categories: [],
  },
  {
    id: 'auberge-fabrics',
    name: 'Auberge Fabrics',
    description: 'Rich velvets and jacquards for hospitality upholstery · crypton-treated for contract durability.',
    bgColor: '#831843',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'md',
    categories: [],
  },
  {
    id: 'ravel-textiles',
    name: 'Ravel Textiles',
    description: 'Performance drapery and panel fabrics engineered for acoustic and light management.',
    bgColor: '#1E1B4B',
    textColor: '#F5F0E8',
    type: 'materials',
    size: 'lg',
    binderCount: 2,
    categories: [],
  },
]

export const PRODUCTS_MANUFACTURERS = MANUFACTURERS.filter(m => m.type === 'products' || m.type === 'both')
export const MATERIALS_MANUFACTURERS = MANUFACTURERS.filter(m => m.type === 'materials' || m.type === 'both')
