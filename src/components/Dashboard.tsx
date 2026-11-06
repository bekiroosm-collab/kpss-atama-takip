"use client";
import { useEffect, useMemo, useState } from "react";
import { Bell, Bookmark, BriefcaseBusiness, Building2, ChevronDown, CircleHelp, Clock3, FileSearch, Filter, Home, Keyboard, MapPin, Menu, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Smartphone, X, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import type { Notice, Source } from "@/lib/types";

const sources: Source[] = ["İŞKUR","Kariyer Kapısı","Resmî Gazete","Kamu İlanları"];
const nav = [
  {label:"Genel Bakış",icon:Home,key:"all"},
  {label:"Tüm İlanlar",icon:FileSearch,key:"all"},
  {label:"Katiplik İlanları",icon:Keyboard,key:"katip"},
  {label:"Çankırı İlanları",icon:MapPin,key:"cankiri"},
  {label:"Kaydedilenler",icon:Bookmark,key:"saved"}
];
function date(v?:string|null){ if(!v)return "Belirtilmemiş"; const d=new Date(v); return isNaN(+d)?"Belirtilmemiş":d.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}); }
export default function Dashboard(){
 const [items,setItems]=useState<Notice[]>([]);
 const [loading,setLoading]=useState(true);
 const [active,setActive]=useState("all");
 const [source,setSource]=useState("Tümü");
 const [query,setQuery]=useState("");
 const [saved,setSaved]=useState<string[]>([]);
 const [mobileOpen,setMobileOpen]=useState(false);
 const [push,setPush]=useState<"idle"|"enabled"|"unsupported">("idle");
 const [lastSync,setLastSync]=useState<string|null>(null);
 useEffect(()=>{ try{setSaved(JSON.parse(localStorage.getItem("atama-saved")||"[]"));}catch{}; load(); },[]);
 async function load(){setLoading(true);try{const r=await fetch("/api/notices",{cache:"no-store"});const j=await r.json();setItems(j.notices||[]);setLastSync(j.lastSync||null);}catch{}finally{setLoading(false);}}
 function toggleSave(id:string){const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];setSaved(next);localStorage.setItem("atama-saved",JSON.stringify(next));}
 async function enablePush(){
   if(!("serviceWorker" in navigator)||!("PushManager" in window)){setPush("unsupported");return;}
   try{const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!key){alert("Bildirim için VAPID anahtarları henüz yapılandırılmamış. Kurulum rehberindeki adımları tamamlayın.");return;}
    const permission=await Notification.requestPermission();if(permission!=="granted")return;
    const reg=await navigator.serviceWorker.register("/sw.js");
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(atob(key.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0))});
    await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub)});
    setPush("enabled");
   }catch{alert("Bildirim kurulamadı. Vercel ortam değişkenlerini kontrol edin.");}
 }
 const filtered=useMemo(()=>items.filter(n=>{
   const hay=[n.title,n.institution,n.position,n.city,n.summary].filter(Boolean).join(" ").toLocaleLowerCase("tr");
   const matches=hay.includes(query.toLocaleLowerCase("tr"));
   const category=active==="katip"?/katip|zabıt|zabit|klavye/i.test(hay):active==="cankiri"?/çankırı|cankiri/i.test(hay):active==="saved"?saved.includes(n.id):true;
   return matches&&category&&(source==="Tümü"||n.source===source);
 }),[items,query,active,source,saved]);
 const stats=[{label:"Toplam İlan",value:items.length,icon:FileSearch},{label:"Katiplik",value:items.filter(n=>/katip|zabıt|zabit|klavye/i.test([n.title,n.position,n.summary].join(" "))).length,icon:Keyboard},{label:"Çankırı",value:items.filter(n=>/çankırı|cankiri/i.test([n.title,n.city,n.institution].join(" "))).length,icon:MapPin},{label:"Kaydedilen",value:saved.length,icon:Bookmark}];
 return <div className="app-shell">
  <aside className={`sidebar ${mobileOpen?"open":""}`}>
   <div className="brand"><div className="brand-mark"><Building2 size={21}/></div><div><b>atama<span>takip</span></b><small>KPSS ORTAÖĞRETİM</small></div><button className="close-nav" onClick={()=>setMobileOpen(false)}><X size={19}/></button></div>
   <div className="nav-label">MENÜ</div>
   <nav>{nav.map((n,i)=><button key={n.label} onClick={()=>{setActive(n.key);setMobileOpen(false)}} className={`nav-item ${active===n.key&&(active!=="all"||i===0)? "active":""}`}><n.icon size={18}/><span>{n.label}</span>{n.key==="katip"&&<i className="nav-dot"/>}</button>)}</nav>
   <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Yardım mı lazım?</b><p>İlan takibi ve bildirim kurulumu hakkında.</p><a href="https://kariyerkapisi.gov.tr/" target="_blank">Resmî kaynakları gör <ArrowUpRight size={13}/></a></div><div className="side-foot"><ShieldCheck size={15}/> Resmî kaynak odaklı takip</div></div>
  </aside>
  {mobileOpen&&<div className="scrim" onClick={()=>setMobileOpen(false)}/>}
  <main className="main">
   <header className="topbar"><button className="menu-btn" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Atama Takip <span>/</span> <b>{nav.find(n=>n.key===active)?.label||"Tüm İlanlar"}</b></div><div className="top-actions"><span className="secure"><span/> Sistem hazır</span><button className="icon-btn" onClick={enablePush} title="Bildirimleri aç"><Bell size={18}/></button><div className="avatar">K</div></div></header>
   <div className="content">
    <section className="welcome"><div><div className="eyebrow"><span className="eyebrow-line"/> KAMU PERSONEL ALIM TAKİBİ</div><h1>Geleceğin için<br/><em>fırsatları kaçırma.</em></h1><p>Dört resmî kaynaktaki kamu alımlarını tek ekrandan takip et.</p></div><div className="welcome-art"><div className="art-circle"><Building2 size={54}/></div><div className="art-float"><CheckCircle2 size={16}/> Tek merkezden takip</div></div></section>
    <section className="source-row"><div><span className="section-kicker">TAKİP EDİLEN KAYNAKLAR</span><p>İlanların yayımlandığı resmî platformlar</p></div><div className="source-pills">{sources.map((s,i)=><span className="source-pill" key={s}><i className={`source-dot d${i}`}/>{s}</span>)}</div></section>
    <section className="stats">{stats.map((s,i)=><div className="stat-card" key={s.label}><div className={`stat-icon si${i}`}><s.icon size={19}/></div><div><small>{s.label}</small><strong>{s.value}</strong></div><span className="stat-caption">{i===0?"Kayıtlı":i===1?"Özel takip":i===2?"Şehir filtresi":"Listen"}</span></div>)}</section>
    <section className="section-head"><div><span className="section-kicker">İLAN MERKEZİ</span><h2>{active==="katip"?"Katiplik ilanları":active==="cankiri"?"Çankırı ilanları":active==="saved"?"Kaydedilen ilanlar":"Son yayımlanan ilanlar"}</h2><p>Başvuru şartlarını incele, tarihleri kaçırma.</p></div><button className="refresh-btn" onClick={load}><RefreshCw size={15}/> Yenile</button></section>
    <section className="filterbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kurum, kadro veya şehir ara..."/></div><div className="select-wrap"><Filter size={15}/><select value={source} onChange={e=>setSource(e.target.value)}><option>Tümü</option>{sources.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={14}/></div><button className="filter-btn"><SlidersHorizontal size={16}/> Filtreler</button></section>
    {loading?<div className="empty-state"><div className="loader"/><b>İlanlar yükleniyor</b><p>Kaynak bağlantıları kontrol ediliyor.</p></div>:filtered.length===0?<div className="empty-state"><div className="empty-icon"><FileSearch size={25}/></div><b>{items.length===0?"Henüz canlı ilan bağlantısı kurulmadı":"Bu filtreye uygun ilan bulunamadı."}</b><p>{items.length===0?"Veritabanı ve resmî kaynak toplayıcıları yapılandırıldığında ilanlar burada otomatik listelenecek.": "Arama veya filtrelerini değiştirebilirsin."}</p><button className="text-btn" onClick={load}>Tekrar kontrol et <ArrowUpRight size={14}/></button></div>:<div className="notice-list">{filtered.map(n=><article className="notice-card" key={n.id}><div className="notice-top"><span className="notice-source">{n.source}</span><span className="notice-date"><Clock3 size={13}/>{date(n.published_at)}</span></div><h3>{n.title}</h3><p className="institution">{n.institution}</p><div className="notice-meta">{n.city&&<span><MapPin size={13}/>{n.city}</span>}{n.position&&<span><BriefcaseBusiness size={13}/>{n.position}</span>}{n.quota&&<span>{n.quota} kontenjan</span>}</div><div className="notice-bottom"><span>Son başvuru: <b>{date(n.application_end)}</b></span><div><button className={`save-btn ${saved.includes(n.id)?"saved":""}`} onClick={()=>toggleSave(n.id)}><Bookmark size={15}/></button><a href={n.url} target="_blank" rel="noreferrer" className="detail-btn">İlanı incele <ArrowUpRight size={14}/></a></div></div></article>)}</div>}
    <section className="notification-banner"><div className="notif-symbol"><Smartphone size={22}/></div><div><b>Yeni ilanlardan anında haberdar ol</b><p>Telefon bildirimlerini aç, fırsatları kaçırma.</p></div><button onClick={enablePush}>{push==="enabled"?"Bildirimler açık":"Bildirimleri aç"} <Bell size={15}/></button></section>
    <section className="source-status"><div><span className="section-kicker">KAYNAK DURUMU</span><h3>Takip edilen platformlar</h3></div><div className="status-list">{sources.map(s=><div key={s}><span className="status-indicator pending"/><b>{s}</b><small>Bağlantı yapılandırması bekleniyor</small></div>)}</div><p className="sync-note">{lastSync?`Son kontrol: ${new Date(lastSync).toLocaleString("tr-TR")}`:"İlk kaynak kontrolü henüz yapılmadı."}</p></section>
    <footer><span>© 2026 Atama Takip</span><span>Bağımsız takip platformudur · Resmî kurum değildir.</span></footer>
   </div>
  </main>
 </div>
}