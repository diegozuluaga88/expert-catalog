// F50 · Wave 4 · v2 · SampleRequestModal (Slide-over de 3 pasos).
//
// Modal para solicitar una muestra física (swatch) al fabricante. Es el
// primer flujo transactional del prototipo · reemplaza el dead-end actual
// donde solo existía una policy flag pero no había UI.
//
// Los 3 pasos son:
//   1. Confirmar el material solicitado (precargado desde la tarjeta que
//      disparó el modal · thumbnail + brand + name + swatch).
//   2. Confirmar la dirección de envío (autofilled desde el tenant activo,
//      editable si el usuario necesita cambiar el destino).
//   3. Confirmar y enviar · el envío persiste localmente vía useSampleRequests
//      (cuando exista backend, delegar el POST allí).
//
// Skills · Norman Constraints (solo aparece para materiales · no productos)
// + Nielsen H2 (lenguaje del mundo real en labels) + Microinteractions
// (feedback multi-etapa con progress dots).
//
// Usa átomos del design system: SlideOver / SlideOverHeader / SlideOverBody /
// SlideOverTitle · Input · Button · Field · Label.

import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Truck } from 'lucide-react'
import {
    SlideOver,
    SlideOverHeader,
    SlideOverTitle,
    SlideOverBody,
    Input,
    Button,
    Field,
    Label,
} from 'strata-design-system'
import type { Product } from '../types'
import { useTenant } from '../../TenantContext'
import { getTenantMetadata } from '../../quote/tenantData'
import { useSampleRequests, type SampleRequestShipTo } from '../browse/useSampleRequests'

interface SampleRequestModalProps {
    open: boolean
    onClose: () => void
    /** Producto material desde el que se disparó la solicitud. */
    product: Product | null
    /** Callback opcional post-envío exitoso (para toast en el padre). */
    onSubmitted?: (referenceProductName: string) => void
}

type Step = 1 | 2 | 3

export default function SampleRequestModal({ open, onClose, product, onSubmitted }: SampleRequestModalProps) {
    const { currentTenant } = useTenant()
    const tenant = getTenantMetadata(currentTenant)
    const { createRequest } = useSampleRequests()

    const [step, setStep] = useState<Step>(1)
    const [shipTo, setShipTo] = useState<SampleRequestShipTo>(() => tenant.billingAddress)

    // Reset del wizard al abrir/cerrar y al cambiar de producto
    useEffect(() => {
        if (open) {
            setStep(1)
            setShipTo(tenant.billingAddress)
        }
    }, [open, tenant.billingAddress, product?.id])

    if (!product) return null

    const firstColor = product.colorways?.[0]
    const canSubmit = shipTo.line1.trim() && shipTo.city.trim() && shipTo.state.trim() && shipTo.zip.trim()

    const handleSubmit = () => {
        createRequest({
            productId: product.id,
            productName: product.name,
            productBrand: product.brand,
            productImage: product.images[0],
            colorwayName: firstColor?.name,
            colorwayHex: firstColor?.hex,
            shipTo,
        })
        onSubmitted?.(product.name)
        onClose()
    }

    return (
        <SlideOver open={open} onClose={onClose}>
            <SlideOverHeader onClose={onClose}>
                <SlideOverTitle>Request a swatch</SlideOverTitle>
                <StepDots current={step} />
            </SlideOverHeader>

            <SlideOverBody>
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Step 1 · Confirm material
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                A physical swatch of this material will be sent to your dealer address.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                                <p className="mt-0.5 truncate text-base font-bold text-foreground">{product.name}</p>
                                {firstColor && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        {firstColor.hex && (
                                            <span
                                                className="inline-block h-4 w-4 rounded-sm border border-border"
                                                style={{ backgroundColor: firstColor.hex }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span>{firstColor.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-[12px] text-muted-foreground">
                            Only one swatch per request. Need multiple colors? Submit them one at a time.
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Step 2 · Confirm shipping address
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Autofilled from <span className="font-semibold text-foreground">{tenant.name}</span>. Edit if you want the swatch delivered elsewhere.
                            </p>
                        </div>

                        <Field>
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Street address
                            </Label>
                            <Input
                                value={shipTo.line1}
                                onChange={(e) => setShipTo({ ...shipTo, line1: e.target.value })}
                                placeholder="450 Industrial Park Rd"
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    City
                                </Label>
                                <Input
                                    value={shipTo.city}
                                    onChange={(e) => setShipTo({ ...shipTo, city: e.target.value })}
                                />
                            </Field>
                            <Field>
                                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    State
                                </Label>
                                <Input
                                    value={shipTo.state}
                                    onChange={(e) => setShipTo({ ...shipTo, state: e.target.value })}
                                    maxLength={2}
                                />
                            </Field>
                        </div>
                        <Field>
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                ZIP code
                            </Label>
                            <Input
                                value={shipTo.zip}
                                onChange={(e) => setShipTo({ ...shipTo, zip: e.target.value })}
                                inputMode="numeric"
                            />
                        </Field>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Step 3 · Review and submit
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The request is sent directly to <span className="font-semibold text-foreground">{product.brand}</span>. You will be notified when the swatch is shipped and when it is delivered.
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                            <div className="flex items-center gap-3 border-b border-border pb-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                                    <p className="mt-0.5 truncate text-sm font-bold text-foreground">{product.name}</p>
                                    {firstColor && (
                                        <p className="text-[11px] text-muted-foreground">{firstColor.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Truck className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ships to</p>
                                    <p className="text-foreground">{shipTo.line1}</p>
                                    <p className="text-foreground">{shipTo.city}, {shipTo.state} {shipTo.zip}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </SlideOverBody>

            {/* Footer con navegación entre pasos · sticky bottom */}
            <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between gap-2">
                {step > 1 ? (
                    <Button
                        variant="outline"
                        onClick={() => setStep((s) => (s - 1) as Step)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                ) : (
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                )}

                {step < 3 ? (
                    <Button
                        onClick={() => setStep((s) => (s + 1) as Step)}
                        disabled={step === 2 && !canSubmit}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        <Check className="h-4 w-4" />
                        Submit request
                    </Button>
                )}
            </div>
        </SlideOver>
    )
}

function StepDots({ current }: { current: Step }) {
    return (
        <div className="mt-2 flex items-center gap-1.5" aria-label={`Step ${current} of 3`}>
            {[1, 2, 3].map((n) => (
                <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all ${
                        n === current
                            ? 'w-6 bg-primary'
                            : n < current
                                ? 'w-1.5 bg-primary/60'
                                : 'w-1.5 bg-muted'
                    }`}
                />
            ))}
        </div>
    )
}
