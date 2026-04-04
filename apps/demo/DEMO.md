# MediChainLK — Client Presentation Demo

> **Live URL (dev):** http://localhost:3010
> **Start:** `cd apps/demo && npm run dev`

This is a self-contained Next.js application built specifically for the MediChainLK client proposal presentation. It simulates the full platform across all three user roles using realistic Sri Lankan mock data. No backend or database is required — all state is stored in the browser's `localStorage`.

---

## Quick Start

```bash
# From the monorepo root
cd apps/demo
npm run dev        # → http://localhost:3010

# Or from the monorepo root
npm run dev --workspace=apps/demo
```

---

## How the Demo Works

### Role Switcher
The sidebar has three role buttons. Clicking them instantly changes the entire UI — navigation items, dashboards, and features all update to reflect what that user type sees.

| Role | Represents | What they see |
|------|-----------|---------------|
| **System Admin** | MediChainLK platform operator | All pharmacies, all users, platform analytics, system health |
| **Pharmacy Staff** | Pharmacist / counter staff | Prescriptions, inventory, orders, billing for their pharmacy |
| **Customer** | Patient using the mobile app | Mobile app simulation — upload Rx, track orders, view history |

### State Persistence
All interactions survive a page refresh. Zustand's `persist` middleware writes state to `localStorage` under the key `medichainlk-demo`. This means:
- Prescription approvals/rejections persist
- Stock adjustments persist
- Order status advances persist
- Theme and notification read-state persist

Click **Reset Demo** (top-right header) to clear all state and start fresh.

---

## Pages

### `/` — Landing Page
Animated splash screen shown before the demo starts.
- Full-screen dark gradient with MediChainLK branding
- Feature pills: OCR Prescription Reading · Multi-Tenant Architecture · Real-time Delivery Tracking
- Progress bar that auto-redirects to Dashboard in 2 seconds
- "Enter Demo →" button for manual navigation

---

### `/demo/dashboard` — Dashboard *(All roles)*
Role-aware dashboard — three completely different views depending on the active role.

**System Admin view:**
- KPI cards: Active Pharmacies, Total Orders, Platform Revenue (LKR), Registered Users
- Revenue AreaChart (Oct 2025 – Mar 2026)
- Pharmacy Performance — horizontal bar comparison across all 4 pharmacies
- Quick Actions row: Add Pharmacy, Export Report, View Logs, System Settings
- Recent Activity feed with timestamped events

**Pharmacy Staff view:**
- Urgent Actions amber banner when prescriptions are pending review
- KPI cards: Prescriptions to Review, Orders Today, Revenue Today, Low Stock Alerts
- Today's Performance mini-metrics: Avg Fill Time (8 min), Customer Satisfaction (4.8★), AI Accuracy (94%)
- Orders BarChart (Mon–Sun)
- Live Prescription Queue with confidence tier indicators

**Customer view:**
- KPI cards: Active Orders, Prescriptions This Month, Total Spent
- Current Order stepper with live pulse indicator
- Recent Prescriptions list with status badges
- Quick Reorder section (most frequent medicines)

---

### `/demo/analytics` — Analytics & Reports *(Admin / Staff)*
Platform-wide reporting dashboard.
- KPI cards: Total Revenue (LKR 1.02M), Total Orders (314), Avg Order Value (LKR 3,248), AI Accuracy (94.2%)
- Revenue Trend — large AreaChart across 6 months with gradient fill
- Order Volume — horizontal bar chart (monthly)
- Order Categories — breakdown with progress bars: Chronic Medications (45%), Acute/Short-term (30%), OTC (25%)
- Platform Health Summary — gradient banner: Uptime 99.98%, API Response 124ms, AI Pipeline 1.8s avg, 1,247 prescriptions processed
- Export Report button (visual)

---

### `/demo/prescriptions` — Prescription Review Queue *(Pharmacy Staff)*
Split-panel layout demonstrating the AI-assisted prescription review workflow.

**Left panel — Queue:**
- Pending prescriptions with patient name, medicine count, upload time
- Color-coded Confidence Badge (HIGH / MEDIUM / LOW) with percentage
- Animated amber pulse dot on sidebar nav item when prescriptions are pending
- Reviewed prescriptions shown in a "Reviewed Today" section with status

**Right panel — Review:**
- Mock prescription image rendered as a styled doctor's letterhead (font-mono)
- AI-Extracted Medicines table — each drug shows matched/unmatched status against the formulary
- Green border = matched to formulary, Amber border = unmatched (needs pharmacist check)
- Pharmacist notes textarea
- **Approve** (green) and **Reject** (red) buttons — decision is persisted to localStorage

**Demo tip:** Click a prescription in the queue, then approve or reject it. The sidebar badge count decreases and the prescription moves to "Reviewed Today".

---

### `/demo/ai-pipeline` — AI Pipeline Demo *(Staff / Admin)*
Animated visualisation of the AI prescription processing pipeline. The centrepiece feature for the technical presentation.

**7 pipeline steps:**
1. **S3 Upload** — Prescription image uploaded with KMS encryption
2. **Preprocessing** — OpenCV deskew, denoise, contrast normalisation
3. **OCR Extraction** — Google Cloud Vision API, bounding-box confidence
4. **NLP / Med7** — Med7 spaCy model extracts drug names, dosages, frequencies, durations
5. **Formulary Match** — rapidfuzz fuzzy-matching against pharmacy database (≥ 85% threshold)
6. **Confidence Score** — Per-field aggregation: HIGH ≥ 0.90, MEDIUM 0.70–0.90, LOW < 0.70
7. **Result** — Auto-approved / pharmacist review queue / rejected

**How to present:**
1. Click **Run Pipeline** — steps animate sequentially with live progress bars
2. Raw OCR text appears in the right panel as processing begins
3. After NLP step: extracted medicines cards appear with match status
4. After Confidence step: score gauge reveals the confidence tier
5. Final outcome card shows the routing decision
6. Click **Reset** to run again

---

### `/demo/inventory` — Inventory Management *(Pharmacy Staff)*
Real-time stock level management.
- Low-stock warning banner (amber) lists items below reorder threshold
- Stock progress bars (green = ok, amber = low, red = critical)
- High-alert medicines highlighted: Insulin Glargine (18 vials), Warfarin 5mg (12 tablets)
- **– 10** and **+ 50** buttons adjust stock — changes persist across page refreshes
- Expiry dates, reorder levels, and unit prices displayed

**Mock inventory (8 items):**

| Medicine | Stock | Status |
|----------|-------|--------|
| Paracetamol 500mg | 1,240 tablets | OK |
| Amoxicillin 500mg | 85 capsules | Low |
| Metformin 500mg | 620 tablets | OK |
| Omeprazole 20mg | 45 capsules | Low |
| Atorvastatin 20mg | 310 tablets | OK |
| Insulin Glargine | 18 vials | **Critical** |
| Salbutamol Inhaler | 24 inhalers | OK |
| Warfarin 5mg | 12 tablets | **Critical** |

---

### `/demo/orders` — Order Management *(Pharmacy Staff)*
Today's order queue with status progression simulation.
- Summary cards: Total Orders, In Progress, Delivered
- Order table: ID, Patient, Status, Delivery Provider, Total (LKR), Time
- **Advance** button progresses each order through the status flow:
  `PRESCRIPTION_CONFIRMED → PREPARING → READY_FOR_PICKUP → DISPATCHED → DELIVERED`
- Delivered orders dim to 60% opacity

**Mock orders (5):**
- ORD001 — Sithum Fernando — LKR 2,840 — PickMe Flash — DISPATCHED
- ORD002 — Dilani Jayawardena — LKR 1,650 — Grasshoppers — PREPARING
- ORD003 — Ruwan Silva — LKR 980 — No delivery — PRESCRIPTION_CONFIRMED
- ORD004 — Malini Perera — LKR 3,200 — PickMe Flash — DELIVERED
- ORD005 — Kasun Bandara — LKR 750 — Grasshoppers — DELIVERED

---

### `/demo/billing` — Billing & Invoices *(Pharmacy Staff)*
Financial summary and invoice management.
- Summary cards: Today's Revenue (auto-calculated from paid invoices), Pending Payments, Completed Transactions
- Invoice table with hover-reveal **View** button
- Paid / Pending status badges with color-coded dots
- Total collected footer
- Export button (visual)

**Mock invoices (6):**
- INV-2026-0041 — Sithum Fernando — LKR 2,840 — **Paid**
- INV-2026-0040 — Dilani Jayawardena — LKR 1,650 — **Paid**
- INV-2026-0039 — Ruwan Silva — LKR 980 — **Pending**
- INV-2026-0038 — Malini Perera — LKR 3,200 — **Paid**
- INV-2026-0037 — Kasun Bandara — LKR 750 — **Paid**
- INV-2026-0036 — Priya Navaratnam — LKR 1,120 — **Pending**

---

### `/demo/pharmacies` — Pharmacy Tenants *(System Admin)*
Multi-tenant pharmacy management view.
- Card grid showing all registered pharmacies
- Each card: name, city, license number, orders count, revenue, active/inactive status
- Active pharmacies show View Details and Manage Users actions
- Demonstrates the multi-tenant architecture (each pharmacy is an isolated tenant)

**Mock pharmacies (4):**

| Pharmacy | City | Status | Revenue |
|----------|------|--------|---------|
| Colombo Central Pharmacy | Colombo | Active | LKR 487,200 |
| Kandy MediPlus | Kandy | Active | LKR 312,500 |
| Galle HealthCare Pharma | Galle | Active | LKR 218,900 |
| Jaffna City Pharmacy | Jaffna | Inactive | — |

---

### `/demo/users` — User Management *(System Admin)*
Platform-wide user registry.
- Table with avatar initials, name, role badge, pharmacy assignment, phone, join date
- Role color coding: purple = pharmacy_owner, blue = pharmacy_staff, green = customer
- Invite User button (visual)
- Manage link per user

**Mock users (5):** Dr. Kavinda Perera (owner), Nimal Rajapaksa (staff), Amara Wickramasinghe (staff), Sithum Fernando (customer), Dilani Jayawardena (customer)

---

### `/demo/customer` — Customer Mobile App *(All roles)*
Simulated mobile phone frame showing the customer-facing React Native app experience.

**Upload Rx tab:**
1. Click camera area or "Choose from Gallery" to trigger upload
2. Preview screen shows the mock prescription + delivery quote selection
   - PickMe Flash: LKR 280, 25 min ETA
   - Grasshoppers: LKR 195, 120 min ETA
   - Direct Delivery: LKR 150, 45 min (unavailable)
3. Confirm → processing animation (AI pipeline spinner)
4. Success screen with order summary → navigate to Track Order

**Track Order tab:**
- Toggle between two tracked orders
- Visual stepper: Rx Confirmed → Preparing → Ready for Pickup → Dispatched → Delivered
- Active step shows pulse animation
- Delivery address, provider, ETA shown
- **Simulate Next Step** button advances the order status (linked to the same store as the Orders page)

**History tab:**
- All 5 orders listed with status badges and totals
- Star rating (5★) on delivered orders
- Reorder shortcut link
- Saved payment method display (PayHere, Visa ••••4242)

---

## Shell Features (always visible)

### Sidebar
- **MediChainLK logo** — gradient blue-to-indigo
- **View as** — role switcher (System Admin / Pharmacy Staff / Customer)
- **Navigation** — filtered by role; active item has a blue accent bar on left edge
- **Prescriptions nav badge** — animated amber pulse dot showing pending count
- **Platform Status** — API / AI Service / Database all showing Online with green pulse dots
- **Demo Mode indicator** — confirms localStorage persistence mode

### Header Bar
- **Role badge** — current role with color (purple/blue/green)
- **Pharmacy name** — Colombo Central Pharmacy
- **Reset Demo** — clears `localStorage` key `medichainlk-demo` and reloads
- **Theme toggle** ☀/🌙 — switches Light/Dark mode, persisted
- **Notifications bell** 🔔 — red badge (count 5 when unread)
  - Rx confidence LOW alert
  - Warfarin critically low stock
  - New order notification
  - Delivery completion
  - System sync confirmation
  - "Mark all read" clears the badge

---

## Dark Mode

Click the moon icon in the header to switch to dark mode. The entire UI transitions:
- Sidebar: `#0a0f1e`
- Body background: `#0f1629`
- Cards: `#1a2236`
- Borders: `#1e293b`
- Notification dropdown, charts, and all components adapt

Dark mode preference is persisted to localStorage.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 with `persist` middleware |
| Charts | Recharts (AreaChart, BarChart) |
| Icons | Lucide React |
| Persistence | Browser localStorage |

**No backend required.** No API calls, no database, no environment variables needed.

---

## File Structure

```
apps/demo/src/
├── app/
│   ├── page.tsx                    # Landing / splash page
│   ├── layout.tsx                  # Root HTML layout
│   └── demo/
│       ├── layout.tsx              # Wraps all pages in DemoShell
│       ├── dashboard/page.tsx      # Role-aware dashboard (3 views)
│       ├── analytics/page.tsx      # Platform analytics & charts
│       ├── prescriptions/page.tsx  # Prescription review queue
│       ├── ai-pipeline/page.tsx    # Animated AI pipeline demo
│       ├── inventory/page.tsx      # Stock management
│       ├── orders/page.tsx         # Order queue & status
│       ├── billing/page.tsx        # Invoices & payments
│       ├── pharmacies/page.tsx     # Pharmacy tenant management
│       ├── users/page.tsx          # User management
│       └── customer/page.tsx       # Mobile app simulation
├── components/
│   ├── layout/DemoShell.tsx        # Sidebar + header + role switcher
│   └── ui/
│       ├── Badge.tsx               # StatusBadge, ConfidenceBadge, Badge
│       ├── PageHeader.tsx          # Page title + subtitle + action slot
│       └── StatCard.tsx            # KPI metric card with trend indicator
├── store/
│   └── demo-store.ts               # Zustand store + mock notifications
└── lib/
    ├── mock-data.ts                # All seed data arrays
    └── utils.ts                    # cn(), formatCurrency(), formatDate()
```

---

## Presenting Tips

1. **Start as Pharmacy Staff** (default) — most features are visible here
2. **Run AI Pipeline first** — it's the most impressive feature; click Run Pipeline and walk through each step
3. **Approve a prescription** then switch to Orders to show the end-to-end flow
4. **Toggle to System Admin** to show the multi-tenant / SaaS nature of the platform
5. **Show Customer App last** — the phone frame makes it clear this is a mobile-first patient experience
6. **Toggle Dark Mode** — shows attention to UI polish
7. **Click Advance on an order** while on the Customer Track tab to show real-time status sync
8. **Reset Demo** before handing the laptop to someone for self-exploration
