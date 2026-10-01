import { NextRequest } from "next/server";

function unauthorized(){return Response.json({ok:false,error:"Unauthorized cron request."},{status:401});}

export async function GET(request:NextRequest){
  const cronSecret=process.env.CRON_SECRET;
  const authHeader=request.headers.get("authorization");
  if(!cronSecret||authHeader!==`Bearer ${cronSecret}`)return unauthorized();

  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl||!serviceKey)return Response.json({ok:false,error:"Monthly HSE cron backend is not configured."},{status:503});

  const now=new Date();
  const currentMonth=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
  const previousMonth=new Date(Date.UTC(currentMonth.getUTCFullYear(),currentMonth.getUTCMonth()-1,1));
  const monthStart=previousMonth.toISOString().slice(0,10);

  const response=await fetch(`${supabaseUrl}/rest/v1/rpc/generate_monthly_hse_snapshot`,{
    method:"POST",
    headers:{
      apikey:serviceKey,
      Authorization:`Bearer ${serviceKey}`,
      "Content-Type":"application/json",
      Prefer:"return=representation",
    },
    body:JSON.stringify({p_month_start:monthStart,p_site_id:null}),
    cache:"no-store",
  });
  const raw=await response.text();
  let data:unknown=raw;
  try{data=JSON.parse(raw)}catch{}
  if(!response.ok)return Response.json({ok:false,error:"Monthly HSE snapshot generation failed.",detail:data},{status:500});
  return Response.json({ok:true,data,month_start:monthStart,generated_at:new Date().toISOString()});
}
