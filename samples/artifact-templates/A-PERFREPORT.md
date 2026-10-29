---
artifact: A-PERFREPORT
title: Performance & resilience report
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-PERFREPORT.md
doc: docs/quality/{wi}/perf-report.md
definition: docs/quality/{wi}/perf.json
format: JSON
produced_by: QA-05 /test-performance (qa-agent)
inputs: [A-NFR, A-APIPR, A-GQLPR]
context: [A-EVTPR]
approvers: [SRE Lead]
emits: perf.verdict
---

# Performance & resilience report: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-PERFREPORT.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="load_profile_table" data-label="Load Profile" data-columns="Scenario|Users / rps|Duration|Mix">

**Load Profile**

| Scenario | Users / rps | Duration | Mix |
|---|---|---|---|
| | | | |

</div>

<div id="results_table" data-label="Results vs NFR" data-columns="Operation|p95 target|p95 actual|p99 target|p99 actual|Error %|Pass">

**Results vs NFR**

| Operation | p95 target | p95 actual | p99 target | p99 actual | Error % | Pass |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="saturation_table" data-label="Saturation" data-columns="Resource|Peak %|Limit">

**Saturation**

| Resource | Peak % | Limit |
|---|---|---|
| | | |

</div>

<div id="chaos_table" data-label="Chaos Experiments" data-columns="Experiment|Dependency|Expected|Observed|Pass">

**Chaos Experiments**

| Experiment | Dependency | Expected | Observed | Pass |
|---|---|---|---|---|
| | | | | |

</div>

<div id="definition_block" data-label="Results data" data-format="json" data-src="docs/quality/{wi}/perf.json">

**Results data**

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

