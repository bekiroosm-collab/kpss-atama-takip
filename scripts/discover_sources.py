"""Merge institution directory entries from e-Devlet; preserve entries when a directory is unavailable."""
import concurrent.futures
from html import unescape
import json
from pathlib import Path
import re
from urllib.parse import quote, urljoin
from urllib.request import urlopen, Request

BASE = "https://www.turkiye.gov.tr"
OUT = Path("public/p94/directory.json")
def fetch(path):
    with urlopen(Request(BASE + quote(path, safe='/?=&%'),headers={'User-Agent':'P94 public directory monitor/1.0'}),timeout=14) as response:
        return response.read().decode('utf-8', errors='replace')
def entries(page, group):
    if group == "Belediye":
        pairs = re.findall(r'<a\s+[^>]*href="(/[^"#?]+)"[^>]*>\s*<div[^>]*>\s*<img[^>]*>\s*<h3>([^<]+)</h3>',page,re.S)
    else:
        pairs = re.findall(r'<h3>\s*<a href="(/[^"#?]+)"[^>]*>([^<]+)</a>',page)
    return {path: [unescape(name.strip()),group] for path,name in pairs}
def add_municipal_sites(page,records):
    links=re.findall(r'<a[^>]+href="(https?://[^"]+)"[^>]+class="list-group-item[^"]*"[^>]*>([^<]+)</a>',page)
    for url,name in links:
        if re.match(r'https?://[a-zA-Z0-9.-]+\.bel\.tr(?:/|$)',url):
            records[url.rstrip('/')]=[unescape(name.strip()),'Belediye']
    return len(links)

def main():
    existing=json.loads(OUT.read_text()) if OUT.exists() else {}
    records=existing.get("institutions",{})
    failed=[]
    pages=[]
    for path,group in [('/kurumlar','Merkezî kurum'),('/belediyeler','Belediye'),('/universite-hizmet-listesi','Üniversite')]:
        try:
            page=fetch(path)
            if group=='Üniversite':
                items=entries(page,group)
                if not items: raise ValueError('empty')
                records.update(items)
            else:
                pattern=r'href="(/kurumlar\?kurumHarf=[^"]+)"' if group=='Merkezî kurum' else r'value="(/[^"]+-belediyeleri)"'
                children=sorted(set(re.findall(pattern,page)))
                if not children: raise ValueError('empty')
                pages.extend((child,group) for child in children)
        except (OSError,ValueError): failed.append(path)
    def collect(job):
        path,group=job
        try:
            rows=entries(fetch(path),group)
            return path,rows
        except (OSError,ValueError): return path,{}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for path,rows in pool.map(collect,pages):
            if rows: records.update(rows)
            else: failed.append(path)
    tbb='https://www.tbb.gov.tr/tr/buyuksehir-ve-il-belediyeleri'
    try:
        with urlopen(Request(tbb,headers={'User-Agent':'AtamaTakip/1.0'}),timeout=15) as response:
            if not add_municipal_sites(response.read().decode(),records): raise ValueError('empty')
    except (OSError,ValueError): failed.append(tbb)
    if not records: raise SystemExit("No institution directory available")
    OUT.write_text(json.dumps(dict(institutions=dict(sorted(records.items())),incomplete=sorted(failed)),ensure_ascii=False,separators=(',',':'))+'\n')
    print(len(records),'institutions;',len(failed),'incomplete directory pages',flush=True)
if __name__=='__main__':main()
