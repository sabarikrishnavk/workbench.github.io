---
artifact: A-MEMDELTA
title: Graph memory delta
work_item: "WI-101"
version: 1
approved: 2026-09-14
status: approved
template: templates/artifacts/A-MEMDELTA.md
doc: docs/generated/memory/WI-101/A-INTCAT@1.md
definition: docs/generated/memory/WI-101/A-INTCAT@1.delta.json
format: JSON (memory-delta.schema.json)
produced_by: MEM-01 /sync-graph-memory (memory-steward-agent)
inputs: []
context: []
approvers: [Auto (gates)]
emits: memory.synced
---

# Graph memory delta: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Example delta written by the memory steward when A-INTCAT v1 was approved on 2026-09-14. One delta is written per approved artifact version.

<div id="nodes_upserted_table" data-label="Nodes Upserted" data-columns="Type|ID|Properties|Provenance">

**Nodes Upserted**

| Type | ID | Properties | Provenance |
|---|---|---|---|
| Interface | IF-01 | pattern=GraphQL, sync=sync, sla=p95 180 ms | A-INTCAT@1 |
| Interface | IF-02 | pattern=REST, sync=sync, sla=p95 150 ms | A-INTCAT@1 |
| Interface | IF-03 | pattern=REST, sync=sync, sla=p99 400 ms | A-INTCAT@1 |
| Interface | IF-04 | pattern=Kafka, sync=async, sla=lag ≤ 60 s | A-INTCAT@1 |
| Interface | IF-05 | pattern=Kafka, sync=async, sla=lag ≤ 30 s | A-INTCAT@1 |
| Interface | IF-06 | pattern=Kafka, sync=async, sla=lag ≤ 60 s | A-INTCAT@1 |
| Interface | IF-07 | pattern=gRPC, sync=sync, sla=deadline 80 ms | A-INTCAT@1 |
| Interface | IF-08 | pattern=REST, sync=sync, sla=p95 300 ms | A-INTCAT@1 |
| Interface | IF-09 | pattern=REST, sync=sync, sla=vendor 99.5% | A-INTCAT@1 |

</div>

<div id="edges_upserted_table" data-label="Edges Upserted" data-columns="From|Relation|To">

**Edges Upserted**

| From | Relation | To |
|---|---|---|
| IF-01 | FROM | APP-FULSG |
| IF-01 | TO | APP-WEB |
| IF-02 | FROM | APP-INV |
| IF-02 | TO | APP-FULSG |
| IF-03 | FROM | APP-INV |
| IF-03 | TO | APP-ORD |
| IF-04 | FROM | APP-POS |
| IF-04 | TO | APP-INV |
| IF-05 | FROM | APP-ORD |
| IF-05 | TO | APP-OMS |
| IF-06 | FROM | APP-STORE |
| IF-06 | TO | APP-NOTIF |
| IF-07 | FROM | APP-LOC |
| IF-07 | TO | APP-FULSG |
| IF-08 | FROM | APP-ORD |
| IF-08 | TO | APP-STORE |
| IF-09 | FROM | APP-STORE |
| IF-09 | TO | APP-SMS |
| IF-01 | TO | APP-IOS |
| IF-01 | TO | APP-AND |
| IF-05 | TO | APP-STORE |
| IF-06 | TO | APP-ORD |

</div>

<div id="superseded_table" data-label="Superseded" data-columns="Type|ID|Old version|New version">

**Superseded**

| Type | ID | Old version | New version |
|---|---|---|---|
| None | — | — | — |

</div>

<div id="retracted_table" data-label="Retracted" data-columns="Type|ID|Reason">

**Retracted**

| Type | ID | Reason |
|---|---|---|
| None | — | — |

</div>

<div id="validation_table" data-label="Validation" data-columns="Check|Result">

**Validation**

| Check | Result |
|---|---|
| Every edge endpoint exists | pass |
| IDs match patterns (IF-nn) | pass |
| Provenance on every node | pass |
| Single writer (MEM-01) | pass |

</div>

<div id="definition_block" data-label="Delta" data-format="json" data-src="docs/generated/memory/WI-101/A-INTCAT@1.delta.json">

**Delta**

```json
{
  "artifact": "A-INTCAT",
  "version": 1,
  "workItem": "WI-101",
  "upsert": {
    "nodes": [
      {
        "id": "IF-01",
        "type": "Interface",
        "pattern": "GraphQL",
        "sync": "sync",
        "sla": "p95 180 ms"
      },
      {
        "id": "IF-02",
        "type": "Interface",
        "pattern": "REST",
        "sync": "sync",
        "sla": "p95 150 ms"
      },
      {
        "id": "IF-03",
        "type": "Interface",
        "pattern": "REST",
        "sync": "sync",
        "sla": "p99 400 ms"
      },
      {
        "id": "IF-04",
        "type": "Interface",
        "pattern": "Kafka",
        "sync": "async",
        "sla": "lag ≤ 60 s"
      },
      {
        "id": "IF-05",
        "type": "Interface",
        "pattern": "Kafka",
        "sync": "async",
        "sla": "lag ≤ 30 s"
      },
      {
        "id": "IF-06",
        "type": "Interface",
        "pattern": "Kafka",
        "sync": "async",
        "sla": "lag ≤ 60 s"
      },
      {
        "id": "IF-07",
        "type": "Interface",
        "pattern": "gRPC",
        "sync": "sync",
        "sla": "deadline 80 ms"
      },
      {
        "id": "IF-08",
        "type": "Interface",
        "pattern": "REST",
        "sync": "sync",
        "sla": "p95 300 ms"
      },
      {
        "id": "IF-09",
        "type": "Interface",
        "pattern": "REST",
        "sync": "sync",
        "sla": "vendor 99.5%"
      }
    ],
    "edges": [
      {
        "from": "IF-01",
        "rel": "FROM",
        "to": "APP-FULSG"
      },
      {
        "from": "IF-01",
        "rel": "TO",
        "to": "APP-WEB"
      },
      {
        "from": "IF-02",
        "rel": "FROM",
        "to": "APP-INV"
      },
      {
        "from": "IF-02",
        "rel": "TO",
        "to": "APP-FULSG"
      },
      {
        "from": "IF-03",
        "rel": "FROM",
        "to": "APP-INV"
      },
      {
        "from": "IF-03",
        "rel": "TO",
        "to": "APP-ORD"
      },
      {
        "from": "IF-04",
        "rel": "FROM",
        "to": "APP-POS"
      },
      {
        "from": "IF-04",
        "rel": "TO",
        "to": "APP-INV"
      },
      {
        "from": "IF-05",
        "rel": "FROM",
        "to": "APP-ORD"
      },
      {
        "from": "IF-05",
        "rel": "TO",
        "to": "APP-OMS"
      },
      {
        "from": "IF-06",
        "rel": "FROM",
        "to": "APP-STORE"
      },
      {
        "from": "IF-06",
        "rel": "TO",
        "to": "APP-NOTIF"
      },
      {
        "from": "IF-07",
        "rel": "FROM",
        "to": "APP-LOC"
      },
      {
        "from": "IF-07",
        "rel": "TO",
        "to": "APP-FULSG"
      },
      {
        "from": "IF-08",
        "rel": "FROM",
        "to": "APP-ORD"
      },
      {
        "from": "IF-08",
        "rel": "TO",
        "to": "APP-STORE"
      },
      {
        "from": "IF-09",
        "rel": "FROM",
        "to": "APP-STORE"
      },
      {
        "from": "IF-09",
        "rel": "TO",
        "to": "APP-SMS"
      },
      {
        "from": "IF-01",
        "rel": "TO",
        "to": "APP-IOS"
      },
      {
        "from": "IF-01",
        "rel": "TO",
        "to": "APP-AND"
      },
      {
        "from": "IF-05",
        "rel": "TO",
        "to": "APP-STORE"
      },
      {
        "from": "IF-06",
        "rel": "TO",
        "to": "APP-ORD"
      }
    ]
  },
  "retract": []
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| WI-101 | Work item | A-REQUEST |

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
| Auto (gates) | harness gates | 2026-09-14 | Approved |

</div>

