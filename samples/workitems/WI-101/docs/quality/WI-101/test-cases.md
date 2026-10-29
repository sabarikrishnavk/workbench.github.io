---
artifact: A-TESTCASES
title: Test cases
work_item: "WI-101"
version: 1
approved: 2026-09-19
status: approved
template: templates/artifacts/A-TESTCASES.md
doc: docs/quality/WI-101/test-cases.md
definition: docs/quality/WI-101/features/*.feature
format: Gherkin .feature files
produced_by: QA-02 /design-test-cases (qa-agent)
inputs: [A-TESTPLAN, A-STORIES, A-SCREENS]
context: []
approvers: [QA Lead]
emits: testcases.approved
---

# Test cases: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Thirteen Gherkin scenarios covering every Must and Should story, tagged with requirement, story and channel.

<div id="scenarios_table" data-label="Scenarios" data-columns="TC ID|Feature|Scenario|Tags (@REQ @STY @channel)|Type (positive / negative / edge)">

**Scenarios**

| TC ID | Feature | Scenario | Tags (@REQ @STY @channel) | Type (positive / negative / edge) |
|---|---|---|---|---|
| TC-01 | Availability | In-stock store shows In stock | @REQ-01 @STY-01 @web | positive |
| TC-02 | Availability | Stale stock shows Check in store | @REQ-01 @STY-01 @web | edge |
| TC-03 | Availability | iOS availability matches web | @REQ-01 @STY-02 @ios | positive |
| TC-04 | Availability | Android availability matches web | @REQ-01 @STY-03 @android | positive |
| TC-05 | Checkout | Pickup checkout reserves stock | @REQ-02 @REQ-03 @STY-05 @web | positive |
| TC-06 | Checkout | Last unit reserved twice | @REQ-03 @STY-05 | negative |
| TC-07 | Checkout | iOS pickup checkout | @REQ-02 @STY-06 @ios | positive |
| TC-08 | Checkout | Android pickup checkout | @REQ-02 @STY-07 @android | positive |
| TC-09 | Store | Order appears on handheld within 30 s | @REQ-04 @STY-08 @android | positive |
| TC-10 | Store | Wrong SKU scan rejected | @REQ-04 @STY-09 @android | negative |
| TC-11 | Collect | Ready push within 60 s | @REQ-05 @STY-10 @ios | positive |
| TC-12 | Collect | QR hand-over | @REQ-06 @STY-11 @ios | positive |
| TC-13 | Collect | Uncollected order auto-cancelled after 5 days | @REQ-07 @STY-12 | edge |

</div>

<div id="test_data_tables_table" data-label="Test Data Tables" data-columns="TC ID|Data set|Values">

**Test Data Tables**

| TC ID | Data set | Values |
|---|---|---|
| TC-01 | stores | S-0142 onHand 8, S-0310 onHand 1, S-0077 onHand 0 |
| TC-06 | concurrency | 2 shoppers, 1 unit, 50 ms apart |
| TC-13 | clock | order staged 2026-10-01T10:00Z, now +5d |

</div>

<div id="definition_block" data-label="Feature files" data-format="gherkin" data-src="docs/quality/WI-101/features/*.feature">

**Feature files**

```gherkin
Feature: Store pickup availability
  @REQ-01 @STY-01 @web
  Scenario: TC-01 In-stock store shows In stock
    Given store S-0142 has 8 units of SKU 100234
    When the shopper opens the product page near S-0142
    Then S-0142 shows "In stock for pickup today"

  @REQ-01 @STY-01 @web
  Scenario: TC-02 Stale stock shows Check in store
    Given store S-0310 stock was updated 6 minutes ago
    When the shopper opens the product page
    Then S-0310 shows "Check in store"

Feature: Pickup checkout
  @REQ-03 @STY-05
  Scenario: TC-06 Last unit reserved twice
    Given store S-0310 has 1 unit of SKU 100234
    When two shoppers place pickup orders 50 ms apart
    Then exactly one reservation succeeds
    And the other shopper is asked to choose another store
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| TC-01 | VERIFIES STY-01 | A-STORIES |
| TC-01 | VERIFIES REQ-01 | A-PRD |
| TC-02 | VERIFIES STY-01 | A-STORIES |
| TC-02 | VERIFIES REQ-01 | A-PRD |
| TC-03 | VERIFIES STY-02 | A-STORIES |
| TC-03 | VERIFIES REQ-01 | A-PRD |
| TC-04 | VERIFIES STY-03 | A-STORIES |
| TC-04 | VERIFIES REQ-01 | A-PRD |
| TC-05 | VERIFIES STY-05 | A-STORIES |
| TC-05 | VERIFIES REQ-02 | A-PRD |
| TC-05 | VERIFIES REQ-03 | A-PRD |
| TC-06 | VERIFIES STY-05 | A-STORIES |
| TC-06 | VERIFIES REQ-03 | A-PRD |
| TC-07 | VERIFIES STY-06 | A-STORIES |

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
| QA Lead | Grace Kim | 2026-09-19 | Approved |

</div>

