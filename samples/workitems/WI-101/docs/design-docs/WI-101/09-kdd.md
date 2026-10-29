---
artifact: A-KDD
title: Key design decisions (KDD / ADR)
work_item: "WI-101"
version: 2
approved: 2026-09-10
status: approved
template: templates/artifacts/A-KDD.md
doc: docs/design-docs/WI-101/09-kdd.md
format: Markdown (MADR) + YAML scores
produced_by: KDD-01 /decide-key-design (design-decision-agent)
inputs: [A-PRD]
context: [A-JOURNEY, A-BRIEF]
approvers: [Lead Solution Architect, Product Owner]
emits: kdd.approved
---

# Key design decisions (KDD / ADR): WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Four key design decisions for BOPIS, scored on product priority, engineering effort and 3-year ops TCO. Version 2 re-scored KDD-02 after the OMS team confirmed its v2 reservation API slips to Q1 2027.

<div id="decision_log_table" data-label="Decision Log" data-columns="KDD ID|Decision|Drivers (REQ refs)|Status|Chosen option">

**Decision Log**

| KDD ID | Decision | Drivers (REQ refs) | Status | Chosen option |
|---|---|---|---|---|
| KDD-01 | Source of store stock for real-time availability | REQ-01 | Accepted | OPT-01b |
| KDD-02 | Where stock is reserved at order time | REQ-03 | Accepted with dispensation | OPT-02b |
| KDD-03 | Channel API for web and apps | REQ-01, REQ-02 | Accepted | OPT-03a |
| KDD-04 | How ready notifications are sent | REQ-05 | Accepted with dispensation | OPT-04b |

</div>

<div id="scoring_weights_table" data-label="Scoring Weights" data-columns="Criterion|Weight %|Scale (5 = best)">

**Scoring Weights**

| Criterion | Weight % | Scale (5 = best) |
|---|---|---|
| Product priority | 35 | 5 = delivers the Must requirements first |
| Engineering effort | 30 | 5 = least effort |
| Ops TCO 3y | 35 | 5 = lowest run cost |

</div>

<div id="options_scoring_table" data-label="Options Scoring" data-columns="KDD ID|Option|Product priority (1–5)|Engineering effort (1–5)|Ops TCO 3y (1–5)|Weighted score|Deviates?">

**Options Scoring**

| KDD ID | Option | Product priority (1–5) | Engineering effort (1–5) | Ops TCO 3y (1–5) | Weighted score | Deviates? |
|---|---|---|---|---|---|---|
| KDD-01 | OPT-01a Read OMS store stock synchronously | 3 | 4 | 2 | 2.95 | N |
| KDD-01 | OPT-01b Event-sourced stock cache (POS CDC → Kafka → Redis) | 5 | 3 | 4 | 4.05 | N |
| KDD-01 | OPT-01c Nightly batch plus safety stock | 2 | 5 | 5 | 3.95 | N |
| KDD-02 | OPT-02a Hard reservation in OMS (standard) | 3 | 2 | 3 | 2.70 | N |
| KDD-02 | OPT-02b Soft reservation in inventory-service, OMS confirms async | 5 | 4 | 3 | 4.00 | Y |
| KDD-03 | OPT-03a Federated fulfilment subgraph (standard) | 4 | 4 | 4 | 4.00 | N |
| KDD-03 | OPT-03b Per-channel REST BFFs | 3 | 3 | 2 | 2.65 | N |
| KDD-04 | OPT-04a Notification service consumes order.pickup.ready (standard) | 4 | 2 | 4 | 3.40 | N |
| KDD-04 | OPT-04b Fulfilment backend calls SMS vendor directly | 4 | 5 | 2 | 3.60 | Y |

</div>

<div id="decisions_table" data-label="Decisions &amp; Rationale" data-columns="KDD ID|Decision|Rationale|Override reason|ADR ref">

**Decisions & Rationale**

| KDD ID | Decision | Rationale | Override reason | ADR ref |
|---|---|---|---|---|
| KDD-01 | OPT-01b event-sourced stock cache | Only option that meets 60 s freshness at 1,800 rps | — | ADR-07 |
| KDD-02 | OPT-02b soft reservation in inventory-service | OMS v2 API not available before launch; OMS v1 adds 900 ms p99 | Product priority outweighs the standard | ADR-08 |
| KDD-03 | OPT-03a federated fulfilment subgraph | Standard; one API for three channels | — | ADR-09 |
| KDD-04 | OPT-04b direct SMS vendor call | notification-service has no SMS templates until Q1 | Time to market | — |

</div>

<div id="dispensations_table" data-label="Dispensations" data-columns="DSP ID|KDD ID|Deviation from|Owner|Expiry|Remediation">

**Dispensations**

| DSP ID | KDD ID | Deviation from | Owner | Expiry | Remediation |
|---|---|---|---|---|---|
| DSP-01 | KDD-02 | OMS is the system of record for reservations | Arjun Mehta | 2027-03-31 | Move reservations to OMS v2 reservation API when it ships (Q1 2027) |
| DSP-02 | KDD-04 | All customer messages go through notification-service | Hannah Lee | 2027-01-31 | Publish order.pickup.ready and let notification-service send SMS |

</div>

<div id="consequences_table" data-label="Consequences" data-columns="KDD ID|Positive|Negative|Follow-up">

**Consequences**

| KDD ID | Positive | Negative | Follow-up |
|---|---|---|---|
| KDD-01 | Fresh stock and fast reads | New Redis cluster to run | SLO on CDC lag |
| KDD-02 | Launch on time | Two places hold reservations | PLAT-1423 |
| KDD-03 | One contract for all channels | Subgraph team on the critical path | — |
| KDD-04 | Launch on time | Message templates outside the notification service | PLAT-1424 |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| KDD-01 | ADDRESSES REQ-01 | A-PRD |
| KDD-02 | ADDRESSES REQ-03 | A-PRD |
| KDD-03 | ADDRESSES REQ-01 | A-PRD |
| KDD-03 | ADDRESSES REQ-02 | A-PRD |
| KDD-04 | ADDRESSES REQ-05 | A-PRD |

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
| Lead Solution Architect | Arjun Mehta | 2026-09-10 | Approved |
| Product Owner | Priya Raman | 2026-09-10 | Approved |

</div>

