// Fase 3.1 · SpaceRendering (rebuild 2026-07-06)
// Foto real del SpaceType como base + overlay SVG con hotspots numerados.
// Reemplaza el SVG isométrico stylized de Fase 3 (Diego feedback · se veía vacío,
// no comunicaba el escenario). Fallback: si la img falla, mostramos un placeholder
// con emoji grande + hotspots, mismo layout que antes.

import { useState } from 'react'

interface Props {
    imageUrl: string
    /** Fallback si la foto no carga (network, 404) · emoji del SpaceType. */
    fallbackIcon: string
    itemCount: number
    label: string
}

// Layouts predefinidos de hotspots · viewBox 400x260. Los primeros N puntos son
// los que se usan según itemCount. Nota: las posiciones están calibradas para
// que "flotan" sobre una foto de espacio típica (parte central del frame).
const HOTSPOT_LAYOUTS: Record<number, Array<[number, number]>> = {
    1: [[200, 130]],
    2: [[140, 140], [270, 140]],
    3: [[140, 105], [270, 105], [200, 200]],
    4: [[120, 100], [285, 100], [140, 200], [270, 200]],
    5: [[120, 95], [285, 95], [200, 140], [140, 210], [270, 210]],
    6: [[115, 90], [200, 85], [290, 90], [140, 210], [200, 220], [275, 210]],
    7: [[110, 85], [200, 75], [295, 85], [140, 150], [270, 150], [155, 215], [255, 215]],
    8: [[110, 80], [200, 70], [295, 80], [140, 145], [270, 145], [145, 215], [200, 225], [275, 215]],
}

function getHotspots(count: number): Array<[number, number]> {
    const capped = Math.min(Math.max(count, 1), 8)
    return HOTSPOT_LAYOUTS[capped]
}

export default function SpaceRendering({ imageUrl, fallbackIcon, itemCount, label }: Props) {
    const hotspots = getHotspots(itemCount)
    const [imgFailed, setImgFailed] = useState(false)

    return (
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
            {/* Foto base · onError descarta y activa fallback */}
            {!imgFailed && (
                <img
                    src={imageUrl}
                    alt={label}
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Fallback · placeholder con emoji grande centrado */}
            {imgFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/40 to-card">
                    <span className="text-6xl opacity-30 select-none" role="img" aria-hidden="true">
                        {fallbackIcon}
                    </span>
                </div>
            )}

            {/* Overlay sutil · mejora contrast de los hotspots sobre fotos claras */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25 pointer-events-none" />

            {/* SVG overlay con hotspots numerados · viewBox 400x260 igual que antes */}
            <svg
                viewBox="0 0 400 260"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                {hotspots.map(([x, y], i) => (
                    <g key={i}>
                        {/* Halo doble · aumenta visibilidad sobre backgrounds variados */}
                        <circle cx={x} cy={y} r="20" className="fill-primary" opacity="0.18" />
                        <circle cx={x} cy={y} r="15" className="fill-primary" opacity="0.35" />
                        {/* Círculo principal · borde blanco para separar del fondo */}
                        <circle cx={x} cy={y} r="12" className="fill-primary" stroke="white" strokeWidth="1.5" />
                        <text
                            x={x}
                            y={y + 4}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="800"
                            className="fill-primary-foreground"
                            style={{ userSelect: 'none' }}
                        >
                            {i + 1}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Watermark bottom-right · consistente con "The rendering is for example only" */}
            <span className="absolute bottom-1.5 right-2 rounded bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/85">
                Reference space
            </span>
        </div>
    )
}
