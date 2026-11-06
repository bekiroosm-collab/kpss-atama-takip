import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  const db = getSupabase();
  if (!db) return NextResponse.json({notices:[],lastSync:null,configured:false});
  const {data,error}=await db.from("notices").select("*").order("published_at",{ascending:false}).limit(200);
  if(error) return NextResponse.json({notices:[],lastSync:null,error:"database_unavailable"},{status:200});
  const {data:sync}=await db.from("source_runs").select("finished_at").order("finished_at",{ascending:false}).limit(1).maybeSingle();
  return NextResponse.json({notices:data||[],lastSync:sync?.finished_at||null,configured:true});
}