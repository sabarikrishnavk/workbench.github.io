---
artifact: A-OBS
title: Observability & SLOs as code
work_item: "WI-101"
version: 1
approved: 2026-09-25
status: approved
template: templates/artifacts/A-OBS.md
doc: docs/reliability/WI-101/slo.md
definition: docs/reliability/WI-101/slo.yaml
format: OpenSLO YAML + dashboard JSON
produced_by: SRE-01 /define-slos (sre-agent)
inputs: [A-NFR, A-SAD]
context: [A-JOURNEY]
approvers: [SRE Lead]
emits: slo.approved
---

# Observability & SLOs as code: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Four SLOs protecting the shopper and associate journeys, with multi-window burn-rate alerts.

<div id="slis_table" data-label="SLIs" data-columns="SLI|Journey|Query|Good events|Valid events">

**SLIs**

| SLI | Journey | Query | Good events | Valid events |
|---|---|---|---|---|
| Good availability lookups | JNY-01, JNY-02 | http_requests{route=getAvailability,code<500,le=0.15} | ≤ 150 ms and not 5xx | all lookups |
| Reservation success | JNY-01, JNY-02 | reservations_total{result!=error} | not error | all reservations |
| Ready within 2 h | JNY-03 | pickup_ready_minutes ≤ 120 | ready ≤ 120 min | all pickup orders |
| Stock freshness | JNY-01 | cdc_apply_lag_seconds ≤ 60 | ≤ 60 s | all stock events |

</div>

<div id="slos_table" data-label="SLOs" data-columns="SLO|SLI|Target %|Window|Error budget">

**SLOs**

| SLO | SLI | Target % | Window | Error budget |
|---|---|---|---|---|
| SLO-01 | Good availability lookups | 99.9 | 28d | 40 min |
| SLO-02 | Reservation success | 99.95 | 28d | 20 min |
| SLO-03 | Ready within 2 h | 95 | 28d | 5% of orders |
| SLO-04 | Stock freshness | 99 | 28d | 1% of events |

</div>

<div id="alerts_table" data-label="Burn-rate Alerts" data-columns="Alert|SLO|Windows|Burn rate|Severity|Runbook section">

**Burn-rate Alerts**

| Alert | SLO | Windows | Burn rate | Severity | Runbook section |
|---|---|---|---|---|---|
| ALR-01 | SLO-01 | 1h / 5m | 14.4 | page | RB-01 |
| ALR-02 | SLO-01 | 6h / 30m | 6 | ticket | RB-01 |
| ALR-03 | SLO-02 | 1h / 5m | 14.4 | page | RB-02 |
| ALR-04 | SLO-04 | 10m | n/a | page | RB-03 |
| ALR-05 | SLO-03 | 6h / 30m | 6 | ticket | RB-04 |

</div>

<div id="dashboards_table" data-label="Dashboards" data-columns="Dashboard|Panels|Link">

**Dashboards**

| Dashboard | Panels | Link |
|---|---|---|
| BOPIS overview | SLOs, burn, lag, ready time | grafana://d/bopis |
| Store stock freshness | Lag by store | grafana://d/bopis-cdc |

</div>

<div id="definition_block" data-label="OpenSLO definition" data-format="yaml" data-src="docs/reliability/WI-101/slo.yaml">

**OpenSLO definition**

```yaml
apiVersion: openslo/v1
kind: SLO
metadata: { name: slo-01-availability-lookups }
spec:
  service: inventory-service
  indicator:
    spec:
      ratioMetric:
        good: { metricSource: { spec: { query: 'sum(rate(http_requests_total{route="getAvailability",code!~"5..",le="0.15"}[5m]))' } } }
        total: { metricSource: { spec: { query: 'sum(rate(http_requests_total{route="getAvailability"}[5m]))' } } }
  timeWindow: [ { duration: 28d, isRolling: true } ]
  objectives: [ { target: 0.999 } ]
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| SLO-01 | PROTECTS JNY-01 | A-JOURNEY |
| SLO-02 | PROTECTS JNY-02 | A-JOURNEY |
| SLO-03 | PROTECTS JNY-03 | A-JOURNEY |
| SLO-04 | PROTECTS JNY-01 | A-JOURNEY |
| SLO-01 | PROTECTS JNY-02 | A-JOURNEY |
| SLO-02 | PROTECTS JNY-01 | A-JOURNEY |

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
| SRE Lead | Lucas Brandt | 2026-09-25 | Approved |

</div>

