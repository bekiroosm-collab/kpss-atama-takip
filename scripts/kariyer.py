"""Read the same public, unfiltered list as the Kariyer Kapısı recruitment page."""
from datetime import datetime, timezone
import json
from urllib.parse import urljoin
from urllib.request import Request,urlopen

def read_list():
    base='https://kariyerkapisi.gov.tr/'
    payload={'krM_ID':0,'searchText':'','il':'0','ilanTuru':'0'}
    req=Request('https://api.kariyerkapisi.gov.tr/api/ilan/GetIseAlimPage',data=json.dumps(payload).encode(),
                headers={'Content-Type':'application/json','Origin':base.rstrip('/'),'Referer':base,'Accept':'application/json'})
    with urlopen(req,timeout=15) as response:
        rows=json.load(response)['searchIlan']
    if not isinstance(rows,list): raise ValueError('invalid list')
    leads={}
    for row in rows:
        url=(urljoin(base,'IlanDetay?i='+str(row['guid'])) if row.get('ilanTipi')==1 else row.get('basvuruLinki'))
        if url and row.get('ilanBaslik'):
            leads[url]=dict(title=row['ilanBaslik'],source='Kariyer Kapısı',institution=row.get('kurumAdi'),end=row.get('bitTarih'),seen=datetime.now(timezone.utc).isoformat(timespec='seconds'))
    if rows and not leads: raise ValueError('no usable rows')
    return leads
