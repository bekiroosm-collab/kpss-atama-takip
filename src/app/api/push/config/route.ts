import { keys } from "@/lib/site-push";
export const dynamic="force-dynamic";
export async function GET() {
  try { return Response.json({publicKey:(await keys()).publicKey},{headers:{"Cache-Control":"no-store"}}); }
  catch { return Response.json({error:"push_not_configured"},{status:503}); }
}
