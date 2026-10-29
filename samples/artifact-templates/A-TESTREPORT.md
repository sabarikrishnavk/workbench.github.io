---
artifact: A-TESTREPORT
title: Test execution report
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-TESTREPORT.md
doc: docs/quality/{wi}/test-report.md
definition: docs/quality/{wi}/report.json
format: JSON + HTML
produced_by: QA-04 /execute-and-verdict (qa-agent)
inputs: [A-AUTOTESTS, A-WEBPR, A-IOSPR, A-ANDPR, A-APIPR, A-GQLPR, A-EVTPR]
context: [A-UILIB]
approvers: [QA Lead]
emits: qa.verdict
---

# Test execution report: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-TESTREPORT.md -->

<h2 id="executive_summary_details" data-label="Verdict">Verdict</h2>

<!-- GO or NO-GO, and why -->

<div id="results_by_level_table" data-label="Results by Level" data-columns="Level|Executed|Passed|Failed|Skipped|Pass %">

**Results by Level**

| Level | Executed | Passed | Failed | Skipped | Pass % |
|---|---|---|---|---|---|
| | | | | | |

</div>

<div id="defects_table" data-label="Defects" data-columns="Defect|Severity|TC ID|REQ ID|Status">

**Defects**

| Defect | Severity | TC ID | REQ ID | Status |
|---|---|---|---|---|
| | | | | |

</div>

<div id="requirement_coverage_table" data-label="Requirement Coverage" data-columns="REQ ID|TCs|Passing|Coverage %">

**Requirement Coverage**

| REQ ID | TCs | Passing | Coverage % |
|---|---|---|---|
| | | | |

</div>

<div id="flaky_tests_table" data-label="Flaky Tests" data-columns="Test|Failure rate|Ticket">

**Flaky Tests**

| Test | Failure rate | Ticket |
|---|---|---|
| | | |

</div>

<div id="exit_criteria_table" data-label="Exit Criteria" data-columns="Criterion|Threshold|Actual|Met">

**Exit Criteria**

| Criterion | Threshold | Actual | Met |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Report data" data-format="json" data-src="docs/quality/{wi}/report.json">

**Report data**

```json
{}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| | | |

</div>

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

