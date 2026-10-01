import PrintRecordPreview from "@/components/print/print-record-preview";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PrintRecordPreview template="sor" id={id}/>;}
