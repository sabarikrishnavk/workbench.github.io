---
artifact: A-TESTPLAN
title: Test strategy & plan
work_item: "WI-101"
version: 1
approved: 2026-09-17
status: approved
template: templates/artifacts/A-TESTPLAN.md
doc: docs/quality/WI-101/test-plan.md
format: Markdown
produced_by: QA-01 /plan-tests (qa-agent)
inputs: [A-PRD, A-STORIES, A-NFR]
context: [A-SAD]
approvers: [QA Lead]
emits: testplan.approved
---

# Test strategy & plan: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Risk-based test strategy for BOPIS. Highest risk: oversell and stale stock (REQ-01, REQ-03).

<div id="scope_table" data-label="Scope" data-columns="Item|In / out|Notes">

**Scope**

| Item | In / out | Notes |
|---|---|---|
| Availability, reservation, pickup flow | in | Web, iOS, Android, handheld |
| Substitutions (REQ-08) | out | Deferred |
| POS internals | out | Owned by store tech |

</div>

<div id="risk_matrix_table" data-label="Risk Matrix" data-columns="REQ ID|Impact (1–5)|Likelihood (1–5)|Risk score|Test levels">

**Risk Matrix**

| REQ ID | Impact (1–5) | Likelihood (1–5) | Risk score | Test levels |
|---|---|---|---|---|
| REQ-01 | 5 | 4 | 20 | unit, contract, e2e, perf |
| REQ-03 | 5 | 3 | 15 | unit, contract, e2e, perf |
| REQ-02 | 5 | 2 | 10 | unit, contract, e2e |
| REQ-04 | 4 | 3 | 12 | unit, e2e |
| REQ-05 | 3 | 2 | 6 | unit, e2e |

</div>

<div id="test_levels_table" data-label="Test Levels" data-columns="Level|Tool|Owner|Scope">

**Test Levels**

| Level | Tool | Owner | Scope |
|---|---|---|---|
| Unit | JUnit, Jest, XCTest | Engineers | All code |
| Contract | Pact, schema registry | QA + engineers | IF-01..IF-08 |
| End-to-end | Playwright, XCUITest, Espresso | QA | Journeys JNY-01..04 |
| Performance | k6 | QA + SRE | NFR-01, NFR-03, NFR-06 |

</div>

<div id="environments_table" data-label="Environments" data-columns="Environment|Purpose|Data">

**Environments**

| Environment | Purpose | Data |
|---|---|---|
| int | Contract and integration | Synthetic |
| staging | End-to-end and performance | Masked production copy, 3 pilot stores |
| pilot stores | Store trial | Real stock |

</div>

<div id="test_data_table" data-label="Test Data" data-columns="Data set|Source|Masking">

**Test Data**

| Data set | Source | Masking |
|---|---|---|
| 12 stores with stock profiles | Generated | n/a |
| Shopper accounts | Synthetic | Phone and email synthetic |

</div>

<div id="entry_exit_table" data-label="Entry &amp; Exit Criteria" data-columns="Criterion|Type (entry / exit)|Threshold">

**Entry & Exit Criteria**

| Criterion | Type (entry / exit) | Threshold |
|---|---|---|
| Contracts approved | entry | 4 / 4 |
| Must stories pass | exit | 100% |
| No open sev-1 / sev-2 defects | exit | 0 |
| Performance budget met | exit | NFR-01, NFR-03 |

</div>

<div id="traceability_table" data-label="REQ → Test Level" data-columns="REQ ID|Levels|TC count">

**REQ → Test Level**

| REQ ID | Levels | TC count |
|---|---|---|
| REQ-01 | unit, contract, e2e, perf | 4 |
| REQ-02 | unit, contract, e2e | 2 |
| REQ-03 | unit, contract, e2e, perf | 2 |
| REQ-04 | unit, e2e | 2 |
| REQ-05 | unit, e2e | 1 |
| REQ-06 | unit, e2e | 1 |
| REQ-07 | unit, e2e | 1 |

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
| QA Lead | Grace Kim | 2026-09-17 | Approved |

</div>

