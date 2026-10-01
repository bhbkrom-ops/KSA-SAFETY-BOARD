import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const exists=(p)=>fs.existsSync(path.join(root,p));
const walk=(dir)=>{
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs,{withFileTypes:true}).flatMap((e)=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
};
const manifest=JSON.parse(read("config/route-audit-manifest.json"));
const inventory=JSON.parse(read("docs/audits/production-table-inventory.json"));
const registry=read("src/lib/route-registry.ts");
const modulePage=read("src/app/admin/[module]/page.tsx");
const sourceFiles=walk("src").filter((p)=>/\.(ts|tsx|js|jsx)$/.test(p));
const docsFiles=walk("docs").filter((p)=>/\.(md|json)$/.test(p)&&!p.endsWith("production-table-inventory.json"));
const migrationFiles=walk("supabase/migrations").filter((p)=>p.endsWith(".sql"));
const outputDir=path.join(root,"docs/audits/generated");
fs.mkdirSync(outputDir,{recursive:true});

const routeMatches=[...registry.matchAll(/(?:^|\n)\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+)):\s*\{\s*id:\s*"([^"]+)",\s*path:\s*"([^"]+)"[\s\S]*?permission:\s*"([^"]+)"[\s\S]*?protected:\s*(true|false)[\s\S]*?status:\s*"([^"]+)"/g)];
const routes=routeMatches.map((m)=>({key:m[1]||m[2],id:m[3],path:m[4],permission:m[5],protected:m[6]==="true",status:m[7]}));

const navBlock=(registry.split("export const navigationGroups =")[1]||"").split("] as const")[0]||"";
const navIds=new Set();
for(const m of navBlock.matchAll(/routeRegistry(?:\.([A-Za-z0-9_-]+)|\["([^"]+)"\])/g)) navIds.add(m[1]||m[2]);

const moduleViewIds=new Set();
for(const m of modulePage.matchAll(/new Set<[^>]+>\(\[([^\]]*)\]\)/g)){
  for(const q of m[1].matchAll(/"([^"]+)"/g)) moduleViewIds.add(q[1]);
}
const decisions=new Map((manifest.visibilityDecisions||[]).map((x)=>[x.path,x]));

function routeCovered(routePath){
  if(routePath==="/")return exists("src/app/page.tsx");
  const seg=routePath.split("/").filter(Boolean);
  const exact="src/app/"+seg.join("/")+"/page.tsx";
  if(exists(exact))return true;
  if(seg[0]==="admin"&&seg.length===2&&exists("src/app/admin/[module]/page.tsx"))return true;
  if(seg[0]==="admin"&&seg.length===3&&seg[1]==="vision"&&exists("src/app/admin/vision/[view]/page.tsx"))return true;
  if(seg[0]==="admin"&&seg.length===3&&seg[1]==="reports-documents"&&exists("src/app/admin/reports-documents/[view]/page.tsx"))return true;
  if(seg[0]==="admin"&&seg.length===3&&seg[1]==="escalations"&&exists("src/app/admin/escalations/[view]/page.tsx"))return true;
  return false;
}

const report={
  generated_at:new Date().toISOString(),
  summary:{},
  checks:{
    routes_without_visibility_decision:[],
    sidebar_href_without_route:[],
    lazy_import_without_route:[],
    source_page_not_imported:[],
    api_route_without_caller:[],
    resource_table_missing_in_production:[],
    production_table_without_owner:[],
    migration_table_absent_from_docs:[]
  },
  classifications:[]
};

for(const route of routes.filter((r)=>r.status==="active")){
  let classification="unclassified";
  if(navIds.has(route.id)) classification="primary";
  else if(moduleViewIds.has(route.id)) classification="hidden-subnavigation";
  else if(decisions.has(route.path)) classification=decisions.get(route.path).classification;
  else if(route.id==="vision") classification="primary";
  report.classifications.push({path:route.path,id:route.id,classification});
  if(classification==="unclassified") report.checks.routes_without_visibility_decision.push({id:route.id,path:route.path});
}
for(const d of manifest.visibilityDecisions||[]){
  if(!report.classifications.some((x)=>x.path===d.path)) report.classifications.push({path:d.path,classification:d.classification,canonical:d.canonical||null,owner:d.owner||null});
}

for(const id of navIds){
  const route=routes.find((r)=>r.id===id);
  if(!route) report.checks.sidebar_href_without_route.push({id,reason:"navigationGroups references missing routeRegistry entry"});
  else if(!routeCovered(route.path)) report.checks.sidebar_href_without_route.push({id,path:route.path,reason:"registered sidebar route has no App Router renderer"});
}

for(const file of sourceFiles){
  const body=read(file);
  for(const m of body.matchAll(/(?:dynamic\s*\(\s*\(\)\s*=>\s*)?import\(["']([^"']+)["']\)/g)){
    const imported=m[1];
    if(!file.includes("/app/")&&!sourceFiles.some((p)=>read(p).includes(imported))) report.checks.lazy_import_without_route.push({file,imported});
  }
}
for(const file of sourceFiles.filter((p)=>p.startsWith("src/pages/")&&/\.(tsx|jsx)$/.test(p))){
  const rel="@/"+file.replace(/^src\//,"").replace(/\.(tsx|jsx)$/,"");
  const basename=path.basename(file).replace(/\.(tsx|jsx)$/,"");
  const imported=sourceFiles.some((p)=>p!==file&&(read(p).includes(rel)||read(p).includes(basename)));
  if(!imported) report.checks.source_page_not_imported.push({file});
}

const apiFiles=sourceFiles.filter((p)=>p.startsWith("src/app/api/")&&p.endsWith("/route.ts"));
const apiIntentional=new Set(manifest.apiIntentionalNoDirectUiCaller||[]);
for(const file of apiFiles){
  const endpoint="/"+file.replace(/^src\/app\//,"").replace(/\/route\.ts$/,"").replace(/\[([^\]]+)\]/g,":$1");
  if(apiIntentional.has(endpoint))continue;
  const literal=endpoint.replace(/:\w+/g,"");
  const callers=sourceFiles.filter((p)=>p!==file&&read(p).includes(literal));
  if(callers.length===0) report.checks.api_route_without_caller.push({endpoint,file});
}

const usedTables=new Map();
for(const file of sourceFiles){
  const body=read(file);
  for(const m of body.matchAll(/\.from\(\s*["']([A-Za-z0-9_]+)["']\s*\)/g)){
    const table=m[1];
    if(!usedTables.has(table))usedTables.set(table,[]);
    usedTables.get(table).push(file);
  }
}
const productionTables=new Set(inventory.tables||[]);
for(const [table,files] of usedTables){
  if(!productionTables.has(table)) report.checks.resource_table_missing_in_production.push({table,files:[...new Set(files)]});
}
for(const legacy of manifest.legacyResources||[]){
  if(legacy.policy==="forbidden"){
    const references=sourceFiles.filter((p)=>read(p).includes(legacy.name));
    if(references.length) report.checks.resource_table_missing_in_production.push({table:legacy.name,files:references,reason:"forbidden legacy resource; use "+legacy.replacement});
  }
  if(legacy.policy==="must-not-reintroduce"&&exists(legacy.name)){
    report.checks.source_page_not_imported.push({file:legacy.name,reason:"forbidden orphan source page; use "+legacy.replacement});
  }
}

const ownerRules=(manifest.tableOwnerRules||[]).map((x)=>({...x,re:new RegExp(x.pattern)}));
const explicit=manifest.tableOwnerExplicit||{};
for(const table of inventory.tables||[]){
  const owner=explicit[table]||ownerRules.find((x)=>x.re.test(table))?.owner||null;
  if(!owner)report.checks.production_table_without_owner.push({table});
}

const docsCorpus=docsFiles.map((p)=>read(p)).join("\n");
const migrationTables=new Set();
for(const file of migrationFiles){
  const body=read(file);
  for(const m of body.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?([A-Za-z0-9_]+)["']?/gi))migrationTables.add(m[1]);
}
for(const table of [...migrationTables].sort()){
  if(!docsCorpus.includes(table)) report.checks.migration_table_absent_from_docs.push({table});
}

const counts=Object.fromEntries(Object.entries(report.checks).map(([k,v])=>[k,v.length]));
report.summary={
  registry_routes:routes.length,
  primary_sidebar_routes:navIds.size,
  subnavigation_routes:moduleViewIds.size,
  production_tables:(inventory.tables||[]).length,
  source_tables_referenced:usedTables.size,
  ...counts
};

const md=[
  "# Section 16 — Route / Legacy / Resource Audit",
  "",
  "Generated by `npm run audit:routes`.",
  "",
  "## Summary",
  "",
  ...Object.entries(report.summary).map(([k,v])=>"- **"+k+"**: "+v),
  "",
  ...Object.entries(report.checks).flatMap(([name,items])=>[
    "## "+name.replaceAll("_"," "),
    "",
    items.length?items.map((x)=>"- `"+(x.path||x.endpoint||x.table||x.file||x.id)+"`"+(x.reason?" — "+x.reason:"")).join("\n"):"No findings.",
    ""
  ])
].join("\n");

fs.writeFileSync(path.join(outputDir,"section-16-route-audit.json"),JSON.stringify(report,null,2)+"\n");
fs.writeFileSync(path.join(outputDir,"section-16-route-audit.md"),md+"\n");

const blockers=[
  ...report.checks.routes_without_visibility_decision,
  ...report.checks.sidebar_href_without_route,
  ...report.checks.resource_table_missing_in_production
];
console.log("Section 16 audit:",JSON.stringify(report.summary));
if(blockers.length){
  console.error("Section 16 audit BLOCKED:",JSON.stringify(blockers,null,2));
  process.exit(1);
}
console.log("Section 16 route audit PASS");
