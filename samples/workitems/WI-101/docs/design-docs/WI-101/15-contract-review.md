---
artifact: A-CONTRACTOK
title: Contract conformance report
work_item: "WI-101"
version: 1
approved: 2026-09-19
status: approved
template: templates/artifacts/A-CONTRACTOK.md
doc: docs/design-docs/WI-101/15-contract-review.md
definition: docs/design-docs/WI-101/15-contract-review.json
format: JSON + Markdown summary
produced_by: IA-02 /review-contracts (integration-architect-agent)
inputs: [A-OPENAPI, A-SDL, A-EVENTS, A-DDL]
context: [A-INTCAT, A-KDD]
approvers: [Architecture Review Board]
emits: contracts.approved
---

# Contract conformance report: WI-101

<h2 id="executive_summary_details" data-label="Verdict Summary">Verdict Summary</h2>

All four contracts pass lint, compatibility and standards. One waiver: createReservation in inventory-service breaks the OMS system-of-record rule under DSP-01.

<div id="contract_results_table" data-label="Contract Results" data-columns="Contract file|Type|Lint|Breaking change|Standards|Integration rules|Verdict">

**Contract Results**

| Contract file | Type | Lint | Breaking change | Standards | Integration rules | Verdict |
|---|---|---|---|---|---|---|
| contracts/rest/WI-101/openapi.yaml | OpenAPI | pass | none | pass | pass (waiver WVR-01) | pass |
| contracts/graphql/WI-101/schema.graphql | GraphQL | pass | none | pass | pass | pass |
| contracts/events/WI-101/events.avsc | Avro | pass | none (BACKWARD) | pass | pass | pass |
| db/migration/V__WI-101.sql | SQL | pass | none (expand) | pass | pass | pass |

</div>

<div id="violations_table" data-label="Violations" data-columns="Contract|Rule|Severity|Location|Fix">

**Violations**

| Contract | Rule | Severity | Location | Fix |
|---|---|---|---|---|
| openapi.yaml | Reservations belong to the system of record | major | POST /v1/reservations | Waived by WVR-01 (DSP-01) |

</div>

<div id="waivers_table" data-label="Waivers" data-columns="Contract|Rule|DSP / ADR ref|Expiry">

**Waivers**

| Contract | Rule | DSP / ADR ref | Expiry |
|---|---|---|---|
| openapi.yaml | Reservations belong to the system of record | DSP-01 / ADR-08 | 2027-03-31 |

</div>

<div id="definition_block" data-label="Review results" data-format="json" data-src="docs/design-docs/WI-101/15-contract-review.json">

**Review results**

```json
{
  "verdict": "pass",
  "contracts": 4,
  "violations": 1,
  "waived": [
    "WVR-01"
  ]
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| REV-WI-101 | VERIFIES CON-REST-INV | A-OPENAPI |
| REV-WI-101 | VERIFIES CON-REST-ORD | A-OPENAPI |
| REV-WI-101 | VERIFIES CON-GQL-FUL | A-SDL |
| WVR-01 | CITES DSP-01 | A-KDD |

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
| Architecture Review Board | ARB (chair: Arjun Mehta) | 2026-09-19 | Approved |

</div>

