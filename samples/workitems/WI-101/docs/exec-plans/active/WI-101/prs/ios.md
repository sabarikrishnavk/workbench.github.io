---
artifact: A-IOSPR
title: iOS feature PR
work_item: "WI-101"
version: 1
approved: 2026-10-01
status: approved
template: templates/artifacts/A-IOSPR.md
doc: docs/exec-plans/active/WI-101/prs/ios.md
definition: pr://ios-app/WI-101
format: Pull request
produced_by: IOS-01 /build-ios-feature (ios-agent)
inputs: [A-STORIES, A-SCREENS, A-UIKIT, A-CONTRACTOK]
context: [A-SDL]
approvers: [Mobile Engineering Manager]
emits: ios.merged
---

# iOS feature PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

shopper-ios #877: availability, pickup checkout, ready push and QR code.

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| UI | 4 stories | src/features/pickup/* |
| Analytics | 4 events | src/analytics/pickup.* |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| STY-02 | PR-IOS-877 | — |
| STY-06 | PR-IOS-877 | — |
| STY-10 | PR-IOS-877 | — |
| STY-11 | PR-IOS-877 | — |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| unit | 64 | 64 | 88% |
| UI / e2e | 18 | 18 | n/a |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Default|Rollout plan">

**Feature Flags**

| Flag | Default | Rollout plan |
|---|---|---|
| ios.pickup | off | 10% → 50% → 100% with release |

</div>

<div id="gate_results_table" data-label="Gate Results" data-columns="Gate|Result|Evidence link">

**Gate Results**

| Gate | Result | Evidence link |
|---|---|---|
| G-BUILD | pass | ci://pr-ios-877/g-build |
| G-A11Y | pass | ci://pr-ios-877/g-a11y |
| G-SAST | pass | ci://pr-ios-877/g-sast |
| G-TEMPLATE | pass | ci://pr-ios-877/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Uses the shared pickup components; no channel-specific availability logic.

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
| Mobile Engineering Manager | Kenji Sato | 2026-10-01 | Approved |

</div>

