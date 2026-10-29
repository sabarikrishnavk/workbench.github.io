---
artifact: A-EVTPR
title: Event producer / consumer PR
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-EVTPR.md
doc: docs/exec-plans/active/{wi}/prs/events.md
definition: pr://service/{wi}-events
format: Pull request
produced_by: EVT-02 /implement-producers-consumers (kafka-agent)
inputs: [A-EVENTS, A-CONTRACTOK]
context: [A-DDL]
approvers: [Streaming Platform Lead]
emits: events.merged
---

# Event producer / consumer PR: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-EVTPR.md -->

<h2 id="summary_details" data-label="Summary">Summary</h2>

<!-- What changed and why, in two or three sentences -->

<div id="handlers_table" data-label="Producers &amp; Consumers" data-columns="Topic|Role (producer / consumer)|Idempotency key|DLQ|Retry policy">

**Producers & Consumers**

| Topic | Role (producer / consumer) | Idempotency key | DLQ | Retry policy |
|---|---|---|---|---|
| | | | | |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| | | |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| | | |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| | | | |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| | | |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| | | |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

<!-- Risks, follow-ups, screenshots -->

<div id="open_questions_table" data-label="Open Questions" data-columns="Question|Owner|Due|Status">

**Open Questions**

| Question | Owner | Due | Status |
|---|---|---|---|
| | | | |

</div>

<div id="approvals_table" data-label="Approvals" data-columns="Role|Name|Date|Decision">

**Approvals**

| Role | Name | Date | Decision |
|---|---|---|---|
| | | | |

</div>

