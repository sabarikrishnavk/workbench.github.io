---
artifact: A-TESTCASES
title: Test cases
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-TESTCASES.md
doc: docs/quality/{wi}/test-cases.md
definition: docs/quality/{wi}/features/*.feature
format: Gherkin .feature files
produced_by: QA-02 /design-test-cases (qa-agent)
inputs: [A-TESTPLAN, A-STORIES, A-SCREENS]
context: []
approvers: [QA Lead]
emits: testcases.approved
---

# Test cases: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-TESTCASES.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="scenarios_table" data-label="Scenarios" data-columns="TC ID|Feature|Scenario|Tags (@REQ @STY @channel)|Type (positive / negative / edge)">

**Scenarios**

| TC ID | Feature | Scenario | Tags (@REQ @STY @channel) | Type (positive / negative / edge) |
|---|---|---|---|---|
| | | | | |

</div>

<div id="test_data_tables_table" data-label="Test Data Tables" data-columns="TC ID|Data set|Values">

**Test Data Tables**

| TC ID | Data set | Values |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="Feature files" data-format="gherkin" data-src="docs/quality/{wi}/features/*.feature">

**Feature files**

```gherkin
# mirrors docs/quality/{wi}/features/*.feature
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

