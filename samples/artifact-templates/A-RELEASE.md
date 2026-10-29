---
artifact: A-RELEASE
title: Release plan
work_item: "{wi}"
version: 1
status: draft   # draft | produced | approved | superseded
template: templates/artifacts/A-RELEASE.md
doc: docs/reliability/{wi}/release-plan.md
definition: docs/reliability/{wi}/release.yaml
format: YAML
produced_by: SRE-03 /plan-release (sre-agent)
inputs: [A-SIGNOFF, A-PERFREPORT, A-RUNBOOK, A-DDL]
context: [A-PLAN]
approvers: [Change Advisory Board]
emits: release.approved
---

# Release plan: {wi}

<!-- Keep every section id, table column and the order below; write "None" in a section that doesn't apply. Checked by: node scripts/harness-template-check.mjs <doc> templates/artifacts/A-RELEASE.md -->

<h2 id="introduction_details" data-label="Introduction">Introduction</h2>

<!-- write here -->

<div id="deploy_order_table" data-label="Deploy Order" data-columns="Step|Component|Version|Depends on">

**Deploy Order**

| Step | Component | Version | Depends on |
|---|---|---|---|
| | | | |

</div>

<div id="canary_steps_table" data-label="Canary Steps" data-columns="Step|Traffic %|Bake time|Analysis threshold">

**Canary Steps**

| Step | Traffic % | Bake time | Analysis threshold |
|---|---|---|---|
| | | | |

</div>

<div id="feature_flags_table" data-label="Feature Flags" data-columns="Flag|Ramp|Audience">

**Feature Flags**

| Flag | Ramp | Audience |
|---|---|---|
| | | |

</div>

<div id="rollback_triggers_table" data-label="Rollback Triggers" data-columns="Trigger|Threshold|Action">

**Rollback Triggers**

| Trigger | Threshold | Action |
|---|---|---|
| | | |

</div>

<div id="communications_table" data-label="Communications" data-columns="Audience|Channel|When|Message">

**Communications**

| Audience | Channel | When | Message |
|---|---|---|---|
| | | | |

</div>

<div id="definition_block" data-label="Release definition" data-format="yaml" data-src="docs/reliability/{wi}/release.yaml">

**Release definition**

```yaml
# mirrors docs/reliability/{wi}/release.yaml
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

