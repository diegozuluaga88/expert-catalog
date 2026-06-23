import type { Manufacturer } from '../types'

interface BinderSpineProps {
  manufacturer: Manufacturer
  onClick: () => void
  label?: string
}

export default function BinderSpine({ manufacturer, onClick, label }: BinderSpineProps) {
  const displayLabel = label ?? manufacturer.binderLabel ?? manufacturer.name

  return (
    <button
      onClick={onClick}
      title={manufacturer.name}
      aria-label={`Open ${manufacturer.name} catalog`}
      className="group relative flex flex-col items-center cursor-pointer"
      style={{ width: 52 }}
    >
      {/* Binder body */}
      <div
        className="relative flex items-center justify-center w-full rounded-t-sm shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:-translate-y-1"
        style={{
          backgroundColor: manufacturer.bgColor,
          height: 192,
        }}
      >
        {/* Spine binding detail (left strip) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 rounded-tl-sm opacity-30"
          style={{ backgroundColor: manufacturer.textColor }}
        />

        {/* Vertical text */}
        <span
          className="text-[11px] font-semibold tracking-widest uppercase select-none leading-tight text-center px-1"
          style={{
            writingMode: 'vertical-lr',
            transform: 'rotate(180deg)',
            color: manufacturer.textColor,
            maxHeight: 160,
            overflow: 'hidden',
          }}
        >
          {displayLabel}
        </span>

        {/* Bottom circle dot (decorative, like MRL) */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 opacity-60"
          style={{ borderColor: manufacturer.textColor }}
        />
      </div>

      {/* Binder bottom tab */}
      <div
        className="w-full h-2 rounded-b-sm"
        style={{ backgroundColor: manufacturer.bgColor, filter: 'brightness(0.8)' }}
      />

      {/* Label below */}
      <p className="mt-1.5 text-[10px] text-center text-muted-foreground leading-tight max-w-[52px] truncate">
        {manufacturer.name}
      </p>
    </button>
  )
}
