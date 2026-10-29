---
artifact: A-INTCAT
title: Integration catalog
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-INTCAT.md
doc: docs/design-docs/{wi}/13-integrations.md
definition: docs/design-docs/{wi}/13-integrations.json
format: JSON (Data mapping Flows)
produced_by: IA-01 /catalog-integrations (integration-architect-agent)
inputs: [A-SAD]
context: [A-DATAMODEL, A-KDD]
approvers: [Integration Architect Lead]
emits: intcat.approved
---

# Integration catalog: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-INTCAT.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- Scope of the integration change and the applications involved -->

<div id="landscape_block" data-label="Integration landscape" data-format="mermaid">

**Integration landscape**

```mermaid
flowchart LR
```

</div>

<div id="interfaces_table" data-label="Interfaces" data-columns="IF ID|Name|Pattern (REST / GraphQL / Kafka / gRPC)|Producer app|Consumer app|Sync / async|SLA|Spec file">

**Interfaces**

| IF ID | Name | Pattern (REST / GraphQL / Kafka / gRPC) | Producer app | Consumer app | Sync / async | SLA | Spec file |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

</div>

<div id="rest_apis_table" data-label="REST APIs" data-columns="IF ID|Service|Method|Path|Purpose|OpenAPI file|Version|Auth">

**REST APIs**

| IF ID | Service | Method | Path | Purpose | OpenAPI file | Version | Auth |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

</div>

<div id="graphql_operations_table" data-label="GraphQL Operations" data-columns="IF ID|Subgraph|Operation|Type (query / mutation)|Entities|SDL file|REST / gRPC source">

**GraphQL Operations**

| IF ID | Subgraph | Operation | Type (query / mutation) | Entities | SDL file | REST / gRPC source |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="kafka_events_table" data-label="Kafka Events" data-columns="IF ID|Topic|Key|Schema subject|Compatibility|Producer|Consumers">

**Kafka Events**

| IF ID | Topic | Key | Schema subject | Compatibility | Producer | Consumers |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="grpc_services_table" data-label="gRPC Services" data-columns="IF ID|Service|RPC|Proto file|Deadline ms">

**gRPC Services**

| IF ID | Service | RPC | Proto file | Deadline ms |
|---|---|---|---|---|
| | | | | |

</div>

<div id="integration_rules_table" data-label="Integration Rule Checks" data-columns="Rule|Result (pass / fail)|Interfaces|Notes">

**Integration Rule Checks**

| Rule | Result (pass / fail) | Interfaces | Notes |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Integration catalog definition (Data mapping Flows)" data-format="json" data-src="docs/design-docs/{wi}/13-integrations.json">

**Integration catalog definition (Data mapping Flows)**

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

