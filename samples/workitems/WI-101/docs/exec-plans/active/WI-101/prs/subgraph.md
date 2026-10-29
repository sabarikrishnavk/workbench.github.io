---
artifact: A-GQLPR
title: Subgraph resolver PR
work_item: "WI-101"
version: 1
approved: 2026-09-29
status: approved
template: templates/artifacts/A-GQLPR.md
doc: docs/exec-plans/active/WI-101/prs/subgraph.md
definition: pr://subgraph/WI-101
format: Pull request
produced_by: GQL-02 /implement-resolvers (graphql-agent)
inputs: [A-SDL, A-CONTRACTOK]
context: [A-OPENAPI]
approvers: [API Platform Lead]
emits: subgraph.merged
---

# Subgraph resolver PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

fulfilment-subgraph #311: resolvers for storeAvailability and Product.pickupAvailability.

<div id="resolvers_table" data-label="Resolvers" data-columns="Type.field|Source operation|Dataloader|Error mapping">

**Resolvers**

| Type.field | Source operation | Dataloader | Error mapping |
|---|---|---|---|
| Product.pickupAvailability | getAvailability + NearestStores | availabilityLoader (batch 50) | 409 → OUT, timeout → UNKNOWN |
| Query.storeAvailability | getAvailability + NearestStores | availabilityLoader | as above |
| Mutation.setPreferredStore | customer-profile PUT | — | 404 → STORE_NOT_FOUND |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| Resolvers | 3 fields | src/resolvers/* |
| Dataloaders | availability, stores | src/loaders/* |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| STY-01 | PR-FUL-311 | — |
| STY-02 | PR-FUL-311 | — |
| STY-03 | PR-FUL-311 | — |
| TSK-07 | PR-FUL-311 | — |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| unit | 41 | 41 | 93% |
| composition | 1 | 1 | n/a |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| ful.pickupAvailability | off | Ramp with release |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| G-BUILD | pass | ci://pr-ful-311/g-build |
| G-GQL-COMPOSE | pass | ci://pr-ful-311/g-gql-compose |
| G-CONTRACT-TEST | pass | ci://pr-ful-311/g-contract-test |
| G-TEMPLATE | pass | ci://pr-ful-311/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Timeouts degrade to UNKNOWN (Check in store) instead of failing the product page.

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
| API Platform Lead | Omar Haddad | 2026-09-29 | Approved |

</div>

