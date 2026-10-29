# WI-101: Buy online, pick up in store (BOPIS) with real-time store inventory

A complete sample work item for a fictional retailer, Harbor & Pine (212 stores, web, iOS and Android). Every artifact of the harness was produced from its template in [`samples/artifact-templates/`](../../artifact-templates/) and approved, from the business request on 2026-09-01 to the outcome review on 2026-10-27.

- The layout matches the harness scaffold: documents under `docs/`, contracts under `contracts/`, migrations under `db/`.
- [`docs/generated/memory/WI-101/graph.json`](docs/generated/memory/WI-101/graph.json) is the common graph memory built from the artifacts (259 nodes, 462 edges). [`graph.js`](graph.js) holds the same data for the visualiser in `harness-tutorial.html`.
- Check any document: `node scripts/harness-template-check.mjs <doc> templates/artifacts/<ID>.md`.

| Artifact | Name | Document | Produced by | Approved | Graph nodes |
|---|---|---|---|---|---|
| A-REQUEST | Business request | [docs/product-specs/WI-101/00-request.md](docs/product-specs/WI-101/00-request.md) | work item request | 2026-09-01 | 1 |
| A-BRIEF | Opportunity brief | [docs/product-specs/WI-101/01-brief.md](docs/product-specs/WI-101/01-brief.md) | PM-01 /frame-opportunity | 2026-09-02 | 10 |
| A-JOURNEY | User journeys | [docs/product-specs/WI-101/03-journeys.md](docs/product-specs/WI-101/03-journeys.md) | PD-01 /map-journeys | 2026-09-03 | 4 |
| A-PRD | Product requirements (PRD) | [docs/product-specs/WI-101/02-prd.md](docs/product-specs/WI-101/02-prd.md) | PM-02 /write-prd | 2026-09-04 | 8 |
| A-STORIES | Epics & user stories | [docs/product-specs/WI-101/04-stories.md](docs/product-specs/WI-101/04-stories.md) | PM-03 /slice-stories | 2026-09-07 | 17 |
| A-SCREENS | Screen specification | [docs/product-specs/WI-101/05-screens.md](docs/product-specs/WI-101/05-screens.md) | PD-02 /specify-screens | 2026-09-09 | 8 |
| A-KDD | Key design decisions (KDD / ADR) | [docs/design-docs/WI-101/09-kdd.md](docs/design-docs/WI-101/09-kdd.md) | KDD-01 /decide-key-design | 2026-09-10 | 15 |
| A-TECHDEBT | Tech debt tickets (Jira) | [docs/exec-plans/tech-debt/WI-101.md](docs/exec-plans/tech-debt/WI-101.md) | TD-01 /raise-tech-debt | 2026-09-10 | 4 |
| A-UIKIT | Design tokens & component spec | [docs/product-specs/WI-101/06-ui-kit.md](docs/product-specs/WI-101/06-ui-kit.md) | PD-03 /define-ui-kit | 2026-09-10 | 9 |
| A-NFR | NFR & SLO targets | [docs/design-docs/WI-101/11-nfr.md](docs/design-docs/WI-101/11-nfr.md) | SA-02 /set-nfrs | 2026-09-11 | 6 |
| A-SAD | Solution architecture (SAD + ADRs) | [docs/design-docs/WI-101/10-sad.md](docs/design-docs/WI-101/10-sad.md) | SA-01 /shape-solution | 2026-09-11 | 25 |
| A-DATAMODEL | Data model | [docs/design-docs/WI-101/12-data-model.md](docs/design-docs/WI-101/12-data-model.md) | DA-01 /model-data | 2026-09-12 | 23 |
| A-INTCAT | Integration catalog | [docs/design-docs/WI-101/13-integrations.md](docs/design-docs/WI-101/13-integrations.md) | IA-01 /catalog-integrations | 2026-09-14 | 9 |
| A-MEMDELTA | Graph memory delta | [docs/generated/memory/WI-101/A-INTCAT@1.md](docs/generated/memory/WI-101/A-INTCAT@1.md) | MEM-01 /sync-graph-memory | 2026-09-14 | 0 |
| A-DATAMAP | Data mapping & lineage | [docs/design-docs/WI-101/14-data-mapping.md](docs/design-docs/WI-101/14-data-mapping.md) | DA-02 /map-lineage | 2026-09-15 | 8 |
| A-PLAN | Engineering work breakdown | [docs/exec-plans/active/WI-101/plan.md](docs/exec-plans/active/WI-101/plan.md) | SA-03 /plan-work | 2026-09-16 | 23 |
| A-EVENTS | Event contracts | [docs/design-docs/WI-101/contracts/events.md](docs/design-docs/WI-101/contracts/events.md) | EVT-01 /design-events | 2026-09-17 | 6 |
| A-OPENAPI | REST contract | [docs/design-docs/WI-101/contracts/rest-api.md](docs/design-docs/WI-101/contracts/rest-api.md) | API-01 /design-openapi | 2026-09-17 | 6 |
| A-SDL | GraphQL subgraph schema | [docs/design-docs/WI-101/contracts/graphql-api.md](docs/design-docs/WI-101/contracts/graphql-api.md) | GQL-01 /design-subgraph-schema | 2026-09-17 | 4 |
| A-TESTPLAN | Test strategy & plan | [docs/quality/WI-101/test-plan.md](docs/quality/WI-101/test-plan.md) | QA-01 /plan-tests | 2026-09-17 | 4 |
| A-DDL | Database migration | [docs/design-docs/WI-101/contracts/db-migrations.md](docs/design-docs/WI-101/contracts/db-migrations.md) | DB-01 /write-migrations | 2026-09-18 | 3 |
| A-CONTRACTOK | Contract conformance report | [docs/design-docs/WI-101/15-contract-review.md](docs/design-docs/WI-101/15-contract-review.md) | IA-02 /review-contracts | 2026-09-19 | 2 |
| A-TESTCASES | Test cases | [docs/quality/WI-101/test-cases.md](docs/quality/WI-101/test-cases.md) | QA-02 /design-test-cases | 2026-09-19 | 13 |
| A-UILIB | UI component library PR | [docs/exec-plans/active/WI-101/prs/ui-components.md](docs/exec-plans/active/WI-101/prs/ui-components.md) | UX-01 /build-components | 2026-09-24 | 1 |
| A-OBS | Observability & SLOs as code | [docs/reliability/WI-101/slo.md](docs/reliability/WI-101/slo.md) | SRE-01 /define-slos | 2026-09-25 | 9 |
| A-APIPR | REST service PR | [docs/exec-plans/active/WI-101/prs/service.md](docs/exec-plans/active/WI-101/prs/service.md) | API-02 /implement-service | 2026-09-26 | 1 |
| A-EVTPR | Event producer / consumer PR | [docs/exec-plans/active/WI-101/prs/events.md](docs/exec-plans/active/WI-101/prs/events.md) | EVT-02 /implement-producers-consumers | 2026-09-26 | 1 |
| A-GQLPR | Subgraph resolver PR | [docs/exec-plans/active/WI-101/prs/subgraph.md](docs/exec-plans/active/WI-101/prs/subgraph.md) | GQL-02 /implement-resolvers | 2026-09-29 | 1 |
| A-RUNBOOK | Runbook | [docs/reliability/WI-101/runbook.md](docs/reliability/WI-101/runbook.md) | SRE-02 /write-runbook | 2026-09-30 | 4 |
| A-IOSPR | iOS feature PR | [docs/exec-plans/active/WI-101/prs/ios.md](docs/exec-plans/active/WI-101/prs/ios.md) | IOS-01 /build-ios-feature | 2026-10-01 | 1 |
| A-WEBPR | Web feature PR | [docs/exec-plans/active/WI-101/prs/web.md](docs/exec-plans/active/WI-101/prs/web.md) | WEB-01 /build-web-feature | 2026-10-01 | 1 |
| A-ANDPR | Android feature PR | [docs/exec-plans/active/WI-101/prs/android.md](docs/exec-plans/active/WI-101/prs/android.md) | AND-01 /build-android-feature | 2026-10-02 | 1 |
| A-AUTOTESTS | Automated test suites PR | [docs/exec-plans/active/WI-101/prs/test-automation.md](docs/exec-plans/active/WI-101/prs/test-automation.md) | QA-03 /automate-tests | 2026-10-02 | 4 |
| A-RELEASE | Release plan | [docs/reliability/WI-101/release-plan.md](docs/reliability/WI-101/release-plan.md) | SRE-03 /plan-release | 2026-10-03 | 1 |
| A-PERFREPORT | Performance & resilience report | [docs/quality/WI-101/perf-report.md](docs/quality/WI-101/perf-report.md) | QA-05 /test-performance | 2026-10-05 | 4 |
| A-TESTREPORT | Test execution report | [docs/quality/WI-101/test-report.md](docs/quality/WI-101/test-report.md) | QA-04 /execute-and-verdict | 2026-10-05 | 4 |
| A-SIGNOFF | Product acceptance | [docs/product-specs/WI-101/20-signoff.md](docs/product-specs/WI-101/20-signoff.md) | PM-04 /accept-release | 2026-10-06 | 8 |
| A-DEPLOYREC | Deployment record | [docs/reliability/WI-101/deploy-record.md](docs/reliability/WI-101/deploy-record.md) | SRE-04 /deploy-canary | 2026-10-07 | 1 |
| A-OPSREPORT | Operations report | [docs/reliability/WI-101/ops-report.md](docs/reliability/WI-101/ops-report.md) | SRE-05 /operate-and-report | 2026-10-21 | 3 |
| A-INSIGHTS | Outcome review | [docs/product-specs/WI-101/30-outcomes.md](docs/product-specs/WI-101/30-outcomes.md) | PM-05 /review-outcomes | 2026-10-27 | 6 |
