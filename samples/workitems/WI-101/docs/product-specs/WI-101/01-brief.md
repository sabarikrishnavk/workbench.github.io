---
artifact: A-BRIEF
title: Opportunity brief
work_item: "WI-101"
version: 1
approved: 2026-09-02
status: approved
template: templates/artifacts/A-BRIEF.md
doc: docs/product-specs/WI-101/01-brief.md
format: Markdown + YAML frontmatter
produced_by: PM-01 /frame-opportunity (pm-agent)
inputs: [A-REQUEST]
context: []
approvers: [Product Owner]
emits: brief.approved
---

# Opportunity brief: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Opportunity brief for WI-101. It frames the problem, the people affected and the outcomes the work item commits to. Requirements follow in the PRD.

<h2 id="executive_summary_details" data-label="Executive Summary">Executive Summary</h2>

Same-day store pickup is the most requested feature in app reviews (1,240 mentions in Q2) and the top reason given in exit surveys on product pages. Three of our four closest competitors offer it. We expect +0.6 pt conversion on product pages where pickup is available and a 12% drop in shipping cost per order.

<h2 id="problem_statement_details" data-label="Problem Statement">Problem Statement</h2>

Online stock and store stock are separate. The website only knows about the distribution centre, so a shopper who could collect an item today is offered 3–5 day delivery, and we pay a carrier to ship it. Store stock counts reach the e-commerce platform once a night, which is too stale to promise a pickup.

<div id="personas_table" data-label="Target Personas" data-columns="Persona|Need|Current pain">

**Target Personas**

| Persona | Need | Current pain |
|---|---|---|
| Online shopper | Know if the item is in a nearby store and collect it today | Only home delivery is offered |
| Store associate | A clear pick list and a fast hand-over | Click-and-collect is handled by phone and paper today |
| Store operations manager | Predictable pickup workload | No visibility of incoming online orders |

</div>

<div id="outcomes_table" data-label="Outcomes (OKR)" data-columns="OUT ID|Objective|Key result">

**Outcomes (OKR)**

| OUT ID | Objective | Key result |
|---|---|---|
| OUT-01 | Convert more product-page visits with same-day pickup | PDP-to-order conversion from 2.8% to 3.4% |
| OUT-02 | Cut last-mile shipping cost | Shipping cost per order from $7.90 to $6.95 |
| OUT-03 | Keep the 2-hour pickup promise | 95% of pickup orders ready within 2 hours |

</div>

<div id="success_metrics_table" data-label="Success Metrics" data-columns="OUT ID|Metric|Baseline|Target|Source">

**Success Metrics**

| OUT ID | Metric | Baseline | Target | Source |
|---|---|---|---|---|
| OUT-01 | MET-01 PDP-to-order conversion | 2.8% | 3.4% | Web and app analytics |
| OUT-02 | MET-02 Shipping cost per order | $7.90 | $6.95 | Finance carrier invoices |
| OUT-03 | MET-03 Orders ready within 2 h | n/a | 95% | Order events |
| OUT-03 | MET-04 Pickup cancellation rate | n/a | < 4% | Order events |

</div>

<div id="in_scope_table" data-label="In Scope" data-columns="ID|Item|Notes">

**In Scope**

| ID | Item | Notes |
|---|---|---|
| S-01 | Real-time store availability on product pages | Web, iOS, Android |
| S-02 | Pickup as a fulfilment option at checkout | Pay online only |
| S-03 | Store pick, stage and hand-over flow | Store handheld app |
| S-04 | Ready-for-pickup notifications | Push, email, SMS |

</div>

<div id="out_of_scope_table" data-label="Out of Scope" data-columns="ID|Item|Reason">

**Out of Scope**

| ID | Item | Reason |
|---|---|---|
| X-01 | Curbside pickup | Separate work item next year |
| X-02 | Pay in store | Needs POS change |
| X-03 | Ship-from-store | Carrier integration not ready |

</div>

<div id="assumptions_table" data-label="Assumptions" data-columns="Assumption|Impact if wrong|Owner">

**Assumptions**

| Assumption | Impact if wrong | Owner |
|---|---|---|
| Store POS stock counts are accurate to ±2 units | Shoppers arrive to a missing item | Store operations |
| Stores can staff picking within 2 hours | Ready rate below target | Store operations manager |

</div>

<div id="constraints_table" data-label="Constraints" data-columns="Constraint|Type|Source">

**Constraints**

| Constraint | Type | Source |
|---|---|---|
| Go live before the holiday code freeze (2026-11-16) | Time | Digital Commerce |
| OMS stays the system of record for orders | Architecture | Enterprise architecture standards |

</div>

<div id="stakeholders_table" data-label="Stakeholders" data-columns="Name|Role|Interest|RACI">

**Stakeholders**

| Name | Role | Interest | RACI |
|---|---|---|---|
| Jordan Blake | VP Digital Commerce | Sponsor | A |
| Priya Raman | Product Owner | Scope and acceptance | R |
| Carla Nunes | Head of Store Operations | Store process and labour | C |
| Arjun Mehta | Lead Solution Architect | Solution and decisions | C |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| PER-SHOPPER | AFFECTED_BY WI-101 | A-REQUEST |
| PER-ASSOC | AFFECTED_BY WI-101 | A-REQUEST |
| PER-OPSMGR | AFFECTED_BY WI-101 | A-REQUEST |
| OUT-01 | PART_OF WI-101 | A-REQUEST |
| OUT-02 | PART_OF WI-101 | A-REQUEST |
| OUT-03 | PART_OF WI-101 | A-REQUEST |

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
| Product Owner | Priya Raman | 2026-09-02 | Approved |

</div>

