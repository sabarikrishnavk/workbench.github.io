---
artifact: A-OPSREPORT
title: Operations report
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-OPSREPORT.md
doc: docs/reliability/{wi}/ops-report.md
definition: docs/reliability/{wi}/ops-report.json
format: Markdown + JSON
produced_by: SRE-05 /operate-and-report (sre-agent)
inputs: [A-DEPLOYREC, A-OBS]
context: [A-RUNBOOK]
approvers: [SRE Lead]
emits: ops.reported
---

# Operations report: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-OPSREPORT.md -->

<h2 id="executive_summary_details" data-label="Executive Summary">Executive Summary</h2>

<!-- write here -->

<div id="slo_attainment_table" data-label="SLO Attainment" data-columns="SLO|Target|Actual|Budget burned %">

**SLO Attainment**

| SLO | Target | Actual | Budget burned % |
|---|---|---|---|
| | | | |

</div>

<div id="incidents_table" data-label="Incidents" data-columns="Incident|Severity|Duration|SLO impact|Postmortem link">

**Incidents**

| Incident | Severity | Duration | SLO impact | Postmortem link |
|---|---|---|---|---|
| | | | | |

</div>

<div id="cost_table" data-label="Cost" data-columns="Item|Baseline|Actual|Delta">

**Cost**

| Item | Baseline | Actual | Delta |
|---|---|---|---|
| | | | |

</div>

<div id="toil_table" data-label="Toil" data-columns="Task|Hours / week|Automation candidate">

**Toil**

| Task | Hours / week | Automation candidate |
|---|---|---|
| | | |

</div>

<div id="follow_ups_table" data-label="Follow-up Actions" data-columns="Action|Owner|Due">

**Follow-up Actions**

| Action | Owner | Due |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="Report data" data-format="json" data-src="docs/reliability/{wi}/ops-report.json">

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

