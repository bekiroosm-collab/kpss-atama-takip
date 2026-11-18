import {activeFeed,keys,pushDatabase,send} from "@/lib/site-push";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(req:Request) {
  if(!process.env.CRON_SECRET || req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)
    return new Response(null,{status:401});
  try {
    const notices=await activeFeed();
    let sent=0,failed=0,cursor=0;
    if (!notices.length) return Response.json({sent,failed});
    const db=pushDatabase(),pair=await keys();
    while(true) {
      const {data,error}=await db.from("push_subscriptions").select("id,subscription,baseline").gt("id",cursor).order("id").limit(100);
      if(error) throw error;
      if(!data.length) break;
      for(const row of data) {
        cursor=row.id;
        for(const n of notices) {
          if(row.baseline.includes(n.id)) continue;
          const lock=await db.rpc("claim_p94_delivery",{sid:row.id,nid:n.id});
          if(lock.error) throw lock.error;
          if(!lock.data) continue;
          try {
            await send(row.subscription,{title:n.title,body:[n.institution,n.city,"P94 alım ilanı"].filter(Boolean).join(" · "),tag:"p94-"+n.id},pair);
          } catch(e) {
            const status=(e as {statusCode?:number}).statusCode;
            if(status===410 || status===404) {
              const removed=await db.from("push_subscriptions").delete().eq("id",row.id);
              if(removed.error) throw removed.error;
              break;
            }
            failed++; continue;
          }
          const marked=await db.from("push_deliveries").update({sent_at:new Date().toISOString()}).eq("subscription_id",row.id).eq("notice_id",n.id);
          if(marked.error) throw marked.error;
          sent++;
        }
      }
    }
    return Response.json({sent,failed},{status:failed?503:200});
  } catch { return Response.json({error:"dispatch_failed"},{status:503}); }
}
