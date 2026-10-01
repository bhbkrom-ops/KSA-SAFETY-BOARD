export type ExportRow = Record<string, unknown>;

function safeName(value:string){return value.replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,120)||"export";}
function downloadBlob(content:BlobPart,type:string,filename:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=safeName(filename);a.click();URL.revokeObjectURL(url);}
function csvCell(value:unknown){if(value===null||value===undefined)return '""';const raw=typeof value==="object"?JSON.stringify(value):String(value);return `"${raw.replaceAll('"','""')}"`;}
export function exportCsv(rows:ExportRow[],filename:string){if(!rows.length)return;const keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));const csv=[keys.map(csvCell).join(","),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(","))].join("\n");downloadBlob("\uFEFF"+csv,"text/csv;charset=utf-8",filename.endsWith(".csv")?filename:`${filename}.csv`);}
export function exportJson(data:unknown,filename:string){downloadBlob(JSON.stringify(data,null,2),"application/json;charset=utf-8",filename.endsWith(".json")?filename:`${filename}.json`);}
function esc(v:unknown){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]||c));}
export function exportWord(rows:ExportRow[],title:string,filename:string){const keys=rows.length?Array.from(new Set(rows.flatMap(r=>Object.keys(r)))):[];const html=`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px;font-size:10pt}th{background:#eee}</style></head><body><h1>${esc(title)}</h1><table><thead><tr>${keys.map(k=>`<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${esc(typeof r[k]==="object"?JSON.stringify(r[k]):r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;downloadBlob("\uFEFF"+html,"application/msword;charset=utf-8",filename.endsWith(".doc")?filename:`${filename}.doc`);}
export async function copyLink(url:string){await navigator.clipboard.writeText(url);}

export function exportTableSvg(rows:ExportRow[],columns:Array<{key:string;label:string}>,title:string,filename:string){
 const rowHeight=34,headerHeight=44,titleHeight=52,colWidth=170,width=Math.max(720,columns.length*colWidth),height=titleHeight+headerHeight+Math.max(1,rows.length)*rowHeight+20;
 const escXml=(v:unknown)=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]||c));
 const textFit=(v:unknown,max=24)=>{const x=typeof v==="object"?JSON.stringify(v):String(v??"");return x.length>max?x.slice(0,max-1)+"…":x};
 let body=`<rect width="100%" height="100%" fill="white"/><text x="16" y="31" font-family="Arial" font-size="18" font-weight="700" fill="#123746">${escXml(title)}</text>`;
 columns.forEach((c,i)=>{const x=i*colWidth;body+=`<rect x="${x}" y="${titleHeight}" width="${colWidth}" height="${headerHeight}" fill="#eef3f3" stroke="#9eabad"/><text x="${x+8}" y="${titleHeight+27}" font-family="Arial" font-size="11" font-weight="700" fill="#173f50">${escXml(c.label)}</text>`;});
 (rows.length?rows:[{}]).forEach((row,r)=>columns.forEach((c,i)=>{const x=i*colWidth,y=titleHeight+headerHeight+r*rowHeight;body+=`<rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" fill="white" stroke="#b9c3c4"/><text x="${x+8}" y="${y+21}" font-family="Arial" font-size="9" fill="#111">${escXml(textFit(row[c.key]))}</text>`;}));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
 downloadBlob(svg,"image/svg+xml;charset=utf-8",filename.endsWith(".svg")?filename:`${filename}.svg`);
}
