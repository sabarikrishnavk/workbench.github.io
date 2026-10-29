---
artifact: A-PLAN
title: Engineering work breakdown
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-PLAN.md
doc: docs/exec-plans/active/{wi}/plan.md
definition: docs/exec-plans/active/{wi}/plan.json
format: JSON + Jira import CSV
produced_by: SA-03 /plan-work (solution-architect-agent)
inputs: [A-SAD, A-STORIES, A-INTCAT, A-DATAMODEL]
context: [A-NFR, A-KDD, A-TECHDEBT]
approvers: [Engineering Manager]
emits: plan.approved
---

# Engineering work breakdown: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-PLAN.md -->

<h2 id="goal_details" data-label="Goal">Goal</h2>

<!-- What this work item delivers and how we'll know -->

<div id="tasks_table" data-label="Tasks" data-columns="TSK ID|Persona|Task|STY refs|IF refs|Depends on|Estimate">

**Tasks**

| TSK ID | Persona | Task | STY refs | IF refs | Depends on | Estimate |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="contract_first_order_table" data-label="Contract-first Order" data-columns="Order|Contract|Owner|Due">

**Contract-first Order**

| Order | Contract | Owner | Due |
|---|---|---|---|
| | | | |

</div>

<div id="critical_path_table" data-label="Critical Path" data-columns="Step|TSK ID|Duration">

**Critical Path**

| Step | TSK ID | Duration |
|---|---|---|
| | | |

</div>

<div id="scope_table" data-label="Channels &amp; Contracts in Scope" data-columns="Item|In scope (Y / N)|Skill to mark N/A">

**Channels & Contracts in Scope**

| Item | In scope (Y / N) | Skill to mark N/A |
|---|---|---|
| | | |

</div>

<div id="debt_repayment_table" data-label="Tech Debt Repayment" data-columns="Jira key|TSK ID|Release">

**Tech Debt Repayment**

| Jira key | TSK ID | Release |
|---|---|---|
| | | |

</div>

<div id="progress_log_table" data-label="Progress Log" data-columns="Date|Update|By">

**Progress Log**

| Date | Update | By |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="Plan definition (Jira import)" data-format="json" data-src="docs/exec-plans/active/{wi}/plan.json">

**Plan definition (Jira import)**

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

