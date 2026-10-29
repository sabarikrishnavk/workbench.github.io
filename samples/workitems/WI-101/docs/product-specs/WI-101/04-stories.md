---
artifact: A-STORIES
title: Epics & user stories
work_item: "WI-101"
version: 1
approved: 2026-09-07
status: approved
template: templates/artifacts/A-STORIES.md
doc: docs/product-specs/WI-101/04-stories.md
definition: docs/product-specs/WI-101/04-stories.json
format: JSON + Jira import CSV
produced_by: PM-03 /slice-stories (pm-agent)
inputs: [A-PRD, A-JOURNEY]
context: []
approvers: [Product Owner]
emits: stories.approved
---

# Epics & user stories: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Thirteen stories in four epics, sliced per channel so that each can ship and be tested on its own. All pass the definition of ready.

<div id="epics_table" data-label="Epics" data-columns="EP ID|Name|Journey|REQ refs">

**Epics**

| EP ID | Name | Journey | REQ refs |
|---|---|---|---|
| EP-01 | Pickup discovery | JNY-01 | REQ-01 |
| EP-02 | Pickup checkout and reservation | JNY-01 | REQ-02, REQ-03 |
| EP-03 | Store fulfilment | JNY-03 | REQ-04, REQ-08 |
| EP-04 | Notify and collect | JNY-04 | REQ-05, REQ-06, REQ-07 |

</div>

<div id="user_stories_table" data-label="User Stories" data-columns="STY ID|EP ID|As a|I want|So that|Channel|Priority|REQ refs">

**User Stories**

| STY ID | EP ID | As a | I want | So that | Channel | Priority | REQ refs |
|---|---|---|---|---|---|---|---|
| STY-01 | EP-01 | online shopper | see which nearby stores have the item on the product page | I can collect it today | web | Must | REQ-01 |
| STY-02 | EP-01 | online shopper | see store availability in the iOS app | I can collect it today | ios | Must | REQ-01 |
| STY-03 | EP-01 | online shopper | see store availability in the Android app | I can collect it today | android | Must | REQ-01 |
| STY-04 | EP-01 | online shopper | pick and remember my preferred store | I don't have to search every time | web | Should | REQ-01 |
| STY-05 | EP-02 | online shopper | choose pickup at checkout on the web | I pay now and collect later | web | Must | REQ-02, REQ-03 |
| STY-06 | EP-02 | online shopper | choose pickup at checkout in the iOS app | I pay now and collect later | ios | Must | REQ-02, REQ-03 |
| STY-07 | EP-02 | online shopper | choose pickup at checkout in the Android app | I pay now and collect later | android | Must | REQ-02, REQ-03 |
| STY-08 | EP-03 | store associate | see new pickup orders on my handheld | I start picking within minutes | android | Must | REQ-04 |
| STY-09 | EP-03 | store associate | scan each item on the pick list and stage the order | the right items are handed over | android | Must | REQ-04 |
| STY-10 | EP-04 | online shopper | be told when my order is ready | I know when to come | ios | Must | REQ-05 |
| STY-11 | EP-04 | online shopper | show a QR code at the pickup desk | hand-over is quick | ios | Should | REQ-06 |
| STY-12 | EP-04 | store operations manager | have uncollected orders cancelled and refunded after 5 days | stock goes back on sale | web | Should | REQ-07 |
| STY-13 | EP-03 | store associate | offer a substitute when an item is missing | the shopper still gets an order | android | Could | REQ-08 |

</div>

<div id="acceptance_criteria_table" data-label="Acceptance Criteria (Gherkin)" data-columns="STY ID|Scenario|Given|When|Then">

**Acceptance Criteria (Gherkin)**

| STY ID | Scenario | Given | When | Then |
|---|---|---|---|---|
| STY-01 | Item in stock nearby | a shopper on a product page with location shared | the page loads | the 5 nearest stores show In stock / Low stock / Out of stock |
| STY-01 | Stale stock | store stock older than 5 minutes | the page loads | that store shows Check in store |
| STY-05 | Pickup checkout | a basket of in-stock items | the shopper chooses pickup at Store 0142 and pays | the order is placed and stock is reserved |
| STY-09 | Wrong item scanned | an open pick list | the associate scans a different SKU | the handheld rejects it |
| STY-11 | QR hand-over | a ready order | the associate scans the QR code | the order is marked collected |

</div>

<div id="invest_check_table" data-label="INVEST &amp; Definition of Ready" data-columns="STY ID|Independent|Negotiable|Valuable|Estimable|Small|Testable|Ready">

**INVEST & Definition of Ready**

| STY ID | Independent | Negotiable | Valuable | Estimable | Small | Testable | Ready |
|---|---|---|---|---|---|---|---|
| STY-01 | Y | Y | Y | Y | Y | Y | Y |
| STY-02 | Y | Y | Y | Y | Y | Y | Y |
| STY-03 | Y | Y | Y | Y | Y | Y | Y |
| STY-04 | Y | Y | Y | Y | Y | Y | Y |
| STY-05 | Y | Y | Y | Y | Y | Y | Y |
| STY-06 | Y | Y | Y | Y | Y | Y | Y |
| STY-07 | Y | Y | Y | Y | Y | Y | Y |
| STY-08 | Y | Y | Y | Y | Y | Y | Y |
| STY-09 | Y | Y | Y | Y | Y | Y | Y |
| STY-10 | Y | Y | Y | Y | Y | Y | Y |
| STY-11 | Y | Y | Y | Y | Y | Y | Y |
| STY-12 | Y | Y | Y | Y | Y | Y | Y |
| STY-13 | Y | Y | Y | Y | Y | Y | Y |

</div>

<div id="dependencies_table" data-label="Dependencies" data-columns="STY ID|Depends on|Type">

**Dependencies**

| STY ID | Depends on | Type |
|---|---|---|
| STY-05 | STY-01 | Same availability API |
| STY-06 | STY-02 | Same subgraph field |
| STY-09 | STY-08 | Queue before pick list |
| STY-11 | STY-10 | Ready state before hand-over |

</div>

<div id="definition_block" data-label="Stories definition (Jira import)" data-format="json" data-src="docs/product-specs/WI-101/04-stories.json">

**Stories definition (Jira import)**

```json
{
  "artifact": "A-STORIES",
  "workItem": "WI-101",
  "version": 1,
  "epics": [
    {
      "id": "EP-01",
      "name": "Pickup discovery",
      "part_of": [
        "WI-101"
      ]
    },
    {
      "id": "EP-02",
      "name": "Pickup checkout and reservation",
      "part_of": [
        "WI-101"
      ]
    },
    {
      "id": "EP-03",
      "name": "Store fulfilment",
      "part_of": [
        "WI-101"
      ]
    },
    {
      "id": "EP-04",
      "name": "Notify and collect",
      "part_of": [
        "WI-101"
      ]
    }
  ],
  "storys": [
    {
      "id": "STY-01",
      "name": "See which nearby stores have the item on the product page",
      "channel": "web",
      "priority": "Must",
      "part_of": [
        "EP-01"
      ],
      "implements": [
        "REQ-01"
      ]
    },
    {
      "id": "STY-02",
      "name": "See store availability in the iOS app",
      "channel": "ios",
      "priority": "Must",
      "part_of": [
        "EP-01"
      ],
      "implements": [
        "REQ-01"
      ]
    },
    {
      "id": "STY-03",
      "name": "See store availability in the Android app",
      "channel": "android",
      "priority": "Must",
      "part_of": [
        "EP-01"
      ],
      "implements": [
        "REQ-01"
      ]
    },
    {
      "id": "STY-04",
      "name": "Pick and remember my preferred store",
      "channel": "web",
      "priority": "Should",
      "part_of": [
        "EP-01"
      ],
      "implements": [
        "REQ-01"
      ]
    },
    {
      "id": "STY-05",
      "name": "Choose pickup at checkout on the web",
      "channel": "web",
      "priority": "Must",
      "part_of": [
        "EP-02"
      ],
      "implements": [
        "REQ-02",
        "REQ-03"
      ]
    },
    {
      "id": "STY-06",
      "name": "Choose pickup at checkout in the iOS app",
      "channel": "ios",
      "priority": "Must",
      "part_of": [
        "EP-02"
      ],
      "implements": [
        "REQ-02",
        "REQ-03"
      ]
    },
    {
      "id": "STY-07",
      "name": "Choose pickup at checkout in the Android app",
      "channel": "android",
      "priority": "Must",
      "part_of": [
        "EP-02"
      ],
      "implements": [
        "REQ-02",
        "REQ-03"
      ]
    },
    {
      "id": "STY-08",
      "name": "See new pickup orders on my handheld",
      "channel": "android",
      "priority": "Must",
      "part_of": [
        "EP-03"
      ],
      "implements": [
        "REQ-04"
      ]
    },
    {
      "id": "STY-09",
      "name": "Scan each item on the pick list and stage the order",
      "channel": "android",
      "priority": "Must",
      "part_of": [
        "EP-03"
      ],
      "implements": [
        "REQ-04"
      ]
    },
    {
      "id": "STY-10",
      "name": "Be told when my order is ready",
      "channel": "ios",
      "priority": "Must",
      "part_of": [
        "EP-04"
      ],
      "implements": [
        "REQ-05"
      ]
    },
    {
      "id": "STY-11",
      "name": "Show a QR code at the pickup desk",
      "channel": "ios",
      "priority": "Should",
      "part_of": [
        "EP-04"
      ],
      "implements": [
        "REQ-06"
      ]
    },
    {
      "id": "STY-12",
      "name": "Have uncollected orders cancelled and refunded after 5 days",
      "channel": "web",
      "priority": "Should",
      "part_of": [
        "EP-04"
      ],
      "implements": [
        "REQ-07"
      ]
    },
    {
      "id": "STY-13",
      "name": "Offer a substitute when an item is missing",
      "channel": "android",
      "priority": "Could",
      "part_of": [
        "EP-03"
      ],
      "implements": [
        "REQ-08"
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
| EP-01 | PART_OF WI-101 | A-REQUEST |
| EP-02 | PART_OF WI-101 | A-REQUEST |
| EP-03 | PART_OF WI-101 | A-REQUEST |
| EP-04 | PART_OF WI-101 | A-REQUEST |
| STY-01 | IMPLEMENTS REQ-01 | A-PRD |
| STY-02 | IMPLEMENTS REQ-01 | A-PRD |
| STY-03 | IMPLEMENTS REQ-01 | A-PRD |
| STY-04 | IMPLEMENTS REQ-01 | A-PRD |
| STY-05 | IMPLEMENTS REQ-02 | A-PRD |
| STY-05 | IMPLEMENTS REQ-03 | A-PRD |
| STY-06 | IMPLEMENTS REQ-02 | A-PRD |
| STY-06 | IMPLEMENTS REQ-03 | A-PRD |
| STY-07 | IMPLEMENTS REQ-02 | A-PRD |
| STY-07 | IMPLEMENTS REQ-03 | A-PRD |

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
| Product Owner | Priya Raman | 2026-09-07 | Approved |

</div>

