---
artifact: A-RUNBOOK
title: Runbook
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-RUNBOOK.md
doc: docs/reliability/{wi}/runbook.md
format: Markdown
produced_by: SRE-02 /write-runbook (sre-agent)
inputs: [A-OBS, A-SAD]
context: [A-NFR]
approvers: [SRE Lead]
emits: runbook.approved
---

# Runbook: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-RUNBOOK.md -->

<h2 id="service_overview_details" data-label="Service Overview">Service Overview</h2>

<!-- write here -->

<div id="dependencies_table" data-label="Dependencies" data-columns="Dependency|Type|Impact if down|Contact">

**Dependencies**

| Dependency | Type | Impact if down | Contact |
|---|---|---|---|
| | | | |

</div>

<div id="alert_playbooks_table" data-label="Alert Playbooks" data-columns="Alert|Diagnosis|Action|Escalate after">

**Alert Playbooks**

| Alert | Diagnosis | Action | Escalate after |
|---|---|---|---|
| | | | |

</div>

<div id="rollback_table" data-label="Rollback" data-columns="Step|Command / action|Verification">

**Rollback**

| Step | Command / action | Verification |
|---|---|---|
| | | |

</div>

<div id="kill_switches_table" data-label="Feature-flag Kill Switches" data-columns="Flag|Effect|Who can flip">

**Feature-flag Kill Switches**

| Flag | Effect | Who can flip |
|---|---|---|
| | | |

</div>

<div id="escalation_table" data-label="Escalation" data-columns="Level|Team|Contact|SLA">

**Escalation**

| Level | Team | Contact | SLA |
|---|---|---|---|
| | | | |

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

