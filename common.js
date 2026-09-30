/* common.js — shared helpers for the FedGQL Migration WorkBench.
   Loaded as a classic <script> BEFORE each page inline <script> in
   workbench.html, gql-migration.html and subgraph-codemigration.html
   (plus the index / help / demo pages).
   Only declarations that are identical (ignoring formatting) across the
   pages live here; page-specific variants stay inline and override these.
   Top-level let/const here are shared across the page scripts, so they are
   declared ONCE (never re-declared in a page, or the browser throws). */

/* ---------------------------- pure utilities --------------------------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function baseType(t){ return String(t||"").replace(/[\[\]!]/g,"").trim(); }
function cap(s){ s=String(s||""); return s.charAt(0).toUpperCase()+s.slice(1); }
function uid(){ return "R"+Math.random().toString(36).slice(2,8); }
function slug(s){ return String(s||"").replace(/[^a-zA-Z0-9]+/g," ").trim().replace(/\s+/g," "); }
function val(id){ const e=document.getElementById(id); return e?e.value:""; }
function copyText(txt){ navigator.clipboard.writeText(txt).then(()=>toast("Copied")).catch(()=>toast("Copy failed")); }
function highlightSDL(sdl){
  return esc(sdl)
    .replace(/&quot;[^&]*&quot;/g, m => '<span class="s">'+m+'</span>')
    .replace(/\b(type|input|enum|interface|union|scalar|query|mutation|subscription|extend|implements)\b/g, '<span class="k">$1</span>')
    .replace(/@\w+/g, m => '<span class="c">'+m+'</span>');
}
function keyOf(fields, keyFields){
  if(keyFields && keyFields[0]) return keyFields[0];
  const f=(fields||[]).find(f=>f.name==="id") || (fields||[]).find(f=>/id$/i.test(f.name)) || (fields||[])[0];
  return f?f.name:"id";
}

/* --------------------- OpenAPI / schema helpers ------------------------ */
function gqlScalar(jsonType){ return {string:"String", integer:"Int", number:"Float", boolean:"Boolean"}[jsonType] || "String"; }
function refName(ref){ return cap(slug(String(ref||"").split("/").pop()).replace(/ /g,"")); }
function derefSchema(sch, comps){ let s=sch, guard=0; while(s && s.$ref && guard++<10) s=comps[String(s.$ref).split("/").pop()]||{}; return s||{}; }
function entityKey(name, fields){
  const own=(fields||[]).find(f=>/^id$/i.test(f.name));
  if(own) return own.name;
  const base=String(name||"").replace(/[^a-zA-Z0-9]/g,"").toLowerCase();
  const self=(fields||[]).find(f=>f.name.toLowerCase()===base+"id");
  return self?self.name:"";
}
function sheetRows(wb, name){ return wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], {defval:"", raw:false}) : []; }

/* ------------------- Links & References (typed links) ------------------ */
// Every sheet's Links cell holds one reference per line, tagged "Type: target" with a LINK_TYPES
// type (picked from a dropdown in the registry grid). Untagged lines — older data, generated
// "subgraph:…" sources — read as Other.
const LINK_TYPES = ["LeanIX", "Confluence", "ER", "Other"];
function parseLinks(v){
  return String(v||"").split(/[\n\r]+/).map(s=>s.trim()).filter(Boolean).map(line=>{
    const m=line.match(/^(LeanIX|Confluence|ER|Other)\s*:\s*(.*)$/i);
    return m ? { type: LINK_TYPES.find(t=>t.toLowerCase()===m[1].toLowerCase()), value: m[2].trim() } : { type: "Other", value: line };
  });
}
function formatLinks(list){ return (list||[]).filter(l=>l.value).map(l=>`${l.type}: ${l.value}`).join("\n"); }
// Read-only rendering: a type badge per line, clickable when the target is a URL.
function linksHTML(v){
  return parseLinks(v).map(l=>`<div><span class="link-type">${esc(l.type)}</span> ${/^https?:\/\//i.test(l.value)
    ? `<a href="${esc(l.value)}" target="_blank" rel="noopener">${esc(l.value)}</a>` : esc(l.value)}</div>`).join("");
}

/* -------- FedGQL schema-standards engine (index + gql-migration) ------- */
const DEFAULT_STANDARDS = {
  meta: {
    version: "1.2",
    title: "GQL Federation — Schema Standards and Patterns",
    source: "GQL Federation - Schema Standards and Patterns.md",
    docBase: ""
  },
  patterns: {
    PascalCase: "^[A-Z][A-Za-z0-9]*$",
    camelCase: "^[a-z][A-Za-z0-9]*$",
    SCREAMING_SNAKE_CASE: "^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$",
    versioned: "[Vv][0-9]+$",
    arrayNonNull: "^\\[.+!\\]!$"
  },
  scalars: {
    standard: ["ID", "String", "Int", "Float", "Boolean", "CountryCode", "Currency", "Date",
      "DateTimeISO", "Decimal", "LocalDateTime", "LocalDate", "LocalTime", "JSON", "HexColorCode",
      "Latitude", "Longitude", "Money", "PhoneNumber", "Postcode", "TimeZone", "URL", "UUID"],
    discouraged: {
      DateTime: "Prefer DateTimeISO — a timestamp with a mandatory time-zone offset.",
      LocalDateTime: "Prefer DateTimeISO wherever an offset applies; LocalDateTime has no offset."
    },
    monetaryHints: ["price", "cost", "amount", "total", "fee", "charge", "balance", "rrp"],
    monetaryScalars: ["Decimal", "Float"],
    monetaryExclude: ["percent", "percentage", "pct", "rate", "ratio", "factor", "count", "qty", "quantity", "index", "score", "weight"]
  },
  abbreviations: { agreed: ["CTA", "Org", "Promo"], allCapsAllowed: ["ID", "URL", "URI", "UUID", "JSON", "GST"] },
  verbHints: ["create", "update", "delete", "apply", "generate", "add", "remove", "set", "cancel",
    "submit", "assign", "link", "unlink", "enable", "disable", "approve", "reject", "send", "start",
    "stop", "activate", "deactivate", "confirm", "decline", "move", "copy", "share", "sync"],
  rules: [
    { id: "NAME-TYPE-PASCAL", title: "Type names must be PascalCase", category: "Type names", section: "Naming Rules", severity: "error", message: "type/enum/input/interface names must be PascalCase (e.g. ProductAvailability).", fix: "Rename to PascalCase, namespaced by the owning subgraph where applicable." },
    { id: "NAME-ABBREV-CASE", title: "Avoid all-uppercase abbreviations", category: "Type names", section: "Agreed Naming Abbreviations", severity: "warning", message: "avoid all-uppercase names/abbreviations unless agreed (agreed: CTA, Org, Promo).", fix: "Use PascalCase; abbreviations are title-cased (Org, Promo) unless on the agreed all-caps list." },
    { id: "NAME-INPUT-SUFFIX", title: "Input types end with 'Input'", category: "Input types", section: "Naming Rules", severity: "warning", message: "input type names should follow <Operation>Input (end with 'Input'), e.g. ApplyPromoInput.", fix: "Name the input after the query/mutation it serves and suffix it with 'Input'." },
    { id: "NAME-FIELD-CAMEL", title: "Object/input fields must be camelCase", category: "Fields", section: "Naming Rules", severity: "error", message: "field names must be camelCase (e.g. phoneNumber).", fix: "Rename the field to camelCase." },
    { id: "NAME-BOOL-PREFIX", title: "Boolean fields avoid is/has/can prefixes", category: "Fields", section: "Naming Rules", severity: "warning", message: "Boolean fields should avoid is/has/can prefixes and negative names (prefer 'active' over 'isActive').", fix: "Drop the prefix unless it genuinely adds clarity; avoid negative names like 'inactive'." },
    { id: "NULL-KEY-NONNULL", title: "Entity @key fields must be non-null", category: "Nullability", section: "Field Nullability Rules", severity: "error", message: "entity @key fields must be non-null (end with !).", fix: "Mark every field named in @key(fields: \"…\") as non-null, e.g. sku: ID!." },
    { id: "NULL-ARRAY-NONNULL", title: "Array fields must be non-null with non-null elements", category: "Nullability", section: "Field Nullability Rules", severity: "error", message: "array fields must be non-null with non-null elements: [Type!]! (no data = empty array).", fix: "Write the type as [Type!]! so consumers only check for emptiness, never null." },
    { id: "NAME-ENUMVALUE-SCREAMING", title: "Enum values must be SCREAMING_SNAKE_CASE", category: "Enums", section: "Naming Rules", severity: "error", message: "enum values must be SCREAMING_SNAKE_CASE (e.g. NEXT_DAY).", fix: "Uppercase the value and separate words with underscores." },
    { id: "ENUM-UNKNOWN-VALUE", title: "Consider an UNKNOWN enum value", category: "Enums", section: "Enum Value Additions", severity: "info", message: "consider adding an UNKNOWN value so consumers implement catch-all handling and enum additions stay safe.", fix: "Add UNKNOWN as a catch-all value to the enum." },
    { id: "SCALAR-STANDARD", title: "Use a standardized custom scalar", category: "Scalars", section: "Custom Scalars", severity: "warning", message: "is not in the approved custom-scalar list — confirm it is a standardized scalar before use.", fix: "Use one of the curated scalars (DateTimeISO, Money, URL, UUID, …) or propose the new scalar in a schema review." },
    { id: "SCALAR-PREFER-DATETIMEISO", title: "Prefer DateTimeISO for timestamps", category: "Scalars", section: "Custom Scalars", severity: "warning", message: "prefer DateTimeISO for timestamps (it mandates a time-zone offset).", fix: "Replace DateTime/LocalDateTime with DateTimeISO where an offset applies." },
    { id: "SCALAR-MONEY-NOT-DECIMAL", title: "Use Money for monetary values", category: "Scalars", section: "Custom Scalars", severity: "warning", message: "monetary fields should use the Money scalar, not Decimal/Float (percentages/ratios/counts are exempt).", fix: "Change the field type to Money to signal monetary intent. Fields that are percentages, ratios, rates or counts (e.g. meatYieldCostPercent) may keep Decimal." },
    { id: "NAME-QUERY-CAMEL", title: "Query names must be camelCase", category: "Queries", section: "Naming Rules", severity: "error", message: "query names must be camelCase and namespaced (e.g. product, loyaltyPlans).", fix: "Rename to camelCase; use the singular for 0/1 result and plural for many." },
    { id: "NAME-MUTATION-CAMEL", title: "Mutation names must be camelCase", category: "Mutations", section: "Naming Rules", severity: "error", message: "mutation names must be camelCase (e.g. applyDiscountCodesPromo).", fix: "Rename to camelCase." },
    { id: "NAME-MUTATION-VERB", title: "Mutations start with a domain verb", category: "Mutations", section: "Use Business/Domain Language", severity: "info", message: "mutation names should start with a domain verb (e.g. applyPromo, createSubscription).", fix: "Lead with a verb in business/domain language; prefer domain terms over CRUD." },
    { id: "OP-SINGLE-INPUT", title: "Use a single input type argument", category: "Operations", section: "Use a Single Input Type Argument for Queries/Mutations", severity: "warning", message: "queries/mutations should take a single input: <Name>Input argument (exempt: stable lookup-by-id queries).", fix: "Group arguments into one input type, e.g. products(input: ProductsInput)." },
    { id: "ANTI-FIELD-VERSION", title: "No field/type versioning", category: "Anti-patterns", section: "Field Versioning", severity: "warning", message: "avoid version suffixes like V2 — schema versioning is a GQL anti-pattern.", fix: "Use the 2-stage deprecation approach (@deprecated with a planned deletion date) instead of a versioned name." }
  ]
};
let STANDARDS = DEFAULT_STANDARDS;
const VALIDATED_SHEETS = new Set(["Schema", "Queries", "Mutations"]);
const SEVERITY_RANK = { error: 3, warning: 2, info: 1 };
const __reCache = {};
function stdRe(name){ if(__reCache[name]) return __reCache[name]; const src=(STANDARDS.patterns&&STANDARDS.patterns[name])||DEFAULT_STANDARDS.patterns[name]; return (__reCache[name]=new RegExp(src)); }
function ruleMeta(id){ const r=(STANDARDS.rules||[]).find(x=>x.id===id); return (r&&r.enabled!==false)?r:null; }
function docUrlFor(rule){ const base=(STANDARDS.meta&&STANDARDS.meta.docBase)||""; if(!base||!rule.section) return base; return base+"#"+rule.section.trim().replace(/[^A-Za-z0-9]+/g,"-"); }
function mkViol(list,id,col,subject){ const r=ruleMeta(id); if(!r) return; list.push({ ruleId:id, severity:r.severity||"warning", col, subject:subject||"", title:r.title, section:r.section, message:r.message, fix:r.fix, doc:docUrlFor(r) }); }
function parseDefKey(def){ const m=String(def||"").match(/@key\s*\(\s*fields\s*:\s*"([^"]*)"/i); return m?m[1]:""; }
function defBodyLines(def){ let s=String(def||""); const b=s.indexOf("{"), e=s.lastIndexOf("}"); if(b>=0&&e>b) s=s.slice(b+1,e); return s.split(/[\n\r]+/).map(l=>l.trim()).filter(l=>l&&l!=="{"&&l!=="}"&&!l.startsWith("#")&&!l.startsWith("@")); }
function fieldDefs(def){ return defBodyLines(def).map(l=>{ const m=l.match(/^([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*:\s*(.+)$/); if(!m) return null; const rawType=m[2].split("@")[0].trim(); return { name:m[1], rawType, base:baseType(rawType) }; }).filter(Boolean); }
function parseArgs(s){ return String(s||"").split(/[,\n\r]+/).map(x=>x.trim()).filter(Boolean).map(pair=>{ const i=pair.indexOf(":"); return i===-1?{name:pair,type:""}:{name:pair.slice(0,i).trim(), type:pair.slice(i+1).trim()}; }); }
function keyFieldSet(def){ const raw=parseDefKey(def); return new Set(raw.replace(/[{}]/g," ").split(/\s+/).map(s=>s.trim()).filter(Boolean)); }
// Validate one generated registry row → array of violation entries (mirrors workbench.html validateRow).
function validateRow(sheet, row){
  const out=[];
  const sc=STANDARDS.scalars||DEFAULT_STANDARDS.scalars;
  const standardScalars=new Set(sc.standard), discouraged=sc.discouraged||{};
  const monetaryHints=sc.monetaryHints||[], monetaryScalars=new Set(sc.monetaryScalars||[]);
  const monetaryExclude=sc.monetaryExclude||[];
  const allCaps=new Set((STANDARDS.abbreviations||{}).allCapsAllowed||[]);
  const verbs=new Set(STANDARDS.verbHints||[]);
  const isVersioned=s=>stdRe("versioned").test(String(s||""));
  if(sheet==="Schema"){
    const kind=String(row.Kind||"").trim();
    const name=String(row.TypeName||"").trim();
    const def=row.Definition||"";
    if(name){
      if(kind==="Scalar"){
        if(discouraged[name]) mkViol(out,"SCALAR-PREFER-DATETIMEISO","TypeName",'"'+name+'" ');
        else if(!standardScalars.has(name)) mkViol(out,"SCALAR-STANDARD","TypeName",'"'+name+'" ');
      } else {
        if(!stdRe("PascalCase").test(name)) mkViol(out,"NAME-TYPE-PASCAL","TypeName",'"'+name+'" ');
        else if(name===name.toUpperCase()&&name.length>1&&!allCaps.has(name)) mkViol(out,"NAME-ABBREV-CASE","TypeName",'"'+name+'" ');
        if(kind==="Input"&&!/Input$/.test(name)) mkViol(out,"NAME-INPUT-SUFFIX","TypeName",'"'+name+'" ');
        if(isVersioned(name)) mkViol(out,"ANTI-FIELD-VERSION","TypeName",'"'+name+'" ');
      }
    }
    if(kind==="Enum"){
      const vals=defBodyLines(def);
      for(const v of vals) if(!stdRe("SCREAMING_SNAKE_CASE").test(v)) mkViol(out,"NAME-ENUMVALUE-SCREAMING","Definition",'"'+v+'" ');
      if(vals.length&&!vals.includes("UNKNOWN")) mkViol(out,"ENUM-UNKNOWN-VALUE","Definition","");
    } else if(kind==="Key"||kind==="Type"||kind==="Interface"||kind==="Input"){
      const keys=keyFieldSet(def);
      for(const f of fieldDefs(def)){
        if(!stdRe("camelCase").test(f.name)) mkViol(out,"NAME-FIELD-CAMEL","Definition",'"'+f.name+'" ');
        if(isVersioned(f.name)) mkViol(out,"ANTI-FIELD-VERSION","Definition",'"'+f.name+'" ');
        if(f.base==="Boolean"&&/^(is|has|can)[A-Z]/.test(f.name)) mkViol(out,"NAME-BOOL-PREFIX","Definition",'"'+f.name+'" ');
        if(/^\[/.test(f.rawType)&&!stdRe("arrayNonNull").test(f.rawType)) mkViol(out,"NULL-ARRAY-NONNULL","Definition",'"'+f.name+": "+f.rawType+'" ');
        if(keys.has(f.name)&&!/!$/.test(f.rawType.trim())) mkViol(out,"NULL-KEY-NONNULL","Definition",'"'+f.name+": "+f.rawType+'" ');
        if(discouraged[f.base]) mkViol(out,"SCALAR-PREFER-DATETIMEISO","Definition",'"'+f.name+'" ');
        const fn=f.name.toLowerCase();
        if(monetaryScalars.has(f.base)&&monetaryHints.some(h=>fn.includes(h))&&!monetaryExclude.some(x=>fn.includes(x))) mkViol(out,"SCALAR-MONEY-NOT-DECIMAL","Definition",'"'+f.name+'" ');
      }
    }
  } else if(sheet==="Queries"||sheet==="Mutations"){
    const name=String(row.Name||"").trim();
    const isMut=sheet==="Mutations";
    if(name){
      if(!stdRe("camelCase").test(name)) mkViol(out,isMut?"NAME-MUTATION-CAMEL":"NAME-QUERY-CAMEL","Name",'"'+name+'" ');
      if(isVersioned(name)) mkViol(out,"ANTI-FIELD-VERSION","Name",'"'+name+'" ');
      if(isMut){ const lead=(name.match(/^[a-z]+/)||[""])[0]; if(lead&&!verbs.has(lead)) mkViol(out,"NAME-MUTATION-VERB","Name",'"'+name+'" '); }
    }
    const args=parseArgs(row.Parameters);
    const idLike=a=>/^ID!?$/i.test(a.type||"")||/id$/i.test(a.name||"");
    if(args.length>1&&!args.every(idLike)) mkViol(out,"OP-SINGLE-INPUT","Parameters","");
  }
  return out;
}
function worstSeverity(viols){ let w=null,r=0; for(const v of viols){ const k=SEVERITY_RANK[v.severity]||0; if(k>r){ r=k; w=v.severity; } } return w; }

/* ------------------------------ Help links ----------------------------- */
// Any element marked data-help="<anchor>" gets a small "?" icon right after it that opens
// help.html#<anchor> in a new tab. A MutationObserver decorates rows/toolbars rendered later.
function addHelpIcons(root){
  (root||document).querySelectorAll("[data-help]:not([data-help-done])").forEach(el=>{
    el.setAttribute("data-help-done", "");
    const a=document.createElement("a");
    a.className="help-ico"; a.href="help.html#"+el.getAttribute("data-help"); a.target="_blank"; a.rel="noopener";
    a.textContent="?"; a.title="Help: "+(el.getAttribute("title")||el.textContent||"").trim().replace(/\s+/g," "); a.setAttribute("aria-label", a.title);
    el.insertAdjacentElement("afterend", a);
  });
}
if(typeof document!=="undefined" && typeof MutationObserver!=="undefined"){
  document.addEventListener("DOMContentLoaded", ()=>{
    addHelpIcons(document);
    new MutationObserver(()=>addHelpIcons(document)).observe(document.body, { childList:true, subtree:true });
  });
}
