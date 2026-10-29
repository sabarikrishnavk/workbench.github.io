---
artifact: A-RUNBOOK
title: Runbook
work_item: "WI-101"
version: 1
approved: 2026-09-30
status: approved
template: templates/artifacts/A-RUNBOOK.md
doc: docs/reliability/WI-101/runbook.md
format: Markdown
produced_by: SRE-02 /write-runbook (sre-agent)
inputs: [A-OBS, A-SAD]
context: [A-NFR]
approvers: [SRE Lead]
emits: runbook.approved
---

# Runbook: WI-101

<h2 id="service_overview_details" data-label="Service Overview">Service Overview</h2>

BOPIS spans inventory-service (availability, reservations, stock cache), fulfilment-subgraph and the pickup orchestrator in order-service. On-call: fulfilment team (primary), store tech (secondary).

<div id="dependencies_table" data-label="Dependencies" data-columns="Dependency|Type|Impact if down|Contact">

**Dependencies**

| Dependency | Type | Impact if down | Contact |
|---|---|---|---|
| Redis stock cache | datastore | Availability falls back to UNKNOWN | #fulfilment-oncall |
| Kafka pos.inventory.changed.v1 | stream | Stock goes stale; badges show Check in store | #streaming-platform |
| OMS | system | Orders queue in outbox | #oms-support |
| SMS vendor | external | SMS not sent; push and email still sent | vendor portal |

</div>

<div id="alert_playbooks_table" data-label="Alert Playbooks" data-columns="Alert|Diagnosis|Action|Escalate after">

**Alert Playbooks**

| Alert | Diagnosis | Action | Escalate after |
|---|---|---|---|
| ALR-01 / ALR-02 | Check Redis latency and pod CPU on the BOPIS dashboard | Scale inventory-service; fail over Redis if primary unhealthy | 15 min |
| ALR-03 | Check 409 vs 5xx split | 5xx: roll back; 409 spike: check POS feed | 15 min |
| ALR-04 | Find lagging stores on the CDC dashboard | Restart the consumer group; stale stores auto-hide | 30 min |
| ALR-05 | Check store queue backlog by store | Call the store operations duty manager | 60 min |

</div>

<div id="rollback_table" data-label="Rollback" data-columns="Step|Command / action|Verification">

**Rollback**

| Step | Command / action | Verification |
|---|---|---|
| 1 | Set ful.pickupAvailability off | PDP shows delivery only |
| 2 | helm rollback inventory-service | Version matches previous release |
| 3 | Set inv.softReservations off | Checkout hides pickup |

</div>

<div id="kill_switches_table" data-label="Feature-flag Kill Switches" data-columns="Flag|Effect|Who can flip">

**Feature-flag Kill Switches**

| Flag | Effect | Who can flip |
|---|---|---|
| ful.pickupAvailability | Hides availability everywhere | On-call SRE, Product Owner |
| inv.softReservations | Disables pickup checkout | On-call SRE |
| evt.posCdc | Stops stock ingestion per store | Store tech on-call |

</div>

<div id="escalation_table" data-label="Escalation" data-columns="Level|Team|Contact|SLA">

**Escalation**

| Level | Team | Contact | SLA |
|---|---|---|---|
| 1 | Fulfilment on-call | #fulfilment-oncall | 5 min |
| 2 | SRE lead | Lucas Brandt | 15 min |
| 3 | Incident commander | Duty IC rota | 30 min |

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| RB-01 | HANDLES ALR-01 | A-OBS |
| RB-02 | HANDLES ALR-03 | A-OBS |
| RB-03 | HANDLES ALR-04 | A-OBS |
| RB-04 | HANDLES ALR-05 | A-OBS |
| RB-01 | HANDLES ALR-02 | A-OBS |

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
| SRE Lead | Lucas Brandt | 2026-09-30 | Approved |

</div>

