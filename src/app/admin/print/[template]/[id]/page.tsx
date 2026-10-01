import PrintRecordPreview from "@/components/print/print-record-preview";
export default async function Page({params}:{params:Promise<{template:string;id:string}>}){const {template,id}=await params;return <PrintRecordPreview template={template} id={id}/>;}
