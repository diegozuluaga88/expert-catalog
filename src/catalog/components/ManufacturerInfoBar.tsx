// MRL Detail Fase D4 (2026-07-10) · ManufacturerInfoBar.
//
// Reemplaza al sidebar lateral con una info bar HORIZONTAL embebida en el
// content del ManufacturerPage. Se coloca entre el bloque hero+descripción
// y el category grid. Renderiza hasta 4 secciones OPCIONALES:
//
//   Filter          · radios Standard / GSA / QS (mock display, no filtra).
//                     Solo si `filterOptions` incluye alguno de esos.
//   Brand Resources · lista de brandResources con external link icon.
//   Links           · lista de links externos (nuevo campo Fase D1).
//   Contacts        · lista compact de contacts (name + title + email/tel).
//
// Cada sección se skipea si no hay data (Nielsen H8 · aesthetic). Si las 4
// son undefined, la InfoBar no se renderiza (retorna null).

import { ArrowTopRightOnSquareIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import type { Manufacturer } from '../types'
import { useState } from 'react'

interface ManufacturerInfoBarProps {
  manufacturer: Manufacturer
}

const FILTER_LABELS = ['Standard', 'GSA', 'QS'] as const

export default function ManufacturerInfoBar({ manufacturer }: ManufacturerInfoBarProps) {
  // Filter section · solo si el brand tiene filterOptions que matcheen
  // con los 3 mock labels del referente (Standard/GSA/QS).
  const filterOpts = manufacturer.filterOptions?.filter(o =>
    FILTER_LABELS.some(l => l.toLowerCase() === o.toLowerCase())
  ) ?? []
  const hasFilter = filterOpts.length > 0

  const hasResources = (manufacturer.brandResources?.length ?? 0) > 0
  const hasLinks = (manufacturer.links?.length ?? 0) > 0
  const hasContacts = (manufacturer.contacts?.length ?? 0) > 0

  if (!hasFilter && !hasResources && !hasLinks && !hasContacts) {
    return null
  }

  return (
    <section
      aria-label="Brand information"
      className="mt-10 rounded-xl border border-border bg-card/50 p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {hasFilter && <FilterSection options={filterOpts} />}
      {hasResources && <ResourcesSection resources={manufacturer.brandResources!} />}
      {hasLinks && <LinksSection links={manufacturer.links!} />}
      {hasContacts && <ContactsSection contacts={manufacturer.contacts!} />}
    </section>
  )
}

/* ─── Section header ─────────────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {label}
    </h3>
  )
}

/* ─── Filter (mock) ──────────────────────────────────────────────────── */

function FilterSection({ options }: { options: string[] }) {
  // Mock display · el estado vive local · no filtra products. Diego
  // decidió no wire real en esta iteración.
  const [selected, setSelected] = useState<string>(options[0] ?? 'Standard')
  return (
    <div>
      <SectionHeader label="Filter" />
      <div className="flex flex-col gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="brand-filter"
              checked={selected === opt}
              onChange={() => setSelected(opt)}
              className="w-3.5 h-3.5 accent-primary shrink-0"
            />
            <span className="text-sm text-foreground/85 group-hover:text-foreground transition-colors">
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

/* ─── Brand Resources ────────────────────────────────────────────────── */

function ResourcesSection({ resources }: { resources: NonNullable<Manufacturer['brandResources']> }) {
  return (
    <div>
      <SectionHeader label="Brand Resources" />
      <ul className="flex flex-col gap-1.5">
        {resources.map((r, i) => (
          <li key={i}>
            <a
              href={r.href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/85 hover:text-foreground transition-colors group"
            >
              <span className="truncate">{r.name}</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Links ──────────────────────────────────────────────────────────── */

function LinksSection({ links }: { links: NonNullable<Manufacturer['links']> }) {
  return (
    <div>
      <SectionHeader label="Links" />
      <ul className="flex flex-col gap-1.5">
        {links.map((l, i) => (
          <li key={i}>
            <a
              href={l.href ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/85 hover:text-foreground transition-colors group"
            >
              <span className="truncate">{l.name}</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Contacts ───────────────────────────────────────────────────────── */

function ContactsSection({ contacts }: { contacts: NonNullable<Manufacturer['contacts']> }) {
  return (
    <div>
      <SectionHeader label="Contacts" />
      <ul className="flex flex-col gap-3">
        {contacts.map((c, i) => (
          <li key={i}>
            <p className="text-sm font-semibold text-foreground leading-tight">{c.name}</p>
            <p className="text-xs text-muted-foreground mb-1">{c.title}</p>
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="inline-flex items-center gap-1 text-xs text-foreground/75 hover:text-foreground transition-colors"
              >
                <EnvelopeIcon className="w-3 h-3 shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-foreground/75 hover:text-foreground transition-colors"
              >
                <PhoneIcon className="w-3 h-3 shrink-0" />
                <span>{c.phone}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
