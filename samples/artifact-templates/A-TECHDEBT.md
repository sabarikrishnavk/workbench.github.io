---
artifact: A-TECHDEBT
title: Tech debt tickets (Jira)
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-TECHDEBT.md
doc: docs/exec-plans/tech-debt/{wi}.md
definition: docs/exec-plans/tech-debt/{wi}.json
format: Jira issues via Jira MCP + JSON export
produced_by: TD-01 /raise-tech-debt (tech-debt-agent)
inputs: [A-KDD]
context: [A-PRD]
approvers: [Product Owner, Lead Solution Architect]
emits: techdebt.approved
---

# Tech debt tickets (Jira): {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-TECHDEBT.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- Which KDD dispensations this work item carries -->

<div id="tech_debt_tickets_table" data-label="Tech Debt Tickets" data-columns="Jira key|DSP ID|KDD ID|Compromise|Interest / quarter|Remediation|Estimate|Repay-by|Owner|Priority">

**Tech Debt Tickets**

| Jira key | DSP ID | KDD ID | Compromise | Interest / quarter | Remediation | Estimate | Repay-by | Owner | Priority |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

</div>

<div id="reviews_table" data-label="Reviews" data-columns="Jira key|Product Owner|Lead Solution Architect|Date">

**Reviews**

| Jira key | Product Owner | Lead Solution Architect | Date |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Jira export" data-format="json" data-src="docs/exec-plans/tech-debt/{wi}.json">

**Jira export**

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

