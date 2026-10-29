---
artifact: A-UILIB
title: UI component library PR
work_item: "WI-101"
version: 1
approved: 2026-09-24
status: approved
template: templates/artifacts/A-UILIB.md
doc: docs/exec-plans/active/WI-101/prs/ui-components.md
definition: pr://design-system/WI-101
format: Pull request + Storybook
produced_by: UX-01 /build-components (ux-engineer-agent)
inputs: [A-UIKIT, A-PLAN]
context: []
approvers: [Design System Owner]
emits: uilib.merged
---

# UI component library PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

design-system #482: pickup components. Adds CMP-01, CMP-02, CMP-04, CMP-05 and updates CMP-03.

<div id="components_table" data-label="Components" data-columns="CMP ID|Component|Stories|Visual baseline|a11y result">

**Components**

| CMP ID | Component | Stories | Visual baseline | a11y result |
|---|---|---|---|---|
| CMP-01 | StoreAvailabilityBadge | 6 | approved | pass |
| CMP-02 | StorePicker | 5 | approved | pass |
| CMP-03 | FulfilmentToggle | 3 | approved | pass |
| CMP-04 | PickupQRCode | 2 | approved | pass |
| CMP-05 | PickListItem | 3 | approved | pass |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| Components | 4 new, 1 changed | packages/pickup/* |
| Tokens | Pickup status colours | tokens/status.json |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| CMP-01 | PR-DS-482 | Badge with stale state |
| CMP-02 | PR-DS-482 | Sheet and inline variants |
| TSK-08 | PR-DS-482 | — |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| unit | 38 | 38 | 94% |
| visual | 22 | 22 | n/a |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| None | — | — |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| G-BUILD | pass | ci://pr-ds-482/g-build |
| G-A11Y | pass | ci://pr-ds-482/g-a11y |
| G-VISUAL | pass | ci://pr-ds-482/g-visual |
| G-TEMPLATE | pass | ci://pr-ds-482/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Reviewed by Lena Vogel. Stale state uses the neutral token so it never reads as out of stock.

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
| Design System Owner | Lena Vogel | 2026-09-24 | Approved |

</div>

