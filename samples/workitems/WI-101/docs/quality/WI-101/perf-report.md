---
artifact: A-PERFREPORT
title: Performance & resilience report
work_item: "WI-101"
version: 1
approved: 2026-10-05
status: approved
template: templates/artifacts/A-PERFREPORT.md
doc: docs/quality/WI-101/perf-report.md
definition: docs/quality/WI-101/perf.json
format: JSON
produced_by: QA-05 /test-performance (qa-agent)
inputs: [A-NFR, A-APIPR, A-GQLPR]
context: [A-EVTPR]
approvers: [SRE Lead]
emits: perf.verdict
---

# Performance & resilience report: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

k6 load and chaos tests on staging at 1.3× the holiday forecast.

<div id="load_profile_table" data-label="Load Profile" data-columns="Scenario|Users / rps|Duration|Mix">

**Load Profile**

| Scenario | Users / rps | Duration | Mix |
|---|---|---|---|
| Holiday peak | 2,400 rps | 60 min | 92% availability, 6% reservation, 2% collect |
| Spike | 0 → 3,000 rps in 60 s | 10 min | availability only |

</div>

<div id="results_table" data-label="Results vs NFR" data-columns="Operation|p95 target|p95 actual|p99 target|p99 actual|Error %|Pass">

**Results vs NFR**

| Operation | p95 target | p95 actual | p99 target | p99 actual | Error % | Pass |
|---|---|---|---|---|---|---|
| getAvailability | 150 | 118 | 300 | 241 | 0.02 | Y |
| createReservation | 200 | 171 | 400 | 362 | 0.05 | Y |
| Query.storeAvailability | 180 | 149 | 350 | 297 | 0.03 | Y |

</div>

<div id="saturation_table" data-label="Saturation" data-columns="Resource|Peak %|Limit">

**Saturation**

| Resource | Peak % | Limit |
|---|---|---|
| inventory-service CPU | 61% | 75% |
| Redis memory | 48% | 70% |
| Kafka consumer lag | 9 s | 60 s |

</div>

<div id="chaos_table" data-label="Chaos Experiments" data-columns="Experiment|Dependency|Expected|Observed|Pass">

**Chaos Experiments**

| Experiment | Dependency | Expected | Observed | Pass |
|---|---|---|---|---|
| Redis primary failover | stock cache | < 5 s errors | 3.1 s | Y |
| store-locator timeout | IF-07 | UNKNOWN status, page loads | as expected | Y |

</div>

<div id="definition_block" data-label="Results data" data-format="json" data-src="docs/quality/WI-101/perf.json">

**Results data**

```json
{
  "artifact": "A-PERFREPORT",
  "workItem": "WI-101",
  "version": 1,
  "perfResults": [
    {
      "id": "PERF-01",
      "name": "Availability lookup p95 ≤ 150 ms: p95 118 ms",
      "pass": "Y",
      "measures": [
        "NFR-01"
      ]
    },
    {
      "id": "PERF-02",
      "name": "Reservation p99 ≤ 400 ms: p99 362 ms",
      "pass": "Y",
      "measures": [
        "NFR-03"
      ]
    },
    {
      "id": "PERF-03",
      "name": "Store stock age ≤ 60 s: p95 age 41 s",
      "pass": "Y",
      "measures": [
        "NFR-02"
      ]
    },
    {
      "id": "PERF-04",
      "name": "1,800 rps peak availability lookups: 2,400 rps sustained",
      "pass": "Y",
      "measures": [
        "NFR-06"
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
| PERF-01 | MEASURES NFR-01 | A-NFR |
| PERF-02 | MEASURES NFR-03 | A-NFR |
| PERF-03 | MEASURES NFR-02 | A-NFR |
| PERF-04 | MEASURES NFR-06 | A-NFR |

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
| SRE Lead | Lucas Brandt | 2026-10-05 | Approved |

</div>

