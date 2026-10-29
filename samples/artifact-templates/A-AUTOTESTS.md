---
artifact: A-AUTOTESTS
title: Automated test suites PR
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-AUTOTESTS.md
doc: docs/exec-plans/active/{wi}/prs/test-automation.md
definition: pr://qa-automation/{wi}
format: Pull request
produced_by: QA-03 /automate-tests (qa-agent)
inputs: [A-TESTCASES, A-CONTRACTOK]
context: [A-OPENAPI, A-SDL, A-EVENTS]
approvers: [QA Lead]
emits: autotests.merged
---

# Automated test suites PR: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-AUTOTESTS.md -->

<h2 id="summary_details" data-label="Summary">Summary</h2>

<!-- What changed and why, in two or three sentences -->

<div id="suites_table" data-label="Suites" data-columns="Suite|Level|Tool|TC refs|CI job">

**Suites**

| Suite | Level | Tool | TC refs | CI job |
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

