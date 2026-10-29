---
artifact: A-JOURNEY
title: User journeys
work_item: "WI-101"
version: 1
approved: 2026-09-03
status: approved
template: templates/artifacts/A-JOURNEY.md
doc: docs/product-specs/WI-101/03-journeys.md
definition: docs/product-specs/WI-101/03-journeys.json
format: JSON (journeys.schema.json)
produced_by: PD-01 /map-journeys (design-agent)
inputs: [A-BRIEF]
context: []
approvers: [Design Lead]
emits: journey.approved
---

# User journeys: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Four journeys cover the shopper choosing pickup (web and app), the associate preparing the order and the shopper collecting it. Steps come from 14 shopper interviews and two store shadowing days.

<div id="journeys_table" data-label="Journeys" data-columns="JNY ID|Name|Persona|Channel|OUT refs">

**Journeys**

| JNY ID | Name | Persona | Channel | OUT refs |
|---|---|---|---|---|
| JNY-01 | Choose store pickup on the web | Online shopper | web | OUT-01, OUT-02 |
| JNY-02 | Choose store pickup in the app | Online shopper | ios / android | OUT-01, OUT-02 |
| JNY-03 | Pick and stage a pickup order | Store associate | android (store handheld) | OUT-03 |
| JNY-04 | Collect the order at the store | Online shopper | ios / android / web | OUT-03 |

</div>

<div id="journey_steps_table" data-label="Journey Steps" data-columns="JNY ID|Step|Touchpoint|User action|Pain point|Opportunity">

**Journey Steps**

| JNY ID | Step | Touchpoint | User action | Pain point | Opportunity |
|---|---|---|---|---|---|
| JNY-01 | 1 | Product page | Checks if a nearby store has the item | Only delivery dates shown | Show stock for the 5 nearest stores |
| JNY-01 | 2 | Store selector | Picks a store | Store list has no stock | Sort stores by availability and distance |
| JNY-01 | 3 | Checkout | Chooses pickup and pays | — | Pickup as a fulfilment option |
| JNY-03 | 1 | Handheld queue | Sees a new order | Orders arrive by phone | Push the order to the store queue |
| JNY-03 | 2 | Pick list | Scans items | Wrong item picked | Barcode scan check |
| JNY-04 | 1 | Notification | Gets the ready message | Not told when ready | Push / SMS when staged |
| JNY-04 | 2 | Pickup desk | Shows a code | Long ID checks | QR code hand-over |

</div>

<div id="pain_points_table" data-label="Pain Points" data-columns="JNY ID|Step|Pain|Severity|Evidence">

**Pain Points**

| JNY ID | Step | Pain | Severity | Evidence |
|---|---|---|---|---|
| JNY-01 | 1 | Can't see store stock | High | 1,240 app-review mentions |
| JNY-03 | 2 | Wrong item picked | Medium | Store shadowing day 2 |
| JNY-04 | 2 | Slow hand-over | Medium | Interviews 4, 7, 11 |

</div>

<div id="definition_block" data-label="Journeys definition" data-format="json" data-src="docs/product-specs/WI-101/03-journeys.json">

**Journeys definition**

```json
{
  "artifact": "A-JOURNEY",
  "workItem": "WI-101",
  "version": 1,
  "journeys": [
    {
      "id": "JNY-01",
      "name": "Choose store pickup on the web",
      "channel": "web",
      "serves": [
        "OUT-01",
        "OUT-02"
      ],
      "for": [
        "PER-SHOPPER"
      ]
    },
    {
      "id": "JNY-02",
      "name": "Choose store pickup in the app",
      "channel": "ios / android",
      "serves": [
        "OUT-01",
        "OUT-02"
      ],
      "for": [
        "PER-SHOPPER"
      ]
    },
    {
      "id": "JNY-03",
      "name": "Pick and stage a pickup order",
      "channel": "android (store handheld)",
      "serves": [
        "OUT-03"
      ],
      "for": [
        "PER-ASSOC"
      ]
    },
    {
      "id": "JNY-04",
      "name": "Collect the order at the store",
      "channel": "ios / android / web",
      "serves": [
        "OUT-03"
      ],
      "for": [
        "PER-SHOPPER"
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
| JNY-01 | SERVES OUT-01 | A-BRIEF |
| JNY-01 | FOR PER-SHOPPER | A-BRIEF |
| JNY-02 | SERVES OUT-01 | A-BRIEF |
| JNY-02 | FOR PER-SHOPPER | A-BRIEF |
| JNY-03 | SERVES OUT-03 | A-BRIEF |
| JNY-03 | FOR PER-ASSOC | A-BRIEF |
| JNY-04 | SERVES OUT-03 | A-BRIEF |
| JNY-04 | FOR PER-SHOPPER | A-BRIEF |
| JNY-01 | SERVES OUT-02 | A-BRIEF |
| JNY-02 | SERVES OUT-02 | A-BRIEF |

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
| Design Lead | Mei Chen | 2026-09-03 | Approved |

</div>

