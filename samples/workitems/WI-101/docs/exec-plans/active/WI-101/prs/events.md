---
artifact: A-EVTPR
title: Event producer / consumer PR
work_item: "WI-101"
version: 1
approved: 2026-09-26
status: approved
template: templates/artifacts/A-EVTPR.md
doc: docs/exec-plans/active/WI-101/prs/events.md
definition: pr://service/WI-101-events
format: Pull request
produced_by: EVT-02 /implement-producers-consumers (kafka-agent)
inputs: [A-EVENTS, A-CONTRACTOK]
context: [A-DDL]
approvers: [Streaming Platform Lead]
emits: events.merged
---

# Event producer / consumer PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

inventory-service #1211 and store-app #233: Kafka producers and consumers for stock and pickup events.

<div id="handlers_table" data-label="Producers &amp; Consumers" data-columns="Topic|Role (producer / consumer)|Idempotency key|DLQ|Retry policy">

**Producers & Consumers**

| Topic | Role (producer / consumer) | Idempotency key | DLQ | Retry policy |
|---|---|---|---|---|
| pos.inventory.changed.v1 | consumer | storeId:sku:changedAt | pos.inventory.changed.v1.dlq | 3 × exponential |
| order.pickup.placed.v1 | consumer | orderId | order.pickup.placed.v1.dlq | 5 × exponential |
| order.pickup.ready.v1 | producer | orderId | — | outbox |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| Consumer | pos.inventory.changed.v1 | inventory-service/…/cdc |
| Producer | order.pickup.ready.v1 | store-app-backend/…/events |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| STY-08 | PR-INV-1211 | placed consumer on handheld |
| STY-10 | PR-INV-1211 | ready producer |
| TSK-06 | PR-INV-1211 | — |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| unit | 48 | 48 | 89% |
| integration (Testcontainers) | 12 | 12 | n/a |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| evt.posCdc | on in 3 pilot stores | All stores on 2026-10-06 |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| G-BUILD | pass | ci://pr-inv-1211/g-build |
| G-AVRO-COMPAT | pass | ci://pr-inv-1211/g-avro-compat |
| G-CONTRACT-TEST | pass | ci://pr-inv-1211/g-contract-test |
| G-TEMPLATE | pass | ci://pr-inv-1211/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Outbox pattern for the ready event so it is never lost when the handheld goes offline.

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
| Streaming Platform Lead | Nadia Petrova | 2026-09-26 | Approved |

</div>

