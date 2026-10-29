---
artifact: A-REQUEST
title: Business request
work_item: "WI-101"
version: 1
approved: 2026-09-01
status: approved
template: templates/artifacts/A-REQUEST.md
doc: docs/product-specs/WI-101/00-request.md
format: Markdown
produced_by: work item request (seed)
inputs: []
context: []
approvers: [Auto (gates)]
emits: request.created
---

# Business request: WI-101

<h2 id="request_summary_details" data-label="Request Summary">Request Summary</h2>

Shoppers abandon product pages when home delivery takes 3–5 days, and we ship items that are on the shelf in a store 2 km away. Digital Commerce asks for **buy online, pick up in store (BOPIS)** across web, iOS and Android for the 212 Harbor & Pine stores, using real-time store stock so that we only promise what is on the shelf.

<div id="requester_table" data-label="Requester" data-columns="Name|Role|Team|Contact">

**Requester**

| Name | Role | Team | Contact |
|---|---|---|---|
| Jordan Blake | VP Digital Commerce | Digital Commerce | jordan.blake@harborpine.example |

</div>

<h2 id="business_goal_details" data-label="Business Goal">Business Goal</h2>

Convert more product-page visits by offering same-day pickup, move eligible orders from parcel carriers to stores, and use store stock before it is marked down. The holiday peak starts on 27 November 2026, so the feature must be live and stable before then.

<div id="success_measures_table" data-label="Success Measures" data-columns="Measure|Baseline|Target">

**Success Measures**

| Measure | Baseline | Target |
|---|---|---|
| PDP-to-order conversion | 2.8% | 3.4% |
| Shipping cost per order | $7.90 | $6.95 |
| Orders ready for pickup within 2 h | n/a | 95% |

</div>

<div id="deadline_table" data-label="Deadline &amp; Constraints" data-columns="Item|Date / limit|Reason">

**Deadline & Constraints**

| Item | Date / limit | Reason |
|---|---|---|
| Production launch | 2026-10-06 | Six weeks of stable running before the holiday code freeze |
| Code freeze | 2026-11-16 | Holiday peak readiness |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| WI-101 | Business request | A-REQUEST |

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
| Auto (gates) | harness gates | 2026-09-01 | Approved |

</div>

