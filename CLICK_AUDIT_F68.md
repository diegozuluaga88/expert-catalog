# F68 · Click Audit · 3-to-5-click sitewide compliance

**Ref:** MRL Rewrite PRD · Section 04 · Cross-cutting principles.

> "Any activity in the library — start to finish — should take **3 to 5
> clicks**. Measurable, testable, sitewide (not a single-module fix)."
> — Laura, discovery session

Snapshot post-F67. Verifica cada flow crítico contra el rule del PRD.
Marca 🟢 ≤5 clicks · 🟡 6-7 · 🔴 8+.

---

## Metodología

- **Click count** · cada interacción que requiere el user hacer un
  physical click/tap. Scroll no cuenta. Type en input inline no cuenta
  (es continuous input, no discrete action).
- **Start** · el user está logueado + landing page default (OCR Tracking).
- **End** · la acción terminó (form submitted · item added · etc).
- **Alternative paths** documentados cuando existen.

---

## Flows auditados

### 1. Sample request end-to-end (finishes only) · 🟢 4 clicks

PRD Section 05 · "user counted roughly 8 clicks to complete one request"
en el MRL legacy. Actual state:

1. Click **Catalog** en top nav → landing en Library (default browse mode)
2. Click brand card (ej. Camira)
3. Click product card en la brand page
4. Click **Request sample** overlay del hero de la card

Total: **4** ✅

Alternative (from ProductDetailPage): +1 click porque el "Request sample"
CTA vive en el detail. Sigue en 5 · borderline OK.

---

### 2. Add product to Selection (Products tab) · 🟢 2 clicks

1. Click product card **"+ Add"** button
2. ProductDetailPanel opens · click **Add to selection** dentro

Total: **2** ✅

---

### 3. Filter brand + category + open product · 🟢 3 clicks

1. Click brand checkbox en sidebar
2. Click category checkbox en sidebar
3. Click product card en grid filtrado

Total: **3** ✅

---

### 4. Create custom Binder + add first product · 🟡 6 clicks (path via sidebar)

**Long path** · via sidebar NEW BINDER button:

1. Click **NEW BINDER** en sidebar (bajo BINDERS section)
2. Prompt aparece · type name (sin click · continuous input)
3. Click **Create binder** confirm en el prompt
4. Grid shows · click **♥ heart** en cualquier product card
5. AddToCollectionModal aparece · check el nuevo binder
6. Click **Done/Save** del modal

Total: **6** 🟡 · exceeds 5

**Short path** · via product card heart (RECOMMENDED en UX):

1. Click **♥ heart** en cualquier product card
2. AddToCollectionModal aparece · click **+ New binder** inline
3. Type name (continuous) · click **Create**
4. Modal auto-checks new binder · click **Done/Save**

Total: **4** ✅

**Recomendación:** el path via sidebar es redundante · agregar un hint
o tip mostrando que el path via heart es más corto. O eliminar el
NEW BINDER del sidebar (usar solo el heart flow).

---

### 5. Update dealer notes (Manufacturers · F58c) · 🟢 4 clicks

1. Click **My Setup** CTA en Products tab (o el ManageSetupPanel del MRL)
2. Click tab **Manufacturers**
3. Click **✏️ pencil** en el card del manufacturer target
4. Type notes (continuous) · click **Save notes**

Total: **4** ✅

---

### 6. Open brand profile · view resources · 🟢 2 clicks

1. Click **info icon** al lado del brand row en sidebar
2. Scroll (no cuenta) · click resource link · abre external

Total: **2** ✅

---

### 7. Filter by brand + category via BrandProfileSlideOver (F60) · 🟢 4 clicks

1. Click **info icon** del brand en sidebar
2. Click category card 1 (multi-select toggle)
3. Click category card 2
4. Click **Apply · N categories** en footer

Total: **4** ✅ · reduce fricción vs el sidebar path (que requiere
click-por-checkbox de brand + cada category = potencialmente 5+)

---

### 8. Shelf view · drill-in a brand (F61.1) · 🟢 3 clicks

1. Toggle **Shelf view** en header
2. Click binder en shelf → auto-switch a grid + filter brand
3. Click product card en el grid filtrado

Total: **3** ✅

---

### 9. Configure buying preferences (activate pricing rule) · 🟢 4 clicks

1. Click **My Setup** CTA
2. Click tab **Buying preferences**
3. Toggle **Contract pricing** switch
4. Edit `%` inline (continuous · autoselect) · close modal

Total: **3-4** ✅ · el close counts si el user cierra manual · sino
esperar auto-close · es 3.

---

### 10. Add manufacturer relationship (F58c) · 🟢 4 clicks

1. Click **My Setup** CTA
2. Click tab **Manufacturers**
3. Click **+ Add manufacturer** button
4. Fill form (continuous) · click **Add manufacturer** submit

Total: **4** ✅

---

### 11. View as manufacturer · insights dashboard (F67) · 🟢 2 clicks

1. Click **avatar** en top-right
2. Click **View as manufacturer** en dropdown

Total: **2** ✅

---

### 12. Toggle Products/Materials/Inspiration · 🟢 2 clicks

1. Click tab del taxonomy pill top-left del content

Total: **1-2** ✅

---

### 13. Compare products (bulk) · 🟢 3-4 clicks

1. Hover card · click **checkbox** overlay (repeat per product)
2. BulkActionsBar aparece · click **Compare**

Total: **3-4** ✅ (2 productos = 3 clicks; 3 productos = 4 clicks)

---

### 14. Submit selection · 🟢 3 clicks

1. Click tab **My Selection** en top nav
2. Fill buyer info (continuous) · verify draft
3. Click **Submit selection** al fondo

Total: **3** ✅

---

## Resumen · 14 flows auditados

| Status | Count | Flows |
|---|---|---|
| 🟢 Compliant (≤5) | 13 | 1 · 2 · 3 · 5 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 |
| 🟡 Borderline (6-7) | 1 | 4 (long path via sidebar) |
| 🔴 Excess (8+) | 0 | — |

**Coverage:** 93% de flows críticos dentro del 3-5 click rule.

**Único gap:** flow #4 · path largo para crear binder + agregar producto.
El path corto (heart → modal → inline create) sí está en budget (4 clicks).

---

## Recomendaciones de optimización

### 4a · Long path del NEW BINDER · UX improvement

Al hacer click en **NEW BINDER** del sidebar y crear el binder,
actualmente el user queda mirando el sidebar sin acción next. Add
un toast o tip:
> "New binder created · click the ♥ on any product to add it to
> **{binder name}**."

Alternativa más agresiva: auto-abrir un pequeño hint arrow al ♥ del
primer product visible del grid post-creation.

**Impact:** reduce fricción cognitiva sin cambiar el flow (sigue
6 clicks pero el user sabe qué hacer next · zero abandonment).

### Sample request from ProductDetailPage · 5 clicks borderline

El alternative path (open detail → request sample) suma 5 clicks
(exactly en el límite). No optimization urgent · pero si Laura
menciona el sample flow again como slow, considerar mover el
"Request sample" CTA a un position más prominente en el hover
overlay de la card (elimina el detail-page step).

---

## Non-goals de este audit

- **Auth flows** (login · SSO · password reset) · scope Strata core,
  no MRL PRD specific.
- **Legacy V1 pages** (CatalogPage V1 · ManageCatalogs V1) · Non-goal
  del F58+ (V1 intocada).
- **Admin/back-office** · Held per Team 2-Week Plan (Diego no arranca
  hasta que Jeff/Laura respondan discovery questions).

---

## Verification post-F68

Ninguna change de código en este sprint · solo audit doc. El
compliance del 3-5 click rule está en 93%. Si aparecen nuevas
flows > 5 clicks en future sprints, agregar entry a este doc y
flag para optimization.

**Suggested next sprint** · F69 · aplicar optimization del flow #4
(tip post-creation) · scope pequeño · valor UX claro.
