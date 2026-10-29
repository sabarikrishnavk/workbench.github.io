---
artifact: A-PLAN
title: Engineering work breakdown
work_item: "WI-101"
version: 1
approved: 2026-09-16
status: approved
template: templates/artifacts/A-PLAN.md
doc: docs/exec-plans/active/WI-101/plan.md
definition: docs/exec-plans/active/WI-101/plan.json
format: JSON + Jira import CSV
produced_by: SA-03 /plan-work (solution-architect-agent)
inputs: [A-SAD, A-STORIES, A-INTCAT, A-DATAMODEL]
context: [A-NFR, A-KDD, A-TECHDEBT]
approvers: [Engineering Manager]
emits: plan.approved
---

# Engineering work breakdown: WI-101

<h2 id="goal_details" data-label="Goal">Goal</h2>

Deliver BOPIS across web, iOS, Android and the store handheld by 2026-10-06, contracts first. The build fans out once the four contracts are approved.

<div id="tasks_table" data-label="Tasks" data-columns="TSK ID|Persona|Task|STY refs|IF refs|Depends on|Estimate">

**Tasks**

| TSK ID | Persona | Task | STY refs | IF refs | Depends on | Estimate |
|---|---|---|---|---|---|---|
| TSK-01 | PER-API | OpenAPI contract for availability, reservation, collect | STY-01, STY-05 | IF-02, IF-03, IF-08 |  | 2d |
| TSK-02 | PER-GQL | Fulfilment subgraph SDL | STY-01, STY-02, STY-03 | IF-01 |  | 2d |
| TSK-03 | PER-EVT | Avro and AsyncAPI contracts | STY-08, STY-10 | IF-04, IF-05, IF-06 |  | 2d |
| TSK-04 | PER-DB | store_inventory and reservation migrations | STY-05 |  |  | 1d |
| TSK-05 | PER-API | inventory-service availability and reservations | STY-01, STY-05 | IF-02, IF-03 | TSK-01, TSK-04 | 6d |
| TSK-06 | PER-EVT | POS CDC consumer and pickup events | STY-08, STY-10 | IF-04, IF-05, IF-06 | TSK-03 | 5d |
| TSK-07 | PER-GQL | Subgraph resolvers | STY-01, STY-02, STY-03 | IF-01, IF-07 | TSK-02, TSK-05 | 4d |
| TSK-08 | PER-UX | Pickup components | STY-01, STY-04 |  |  | 4d |
| TSK-09 | PER-WEB | Web PDP, store selector, checkout | STY-01, STY-04, STY-05, STY-12 | IF-01 | TSK-07, TSK-08 | 6d |
| TSK-10 | PER-IOS | iOS availability, checkout, QR | STY-02, STY-06, STY-10, STY-11 | IF-01 | TSK-07, TSK-08 | 7d |
| TSK-11 | PER-AND | Android shopper app and store handheld | STY-03, STY-07, STY-08, STY-09 | IF-01, IF-08 | TSK-07, TSK-06 | 8d |
| TSK-12 | PER-QA | Automated suites | STY-01, STY-05, STY-09, STY-11 |  | TSK-09, TSK-10, TSK-11 | 5d |
| TSK-13 | PER-SRE | SLOs, alerts, runbook | STY-01, STY-08 |  | TSK-05 | 3d |

</div>

<div id="contract_first_order_table" data-label="Contract-first Order" data-columns="Order|Contract|Owner|Due">

**Contract-first Order**

| Order | Contract | Owner | Due |
|---|---|---|---|
| 1 | contracts/rest/WI-101/openapi.yaml | Omar Haddad | 2026-09-17 |
| 2 | contracts/graphql/WI-101/schema.graphql | Fulfilment team | 2026-09-17 |
| 3 | contracts/events/WI-101/events.avsc | Nadia Petrova | 2026-09-17 |
| 4 | db/migration/V__WI-101.sql | Ravi Iyer | 2026-09-18 |

</div>

<div id="critical_path_table" data-label="Critical Path" data-columns="Step|TSK ID|Duration">

**Critical Path**

| Step | TSK ID | Duration |
|---|---|---|
| 1 | TSK-01 | 2d |
| 2 | TSK-05 | 6d |
| 3 | TSK-07 | 4d |
| 4 | TSK-11 | 8d |
| 5 | TSK-12 | 5d |

</div>

<div id="scope_table" data-label="Channels &amp; Contracts in Scope" data-columns="Item|In scope (Y / N)|Skill to mark N/A">

**Channels & Contracts in Scope**

| Item | In scope (Y / N) | Skill to mark N/A |
|---|---|---|
| REST services | Y | — |
| GraphQL subgraph | Y | — |
| Kafka events | Y | — |
| Database migration | Y | — |
| Web | Y | — |
| iOS | Y | — |
| Android | Y | — |

</div>

<div id="debt_repayment_table" data-label="Tech Debt Repayment" data-columns="Jira key|TSK ID|Release">

**Tech Debt Repayment**

| Jira key | TSK ID | Release |
|---|---|---|
| PLAT-1423 | — | Planned for WI-118 (OMS v2 reservations) |
| PLAT-1424 | — | Planned for 2026.12 release |

</div>

<div id="progress_log_table" data-label="Progress Log" data-columns="Date|Update|By">

**Progress Log**

| Date | Update | By |
|---|---|---|
| 2026-09-16 | Plan approved; contracts started | Arjun Mehta |
| 2026-09-19 | Contracts approved; build fan-out | Tomás Silva |
| 2026-10-02 | All PRs merged | Aisha Bello |

</div>

<div id="definition_block" data-label="Plan definition (Jira import)" data-format="json" data-src="docs/exec-plans/active/WI-101/plan.json">

**Plan definition (Jira import)**

```json
{
  "artifact": "A-PLAN",
  "workItem": "WI-101",
  "version": 1,
  "personas": [
    {
      "id": "PER-API",
      "name": "REST API Engineer"
    },
    {
      "id": "PER-GQL",
      "name": "GraphQL Engineer"
    },
    {
      "id": "PER-EVT",
      "name": "Kafka Engineer"
    },
    {
      "id": "PER-DB",
      "name": "Database Engineer"
    },
    {
      "id": "PER-UX",
      "name": "UX Engineer"
    },
    {
      "id": "PER-WEB",
      "name": "Web Engineer"
    },
    {
      "id": "PER-IOS",
      "name": "iOS Engineer"
    },
    {
      "id": "PER-AND",
      "name": "Android Engineer"
    },
    {
      "id": "PER-QA",
      "name": "QA Engineer"
    },
    {
      "id": "PER-SRE",
      "name": "Site Reliability Engineer"
    }
  ],
  "tasks": [
    {
      "id": "TSK-01",
      "name": "OpenAPI contract for availability, reservation, collect",
      "estimate": "2d",
      "delivers": [
        "STY-01",
        "STY-05"
      ],
      "assigned_to": [
        "PER-API"
      ]
    },
    {
      "id": "TSK-02",
      "name": "Fulfilment subgraph SDL",
      "estimate": "2d",
      "delivers": [
        "STY-01",
        "STY-02",
        "STY-03"
      ],
      "assigned_to": [
        "PER-GQL"
      ]
    },
    {
      "id": "TSK-03",
      "name": "Avro and AsyncAPI contracts",
      "estimate": "2d",
      "delivers": [
        "STY-08",
        "STY-10"
      ],
      "assigned_to": [
        "PER-EVT"
      ]
    },
    {
      "id": "TSK-04",
      "name": "store_inventory and reservation migrations",
      "estimate": "1d",
      "delivers": [
        "STY-05"
      ],
      "assigned_to": [
        "PER-DB"
      ]
    },
    {
      "id": "TSK-05",
      "name": "inventory-service availability and reservations",
      "estimate": "6d",
      "delivers": [
        "STY-01",
        "STY-05"
      ],
      "depends_on": [
        "TSK-01",
        "TSK-04"
      ],
      "assigned_to": [
        "PER-API"
      ]
    },
    {
      "id": "TSK-06",
      "name": "POS CDC consumer and pickup events",
      "estimate": "5d",
      "delivers": [
        "STY-08",
        "STY-10"
      ],
      "depends_on": [
        "TSK-03"
      ],
      "assigned_to": [
        "PER-EVT"
      ]
    },
    {
      "id": "TSK-07",
      "name": "Subgraph resolvers",
      "estimate": "4d",
      "delivers": [
        "STY-01",
        "STY-02",
        "STY-03"
      ],
      "depends_on": [
        "TSK-02",
        "TSK-05"
      ],
      "assigned_to": [
        "PER-GQL"
      ]
    },
    {
      "id": "TSK-08",
      "name": "Pickup components",
      "estimate": "4d",
      "delivers": [
        "STY-01",
        "STY-04"
      ],
      "assigned_to": [
        "PER-UX"
      ]
    },
    {
      "id": "TSK-09",
      "name": "Web PDP, store selector, checkout",
      "estimate": "6d",
      "delivers": [
        "STY-01",
        "STY-04",
        "STY-05",
        "STY-12"
      ],
      "depends_on": [
        "TSK-07",
        "TSK-08"
      ],
      "assigned_to": [
        "PER-WEB"
      ]
    },
    {
      "id": "TSK-10",
      "name": "iOS availability, checkout, QR",
      "estimate": "7d",
      "delivers": [
        "STY-02",
        "STY-06",
        "STY-10",
        "STY-11"
      ],
      "depends_on": [
        "TSK-07",
        "TSK-08"
      ],
      "assigned_to": [
        "PER-IOS"
      ]
    },
    {
      "id": "TSK-11",
      "name": "Android shopper app and store handheld",
      "estimate": "8d",
      "delivers": [
        "STY-03",
        "STY-07",
        "STY-08",
        "STY-09"
      ],
      "depends_on": [
        "TSK-07",
        "TSK-06"
      ],
      "assigned_to": [
        "PER-AND"
      ]
    },
    {
      "id": "TSK-12",
      "name": "Automated suites",
      "estimate": "5d",
      "delivers": [
        "STY-01",
        "STY-05",
        "STY-09",
        "STY-11"
      ],
      "depends_on": [
        "TSK-09",
        "TSK-10",
        "TSK-11"
      ],
      "assigned_to": [
        "PER-QA"
      ]
    },
    {
      "id": "TSK-13",
      "name": "SLOs, alerts, runbook",
      "estimate": "3d",
      "delivers": [
        "STY-01",
        "STY-08"
      ],
      "depends_on": [
        "TSK-05"
      ],
      "assigned_to": [
        "PER-SRE"
      ]
    }
  ]
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| TSK-01 | DELIVERS STY-01 | A-STORIES |
| TSK-01 | DELIVERS STY-05 | A-STORIES |
| TSK-02 | DELIVERS STY-01 | A-STORIES |
| TSK-02 | DELIVERS STY-02 | A-STORIES |
| TSK-02 | DELIVERS STY-03 | A-STORIES |
| TSK-03 | DELIVERS STY-08 | A-STORIES |
| TSK-03 | DELIVERS STY-10 | A-STORIES |
| TSK-04 | DELIVERS STY-05 | A-STORIES |
| TSK-05 | DELIVERS STY-01 | A-STORIES |
| TSK-05 | DELIVERS STY-05 | A-STORIES |
| TSK-06 | DELIVERS STY-08 | A-STORIES |
| TSK-06 | DELIVERS STY-10 | A-STORIES |
| TSK-07 | DELIVERS STY-01 | A-STORIES |
| TSK-07 | DELIVERS STY-02 | A-STORIES |

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
| Engineering Manager | Aisha Bello | 2026-09-16 | Approved |

</div>

