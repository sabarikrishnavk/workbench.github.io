---
artifact: A-CONTRACTOK
title: Contract conformance report
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-CONTRACTOK.md
doc: docs/design-docs/{wi}/15-contract-review.md
definition: docs/design-docs/{wi}/15-contract-review.json
format: JSON + Markdown summary
produced_by: IA-02 /review-contracts (integration-architect-agent)
inputs: [A-OPENAPI, A-SDL, A-EVENTS, A-DDL]
context: [A-INTCAT, A-KDD]
approvers: [Architecture Review Board]
emits: contracts.approved
---

# Contract conformance report: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-CONTRACTOK.md -->

<h2 id="executive_summary_details" data-label="Verdict Summary">Verdict Summary</h2>

<!-- write here -->

<div id="contract_results_table" data-label="Contract Results" data-columns="Contract file|Type|Lint|Breaking change|Standards|Integration rules|Verdict">

**Contract Results**

| Contract file | Type | Lint | Breaking change | Standards | Integration rules | Verdict |
|---|---|---|---|---|---|---|
| | | | | | | |

</div>

<div id="violations_table" data-label="Violations" data-columns="Contract|Rule|Severity|Location|Fix">

**Violations**

| Contract | Rule | Severity | Location | Fix |
|---|---|---|---|---|
| | | | | |

</div>

<div id="waivers_table" data-label="Waivers" data-columns="Contract|Rule|DSP / ADR ref|Expiry">

**Waivers**

| Contract | Rule | DSP / ADR ref | Expiry |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Review results" data-format="json" data-src="docs/design-docs/{wi}/15-contract-review.json">

**Review results**

```json
{}
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

