---
artifact: A-NFR
title: NFR & SLO targets
work_item: "WI-101"
version: 1
approved: 2026-09-11
status: approved
template: templates/artifacts/A-NFR.md
doc: docs/design-docs/WI-101/11-nfr.md
definition: docs/design-docs/WI-101/11-nfr.yaml
format: YAML (nfr.schema.json)
produced_by: SA-02 /set-nfrs (solution-architect-agent)
inputs: [A-PRD, A-SAD]
context: []
approvers: [Lead Solution Architect]
emits: nfr.approved
---

# NFR & SLO targets: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Latency, availability, throughput and privacy targets for the BOPIS operations, derived from the PRD NFR hints and holiday peak forecasts.

<div id="latency_table" data-label="Latency Targets" data-columns="Operation|p95 ms|p99 ms|REQ ref">

**Latency Targets**

| Operation | p95 ms | p99 ms | REQ ref |
|---|---|---|---|
| getAvailability (NFR-01) | 150 | 300 | REQ-01 |
| createReservation (NFR-03) | 200 | 400 | REQ-03 |
| Query.storeAvailability | 180 | 350 | REQ-01 |

</div>

<div id="availability_table" data-label="Availability &amp; Recovery" data-columns="Container|Availability %|RPO|RTO">

**Availability & Recovery**

| Container | Availability % | RPO | RTO |
|---|---|---|---|
| CTR-01 inventory-service API | 99.95 | 0 (cache rebuilt from Kafka) | 15 min |
| CTR-04 fulfilment-subgraph | 99.9 | n/a | 15 min |
| CTR-05 pickup orchestrator | 99.9 | 5 min | 30 min |

</div>

<div id="throughput_table" data-label="Throughput &amp; Capacity" data-columns="Operation|Peak rps|Growth|Capacity plan">

**Throughput & Capacity**

| Operation | Peak rps | Growth | Capacity plan |
|---|---|---|---|
| getAvailability | 1,800 | 25% YoY | 6 pods, Redis 3 shards |
| createReservation | 120 | 25% YoY | 3 pods |

</div>

<div id="security_privacy_table" data-label="Security &amp; Privacy" data-columns="Area|Requirement|Classification|Control">

**Security & Privacy**

| Area | Requirement | Classification | Control |
|---|---|---|---|
| Shopper contact | Phone and email never leave order-service unmasked | Confidential | Field-level masking in logs (NFR-05) |
| API access | Channel calls go through the router with shopper JWT | Internal | OAuth2 scopes |

</div>

<div id="definition_block" data-label="NFR definition" data-format="yaml" data-src="docs/design-docs/WI-101/11-nfr.yaml">

**NFR definition**

```yaml
nfr:
  workItem: WI-101
  latency:
    - { id: NFR-01, operation: getAvailability, p95_ms: 150, p99_ms: 300 }
    - { id: NFR-03, operation: createReservation, p95_ms: 200, p99_ms: 400 }
  freshness:
    - { id: NFR-02, data: StoreInventory, max_age_s: 60 }
  availability:
    - { id: NFR-04, container: CTR-05, target: 99.9 }
  throughput:
    - { id: NFR-06, operation: getAvailability, peak_rps: 1800 }
  privacy:
    - { id: NFR-05, attributes: [Customer.phone, Customer.email], classification: Confidential }
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| NFR-01 | CONSTRAINS OP-getAvailability | A-OPENAPI |
| NFR-01 | TRACES_TO REQ-01 | A-PRD |
| NFR-02 | CONSTRAINS OP-getAvailability | A-OPENAPI |
| NFR-02 | TRACES_TO REQ-01 | A-PRD |
| NFR-03 | CONSTRAINS OP-createReservation | A-OPENAPI |
| NFR-03 | TRACES_TO REQ-03 | A-PRD |
| NFR-04 | CONSTRAINS OP-createReservation | A-OPENAPI |
| NFR-04 | TRACES_TO REQ-02 | A-PRD |
| NFR-05 | CONSTRAINS OP-collectPickup | A-OPENAPI |
| NFR-05 | TRACES_TO REQ-05 | A-PRD |
| NFR-06 | CONSTRAINS OP-getAvailability | A-OPENAPI |
| NFR-06 | TRACES_TO REQ-01 | A-PRD |

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
| Lead Solution Architect | Arjun Mehta | 2026-09-11 | Approved |

</div>

