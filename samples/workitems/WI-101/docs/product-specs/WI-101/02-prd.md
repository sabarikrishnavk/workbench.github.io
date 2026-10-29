---
artifact: A-PRD
title: Product requirements (PRD)
work_item: "WI-101"
version: 1
approved: 2026-09-04
status: approved
template: templates/artifacts/A-PRD.md
doc: docs/product-specs/WI-101/02-prd.md
format: Markdown + YAML frontmatter
produced_by: PM-02 /write-prd (pm-agent)
inputs: [A-BRIEF]
context: [A-JOURNEY]
approvers: [Product Owner]
emits: prd.approved
---

# Product requirements (PRD): WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Product requirements for WI-101: what the shopper and associate can do, how we measure it and what is out of scope. Design decisions are in the KDD log.

<h2 id="executive_summary_details" data-label="Executive Summary">Executive Summary</h2>

Eight requirements: five Must, two Should and one Could. Together they deliver real-time availability, pickup checkout, store fulfilment and collection across web, iOS, Android and the store handheld.

<h2 id="business_problem_details" data-label="Business Problem">Business Problem</h2>

Store stock is invisible to online shoppers, so we lose sales to competitors with same-day pickup and pay carriers to ship items that a store nearby could hand over.

<div id="in_scope_table" data-label="In Scope" data-columns="ID|Item|Notes">

**In Scope**

| ID | Item | Notes |
|---|---|---|
| S-01 | Store availability on product pages | REQ-01 |
| S-02 | Pickup checkout | REQ-02, REQ-03 |
| S-03 | Store fulfilment | REQ-04, REQ-08 |
| S-04 | Notify and collect | REQ-05, REQ-06, REQ-07 |

</div>

<div id="out_of_scope_table" data-label="Out of Scope" data-columns="ID|Item|Reason">

**Out of Scope**

| ID | Item | Reason |
|---|---|---|
| X-01 | Curbside pickup | Next year |
| X-02 | Pay in store | POS change needed |
| X-03 | Ship-from-store | Carrier integration |

</div>

<div id="business_goals_table" data-label="Business Goals" data-columns="OUT ID|Goal|Metric|Target">

**Business Goals**

| OUT ID | Goal | Metric | Target |
|---|---|---|---|
| OUT-01 | Convert more product-page visits | MET-01 | 3.4% |
| OUT-02 | Cut shipping cost | MET-02 | $6.95 |
| OUT-03 | Keep the 2-hour promise | MET-03 | 95% |

</div>

<div id="functional_requirements_table" data-label="Functional Requirements" data-columns="REQ ID|Requirement|Priority (MoSCoW)|Acceptance criteria|OUT ref">

**Functional Requirements**

| REQ ID | Requirement | Priority (MoSCoW) | Acceptance criteria | OUT ref |
|---|---|---|---|---|
| REQ-01 | Show real-time pickup availability for the 5 nearest stores on the product page | Must | Availability shown within 150 ms; stock is at most 60 s old | OUT-01 |
| REQ-02 | Offer store pickup as a fulfilment option at checkout and take payment online | Must | Shopper can complete checkout with pickup on web, iOS, Android | OUT-01 |
| REQ-03 | Reserve the stock in the chosen store when the order is placed | Must | No oversell in a 1,800 rps load test | OUT-01 |
| REQ-04 | Route the order to the store queue with a 2-hour ready target | Must | Order appears on the handheld within 30 s | OUT-03 |
| REQ-05 | Notify the shopper when the order is ready (push, email, SMS) | Must | Notification sent within 60 s of staging | OUT-03 |
| REQ-06 | Hand over the order with a QR code or order number | Should | Hand-over under 60 s in store trial | OUT-03 |
| REQ-07 | Cancel and refund orders not collected within 5 days | Should | Refund issued and stock released automatically | OUT-02 |
| REQ-08 | Offer a substitute when an item is missing at pick | Could | Associate can propose a substitute; shopper accepts in app | OUT-03 |

</div>

<div id="non_functional_requirements_table" data-label="Non-Functional Requirements" data-columns="NFR ID|Category|Requirement|Target|REQ ref">

**Non-Functional Requirements**

| NFR ID | Category | Requirement | Target | REQ ref |
|---|---|---|---|---|
| NFR-01 | Performance | Availability lookup latency | p95 ≤ 150 ms | REQ-01 |
| NFR-02 | Freshness | Store stock age | ≤ 60 s | REQ-01 |
| NFR-03 | Performance | Reservation latency | p99 ≤ 400 ms | REQ-03 |
| NFR-04 | Availability | Pickup checkout | 99.9% | REQ-02 |
| NFR-05 | Privacy | Shopper phone and email | Confidential, masked in logs | REQ-05 |
| NFR-06 | Scale | Peak availability lookups | 1,800 rps | REQ-01 |

</div>

<div id="use_cases_table" data-label="Use Cases" data-columns="UC ID|Actor|Goal|Main flow|REQ refs">

**Use Cases**

| UC ID | Actor | Goal | Main flow | REQ refs |
|---|---|---|---|---|
| UC-01 | Online shopper | Collect a jacket today | PDP → store selector → checkout (pickup) → pay | REQ-01, REQ-02, REQ-03 |
| UC-02 | Store associate | Prepare an order | Queue → pick list → scan → stage | REQ-04 |
| UC-03 | Online shopper | Collect the order | Notification → QR at desk → hand-over | REQ-05, REQ-06 |

</div>

<div id="analytics_events_table" data-label="Analytics Events" data-columns="Event|Trigger|Properties|Measures OUT">

**Analytics Events**

| Event | Trigger | Properties | Measures OUT |
|---|---|---|---|
| pickup_availability_viewed | Availability module rendered | sku, storeCount, inStockCount | OUT-01 |
| pickup_selected | Pickup chosen at checkout | storeId | OUT-01 |
| pickup_ready | Order staged | orderId, minutesToReady | OUT-03 |
| pickup_collected | QR scanned | orderId, waitSeconds | OUT-03 |

</div>

<div id="assumptions_table" data-label="Assumptions" data-columns="Assumption|Impact if wrong|Owner">

**Assumptions**

| Assumption | Impact if wrong | Owner |
|---|---|---|
| Stores keep POS stock within ±2 units | Shopper arrives to a missing item | Store operations |

</div>

<div id="risks_table" data-label="Risks" data-columns="Risk|Likelihood|Impact|Mitigation|Owner">

**Risks**

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Stock lag during store network outages | Medium | High | Hide availability when stock is older than 5 minutes | Arjun Mehta |
| Holiday peak overload | Medium | High | Load test at 2× forecast | Lucas Brandt |

</div>

<div id="constraints_table" data-label="Constraints" data-columns="Constraint|Type|Source">

**Constraints**

| Constraint | Type | Source |
|---|---|---|
| OMS remains system of record for orders | Architecture | Enterprise standards |
| Live before 2026-11-16 | Time | Digital Commerce |

</div>

<div id="stakeholders_table" data-label="Stakeholders" data-columns="Name|Role|Responsibility|RACI">

**Stakeholders**

| Name | Role | Responsibility | RACI |
|---|---|---|---|
| Priya Raman | Product Owner | Scope and acceptance | A |
| Daniel Okafor | Product Manager | PRD owner | R |
| Arjun Mehta | Lead Solution Architect | Feasibility | C |
| Carla Nunes | Head of Store Operations | Store process | C |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| REQ-01 | TRACES_TO OUT-01 | A-BRIEF |
| REQ-01 | PART_OF WI-101 | A-REQUEST |
| REQ-02 | TRACES_TO OUT-01 | A-BRIEF |
| REQ-02 | PART_OF WI-101 | A-REQUEST |
| REQ-03 | TRACES_TO OUT-01 | A-BRIEF |
| REQ-03 | PART_OF WI-101 | A-REQUEST |
| REQ-04 | TRACES_TO OUT-03 | A-BRIEF |
| REQ-04 | PART_OF WI-101 | A-REQUEST |
| REQ-05 | TRACES_TO OUT-03 | A-BRIEF |
| REQ-05 | PART_OF WI-101 | A-REQUEST |
| REQ-06 | TRACES_TO OUT-03 | A-BRIEF |
| REQ-06 | PART_OF WI-101 | A-REQUEST |
| REQ-07 | TRACES_TO OUT-02 | A-BRIEF |
| REQ-07 | PART_OF WI-101 | A-REQUEST |

</div>

<div id="open_questions_table" data-label="Open Questions" data-columns="Question|Owner|Due|Status">

**Open Questions**

| Question | Owner | Due | Status |
|---|---|---|---|
| None open | — | — | — |

</div>

<div id="approvals_table" data-label="Approvals" data-columns="Role|Name|Date|Decision">

**Approvals**

| Role | Name | Date | Decision |
|---|---|---|---|
| Product Owner | Priya Raman | 2026-09-04 | Approved |

</div>

