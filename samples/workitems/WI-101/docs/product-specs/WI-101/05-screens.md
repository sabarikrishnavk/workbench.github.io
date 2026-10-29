---
artifact: A-SCREENS
title: Screen specification
work_item: "WI-101"
version: 1
approved: 2026-09-09
status: approved
template: templates/artifacts/A-SCREENS.md
doc: docs/product-specs/WI-101/05-screens.md
definition: docs/product-specs/WI-101/05-screens.json
format: JSON + Figma links
produced_by: PD-02 /specify-screens (design-agent)
inputs: [A-PRD, A-STORIES, A-JOURNEY]
context: []
approvers: [Design Lead]
emits: screens.approved
---

# Screen specification: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Eight screens across web, iOS, Android and the store handheld, with their states, components, data bindings and copy.

<div id="screens_table" data-label="Screen Inventory" data-columns="SCR ID|Name|Channel|Journey step|STY refs|Figma frame">

**Screen Inventory**

| SCR ID | Name | Channel | Journey step | STY refs | Figma frame |
|---|---|---|---|---|---|
| SCR-01 | PDP pickup availability | web | JNY-01 step 1 | STY-01 | figma://bopis/scr-01 |
| SCR-02 | Store selector | web | JNY-01 step 2 | STY-04 | figma://bopis/scr-02 |
| SCR-03 | Checkout fulfilment step | web | JNY-01 step 3 | STY-05 | figma://bopis/scr-03 |
| SCR-04 | PDP pickup availability (iOS) | ios | JNY-02 step 1 | STY-02 | figma://bopis/scr-04 |
| SCR-05 | Checkout pickup (iOS) | ios | JNY-02 step 3 | STY-06 | figma://bopis/scr-05 |
| SCR-06 | PDP and checkout pickup (Android) | android | JNY-02 step 1 | STY-03, STY-07 | figma://bopis/scr-06 |
| SCR-07 | Pick list (store handheld) | android | JNY-03 step 2 | STY-08, STY-09 | figma://bopis/scr-07 |
| SCR-08 | Order ready and QR code | ios | JNY-04 step 2 | STY-10, STY-11 | figma://bopis/scr-08 |

</div>

<div id="screen_states_table" data-label="Screen States" data-columns="SCR ID|State (empty / loading / error / success / partial)|Trigger|What the user sees">

**Screen States**

| SCR ID | State (empty / loading / error / success / partial) | Trigger | What the user sees |
|---|---|---|---|
| SCR-01 | loading | Location resolved | Skeleton for 5 store rows |
| SCR-01 | partial | Some stores stale | Check in store for stale stores |
| SCR-01 | empty | No store within 50 km | Pickup not available near you |
| SCR-03 | error | Reservation failed | Item no longer available at this store, choose another |
| SCR-08 | success | Order staged | QR code and store address |

</div>

<div id="components_used_table" data-label="Components Used" data-columns="SCR ID|CMP ID|Variant|Notes">

**Components Used**

| SCR ID | CMP ID | Variant | Notes |
|---|---|---|---|
| SCR-01 | CMP-01 | default |  |
| SCR-02 | CMP-02 | default |  |
| SCR-02 | CMP-01 | default |  |
| SCR-03 | CMP-03 | default |  |
| SCR-04 | CMP-01 | default |  |
| SCR-05 | CMP-03 | default |  |
| SCR-05 | CMP-02 | default |  |
| SCR-06 | CMP-01 | default |  |
| SCR-06 | CMP-03 | default |  |
| SCR-07 | CMP-05 | default |  |
| SCR-08 | CMP-04 | default |  |

</div>

<div id="data_bindings_table" data-label="Data Bindings" data-columns="SCR ID|Field|Data attribute|Format|Required">

**Data Bindings**

| SCR ID | Field | Data attribute | Format | Required |
|---|---|---|---|---|
| SCR-01 | Availability label | StoreInventory.available | In stock (≥ 3) / Low stock (1–2) / Out of stock | Y |
| SCR-01 | Store distance | Store.distanceKm | 1 decimal | Y |
| SCR-07 | Order status | PickupOrder.status | Enum label | Y |
| SCR-08 | QR payload | PickupOrder.collectCode | QR, 8 chars | Y |

</div>

<div id="copy_deck_table" data-label="Copy Deck" data-columns="SCR ID|Key|Text|Notes">

**Copy Deck**

| SCR ID | Key | Text | Notes |
|---|---|---|---|
| SCR-01 | pickup.instock | In stock for pickup today | ≥ 3 units |
| SCR-01 | pickup.low | Only {n} left | 1–2 units |
| SCR-01 | pickup.stale | Check in store | Stock older than 5 minutes |
| SCR-08 | pickup.ready | Your order is ready at {store} | Push and email |

</div>

<div id="definition_block" data-label="Screens definition" data-format="json" data-src="docs/product-specs/WI-101/05-screens.json">

**Screens definition**

```json
{
  "artifact": "A-SCREENS",
  "workItem": "WI-101",
  "version": 1,
  "screens": [
    {
      "id": "SCR-01",
      "name": "PDP pickup availability",
      "channel": "web",
      "realises": [
        "STY-01"
      ],
      "uses": [
        "CMP-01"
      ],
      "binds": [
        "StoreInventory.available"
      ]
    },
    {
      "id": "SCR-02",
      "name": "Store selector",
      "channel": "web",
      "realises": [
        "STY-04"
      ],
      "uses": [
        "CMP-02",
        "CMP-01"
      ]
    },
    {
      "id": "SCR-03",
      "name": "Checkout fulfilment step",
      "channel": "web",
      "realises": [
        "STY-05"
      ],
      "uses": [
        "CMP-03"
      ]
    },
    {
      "id": "SCR-04",
      "name": "PDP pickup availability (iOS)",
      "channel": "ios",
      "realises": [
        "STY-02"
      ],
      "uses": [
        "CMP-01"
      ]
    },
    {
      "id": "SCR-05",
      "name": "Checkout pickup (iOS)",
      "channel": "ios",
      "realises": [
        "STY-06"
      ],
      "uses": [
        "CMP-03",
        "CMP-02"
      ]
    },
    {
      "id": "SCR-06",
      "name": "PDP and checkout pickup (Android)",
      "channel": "android",
      "realises": [
        "STY-03",
        "STY-07"
      ],
      "uses": [
        "CMP-01",
        "CMP-03"
      ]
    },
    {
      "id": "SCR-07",
      "name": "Pick list (store handheld)",
      "channel": "android",
      "realises": [
        "STY-08",
        "STY-09"
      ],
      "uses": [
        "CMP-05"
      ],
      "binds": [
        "PickupOrder.status"
      ]
    },
    {
      "id": "SCR-08",
      "name": "Order ready and QR code",
      "channel": "ios",
      "realises": [
        "STY-10",
        "STY-11"
      ],
      "uses": [
        "CMP-04"
      ],
      "binds": [
        "PickupOrder.collectCode"
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
| SCR-01 | REALISES STY-01 | A-STORIES |
| SCR-01 | USES CMP-01 | A-UIKIT |
| SCR-02 | REALISES STY-04 | A-STORIES |
| SCR-02 | USES CMP-02 | A-UIKIT |
| SCR-02 | USES CMP-01 | A-UIKIT |
| SCR-03 | REALISES STY-05 | A-STORIES |
| SCR-03 | USES CMP-03 | A-UIKIT |
| SCR-04 | REALISES STY-02 | A-STORIES |
| SCR-04 | USES CMP-01 | A-UIKIT |
| SCR-05 | REALISES STY-06 | A-STORIES |
| SCR-05 | USES CMP-03 | A-UIKIT |
| SCR-05 | USES CMP-02 | A-UIKIT |
| SCR-06 | REALISES STY-03 | A-STORIES |
| SCR-06 | REALISES STY-07 | A-STORIES |

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
| Design Lead | Mei Chen | 2026-09-09 | Approved |

</div>

