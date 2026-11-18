import webpush from "web-push";
import { getSupabase } from "./supabase";

export function pushDatabase() {
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY && getSupabase();
  if (!db) throw Error("push_database_unavailable");
  return db;
}
export async function keys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (publicKey && process.env.VAPID_PRIVATE_KEY)
    return { publicKey, privateKey: process.env.VAPID_PRIVATE_KEY };
  if (publicKey || process.env.VAPID_PRIVATE_KEY) throw Error("incomplete_vapid_keys");
  const table = pushDatabase().from("push_keypair");
  const read = () => table.select("public_key,private_key").eq("id", true).maybeSingle();
  let result = await read();
  if (result.error) throw result.error;
  if (!result.data) {
    const generated = webpush.generateVAPIDKeys();
    const insert = await table.insert({id:true, public_key:generated.publicKey, private_key:generated.privateKey});
    if (insert.error && insert.error.code !== "23505") throw insert.error;
    result = await read();
  }
  if (!result.data || result.error) throw Error("key_storage_failed");
  return {publicKey:String(result.data.public_key), privateKey:String(result.data.private_key)};
}
export function validSubscription(value: webpush.PushSubscription | null) {
  if (!value || typeof value.endpoint !== "string" || !value.keys) return false;
  try {
    const u = new URL(value.endpoint);
    return u.protocol === "https:" && !u.username && !u.password && !u.port &&
      /^(?:([a-z0-9-]+\.)*push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)$/.test(u.hostname) &&
      /^[\w-]{87}=?$/.test(value.keys.p256dh) && /^[\w-]{22}={0,2}$/.test(value.keys.auth);
  } catch { return false; }
}
export async function send(sub: webpush.PushSubscription, payload: object, pair:Awaited<ReturnType<typeof keys>>) {
  if (!validSubscription(sub)) throw Error("invalid_subscription");
  await webpush.sendNotification(sub,JSON.stringify(payload),{
    TTL: 86400, timeout: 6000,
    vapidDetails:{...pair,subject:process.env.VAPID_SUBJECT || "https://github.com/bekiroosm-collab/kpss-atama-takip"}
  });
}
type Notice = {id:string;title:string;institution:string;city?:string;end?:string};
export async function activeFeed(): Promise<Notice[]> {
  const response = await fetch("https://raw.githubusercontent.com/bekiroosm-collab/kpss-atama-takip/main/public/p94/feed.json",{cache:"no-store",signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error("feed_unavailable");
  const {notices} = await response.json();
  if (!Array.isArray(notices) || notices.some(n=>typeof n?.id!=="string" || typeof n?.title!=="string")) throw Error("invalid_feed");
  const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Istanbul"});
  return notices.filter(n=>!n.end || n.end>=today);
}
