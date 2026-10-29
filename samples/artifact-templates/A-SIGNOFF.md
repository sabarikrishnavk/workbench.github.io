---
artifact: A-SIGNOFF
title: Product acceptance
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-SIGNOFF.md
doc: docs/product-specs/{wi}/20-signoff.md
format: Markdown
produced_by: PM-04 /accept-release (pm-agent)
inputs: [A-TESTREPORT, A-PRD]
context: [A-PERFREPORT]
approvers: [Product Owner]
emits: release.accepted
---

# Product acceptance: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-SIGNOFF.md -->

<h2 id="executive_summary_details" data-label="Go-live Summary">Go-live Summary</h2>

<!-- write here -->

<div id="requirement_acceptance_table" data-label="Requirement Acceptance" data-columns="REQ ID|Requirement|Test coverage|Decision (accepted / deferred)|Reason">

**Requirement Acceptance**

| REQ ID | Requirement | Test coverage | Decision (accepted / deferred) | Reason |
|---|---|---|---|---|
| | | | | |

</div>

<div id="known_issues_table" data-label="Known Issues Accepted" data-columns="Defect|Severity|Workaround|Fix by">

**Known Issues Accepted**

| Defect | Severity | Workaround | Fix by |
|---|---|---|---|
| | | | |

</div>

<div id="go_live_decision_table" data-label="Go-live Decision" data-columns="Decision|Date|Conditions">

**Go-live Decision**

| Decision | Date | Conditions |
|---|---|---|
| | | |

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

