---
artifact: A-OPSREPORT
title: Operations report
work_item: "WI-101"
version: 1
approved: 2026-10-21
status: approved
template: templates/artifacts/A-OPSREPORT.md
doc: docs/reliability/WI-101/ops-report.md
definition: docs/reliability/WI-101/ops-report.json
format: Markdown + JSON
produced_by: SRE-05 /operate-and-report (sre-agent)
inputs: [A-DEPLOYREC, A-OBS]
context: [A-RUNBOOK]
approvers: [SRE Lead]
emits: ops.reported
---

# Operations report: WI-101

<h2 id="executive_summary_details" data-label="Executive Summary">Executive Summary</h2>

Two weeks after launch: three of four SLOs met. SLO-04 (stock freshness) missed its target because of INC-2041, a store WAN outage. Stale stores were hidden as designed, so no oversell occurred.

<div id="slo_attainment_table" data-label="SLO Attainment" data-columns="SLO|Target|Actual|Budget burned %">

**SLO Attainment**

| SLO | Target | Actual | Budget burned % |
|---|---|---|---|
| SLO-01 | 99.9 | 99.96 | 31 |
| SLO-02 | 99.95 | 99.98 | 22 |
| SLO-03 | 95 | 96.2 | 76 |
| SLO-04 | 99 | 98.4 | 160 |

</div>

<div id="incidents_table" data-label="Incidents" data-columns="Incident|Severity|Duration|SLO impact|Postmortem link">

**Incidents**

| Incident | Severity | Duration | SLO impact | Postmortem link |
|---|---|---|---|---|
| INC-2041 | SEV-3 | 38 min | SLO-04 budget exhausted | pm://INC-2041 |

</div>

<div id="cost_table" data-label="Cost" data-columns="Item|Baseline|Actual|Delta">

**Cost**

| Item | Baseline | Actual | Delta |
|---|---|---|---|
| Redis cluster | $0 | $2,140 / month | +$2,140 |
| Carrier shipping (pickup-eligible orders) | $412k / 2 weeks | $371k / 2 weeks | −$41k |

</div>

<div id="toil_table" data-label="Toil" data-columns="Task|Hours / week|Automation candidate">

**Toil**

| Task | Hours / week | Automation candidate |
|---|---|---|
| Reconcile OMS and inventory reservations (PLAT-1423) | 3 | Y |
| Update SMS templates in code (PLAT-1424) | 0.5 | Y |

</div>

<div id="follow_ups_table" data-label="Follow-up Actions" data-columns="Action|Owner|Due">

**Follow-up Actions**

| Action | Owner | Due |
|---|---|---|
| ACT-01 Show per-store staleness | Fulfilment team | 2026-11-06 |
| ACT-02 Buffer POS events on store gateway | Store tech | 2026-11-13 |

</div>

<div id="definition_block" data-label="Report data" data-format="json" data-src="docs/reliability/WI-101/ops-report.json">

**Report data**

```json
{
  "artifact": "A-OPSREPORT",
  "workItem": "WI-101",
  "version": 1,
  "incidents": [
    {
      "id": "INC-2041",
      "name": "Stock lag in 14 stores during network outage",
      "severity": "SEV-3",
      "breached": [
        "SLO-04"
      ]
    }
  ],
  "actions": [
    {
      "id": "ACT-01",
      "name": "Show per-store staleness on the store selector",
      "follows": [
        "INC-2041"
      ]
    },
    {
      "id": "ACT-02",
      "name": "Buffer POS events on the in-store gateway during WAN loss",
      "follows": [
        "INC-2041"
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
| INC-2041 | BREACHED SLO-04 | A-OBS |

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
| SRE Lead | Lucas Brandt | 2026-10-21 | Approved |

</div>

