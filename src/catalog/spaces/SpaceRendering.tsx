// Fase 3 · SpaceRendering (2026-07-06)
// SVG isométrico stylized con hotspots numerados · reemplaza el placeholder
// vacío que teníamos en Fase 2. Todo determinístico · sin dependencias
// externas (Unsplash/HTTP). Recrea la vista tipo "Possible Space
// Configuration" del widget MillerKnoll/Steelcase que Diego compartió.

interface Props {
    /** Icon del SpaceType (emoji) · se dibuja en el centro del rendering. */
    spaceIcon: string
    /** Cantidad de hotspots a distribuir. Se soporta hasta 8; extra se recorta. */
    itemCount: number
    /** Alt text para accesibilidad. */
    label: string
}

// Posiciones (x, y) en un viewBox 400x260 · distribución visualmente balanceada
// según N. Los primeros N puntos de la lista son los que se usan.
const HOTSPOT_LAYOUTS: Record<number, Array<[number, number]>> = {
    1: [[200, 130]],
    2: [[130, 130], [270, 130]],
    3: [[130, 100], [270, 100], [200, 195]],
    4: [[110, 95], [290, 95], [130, 200], [275, 200]],
    5: [[110, 90], [290, 90], [200, 130], [135, 205], [275, 205]],
    6: [[105, 85], [200, 80], [295, 85], [130, 205], [200, 215], [280, 205]],
    7: [[100, 80], [200, 70], [300, 80], [130, 145], [275, 145], [155, 215], [255, 215]],
    8: [[100, 75], [200, 70], [300, 75], [130, 135], [275, 135], [140, 210], [200, 220], [280, 210]],
}

function getHotspots(count: number): Array<[number, number]> {
    const capped = Math.min(Math.max(count, 1), 8)
    return HOTSPOT_LAYOUTS[capped]
}

export default function SpaceRendering({ spaceIcon, itemCount, label }: Props) {
    const hotspots = getHotspots(itemCount)

    return (
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/40 to-card">
            <svg
                viewBox="0 0 400 260"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                role="img"
                aria-label={label}
            >
                {/* ── Floor plan isométrico ── */}
                <defs>
                    <linearGradient id="floor" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.14" />
                    </linearGradient>
                    <linearGradient id="wall" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                {/* Pared trasera (perspective) */}
                <g className="text-foreground">
                    <polygon points="100,55 300,55 340,95 60,95" fill="url(#wall)" />
                    {/* Piso isométrico */}
                    <polygon points="60,95 340,95 380,225 20,225" fill="url(#floor)" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

                    {/* Rejilla del piso · líneas horizontales sutiles */}
                    <line x1="90" y1="130" x2="330" y2="130" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                    <line x1="80" y1="170" x2="340" y2="170" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                    <line x1="60" y1="220" x2="360" y2="220" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

                    {/* Pared izquierda (leve indicación) */}
                    <polygon points="60,95 100,55 100,180 20,225" fill="url(#wall)" opacity="0.6" />
                    {/* Pared derecha */}
                    <polygon points="340,95 300,55 300,180 380,225" fill="url(#wall)" opacity="0.6" />
                </g>

                {/* Icon del space type al centro (bajo los hotspots) */}
                <text
                    x="200"
                    y="140"
                    textAnchor="middle"
                    fontSize="52"
                    opacity="0.35"
                    style={{ userSelect: 'none' }}
                >
                    {spaceIcon}
                </text>

                {/* ── Hotspots numerados ── */}
                {hotspots.map(([x, y], i) => (
                    <g key={i}>
                        {/* Halo sutil */}
                        <circle cx={x} cy={y} r="18" className="fill-primary" opacity="0.22" />
                        {/* Círculo principal · bg primary + número */}
                        <circle cx={x} cy={y} r="13" className="fill-primary" />
                        <text
                            x={x}
                            y={y + 4}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="800"
                            className="fill-primary-foreground"
                            style={{ userSelect: 'none' }}
                        >
                            {i + 1}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Watermark bottom-right · "Rendering for reference only" · consistent con las notas de los settings */}
            <span className="absolute bottom-1.5 right-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Reference rendering
            </span>
        </div>
    )
}
