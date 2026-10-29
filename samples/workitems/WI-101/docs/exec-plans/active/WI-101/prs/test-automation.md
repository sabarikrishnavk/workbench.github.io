---
artifact: A-AUTOTESTS
title: Automated test suites PR
work_item: "WI-101"
version: 1
approved: 2026-10-02
status: approved
template: templates/artifacts/A-AUTOTESTS.md
doc: docs/exec-plans/active/WI-101/prs/test-automation.md
definition: pr://qa-automation/WI-101
format: Pull request
produced_by: QA-03 /automate-tests (qa-agent)
inputs: [A-TESTCASES, A-CONTRACTOK]
context: [A-OPENAPI, A-SDL, A-EVENTS]
approvers: [QA Lead]
emits: autotests.merged
---

# Automated test suites PR: WI-101

<h2 id="summary_details" data-label="Summary">Summary</h2>

qa-automation #418: automated suites for BOPIS.

<div id="suites_table" data-label="Suites" data-columns="Suite|Level|Tool|TC refs|CI job">

**Suites**

| Suite | Level | Tool | TC refs | CI job |
|---|---|---|---|---|
| TS-WEB-E2E | e2e | Playwright | TC-01, TC-02, TC-05, TC-13 | bopis-web-e2e |
| TS-IOS-UI | e2e | XCUITest | TC-03, TC-07, TC-11, TC-12 | bopis-ios-ui |
| TS-AND-UI | e2e | Espresso | TC-04, TC-08, TC-09, TC-10 | bopis-android-ui |
| TS-CONCURRENCY | integration | k6 + JUnit | TC-06 | bopis-concurrency |

</div>

<div id="changes_table" data-label="Changes" data-columns="Area|Change|Files">

**Changes**

| Area | Change | Files |
|---|---|---|
| Suites | 4 suites, 13 scenarios | suites/bopis/* |
| CI | Nightly and per-PR jobs | .github/workflows/bopis.yml |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="STY / TSK / CMP ID|Implemented by|Notes">

**Traceability**

| STY / TSK / CMP ID | Implemented by | Notes |
|---|---|---|
| TSK-12 | PR-QA-418 | — |
| STY-01 | TS-WEB-E2E | TC-01, TC-02 |
| STY-09 | TS-AND-UI | TC-10 |

</div>

<div id="tests_table" data-label="Tests" data-columns="Level|Tests added|Passing|Coverage on changed lines">

**Tests**

| Level | Tests added | Passing | Coverage on changed lines |
|---|---|---|---|
| e2e | 12 | 12 | n/a |
| integration | 1 | 1 | n/a |

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
| G-BUILD | pass | ci://pr-qa-418/g-build |
| G-GHERKIN | pass | ci://pr-qa-418/g-gherkin |
| G-TEMPLATE | pass | ci://pr-qa-418/g-template |

</div>

<h2 id="reviewer_notes_details" data-label="Reviewer Notes">Reviewer Notes</h2>

Suites run against staging with the 12-store fixture.

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
| QA Lead | Grace Kim | 2026-10-02 | Approved |

</div>

