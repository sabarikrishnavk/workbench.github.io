---
artifact: A-DEPLOYREC
title: Deployment record
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-DEPLOYREC.md
doc: docs/reliability/{wi}/deploy-record.md
definition: docs/reliability/{wi}/deploy.json
format: JSON
produced_by: SRE-04 /deploy-canary (sre-agent)
inputs: [A-RELEASE]
context: [A-OBS]
approvers: [Release Manager]
emits: deploy.completed
---

# Deployment record: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-DEPLOYREC.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="deployments_table" data-label="Deployments" data-columns="Step|Component|Version|Start|End|Result">

**Deployments**

| Step | Component | Version | Start | End | Result |
|---|---|---|---|---|---|
| | | | | | |

</div>

<div id="canary_analysis_table" data-label="Canary Analysis" data-columns="Step|Score|Threshold|Decision">

**Canary Analysis**

| Step | Score | Threshold | Decision |
|---|---|---|---|
| | | | |

</div>

<div id="flag_states_table" data-label="Flag States" data-columns="Flag|State|Time">

**Flag States**

| Flag | State | Time |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="Deployment data" data-format="json" data-src="docs/reliability/{wi}/deploy.json">

**Deployment data**

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

