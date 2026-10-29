---
artifact: A-OBS
title: Observability & SLOs as code
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-OBS.md
doc: docs/reliability/{wi}/slo.md
definition: docs/reliability/{wi}/slo.yaml
format: OpenSLO YAML + dashboard JSON
produced_by: SRE-01 /define-slos (sre-agent)
inputs: [A-NFR, A-SAD]
context: [A-JOURNEY]
approvers: [SRE Lead]
emits: slo.approved
---

# Observability & SLOs as code: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-OBS.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="slis_table" data-label="SLIs" data-columns="SLI|Journey|Query|Good events|Valid events">

**SLIs**

| SLI | Journey | Query | Good events | Valid events |
|---|---|---|---|---|
| | | | | |

</div>

<div id="slos_table" data-label="SLOs" data-columns="SLO|SLI|Target %|Window|Error budget">

**SLOs**

| SLO | SLI | Target % | Window | Error budget |
|---|---|---|---|---|
| | | | | |

</div>

<div id="alerts_table" data-label="Burn-rate Alerts" data-columns="Alert|SLO|Windows|Burn rate|Severity|Runbook section">

**Burn-rate Alerts**

| Alert | SLO | Windows | Burn rate | Severity | Runbook section |
|---|---|---|---|---|---|
| | | | | | |

</div>

<div id="dashboards_table" data-label="Dashboards" data-columns="Dashboard|Panels|Link">

**Dashboards**

| Dashboard | Panels | Link |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="OpenSLO definition" data-format="yaml" data-src="docs/reliability/{wi}/slo.yaml">

**OpenSLO definition**

```yaml
# mirrors docs/reliability/{wi}/slo.yaml
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

