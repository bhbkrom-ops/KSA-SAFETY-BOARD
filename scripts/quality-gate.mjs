import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const exists=p=>fs.existsSync(path.join(root,p));
const walk=dir=>{
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
};
const fail=[]; const warn=[];
const registry=read("src/lib/route-registry.ts");
const routeMatches=[...registry.matchAll(/(?:^|\n)\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+)):\s*\{\s*id:\s*"([^"]+)",\s*path:\s*"([^"]+)"[\s\S]*?permission:\s*"([^"]+)"[\s\S]*?protected:\s*(true|false)[\s\S]*?status:\s*"([^"]+)"/g)];
const routes=routeMatches.map(m=>({key:m[1]||m[2],id:m[3],path:m[4],permission:m[5],protected:m[6]==="true",status:m[7]}));
if(routes.length<20) fail.push(`route-registry parse returned only ${routes.length} routes`);
const seen=new Map();
for(const r of routes){
  if(r.key!==r.id) fail.push(`route key/id mismatch: ${r.key} != ${r.id}`);
  if(!r.path.startsWith("/")) fail.push(`invalid route path: ${r.path}`);
  if(!r.permission) fail.push(`missing permission: ${r.id}`);
  if(seen.has(r.path)) fail.push(`duplicate route path: ${r.path} (${seen.get(r.path)}, ${r.id})`); else seen.set(r.path,r.id);
}
function routeCovered(routePath){
  if(routePath==="/") return exists("src/app/page.tsx");
  const seg=routePath.split("/").filter(Boolean);
  const exact=`src/app/${seg.join("/")}/page.tsx`;
  if(exists(exact)) return true;
  if(seg[0]==="admin"&&seg.length===2&&exists("src/app/admin/[module]/page.tsx")) return true;
  if(seg[0]==="admin"&&seg.length===3&&exists(`src/app/admin/${seg[1]}/[view]/page.tsx`)) return true;
  return false;
}
for(const r of routes.filter(r=>r.status==="active")){
  if(!routeCovered(r.path)) fail.push(`active route has no renderer: ${r.id} -> ${r.path}`);
  if(r.protected&&!r.path.startsWith("/admin/")) fail.push(`protected route outside /admin: ${r.id} -> ${r.path}`);
  if(!r.protected&&r.path.startsWith("/admin/")) fail.push(`public route inside /admin: ${r.id} -> ${r.path}`);
}
for(const required of [
  "src/app/admin/print/[template]/[id]/page.tsx",
  "src/app/ncr/[id]/page.tsx",
  "src/app/report/[id]/page.tsx",
  "src/app/report/page.tsx"
]) if(!exists(required)) fail.push(`missing canonical route: ${required}`);

const sourceFiles=walk("src").filter(p=>/\.(ts|tsx|js|jsx|css)$/.test(p));
for(const file of sourceFiles){
  const body=read(file);
  if(/<iframe\b/i.test(body)) fail.push(`iframe found in source: ${file}`);
  if(/window\.print\s*\(/.test(body)&&!file.includes("components/print/")) warn.push(`direct window.print outside print engine: ${file}`);
  if(/localStorage\./.test(body)) warn.push(`localStorage use requires explicit offline-only justification: ${file}`);
  if(/ABDULKAREM\s+SAFETY\s+BOARD/i.test(body)) fail.push(`legacy hardcoded board branding in source: ${file}`);
  if(/data:image\/[a-z+]+;base64,/i.test(body)) fail.push(`Base64 image asset embedded in source: ${file}`);
}
const printCss=read("src/app/globals.css");
for(const token of [".controlled-document","background:#fff","@media print"]){
  if(!printCss.includes(token)) fail.push(`print CSS missing required invariant: ${token}`);
}
const printApi=read("src/app/api/print-record/route.ts");
if(!/requireAuth\(/.test(printApi)) fail.push("print-record API is not authenticated");
if(!/system_settings/.test(printApi)||!/branding/.test(printApi)) fail.push("print-record API does not load centralized branding");
const traceApi=exists("src/app/api/traceability/route.ts")?read("src/app/api/traceability/route.ts"):"";
if(!traceApi) fail.push("traceability API missing after Section 13");
if(traceApi&&!/requireAuth\(/.test(traceApi)) fail.push("traceability API is not authenticated");
if(traceApi&&/from\(\s*body\./.test(traceApi)) fail.push("traceability API appears to accept client-supplied table names");

console.log(`Quality gate: ${routes.length} registry routes, ${sourceFiles.length} source files scanned.`);
for(const w of warn) console.warn("WARN:",w);
if(fail.length){
  for(const f of fail) console.error("FAIL:",f);
  process.exit(1);
}
console.log("Quality gate PASS");
