# Sample migration inputs

A small, consistent retail example for trying the migration pages end to end. The monolithic
MonoGraph and BFF are split into four federated subgraphs. They match the **Load example**
registry in [`workbench.html`](../workbench.html) and [`GQLRegistry-sample.xlsx`](GQLRegistry-sample.xlsx).

| Subgraph | Registry entity | Owns | Contributes |
|---|---|---|---|
| `product` | `ENT-001` Product | `Product @key(sku)`: title, description, imageUrl, brand | — |
| `pnp` | `ENT-002` ProductStoreContext | `ProductStoreContext @key(sku storeId)`, `Price` | `Product.storeContext(storeId)`, `Product.allStoreContexts` |
| `inventory` | `ENT-003` Inventory | `Inventory @key(sku storeId)` | `ProductStoreContext.inventoryCount` |
| `search` | `ENT-004` ProductSearch | `searchProducts`, `SearchResponse`, facets, `ProductFilterInput` | `Product` reference stub (`resolvable: false`) |

## Files

| File | What it is | Where to load it |
|---|---|---|
| [`GQLRegistry-sample.xlsx`](GQLRegistry-sample.xlsx) | The four-subgraph registry exported from `workbench.html`. AuthScopes has one row per scope × persona, with dropdowns for Persona, Kind, Approval Status and EntityID. | **GQLRegistry.xlsx** picker on `gql-migration.html` and `subgraph-codemigration.html` (or **Load .xlsx** on `workbench.html`) |
| [`mono-graph.gql`](mono-graph.gql) | The monolithic MonoGraph ("monograph") SDL to migrate *from*: product, store price, stock and search in one graph. | `gql-migration.html` → **MonoGraph schema** tab |
| [`bff-openapi.yaml`](bff-openapi.yaml) | Monolithic BFF. Each composite endpoint (search page, product detail, store comparison, admin price/stock) fans out to several subgraphs. The header comment lists the target FedGQL operations for each endpoint. | `subgraph-codemigration.html` → REST spec, Mode **BFF composite** |
| [`subgraph/<name>/subgraph.gql`](subgraph/) | Target Apollo Federation 2 SDL for each subgraph (reference). These four compose into a valid supergraph. | Reference / router composition |
| [`subgraph/<name>/openapi.yaml`](subgraph/) | The subgraph service's current REST API. Operation ids match the FedGQL operation names. | `gql-migration.html` → **Import OpenAPI spec** after picking that subgraph's entity (rows come out as `SCH-/QRY-/MUT-<EntityID>-###`), or as the REST spec in **Single op** mode on `subgraph-codemigration.html` |
| [`subgraph/supergraph-query.graphql`](subgraph/supergraph-query.graphql) | One query across all four subgraphs (search → product + store price + stock), with the router's execution plan. | Reference |

Notes:

- The OpenAPI importer auto-detects an `@key` only from an `id` / `<Type>Id` field. The sample
  entities are keyed on `sku` (and `storeId`), so pick the subgraph's registry entity as the
  migration entity; every generated row is then owned by it.
- The example follows the house schema standards (`Money` for amounts, non-null `[T!]!` arrays,
  a single `…Input` argument on mutations), so it differs slightly from a plain Federation
  tutorial. The only remaining findings are advisory warnings on the key-lookup and search
  queries, which take separate arguments.
