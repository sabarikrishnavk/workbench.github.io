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
