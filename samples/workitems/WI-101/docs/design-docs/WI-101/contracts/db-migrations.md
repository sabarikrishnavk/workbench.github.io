---
artifact: A-DDL
title: Database migration
work_item: "WI-101"
version: 1
approved: 2026-09-18
status: approved
template: templates/artifacts/A-DDL.md
doc: docs/design-docs/WI-101/contracts/db-migrations.md
definition: db/migration/V__WI-101.sql
format: SQL (Flyway)
produced_by: DB-01 /write-migrations (database-agent)
inputs: [A-PLAN, A-DATAMODEL]
context: [A-NFR]
approvers: [DBA Lead]
emits: ddl.approved
---

# Database migration: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Expand-only migrations for inventory-service. No contract phase in this work item.

<div id="migrations_table" data-label="Migrations" data-columns="Version|Phase (expand / contract)|Description|Reversible|Est. lock (s)">

**Migrations**

| Version | Phase (expand / contract) | Description | Reversible | Est. lock (s) |
|---|---|---|---|---|
| V2026_09_18_01 | expand | Create store_inventory | Y | 0 |
| V2026_09_18_02 | expand | Create reservation | Y | 0 |
| V2026_09_18_03 | expand | Index reservation(expires_at) concurrently | Y | 0 |

</div>

<div id="indexes_table" data-label="Indexes" data-columns="Table|Index|Columns|Reason">

**Indexes**

| Table | Index | Columns | Reason |
|---|---|---|---|
| reservation | ix_reservation_expires | expires_at | Expiry sweeper |
| reservation | ix_reservation_order | order_id | Release on cancel |

</div>

<div id="backfill_table" data-label="Backfill Plan" data-columns="Table|Rows|Batch size|Duration|Rollback">

**Backfill Plan**

| Table | Rows | Batch size | Duration | Rollback |
|---|---|---|---|---|
| store_inventory | 4.1 M | 10,000 | 22 min | Truncate; cache rebuilds from Kafka |

</div>

<div id="definition_block" data-label="Migration SQL" data-format="sql" data-src="db/migration/V__WI-101.sql">

**Migration SQL**

```sql
CREATE TABLE store_inventory (
  store_id   varchar(8)  NOT NULL,
  sku        varchar(20) NOT NULL,
  on_hand    int         NOT NULL,
  reserved   int         NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (store_id, sku)
);
CREATE TABLE reservation (
  reservation_id uuid PRIMARY KEY,
  order_id   varchar(20) NOT NULL,
  store_id   varchar(8)  NOT NULL,
  sku        varchar(20) NOT NULL,
  qty        int         NOT NULL CHECK (qty > 0),
  expires_at timestamptz NOT NULL,
  status     varchar(12) NOT NULL
);
CREATE INDEX CONCURRENTLY ix_reservation_expires ON reservation (expires_at);
CREATE INDEX CONCURRENTLY ix_reservation_order ON reservation (order_id);
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| V2026_09_18_01 | CHANGES StoreInventory | A-DATAMODEL |
| V2026_09_18_02 | CHANGES Reservation | A-DATAMODEL |
| V2026_09_18_03 | CHANGES Reservation | A-DATAMODEL |

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
| DBA Lead | Ravi Iyer | 2026-09-18 | Approved |

</div>

