import { Switch } from '@headlessui/react'
import { Building2, Check, ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BRANDS_LIST, VERTICAL_OPTIONS, type TenantPreferences, type Vertical } from './tenantPreferences'
import type { CustomRule } from './SmartRuleBuilderModal'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

interface Props {
    tenantName: string
    prefs: TenantPreferences
    onChange: (prefs: TenantPreferences) => void
    onAddCustomRule: () => void
    onRemoveCustomRule: (id: string) => void
}

// Panel de preferencias de compra per tenant (Diego ask · 2026-06-30).
// 5 secciones · Approved Manufacturers / Compliance & Vertical / Budget & SLA
// Sustainability / Custom Rules. UI demo only · no se conecta a filtros del catalog.
export default function PreferencesPanel({
    tenantName,
    prefs,
    onChange,
    onAddCustomRule,
    onRemoveCustomRule,
}: Props) {
    const [sustainabilityOpen, setSustainabilityOpen] = useState(true)

    // Helper para actualizar campos individuales
    const update = <K extends keyof TenantPreferences>(key: K, value: TenantPreferences[K]) => {
        onChange({ ...prefs, [key]: value })
    }

    const toggleBrand = (brand: string) => {
        const next = prefs.approvedBrands.includes(brand)
            ? prefs.approvedBrands.filter(b => b !== brand)
            : [...prefs.approvedBrands, brand]
        update('approvedBrands', next)
    }

    return (
        <div className="space-y-6">
            {/* Header context · tenant + helper */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Configuring preferences for <span className="text-foreground">{tenantName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        These rules tell Strata which products and vendors to prioritize when this customer creates a quote.
                        Stored locally per tenant.
                    </p>
                </div>
            </div>

            {/* SECTION 1 · Approved Manufacturers */}
            <section className="space-y-3">
                <SectionHeader title="Approved Manufacturers" description="Restrict the catalog to a curated vendor list." />
                <ToggleRow
                    label="Restrict to approved manufacturers only"
                    description="When enabled, only the brands selected below will appear in suggestions."
                    checked={prefs.restrictToApproved}
                    onChange={v => update('restrictToApproved', v)}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                    {BRANDS_LIST.map(brand => {
                        const active = prefs.approvedBrands.includes(brand)
                        return (
                            <button
                                key={brand}
                                type="button"
                                onClick={() => toggleBrand(brand)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    active
                                        ? 'border-primary bg-primary/15 text-foreground'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                {active && <Check className="h-3 w-3" />}
                                {brand}
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* SECTION 2 · Compliance & Vertical */}
            <section className="space-y-3">
                <SectionHeader title="Compliance & Vertical" description="Customer industry triggers compliance rules automatically." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {VERTICAL_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => update('vertical', opt.value)}
                            className={cn(
                                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                                prefs.vertical === opt.value
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded-full border-2',
                                    prefs.vertical === opt.value ? 'border-primary bg-primary' : 'border-border'
                                )}
                            >
                                {prefs.vertical === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                            </span>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {prefs.vertical === 'government' && (
                    <div className="space-y-2 pt-2 pl-2 border-l-2 border-primary/30">
                        <CheckRow
                            label="GSA Schedule eligible only"
                            checked={prefs.gsaScheduleOnly}
                            onChange={v => update('gsaScheduleOnly', v)}
                        />
                        <CheckRow
                            label="Buy American compliant"
                            checked={prefs.buyAmericanCompliant}
                            onChange={v => update('buyAmericanCompliant', v)}
                        />
                    </div>
                )}
                {prefs.vertical === 'healthcare' && (
                    <div className="space-y-2 pt-2 pl-2 border-l-2 border-primary/30">
                        <CheckRow
                            label="GPO approved (Vizient · Premier · HealthTrust)"
                            checked={prefs.gpoApproved}
                            onChange={v => update('gpoApproved', v)}
                        />
                        <CheckRow
                            label="Antimicrobial finishes required"
                            checked={prefs.antimicrobialFinishes}
                            onChange={v => update('antimicrobialFinishes', v)}
                        />
                    </div>
                )}
                {prefs.vertical === 'architectural' && (
                    <div className="space-y-2 pt-2 pl-2 border-l-2 border-primary/30">
                        <CheckRow
                            label="A&D firm approval workflow"
                            checked={prefs.adFirmApprovalWorkflow}
                            onChange={v => update('adFirmApprovalWorkflow', v)}
                        />
                        <CheckRow
                            label="Sample request required before order"
                            checked={prefs.sampleRequestRequired}
                            onChange={v => update('sampleRequestRequired', v)}
                        />
                    </div>
                )}
            </section>

            {/* SECTION 3 · Budget & Lead Time SLA */}
            <section className="space-y-3">
                <SectionHeader title="Budget & Lead Time SLA" description="Caps that Strata uses to flag out-of-bounds items." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="max-budget" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Max project budget (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                            <input
                                id="max-budget"
                                type="number"
                                min={0}
                                value={prefs.maxProjectBudget ?? ''}
                                onChange={e => {
                                    const v = e.target.value
                                    update('maxProjectBudget', v === '' ? null : Number(v))
                                }}
                                placeholder="No limit"
                                className="h-9 w-full rounded-lg border border-input bg-background pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="max-leadtime" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Max acceptable lead time · <span className="text-foreground font-bold">{prefs.maxLeadTimeDays} days</span>
                        </label>
                        <input
                            id="max-leadtime"
                            type="range"
                            min={7}
                            max={90}
                            step={1}
                            value={prefs.maxLeadTimeDays}
                            onChange={e => update('maxLeadTimeDays', Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                            <span>7d</span>
                            <span>30d</span>
                            <span>60d</span>
                            <span>90d</span>
                        </div>
                    </div>
                </div>
                <ToggleRow
                    label="Flag items exceeding SLA with warning badge"
                    description="Catalog and quote views will surface a warning icon on slow-shipping items."
                    checked={prefs.flagItemsExceedingSla}
                    onChange={v => update('flagItemsExceedingSla', v)}
                />
            </section>

            {/* SECTION 4 · Sustainability · collapsible */}
            <section className="space-y-3">
                <button
                    type="button"
                    onClick={() => setSustainabilityOpen(o => !o)}
                    className="flex w-full items-center justify-between text-left"
                >
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Sustainability</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Prioritize certifications when matching products.</p>
                    </div>
                    {sustainabilityOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {sustainabilityOpen && (
                    <div className="space-y-2 pt-1">
                        <CheckRow
                            label="Greenguard Gold certified"
                            checked={prefs.greenguardGold}
                            onChange={v => update('greenguardGold', v)}
                        />
                        <CheckRow
                            label="LEED v4 compliant materials"
                            checked={prefs.leedCompliant}
                            onChange={v => update('leedCompliant', v)}
                        />
                        <CheckRow
                            label="FSC certified wood"
                            checked={prefs.fscCertifiedWood}
                            onChange={v => update('fscCertifiedWood', v)}
                        />
                        <div className="space-y-2 pt-1">
                            <CheckRow
                                label="Minimum recycled content"
                                checked={prefs.recycledContentEnabled}
                                onChange={v => update('recycledContentEnabled', v)}
                            />
                            {prefs.recycledContentEnabled && (
                                <div className="pl-6">
                                    <label className="block text-xs text-muted-foreground mb-1">
                                        Minimum recycled content · <span className="text-foreground font-bold">{prefs.recycledContentMin}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={prefs.recycledContentMin}
                                        onChange={e => update('recycledContentMin', Number(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* SECTION 5 · Custom Rules · AI builder */}
            <section className="space-y-3">
                <SectionHeader
                    title="Custom Rules"
                    description="Complex conditions Strata enforces automatically (built with AI assistance)."
                />
                {prefs.customRules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                        <p className="text-xs text-muted-foreground">No custom rules yet.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {prefs.customRules.map((rule: CustomRule) => (
                            <li key={rule.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveCustomRule(rule.id)}
                                    aria-label={`Remove rule ${rule.name}`}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <button
                    type="button"
                    onClick={onAddCustomRule}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:brightness-110"
                >
                    <Sparkles className="h-4 w-4" />
                    <Plus className="h-3.5 w-3.5" />
                    Add custom rule with AI
                </button>
            </section>
        </div>
    )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
    )
}

interface ToggleRowProps {
    label: string
    description?: string
    checked: boolean
    onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <Switch
                checked={checked}
                onChange={onChange}
                className={cn(
                    'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors',
                    checked ? 'bg-primary' : 'bg-muted'
                )}
            >
                <span className="sr-only">{label}</span>
                <span
                    className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow transition-transform',
                        checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    )}
                />
            </Switch>
        </div>
    )
}

interface CheckRowProps {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
}

function CheckRow({ label, checked, onChange }: CheckRowProps) {
    return (
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                )}
                aria-pressed={checked}
            >
                {checked && <Check className="h-3 w-3" />}
            </button>
            {label}
        </label>
    )
}
