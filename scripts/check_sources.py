"""Discover potential recruitment notices. A link is a lead, never proof of P94 eligibility."""
from kariyer import read_list
from http.client import HTTPException
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit, urldefrag, quote
from urllib.request import Request, urlopen

OUT=Path('public/p94/monitor.json')
AGENT='AtamaTakip/1.0 (public recruitment announcements)'
JOB=re.compile(r'personel.{0,45}(alım|alim|temin|istihdam)|sözleşmeli|sozlesmeli|memur.{0,35}(alım|alim)|ilk defa atan|k[âa]ti[bp]|ortaöğretim|p\s*94|işçi alım|işçi temin|tercih kılavuzu|zabıta|itfaiye eri|giriş sınavı',re.I)
LIST=re.compile(r'duyuru|ilanlar|ilanları|personel daire|personel genel',re.I)
def eligible(url):
    p=urlsplit(url)
    return p.scheme in ('http','https') and (p.hostname or '').endswith(('.gov.tr','.bel.tr','.edu.tr'))
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.href=''; self.words=[]; self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a':
            self.href=a.get('href') or ''; self.words=[a.get('title') or '']
        if tag=='img' and self.href:self.words.append(a.get('alt') or '')
    def handle_data(self,data):
        if self.href:self.words.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href:
            self.links.append((self.href,' '.join(' '.join(self.words).split())))
            self.href=''
def html(url):
    with urlopen(Request(quote(url,safe=":/?&=%+;@,~"),headers={'User-Agent':AGENT}),timeout=7) as r:
        body=r.read(3_000_001)
        if not eligible(r.url) or len(body)>3_000_000:raise ValueError('page unavailable')
        return r.url,body.decode(r.headers.get_content_charset() or 'utf-8',errors='replace')
def inspect(job):
    path,old=job
    state=dict(old)
    state['attempt']=datetime.now(timezone.utc).isoformat(timespec='seconds')
    found={}
    try:
        url=old.get('site') or (path if eligible(path) else None)
        if not url:
            _,profile=html('https://www.turkiye.gov.tr'+path)
            m=re.search(r'Web Sayfası\s*<a[^>]*href="([^"]+)"',profile,re.I)
            if not m or not eligible(m[1]):raise ValueError('official URL missing')
            url=state['site']=unescape(m[1])
        state['site']=url
        base,body=html(url)
        def extract(base,body):
            parser=Links();parser.feed(body); pages=[]
            for href,title in parser.links:
                try: target=urldefrag(urljoin(base,href))[0]
                except ValueError: continue
                if not eligible(target) or target==base or not title:continue
                if JOB.search(title):found[target]=title[:350]
                if LIST.search(title) and not JOB.search(title) and target not in pages:pages.append(target)
            return pages
        listing=extract(base,body)
        scanned=[]
        for target in listing[:3]:
            try:
                dest,content=html(target)
                extract(dest,content);scanned.append(target)
            except (ValueError,OSError,HTTPException,LookupError):pass
        state['pages']=scanned
        state['status']='links_read' if scanned and len(scanned)==len(listing[:3]) else 'needs_review'
        if scanned:state['readAt']=state['attempt']
    except (OSError,ValueError,HTTPException,LookupError):state['status']='retry'
    return path,state,found
def main():
    args=argparse.ArgumentParser();args.add_argument('--limit',type=int,default=112);opts=args.parse_args()
    directory=json.loads(Path('public/p94/directory.json').read_text())['institutions']
    data=json.loads(OUT.read_text()) if OUT.exists() else {'sources':{},'candidates':{}}
    states=data['sources']
    portals=data.setdefault('portals',{})
    check={'attempt':datetime.now(timezone.utc).isoformat(timespec='seconds')}
    try:
        leads=read_list()
        check.update(status='read',count=len(leads))
        for url,lead in leads.items():
            if eligible(url):
                data['candidates'].setdefault(url,lead)
    except (ValueError,OSError,HTTPException,KeyError,TypeError):
        check['status']='retry'
    portals['Kariyer Kapısı']=check
    def order(p):
        priority=0 if re.search('çankırı|samsun|orman genel|nüfus ve|adalet bakan',directory[p][0],re.I) else 1
        return (states.get(p,{}).get('attempt',''),priority,p)
    batch=sorted(directory,key=order)[:opts.limit]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for path,state,found in pool.map(inspect,[(p,states.get(p,{})) for p in batch]):
            states[path]=state
            for target,title in found.items():
                data['candidates'].setdefault(target,{'title':title,'source':path,'seen':state['attempt']})
    data['updatedAt']=datetime.now(timezone.utc).isoformat(timespec='seconds')
    OUT.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    print('Attempted:',len(batch),'Candidate links:',len(data['candidates']),flush=True)
if __name__=='__main__':main()
