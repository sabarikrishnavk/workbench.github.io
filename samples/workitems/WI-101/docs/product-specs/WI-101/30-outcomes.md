---
artifact: A-INSIGHTS
title: Outcome review
work_item: "WI-101"
version: 1
approved: 2026-10-27
status: approved
template: templates/artifacts/A-INSIGHTS.md
doc: docs/product-specs/WI-101/30-outcomes.md
format: Markdown
produced_by: PM-05 /review-outcomes (pm-agent)
inputs: [A-OPSREPORT, A-BRIEF]
context: [A-TECHDEBT]
approvers: [Product Owner]
emits: outcomes.reviewed
---

# Outcome review: WI-101

<h2 id="executive_summary_details" data-label="Executive Summary">Executive Summary</h2>

OUT-01 and OUT-03 met; OUT-02 partly met. Shoppers adopted pickup quickly (11% of eligible orders by week 3). Two backlog items seed WI-118.

<div id="outcome_results_table" data-label="Outcome Results" data-columns="OUT ID|Metric|Baseline|Target|Actual|Verdict (met / partly / missed)">

**Outcome Results**

| OUT ID | Metric | Baseline | Target | Actual | Verdict (met / partly / missed) |
|---|---|---|---|---|---|
| OUT-01 | MET-01 PDP-to-order conversion | 2.8% | 3.4% | 3.5% | met |
| OUT-02 | MET-02 Shipping cost per order | $7.90 | $6.95 | $7.19 | partly |
| OUT-03 | MET-03 Orders ready within 2 h | n/a | 95% | 96.2% | met |
| OUT-03 | MET-04 Pickup cancellation rate | n/a | < 4% | 3.1% | met |

</div>

<div id="learnings_table" data-label="Learnings" data-columns="Learning|Evidence|Implication">

**Learnings**

| Learning | Evidence | Implication |
|---|---|---|
| LRN-01 Pickup lifted conversion | A/B on 10% ramp: +0.7 pt | Keep pickup default for in-stock stores |
| LRN-02 Some pickup orders cannibalise store sales | 30% of pickup shoppers bought in store before | Target shipping-heavy categories |
| LRN-03 Ready rate met | 96.2% within 2 h | Extend to curbside next year |

</div>

<div id="backlog_items_table" data-label="New Backlog Items" data-columns="Item|Rationale|Priority|Seeds request">

**New Backlog Items**

| Item | Rationale | Priority | Seeds request |
|---|---|---|---|
| BLI-01 Substitutions at pick | REQ-08 deferred; 4% of orders had a missing item | Should | WI-118 |
| BLI-02 OMS v2 reservations | Repay PLAT-1423; 3 h/week toil | Must | WI-118 |

</div>

<div id="tech_debt_status_table" data-label="Tech Debt Status" data-columns="Jira key|DSP ID|Repay-by|Status">

**Tech Debt Status**

| Jira key | DSP ID | Repay-by | Status |
|---|---|---|---|
| PLAT-1423 | DSP-01 | 2027-03-31 | Scheduled in WI-118 |
| PLAT-1424 | DSP-02 | 2027-01-31 | In progress |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| LRN-01 | ABOUT OUT-01 | A-BRIEF |
| LRN-02 | ABOUT OUT-02 | A-BRIEF |
| LRN-03 | ABOUT OUT-03 | A-BRIEF |

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
| Product Owner | Priya Raman | 2026-10-27 | Approved |

</div>

