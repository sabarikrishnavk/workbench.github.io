---
artifact: A-DDL
title: Database migration
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-DDL.md
doc: docs/design-docs/{wi}/contracts/db-migrations.md
definition: db/migration/V__{wi}.sql
format: SQL (Flyway)
produced_by: DB-01 /write-migrations (database-agent)
inputs: [A-PLAN, A-DATAMODEL]
context: [A-NFR]
approvers: [DBA Lead]
emits: ddl.approved
---

# Database migration: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-DDL.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="migrations_table" data-label="Migrations" data-columns="Version|Phase (expand / contract)|Description|Reversible|Est. lock (s)">

**Migrations**

| Version | Phase (expand / contract) | Description | Reversible | Est. lock (s) |
|---|---|---|---|---|
| | | | | |

</div>

<div id="indexes_table" data-label="Indexes" data-columns="Table|Index|Columns|Reason">

**Indexes**

| Table | Index | Columns | Reason |
|---|---|---|---|
| | | | |

</div>

<div id="backfill_table" data-label="Backfill Plan" data-columns="Table|Rows|Batch size|Duration|Rollback">

**Backfill Plan**

| Table | Rows | Batch size | Duration | Rollback |
|---|---|---|---|---|
| | | | | |

</div>

<div id="definition_block" data-label="Migration SQL" data-format="sql" data-src="db/migration/V__{wi}.sql">

**Migration SQL**

```sql
# mirrors db/migration/V__{wi}.sql
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

