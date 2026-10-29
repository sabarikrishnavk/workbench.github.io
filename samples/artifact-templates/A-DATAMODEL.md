---
artifact: A-DATAMODEL
title: Data model
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-DATAMODEL.md
doc: docs/design-docs/{wi}/12-data-model.md
definition: docs/design-docs/{wi}/12-data-model.dbml
format: DBML + JSON
produced_by: DA-01 /model-data (data-architect-agent)
inputs: [A-PRD, A-SAD]
context: [A-SCREENS, A-KDD]
approvers: [Data Governance Lead]
emits: datamodel.approved
---

# Data model: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-DATAMODEL.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="erd_block" data-label="Entity relationship diagram" data-format="mermaid">

**Entity relationship diagram**

```mermaid
flowchart LR
```

</div>

<div id="entities_table" data-label="Entities" data-columns="Entity|Description|System of record|Owner app">

**Entities**

| Entity | Description | System of record | Owner app |
|---|---|---|---|
| | | | |

</div>

<div id="attributes_table" data-label="Attributes" data-columns="Entity|Attribute|Type|Nullable|Key|Classification|Retention">

**Attributes**

| Entity | Attribute | Type | Nullable | Key | Classification | Retention |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="relationships_table" data-label="Relationships" data-columns="From|To|Cardinality|Notes">

**Relationships**

| From | To | Cardinality | Notes |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Data model (DBML)" data-format="dbml" data-src="docs/design-docs/{wi}/12-data-model.dbml">

**Data model (DBML)**

```dbml
# mirrors docs/design-docs/{wi}/12-data-model.dbml
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

