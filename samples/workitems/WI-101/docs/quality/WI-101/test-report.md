---
artifact: A-TESTREPORT
title: Test execution report
work_item: "WI-101"
version: 1
approved: 2026-10-05
status: approved
template: templates/artifacts/A-TESTREPORT.md
doc: docs/quality/WI-101/test-report.md
definition: docs/quality/WI-101/report.json
format: JSON + HTML
produced_by: QA-04 /execute-and-verdict (qa-agent)
inputs: [A-AUTOTESTS, A-WEBPR, A-IOSPR, A-ANDPR, A-APIPR, A-GQLPR, A-EVTPR]
context: [A-UILIB]
approvers: [QA Lead]
emits: qa.verdict
---

# Test execution report: WI-101

<h2 id="executive_summary_details" data-label="Verdict">Verdict</h2>

**Go.** All 13 scenarios pass on the release candidate. DEF-311 (major) is fixed and retested; DEF-314 (minor) ships as a known issue with a workaround.

<div id="results_by_level_table" data-label="Results by Level" data-columns="Level|Executed|Passed|Failed|Skipped|Pass %">

**Results by Level**

| Level | Executed | Passed | Failed | Skipped | Pass % |
|---|---|---|---|---|---|
| unit | 1,204 | 1,204 | 0 | 0 | 100% |
| contract | 46 | 46 | 0 | 0 | 100% |
| e2e | 12 | 12 | 0 | 0 | 100% |
| integration | 1 | 1 | 0 | 0 | 100% |

</div>

<div id="defects_table" data-label="Defects" data-columns="Defect|Severity|TC ID|REQ ID|Status">

**Defects**

| Defect | Severity | TC ID | REQ ID | Status |
|---|---|---|---|---|
| DEF-311 | major | TC-02 | REQ-01 | Fixed |
| DEF-314 | minor | TC-12 | REQ-06 | Known issue |

</div>

<div id="requirement_coverage_table" data-label="Requirement Coverage" data-columns="REQ ID|TCs|Passing|Coverage %">

**Requirement Coverage**

| REQ ID | TCs | Passing | Coverage % |
|---|---|---|---|
| REQ-01 | 4 | 4 | 100% |
| REQ-02 | 3 | 3 | 100% |
| REQ-03 | 2 | 2 | 100% |
| REQ-04 | 2 | 2 | 100% |
| REQ-05 | 1 | 1 | 100% |
| REQ-06 | 1 | 1 | 100% |
| REQ-07 | 1 | 1 | 100% |

</div>

<div id="flaky_tests_table" data-label="Flaky Tests" data-columns="Test|Failure rate|Ticket">

**Flaky Tests**

| Test | Failure rate | Ticket |
|---|---|---|
| TS-AND-UI TC-09 | 3% | QA-2207 |

</div>

<div id="exit_criteria_table" data-label="Exit Criteria" data-columns="Criterion|Threshold|Actual|Met">

**Exit Criteria**

| Criterion | Threshold | Actual | Met |
|---|---|---|---|
| Must stories pass | 100% | 100% | Y |
| Open sev-1 / sev-2 | 0 | 0 | Y |
| Performance budget | NFR-01, NFR-03 | met | Y |

</div>

<div id="definition_block" data-label="Report data" data-format="json" data-src="docs/quality/WI-101/report.json">

**Report data**

```json
{
  "artifact": "A-TESTREPORT",
  "workItem": "WI-101",
  "version": 1,
  "testRuns": [
    {
      "id": "RUN-2026-10-04",
      "name": "Release candidate run 2026-10-04",
      "result": "pass",
      "executes": [
        "TC-01",
        "TC-02",
        "TC-03",
        "TC-04",
        "TC-05",
        "TC-06",
        "TC-07",
        "TC-08",
        "TC-09",
        "TC-10",
        "TC-11",
        "TC-12",
        "TC-13"
      ]
    }
  ],
  "defects": [
    {
      "id": "DEF-311",
      "name": "Availability badge shows In stock after store closes",
      "severity": "major",
      "found_in": [
        "RUN-2026-10-04"
      ]
    },
    {
      "id": "DEF-314",
      "name": "Android QR code not shown at full brightness",
      "severity": "minor",
      "found_in": [
        "RUN-2026-10-04"
      ]
    }
  ],
  "verdicts": [
    {
      "id": "VER-WI-101",
      "name": "Go",
      "go": "Y",
      "for": [
        "WI-101"
      ]
    }
  ]
}
```

</div>

<div id="traceability_table" data-label="Traceability" data-columns="Item|Traces to|Source artifact">

**Traceability**

| Item | Traces to | Source artifact |
|---|---|---|
| RUN-2026-10-04 | EXECUTES TC-01 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-02 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-03 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-04 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-05 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-06 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-07 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-08 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-09 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-10 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-11 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-12 | A-TESTCASES |
| RUN-2026-10-04 | EXECUTES TC-13 | A-TESTCASES |
| VER-WI-101 | FOR WI-101 | A-REQUEST |

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
| QA Lead | Grace Kim | 2026-10-05 | Approved |

</div>

