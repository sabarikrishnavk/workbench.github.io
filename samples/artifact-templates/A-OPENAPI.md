---
artifact: A-OPENAPI
title: REST contract
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-OPENAPI.md
doc: docs/design-docs/{wi}/contracts/rest-api.md
definition: contracts/rest/{wi}/openapi.yaml
format: OpenAPI 3.1 YAML
produced_by: API-01 /design-openapi (rest-api-agent)
inputs: [A-PLAN, A-INTCAT, A-DATAMODEL]
context: [A-NFR]
approvers: [Auto (gates)]
emits: openapi.approved
---

# REST contract: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-OPENAPI.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- Services and interfaces (IF IDs) this contract covers -->

<div id="operations_table" data-label="Operations" data-columns="Operation ID|Method|Path|Summary|IF ref|REQ refs|Idempotent">

**Operations**

| Operation ID | Method | Path | Summary | IF ref | REQ refs | Idempotent |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="schemas_table" data-label="Schemas" data-columns="Schema|Field|Type|Required|Source attribute">

**Schemas**

| Schema | Field | Type | Required | Source attribute |
|---|---|---|---|---|
| | | | | |

</div>

<div id="errors_table" data-label="Error Model (RFC 9457)" data-columns="Status|Type URI|Title|When">

**Error Model (RFC 9457)**

| Status | Type URI | Title | When |
|---|---|---|---|
| | | | |

</div>

<div id="security_table" data-label="Security" data-columns="Scheme|Scopes|Operations">

**Security**

| Scheme | Scopes | Operations |
|---|---|---|
| | | |

</div>

<div id="definition_block" data-label="OpenAPI 3.1" data-format="yaml" data-src="contracts/rest/{wi}/openapi.yaml">

**OpenAPI 3.1**

```yaml
# mirrors contracts/rest/{wi}/openapi.yaml
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

