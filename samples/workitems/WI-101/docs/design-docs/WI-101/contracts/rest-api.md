---
artifact: A-OPENAPI
title: REST contract
work_item: "WI-101"
version: 1
approved: 2026-09-17
status: approved
template: templates/artifacts/A-OPENAPI.md
doc: docs/design-docs/WI-101/contracts/rest-api.md
definition: contracts/rest/WI-101/openapi.yaml
format: OpenAPI 3.1 YAML
produced_by: API-01 /design-openapi (rest-api-agent)
inputs: [A-PLAN, A-INTCAT, A-DATAMODEL]
context: [A-NFR]
approvers: [Auto (gates)]
emits: openapi.approved
---

# REST contract: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

REST contracts for inventory-service (availability and reservations) and the order-service collect endpoint.

<div id="operations_table" data-label="Operations" data-columns="Operation ID|Method|Path|Summary|IF ref|REQ refs|Idempotent">

**Operations**

| Operation ID | Method | Path | Summary | IF ref | REQ refs | Idempotent |
|---|---|---|---|---|---|---|
| getAvailability | GET | /v1/stores/{storeId}/availability | Availability for SKUs at a store | IF-02 | REQ-01 | Y |
| createReservation | POST | /v1/reservations | Create a soft reservation (15 min TTL) | IF-03 | REQ-03 | Y (Idempotency-Key) |
| releaseReservation | DELETE | /v1/reservations/{id} | Release stock | IF-03 | REQ-07 | Y |
| collectPickup | POST | /v1/pickups/{orderId}/collect | Mark collected | IF-08 | REQ-06 | Y |

</div>

<div id="schemas_table" data-label="Schemas" data-columns="Schema|Field|Type|Required|Source attribute">

**Schemas**

| Schema | Field | Type | Required | Source attribute |
|---|---|---|---|---|
| Availability | sku | string | Y | StoreInventory.sku |
| Availability | availableQty | integer | Y | StoreInventory.available |
| Availability | asOf | date-time | Y | StoreInventory.updatedAt |
| Reservation | reservationId | uuid | Y | Reservation.reservationId |
| Reservation | expiresAt | date-time | Y | Reservation.expiresAt |

</div>

<div id="errors_table" data-label="Error Model (RFC 9457)" data-columns="Status|Type URI|Title|When">

**Error Model (RFC 9457)**

| Status | Type URI | Title | When |
|---|---|---|---|
| 409 | /problems/insufficient-stock | Insufficient stock | Requested qty > available |
| 410 | /problems/reservation-expired | Reservation expired | TTL passed |
| 422 | /problems/invalid-collect-code | Invalid collect code | QR or code mismatch |

</div>

<div id="security_table" data-label="Security" data-columns="Scheme|Scopes|Operations">

**Security**

| Scheme | Scopes | Operations |
|---|---|---|
| oauth2 (client credentials) | inventory.read | getAvailability |
| oauth2 (client credentials) | inventory.reserve | createReservation, releaseReservation |
| oauth2 (device) | pickup.collect | collectPickup |

</div>

<div id="definition_block" data-label="OpenAPI 3.1" data-format="yaml" data-src="contracts/rest/WI-101/openapi.yaml">

**OpenAPI 3.1**

```yaml
openapi: 3.1.0
info: { title: inventory-service, version: 1.4.0 }
paths:
  /v1/stores/{storeId}/availability:
    get:
      operationId: getAvailability
      parameters:
        - { name: storeId, in: path, required: true, schema: { type: string } }
        - { name: sku, in: query, required: true, schema: { type: array, items: { type: string } } }
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/AvailabilityList' } } } }
  /v1/reservations:
    post:
      operationId: createReservation
      parameters: [ { name: Idempotency-Key, in: header, required: true, schema: { type: string } } ]
      responses:
        '201': { description: Created }
        '409': { description: Insufficient stock }
components:
  schemas:
    Availability:
      type: object
      required: [sku, availableQty, asOf]
      properties:
        sku: { type: string }
        availableQty: { type: integer, minimum: 0 }
        asOf: { type: string, format: date-time }
    AvailabilityList: { type: array, items: { $ref: '#/components/schemas/Availability' } }
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| CON-REST-INV | REALISES IF-02 | A-INTCAT |
| CON-REST-INV | REALISES IF-03 | A-INTCAT |
| CON-REST-ORD | REALISES IF-08 | A-INTCAT |

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

