/* dm-types.js — per-type dataset editors and per-type Excel sheets for data-mapping.html.
   Every dataset keeps its fields in the Attributes sheet (that is what the canvas, mappings and lineage use);
   this file adds what each TYPE needs on top, edited in one dialog and saved in its own workbook sheet:
     HTTP request / response     → HTTP APIs     (style REST: OpenAPI operation · style GraphQL: query / mutation)
                                 + GQL Schema    (the GraphQL types behind a GraphQL call, as in GQLRegistry.xlsx)
     GQL type                    → GQL Schema
     DB table / collection       → Database      (ER columns: PK, FK, not null, default, unique · indexes)
     Kafka event                 → Kafka Avro    (Avro record fields) · Databricks StructType preview
     Databricks table            → Databricks    (Delta table columns, partitions)
     CSV / JSON file             → Files         (columns, delimiter, header, encoding)
   Type-level details live on the dataset (d.Spec), field-level ones on the attribute (a.Spec); anything not
   set is derived from the dataset (its Location, Events row, application technology). The sheets round-trip:
   Load .xlsx reads them back into Datasets / Attributes. Reuses data-mapping.html's globals. */

// HTTP datasets: rest = REST request / response; gqlq = GraphQL response (selection under the operation),
// gqlm = GraphQL request (variables / input under the argument names).
const DT = {
  gqlq: { t: "HTTP response · GraphQL", sheet: "HTTP APIs", src: "GraphQL SDL" },
  gqlm: { t: "HTTP request · GraphQL", sheet: "HTTP APIs", src: "GraphQL SDL" },
  gqlt: { t: "GQL type", sheet: "GQL Schema", src: "GraphQL SDL" },
  rest: { t: "HTTP · REST", sheet: "HTTP APIs", src: "OpenAPI (YAML)" },
  db: { t: "Database", sheet: "Database", src: "SQL DDL" },
  kafka: { t: "Kafka event", sheet: "Kafka Avro", src: "Avro schema" },
  dbx: { t: "Databricks table", sheet: "Databricks", src: "Databricks SQL" },
  file: { t: "File", sheet: "Files", src: "YAML" },
  yaml: { t: "Dataset", sheet: "", src: "YAML" },
};
// The editor family of a dataset (HTTP ones by their style and direction).
function dtFamD(d) { const k = KN(d && d.Kind); if (k === "HTTP API") return "rest"; if (/^HTTP/.test(k)) return dsStyle(d) === "GraphQL" ? (/Request/.test(k) ? "gqlm" : "gqlq") : "rest"; return dtFam(k); }
function dtFam(kind) {
  const k = KN(kind);
  return /^GQL Type/.test(k) ? "gqlt" : /^HTTP|^REST/.test(k) ? "rest" : /^DB (Table|Collection)/.test(k) ? "db"
    : /^Kafka/.test(k) ? "kafka" : /^Databricks/.test(k) ? "dbx" : /^(CSV|JSON) Schema/.test(k) ? "file" : "yaml";
}
const YN = ["Y", "N"];
const DT_SHEETS = {
  "GQL Schema": ["SchemaID", "DatasetID", "AppID", "Root", "Kind", "TypeName", "Definition", "Description", "Status"],
  "HTTP APIs": ["DatasetID", "AppID", "Direction", "Style", "Method", "Path", "OpType", "Operation", "Parameters", "ReturnType", "AuthScopes", "OperationId", "StatusCode", "ContentType", "Summary", "In", "Field", "Type", "Format", "Required", "Description"],
  "Database": ["DatasetID", "AppID", "ObjectType", "Engine", "Database", "Schema", "Name", "Column", "DataType", "PK", "FK", "Nullable", "Default", "Unique", "Description", "Indexes"],
  "Kafka Avro": ["DatasetID", "AppID", "Topic", "Namespace", "Record", "KeyField", "Compatibility", "Field", "AvroType", "LogicalType", "Optional", "Default", "Doc"],
  "Databricks": ["DatasetID", "AppID", "Catalog", "Schema", "Table", "TableFormat", "Column", "SparkType", "Nullable", "Partition", "Comment"],
  "Files": ["DatasetID", "AppID", "FileType", "FileNamePattern", "Delimiter", "Header", "Encoding", "Column", "Type", "Required", "Pattern", "Description"],
};
const nonEmpty = o => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v != null && String(v) !== ""));
const lowerFirst = s => String(s || "").replace(/^./, c => c.toLowerCase());
const baseT = t => String(t || "").replace(/[\[\]!\s]/g, "");

/* ------------------------- derived defaults ---------------------------- */
// Type-level details of a dataset: derived from what the registry already knows, overridden by d.Spec.
function dtSpec(d, db) {
  db = db || DB; const f = dtFamD(d), loc = S(d.Location), sp = {}, app = db.Applications.find(a => a.AppID === d.AppID) || {};
  if (f === "gqlq" || f === "gqlm" || f === "rest") { sp.Style = f === "rest" ? "REST" : "GraphQL"; sp.Direction = KN(d.Kind) === "HTTP API" ? "" : (/Request/.test(KN(d.Kind)) ? "Request" : "Response"); }
  if (f === "gqlq" || f === "gqlm") { const m = loc.match(/^(\w+)\s*(?:\(([\s\S]*)\))?\s*:\s*(.+)$/); sp.OpType = "query"; sp.Name = m ? m[1] : lowerFirst(pascal(d.Name)); sp.Parameters = m && m[2] ? m[2].split(/,\s*/).join("\n") : ""; sp.ReturnType = m ? m[3].trim() : ""; sp.AuthScopes = ""; }
  else if (f === "gqlt") { sp.TypeName = pascal(String(d.Name || d.DatasetID).replace(/\(.*?\)/g, "")); sp.Kind = "Type"; }
  else if (f === "rest") { const m = loc.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/i), req = /Request/.test(KN(d.Kind));
    sp.Method = m ? m[1].toUpperCase() : req ? "POST" : "GET"; sp.Path = m ? m[2] : (loc.startsWith("/") ? loc : "/"); sp.OperationId = lowerFirst(sp.Method.toLowerCase() + pascal(sp.Path.replace(/\{[^}]*\}/g, "").replace(/\/v\d+\//, "/")));
    sp.Summary = d.Description || ""; sp.StatusCode = req ? "" : "200"; sp.ContentType = "application/json"; }
  else if (f === "db") { const coll = /Collection/.test(KN(d.Kind)), parts = loc.split(".").filter(Boolean), tech = String(app.Technology || "");
    sp.ObjectType = coll ? "Collection" : "Table"; sp.Engine = /postgres/i.test(tech) ? "PostgreSQL" : /mongo/i.test(tech) ? "MongoDB" : /mysql/i.test(tech) ? "MySQL" : /oracle/i.test(tech) ? "Oracle" : /sql ?server|mssql/i.test(tech) ? "SQL Server" : coll ? "MongoDB" : "PostgreSQL";
    if (parts.length >= 3) { sp.Database = parts[0]; sp.Schema = parts[1]; sp.Name = parts.slice(2).join("."); } else if (parts.length === 2) { sp.Database = parts[0]; sp.Schema = ""; sp.Name = parts[1]; } else { sp.Database = ""; sp.Schema = ""; sp.Name = parts[0] || String(d.Name || "").replace(/\s*\(.*\)$/, ""); }
    sp.Indexes = ""; }
  else if (f === "kafka") { const ev = db.Events.find(e => e.DatasetID === d.DatasetID) || {}, dom = db.Domains.find(x => x.DomainID === app.DomainID);
    sp.Topic = ev.Topic || loc; sp.Namespace = "com.retail." + String(dom ? String(dom.Name).split(/\W+/)[0] : "data").toLowerCase() + ".events"; sp.Record = pascal(ev.EventName || String(d.Name || d.DatasetID).replace(/\.v\d+$/, "")); sp.KeyField = ev.PartitionKey || ""; sp.Compatibility = ev.Compatibility || "BACKWARD"; }
  else if (f === "dbx") { const parts = loc.split(".").filter(Boolean); sp.Catalog = parts.length >= 3 ? parts[0] : ""; sp.Schema = parts.length >= 2 ? parts[parts.length - 2] : ""; sp.Table = parts[parts.length - 1] || String(d.Name || "").replace(/\s*\(.*\)$/, ""); sp.TableFormat = "DELTA"; }
  else if (f === "file") { sp.FileType = /JSON/.test(KN(d.Kind)) ? "JSON" : "CSV"; sp.FileNamePattern = d.Name || ""; sp.Delimiter = sp.FileType === "CSV" ? "," : ""; sp.Header = sp.FileType === "CSV" ? "Y" : ""; sp.Encoding = "UTF-8"; }
  return Object.assign(sp, nonEmpty(d.Spec), d.Spec && d.Spec.Types ? { Types: d.Spec.Types } : {});
}
// Field-level details: derived from the attribute, overridden by a.Spec.
function dtAttrSpec(d, a, sp) {
  const f = dtFamD(d), s = {}, fam = typeFamily(a.DataType);
  if (f === "rest") { const stored = a.Spec && a.Spec.In, params = (String((sp || {}).Path || "").match(/\{(\w+)\}/g) || []).map(x => x.slice(1, -1)); s.In = stored || (sp && sp.Direction === "Request" && params.includes(a.Path) ? "path" : "body"); s.Format = (a.Spec && a.Spec.Format) || { timestamp: "date-time", date: "date", uuid: "uuid", long: "int64" }[fam] || ""; }
  else if (f === "db") { s.PK = /primary key|\bpk\b/i.test(a.Description || "") || ((sp || {}).ObjectType === "Collection" && a.Path === "_id") ? "Y" : "N"; s.FK = ""; s.Default = ""; s.Unique = "N"; }
  else if (f === "kafka") { s.AvroType = ""; s.LogicalType = ""; s.Default = ""; }
  else if (f === "dbx") { s.Partition = /partition/i.test(a.Description || "") ? "Y" : "N"; }
  else if (f === "file") { s.Pattern = ""; }
  return Object.assign(s, nonEmpty(a.Spec));
}
function dtLocation(d, sp) {
  const f = dtFamD(Object.assign({}, d, { Spec: Object.assign({}, d.Spec, sp && sp.Style ? { Style: sp.Style } : {}) }));
  if (f === "gqlq" || f === "gqlm") { const ps = String(sp.Parameters || "").split(/\n+/).map(x => x.trim()).filter(Boolean); return `${sp.Name}${ps.length ? "(" + ps.join(", ") + ")" : ""}: ${sp.ReturnType || "Boolean"}`; }
  if (f === "rest") return `${sp.Method} ${sp.Path}`;
  if (f === "db") return [sp.Database, sp.Schema, sp.Name].filter(Boolean).join(".");
  if (f === "dbx") return [sp.Catalog, sp.Schema, sp.Table].filter(Boolean).join(".");
  if (f === "kafka") return sp.Topic || d.Location;
  return d.Location;
}
// One line for tables: what the dataset is, in its type's own words.
function dtSummary(d) {
  const sp = dtSpec(d), f = dtFamD(d);
  return f === "gqlq" || f === "gqlm" ? `GraphQL ${sp.OpType} ${dtLocation(d, sp)}` : f === "gqlt" ? `${sp.Kind} ${sp.TypeName}` : f === "rest" ? `REST ${sp.Method} ${sp.Path}${sp.StatusCode ? " → " + sp.StatusCode : ""}`
    : f === "db" ? `${sp.Engine} ${sp.ObjectType.toLowerCase()} ${dtLocation(d, sp)}` : f === "kafka" ? `${sp.Topic} · ${sp.Namespace}.${sp.Record}` : f === "dbx" ? `${sp.TableFormat} ${dtLocation(d, sp)}` : f === "file" ? `${sp.FileType} ${sp.FileNamePattern}` : S(d.Location);
}

/* --------------------------- type mappings ----------------------------- */
const DT_SQLISH = /^(VARCHAR|CHAR|TEXT|INTEGER|INT|BIGINT|SMALLINT|NUMERIC|DECIMAL|BOOLEAN|BOOL|TIMESTAMP|TIMESTAMPTZ|DATE|UUID|JSONB?|REAL|DOUBLE|FLOAT|BYTEA|SERIAL|BIGSERIAL|NVARCHAR|CLOB|BLOB|TIME)\b/i;
const DT_SPARKISH = /^(STRING|INT|INTEGER|BIGINT|LONG|SMALLINT|TINYINT|DOUBLE|FLOAT|DECIMAL|BOOLEAN|TIMESTAMP|TIMESTAMP_NTZ|DATE|BINARY|ARRAY|STRUCT|MAP)\b/;
function dtGqlType(a) {
  const t = S(a.DataType);
  if (/^[\[A-Z]/.test(t) && !DT_SQLISH.test(t) && !DT_SPARKISH.test(t)) return t;
  return ({ string: "String", int: "Int", long: "Int", decimal: "Float", boolean: "Boolean", timestamp: "DateTime", date: "Date", uuid: "ID", enum: "String" }[typeFamily(t)] || "String") + (a.Required === "Y" ? "!" : "");
}
function dtSqlType(a) { const t = S(a.DataType); if (DT_SQLISH.test(t)) return t.toUpperCase(); return { string: "VARCHAR(255)", int: "INTEGER", long: "BIGINT", decimal: "NUMERIC(18,2)", boolean: "BOOLEAN", timestamp: "TIMESTAMPTZ", date: "DATE", uuid: "UUID", enum: "VARCHAR(40)" }[typeFamily(t)] || "TEXT"; }
function dtSparkType(a) { const t = S(a.DataType); if (DT_SPARKISH.test(t)) return t; const m = t.match(/^(?:NUMERIC|DECIMAL)\s*\((\d+)\s*,\s*(\d+)\)/i); if (m) return `DECIMAL(${m[1]},${m[2]})`; return { string: "STRING", int: "INT", long: "BIGINT", decimal: "DECIMAL(18,2)", boolean: "BOOLEAN", timestamp: "TIMESTAMP", date: "DATE", uuid: "STRING", enum: "STRING" }[typeFamily(t)] || "STRING"; }
function dtAvroType(a) {
  const s = a.Spec || {}, fam = typeFamily(a.DataType);
  const logical = s.LogicalType || { timestamp: "timestamp-millis", date: "date", uuid: "uuid" }[fam] || "";
  const prim = s.AvroType || { string: "string", int: "int", long: "long", decimal: "double", boolean: "boolean", timestamp: "long", date: "int", uuid: "string", enum: "string" }[fam] || "string";
  if (!s.AvroType && fam === "enum") { const sym = String(a.Example || "").split("|").map(x => x.trim()).filter(x => /^[A-Za-z_]\w*$/.test(x)); if (sym.length > 1) return { type: "enum", name: pascal(String(a.Path).split(".").pop().replace("[]", "")), symbols: sym }; }
  if (logical === "decimal") return { type: "bytes", logicalType: "decimal", precision: 18, scale: 2 };
  return logical ? { type: prim, logicalType: logical } : prim;
}
const dtAvroLabel = a => { const t = dtAvroType(a); return typeof t === "string" ? t : t.type === "enum" ? "enum" : `${t.type} (${t.logicalType})`; };
function dtOas(a) { const fam = typeFamily(a.DataType), s = a.Spec || {};
  const o = { string: { type: "string" }, int: { type: "integer", format: "int32" }, long: { type: "integer", format: "int64" }, decimal: { type: "number" }, boolean: { type: "boolean" }, timestamp: { type: "string", format: "date-time" }, date: { type: "string", format: "date" }, uuid: { type: "string", format: "uuid" }, enum: { type: "string" } }[fam] || { type: "string" };
  if (s.Format) o.format = s.Format;
  if (fam === "enum") { const sym = String(a.Example || "").split("|").map(x => x.trim()).filter(Boolean); if (sym.length > 1) o.enum = sym; } else if (S(a.Example)) o.example = a.Example;
  if (S(a.Description)) o.description = a.Description; return o; }
const dtBson = a => ({ string: "string", int: "int", long: "long", decimal: "decimal", boolean: "bool", timestamp: "date", date: "date", uuid: "string", enum: "string" }[typeFamily(a.DataType)] || (/objectid/i.test(a.DataType) ? "objectId" : "string"));
const DT_PYSPARK = t => { t = String(t).toUpperCase(); const m = t.match(/^DECIMAL\s*\((\d+)\s*,\s*(\d+)\)/); if (m) return `DecimalType(${m[1]}, ${m[2]})`; return { STRING: "StringType()", INT: "IntegerType()", INTEGER: "IntegerType()", BIGINT: "LongType()", LONG: "LongType()", SMALLINT: "ShortType()", TINYINT: "ByteType()", DOUBLE: "DoubleType()", FLOAT: "FloatType()", BOOLEAN: "BooleanType()", TIMESTAMP: "TimestampType()", TIMESTAMP_NTZ: "TimestampNTZType()", DATE: "DateType()", BINARY: "BinaryType()" }[t] || "StringType()"; };
// Map an imported type name back to the registry's neutral data types.
const dtFromOas = (t, f) => t === "integer" ? (f === "int64" ? "long" : "int") : t === "number" ? "decimal" : t === "boolean" ? "boolean" : f === "date-time" ? "timestamp" : f === "date" ? "date" : f === "uuid" ? "uuid" : "string";

/* --------------------------- source: generate -------------------------- */
// GraphQL types for a GQL dataset, from its attribute paths: one type per object node (Root = attribute path prefix).
function dtGqlTypes(fam, sp, fields) {
  const tree = pathTree(fields), out = [], T = sp.Types || {};
  const visit = (node, root, name, kind) => {
    const o = T[root] || {}, entry = { root, kind: o.Kind || kind, name: o.TypeName || name, desc: o.Description || "", fields: [] }; out.push(entry);
    for (const k of node.kids.values()) {
      const child = (root ? root + "." : "") + k.name + (k.arr ? "[]" : ""); let type;
      if (k.kids.size) { const cn = (T[child] || {}).TypeName || pascal(k.name) + (kind === "Input" && !/Input$/.test(pascal(k.name)) ? "Input" : ""); visit(k, child, cn, kind === "Input" ? "Input" : "Type"); type = k.arr ? `[${cn}!]` : cn; }
      else { type = k.attr ? dtGqlType(k.attr) : "String"; if (k.arr) type = `[${type.replace(/!$/, "")}!]`; }
      const key = !!(k.attr && /@key/i.test(k.attr.Description || ""));
      entry.fields.push({ name: k.name, type, desc: k.attr ? S(k.attr.Description).replace(/@key/i, "").trim() : "", key });
    }
    if (!o.Kind && entry.fields.some(x => x.key)) entry.kind = "Key";
  };
  if (fam === "gqlt") visit(tree, "", sp.TypeName || "Type", sp.Kind || "Type");
  else {
    const args = String(sp.Parameters || "").split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => { const i = x.indexOf(":"); return { name: x.slice(0, i).trim(), type: x.slice(i + 1).trim() }; });
    for (const k of tree.kids.values()) {
      if (!k.kids.size) continue;
      const arg = args.find(a => a.name === k.name);
      if (fam === "gqlm") visit(k, k.name, (arg && baseT(arg.type)) || pascal(k.name) + "Input", "Input");
      else visit(k, k.name + (k.arr ? "[]" : ""), baseT(sp.ReturnType) || pascal(k.name), "Type");
    }
  }
  return out;
}
const dtTypeDefBody = t => `${t.kind === "Key" && t.fields.some(f => f.key) ? `@key(fields: "${t.fields.filter(f => f.key).map(f => f.name).join(" ")}") ` : ""}{\n${formatDescribed(t.fields.map(f => ({ desc: f.desc, line: `${f.name}: ${f.type}` })), "  ")}\n}`;
function dtSdl(fam, sp, fields) {
  const kw = k => k === "Input" ? "input" : k === "Interface" ? "interface" : k === "Enum" ? "enum" : "type";
  const types = dtGqlTypes(fam, sp, fields).map(t => `${t.desc ? descLine(t.desc) + "\n" : ""}${kw(t.kind)} ${t.name} ${t.kind === "Enum" ? `{\n${t.fields.map(f => "  " + f.name).join("\n")}\n}` : dtTypeDefBody(t)}`);
  if (fam === "gqlt") return types.join("\n\n");
  const ps = String(sp.Parameters || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
  const op = `type ${sp.OpType === "mutation" ? "Mutation" : sp.OpType === "subscription" ? "Subscription" : "Query"} {\n${sp.AuthScopes ? `  # auth scopes: ${sp.AuthScopes}\n` : ""}  ${sp.Name || "operation"}${ps.length ? "(" + ps.join(", ") + ")" : ""}: ${sp.ReturnType || "Boolean"}\n}`;
  return [op, ...types].join("\n\n");
}
function dtOasSchema(fields) {
  const build = node => { const props = {}, req = [];
    for (const k of node.kids.values()) {
      let s = k.kids.size ? build(k) : dtOas(k.attr || { DataType: "string" });
      if (k.arr) s = { type: "array", items: s };
      props[k.name] = s; if (k.attr && k.attr.Required === "Y") req.push(k.name);
    }
    return Object.assign({ type: "object", properties: props }, req.length ? { required: req } : {}); };
  return build(pathTree(fields));
}
function dtOpenApi(d, sp, fields) {
  const params = fields.filter(f => ["path", "query", "header"].includes((f.Spec || {}).In)), body = fields.filter(f => !["path", "query", "header"].includes((f.Spec || {}).In));
  const op = { operationId: sp.OperationId || undefined, summary: sp.Summary || undefined };
  if (params.length) op.parameters = params.map(f => Object.assign({ name: f.Path, in: f.Spec.In, required: f.Spec.In === "path" || f.Required === "Y" }, f.Description ? { description: f.Description } : {}, { schema: (o => { delete o.description; return o; })(dtOas(f)) }));
  const ct = sp.ContentType || "application/json", schema = body.length ? dtOasSchema(body) : null;
  if (sp.Direction === "Request") { if (schema) op.requestBody = { required: true, content: { [ct]: { schema } } }; op.responses = { "200": { description: "OK" } }; }
  else op.responses = { [sp.StatusCode || "200"]: Object.assign({ description: sp.Summary || "OK" }, schema ? { content: { [ct]: { schema } } } : {}) };
  const doc = { openapi: "3.0.3", info: { title: d.Name || d.DatasetID, version: String(d.Version || "1") }, paths: { [sp.Path || "/"]: { [String(sp.Method || "get").toLowerCase()]: JSON.parse(JSON.stringify(op)) } } };
  return window.jsyaml ? jsyaml.dump(doc, { lineWidth: 140, noRefs: true }) : JSON.stringify(doc, null, 2);
}
function dtDdl(sp, fields) {
  const name = [sp.Schema, sp.Name].filter(Boolean).join(".") || "table_name", pk = fields.filter(f => (f.Spec || {}).PK === "Y").map(f => f.Path);
  const lines = fields.map(f => { const s = f.Spec || {}; return { sql: `  ${f.Path} ${dtSqlType(f)}${f.Required === "Y" || s.PK === "Y" ? " NOT NULL" : ""}${s.Default ? " DEFAULT " + s.Default : ""}${s.Unique === "Y" && s.PK !== "Y" ? " UNIQUE" : ""}`, c: f.Description }; });
  if (pk.length) lines.push({ sql: `  PRIMARY KEY (${pk.join(", ")})` });
  fields.forEach(f => { const fk = S((f.Spec || {}).FK); if (!fk) return; const m = fk.match(/^([\w.]+?)[.(](\w+)\)?$/); lines.push({ sql: `  CONSTRAINT fk_${String(sp.Name || "t").replace(/\W/g, "_")}_${f.Path} FOREIGN KEY (${f.Path}) REFERENCES ${m ? `${m[1]} (${m[2]})` : fk}` }); });
  return `-- ${sp.Engine || "SQL"} · ${[sp.Database, sp.Schema, sp.Name].filter(Boolean).join(".")}\nCREATE TABLE ${name} (\n${lines.map((l, i) => l.sql + (i < lines.length - 1 ? "," : "") + (l.c ? " -- " + String(l.c).replace(/\n/g, " ") : "")).join("\n")}\n);${sp.Indexes ? "\n" + String(sp.Indexes).trim() : ""}\n`;
}
function dtMongo(sp, fields) {
  const build = node => { const props = {}, req = [];
    for (const k of node.kids.values()) { let s = k.kids.size ? build(k) : Object.assign({ bsonType: dtBson(k.attr || {}) }, k.attr && k.attr.Description ? { description: k.attr.Description } : {}); if (k.arr) s = { bsonType: "array", items: s }; props[k.name] = s; if (k.attr && k.attr.Required === "Y") req.push(k.name); }
    return Object.assign({ bsonType: "object" }, req.length ? { required: req } : {}, { properties: props }); };
  const idx = String(sp.Indexes || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
  return JSON.stringify(Object.assign({ database: sp.Database || undefined, collection: sp.Name, validator: { $jsonSchema: build(pathTree(fields)) } }, idx.length ? { indexes: idx } : {}), null, 2);
}
function dtAvro(d, sp, fields) {
  const rec = (node, name) => ({ type: "record", name, fields: [...node.kids.values()].map(k => {
    let t = k.kids.size ? rec(k, pascal(k.name)) : dtAvroType(k.attr || {}); if (k.arr) t = { type: "array", items: t };
    const opt = !(k.attr && k.attr.Required === "Y") && !k.kids.size, def = k.attr && (k.attr.Spec || {}).Default;
    return Object.assign({ name: k.name, type: opt ? ["null", t] : t }, opt ? { default: null } : def ? { default: def } : {}, k.attr && k.attr.Description ? { doc: k.attr.Description } : {});
  }) });
  return JSON.stringify(Object.assign(rec(pathTree(fields), sp.Record || "Record"), { namespace: sp.Namespace || undefined, doc: d.Description || undefined }), null, 2);
}
function dtSparkOf(node) { return `STRUCT<${[...node.kids.values()].map(k => `${k.name}: ${k.kids.size ? (k.arr ? `ARRAY<${dtSparkOf(k)}>` : dtSparkOf(k)) : (k.arr ? `ARRAY<${dtSparkType(k.attr || {})}>` : dtSparkType(k.attr || {}))}`).join(", ")}>`; }
function dtSparkDdl(d, sp, fields) {
  const tree = pathTree(fields), parts = fields.filter(f => (f.Spec || {}).Partition === "Y").map(f => f.Path);
  const cols = [...tree.kids.values()].map(k => { const t = k.kids.size ? (k.arr ? `ARRAY<${dtSparkOf(k)}>` : dtSparkOf(k)) : (k.arr ? `ARRAY<${dtSparkType(k.attr || {})}>` : dtSparkType(k.attr || {}));
    return `  ${k.name} ${t}${k.attr && k.attr.Required === "Y" ? " NOT NULL" : ""}${k.attr && k.attr.Description ? ` COMMENT '${String(k.attr.Description).replace(/'/g, "''")}'` : ""}`; });
  return `CREATE TABLE IF NOT EXISTS ${[sp.Catalog, sp.Schema, sp.Table].filter(Boolean).join(".") || "catalog.schema.table"} (\n${cols.join(",\n")}\n) USING ${sp.TableFormat || "DELTA"}${parts.length ? `\nPARTITIONED BY (${parts.join(", ")})` : ""}${d.Description ? `\nCOMMENT '${String(d.Description).replace(/'/g, "''")}'` : ""};\n`;
}
function dtStructType(fields, name) {
  const st = (node, ind) => `StructType([\n${[...node.kids.values()].map(k => { let t = k.kids.size ? st(k, ind + "    ") : DT_PYSPARK(dtSparkType(k.attr || {})); if (k.arr) t = `ArrayType(${t})`; return `${ind}    StructField("${k.name}", ${t}, ${k.attr && k.attr.Required === "Y" ? "False" : "True"})`; }).join(",\n")}\n${ind}])`;
  return `# Databricks / PySpark schema${name ? " for " + name : ""}\nfrom pyspark.sql.types import *\n\nschema = ${st(pathTree(fields), "")}\n`;
}
function dtYaml(d, f, sp, fields) {
  const head = f === "file" ? { file: nonEmpty({ type: sp.FileType, namePattern: sp.FileNamePattern, delimiter: sp.Delimiter, header: sp.Header ? sp.Header === "Y" : undefined, encoding: sp.Encoding }) } : { dataset: nonEmpty({ name: d.Name, kind: KN(d.Kind), location: d.Location }) };
  const list = fields.map(x => nonEmpty({ [f === "file" ? "name" : "path"]: x.Path, type: x.DataType, required: x.Required === "Y" ? true : undefined, pattern: (x.Spec || {}).Pattern, example: x.Example, description: x.Description }));
  const doc = Object.assign(head, { [f === "file" ? "columns" : "fields"]: list });
  return window.jsyaml ? jsyaml.dump(doc, { lineWidth: 140 }) : JSON.stringify(doc, null, 2);
}
function dtSource(d, f, sp, fields) {
  if (f === "gqlq" || f === "gqlm" || f === "gqlt") return dtSdl(f, sp, fields);
  if (f === "rest") return dtOpenApi(d, sp, fields);
  if (f === "db") return sp.ObjectType === "Collection" ? dtMongo(sp, fields) : dtDdl(sp, fields);
  if (f === "kafka") return dtAvro(d, sp, fields);
  if (f === "dbx") return dtSparkDdl(d, sp, fields);
  return dtYaml(d, f, sp, fields);
}

/* ---------------------------- source: parse ---------------------------- */
// Each parser returns { spec, fields: [{ Path, DataType, Required, Description, Example?, Spec }] }.
const dtF = (Path, DataType, Required, Description, Spec, Example) => ({ Path, DataType: DataType || "string", Required: Required ? "Y" : "N", Description: Description || "", Spec: nonEmpty(Spec), Example: Example || "" });
function dtParseSdl(text, f, sp) {
  const types = {}, spec = { Types: {} }; let op = null;
  for (const m of String(text).matchAll(/(?:"""([\s\S]*?)"""\s*)?\b(type|input|interface|enum)\s+(\w+)([^{]*)\{([\s\S]*?)\}/g)) {
    const [, desc, kw, name, head, body] = m, ents = describedLines(body).filter(e => !e.line.startsWith("#"));
    if (name === "Query" || name === "Mutation" || name === "Subscription") { const e = ents[0]; if (e) { const fm = e.line.match(/^(\w+)\s*(?:\(([\s\S]*)\))?\s*:\s*(.+)$/); if (fm) op = { OpType: name.toLowerCase(), Name: fm[1], Parameters: (fm[2] || "").split(/,\s*/).filter(Boolean).join("\n"), ReturnType: fm[3].trim() }; } const sc = body.match(/#\s*auth scopes:\s*(.+)/); if (sc) spec.AuthScopes = sc[1].trim(); continue; }
    const key = (head.match(/@key\s*\(\s*fields:\s*"([^"]*)"/) || [, ""])[1].split(/\s+/).filter(Boolean);
    types[name] = { kind: kw === "input" ? "Input" : kw === "interface" ? "Interface" : kw === "enum" ? "Enum" : key.length ? "Key" : "Type", desc: (desc || "").replace(/\s+/g, " ").trim(), key,
      fields: ents.map(e => { const fm = e.line.match(/^(\w+)\s*(?:\([^)]*\))?\s*:\s*([^@#]+)/); return fm ? { name: fm[1], type: fm[2].trim(), desc: e.desc } : null; }).filter(Boolean) };
  }
  if (op) Object.assign(spec, op);
  const fields = [];
  const walk = (tn, prefix, seen) => { const t = types[tn]; if (!t) return; spec.Types[prefix] = nonEmpty({ TypeName: tn, Kind: t.kind, Description: t.desc });
    for (const fl of t.fields) { const list = /^\s*\[/.test(fl.type), b = baseT(fl.type), path = (prefix ? prefix + "." : "") + fl.name;
      if (types[b] && types[b].kind !== "Enum" && !seen.has(b)) walk(b, path + (list ? "[]" : ""), new Set([...seen, b]));
      else fields.push(dtF(path + (list && !types[b] ? "" : ""), fl.type, /!$/.test(fl.type), (fl.desc || "") + (t.key.includes(fl.name) ? " @key" : ""))); } };
  if (f === "gqlt") { const tn = Object.keys(types)[0]; if (tn) { walk(tn, "", new Set([tn])); spec.TypeName = tn; spec.Kind = types[tn].kind; } }
  else if (op) {
    const args = String(op.Parameters).split(/\n+/).filter(Boolean).map(x => { const i = x.indexOf(":"); return { name: x.slice(0, i).trim(), type: x.slice(i + 1).trim() }; });
    if (f === "gqlm") args.forEach(a => { const b = baseT(a.type); if (types[b]) walk(b, a.name, new Set([b])); else fields.push(dtF(a.name, a.type, /!$/.test(a.type), "")); });
    const rb = baseT(op.ReturnType); if (types[rb] && f === "gqlq") walk(rb, op.Name + (/^\s*\[/.test(op.ReturnType) ? "[]" : ""), new Set([rb]));
  }
  if (!Object.keys(types).length && !op) throw new Error("no type / input / Query / Mutation block found");
  return { spec, fields };
}
function dtFlattenJsonSchema(s, prefix, req, out, doc, bson) {
  const deref = x => { let g = 0; while (x && x.$ref && g++ < 10) x = String(x.$ref).split("/").slice(1).reduce((o, k) => o && o[k], doc) || {}; x = x || {};
    if (Array.isArray(x.allOf)) { const parts = x.allOf.map(deref); x = Object.assign({ type: "object" }, x, { properties: Object.assign({}, ...parts.map(p => p.properties || {}), x.properties || {}), required: [].concat(...parts.map(p => p.required || []), x.required || []) }); delete x.allOf; }
    return x; };
  s = deref(s);
  for (const [k, v0] of Object.entries(s.properties || {})) {
    const v = deref(v0), path = (prefix ? prefix + "." : "") + k, type = bson ? v.bsonType : v.type, required = (s.required || []).includes(k);
    if (type === "object" || v.properties) dtFlattenJsonSchema(v, path, null, out, doc, bson);
    else if (type === "array") { const it = deref(v.items || {}); if ((bson ? it.bsonType : it.type) === "object" || it.properties) dtFlattenJsonSchema(it, path + "[]", null, out, doc, bson); else out.push(dtF(path + "[]", bson ? dtFromBson(it.bsonType) : dtFromOas(it.type, it.format), required, v.description || it.description, { In: bson ? undefined : "body", Format: it.format })); }
    else out.push(dtF(path, bson ? dtFromBson(type) : v.enum ? "enum" : dtFromOas(type, v.format), required, v.description, bson ? {} : { In: "body", Format: v.format && !["date-time", "date", "uuid", "int64", "int32"].includes(v.format) ? v.format : "" }, v.enum ? v.enum.join("|") : v.example != null ? String(v.example) : ""));
  }
  return out;
}
const dtFromBson = t => ({ string: "string", int: "int", long: "long", double: "decimal", decimal: "decimal", bool: "boolean", date: "timestamp", objectId: "ObjectId" }[t] || "string");
function dtParseOpenApi(text, sp) {
  const doc = window.jsyaml ? jsyaml.load(text) : JSON.parse(text); if (!doc || !doc.paths) throw new Error("expected an OpenAPI document with paths:");
  const path = Object.keys(doc.paths)[0], item = doc.paths[path], method = Object.keys(item).find(m => /^(get|post|put|patch|delete|head|options)$/i.test(m)); if (!method) throw new Error("no operation under " + path);
  const op = item[method], spec = { Method: method.toUpperCase(), Path: path, OperationId: op.operationId || "", Summary: op.summary || op.description || "" }, fields = [];
  [...(item.parameters || []), ...(op.parameters || [])].forEach(p => { if (p && p.name) fields.push(dtF(p.name, dtFromOas((p.schema || {}).type, (p.schema || {}).format), p.required, p.description, { In: p.in })); });
  let schema = null, ct = "application/json";
  if (sp.Direction === "Request") { const c = (op.requestBody || {}).content || {}; ct = Object.keys(c)[0] || ct; schema = (c[ct] || {}).schema; }
  else { const code = Object.keys(op.responses || {}).find(c => /^2/.test(c)) || Object.keys(op.responses || {})[0]; const r = (op.responses || {})[code] || {}, c = r.content || {}; spec.StatusCode = code || "200"; ct = Object.keys(c)[0] || ct; schema = (c[ct] || {}).schema; }
  spec.ContentType = ct;
  if (schema) { let s = schema; if (s.$ref) s = String(s.$ref).split("/").slice(1).reduce((o, k) => o && o[k], doc) || {}; if (s.type === "array" && s.items) { dtFlattenJsonSchema(s.items, "[]", null, fields, doc); fields.forEach(x => { if (x.Path.startsWith("[].")) x.Path = x.Path.slice(3); }); } else dtFlattenJsonSchema(s, "", null, fields, doc); }
  return { spec, fields };
}
function dtParseDdl(text, sp) {
  const head = String(text).match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(/i); if (!head) throw new Error("expected CREATE TABLE name ( … )");
  const nm = head[1].replace(/"/g, "").split("."), spec = { Name: nm.pop(), Schema: nm.pop() || "", Database: nm.pop() || sp.Database || "" }, fields = [], pk = [], fks = {};
  const start = head.index + head[0].length; let depth = 1, i = start; for (; i < text.length && depth; i++) { if (text[i] === "(") depth++; else if (text[i] === ")") depth--; }
  const body = text.slice(start, i - 1), tail = text.slice(i);
  for (let line of body.split(/\n/)) {
    let c = ""; const ci = line.indexOf("--"); if (ci >= 0) { c = line.slice(ci + 2).trim(); line = line.slice(0, ci); }
    line = line.trim().replace(/,$/, "").trim(); if (!line) continue;
    let m;
    if ((m = line.match(/^(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i))) { pk.push(...m[1].split(",").map(x => x.trim().replace(/"/g, ""))); continue; }
    if ((m = line.match(/^(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+([\w.]+)\s*\((\w+)\)/i))) { fks[m[1]] = `${m[2]}.${m[3]}`; continue; }
    if (/^(?:CONSTRAINT\s+\w+\s+)?(UNIQUE|CHECK|INDEX|KEY)\b/i.test(line)) continue;
    m = line.match(/^"?([\w.]+)"?\s+([A-Za-z_]+(?:\s*\([^)]*\))?(?:\s+(?:WITH|WITHOUT)\s+TIME\s+ZONE)?(?:\s+VARYING(?:\s*\(\d+\))?)?(?:\[\])?)(.*)$/i); if (!m) continue;
    const rest = m[3], ref = rest.match(/REFERENCES\s+([\w.]+)\s*\((\w+)\)/i), def = rest.match(/DEFAULT\s+('(?:[^']|'')*'|[^\s,]+(?:\([^)]*\))?)/i);
    fields.push(dtF(m[1], m[2].toUpperCase(), /NOT\s+NULL|PRIMARY\s+KEY/i.test(rest), c, { PK: /PRIMARY\s+KEY/i.test(rest) ? "Y" : "", FK: ref ? `${ref[1]}.${ref[2]}` : "", Default: def ? def[1] : "", Unique: /\bUNIQUE\b/i.test(rest) ? "Y" : "" }));
  }
  fields.forEach(x => { if (pk.includes(x.Path)) { x.Spec.PK = "Y"; x.Required = "Y"; } if (fks[x.Path]) x.Spec.FK = fks[x.Path]; });
  spec.Indexes = (tail.match(/CREATE\s+(?:UNIQUE\s+)?INDEX[^;]*;/gi) || []).join("\n");
  return { spec, fields };
}
function dtParseMongo(text) {
  const doc = JSON.parse(text), js = (doc.validator && doc.validator.$jsonSchema) || doc.$jsonSchema || doc;
  return { spec: nonEmpty({ Database: doc.database, Name: doc.collection, Indexes: Array.isArray(doc.indexes) ? doc.indexes.join("\n") : "" }), fields: dtFlattenJsonSchema(js, "", null, [], doc, true) };
}
function dtParseAvro(text) {
  const doc = JSON.parse(text), fields = []; if (doc.type !== "record") throw new Error('expected a { "type": "record" } schema');
  const prim = { string: "string", int: "int", long: "long", float: "decimal", double: "decimal", boolean: "boolean", bytes: "string" };
  const logical = { "timestamp-millis": "timestamp", "timestamp-micros": "timestamp", date: "date", uuid: "uuid", decimal: "decimal" };
  const walk = (rec, prefix) => (rec.fields || []).forEach(fd => {
    let t = fd.type, opt = false; if (Array.isArray(t)) { opt = t.includes("null"); t = t.find(x => x !== "null"); }
    const path = (prefix ? prefix + "." : "") + fd.name;
    if (t && t.type === "record") return walk(t, path);
    if (t && t.type === "array") { const it = t.items; if (it && it.type === "record") return walk(it, path + "[]"); t = it; return fields.push(dtF(path + "[]", typeof t === "string" ? prim[t] || t : logical[t.logicalType] || prim[t.type] || "string", !opt, fd.doc, {})); }
    if (t && t.type === "enum") return fields.push(dtF(path, "enum", !opt, fd.doc, { AvroType: "enum" }, (t.symbols || []).join("|")));
    const dt = typeof t === "string" ? prim[t] || t : logical[t.logicalType] || prim[t.type] || "string";
    fields.push(dtF(path, dt, !opt, fd.doc, { AvroType: typeof t === "string" ? t : t.type, LogicalType: typeof t === "string" ? "" : t.logicalType || "", Default: fd.default != null ? String(fd.default) : "" }));
  });
  walk(doc, "");
  return { spec: nonEmpty({ Record: doc.name, Namespace: doc.namespace }), fields };
}
// Split on a separator at depth 0 of (), <> and quotes.
function dtSplitTop(s, sep) { const out = []; let d = 0, q = false, cur = ""; for (const ch of s) { if (ch === "'") q = !q; if (!q) { if ("(<".includes(ch)) d++; else if (")>".includes(ch)) d--; else if (ch === sep && !d) { out.push(cur); cur = ""; continue; } } cur += ch; } if (cur.trim()) out.push(cur); return out.map(x => x.trim()).filter(Boolean); }
function dtParseSparkDdl(text) {
  const head = String(text).match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.`]+)\s*\(/i); if (!head) throw new Error("expected CREATE TABLE catalog.schema.table ( … )");
  const nm = head[1].replace(/`/g, "").split("."), spec = { Table: nm.pop(), Schema: nm.pop() || "", Catalog: nm.pop() || "" }, fields = [];
  const start = head.index + head[0].length; let depth = 1, i = start; for (; i < text.length && depth; i++) { if (text[i] === "(") depth++; else if (text[i] === ")") depth--; }
  const body = text.slice(start, i - 1), tail = text.slice(i), parts = ((tail.match(/PARTITIONED\s+BY\s*\(([^)]*)\)/i) || [, ""])[1]).split(",").map(x => x.trim()).filter(Boolean);
  const using = tail.match(/USING\s+(\w+)/i); if (using) spec.TableFormat = using[1].toUpperCase();
  const flat = (name, type, path, req, desc) => { const t = type.trim(), st = t.match(/^STRUCT\s*<([\s\S]*)>$/i), ar = t.match(/^ARRAY\s*<([\s\S]*)>$/i);
    if (st) return dtSplitTop(st[1], ",").forEach(x => { const m = x.match(/^`?(\w+)`?\s*:?\s+([\s\S]+?)(?:\s+COMMENT\s+'((?:[^']|'')*)')?$/i); if (m) flat(m[1], m[2], path + "." + m[1], false, m[3]); });
    if (ar) { const inner = ar[1].trim(); if (/^STRUCT/i.test(inner)) return flat(name, inner, path + "[]", req, desc); return fields.push(dtF(path + "[]", inner.toUpperCase(), req, desc, {})); }
    fields.push(dtF(path, t.toUpperCase(), req, desc, { Partition: parts.includes(path) ? "Y" : "" })); };
  dtSplitTop(body, ",").forEach(col => { const m = col.match(/^`?(\w+)`?\s+([\s\S]+?)(\s+NOT\s+NULL)?(?:\s+COMMENT\s+'((?:[^']|'')*)')?$/i); if (m) flat(m[1], m[2], m[1], !!m[3], (m[4] || "").replace(/''/g, "'")); });
  return { spec, fields };
}
function dtParseYaml(text, f) {
  const doc = window.jsyaml ? jsyaml.load(text) : JSON.parse(text) || {}, fl = doc.file || {}, list = doc.columns || doc.fields || [];
  const spec = f === "file" ? nonEmpty({ FileType: fl.type, FileNamePattern: fl.namePattern, Delimiter: fl.delimiter, Header: fl.header == null ? "" : fl.header ? "Y" : "N", Encoding: fl.encoding }) : {};
  return { spec, fields: list.map(x => dtF(String(x.name || x.path || ""), x.type ? String(x.type) : "string", !!x.required, x.description, { Pattern: x.pattern }, x.example != null ? String(x.example) : "")).filter(x => x.Path) };
}
function dtParse(text, f, sp) {
  if (f === "gqlq" || f === "gqlm" || f === "gqlt") return dtParseSdl(text, f, sp);
  if (f === "rest") return dtParseOpenApi(text, sp);
  if (f === "db") return sp.ObjectType === "Collection" ? dtParseMongo(text) : dtParseDdl(text, sp);
  if (f === "kafka") return dtParseAvro(text);
  if (f === "dbx") return dtParseSparkDdl(text);
  return dtParseYaml(text, f);
}

/* ------------------------------- dialog -------------------------------- */
const DT_COLS = {
  gql: [["Path", "Field path"], ["DataType", "GraphQL type"], ["Description", "Description"]],
  rest: [["Path", "Field"], ["s:In", "In", ["body", "path", "query", "header"]], ["DataType", "Type"], ["s:Format", "Format"], ["Required", "Req.", YN], ["Description", "Description"]],
  db: [["Path", "Column"], ["DataType", "Type"], ["s:PK", "PK", YN], ["s:FK", "FK → table.column"], ["Required", "Not null", YN], ["s:Default", "Default"], ["s:Unique", "Unique", YN], ["Description", "Description"]],
  kafka: [["Path", "Field"], ["DataType", "Type"], ["s:AvroType", "Avro type", ["", "string", "int", "long", "float", "double", "boolean", "bytes", "enum"]], ["s:LogicalType", "Logical type", ["", "timestamp-millis", "timestamp-micros", "date", "uuid", "decimal"]], ["Required", "Required", YN], ["s:Default", "Default"], ["Description", "Doc"]],
  dbx: [["Path", "Column"], ["DataType", "Spark type"], ["Required", "Not null", YN], ["s:Partition", "Partition", YN], ["Description", "Comment"]],
  file: [["Path", "Column"], ["DataType", "Type"], ["Required", "Required", YN], ["s:Pattern", "Pattern / format"], ["Description", "Description"]],
  yaml: [["Path", "Path"], ["DataType", "Type"], ["Required", "Required", YN], ["Description", "Description"]],
};
const dtColsOf = f => DT_COLS[/^gql/.test(f) ? "gql" : f] || DT_COLS.yaml;
const DT_STYLE = ["Style", "API style", ["REST", "GraphQL"]];
const DT_SPEC_FORM = {
  gqlq: [DT_STYLE, ["OpType", "Operation", ["query", "mutation", "subscription"]], ["Name", "Operation name"], ["ReturnType", "Return type"], ["AuthScopes", "Auth scopes"], ["Parameters", "Parameters (one  name: Type  per line)", "area"]],
  gqlm: [DT_STYLE, ["OpType", "Operation", ["query", "mutation", "subscription"]], ["Name", "Operation name"], ["ReturnType", "Return type"], ["AuthScopes", "Auth scopes"], ["Parameters", "Parameters (one  name: Type  per line)", "area"]],
  gqlt: [["TypeName", "Type name"], ["Kind", "Kind", ["Type", "Key", "Input", "Interface", "Enum"]]],
  rest: [DT_STYLE, ["Method", "Method", ["GET", "POST", "PUT", "PATCH", "DELETE"]], ["Path", "Path"], ["OperationId", "operationId"], ["StatusCode", "Status code"], ["ContentType", "Content type"], ["Summary", "Summary", "area"]],
  db: [["ObjectType", "Object", ["Table", "Collection"]], ["Engine", "Engine", ["PostgreSQL", "MySQL", "Oracle", "SQL Server", "MongoDB", "Cosmos DB", "DynamoDB"]], ["Database", "Database"], ["Schema", "Schema"], ["Name", "Table / collection"], ["Indexes", "Indexes (one per line)", "area"]],
  kafka: [["Topic", "Topic"], ["Namespace", "Namespace"], ["Record", "Record name"], ["KeyField", "Key field"], ["Compatibility", "Compatibility", COMPAT]],
  dbx: [["Catalog", "Catalog"], ["Schema", "Schema"], ["Table", "Table"], ["TableFormat", "Format", ["DELTA", "PARQUET", "ICEBERG", "CSV", "JSON"]]],
  file: [["FileType", "File type", ["CSV", "JSON", "JSONL", "PARQUET", "XML"]], ["FileNamePattern", "File name pattern"], ["Delimiter", "Delimiter"], ["Header", "Header row", ["Y", "N"]], ["Encoding", "Encoding"]],
  yaml: [],
};
let DTD = null;   // the dialog's draft
function dtOpen(id, opts) {
  const d = dsById(id); if (!d) return;
  const sp = dtSpec(d);
  DTD = { id, opts: opts || {}, tab: "fields", core: { Name: d.Name, Kind: d.Kind, Version: d.Version, Status: d.Status || "Draft", Description: d.Description, Location: d.Location },
    spec: JSON.parse(JSON.stringify(sp)), fields: attrsOf(id).map(a => ({ orig: a.Path, Path: a.Path, DataType: a.DataType, Required: a.Required, Description: a.Description, Example: a.Example, Spec: dtAttrSpec(d, a, sp) })), err: "" };
  dtRender();
}
const dtFam0 = () => dtFamD({ Kind: DTD.core.Kind, Location: DTD.core.Location, Spec: { Style: DTD.spec.Style } });
const dtDs = () => Object.assign({}, dsById(DTD.id), DTD.core);
const dtFieldsView = () => DTD.fields.filter(x => S(x.Path)).map(x => Object.assign({}, x, { Required: /^gql/.test(dtFam0()) ? (/!$/.test(x.DataType) ? "Y" : "N") : x.Required }));
function dtRender() {
  const f = dtFam0(), d = dtDs(), sp = DTD.spec, info = DT[f], cols = dtColsOf(f);
  const inp = (k, v, attrs) => `<input ${attrs} value="${ea(v == null ? "" : v)}" />`;
  const sel = (opts, v, attrs) => `<select ${attrs}>${(v && !opts.includes(v) ? [v] : []).concat(opts).map(o => `<option${o === v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  const specForm = (DT_SPEC_FORM[f] || []).filter(([k]) => !(f === "rest" && k === "StatusCode" && sp.Direction === "Request")).map(([k, l, o]) => `<label class="${o === "area" ? "wide" : ""}">${esc(l)}${o === "area" ? `<textarea data-sp="${k}" rows="${k === "Parameters" ? 3 : 2}">${esc(sp[k] || "")}</textarea>` : Array.isArray(o) ? sel(o, sp[k] || "", `data-sp="${k}"`) : inp(k, sp[k], `data-sp="${k}"`)}</label>`).join("");
  const cell = (x, i, [k, , o]) => { const v = k.startsWith("s:") ? (x.Spec || {})[k.slice(2)] : x[k], at = `data-fi="${i}" data-fk="${k}"`;
    if (o) return `<td>${sel(o, v || "", at)}</td>`; if (k === "DataType" && f === "kafka") return `<td><input ${at} value="${ea(v || "")}" placeholder="string" /><div class="hint">${esc(dtAvroLabel(x))}</div></td>`;
    return `<td>${k === "Description" ? `<textarea ${at} rows="1">${esc(v || "")}</textarea>` : `<input ${at} value="${ea(v || "")}"${k === "DataType" ? ` list="dtdl-${f}"` : ""} />`}</td>`; };
  const typeList = { gql: ["ID!", "String", "String!", "Int", "Int!", "Float", "Boolean", "DateTime", "Money", "[String!]!"], rest: ["string", "int", "long", "decimal", "boolean", "timestamp", "date", "uuid", "enum"], db: f === "db" && sp.ObjectType === "Collection" ? ["string", "int", "long", "decimal", "boolean", "timestamp", "ObjectId"] : ["VARCHAR(255)", "TEXT", "INTEGER", "BIGINT", "NUMERIC(18,2)", "BOOLEAN", "TIMESTAMPTZ", "DATE", "UUID", "JSONB"], kafka: ["string", "int", "long", "decimal", "boolean", "timestamp", "date", "uuid", "enum"], dbx: ["STRING", "INT", "BIGINT", "DOUBLE", "DECIMAL(18,2)", "BOOLEAN", "TIMESTAMP", "DATE", "BINARY"], file: ["string", "int", "decimal", "boolean", "date", "timestamp"], yaml: DTYPES }[/^gql/.test(f) ? "gql" : f] || DTYPES;
  const extra = f === "kafka" || f === "dbx" || (f === "db" && sp.ObjectType !== "Collection") ? "struct" : "";
  const srcLabel = f === "db" && sp.ObjectType === "Collection" ? "MongoDB $jsonSchema" : info.src;
  let body;
  if (DTD.tab === "fields") body = `<div class="dt-fields"><table class="dg-tbl"><thead><tr><th>#</th>${cols.map(c => `<th>${esc(c[1])}</th>`).join("")}<th></th></tr></thead><tbody>${DTD.fields.map((x, i) => `<tr><td class="ro">${i + 1}</td>${cols.map(c => cell(x, i, c)).join("")}<td class="act"><button class="icon-btn" data-dt="up" data-v="${i}" title="Move up"${i ? "" : " disabled"}>↑</button><button class="rm-row" data-dt="rm" data-v="${i}" title="Remove">✕</button></td></tr>`).join("") || `<tr><td colspan="${cols.length + 2}" class="empty">No ${f === "db" || f === "dbx" || f === "file" ? "columns" : "fields"} yet: add them, or paste a ${esc(srcLabel)} in the Source tab.</td></tr>`}</tbody></table></div>
      <div class="dg-row"><button data-dt="add">＋ ${f === "db" || f === "dbx" || f === "file" ? "Column" : "Field"}</button>${/^gql/.test(f) ? '<span class="hint">Field paths start with the root (e.g. <span class="mono">product.title</span>, <span class="mono">input.sku</span>); a trailing <span class="mono">!</span> makes it required; "@key" in the description marks the key.</span>' : '<span class="hint">Dotted paths nest (<span class="mono">brand.name</span>); <span class="mono">[]</span> marks an array (<span class="mono">images[].url</span>).</span>'}</div>
      <datalist id="dtdl-${f}">${typeList.map(t => `<option value="${ea(t)}">`).join("")}</datalist>`;
  else if (DTD.tab === "source") body = `<p class="hint">Edit or paste a ${esc(srcLabel)} and click <b>Apply to fields</b>; the fields and the type details are replaced from it (business terms and classifications are kept by path).</p>
      <textarea id="dtSrc" class="dt-src" spellcheck="false">${esc(DTD.src != null ? DTD.src : dtSource(d, f, sp, dtFieldsView()))}</textarea>
      <div class="dg-row"><button class="primary" data-dt="apply">Apply to fields</button><button data-dt="regen">Regenerate from fields</button><button data-dt="copy">Copy</button><button data-dt="dl">Download</button></div>`;
  else body = `<p class="hint">The same fields as a Databricks / PySpark schema, e.g. for <span class="mono">from_avro</span> / Auto Loader or a Delta table.</p><pre class="code dt-src">${esc(dtStructType(dtFieldsView(), f === "dbx" ? [sp.Catalog, sp.Schema, sp.Table].filter(Boolean).join(".") : d.Name))}</pre>${f !== "dbx" ? `<pre class="code dt-src">${esc(dtSparkDdl(d, { Catalog: "main", Schema: "bronze", Table: String(sp.Name || sp.Record || d.DatasetID).toLowerCase().replace(/[^a-z0-9]+/g, "_"), TableFormat: "DELTA" }, dtFieldsView()))}</pre>` : ""}<div class="dg-row"><button data-dt="copy-struct">Copy StructType</button></div>`;
  openModal(`<h2>${esc(info.t)} details <span class="hint mono">${esc(DTD.id)}</span></h2>
    <div class="frm dt-core">${[["Name", "Name"], ["Version", "Version"]].map(([k, l]) => `<label>${l}${inp(k, DTD.core[k], `data-core="${k}"`)}</label>`).join("")}
      <label>Type${sel(DS_KINDS, DTD.core.Kind, 'data-core="Kind"')}</label><label>Status${sel(STATUS, DTD.core.Status, 'data-core="Status"')}</label>
      <label class="wide">Description<textarea data-core="Description" rows="1">${esc(DTD.core.Description || "")}</textarea></label></div>
    ${specForm ? `<div class="kv">${esc(info.t)}</div><div class="frm dt-spec">${specForm}</div>` : ""}
    <div class="dt-tabs"><button data-dt-tab="fields" class="${DTD.tab === "fields" ? "active" : ""}">${f === "db" || f === "dbx" || f === "file" ? "Columns" : "Fields"} (${DTD.fields.length})</button><button data-dt-tab="source" class="${DTD.tab === "source" ? "active" : ""}">Source · ${esc(srcLabel)}</button>${extra ? `<button data-dt-tab="struct" class="${DTD.tab === "struct" ? "active" : ""}">Databricks StructType</button>` : ""}<span class="hint" style="margin-left:auto">Saved in the <b>${esc(info.sheet || "Attributes")}</b> sheet</span></div>
    <div class="dt-body">${body}</div>
    <div class="dt-err" id="dtErr">${esc(DTD.err || "")}</div>
    <div class="modal-actions"><span class="hint">${DTD.opts.isNew ? "New dataset: Cancel removes it." : ""}</span><span style="flex:1"></span><button data-dt="cancel">Cancel</button><button class="primary" data-dt="save">Save</button></div>`);
  document.getElementById("modalCard").classList.add("dt-wide");
}
function dtWire() {
  const card = document.getElementById("modalCard");
  card.addEventListener("input", e => { if (!DTD || !card.classList.contains("dt-wide")) return; const el = e.target;
    if (el.dataset.sp) DTD.spec[el.dataset.sp] = el.value;
    else if (el.dataset.core && el.dataset.core !== "Kind") DTD.core[el.dataset.core] = el.value;
    else if (el.dataset.fi != null) { const x = DTD.fields[+el.dataset.fi], k = el.dataset.fk; if (k.startsWith("s:")) (x.Spec = x.Spec || {})[k.slice(2)] = el.value; else x[k] = el.value; }
    else if (el.id === "dtSrc") DTD.src = el.value; });
  card.addEventListener("change", e => { if (!DTD || !card.classList.contains("dt-wide")) return; const el = e.target;
    if (el.dataset.core === "Kind") { const before = dtFam0(), style = DTD.spec.Style; DTD.core.Kind = el.value; if (style) DTD.spec.Style = style; if (dtFam0() !== before) dtRederive(); else if (/^HTTP/.test(KN(el.value))) DTD.spec.Direction = /Request/.test(KN(el.value)) ? "Request" : "Response"; DTD.src = null; dtRender(); }
    else if (el.dataset.sp === "Style") { DTD.spec.Style = el.value; dtRederive(); DTD.src = null; dtRender(); }
    else if (el.dataset.sp && el.tagName === "SELECT") { DTD.spec[el.dataset.sp] = el.value; if (el.dataset.sp === "ObjectType") DTD.core.Kind = el.value === "Collection" ? "02-DB Collection" : "01-DB Table"; DTD.src = null; dtRender(); }
    else if (el.dataset.fi != null && el.tagName === "SELECT") { DTD.src = null; } });
  card.addEventListener("click", e => { if (!DTD || !card.classList.contains("dt-wide")) return;
    const tab = e.target.closest("[data-dt-tab]"); if (tab) { DTD.tab = tab.dataset.dtTab; if (DTD.tab !== "source") DTD.src = null; DTD.err = ""; return dtRender(); }
    const b = e.target.closest("[data-dt]"); if (!b || b.disabled) return; const a = b.dataset.dt, i = +b.dataset.v;
    if (a === "add") { DTD.fields.push({ orig: null, Path: "", DataType: "", Required: "N", Description: "", Example: "", Spec: {} }); dtRender(); const ins = card.querySelectorAll('[data-fk="Path"]'); if (ins.length) ins[ins.length - 1].focus(); }
    else if (a === "rm") { DTD.fields.splice(i, 1); dtRender(); }
    else if (a === "up") { DTD.fields.splice(i - 1, 0, DTD.fields.splice(i, 1)[0]); dtRender(); }
    else if (a === "regen") { DTD.src = null; DTD.err = ""; dtRender(); }
    else if (a === "apply") dtApplySource();
    else if (a === "copy") copyText(document.getElementById("dtSrc").value);
    else if (a === "copy-struct") copyText(dtStructType(dtFieldsView(), dtDs().Name));
    else if (a === "dl") { const f = dtFam0(), ext = { gqlq: "graphql", gqlm: "graphql", gqlt: "graphql", rest: "openapi.yaml", db: DTD.spec.ObjectType === "Collection" ? "schema.json" : "sql", kafka: "avsc", dbx: "sql" }[f] || "yaml"; download(document.getElementById("dtSrc").value, `${DTD.id}.${ext}`); }
    else if (a === "cancel") dtClose(false);
    else if (a === "save") dtSave(); });
}
// The family changed (type or API style): derive the type details again, keeping the fields.
function dtRederive() {
  const prev = DTD.spec, style = prev.Style, d = Object.assign({}, dsById(DTD.id), { Kind: DTD.core.Kind, Location: "", Spec: style ? { Style: style } : {} });
  DTD.spec = dtSpec(d);
  // switching REST ↔ GraphQL keeps the operation's name
  if (style === "GraphQL" && (prev.OperationId || prev.Name)) DTD.spec.Name = prev.OperationId || prev.Name;
  if (style === "REST" && prev.Name && !prev.OperationId) DTD.spec.OperationId = prev.Name; DTD.fields.forEach(x => x.Spec = dtAttrSpec(d, x, DTD.spec));
}
function dtApplySource() {
  const text = document.getElementById("dtSrc").value, f = dtFam0();
  let r; try { r = dtParse(text, f, DTD.spec); } catch (err) { DTD.err = "Could not read the source: " + (err.message || err); DTD.src = text; return dtRender(); }
  const old = new Map(DTD.fields.map(x => [x.Path, x]));
  if (r.spec.Types && DTD.spec.Types) r.spec.Types = Object.assign({}, r.spec.Types);
  Object.assign(DTD.spec, r.spec);
  DTD.fields = r.fields.map(x => { const o = old.get(x.Path); return Object.assign({ orig: o ? o.orig : null, Example: o ? o.Example : "" }, x, { Example: x.Example || (o ? o.Example : "") }); });
  DTD.err = ""; DTD.src = null; DTD.tab = "fields"; dtRender(); toast(`Read ${DTD.fields.length} field(s) from the source`);
}
function dtClose(saved) {
  const o = DTD && DTD.opts; if (!saved && o && o.isNew) { const id = DTD.id; DB.Datasets = DB.Datasets.filter(x => x.DatasetID !== id); DB.Attributes = DB.Attributes.filter(a => a.DatasetID !== id); save(); }
  DTD = null; closeModal(); if (o && o.onDone) o.onDone(); else renderAll();
}
function dtSave() {
  const d = dsById(DTD.id); if (!d) return dtClose(false);
  const f = dtFam0(), list = DTD.fields.filter(x => S(x.Path)), paths = list.map(x => S(x.Path));
  const dup = paths.find((p, i) => paths.indexOf(p) !== i); if (dup) { DTD.err = `"${dup}" is listed twice`; return dtRender(); }
  const keep = new Set(list.map(x => x.orig).filter(Boolean)), gone = attrsOf(d.DatasetID).filter(a => !keep.has(a.Path));
  const nMaps = gone.reduce((n, a) => n + DB.Mappings.filter(m => (m.SourceDatasetID === d.DatasetID && m.SourcePath === a.Path) || (m.TargetDatasetID === d.DatasetID && m.TargetPath === a.Path)).length, 0);
  if (gone.length && !confirm(`Remove ${gone.length} field(s) (${gone.map(a => a.Path).slice(0, 6).join(", ")}${gone.length > 6 ? "…" : ""})${nMaps ? ` and their ${nMaps} mapping(s)` : ""}?`)) return;
  pushUndo();
  Object.assign(d, { Name: S(DTD.core.Name) || d.DatasetID, Kind: DTD.core.Kind, Version: DTD.core.Version, Status: DTD.core.Status, Description: DTD.core.Description });
  const spec = Object.assign({}, DTD.spec); d.Spec = nonEmpty(spec);
  if (/^HTTP/.test(KN(d.Kind))) d.Format = spec.Style === "GraphQL" ? "GraphQL" : (d.Format && d.Format !== "GraphQL" ? d.Format : "JSON"); if (spec.Types && Object.keys(spec.Types).length) d.Spec.Types = spec.Types;
  gone.forEach(a => { DB.Attributes = DB.Attributes.filter(x => x !== a); DB.Mappings = DB.Mappings.filter(m => !((m.SourceDatasetID === d.DatasetID && m.SourcePath === a.Path) || (m.TargetDatasetID === d.DatasetID && m.TargetPath === a.Path))); });
  const ordered = [];
  for (const x of list) {
    let a = x.orig ? attrAt(d.DatasetID, x.orig) : null; const p = S(x.Path);
    if (a && x.orig !== p) { renamePath(d.DatasetID, x.orig, p); a.Path = p; }
    if (!a) { a = { _id: uid(), DatasetID: d.DatasetID, Path: p, DataType: "string", Required: "N", Classification: "Internal", TermID: "", Example: "", Description: "", Status: "Draft" }; DB.Attributes.push(a); }
    Object.assign(a, { DataType: S(x.DataType) || a.DataType, Required: /^gql/.test(f) ? (/!$/.test(x.DataType) ? "Y" : "N") : (x.Required || "N"), Description: x.Description || "", Example: x.Example || a.Example || "" });
    const s = nonEmpty(x.Spec); if (Object.keys(s).length) a.Spec = s; else delete a.Spec;
    ordered.push(a);
  }
  // keep the dialog's field order in the Attributes sheet
  const first = DB.Attributes.findIndex(a => a.DatasetID === d.DatasetID); DB.Attributes = DB.Attributes.filter(a => a.DatasetID !== d.DatasetID); DB.Attributes.splice(first < 0 ? DB.Attributes.length : first, 0, ...ordered);
  const sp = dtSpec(d); d.Location = dtLocation(d, sp) || d.Location;
  if (f === "kafka") { const ev = DB.Events.find(e => e.DatasetID === d.DatasetID); if (ev) Object.assign(ev, nonEmpty({ Topic: sp.Topic, Subject: sp.Topic ? sp.Topic + "-value" : "", Compatibility: sp.Compatibility, PartitionKey: sp.KeyField })); }
  save(); toast(`Saved ${d.Name}: ${ordered.length} field(s)`); dtClose(true);
}

/* -------------------------- workbook: export --------------------------- */
// One sheet per type family; dataset-level details repeat on each field row so the sheets filter and round-trip.
function dtSheets(wb, db) {
  const rows = Object.fromEntries(Object.keys(DT_SHEETS).map(s => [s, []]));
  for (const d of db.Datasets) {
    const f = dtFamD(d); if (f === "yaml") continue;
    const sp = dtSpec(d, db), at = db.Attributes.filter(a => a.DatasetID === d.DatasetID).map(a => Object.assign({}, a, { Spec: dtAttrSpec(d, a, sp) })), base = { DatasetID: d.DatasetID, AppID: d.AppID };
    const each = (sheet, head, fn) => (at.length ? at : [null]).forEach(a => rows[sheet].push(Object.assign({}, base, head, a ? fn(a, a.Spec) : {})));
    if (f === "gqlq" || f === "gqlm") each("HTTP APIs", { Direction: sp.Direction, Style: "GraphQL", OpType: sp.OpType, Operation: sp.Name, Parameters: sp.Parameters, ReturnType: sp.ReturnType, AuthScopes: sp.AuthScopes, Summary: d.Description }, a => ({ In: f === "gqlm" ? "variables" : "selection", Field: a.Path, Type: a.DataType, Required: a.Required, Description: a.Description }));
    if (/^gql/.test(f)) dtGqlTypes(f, sp, at).forEach((t, i) => rows["GQL Schema"].push(Object.assign({ SchemaID: `SCH-${d.DatasetID}-${String(i + 1).padStart(2, "0")}` }, base, { Root: t.root, Kind: t.kind, TypeName: t.name, Definition: dtTypeDefBody(t), Description: t.desc, Status: d.Status })));
    else if (f === "rest") { const merged = KN(d.Kind) === "HTTP API"; each("HTTP APIs", { Style: "REST", Method: sp.Method, Path: sp.Path, OperationId: sp.OperationId, Summary: sp.Summary, ContentType: sp.ContentType }, (a, s) => { const resp = merged ? (s.In === "response") : (sp.Direction === "Response"); return { Direction: resp ? "Response" : "Request", In: s.In || (resp ? "response" : "body"), Field: a.Path, Type: a.DataType, Format: s.Format, Required: a.Required, StatusCode: resp ? sp.StatusCode : "", Description: a.Description }; }); }
    else if (f === "db") each("Database", { ObjectType: sp.ObjectType, Engine: sp.Engine, Database: sp.Database, Schema: sp.Schema, Name: sp.Name, Indexes: sp.Indexes }, (a, s) => ({ Column: a.Path, DataType: a.DataType, PK: s.PK, FK: s.FK, Nullable: a.Required === "Y" ? "N" : "Y", Default: s.Default, Unique: s.Unique, Description: a.Description }));
    else if (f === "kafka") each("Kafka Avro", { Topic: sp.Topic, Namespace: sp.Namespace, Record: sp.Record, KeyField: sp.KeyField, Compatibility: sp.Compatibility }, (a, s) => { const t = dtAvroType(a); return { Field: a.Path, AvroType: s.AvroType || (typeof t === "string" ? t : t.type), LogicalType: s.LogicalType || (typeof t === "string" ? "" : t.logicalType || ""), Optional: a.Required === "Y" ? "N" : "Y", Default: s.Default, Doc: a.Description }; });
    else if (f === "dbx") each("Databricks", { Catalog: sp.Catalog, Schema: sp.Schema, Table: sp.Table, TableFormat: sp.TableFormat }, (a, s) => ({ Column: a.Path, SparkType: dtSparkType(a), Nullable: a.Required === "Y" ? "N" : "Y", Partition: s.Partition, Comment: a.Description }));
    else if (f === "file") each("Files", { FileType: sp.FileType, FileNamePattern: sp.FileNamePattern, Delimiter: sp.Delimiter, Header: sp.Header, Encoding: sp.Encoding }, (a, s) => ({ Column: a.Path, Type: a.DataType, Required: a.Required, Pattern: s.Pattern, Description: a.Description }));
  }
  for (const [name, cols] of Object.entries(DT_SHEETS)) {
    const ws = XLSX.utils.json_to_sheet(rows[name].map(r => Object.fromEntries(cols.map(c => [c, r[c] == null ? "" : String(r[c])]))), { header: cols });
    ws["!cols"] = cols.map(c => ({ wch: /Definition|Description|Doc|Comment|Summary|Selection|Parameters|Indexes/.test(c) ? 48 : /Path|Field|Column|Topic|Name|Namespace/.test(c) ? 26 : 14 }));
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows[name].length, 1), c: cols.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
}

/* -------------------------- workbook: import --------------------------- */
// Reads the type sheets back into db (plain rows, before ensureIds). Returns how many type sheets were found.
function dtReadSheets(wb, db) {
  const norm = x => String(x).replace(/\s+/g, "").toLowerCase(); let found = 0;
  db.Datasets.forEach(migrateKind);   // older REST / GQL kinds → HTTP Request / Response
  const read = name => { const n = wb.SheetNames.find(x => norm(x) === norm(name)); if (!n) return null; found++; return sheetRows(wb, n).filter(r => S(r.DatasetID)); };
  const group = rows => { const by = new Map(); rows.forEach(r => { const k = S(r.DatasetID); if (!by.has(k)) by.set(k, []); by.get(k).push(r); }); return by; };
  const ensure = (id, r, kind) => { let d = db.Datasets.find(x => x.DatasetID === id);
    if (!d) { d = { DatasetID: id, AppID: S(r.AppID), Name: id, Kind: kind, Location: "", Format: "", Version: "1", Description: "", Status: "Draft" }; db.Datasets.push(d); }
    if (!S(d.Kind)) d.Kind = kind; if (!S(d.AppID) && S(r.AppID)) d.AppID = S(r.AppID); d.Spec = d.Spec || {}; return d; };
  const upsert = (d, path, core, spec) => { path = S(path); if (!path) return;
    let a = db.Attributes.find(x => x.DatasetID === d.DatasetID && x.Path === path);
    if (!a) { a = { DatasetID: d.DatasetID, Path: path, DataType: "string", Required: "N", Classification: "Internal", TermID: "", Example: "", Description: "", Status: "Draft" }; db.Attributes.push(a); }
    Object.assign(a, nonEmpty(core)); const s = nonEmpty(spec); if (Object.keys(s).length) a.Spec = Object.assign(a.Spec || {}, s); };
  const pick = (r, keys) => nonEmpty(Object.fromEntries(keys.map(k => [k, S(r[k])])));
  const finish = d => { d.Location = dtLocation(d, dtSpec(d, db)) || d.Location; };
  let rs;
  // HTTP APIs: REST and GraphQL requests / responses, one row per field
  if ((rs = read("HTTP APIs"))) group(rs).forEach((list, id) => { const r0 = list[0];
    if (/graphql/i.test(r0.Style)) {   // GraphQL call: one dataset per direction (request = variables, response = selection)
      const d = ensure(id, r0, /request/i.test(r0.Direction) ? "06-HTTP Request" : "07-HTTP Response");
      Object.assign(d.Spec, pick(r0, ["Direction", "Style", "Method", "Path", "OpType", "Parameters", "ReturnType", "AuthScopes", "OperationId", "StatusCode", "ContentType", "Summary"]), S(r0.Operation) ? { Name: S(r0.Operation) } : {});
      if (S(r0.Summary)) d.Description = S(r0.Summary);
      list.forEach(r => upsert(d, r.Field, Object.assign(pick(r, ["Required", "Description"]), S(r.Type) ? { DataType: S(r.Type) } : {}), {})); finish(d);
    } else {   // REST endpoint: one HTTP API dataset holding both request and response (response fields marked In=response)
      const reqRow = list.find(r => /request/i.test(r.Direction)) || r0, resRow = list.find(r => /response/i.test(r.Direction)), d = ensure(id, r0, "06-HTTP API");
      Object.assign(d.Spec, { Style: "REST" }, pick(reqRow, ["Method", "Path", "OpType", "OperationId", "ContentType", "Summary"]), S(r0.Operation) ? { Name: S(r0.Operation) } : {}, resRow ? pick(resRow, ["StatusCode"]) : {});
      list.forEach(r => { const resp = /response/i.test(r.Direction); upsert(d, r.Field, Object.assign(pick(r, ["Required", "Description"]), S(r.Type) ? { DataType: S(r.Type) } : {}), resp ? { In: "response", Format: S(r.Format) } : pick(r, ["In", "Format"])); }); finish(d);
    } });
  // older workbooks: GQL Queries / GQL Mutations / REST APIs sheets
  for (const [sheet, kind, op] of [["GQL Queries", "07-HTTP Response", "query"], ["GQL Mutations", "06-HTTP Request", "mutation"]]) if ((rs = read(sheet))) rs.forEach(r => { const d = ensure(S(r.DatasetID), r, kind);
    Object.assign(d.Spec, { Style: "GraphQL", OpType: op }, pick(r, ["Name", "Parameters", "ReturnType", "AuthScopes"])); if (S(r.Description)) d.Description = S(r.Description); if (S(r.Status)) d.Status = S(r.Status);
    String(r.Selection || "").split(/\n+/).map(x => x.trim()).filter(Boolean).forEach(p => upsert(d, p, {}, {})); finish(d); });
  if ((rs = read("GQL Schema"))) group(rs).forEach((list, id) => { const d = ensure(id, list[0], list.some(r => !S(r.Root)) ? "07-GQL Type" : "07-HTTP Response"), roots = new Set(list.map(r => S(r.Root)));
    d.Spec.Types = d.Spec.Types || {}; if (/^HTTP/.test(KN(d.Kind)) && !d.Spec.Style) d.Spec.Style = "GraphQL";
    list.forEach(r => { const root = S(r.Root), def = String(r.Definition || ""), key = (def.match(/@key\s*\(\s*fields:\s*"([^"]*)"/) || [, ""])[1].split(/\s+/).filter(Boolean);
      d.Spec.Types[root] = pick(r, ["TypeName", "Kind", "Description"]); if (!root && dtFam(d.Kind) === "gqlt") Object.assign(d.Spec, pick(r, ["TypeName", "Kind"]));
      const inner = (def.match(/\{([\s\S]*)\}/) || [, def])[1];
      describedLines(inner).forEach(e => { const m = e.line.match(/^(\w+)\s*(?:\([^)]*\))?\s*:\s*([^@#]+)/); if (!m) return; const type = m[2].trim(), path = (root ? root + "." : "") + m[1];
        if (roots.has(path) || roots.has(path + "[]")) return;   // an object field: its own row lists the leaves
        upsert(d, path, { DataType: type, Required: /!$/.test(type) ? "Y" : "N", Description: (e.desc || "") + (key.includes(m[1]) ? " @key" : "") }, {}); }); });
    finish(d); });
  if ((rs = read("REST APIs"))) group(rs).forEach((list, id) => { const r0 = list[0], reqRow = list.find(r => /request/i.test(r.Direction)) || r0, resRow = list.find(r => /response/i.test(r.Direction)), d = ensure(id, r0, "06-HTTP API");
    Object.assign(d.Spec, { Style: "REST" }, pick(reqRow, ["Method", "Path", "OperationId", "Summary", "ContentType"]), resRow ? pick(resRow, ["StatusCode"]) : {}); list.forEach(r => { const resp = /response/i.test(r.Direction); upsert(d, r.Field, Object.assign(pick(r, ["Required", "Description"]), S(r.Type) ? { DataType: S(r.Type) } : {}), resp ? { In: "response", Format: S(r.Format) } : pick(r, ["In", "Format"])); }); finish(d); });
  if ((rs = read("Database"))) group(rs).forEach((list, id) => { const r0 = list[0], d = ensure(id, r0, /collection/i.test(r0.ObjectType) ? "02-DB Collection" : "01-DB Table");
    Object.assign(d.Spec, pick(r0, ["ObjectType", "Engine", "Database", "Schema", "Name", "Indexes"])); list.forEach(r => upsert(d, r.Column, Object.assign(pick(r, ["DataType", "Description"]), S(r.Nullable) ? { Required: /^n/i.test(r.Nullable) ? "Y" : "N" } : {}), pick(r, ["PK", "FK", "Default", "Unique"]))); finish(d); });
  if ((rs = read("Kafka Avro"))) group(rs).forEach((list, id) => { const r0 = list[0], d = ensure(id, r0, "05-Kafka Event");
    Object.assign(d.Spec, pick(r0, ["Topic", "Namespace", "Record", "KeyField", "Compatibility"])); list.forEach(r => upsert(d, r.Field, Object.assign({ Description: S(r.Doc) }, S(r.Optional) ? { Required: /^y/i.test(r.Optional) ? "N" : "Y" } : {}), pick(r, ["AvroType", "LogicalType", "Default"]))); finish(d); });
  if ((rs = read("Databricks"))) group(rs).forEach((list, id) => { const r0 = list[0], d = ensure(id, r0, "14-Databricks Table");
    Object.assign(d.Spec, pick(r0, ["Catalog", "Schema", "Table", "TableFormat"])); list.forEach(r => upsert(d, r.Column, Object.assign({ DataType: S(r.SparkType), Description: S(r.Comment) }, S(r.Nullable) ? { Required: /^n/i.test(r.Nullable) ? "Y" : "N" } : {}), pick(r, ["Partition"]))); finish(d); });
  if ((rs = read("Files"))) group(rs).forEach((list, id) => { const r0 = list[0], d = ensure(id, r0, /json/i.test(r0.FileType) ? "04-JSON Schema" : "03-CSV Schema");
    Object.assign(d.Spec, pick(r0, ["FileType", "FileNamePattern", "Delimiter", "Header", "Encoding"])); list.forEach(r => upsert(d, r.Column, Object.assign({ DataType: S(r.Type), Description: S(r.Description) }, S(r.Required) ? { Required: /^y/i.test(r.Required) ? "Y" : "N" } : {}), pick(r, ["Pattern"]))); finish(d); });
  return found;
}

/* ------------------- import HTTP datasets from an API spec ------------------
   Load an OpenAPI spec (REST) or a GraphQL schema (SDL), pick operations, and build an HTTP Request and / or
   HTTP Response dataset per operation, with its fields (request: path / query / header parameters + body, or
   GraphQL variables / input; response: the response body, or the GraphQL selection down to a chosen depth). */
const DT_SPEC_SAMPLES = {
  openapi: ["product", "pnp", "inventory", "search", "cart", "payments", "checkout"].flatMap(n => [`samples/subgraph/${n}/openapi.yaml`, `samples/subgraph/${n}/openapi-fixed.yaml`]).concat(["samples/bff-openapi.yaml"]),
  graphql: ["product", "pnp", "inventory", "search", "cart", "payments", "checkout"].map(n => `samples/subgraph/${n}/subgraph.gql`).concat(["samples/subgraph/search/subgraph-fixed.gql", "samples/mono-graph.gql"]),
};
let DTI = null;
// REST: every operation of an OpenAPI document with its request and response fields.
function dtOasModel(text) {
  const doc = window.jsyaml ? jsyaml.load(text) : JSON.parse(text); if (!doc || !doc.paths) throw new Error("not an OpenAPI document (no paths:)");
  const ref = x => { let g = 0; while (x && x.$ref && g++ < 10) x = String(x.$ref).split("/").slice(1).reduce((o, k) => o && o[k], doc) || {}; return x || {}; };
  const flat = sch => { if (!sch) return []; let s = ref(sch), pre = ""; if (s.type === "array" && s.items) { s = ref(s.items); pre = "[]"; } const out = s.type === "object" || s.properties || s.allOf ? dtFlattenJsonSchema(s, pre, null, [], doc) : [dtF("value", dtFromOas(s.type, s.format), true, s.description, { In: "body" })]; out.forEach(x => { if (x.Path.startsWith("[].")) x.Path = x.Path.slice(3); }); return out; };
  const ops = [];
  for (const [path, item0] of Object.entries(doc.paths)) { const item = ref(item0);
    for (const method of ["get", "post", "put", "patch", "delete", "head", "options"]) { const op = item[method]; if (!op) continue;
      const params = [...(item.parameters || []), ...(op.parameters || [])].map(ref).filter(p => p && p.name);
      const req = params.map(p => dtF(p.name, dtFromOas((ref(p.schema) || {}).type, (ref(p.schema) || {}).format), p.required || p.in === "path", p.description, { In: p.in }));
      const rb = ref(op.requestBody), rbc = (rb && rb.content) || {}, rct = Object.keys(rbc).find(c => /json/.test(c)) || Object.keys(rbc)[0];
      if (rct) req.push(...flat(rbc[rct].schema));
      const codes = Object.keys(op.responses || {}), code = codes.find(c => /^2/.test(c) && ref(op.responses[c]).content) || codes.find(c => /^2/.test(c)) || codes[0] || "200";
      const rr = ref((op.responses || {})[code]), rc = (rr && rr.content) || {}, ct = Object.keys(rc).find(c => /json/.test(c)) || Object.keys(rc)[0];
      const name = op.operationId || lowerFirst(method + pascal(path.replace(/\{[^}]*\}/g, "")));
      ops.push({ key: method.toUpperCase() + " " + path, name, label: `${method.toUpperCase()} ${path}`, sub: op.summary || op.description || name, req, res: ct ? flat(rc[ct].schema) : [],
        spec: { Style: "REST", Method: method.toUpperCase(), Path: path, OperationId: op.operationId || "", Summary: op.summary || op.description || "", StatusCode: code, ContentType: rct || ct || "application/json" } });
    } }
  return { ops, version: String((doc.info || {}).version || "1"), title: (doc.info || {}).title || "" };
}
// GraphQL: every Query / Mutation / Subscription field of a schema, with variables and a selection to a depth.
function dtSdlModel(text, depth) {
  const src = String(text).replace(/(^|[^"])#[^\n]*/g, "$1"), types = {};
  for (const m of src.matchAll(/(?:"""([\s\S]*?)"""\s*|"([^"\n]*)"\s*)?\b(extend\s+)?(type|input|interface|enum|scalar|union)\s+(\w+)([^{\n]*)(?:\{([\s\S]*?)\n\s*\}|\{([^}]*)\})?/g)) {
    const kind = m[4], name = m[5], body = m[7] != null ? m[7] : m[8] || "", t = types[name] || (types[name] = { kind, desc: (m[1] || m[2] || "").replace(/\s+/g, " ").trim(), fields: [], values: [] });
    if (kind === "enum") { t.values.push(...body.replace(/"""[\s\S]*?"""|"[^"\n]*"/g, "").split(/\s+/).filter(x => /^[A-Za-z_]\w*$/.test(x))); continue; }
    for (const f of body.matchAll(/(?:"""([\s\S]*?)"""\s*|"((?:[^"\\]|\\.)*)"\s*)?(\w+)\s*(\(((?:[^()]|\([^()]*\))*)\))?\s*:\s*([\[\]\w!]+)/g))
      t.fields.push({ name: f[3], type: f[6], desc: (f[1] || f[2] || "").replace(/\s+/g, " ").trim(),
        args: [...String(f[5] || "").replace(/"""[\s\S]*?"""|"[^"\n]*"/g, "").matchAll(/(\w+)\s*:\s*([\[\]\w!]+)/g)].map(a => ({ name: a[1], type: a[2] })) });
  }
  const isObj = b => types[b] && (types[b].kind === "type" || types[b].kind === "interface"), isIn = b => types[b] && types[b].kind === "input";
  const input = (tn, prefix, seen, out) => { for (const f of types[tn].fields) { const b = baseT(f.type), list = /^\s*\[/.test(f.type), path = prefix + "." + f.name;
    if (isIn(b) && !seen.has(b) && seen.size < 6) input(b, path + (list ? "[]" : ""), new Set([...seen, b]), out); else out.push(dtF(path, f.type, /!$/.test(f.type), f.desc)); } return out; };
  const select = (tn, prefix, d, seen, out) => { for (const f of types[tn].fields) { const b = baseT(f.type), list = /^\s*\[/.test(f.type), path = prefix + "." + f.name;
    if (isObj(b)) { if (d < depth && !seen.has(b)) select(b, path + (list ? "[]" : ""), d + 1, new Set([...seen, b]), out); }
    else if (!(types[b] && types[b].kind === "union")) out.push(dtF(path, f.type, /!$/.test(f.type), f.desc, {}, types[b] && types[b].kind === "enum" ? types[b].values.join("|") : "")); } return out; };
  const ops = [];
  for (const [root, opType] of [["Query", "query"], ["Mutation", "mutation"], ["Subscription", "subscription"]]) for (const f of (types[root] || { fields: [] }).fields) {
    const req = []; f.args.forEach(a => { const b = baseT(a.type); if (isIn(b)) input(b, a.name, new Set([b]), req); else req.push(dtF(a.name, a.type, /!$/.test(a.type), "")); });
    const rb = baseT(f.type), list = /^\s*\[/.test(f.type), res = isObj(rb) ? select(rb, f.name + (list ? "[]" : ""), 1, new Set([rb]), []) : [dtF(f.name, f.type, /!$/.test(f.type), f.desc)];
    ops.push({ key: opType + " " + f.name, name: f.name, label: `${opType} ${f.name}${f.args.length ? "(" + f.args.map(a => `${a.name}: ${a.type}`).join(", ") + ")" : ""}: ${f.type}`, sub: f.desc, req, res,
      spec: { Style: "GraphQL", OpType: opType, Name: f.name, Parameters: f.args.map(a => `${a.name}: ${a.type}`).join("\n"), ReturnType: f.type, AuthScopes: "" } });
  }
  if (!ops.length) throw new Error("no Query / Mutation / Subscription fields found");
  return { ops, version: "1", title: "" };
}
// Spec paths an application declares in its Links (one per line): OpenAPI (.yaml/.yml/.json)
// or GraphQL (.graphql/.graphqls/.gql), so its spec can be loaded dynamically.
const SPEC_RE = /\.(ya?ml|json|graphql|graphqls|gql)$/i;
function dtAppSpecPaths(app) {
  if (!app) return [];
  const seen = new Set();
  return (typeof parseLinks === "function" ? parseLinks(app.Links) : String(app.Links || "").split(/[\n\r]+/).map(v => ({ value: v.trim() })))
    .map(l => l.value).filter(v => v && SPEC_RE.test(v) && !seen.has(v) && seen.add(v))
    .map(v => ({ path: v, kind: /\.(graphql|graphqls|gql)$/i.test(v) ? "graphql" : "openapi" }));
}
// Fetch a spec by its registry path. Specs live at the repo root (e.g. 3prl/subgraph/…),
// this app under workbench.github.io/, so also try a ../ prefix. Needs http(s) (not file://).
async function dtFetchSpec(path) {
  const tries = [path, "../" + path.replace(/^\.?\/+/, "")];
  let lastErr;
  for (const u of tries) {
    try { const r = await fetch(u); if (r.ok) return await r.text(); lastErr = new Error("HTTP " + r.status); }
    catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("not found");
}
function dtImportOpen(appId, onDone) { DTI = { appId, onDone, kind: "openapi", text: "", name: "", model: null, sel: {}, depth: 2, err: "" }; dtImportRender(); }
function dtImportRead() {
  try { DTI.model = DTI.kind === "openapi" ? dtOasModel(DTI.text) : dtSdlModel(DTI.text, DTI.depth); DTI.err = ""; }
  catch (e) { DTI.model = null; DTI.err = "Could not read the spec: " + (e.message || e); }
  if (DTI.model) { const keep = DTI.sel; DTI.sel = {}; DTI.model.ops.forEach(o => { const k = keep[o.key]; DTI.sel[o.key] = k || { on: false, req: o.req.length > 0, res: o.res.length > 0 }; }); }
  dtImportRender();
}
const dtIdFor = (o, dir) => `${o.spec.Style === "REST" ? "REST" : "GQL"}-${String(o.name).replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}${dir === "API" ? "" : dir === "Request" ? "-REQ" : "-RES"}`;
function dtImportRender() {
  // REST: one HTTP API dataset per endpoint (request + response merged); GraphQL: one per direction.
  const M = DTI.model, n = M ? M.ops.reduce((c, o) => { const s = DTI.sel[o.key]; if (!s.on) return c; return o.spec.Style === "REST" ? c + (((s.req && o.req.length) || (s.res && o.res.length)) ? 1 : 0) : c + (s.req && o.req.length ? 1 : 0) + (s.res && o.res.length ? 1 : 0); }, 0) : 0;
  const apps = DB.Domains.map(dm => [dm, DB.Applications.filter(a => a.DomainID === dm.DomainID)]).filter(([, l]) => l.length);
  const exists = (o, dir) => { const d = dsById(dtIdFor(o, o.spec.Style === "REST" ? "API" : dir)); return d ? `<span class="hint" title="${ea(d.Name)}">updates ${esc(d.DatasetID)}</span>` : ""; };
  const specApp = typeof appById === "function" ? appById(DTI.appId) : null, specPaths = dtAppSpecPaths(specApp);
  const specRow = specPaths.length ? `<div class="dg-row"><span class="hint">Load ${esc(specApp.Name)}'s spec:</span>${specPaths.map(sp => `<button data-dti="appspec" data-path="${ea(sp.path)}" title="Fetch ${ea(sp.path)}">⇪ ${sp.kind === "graphql" ? "GraphQL" : "OpenAPI"} · ${esc(sp.path.split("/").pop())}</button>`).join("")}<span class="hint">(served over http; else use Choose file…)</span></div>` : "";
  openModal(`<h2>Import HTTP datasets from an API spec</h2>
    <p class="hint">Load an <b>OpenAPI</b> spec (REST) or a <b>GraphQL schema</b>, tick the operations. Each REST endpoint becomes one <b>HTTP API</b> dataset holding its request <i>and</i> response fields; each GraphQL operation becomes an <b>HTTP Request</b> and / or <b>HTTP Response</b> dataset. An application that declares its spec path(s) in Links can be loaded in one click below. Fields whose name matches an already-tagged attribute get its business term.</p>
    ${specRow}
    <div class="dg-row"><label><input type="radio" name="dtiKind" value="openapi"${DTI.kind === "openapi" ? " checked" : ""} data-dti="kind" /> OpenAPI (REST)</label><label><input type="radio" name="dtiKind" value="graphql"${DTI.kind === "graphql" ? " checked" : ""} data-dti="kind" /> GraphQL schema (SDL)</label>
      <span class="spacer" style="flex:1"></span><select id="dtiSample">${DT_SPEC_SAMPLES[DTI.kind].map(s => `<option${s === DTI.name ? " selected" : ""}>${esc(s)}</option>`).join("")}</select><button data-dti="sample">Load sample</button>
      <label class="btn" style="cursor:pointer">Choose file…<input type="file" id="dtiFile" accept="${DTI.kind === "openapi" ? ".yaml,.yml,.json" : ".graphql,.graphqls,.gql,.txt"}" hidden /></label></div>
    <textarea id="dtiText" class="dt-src" style="min-height:140px;max-height:24vh" spellcheck="false" placeholder="${DTI.kind === "openapi" ? "openapi: 3.0.3\npaths:\n  /products/{sku}:\n    get: …" : "type Query {\n  product(sku: ID!): Product\n}\ntype Product { … }"}">${esc(DTI.text)}</textarea>
    <div class="dg-row"><button class="primary" data-dti="read">Read operations</button>${DTI.kind === "graphql" ? `<label>Response depth <select data-dti="depth">${[1, 2, 3, 4, 5].map(x => `<option${x === DTI.depth ? " selected" : ""}>${x}</option>`).join("")}</select></label><span class="hint">levels of nested object fields to select</span>` : ""}
      <span class="spacer" style="flex:1"></span><label>Application <select id="dtiApp" data-dti="app">${apps.map(([dm, l]) => `<optgroup label="${ea(dm.Name)}">${l.map(a => `<option value="${ea(a.AppID)}"${a.AppID === DTI.appId ? " selected" : ""}>${esc(a.Name)} · ${esc(KN(a.AppType))}</option>`).join("")}</optgroup>`).join("")}</select></label></div>
    ${M ? `<div class="kv">${M.ops.length} operations${DTI.name ? " in " + esc(DTI.name.split("/").slice(-2).join("/")) : ""} <button class="addrow" data-dti="all">Select all</button><button class="addrow" data-dti="none">Select none</button></div>
      <div class="dt-fields"><table class="dg-tbl"><thead><tr><th></th><th>Operation</th><th>HTTP Request</th><th>HTTP Response</th></tr></thead><tbody>${M.ops.map(o => { const s = DTI.sel[o.key];
        return `<tr class="${s.on ? "cur" : ""}"><td><input type="checkbox" data-dti="op" data-k="${ea(o.key)}"${s.on ? " checked" : ""} /></td><td><span class="mono">${esc(o.label)}</span><div class="hint">${esc(String(o.sub || "").slice(0, 110))}</div></td>
          <td>${o.req.length ? `<label><input type="checkbox" data-dti="req" data-k="${ea(o.key)}"${s.req ? " checked" : ""} /> ${o.req.length} field${o.req.length === 1 ? "" : "s"}</label> ${exists(o, "Request")}<div class="hint mono" title="${ea(o.req.map(x => x.Path).join("\n"))}">${esc(o.req.slice(0, 4).map(x => x.Path).join(", "))}${o.req.length > 4 ? "…" : ""}</div>` : '<span class="hint">no parameters / body</span>'}</td>
          <td>${o.res.length ? `<label><input type="checkbox" data-dti="res" data-k="${ea(o.key)}"${s.res ? " checked" : ""} /> ${o.res.length} field${o.res.length === 1 ? "" : "s"}</label> ${exists(o, "Response")}<div class="hint mono" title="${ea(o.res.map(x => x.Path).join("\n"))}">${esc(o.res.slice(0, 4).map(x => x.Path).join(", "))}${o.res.length > 4 ? "…" : ""}</div>` : '<span class="hint">no response body</span>'}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
    <div class="dt-err">${esc(DTI.err)}</div>
    <div class="modal-actions"><span style="flex:1"></span><button data-dti="cancel">Cancel</button><button class="primary" data-dti="create"${n ? "" : " disabled"}>Create ${n} dataset${n === 1 ? "" : "s"}</button></div>`);
  document.getElementById("modalCard").classList.add("dt-wide", "dt-import");
  document.getElementById("dtiFile").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { DTI.text = r.result; DTI.name = f.name; if (/\.(graphqls?|gql)$/i.test(f.name)) DTI.kind = "graphql"; else if (/\.(ya?ml|json)$/i.test(f.name)) DTI.kind = "openapi"; dtImportRead(); }; r.readAsText(f); };
}
// A business term for a new field: the term of an attribute elsewhere with the same leaf name.
function dtAutoTerm(path) { const leaf = leafNorm(path), twin = DB.Attributes.find(x => S(x.TermID) && termById(x.TermID) && leafNorm(x.Path) === leaf); return twin ? twin.TermID : ""; }
function dtImportCreate() {
  const M = DTI.model, appId = val("dtiApp"), made = []; let nf = 0; if (!M || !appById(appId)) return;
  pushUndo();
  const addField = (id, x, resp) => { let a = attrAt(id, x.Path);
    if (!a) { a = { _id: uid(), DatasetID: id, Path: x.Path, DataType: x.DataType, Required: x.Required, Classification: "Internal", TermID: dtAutoTerm(x.Path), Example: x.Example || "", Description: x.Description || "", Status: "Draft" }; DB.Attributes.push(a); nf++; }
    else Object.assign(a, { DataType: x.DataType, Required: x.Required }, x.Description ? { Description: x.Description } : {});
    const sp = Object.assign({}, nonEmpty(x.Spec), resp ? { In: "response" } : {}); if (Object.keys(sp).length) a.Spec = sp; };
  for (const o of M.ops) { const s = DTI.sel[o.key]; if (!s.on) continue;
    if (o.spec.Style === "REST") {   // one HTTP API dataset per endpoint: request + response merged
      if (!((s.req && o.req.length) || (s.res && o.res.length))) continue;
      let id = dtIdFor(o, "API"), d = dsById(id); if (d && d.AppID !== appId) { let i = 2; while (dsById(`${id}-${i}`)) i++; id = `${id}-${i}`; d = null; }
      if (!d) { d = { _id: uid(), DatasetID: id, AppID: appId, Name: o.label, Kind: "06-HTTP API", Location: "", Format: "JSON", Version: M.version, Description: o.sub || "", Status: "Draft" }; DB.Datasets.push(d); }
      d.Spec = nonEmpty(Object.assign({}, o.spec)); d.Location = dtLocation(d, dtSpec(d)) || d.Location;
      if (s.req) o.req.forEach(x => addField(id, x, false));
      if (s.res) o.res.forEach(x => addField(id, x, true));
      made.push(id);
    } else {   // GraphQL: one dataset per direction (variables / selection)
      for (const [dir, fields, want] of [["Request", o.req, s.req], ["Response", o.res, s.res]]) { if (!want || !fields.length) continue;
        let id = dtIdFor(o, dir), d = dsById(id); if (d && d.AppID !== appId) { let i = 2; while (dsById(`${id}-${i}`)) i++; id = `${id}-${i}`; d = null; }
        const spec = Object.assign({}, o.spec, { Direction: dir });
        const name = `${spec.OpType} ${o.name} — ${dir.toLowerCase()}`;
        if (!d) { d = { _id: uid(), DatasetID: id, AppID: appId, Name: name, Kind: dir === "Request" ? "06-HTTP Request" : "07-HTTP Response", Location: "", Format: "GraphQL", Version: M.version, Description: o.sub || "", Status: "Draft" }; DB.Datasets.push(d); }
        d.Spec = nonEmpty(spec); d.Location = dtLocation(d, dtSpec(d)) || d.Location;
        fields.forEach(x => addField(id, x, false));
        made.push(id); }
    }
  }
  save(); const done = DTI.onDone; DTI = null; closeModal(); toast(`Imported ${made.length} HTTP dataset(s) with ${nf} new field(s)`); if (done) done(made); else renderAll();
}
function dtImportWire() {
  const card = document.getElementById("modalCard");
  card.addEventListener("click", async e => { if (!DTI || !card.classList.contains("dt-import")) return; const b = e.target.closest("[data-dti]"); if (!b || b.disabled) return; const a = b.dataset.dti;
    if (b.tagName === "INPUT" || b.tagName === "SELECT") return;
    DTI.text = (document.getElementById("dtiText") || {}).value != null ? document.getElementById("dtiText").value : DTI.text; DTI.appId = val("dtiApp") || DTI.appId;
    if (a === "read") dtImportRead();
    else if (a === "sample") { const p = val("dtiSample"); try { const r = await fetch(p); if (!r.ok) throw new Error("HTTP " + r.status); DTI.text = await r.text(); DTI.name = p; dtImportRead(); } catch (err) { DTI.err = `Couldn't load ${p} (${err.message}). Samples need the page served over http(s); from disk, use Choose file….`; dtImportRender(); } }
    else if (a === "appspec") { const p = b.dataset.path; DTI.kind = /\.(graphql|graphqls|gql)$/i.test(p) ? "graphql" : "openapi"; try { DTI.text = await dtFetchSpec(p); DTI.name = p; dtImportRead(); } catch (err) { DTI.err = `Couldn't load ${p} (${err.message}). The spec must be reachable over http(s) from this page; from disk, use Choose file….`; dtImportRender(); } }
    else if (a === "all" || a === "none") { Object.values(DTI.sel).forEach(s => s.on = a === "all"); dtImportRender(); }
    else if (a === "cancel") { DTI = null; closeModal(); }
    else if (a === "create") dtImportCreate(); });
  card.addEventListener("change", e => { if (!DTI || !card.classList.contains("dt-import")) return; const el = e.target, a = el.dataset.dti; if (!a) return;
    DTI.text = document.getElementById("dtiText").value; DTI.appId = val("dtiApp") || DTI.appId;
    if (a === "kind") { DTI.kind = el.value; DTI.model = null; DTI.err = ""; DTI.name = ""; dtImportRender(); }
    else if (a === "app") { DTI.appId = el.value; dtImportRender(); }
    else if (a === "depth") { DTI.depth = +el.value; if (DTI.model) dtImportRead(); else dtImportRender(); }
    else if (a === "op" || a === "req" || a === "res") { const s = DTI.sel[el.dataset.k]; s[a === "op" ? "on" : a] = el.checked; if (a !== "op" && el.checked) s.on = true; dtImportRender(); } });
}

dtWire(); dtImportWire();
