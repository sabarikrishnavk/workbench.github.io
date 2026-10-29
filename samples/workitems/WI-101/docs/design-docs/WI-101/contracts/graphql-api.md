---
artifact: A-SDL
title: GraphQL subgraph schema
work_item: "WI-101"
version: 1
approved: 2026-09-17
status: approved
template: templates/artifacts/A-SDL.md
doc: docs/design-docs/WI-101/contracts/graphql-api.md
definition: contracts/graphql/WI-101/schema.graphql
format: GraphQL SDL (Federation 2)
produced_by: GQL-01 /design-subgraph-schema (graphql-agent)
inputs: [A-PLAN, A-INTCAT, A-DATAMODEL]
context: [A-SCREENS]
approvers: [Auto (gates)]
emits: sdl.approved
---

# GraphQL subgraph schema: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

New fulfilment subgraph. It owns Store and StoreAvailability and extends Product with pickupAvailability. Sources are inventory-service REST and store-locator gRPC, never another GraphQL service.

<div id="types_table" data-label="Types &amp; Fields" data-columns="Type|Field|Field type|Nullable|Description|Source (REST / gRPC op)">

**Types & Fields**

| Type | Field | Field type | Nullable | Description | Source (REST / gRPC op) |
|---|---|---|---|---|---|
| StoreAvailability | store | Store! | N | Store the row is for | IF-07 NearestStores |
| StoreAvailability | status | AvailabilityStatus! | N | IN_STOCK, LOW, OUT, UNKNOWN | IF-02 getAvailability |
| StoreAvailability | quantity | Int | Y | Hidden when UNKNOWN | IF-02 getAvailability |
| Product | pickupAvailability(near: GeoInput!, first: Int = 5) | [StoreAvailability!]! | N | Nearest stores with stock | IF-02 + IF-07 |

</div>

<div id="entities_table" data-label="Federated Entities" data-columns="Entity|@key|Owning subgraph|Contributing subgraphs">

**Federated Entities**

| Entity | @key | Owning subgraph | Contributing subgraphs |
|---|---|---|---|
| Store | storeId | fulfilment | — |
| Product | sku | catalog | fulfilment |

</div>

<div id="operations_table" data-label="Queries &amp; Mutations" data-columns="Operation|Type|Arguments|Returns|Screen / STY">

**Queries & Mutations**

| Operation | Type | Arguments | Returns | Screen / STY |
|---|---|---|---|---|
| storeAvailability | query | sku, near, first | [StoreAvailability!]! | SCR-01, SCR-04, SCR-06 |
| setPreferredStore | mutation | storeId | Store! | SCR-02 / STY-04 |

</div>

<div id="deprecations_table" data-label="Deprecations" data-columns="Field|Reason|Replacement|Removal date">

**Deprecations**

| Field | Reason | Replacement | Removal date |
|---|---|---|---|
| None | — | — | — |

</div>

<div id="definition_block" data-label="GraphQL SDL (Federation 2)" data-format="graphql" data-src="contracts/graphql/WI-101/schema.graphql">

**GraphQL SDL (Federation 2)**

```graphql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.5", import: ["@key", "@external"])

type Store @key(fields: "storeId") {
  storeId: ID!
  name: String!
  distanceKm: Float
}

enum AvailabilityStatus { IN_STOCK LOW OUT UNKNOWN }

type StoreAvailability {
  store: Store!
  status: AvailabilityStatus!
  quantity: Int
  asOf: String!
}

type Product @key(fields: "sku") {
  sku: ID! @external
  pickupAvailability(near: GeoInput!, first: Int = 5): [StoreAvailability!]!
}

input GeoInput { lat: Float!, lng: Float! }

type Query { storeAvailability(sku: ID!, near: GeoInput!, first: Int = 5): [StoreAvailability!]! }
type Mutation { setPreferredStore(storeId: ID!): Store! }
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| CON-GQL-FUL | REALISES IF-01 | A-INTCAT |
| Query.storeAvailability | RESOLVED_FROM OP-getAvailability | A-OPENAPI |
| Product.pickupAvailability | RESOLVED_FROM OP-getAvailability | A-OPENAPI |

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

