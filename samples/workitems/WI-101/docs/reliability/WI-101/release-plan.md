---
artifact: A-RELEASE
title: Release plan
work_item: "WI-101"
version: 1
approved: 2026-10-03
status: approved
template: templates/artifacts/A-RELEASE.md
doc: docs/reliability/WI-101/release-plan.md
definition: docs/reliability/WI-101/release.yaml
format: YAML
produced_by: SRE-03 /plan-release (sre-agent)
inputs: [A-SIGNOFF, A-PERFREPORT, A-RUNBOOK, A-DDL]
context: [A-PLAN]
approvers: [Change Advisory Board]
emits: release.approved
---

# Release plan: WI-101

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

Release 2026.10.1 ships BOPIS behind flags. Back ends go first, then channels; app store builds were submitted on 2026-10-03.

<div id="deploy_order_table" data-label="Deploy Order" data-columns="Step|Component|Version|Depends on">

**Deploy Order**

| Step | Component | Version | Depends on |
|---|---|---|---|
| 1 | inventory-service | 1.4.0 | migrations V2026_09_18_* |
| 2 | fulfilment-subgraph | 1.0.0 | inventory-service |
| 3 | commerce-router | supergraph 2026.10.1 | fulfilment-subgraph |
| 4 | order-service | 2.7.0 | inventory-service |
| 5 | store-associate-app | 5.12.0 | order-service |
| 6 | storefront-web | 2026.10.1 | commerce-router |
| 7 | shopper-ios / shopper-android | 8.4.0 | commerce-router |

</div>

<div id="canary_steps_table" data-label="Canary Steps" data-columns="Step|Traffic %|Bake time|Analysis threshold">

**Canary Steps**

| Step | Traffic % | Bake time | Analysis threshold |
|---|---|---|---|
| 1 | 5 | 30 min | score ≥ 0.9 |
| 2 | 25 | 60 min | score ≥ 0.9 |
| 3 | 100 | — | — |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Ramp|Audience">

**Feature Flags**

| Flag | Ramp | Audience |
|---|---|---|
| ful.pickupAvailability | 10% → 50% → 100% | All shoppers |
| inv.softReservations | with availability | All shoppers |
| evt.posCdc | 3 pilot stores → all | Stores |

</div>

<div id="rollback_triggers_table" data-label="Rollback Triggers" data-columns="Trigger|Threshold|Action">

**Rollback Triggers**

| Trigger | Threshold | Action |
|---|---|---|
| SLO-01 burn rate | > 14.4 for 5 min | Roll back step |
| Reservation 5xx | > 0.5% | Flag off inv.softReservations |
| Canary score | < 0.9 | Halt and roll back |

</div>

<div id="communications_table" data-label="Communications" data-columns="Audience|Channel|When|Message">

**Communications**

| Audience | Channel | When | Message |
|---|---|---|---|
| Store managers | Store portal | 2026-10-05 | Pickup goes live tomorrow; queue on handhelds |
| Customer care | Briefing | 2026-10-05 | FAQ and refunds |
| Shoppers | Homepage banner | 2026-10-09 | Pick up today at your store |

</div>

<div id="definition_block" data-label="Release definition" data-format="yaml" data-src="docs/reliability/WI-101/release.yaml">

**Release definition**

```yaml
release: REL-2026.10.1
workItem: WI-101
steps:
  - { order: 1, component: inventory-service, version: 1.4.0, canary: [5, 25, 100] }
  - { order: 2, component: fulfilment-subgraph, version: 1.0.0, canary: [5, 25, 100] }
  - { order: 6, component: storefront-web, version: 2026.10.1 }
flags:
  ful.pickupAvailability: { ramp: [10, 50, 100] }
rollback:
  - { trigger: slo-01-burn, threshold: 14.4 }
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| REL-2026.10.1 | DEPLOYS APP-INV | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-FULSG | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-GW | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-ORD | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-STORE | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-WEB | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-IOS | A-SAD |
| REL-2026.10.1 | DEPLOYS APP-AND | A-SAD |

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
| Change Advisory Board | CAB (chair: Elena García) | 2026-10-03 | Approved |

</div>

