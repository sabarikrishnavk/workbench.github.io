---
artifact: A-EVENTS
title: Event contracts
work_item: "WI-101"
version: 1
approved: 2026-09-17
status: approved
template: templates/artifacts/A-EVENTS.md
doc: docs/design-docs/WI-101/contracts/events.md
definition: contracts/events/WI-101/events.avsc
format: Avro (.avsc) + AsyncAPI 3
produced_by: EVT-01 /design-events (kafka-agent)
inputs: [A-PLAN, A-INTCAT, A-DATAMODEL]
context: []
approvers: [Auto (gates)]
emits: events.approved
---

# Event contracts: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Three Kafka topics: store stock changes from POS, and the pickup order placed and ready events.

<div id="topics_table" data-label="Topics" data-columns="Topic|Partition key|Partitions|Retention|Compatibility">

**Topics**

| Topic | Partition key | Partitions | Retention | Compatibility |
|---|---|---|---|---|
| pos.inventory.changed.v1 | storeId:sku | 48 | 7 days (compacted) | BACKWARD |
| order.pickup.placed.v1 | orderId | 12 | 14 days | BACKWARD |
| order.pickup.ready.v1 | orderId | 12 | 14 days | BACKWARD |

</div>

<div id="schemas_table" data-label="Event Schemas" data-columns="Subject|Field|Type|Default|Doc">

**Event Schemas**

| Subject | Field | Type | Default | Doc |
|---|---|---|---|---|
| PosInventoryChanged | storeId | string | — | Store number |
| PosInventoryChanged | sku | string | — | SKU |
| PosInventoryChanged | qtyOnHand | int | — | Absolute on-hand count |
| PickupOrderPlaced | orderId | string | — | Order number |
| PickupOrderReady | readyAt | timestamp-millis | — | Staged time |

</div>

<div id="headers_table" data-label="Headers" data-columns="Header|Purpose|Example">

**Headers**

| Header | Purpose | Example |
|---|---|---|
| traceparent | W3C trace context | 00-4bf9…-01 |
| event-id | Idempotency | 6f1c… |
| schema-version | Consumer routing | 1 |

</div>

<div id="producers_consumers_table" data-label="Producers &amp; Consumers" data-columns="Topic|Producer|Consumers|Delivery">

**Producers & Consumers**

| Topic | Producer | Consumers | Delivery |
|---|---|---|---|
| pos.inventory.changed.v1 | store-pos | inventory-service | at least once |
| order.pickup.placed.v1 | order-service | oms, store-associate-app | at least once |
| order.pickup.ready.v1 | store-associate-app | notification-service, order-service | at least once |

</div>

<div id="definition_block" data-label="Avro schema" data-format="json" data-src="contracts/events/WI-101/events.avsc">

**Avro schema**

```json
{
  "type": "record",
  "name": "PosInventoryChanged",
  "namespace": "com.harborpine.inventory",
  "fields": [
    {
      "name": "storeId",
      "type": "string"
    },
    {
      "name": "sku",
      "type": "string"
    },
    {
      "name": "qtyOnHand",
      "type": "int"
    },
    {
      "name": "changedAt",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      }
    }
  ]
}
```

</div>

<div id="asyncapi_block" data-label="AsyncAPI 3" data-format="yaml" data-src="contracts/events/WI-101/asyncapi.yaml">

**AsyncAPI 3**

```yaml
asyncapi: 3.0.0
info: { title: BOPIS events, version: 1.0.0 }
channels:
  posInventoryChanged: { address: pos.inventory.changed.v1, messages: { PosInventoryChanged: { $ref: '#/components/messages/PosInventoryChanged' } } }
  pickupPlaced: { address: order.pickup.placed.v1 }
  pickupReady: { address: order.pickup.ready.v1 }
operations:
  consumeStock: { action: receive, channel: { $ref: '#/channels/posInventoryChanged' } }
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| pos.inventory.changed.v1 | REALISES IF-04 | A-INTCAT |
| order.pickup.placed.v1 | REALISES IF-05 | A-INTCAT |
| order.pickup.ready.v1 | REALISES IF-06 | A-INTCAT |
| PosInventoryChanged | DESCRIBES StoreInventory | A-DATAMODEL |
| PickupOrderPlaced | DESCRIBES PickupOrder | A-DATAMODEL |
| PickupOrderReady | DESCRIBES PickupOrder | A-DATAMODEL |

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
| Auto (gates) | harness gates | 2026-09-17 | Approved |

</div>

