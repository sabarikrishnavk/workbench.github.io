# GraphQL Schema Registry

A standalone, single-file HTML5 app that catalogues your **domain GraphQL schema** — canonical
entities and their operations, tagged with the domain hierarchy and auth scopes — then renders a
**federated GraphQL graph** (Mermaid.js) and lets you browse operations in a **GraphiQL-like
explorer**. It round-trips its data through one Excel workbook, `GQLRegistry.xlsx`.

It is independent of the [traceability tracker](../traceability-tracker/) — its own file, its own
data — but uses the same building blocks (schema-driven grids, FK dropdowns, `localStorage`
autosave, the typed **Links** cell editor).

## Run it

Open [`index.html`](index.html) for the introduction, [`help.html`](help.html) for step-by-step help
and [`demo.html`](demo.html) for a slide walkthrough. The registry itself is [`workbench.html`](workbench.html); open it in any modern browser — no build, no server. It loads SheetJS and
Mermaid from a CDN. Click **Load example** to populate the retail sample (product · pnp · inventory · search subgraphs), or **Template** to
start from empty headers. Data autosaves to `localStorage`; Excel is the portable source of truth.

## Subgraphs (`subgraphs/`)

The federated schema lives under [`subgraphs/`](subgraphs/), one folder per Apollo Federation 2
subgraph (`subgraph-schema.graphql`). The former monolithic `products` subgraph was split by
concern, and the `stores` subgraph folded into location:

- **`product`** — the canonical `Product` entity and all product master data.
- **`pnp`** — price & promotions; contributes `price` / `promotions` to the shared
  `ProductAvailability` entity.
- **`instore-location`** — in-store location (layout, floor plan, planogram ) **plus** the
  consolidated Store / Location domain; owns `Store` and contributes `store` + location facts to
  `ProductAvailability`.

`ProductAvailability` is a **distributed entity**: all three subgraphs declare it with the
same `@key(fields: "productId storeId salesChannel")` and each contributes a slice of its fields.

`GQLRegistry.xlsx` is generated from **every** `subgraphs/*/subgraph-schema.graphql`: the **Entities**
+ **Schema** sheets are the `@key`ed types (one canonical row per type name; their `@key` and field
list on the Schema sheet), and the **Queries** / **Mutations** sheets are the `Query` / `Mutation`
root fields (with `@authenticated` / `@requiresScopes` captured into `AuthScopes`). A
**distributed entity** contributed by several subgraphs (like `ProductAvailability`)
is merged into one row: the **union** of all its fields, so e.g. `price` + `promotions` (pnp),
`store` + location facts (instore-location) and `product` + `range` (product) all appear
together. `Links` then lists every contributing subgraph file. The **AuthScopes** sheet is *not*
derived from SDL (personas + permission detail are a business mapping); it is seeded with
representative scope × persona rows for architects to fill in. Sample migration inputs live in
[`samples/`](samples/).

## Workbook: `GQLRegistry.xlsx`

**Five sheets.** The **first column of each sheet is its ID**. `EntityID` on **Schema**, **Queries**
and **Mutations** is a foreign key to **Entities** (Schema is 1:1 with an entity). Every sheet's last
column is `Links` (**Links & References**): zero or more references, one per line, each tagged with a
type from a dropdown: **LeanIX** (fact sheet), **Confluence** (page), **ER** (entity-relationship
model) or **Other** (anything else, e.g. a source file). It is stored as `Type: target` per line in a
single cell. Untagged lines read as `Other`. The migration pages show these
links in their entity details, and `gql-migration.html` lets you edit them on the FedGQL subgraph tab.

**Governance columns on every sheet** (just before `Links`): **Contacts**, **Approval Status**,
**Comments**, and **Current Reference**.
**Contacts** is a single multi-value cell (edited like the **Links** cell) — add one line per owner,
each tagged with a role of **Domain Architect** or **Technical Service Owner** ; it is stored as `Role: value` per line. **Approval Status** is a dropdown of
`Draft` / `Proposed` / `Approved` / `Deprecated`. **Comments** is free text (multi-line).
**Current Reference** (`CurrentReference`) is a multi-value cell for **migration linkage** — add one
line per legacy operation this entity/operation migrates from, each tagged with its source system
(**REST** / **monograph** / **Other**); it is stored as `Source: operationId` per line. All are blank when
generated from SDL; fill them in for traceability/governance.

### Entities — ID: `EntityID` — one unique row per canonical entity
LeanIX fact sheets go in **Links** as a `LeanIX` line.

| Column | Notes |
|---|---|
| EntityID | e.g. `ENT-001` |
| Name | Canonical entity/type name, e.g. `Price` |
| ExperienceDomain | e.g. "Digital Commerce", "Merchandising" |
| BusinessDomain | e.g. "Pricing & Promotions" |
| BusinessCapability | e.g. "Pricing Rules Management" |
| Description | |

### Schema — ID: `SchemaID` — the GraphQL type/enum/key definitions
The Schema sheet holds **all GraphQL types** — not only `@key` entities. Each row's **Kind** says what
it is, and **Attributes** (the `Fields` column) holds its members.
| Column | Notes |
|---|---|
| SchemaID | e.g. `SCH-ENT-001-001` |
| EntityID | → Entities (for `Key` rows; blank for registry-wide enums/scalars) |
| Kind | dropdown: `Key` / `Type` / `Enum` / `Input` / `Interface` / `Scalar` |
| TypeName | the GraphQL type/enum name (for `Key` rows, blank falls back to the entity's Name) |
| Definition | the **raw SDL body** of the type — the `@key(fields: "…") { … }` block including field-level directives (`@inaccessible`, …); for an **Enum** just the values, one per line; blank for a scalar |

Example `Definition` for `ProductAvailability`:
```graphql
@key(fields: "productId storeId salesChannel") {
  productId: ID! @inaccessible
  storeId: ID! @inaccessible
  salesChannel: SalesChannel!
  price: ProductPrice
  promotions: [ProductPromotion!]!
}
```
The graph, explorer and SDL generators parse the `@key` fields and the field list straight out of
`Definition`.

A starter set of reusable **enums** (`CurrencyCode`, `SortDirection`, `OrderStatus`) is seeded so the
type dropdowns have content immediately.

**Default scalars & the `FedGQL` foundational entity.** Every registry ships a foundational entity
named **`FedGQL`** (Business Application `FedGQL`) that *owns* the **default scalar types** used across
all entity schemas — the built-ins (`ID`, `String`, `Int`, `Float`, `Boolean`) plus the common custom
scalars (`DateTime`, `Date`, `DateTimeISO`, `JSON`, `Long`, `BigDecimal`, `Decimal`, `Money`, `URL`).
These appear on the **Schema** sheet as `Scalar` rows whose `EntityID` points at the `FedGQL` entity,
so they always populate the type comboboxes and the generated SDL. A fresh **Template** already
contains this entity (as `ENT-001`) and its scalar rows; in a populated workbook the `FedGQL` entity is
appended at the next free `ENT-###` id.

### Queries — ID: `QueryID`
| Column | Notes |
|---|---|
| QueryID | e.g. `QRY-ENT-001-001` |
| EntityID | → Entities (the entity the return type resolves to) |
| Name | e.g. `getPrice` |
| Parameters | one `name: Type` per line — **Name** is free text, **Type** is a combobox (dropdown of registered types/enums/keys + scalars, but you can still type wrappers like `ID!`). `+ parameter` adds a line. |
| ReturnType | a type combobox — e.g. `Price`, or type `[PromotionRule!]!` freely |

> The type dropdowns in **Parameters** and **ReturnType** are driven by the **Schema** sheet and
> update live when you pick an **EntityID**: that entity's own types/enums/keys are offered first
> (marked ★), then all other registry types, then GraphQL scalars. Because they're comboboxes you can
> always type list/non-null wrappers (`[Type!]!`) that a plain dropdown couldn't express.
| AuthScopes | comma/space-separated, e.g. `price:read` |
| Description | |

### Mutations — ID: `MutationID`
| Column | Notes |
|---|---|
| MutationID | e.g. `MUT-ENT-001-001` |
| EntityID | → Entities |
| Name | e.g. `updatePrice` |
| Parameters | `name: Type` list |
| ReturnType | |
| AuthScopes | |
| Description | |

### AuthScopes — ID: `ScopeID` — auth scope → persona access
**One row per scope × persona.** **Persona** is a dropdown (`Customer` / `CustomerCare` /
`B2BShopper` / `B2BShopperCare` / `B2BAdmin` / `B2BAdminCare`). **Permission** says what the scope grants
that persona. A persona with no row for a scope has no access to it. To grant a scope to another
persona, add a row.

| Column | Notes |
|---|---|
| ScopeID | e.g. `SCP-ENT-001-001` (see *Row IDs* below) |
| EntityID | → Entities (the entity the scope protects) |
| Scope | the auth scope, e.g. `price:read`, `cust:org:approve` |
| Persona | dropdown, one persona per row |
| Permission | e.g. `read own order`, `read all org orders` |
| Description | free-text notes |

### Row IDs
`Entities` use `ENT-###`. Every sheet that hangs off an entity (**Schema**, **Queries**,
**Mutations**, **AuthScopes**) embeds the owning entity in its id, the same scheme the migration
workbench generates: `SCH-/QRY-/MUT-/SCP-<EntityID>-<seq>`, with `<seq>` counted per prefix and
entity (e.g. `QRY-ENT-003-002`). **+ Add row** creates `…-ENT-000-###` (unassigned), or uses the
entity when the grid is filtered to exactly one. Picking the row's **Entity** renumbers the id under
that entity. Ids you typed by hand are never renumbered.

### Excel dropdowns
**Export** and **Template** write in-cell dropdowns into the workbook: Persona, Kind and Approval
Status get their fixed lists, and EntityID gets the Entities sheet's id column. A value outside the
list shows a warning but is still allowed.

## Migration workbench: `gql-migration.html`

A second standalone single-file app ([`gql-migration.html`](gql-migration.html)) helps migrate the
monolithic **monograph** GraphQL schema (and the BFF **REST** APIs) onto the federated model, and lets you
**assemble the target state and write it back** into `GQLRegistry.xlsx`. Open it in any browser — same
stack (SheetJS + js-yaml, no build). It loads **three** sources (via file pickers, or auto-fetched
from the same folder / `../documents/` when served over http):

- **FedGQL-Migration-Analysis.xlsx** — the per-domain migration analysis (`Operations`, `Summary`).
- **GQLRegistry.xlsx** — the target federated model (all five sheets are loaded so they can round-trip
  on write-back).
- **`subgraphs/monograph/schema.graphqls`** — the monograph source SDL, parsed in-browser (the same
  block/field parser as the generators).

Six tabs:
- **Load data** — the three source pickers, plus **Import mapping (JSON)**. (The header toolbar has
  **Export mapping**, **Export GQLRegistry.xlsx**, and **Import mapping**.)
- **monograph schema** — search the parsed types / inputs / enums / interfaces and the Query / Mutation /
  Subscription **methods**. **Copy SDL** copies the source block (or a method signature) and
  **Copy as @key entity** emits a federation-ready `type X @key(fields: "…") { … }` stub. Each item
  has an **Assign** control (target **domain** + **entity**) — assigned items get a `→ domain/entity`
  badge and are picked up by the Target-domains view and the Excel write-back.
- **REST → GraphQL** — migrate BFF REST endpoints. **Import OpenAPI (JSON/YAML)** walks
  `paths[*][method]` → `operationId`, params, and the `200`/`201` response schema (resolving `$ref`
  into `components.schemas`), mapping JSON-schema types to GraphQL (`string→String`, `integer→Int`,
  `number→Float`, `boolean→Boolean`, `array→[T]`, `$ref→TypeName`); or add one **manually** (paste an
  example request/response JSON — field types are inferred). Each becomes a candidate query
  (GET) or mutation, assigned to a target domain/entity, with a **composes** multi-select of the
  target ops/entities it resolves through. The detail pane shows the generated FedGQL
  (`type …` + `type Query/Mutation { # composes: … }`) with copy.
- **Target domains** — a list of target domains (registry `BusinessDomain` values plus any custom
  ones you typed). Selecting one shows everything assigned to it — **Entities** (with their monograph
  source + field count), **Queries**, **Mutations**, and REST-backed ops — and a generated, copyable
  **subgraph SDL** block (`type … @key`, `type Query { … }`, `type Mutation { … }`).
- **Analysis** — pick a migration domain and see its operations (call volume, REST dependencies, and
  a colour `MigrationStatus` tag) plus the target registry entities matched to it.
- **Diff** — pick a monograph source type and a target entity (same-named pairs auto-select); a
  field-level diff flags **only-in-monograph** / **only-in-target** / **match** / **type-mismatch**, and a
  coverage panel lists which target entities already have a same-named monograph type.

**Persistence & write-back.** Your assignments and REST APIs (the *mapping*) autosave to
`localStorage` and export/import as a JSON file. **Export GQLRegistry.xlsx** rebuilds the workbook
from the loaded sheets and **appends** rows generated from the mapping: each assigned monograph type → a
new **Entities** + **Schema** row (`ENT-###` / `SCH-###`, `BusinessDomain` = target domain,
`ApprovalStatus` = "Proposed"); each assigned monograph/REST query or mutation → a new **Queries** /
**Mutations** row (FK to the target entity, with a `from REST …` / `monograph:…` provenance note). IDs
continue from the highest existing suffix, existing rows and their governance columns are preserved,
and rows whose Name already exists are skipped, so re-exporting is idempotent. The download is a fresh
`GQLRegistry.xlsx` to drop back into `../documents/`.

## Schema standards (`standards.json`)

[`standards.json`](standards.json) encodes the validatable rules from **GQL Federation – Schema
Standards and Patterns** so the registry can flag entries that drift from convention. It holds:

- `patterns` — the regexes for `PascalCase` / `camelCase` / `SCREAMING_SNAKE_CASE`, versioned-name
  detection, and the non-null array shape.
- `scalars` — the approved custom-scalar list, `discouraged` scalars (e.g. `DateTime` → prefer
  `DateTimeISO`), and the monetary field/scalar hints for the "use `Money`" check.
- `abbreviations` — agreed abbreviations and the all-caps allow-list.
- `verbHints` — leading verbs that satisfy the "mutations start with a domain verb" nudge.
- `rules[]` — one object per rule: `id`, `title`, `category` (the schema section it groups under),
  `section` (the doc heading it cites), `severity` (`error` / `warning` / `info`), `message` and a
  suggested `fix`. Set `"enabled": false` on a rule to switch it off.

Rules cover **type/input/enum/scalar** naming and shape (PascalCase types, `Input` suffix,
`SCREAMING_SNAKE_CASE` enum values, standardized scalars), **field** conventions (camelCase, Boolean
prefixes, `[T!]!` arrays, non-null `@key` fields, `Money` over `Decimal`), and **query/mutation**
conventions (camelCase names, single `input:` argument, no `V2`-style versioning).

The file is loaded over http (`fetch`) when the app is served; when opened straight from disk
(`file://`, where `fetch` is blocked) the app falls back to an **embedded copy** baked into
`workbench.html`. Keep the two in sync when editing rules.

## Views

- **Registry** — editable grids for all five sheets (add / edit / delete rows, auto-suggested IDs,
  FK dropdown to Entities, typed Links editor). Edits autosave. Every column header has an
  **Excel-like filter** (the **▾** funnel): a popup with a search box, **(Select all)**, and a checklist
  of the column's distinct values (foreign-key columns show the entity name; empty cells show as
  **(Blanks)**). Filters combine across columns (AND) so you can narrow to, e.g., one entity's `Key`
  rows; a filtered column's funnel is highlighted, the toolbar shows **Clear filters (n)** and an
  *"m of N rows shown"* count, and adding a row clears the sheet's filters so the new row is visible.
  Filters are view-only — they never change what is saved or exported.
  As you edit the **Schema**, **Queries** and **Mutations** sheets, entries are checked live against
  the team's schema standards (see [`standards.json`](#schema-standards-standardsjson)): an offending
  **cell** is outlined (red for errors, amber for warnings), and a **⚠ badge** in the row's action
  column expands to list each violation with its **rule ID** and a **§section ↗** link to the
  standards doc. Validation is **advisory only** — it never blocks editing, saving or export. The
  toolbar's **Standards ⓘ** button opens a side drawer listing every active rule grouped by schema
  section.
- **Federated Graph** — a generated Mermaid `flowchart`: a **Supergraph Gateway** → one **subgraph
  box per domain** (toggle grouping by *Business Domain* or *Business Capability*). Each entity node is
  labelled with its `@key` (from the **Schema** sheet) and its operation count (Queries + Mutations).
  Entities sharing the same canonical `Name` across domains are joined by a dashed **federation edge**
  ("extends"). The Mermaid source is shown and copyable.
- **Explorer** (GraphiQL-like, read-only — there is no server to execute against) — left pane lists
  **Queries + Mutations** grouped by *domain › entity*, with **All / Queries / Mutations** filter tabs
  and a search box. Selecting an operation shows its signature, **Parameters**, return type,
  **Auth Scopes** tags, description, a generated **sample operation document** (with `$variables`
  from Parameters and a selection set built from the entity's **Schema** fields — object-typed fields
  that resolve to another registered entity are **expanded recursively**, up to 3 levels, so nested
  facts like `product { availability { price promotions } }` surface), and the generated **Entity SDL**
  — each with a copy button.
- **Subgraph SDL** — pick an entity/subgraph and see its **full** SDL: every `@key`, type, input,
  enum, interface and scalar registered under it, plus its `Query`/`Mutation` operations. Copyable.
- **Summary** — a per-**subgraph** (Business Application) rollup and federation view. A **colour
  legend** at the top of the section assigns each subgraph/domain a stable colour (used by the
  federation-reference chips in the tree below), then two parts:
  - **Type relationships** — a **collapsible tree** for the selected subgraph, rooted at its
    `Query`/`Mutation` operations (each expanded through its return type's fields) and its `@key`
    entity types. Object-typed fields expand recursively (with a cycle guard). A field whose type is
    **owned by another subgraph** stops as a coloured **federation reference** chip
    (`⇄ Product · from product`) instead of expanding — so, e.g., `searchProducts → SearchResults
    → hits → SearchHit → product` surfaces `Product` as a reference into the `product` subgraph.
    **Expand all** / **Collapse all** control the whole tree.
  - **Per-subgraph rollup** — a table counting **Keys / Types / Inputs / Interfaces / Enums / Scalars /
    Queries / Mutations** per subgraph with a totals row, plus an **Approval status** breakdown
    (Approved / Proposed / Draft / Deprecated chips) aggregated across each subgraph's schema rows and
    operations.

### Entity SDL vs. Subgraph SDL (scoping)
The two SDL surfaces answer different questions:
- **Entity SDL** (Explorer, per operation) is **scoped to what the selected operation reaches**. Starting
  from the operation's return + parameter types, it walks field references transitively and emits only
  the value types / inputs / enums / scalars in that closure. Any **other `@key` entity** it references
  is emitted as a short **federation reference stub** (`type X @key(fields: "…") { …key fields… }`), not
  its full body — mirroring how a subgraph declares just enough of an entity it doesn't own. E.g. the
  `search` subgraph's `searchProduct` returns `SearchProduct` and references `Product` only as a
  `@key(fields: "sku")` stub; the full `Product` lives in the `product` subgraph.
- **Subgraph SDL** (its own tab) is the **full, unscoped set** for an entity — every row registered
  under it — for reviewing or copying a subgraph's complete contribution.

## Toolbar

**Load .xlsx** (import — replaces current data), **Export .xlsx** (`GQLRegistry.xlsx`),
**Template** (`GQLRegistry-template.xlsx`, headers only), **Load example**, **Clear**.

## Sharing via SharePoint or Google Drive (pull → merge → push)

Keep `GQLRegistry.xlsx` in a SharePoint document library or a Google Drive folder and let several
people edit it. Pick the target with the **SharePoint | Google Drive** switch in the sync bar; each
target keeps its own links and last-sync time, and the buttons below act on the selected one. Share this
HTML file with them (email it, drop it in the same library, or host it anywhere) — everyone works
against the one shared workbook. The sync bar under the header drives it.

**Why it's two clicks, not automatic:** a plain HTML file opened from disk (`file://`) cannot sign
in to Microsoft or Google — OAuth needs the page served from a registered `https://` URL. So the app
doesn't store your password or call SharePoint / Drive directly; instead it opens them for you to
download / upload, and does the data **merge** itself.

### One-time setup
Click **SharePoint settings** (or **Google Drive settings**) and paste two links:
- **Workbook URL** — the `GQLRegistry.xlsx` file itself. For Google Drive use *Share → Copy link*;
  a Google Sheet link also works (it is downloaded as `.xlsx`).
- **Folder URL** — the SharePoint document library or Drive folder you upload new versions to.

These are saved in your browser (`localStorage`), so each person sets them once.

### Pull & merge
1. Click **Pull & merge** → **Open in SharePoint** / **Download from Google Drive** to download the
   latest `GQLRegistry.xlsx` (for Drive the app builds the direct-download link from the share link).
2. Select that downloaded file. The app **merges** it into your local data (it does *not* blindly
   replace), then shows a summary (added / updated / kept / conflicts / removed).

### Save & push
Click **Save & push** — the app exports the merged workbook as the next version (`…-v3.xlsx`), then
opens the library / Drive folder so you can upload it alongside the previous version. Do a **Pull & merge** first if others may have edited since your last sync.

### Merge rules (conflict policy: **keep both**)
The app remembers a snapshot of the last state you synced (the *base*) and does a 3-way merge by row
ID:
- New rows on either side are **added**; a row deleted on one side (and untouched on the other) is
  **removed**.
- A row edited only locally keeps your edit; a row edited only in the shared copy takes the shared
  version.
- A row edited on **both** sides → **keep both**: the shared (SharePoint / Drive) version stays at its ID and your
  version is re-added as a new row with a suffixed ID (`ENT-001-L1`) and a `(local copy)` name, so
  nothing is lost and a human reconciles the duplicate later.

> Because everyone replaces the same file, treat **Pull & merge → edit → Save & push** as the loop,
> and pull right before you push to minimize conflicts. SharePoint's and Drive's version history is
> your safety net if an upload goes wrong.
