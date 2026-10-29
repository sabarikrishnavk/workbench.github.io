---
artifact: A-UIKIT
title: Design tokens & component spec
work_item: "WI-101"
version: 1
approved: 2026-09-10
status: approved
template: templates/artifacts/A-UIKIT.md
doc: docs/product-specs/WI-101/06-ui-kit.md
definition: docs/product-specs/WI-101/06-tokens.json
format: W3C design tokens JSON + Markdown
produced_by: PD-03 /define-ui-kit (design-agent)
inputs: [A-SCREENS]
context: []
approvers: [Design Lead]
emits: uikit.approved
---

# Design tokens & component spec: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Two new tokens families (pickup status colours, pickup card spacing) and five components. CMP-03 reuses the existing segmented control.

<div id="tokens_table" data-label="Design Tokens" data-columns="Token|Category|Value|Usage">

**Design Tokens**

| Token | Category | Value | Usage |
|---|---|---|---|
| color.status.instock | color | #1B7F3B | In stock label and dot |
| color.status.low | color | #B45309 | Low stock label |
| color.status.out | color | #6B7280 | Out of stock and stale |
| space.pickup.card | spacing | 16px | Store rows and pick list cards |

</div>

<div id="components_table" data-label="Components" data-columns="CMP ID|Name|New / changed / reused|Props|Variants|States">

**Components**

| CMP ID | Name | New / changed / reused | Props | Variants | States |
|---|---|---|---|---|---|
| CMP-01 | StoreAvailabilityBadge | New | status, count, stale | compact, row | instock, low, out, stale |
| CMP-02 | StorePicker | New | stores, selectedId, onSelect | sheet, inline | loading, empty, error |
| CMP-03 | FulfilmentToggle | Changed | options, value | default | disabled |
| CMP-04 | PickupQRCode | New | code, brightnessBoost | default | expired |
| CMP-05 | PickListItem | New | sku, qty, scanned | default | scanned, mismatch |

</div>

<div id="accessibility_table" data-label="Accessibility Notes" data-columns="CMP ID|Role|Label|Focus order|Contrast">

**Accessibility Notes**

| CMP ID | Role | Label | Focus order | Contrast |
|---|---|---|---|---|
| CMP-01 | status | Pickup availability: In stock at Store 0142 | n/a | 4.8:1 |
| CMP-02 | listbox | Choose a pickup store | Search, list, confirm | 7.1:1 |
| CMP-04 | img | Pickup QR code for order 8 characters | n/a | 21:1 |

</div>

<div id="responsive_rules_table" data-label="Responsive Rules" data-columns="CMP ID|Breakpoint|Behaviour">

**Responsive Rules**

| CMP ID | Breakpoint | Behaviour |
|---|---|---|
| CMP-02 | < 600 px | Opens as a bottom sheet |
| CMP-02 | ≥ 600 px | Inline list beside the map |
| CMP-01 | < 360 px | Compact variant, count hidden |

</div>

<div id="definition_block" data-label="Design tokens (W3C)" data-format="json" data-src="docs/product-specs/WI-101/06-tokens.json">

**Design tokens (W3C)**

```json
{
  "artifact": "A-UIKIT",
  "workItem": "WI-101",
  "version": 1,
  "components": [
    {
      "id": "CMP-01",
      "name": "StoreAvailabilityBadge",
      "styled_by": [
        "color.status.instock",
        "color.status.low",
        "color.status.out"
      ]
    },
    {
      "id": "CMP-02",
      "name": "StorePicker",
      "styled_by": [
        "space.pickup.card"
      ]
    },
    {
      "id": "CMP-03",
      "name": "FulfilmentToggle"
    },
    {
      "id": "CMP-04",
      "name": "PickupQRCode"
    },
    {
      "id": "CMP-05",
      "name": "PickListItem",
      "styled_by": [
        "space.pickup.card"
      ]
    }
  ],
  "tokens": [
    {
      "id": "color.status.instock",
      "name": "color.status.instock",
      "value": "#1B7F3B"
    },
    {
      "id": "color.status.low",
      "name": "color.status.low",
      "value": "#B45309"
    },
    {
      "id": "color.status.out",
      "name": "color.status.out",
      "value": "#6B7280"
    },
    {
      "id": "space.pickup.card",
      "name": "space.pickup.card",
      "value": "16px"
    }
  ]
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| WI-101 | Work item | A-REQUEST |

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
| Design Lead | Mei Chen | 2026-09-10 | Approved |

</div>

