---
artifact: A-EVENTS
title: Event contracts
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-EVENTS.md
doc: docs/design-docs/{wi}/contracts/events.md
definition: contracts/events/{wi}/events.avsc
format: Avro (.avsc) + AsyncAPI 3
produced_by: EVT-01 /design-events (kafka-agent)
inputs: [A-PLAN, A-INTCAT, A-DATAMODEL]
context: []
approvers: [Auto (gates)]
emits: events.approved
---

# Event contracts: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-EVENTS.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- Topics and interfaces (IF IDs) this contract covers -->

<div id="topics_table" data-label="Topics" data-columns="Topic|Partition key|Partitions|Retention|Compatibility">

**Topics**

| Topic | Partition key | Partitions | Retention | Compatibility |
|---|---|---|---|---|
| | | | | |

</div>

<div id="schemas_table" data-label="Event Schemas" data-columns="Subject|Field|Type|Default|Doc">

**Event Schemas**

| Subject | Field | Type | Default | Doc |
|---|---|---|---|---|
| | | | | |

</div>

<div id="headers_table" data-label="Headers" data-columns="Header|Purpose|Example">

**Headers**

| Header | Purpose | Example |
|---|---|---|
| | | |

</div>

<div id="producers_consumers_table" data-label="Producers &amp; Consumers" data-columns="Topic|Producer|Consumers|Delivery">

**Producers & Consumers**

| Topic | Producer | Consumers | Delivery |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Avro schema" data-format="json" data-src="contracts/events/{wi}/events.avsc">

**Avro schema**

```json
{}
```

</div>

<div id="asyncapi_block" data-label="AsyncAPI 3" data-format="yaml" data-src="contracts/events/{wi}/asyncapi.yaml">

**AsyncAPI 3**

```yaml
# mirrors contracts/events/{wi}/asyncapi.yaml
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

