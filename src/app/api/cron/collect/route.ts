import { NextResponse } from "next/server";
export const maxDuration = 60;
export async function GET(req:Request) {
  const auth=req.headers.get("authorization");
  if(!process.env.CRON_SECRET || auth!==`Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({error:"unauthorized"},{status:401});
  // Deliberately fail closed: no fabricated notices are inserted.
  // Implement and verify each official-source adapter before enabling automated ingestion.
  return NextResponse.json({
    ok:false,
    message:"Source adapters are not enabled yet. Configure and test each official source adapter before production collection.",
    sources:["iskur","kariyer_kapisi","resmi_gazete","kamu_ilanlari"]
  },{status:503});
}