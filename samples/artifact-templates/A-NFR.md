---
artifact: A-NFR
title: NFR & SLO targets
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-NFR.md
doc: docs/design-docs/{wi}/11-nfr.md
definition: docs/design-docs/{wi}/11-nfr.yaml
format: YAML (nfr.schema.json)
produced_by: SA-02 /set-nfrs (solution-architect-agent)
inputs: [A-PRD, A-SAD]
context: []
approvers: [Lead Solution Architect]
emits: nfr.approved
---

# NFR & SLO targets: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-NFR.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="latency_table" data-label="Latency Targets" data-columns="Operation|p95 ms|p99 ms|REQ ref">

**Latency Targets**

| Operation | p95 ms | p99 ms | REQ ref |
|---|---|---|---|
| | | | |

</div>

<div id="availability_table" data-label="Availability &amp; Recovery" data-columns="Container|Availability %|RPO|RTO">

**Availability & Recovery**

| Container | Availability % | RPO | RTO |
|---|---|---|---|
| | | | |

</div>

<div id="throughput_table" data-label="Throughput &amp; Capacity" data-columns="Operation|Peak rps|Growth|Capacity plan">

**Throughput & Capacity**

| Operation | Peak rps | Growth | Capacity plan |
|---|---|---|---|
| | | | |

</div>

<div id="security_privacy_table" data-label="Security &amp; Privacy" data-columns="Area|Requirement|Classification|Control">

**Security & Privacy**

| Area | Requirement | Classification | Control |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="NFR definition" data-format="yaml" data-src="docs/design-docs/{wi}/11-nfr.yaml">

**NFR definition**

```yaml
# mirrors docs/design-docs/{wi}/11-nfr.yaml
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

