---
artifact: A-SIGNOFF
title: Product acceptance
work_item: "WI-101"
version: 1
approved: 2026-10-06
status: approved
template: templates/artifacts/A-SIGNOFF.md
doc: docs/product-specs/WI-101/20-signoff.md
format: Markdown
produced_by: PM-04 /accept-release (pm-agent)
inputs: [A-TESTREPORT, A-PRD]
context: [A-PERFREPORT]
approvers: [Product Owner]
emits: release.accepted
---

# Product acceptance: WI-101

<h2 id="executive_summary_details" data-label="Go-live Summary">Go-live Summary</h2>

Accepted for go-live on 2026-10-06. Seven requirements accepted; REQ-08 (substitutions, Could) deferred to WI-118.

<div id="requirement_acceptance_table" data-label="Requirement Acceptance" data-columns="REQ ID|Requirement|Test coverage|Decision (accepted / deferred)|Reason">

**Requirement Acceptance**

| REQ ID | Requirement | Test coverage | Decision (accepted / deferred) | Reason |
|---|---|---|---|---|
| REQ-01 | Show real-time pickup availability for the 5 nearest stores on the product page | Covered, passing | accepted | — |
| REQ-02 | Offer store pickup as a fulfilment option at checkout and take payment online | Covered, passing | accepted | — |
| REQ-03 | Reserve the stock in the chosen store when the order is placed | Covered, passing | accepted | — |
| REQ-04 | Route the order to the store queue with a 2-hour ready target | Covered, passing | accepted | — |
| REQ-05 | Notify the shopper when the order is ready (push, email, SMS) | Covered, passing | accepted | — |
| REQ-06 | Hand over the order with a QR code or order number | Covered, passing | accepted | — |
| REQ-07 | Cancel and refund orders not collected within 5 days | Covered, passing | accepted | — |
| REQ-08 | Offer a substitute when an item is missing at pick | None (deferred) | deferred | Could; moved to WI-118 |

</div>

<div id="known_issues_table" data-label="Known Issues Accepted" data-columns="Defect|Severity|Workaround|Fix by">

**Known Issues Accepted**

| Defect | Severity | Workaround | Fix by |
|---|---|---|---|
| DEF-314 | minor | Associate types the 8-character code | 2026.10.2 |

</div>

<div id="go_live_decision_table" data-label="Go-live Decision" data-columns="Decision|Date|Conditions">

**Go-live Decision**

| Decision | Date | Conditions |
|---|---|---|
| Go | 2026-10-06 | Ramp flags 10% → 50% → 100% over 3 days |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| ACC-01 | ACCEPTS REQ-01 | A-PRD |
| ACC-02 | ACCEPTS REQ-02 | A-PRD |
| ACC-03 | ACCEPTS REQ-03 | A-PRD |
| ACC-04 | ACCEPTS REQ-04 | A-PRD |
| ACC-05 | ACCEPTS REQ-05 | A-PRD |
| ACC-06 | ACCEPTS REQ-06 | A-PRD |
| ACC-07 | ACCEPTS REQ-07 | A-PRD |
| ACC-08 | ACCEPTS REQ-08 | A-PRD |

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
| Product Owner | Priya Raman | 2026-10-06 | Approved |

</div>

