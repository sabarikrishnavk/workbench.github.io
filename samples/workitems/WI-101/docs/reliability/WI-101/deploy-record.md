---
artifact: A-DEPLOYREC
title: Deployment record
work_item: "WI-101"
version: 1
approved: 2026-10-07
status: approved
template: templates/artifacts/A-DEPLOYREC.md
doc: docs/reliability/WI-101/deploy-record.md
definition: docs/reliability/WI-101/deploy.json
format: JSON
produced_by: SRE-04 /deploy-canary (sre-agent)
inputs: [A-RELEASE]
context: [A-OBS]
approvers: [Release Manager]
emits: deploy.completed
---

# Deployment record: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Release 2026.10.1 deployed on 2026-10-06/07. No rollbacks.

<div id="deployments_table" data-label="Deployments" data-columns="Step|Component|Version|Start|End|Result">

**Deployments**

| Step | Component | Version | Start | End | Result |
|---|---|---|---|---|---|
| 1 | inventory-service | 1.4.0 | 2026-10-06 07:00 | 08:40 | success |
| 2 | fulfilment-subgraph | 1.0.0 | 08:45 | 10:20 | success |
| 4 | order-service | 2.7.0 | 10:30 | 12:00 | success |
| 6 | storefront-web | 2026.10.1 | 2026-10-07 07:00 | 08:30 | success |

</div>

<div id="canary_analysis_table" data-label="Canary Analysis" data-columns="Step|Score|Threshold|Decision">

**Canary Analysis**

| Step | Score | Threshold | Decision |
|---|---|---|---|
| inventory-service 5% | 0.98 | 0.9 | promote |
| inventory-service 25% | 0.97 | 0.9 | promote |
| fulfilment-subgraph 25% | 0.96 | 0.9 | promote |

</div>

<div id="flag_states_table" data-label="Flag States" data-columns="Flag|State|Time">

**Flag States**

| Flag | State | Time |
|---|---|---|
| ful.pickupAvailability 10% | on | 2026-10-07 09:00 |
| ful.pickupAvailability 50% | on | 2026-10-08 09:00 |
| ful.pickupAvailability 100% | on | 2026-10-09 09:00 |

</div>

<div id="definition_block" data-label="Deployment data" data-format="json" data-src="docs/reliability/WI-101/deploy.json">

**Deployment data**

```json
{
  "artifact": "A-DEPLOYREC",
  "workItem": "WI-101",
  "version": 1,
  "deployments": [
    {
      "id": "DEP-2026-10-07",
      "name": "Production deployment 2026-10-07",
      "result": "success",
      "score": 0.97,
      "of": [
        "REL-2026.10.1"
      ]
    }
  ]
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| DEP-2026-10-07 | OF REL-2026.10.1 | A-RELEASE |

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
| Release Manager | Elena García | 2026-10-07 | Approved |

</div>

