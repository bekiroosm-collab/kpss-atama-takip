import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
export async function POST(req:Request){
  const db=getSupabase();
  if(!db)return NextResponse.json({error:"database_not_configured"},{status:503});
  const subscription=await req.json();
  if(!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
    return NextResponse.json({error:"invalid_subscription"},{status:400});
  const {error}=await db.from("push_subscriptions").upsert({endpoint:subscription.endpoint,subscription},{onConflict:"endpoint"});
  if(error)return NextResponse.json({error:"save_failed"},{status:500});
  return NextResponse.json({ok:true});
}