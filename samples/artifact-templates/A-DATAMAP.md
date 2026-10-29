---
artifact: A-DATAMAP
title: Data mapping & lineage
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-DATAMAP.md
doc: docs/design-docs/{wi}/14-data-mapping.md
definition: docs/design-docs/{wi}/DataMapping.xlsx
format: DataMappingRegistry .xlsx (data-mapping.html)
produced_by: DA-02 /map-lineage (data-architect-agent)
inputs: [A-DATAMODEL, A-INTCAT]
context: []
approvers: [Data Governance Lead]
emits: datamap.approved
---

# Data mapping & lineage: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-DATAMAP.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="datasets_table" data-label="Datasets" data-columns="Dataset ID|Name|Type (API / table / topic / file / screen)|Application|IF ref">

**Datasets**

| Dataset ID | Name | Type (API / table / topic / file / screen) | Application | IF ref |
|---|---|---|---|---|
| | | | | |

</div>

<div id="mappings_table" data-label="Source → Target Mappings" data-columns="Mapping ID|Source dataset.attribute|Target dataset.attribute|Transform|IF ref">

**Source → Target Mappings**

| Mapping ID | Source dataset.attribute | Target dataset.attribute | Transform | IF ref |
|---|---|---|---|---|
| | | | | |

</div>

<div id="events_table" data-label="Events" data-columns="Event|Topic|Payload dataset">

**Events**

| Event | Topic | Payload dataset |
|---|---|---|
| | | |

</div>

<h2 id="registry_export_details" data-label="Registry Export">Registry Export</h2>

<!-- Link the DataMappingRegistry workbook exported from data-mapping.html -->

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

