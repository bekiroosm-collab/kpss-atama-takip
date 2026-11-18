import { activeFeed, keys, pushDatabase, send, validSubscription } from "@/lib/site-push";
export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return new Response(null,{status:403});
  const sub=await req.json().catch(()=>null);
  if (!validSubscription(sub)) return Response.json({error:"invalid_subscription"},{status:400});
  try {
    const pair=await keys();
    const db=pushDatabase();
    const baseline=(await activeFeed()).map(n=>n.id);
    const {error}=await db.from("push_subscriptions").upsert({endpoint:sub.endpoint,subscription:sub,baseline},{onConflict:"endpoint",ignoreDuplicates:true});
    if(error) throw error;
    await send(sub,{title:"Atama Takip",body:"Bildirimler açık. Yeni P94 ilanları bu uygulamadan gelecek.",tag:"p94-welcome"},pair);
    return Response.json({ok:true});
  } catch {return Response.json({error:"subscription_or_test_failed"},{status:503});}
}
