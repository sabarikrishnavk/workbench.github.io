# Sample migration inputs

A small, consistent retail example for trying the migration pages end to end. The monolithic
MonoGraph and BFF are split into seven federated subgraphs. They match the **Load example**
registry in [`workbench.html`](../workbench.html) and [`GQLRegistry-sample.xlsx`](GQLRegistry-sample.xlsx),
and the seven `subgraph.gql` files compose into a valid supergraph.

| Subgraph | Registry entity | Owns | Contributes / references |
|---|---|---|---|
| `product` | `ENT-001` Product | `Product @key(sku)`: title, description, imageUrl, brand | — |
| `pnp` | `ENT-002` ProductStoreContext | `ProductStoreContext @key(sku storeId)`, `Price` | adds `Product.storeContext(storeId)`, `Product.allStoreContexts` |
| `inventory` | `ENT-003` Inventory | `Inventory @key(sku storeId)` | adds `ProductStoreContext.inventoryCount` |
| `search` | `ENT-004` ProductSearch | `searchProducts`, `SearchResponse`, facets | references `Product` by sku |
| `cart` | `ENT-006` Cart | `Cart @key(id)`, `CartItem`, cart mutations | references `Product` by sku on each line |
| `payments` | `ENT-007` PaymentTransaction | `PaymentTransaction @key(id)`, `processPayment` | — (knows amounts, not what was bought) |
| `checkout` | `ENT-008` Order | `Order @key(id)`, `submitCheckout` (the orchestrating mutation) | adds `Cart.isReadyForCheckout` (`@requires totalAmount`); references `PaymentTransaction` |

## Files

| File | What it is | Where to load it |
|---|---|---|
| [`GQLRegistry-sample.xlsx`](GQLRegistry-sample.xlsx) | The seven-subgraph registry exported from `workbench.html`. Every operation's **Links & References** has a `REST:` line naming its REST endpoint, so REST and GraphQL operations pair automatically. A **BffMappings** sheet pre-maps four BFF endpoints, including the checkout orchestration. | **GQLRegistry.xlsx** picker on `gql-migration.html` and `subgraph-codemigration.html` (or **Load .xlsx** on `workbench.html`) |
| [`DataMappingRegistry-sample.xlsx`](DataMappingRegistry-sample.xlsx) | The retail product, cart and checkout flow, traced attribute by attribute across 7 domains and 15 applications — all seven subgraphs (product, pnp, inventory, search, cart, payments, checkout) with their REST and GraphQL schemas and one Kafka event each. Core and third-party data (MDM via Kafka, PIM via REST API, supplier CSV) feeds the **Product Integration Service**, which publishes `product.ingested.v1`. Each **domain service** owns its table, its REST API, its GraphQL subgraph and the Kafka event it produces (`product.updated.v1`, `price.updated.v1`, `inventory.reserved.v1`, `payment.processed.v1`, `search.product-indexed.v1`, …). The **Inventory Service** exposes its get + reserve operations over REST, GraphQL **and gRPC** (`GRPC-INVENTORY`, a `16-Other` dataset backed by [`inventory.proto`](subgraph/inventory/inventory.proto)). Retail **Web** reads through the **FedGQL router** (GraphQL orchestration) and the Retail **App** through the **BFF** (REST). The **Checkout Service** is an orchestrator: its saga calls the cart, inventory and payments **REST** APIs (never GQL→GQL) and publishes `order.placed.v1`. IDs follow the convention `DOM-04-PRODT` (domain number + 5-letter code) and `APP-04-PRODT-01` (+ app type number: 01 domain service, 02 orchestrator service, 03 integration service…). The lakehouse table `retail.bronze.product_ingested` (Databricks) is fed from `product.ingested.v1`. Dataset kinds are numbered (`01-DB Table` … `16-Other`); an API call is an `06-HTTP Request` / `07-HTTP Response` in REST or GraphQL style. Datasets / Attributes / Events are grouped by application. Sheets: Domains, Applications, Datasets, Attributes, Mappings, Flows, Events, BusinessTerms, plus the editable type sheets GQL Schema, HTTP APIs, Database, Kafka Avro, Databricks and Files. Regenerate it with **Load example** → **Export .xlsx**. | **Load .xlsx** on [`data-mapping.html`](../data-mapping.html) |
| [`DataMappingRegistry-FCC-sample.xlsx`](DataMappingRegistry-FCC-sample.xlsx) | An end-to-end ecommerce flow on **Flipkart Commerce Cloud (FCC) Cart & Checkout** ([Transact API v1](https://docs.flipkartcommercecloud.com/docs/digital-commerce/cart-and-checkout/apis/api-overview)): 4 domains, 9 applications, 32 datasets, 328 attributes, 258 mappings and 48 business terms. **PDP** (Product Service → product subgraph → FedGQL router → Retail Web) carries the SKU's FCC `listingId` into **add to cart**. The **Commerce Orchestrator** (an orchestrator service that owns the commerce subgraph, `cart_session` and `checkout_attempt`) calls the FCC third party: `POST /v1/cart`, `POST /v1/cart/{id}/items` and `GET /v1/cart/{id}`. The cart then reaches the web over GraphQL and the app over the cart REST API → BFF. **placeOrder** runs the FCC saga: `POST /v1/checkout` (soft reservation, delivery promise) → `POST /v1/checkout/{checkoutId}/payments` (creates the order id) → `POST /v1/checkout/{checkoutId}/order` (PENDING / APPROVED), then the order confirmation page. **Order capture:** FCC's payment-termination webhook hits the **FCC Order Bridge** (integration service), which calls `GET /v1/checkout/{checkoutId}` and publishes `order.created.v1` (email hashed) to the **Order Service** tables. Every FCC call carries the five standard headers (`X-Request-Id`, `X-Tenant-Id`, `X-Channel`, `X-Timestamp`, `Authorisation`) with their mappings. FCC endpoints, methods and headers come from the FCC docs. The public docs don't publish request / response bodies, so FCC body fields and the webhook payload are modelled (FCC datasets are `Proposed`); confirm them against `sampleTransactOpenAPI.yaml`. Not modelled: Update Cart Context, Update / Delete Items and the checkout item update / delete calls. | **Load .xlsx** on [`data-mapping.html`](../data-mapping.html) |
| [`mono-graph.gql`](mono-graph.gql) | The monolithic MonoGraph SDL to migrate *from*: product, price, stock, search, cart and checkout in one graph. | `gql-migration.html` → **MonoGraph schema** tab |
| [`bff-openapi.yaml`](bff-openapi.yaml) | Monolithic BFF. Its composite endpoints (search, product detail, cart page, add to cart, checkout, order confirmation, admin price/stock) fan out to several services. The header comment lists the target FedGQL operations for each. | `subgraph-codemigration.html` → REST spec, Mode **BFF composite** |
| [`subgraph/<name>/subgraph.gql`](subgraph/) | Target Apollo Federation 2 SDL for each subgraph. | Reference / router composition |
| [`subgraph/<name>/openapi.yaml`](subgraph/) | The subgraph service's current REST API. Operation ids match the FedGQL operation names. The inventory API now also exposes `reserveInventory` (`POST /inventory/reservations`) alongside `inventory` (get). | `gql-migration.html` → **Import OpenAPI spec** after picking that subgraph's entity, or the REST spec in **Single op** mode on `subgraph-codemigration.html` |
| [`subgraph/<name>/*.avsc`](subgraph/) | One **Kafka event** Avro schema per subgraph (`product.updated.v1`, `cart.item-added.v1`, `price.updated.v1`, `inventory.reserved.v1`, `search.product-indexed.v1`, `payment.processed.v1`, `order.placed.v1`). Namespaces follow `com.retail.<domain>.events`; the fields match each event's `Kafka Avro` sheet rows in `DataMappingRegistry-sample.xlsx`. | Reference / schema-registry subject value |
| [`subgraph/inventory/inventory.proto`](subgraph/inventory/inventory.proto) | The inventory **gRPC** interface (`InventoryService` with `GetInventory` + `ReserveInventory`), mirroring the REST and GraphQL get + reserve operations. Registered as the `GRPC-INVENTORY` dataset. | Reference / service-to-service contract |
| [`subgraph/supergraph-query.graphql`](subgraph/supergraph-query.graphql) + [`.mmd`](subgraph/supergraph-query.mmd) | One **query** across search → product + pnp + inventory, with the router's fan-out as a Mermaid sequence diagram. | Reference |
| [`subgraph/supergraph-mutation.graphql`](subgraph/supergraph-mutation.graphql) + [`checkout-orchestration.mmd`](subgraph/checkout-orchestration.mmd) | One **mutation**, `submitCheckout`, and the saga it runs: cart → inventory → pending order → payment → clear cart, with compensation. | Reference |

## Walkthrough: code migration

1. Open `subgraph-codemigration.html` and load `GQLRegistry-sample.xlsx`.
2. **Single op**: load `subgraph/cart/openapi.yaml`. `GET /carts/{id}` pairs with `query cart`
   automatically. You get:
   - the REST and FedGQL payloads side by side;
   - client or server code;
   - a **sequence trace**: the router calls the cart subgraph, then `_entities` on the product
     subgraph for each line's product fields.

   Pick a mutation (e.g. `addItemToCart`) to see the mutation version.
3. **BFF composite**: load `bff-openapi.yaml` and switch Mode to **BFF composite**.
   - `POST /bff/checkout` is pre-mapped with `submitCheckout` as the **orchestrating mutation**, and
     `cart`, `inventory`, `processPayment`, `clearCart` as its steps. You get:
     - the single mutation the client sends, and its variables;
     - a Node.js orchestrator resolver skeleton;
     - the orchestration sequence diagram.
   - `GET /bff/cart/{cartId}` and `GET /bff/product-detail/{sku}` show **query** federation: one nested
     query plus the router's `@key` fan-out diagram.
   - `POST /bff/cart/{cartId}/items` has no orchestrator, so its diagram shows the router running the
     mutation field directly.

Notes:

- The shapes follow the house schema standards, so they differ a little from a plain Federation
  tutorial:
  - amounts use `Money`, and arrays are `[T!]!`;
  - mutations take a single `…Input` (`addItemToCart(input: AddItemToCartInput!)`);
  - enums have an `UNKNOWN` value;
  - cart lines reference `Product` by `sku` (this example has no `ProductVariant`);
  - `clearCart` returns the emptied `Cart`.
- In checkout's `Cart` extension, the key field `id` is **not** `@external`. In Federation 2 marking it
  `@external` stops the router from satisfying `@requires(fields: "totalAmount")`.
- The OpenAPI importer auto-detects an `@key` only from an `id` / `<Type>Id` field. For entities keyed
  on `sku`, pick the subgraph's registry entity as the migration entity; every generated row is then
  owned by it.
