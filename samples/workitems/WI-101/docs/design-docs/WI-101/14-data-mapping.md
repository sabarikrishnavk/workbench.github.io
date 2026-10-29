---
artifact: A-DATAMAP
title: Data mapping & lineage
work_item: "WI-101"
version: 1
approved: 2026-09-15
status: approved
template: templates/artifacts/A-DATAMAP.md
doc: docs/design-docs/WI-101/14-data-mapping.md
definition: docs/design-docs/WI-101/DataMapping.xlsx
format: DataMappingRegistry .xlsx (data-mapping.html)
produced_by: DA-02 /map-lineage (data-architect-agent)
inputs: [A-DATAMODEL, A-INTCAT]
context: []
approvers: [Data Governance Lead]
emits: datamap.approved
---

# Data mapping & lineage: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Source-to-target mappings from the POS stock event to the availability shown on screens, registered in the Data mapping registry.

<div id="datasets_table" data-label="Datasets" data-columns="Dataset ID|Name|Type (API / table / topic / file / screen)|Application|IF ref">

**Datasets**

| Dataset ID | Name | Type (API / table / topic / file / screen) | Application | IF ref |
|---|---|---|---|---|
| DS-01 | POS stock change event | topic | store-pos | IF-04 |
| DS-02 | store_inventory | table | inventory-service | — |
| DS-03 | Availability API response | API | inventory-service | IF-02 |
| DS-04 | StoreAvailability | API | fulfilment-subgraph | IF-01 |
| DS-05 | Pickup placed event | topic | order-service | IF-05 |

</div>

<div id="mappings_table" data-label="Source → Target Mappings" data-columns="Mapping ID|Source dataset.attribute|Target dataset.attribute|Transform|IF ref">

**Source → Target Mappings**

| Mapping ID | Source dataset.attribute | Target dataset.attribute | Transform | IF ref |
|---|---|---|---|---|
| MAP-01 | DS-01.qtyOnHand | DS-02.on_hand | Copy; available = on_hand − reserved − 2 | IF-04 |
| MAP-02 | DS-02.available | DS-03.availableQty | Copy | IF-02 |
| MAP-03 | DS-03.availableQty | DS-04.status | ≥ 3 IN_STOCK, 1–2 LOW, 0 OUT; stale > 5 min → UNKNOWN | IF-01 |

</div>

<div id="events_table" data-label="Events" data-columns="Event|Topic|Payload dataset">

**Events**

| Event | Topic | Payload dataset |
|---|---|---|
| pos.inventory.changed.v1 | pos.inventory.changed.v1 | DS-01 |
| order.pickup.placed.v1 | order.pickup.placed.v1 | DS-05 |

</div>

<h2 id="registry_export_details" data-label="Registry Export">Registry Export</h2>

Exported to DataMapping.xlsx (Data mapping registry, project BOPIS-WI-101): 5 datasets, 3 mappings, 2 events. Lineage: store-pos → inventory-service → fulfilment-subgraph → web / iOS / Android.

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| DS-01 | CARRIED_BY IF-04 | A-INTCAT |
| DS-03 | CARRIED_BY IF-02 | A-INTCAT |
| DS-04 | CARRIED_BY IF-01 | A-INTCAT |
| DS-05 | CARRIED_BY IF-05 | A-INTCAT |
| MAP-01 | SOURCE StoreInventory.onHand | A-DATAMODEL |
| MAP-01 | TARGET StoreInventory.available | A-DATAMODEL |
| MAP-02 | SOURCE StoreInventory.available | A-DATAMODEL |
| MAP-02 | TARGET PickupOrder.status | A-DATAMODEL |
| MAP-03 | SOURCE StoreInventory.updatedAt | A-DATAMODEL |
| MAP-03 | TARGET StoreInventory.available | A-DATAMODEL |

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
| Data Governance Lead | Sofia Rossi | 2026-09-15 | Approved |

</div>

