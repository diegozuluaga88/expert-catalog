// MRL Fase 5 (2026-07-09) · MRLSidebarAds · stack de 3 promo cards para
// el aside derecho del MRL en shelf mode. Contenido mock hardcoded ·
// nombres inventados y copy genérico · zero brands reales para evitar
// cualquier issue de branding (decisión Diego).
//
// Los 3 slots replican la variedad del referente (myresourcelibrary.com):
// 1. Event/campaign · imagen + eyebrow date + CTA
// 2. Product-hero · foto de mueble/scene + tagline + CTA
// 3. House self-promo · fondo lime · CTA "advertise here" tipo

import MRLPromoCard from './MRLPromoCard'

export default function MRLSidebarAds() {
  return (
    <div className="flex flex-col gap-3">
      {/* Slot 1 · Event / campaign */}
      <MRLPromoCard
        variant="event"
        eyebrow="Sep 20-22 · Chicago"
        title="Delve Series · Workplace"
        description="An invite-only field trip to the year's most talked-about workspace installations. Three days · full agenda covered."
        ctaLabel="Learn more"
        imageUrl="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"
        imageAlt="Workspace installation featured at the Delve Series field trip"
      />

      {/* Slot 2 · Product-hero · verticalBrand replica el efecto "VERSTEEL"
          del referente (logo grande vertical del brand como columna decorativa). */}
      <MRLPromoCard
        variant="product"
        eyebrow="New from Merida"
        title="Merida Flex · Sit-Stand"
        description="Space-saver benching with straight-on nesting. Priced to sell · in stock for Q4 projects."
        ctaLabel="Explore"
        imageUrl="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80"
        imageAlt="Merida Flex sit-stand benching desk in a modern office"
        verticalBrand="MERIDA"
      />

      {/* Slot 3 · House self-promo (lime) */}
      <MRLPromoCard
        variant="house"
        eyebrow="Advertise here"
        title="96k+ A&D professionals visit MRL every month."
        description="Get your brand in front of the specifiers who spec you. Reach out and we'll walk you through the options."
        ctaLabel="Tell me more"
      />
    </div>
  )
}
