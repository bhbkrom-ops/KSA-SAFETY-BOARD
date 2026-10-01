import { serviceClient } from "@/lib/auth-security";

export async function GET(){
  const fallback={board_name:"KSA SAFETY BOARD",company_name:"",logo_url:"",background_url:""};
  try{
    const db=serviceClient();
    const {data}=await db.from("system_settings").select("value").eq("key","branding").maybeSingle();
    const value=data?.value&&typeof data.value==="object"?data.value as Record<string,unknown>:{};
    const clean=(v:unknown)=>typeof v==="string"&&!v.startsWith("data:")?v.slice(0,500):"";
    return Response.json({ok:true,data:{
      board_name:clean(value.board_name)||fallback.board_name,
      company_name:clean(value.company_name),
      logo_url:clean(value.logo_url),
      background_url:clean(value.background_url)
    }},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});
  }catch{return Response.json({ok:true,data:fallback});}
}
