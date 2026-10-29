---
artifact: A-APIPR
title: REST service PR
work_item: "WI-101"
version: 1
approved: 2026-09-26
status: approved
template: templates/artifacts/A-APIPR.md
doc: docs/exec-plans/active/WI-101/prs/service.md
definition: pr://service/WI-101
format: Pull request
produced_by: API-02 /implement-service (rest-api-agent)
inputs: [A-OPENAPI, A-CONTRACTOK, A-DDL]
context: [A-NFR]
approvers: [Service Engineering Manager]
emits: service.merged
---

# REST service PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

inventory-service #1207: availability and soft reservations. Implements getAvailability, createReservation and releaseReservation.

<div id="operations_table" data-label="Operations Implemented" data-columns="Operation ID|Handler|Persistence|Provider test">

**Operations Implemented**

| Operation ID | Handler | Persistence | Provider test |
|---|---|---|---|
| getAvailability | AvailabilityController.get | Redis | pass |
| createReservation | ReservationController.create | Redis + Postgres | pass |
| releaseReservation | ReservationController.release | Redis + Postgres | pass |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| API | 3 operations | src/main/java/…/availability, reservation |
| Cache | Redis stock cache | src/main/java/…/cache |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| STY-01 | PR-INV-1207 | getAvailability |
| STY-05 | PR-INV-1207 | createReservation |
| TSK-05 | PR-INV-1207 | — |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| unit | 112 | 112 | 91% |
| contract (Pact provider) | 14 | 14 | n/a |
| integration | 26 | 26 | n/a |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| inv.softReservations | off | Enable with release REL-2026.10.1 |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| G-BUILD | pass | ci://pr-inv-1207/g-build |
| G-SAST | pass | ci://pr-inv-1207/g-sast |
| G-CONTRACT-TEST | pass | ci://pr-inv-1207/g-contract-test |
| G-TEMPLATE | pass | ci://pr-inv-1207/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Atomic decrement uses a Lua script so two reservations can't take the last unit.

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
| Service Engineering Manager | Marcus Bell | 2026-09-26 | Approved |

</div>

