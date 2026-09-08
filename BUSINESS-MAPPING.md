# BUSINESS MAPPING & REQUIREMENTS
## As-Is → To-Be: Every Flow, Every Pain, Every Solution
### Version 2.0 — corrected against the real business (warehouse ERP + paper order pads)

> **The key fact this document is built on:**
> The warehouse ALREADY runs a complete desktop ERP ("Distribution Management
> System" — see photo). It works, but only at ONE computer, used by ONE main
> person. Everything around it — order taking, recovery, salesman dealings —
> runs on PAPER.
>
> **Our job:** rebuild the ERP modern (cloud, multi-user, mobile), keep its
> proven logic, kill every paper, and make the tax, salesman, and recovery
> flows automatic.

---

# 1. THE CAST (people in the business)

| Role | What they do today |
|---|---|
| **Owner/Main Person** | The only one with real access to the desktop ERP. Types all orders, generates all invoices, controls everything |
| **Bookers** | One per area. Carry pre-printed order pads to medical stores, bring filled pads to warehouse, then collect payments (recovery) from each store |
| **Medical Stores** | Fill quantities on the booker's pad. Refuse to pay the newly imposed Malakand tax |
| **Salesmen (independent sellers)** | Have their own customers. Buy stock from the distribution (the invoice is theirs, they pay), earn their OWN percentage set by themselves — not paid by the distribution. Stores can order "on behalf of" a salesman |
| **Accountant/Accounts side** | Vouchers, ledgers, cash book — currently in the desktop ERP |
| **Warehouse staff** | Receive goods (batch + expiry), pick and dispatch orders |
| **Manufacturing Companies** | GSK, Abbott, Getz... Some ABSORB the new tax for the stores; strict ones (GSK) refuse — stores pay tax on their items |

---

# 2. FLOW A — ORDER TO DELIVERY (the paper pad flow)

## 2.1 As-Is (today)

```
1. Booker visits shops in his area carrying PRE-PRINTED ORDER PADS:
   - grouped by company, every medicine with its UNIQUE ID
   - BLANK quantity column → the MEDICAL STORE writes the quantities
2. End of day: bookers bring pads to the warehouse
3. Pads pile up → THE ONE PERSON types each order into the desktop ERP
4. ERP generates invoice(s) → order picked → delivered
5. Paper pads filed away somewhere
```

## 2.2 Pains

| # | Pain | Cost to business |
|---|---|---|
| A1 | Bottleneck: many bookers' pads → one man, one keyboard | Orders processed a day late; chaos when pads pile up ("many invoices" confusion) |
| A2 | Re-typing errors: wrong product/qty entered from handwriting | Wrong goods delivered, returns, disputes |
| A3 | No stock check when the store writes the order | Store orders what's already out of stock → short deliveries, extra trips |
| A4 | No credit-limit check at order time | Goods delivered to shops already maxed out → bad debt |
| A5 | Booker is blind in the field | Can't tell the shop their balance, last prices, or schemes |
| A6 | The pad is also the only record | Lost pad = lost order, no trace |

## 2.3 To-Be (the fix)

```
1. Booker opens MOBILE APP at the shop → picks the shop → sees the same
   company-wise catalog with the same unique IDs → enters quantities
   (the store can dictate, exactly like the pad — just digital)
2. App checks LIVE (or last-known) stock + the shop's credit balance
   → warns or blocks instantly if the order crosses the credit limit
3. Order saved on the phone (works with NO internet), auto-sends when
   signal returns
4. Warehouse sees a digital ORDER QUEUE: each order tagged with booker,
   area, shop, status (RECEIVED → INVOICED → PICKED → DELIVERED → PAID)
5. Invoice generation = one click (or auto) — no re-typing, no pile-up
6. Pick list printed/shown with FEFO batches already chosen
```

**Killed papers:** order pad, re-typing, the pile-up at the main person's desk.
**The main person is no longer a bottleneck — he approves and oversees.**

---

# 3. FLOW B — MONEY RECOVERY (booker as collector)

## 3.1 As-Is

- Booker's second job: collect payment from each store.
- Recoveries recorded by hand / memory / later typed into ERP.
- Shop ledgers argued about; owner sees receivables late.

## 3.2 To-Be

- Booker records the recovery **in the app at the shop**: amount, mode (cash/bank).
- Customer ledger updates instantly; receipt (printed or SMS/WhatsApp later) generated.
- **Credit shield everywhere:** after a recovery, the shop's available credit
  updates for the next order automatically.
- Owner's dashboard: today's recoveries per booker, overdue shops, area-wise recovery rate.
- DSR (Daily Sales Report) per booker generates itself: orders, deliveries, returns, recovery.

**Killed papers:** recovery register, hand-written DSR.

---

# 4. FLOW C — THE SALESMAN CHANNEL (independent sellers)

## 4.1 The business rule (as told — confirm the pricing question, Q2 below)

- A salesman has HIS OWN customers and sells in his own territory.
- He buys stock from the distribution → **the invoice is billed TO HIM; HE
  pays the distribution** → he then sells to stores at his own price.
- His percentage/margin is **his own decision** — the distribution does not
  pay him commission.
- A medical store can place an order **"on behalf of" a salesman** — meaning
  the supply route goes through him: **distribution bills the salesman,
  delivers (to the store or to him), and collects from HIM.**

## 4.2 As-Is pains

- Salesman dealings tracked by hand: what he bought, what he owes.
- "On behalf of" orders blur who the real debtor is → disputes.
- No visibility of his sales, so no trust and no growth planning.

## 4.3 To-Be

- **Salesman = a customer account with special powers:**
  - own ledger (receivable, payments, credit limit)
  - own price handling ❓ (see Q2)
  - linked list of his stores
- **Order routing flag:** every order carries `via: SALESMAN_X` or `DIRECT`.
  - `via SALESMAN_X` → invoice billed to salesman X; delivery to store or to
    him (drop-ship); recovery tracked against HIM.
  - `DIRECT` → normal booker flow, billed to the store.
- Reports: salesman-wise sales, outstanding, recovery → the distribution sees
  the whole channel and can grow the good salesmen.

---

# 5. FLOW D — THE DYNAMIC TAX ENGINE (the heart of the invoice)

## 5.1 The real story

- Tax was **recently and officially imposed** on Malakand Division.
- **Medical stores protest — they refuse to pay it.**
- To keep selling, some pharma companies **absorb the tax on the stores'
  behalf** (for now — "for some months").
- Strict companies (**GSK**) refuse: on their items, **the store pays the tax.**
- One invoice mixes items from many companies → mixed tax treatment per line.
- **Old software: taxes EVERYTHING → staff manually recalculates the excluded
  tax every time.** Slow, error-prone, untraceable.

## 5.2 The engine design

**Rule chain per invoice line:**

```
product → belongs to company
company → has a TAX POLICY with an EFFECTIVE DATE:
            ABSORBING  (company pays the tax on stores' behalf)
            STRICT     (store pays the tax)
policy looked up ON THE INVOICE DATE → tax computed PER LINE
```

**Example — GST 10% (rate configurable per item), shop = Noor Medical Store:**

| Item | Company | Price | Policy | Tax | Store pays |
|---|---|---|---|---|---|
| Panadol 500mg | GSK | Rs. 100 | STRICT | +Rs. 10 | **Rs. 110** |
| Brufen 400mg | Abbott | Rs. 100 | ABSORBING | Rs. 10 (tracked, NOT charged) | **Rs. 100** |

**Invoice totals:**
- Store pays: **Rs. 210** (the correct net — nothing manual)
- Tax collected from store: **Rs. 10** (GSK)
- Tax absorbed on company's behalf: **Rs. 10** (Abbott) → shown in a
  **company-wise absorbed-tax report** so the distributor can reconcile
  or claim it from the company

## 5.3 Why it is "dynamic"

- Abbott announces: "from March 1 we stop absorbing." → Change the company's
  policy once (new policy + effective date). **Every invoice from March 1
  onward charges the store automatically.** Zero manual recalculation.
- History is safe: old invoices keep the policy that was valid on their date.
- ❓ Open (see Q1): when a company absorbs the tax, HOW does the distributor
  recover that money from the company — rebate, claim, or built into purchase
  price? The report must match whichever way.

**Killed papers:** manual tax recalculation sheets.

---

# 6. FLOW E — PROCUREMENT (buying from companies)

| As-Is | To-Be |
|---|---|
| Purchase orders and receipts in desktop ERP, one user | Same flow, cloud: PO → Stock Receipt (actual qty, batch, expiry) linked to PO; partial receipts tracked |
| Supplier payable in ERP | Auto-posted to supplier ledger |
| Expiry losses found too late | Weekly expiry report (30/60/90/180 days) → return to company → claim tracked to recovery |

---

# 7. FLOW F — RETURNS

| Return type | Rule | To-Be |
|---|---|---|
| Fresh Return (saleable) | Back to normal stock | Return document linked to invoice; stock IN, store balance credited |
| Short Return | Shortage reported | Tracked; becomes credit note and/or company claim ❓ (confirm, Q5) |
| Expired/Damaged Return | NEVER resellable | Stock IN to quarantine; expiry/damage claim to company |

---

# 8. FLOW G — ACCOUNTING (fully automatic)

- Every document (invoice, receipt, payment, return, credit note, adjustment)
  posts its own double-entry journal.
- Customer ledgers, supplier ledgers, cash book, expenses — all self-writing.
- Invoices are **never edited**: Void + Reissue or Credit/Debit Notes.
- Stock numbers are **never overwritten**: adjustments are documents with reasons.

---

# 9. CONSOLIDATED FUNCTIONAL REQUIREMENTS

### FR-1 Catalog & Master Data
- Products with unique IDs (keep the SAME IDs from the pad/old ERP), company,
  pack, batch, expiry, prices
- Company master with **tax policy history** (absorbing/strict + effective dates)
- Customers with credit limits, areas, opening balances
- Excel import from old system data

### FR-2 Booker Mobile App (offline-first)
- Shop list with balances, history, schemes
- Company-wise order entry mirroring the paper pad (same IDs)
- Offline save + auto-sync; credit shield (block/override-with-reason ❓ Q3)
- Recovery entry; daily DSR auto-generated

### FR-3 Warehouse Order Queue & Invoicing
- Digital queue of incoming orders (by booker/area/status)
- One-click invoice generation with pricing engine (company scheme → customer
  terms → qty slabs → bonus "buy 10 get 1") + **dynamic tax engine**
- FEFO batch allocation on the pick list

### FR-4 Dynamic Tax Engine
- Per-company policy (ABSORBING/STRICT) with effective dates
- Per-line computation on invoice date; invoice shows both totals
  (charged from store / absorbed for company)
- Company-wise absorbed-tax report ❓ (shape depends on Q1)
- Policy history preserved on old invoices

### FR-5 Salesman Channel
- Salesman accounts with own ledgers + credit limits
- Order routing flag (`via SALESMAN` vs `DIRECT`); billing/recovery to salesman
- Drop-ship delivery to his stores ❓ or to him first (Q4)
- Salesman-wise sales/outstanding/recovery reports

### FR-6 Inventory Core
- Append-only stock ledger (every movement a document)
- Batch + expiry tracking, FEFO picking, quarantine stock for expired/damaged
- Multi-location: main warehouse + vans (+ salesman stock if he holds any ❓ Q4)
- Transfers, adjustments with reasons, cycle counts

### FR-7 Finance
- Vouchers (cash/bank receipt & payment), journal entries, expenses
- Customer/supplier ledgers, cash book — all auto-posted from documents
- Credit notes / debit notes as documents; invoice void+reissue (no edits)

### FR-8 Claims (with companies)
- Expiry/damage/short claims tracked per company until money recovered
- ❓ PRS exact meaning and flow (Q6)

### FR-9 Reporting & Owner Dashboard
- Live: sales, receivables, cash, recoveries per booker, expiring stock
- Stock, expiry, DSR, customer/supplier ledgers, annual summaries
- Tax reports: charged vs absorbed, company-wise

### FR-10 Users & Security
- Roles: Owner, Accountant, Warehouse, Booker, Salesman, Counter
- Full audit trail: who did what, when
- The "main person" becomes admin — oversight without being the bottleneck

---

# 10. PLATFORM MAP (who gets what)

| User | Platform | Key screens |
|---|---|---|
| Owner | Web dashboard | Live KPIs, approvals, all reports |
| Accountant | Web | Vouchers, ledgers, cash book, credit/debit notes |
| Warehouse | Web (keyboard-first) | Order queue, stock receipt, pick lists, transfers, counter sales (F2/Enter/F9) |
| Booker | **Mobile (offline)** | Shop list, order pad (digital), credit shield, recovery, DSR |
| Salesman | **Mobile** | His orders, his ledger, his stores |
| Counter | Web (hotkeys) | Cash sale in <60 seconds |

---

# 11. OPEN QUESTIONS — answers needed to finalize design

- **Q1. Absorbed-tax recovery:** when a company absorbs the tax, how does the
  distributor get that money back — company rebate/claim, or is it already
  built into the purchase price the distributor pays?
- **Q2. Salesman pricing:** does the salesman buy at a discounted (dealer)
  price so his percentage is his own markup? Who fixes that price — and is it
  per-company like normal customer schemes?
- **Q3. Credit shield behavior:** hard block, or block with
  salesman/booker override (recorded with reason)? Same rule for counter sales?
- **Q4. Salesman stock:** does the salesman hold stock himself (buy first,
  store, then sell) or does the distribution deliver straight to his stores
  (drop-ship) while he owns the invoice?
- **Q5. Short returns:** free re-delivery, credit note to store, or company
  claim — which, and when?
- **Q6. PRS:** exact meaning and paper flow (Pending PRS, PRS Recovery, PRS
  Expenses in the old ERP menu).
- **Q7. FBR/fiscal invoicing:** is there any government e-invoicing requirement
  on the distributor now that tax is imposed, or is tax handling purely on
  paper invoices for now?
- **Q8. Recovery money:** do bookers handle cash themselves, or do shops pay
  into the bank? How is a booker's collection reconciled daily?

---

# 12. ONE-PARAGRAPH SUMMARY

> A Malakand medicine distributor runs a complete desktop ERP at one computer
> with one operator, while everything around it runs on paper: bookers carry
> pre-printed order pads, the pads pile up on one desk, orders are retyped a
> day late with no stock or credit checks, recoveries live in registers, and
> the newly imposed tax forces staff to manually recalculate every mixed
> invoice because some companies absorb the tax and strict ones like GSK do
> not. We rebuild the ERP in the cloud with the same proven logic and the same
> product IDs, give bookers and salesmen offline mobile apps that replace the
> pads and check credit limits live, turn the one-man bottleneck into a digital
> order queue, make the tax engine compute per line from each company's
> date-based policy automatically, and self-write every ledger and report —
> so the only paper left is the invoice in the customer's hand.
