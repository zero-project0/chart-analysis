"""Publication-date, duplicate, and coverage checks for source CSVs.

Known incomplete evidence is explicit in data-quality.json. It never passes
chart_is_complete; builders may retain verified partial rows with a notice.
"""
import csv,html,json,unicodedata
from collections import defaultdict
from datetime import date,timedelta
from pathlib import Path
from urllib.parse import parse_qs,urlparse

def normalize(value):
    return ' '.join(unicodedata.normalize('NFKC',str(value)).split()).casefold()

def row_key(row):
    artist=normalize(row['artist'])
    if artist=='millennium parade × ghost in the shell: sac_2045':artist='millennium parade'
    return (row['chart_date'],int(row['rank']),artist,normalize(row['title']))

def quality(root):
    p=Path(root)/'data-quality.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {'charts':{}}

def unavailable_dates(root,code):
    return {x['date'] for x in quality(root)['charts'].get(code,{}).get('unavailable_calendar_dates',[])}

def allowed_partial(root,code,day,count):
    return any(x['date']==day and x['verified_rows']==count for x in quality(root)['charts'].get(code,{}).get('partial_weeks',[]))

def validate_saved_rows(rows,year,code,root):
    recover_file=Path(root)/'verified-recoveries.json'
    recoveries=json.loads(recover_file.read_text(encoding='utf-8')) if recover_file.exists() else []
    allowed={(row_key(r),r['source_url']) for r in recoveries if r['chart_code']==code}
    seen=set();weekly=defaultdict(list)
    for row in rows:
        day=date.fromisoformat(row['chart_date'])
        if day.year!=year or row['chart_code']!=code or not row['artist'].strip() or not row['title'].strip() or not 1<=int(row['rank'])<=100:
            raise ValueError(f'Invalid source row: {code} {row}')
        k=row_key(row)
        if k in seen:raise ValueError(f'Duplicate source row: {code} {k}')
        seen.add(k);weekly[row['chart_date']].append(row)
        params=parse_qs(urlparse(row['source_url']).query)
        if all(s in params for s in ('year','month','day')):
            issue=date(*(int(params[s][0]) for s in ('year','month','day')))
            if issue!=day+timedelta(days=5) and (k,row['source_url']) not in allowed:
                raise ValueError(f'Publication/source date mismatch: {code} {day} -> {issue}')
    for day,items in weekly.items():
        if len(items)<100 and not allowed_partial(root,code,day,len(items)):
            raise ValueError(f'Unexplained incomplete chart: {code} {day}: {len(items)}')
    return weekly

def collection_from_csv(site,year,code):
    rows=site.read_year_entries(year,code)
    if rows is None:return None
    weekly=validate_saved_rows(rows,year,code,site.PROJECT_DIRECTORY)
    dates=sorted(date.fromisoformat(d) for d in weekly)
    requested=site.generate_chart_dates(year,code)
    missing=sorted(set(requested)-set(dates))
    unexplained=[d for d in missing if d.isoformat() not in unavailable_dates(site.PROJECT_DIRECTORY,code)]
    if unexplained:raise ValueError(f'Unexplained missing publication weeks: {code} {year}: {unexplained}')
    reports=[{'year':year,'requested_date':d.isoformat(),'status':'一部確認・未確認曲あり' if len(weekly[d.isoformat()])<100 else '検証済みCSV','entry_count':len(weekly[d.isoformat()]),'method':'公式チャート・出典照合済みCSV','duplicate_of':''} for d in dates]
    reports += [{'year':year,'requested_date':d.isoformat(),'status':'公式アーカイブに掲載なし・未確定','entry_count':0,'method':'公式前後リンクを確認','duplicate_of':''} for d in missing]
    return dict(year=year,chart_code=code,requested_dates=requested,dates=dates,entries=rows,failed_dates=missing,duplicate_dates=[],reports=reports)

def write_quality_assets(root,destination):
    q=quality(root);dst=Path(destination);dst.mkdir(parents=True,exist_ok=True)
    (dst/'data-quality.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8')
    notice='Download 2020/3/18は68曲を確認（TOP10は全曲）。Hot 100の年末年始7週は掲載状況未確定。'
    js='window.CHART_DATA_QUALITY='+json.dumps(q,ensure_ascii=False)+';\n'
    js+='document.addEventListener("DOMContentLoaded",()=>{if(document.getElementById("chartDataQuality"))return;const n=document.createElement("aside");n.id="chartDataQuality";n.style.cssText="max-width:1240px;margin:24px auto;padding:12px 24px;font:12px/1.7 sans-serif;color:inherit;opacity:.8;border-top:1px solid #8885";n.setAttribute("aria-label","データの収録状況");n.innerHTML='+json.dumps(html.escape(notice)+' <a href="data-quality.html" style="color:inherit;text-decoration:underline">確認状況・修正内容</a>',ensure_ascii=False)+';document.body.appendChild(n)});\n'
    (dst/'data-quality.js').write_text(js,encoding='utf-8')
    detail='''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>収録データの確認状況</title><style>body{font:16px/1.9 system-ui,sans-serif;max-width:850px;margin:56px auto;padding:0 24px;color:#222;background:#faf9f6}h1{font-size:30px}h2{font-size:20px;margin-top:32px}a{color:#235f99}li{margin:8px 0}table{border-collapse:collapse;width:100%}td,th{padding:9px;text-align:left;border-bottom:1px solid #ddd}</style><a href="index.html">サイトに戻る</a><h1>収録データの確認状況</h1><p>2026/10/1検証。2026/9/30公開分まで収録。</p><h2>修正内容</h2><ul><li>3指標の2024〜2025年、各105週の公開日を7日前へ修正。</li><li>2023/12/27公開分の二重収録を各100行削除し、本来の2025/12/31公開分を各100行追加。</li><li>Hot 100の2013/11/26公開分100曲を追加。2008〜2016年も全サイトへ反映。</li><li>Downloadの完全重複300行と、同一曲のアーティスト表記違い2行を除外。異なる曲の同順位は保持。</li><li>Download 2019/7/31の61位「会いたいよ」手塚翔太を翌週の公式前回順位から補完。</li></ul><h2>未確認の範囲</h2><p>Download 2020/3/18は、翌週の前回順位67曲と当週記事1曲から68曲を復元。TOP10は全曲確認済みですが、全100曲以上の完全な順位表は未取得です。この週を含む累積登場数は確認できた曲だけの合計です。</p><p>Hot 100の2009/1/7、2010/1/6、2011/1/5、2012/1/4、2013/1/2、2014/1/1、2014/12/31は、公式アーカイブと前後リンクに掲載がありません。休載か未保存かは未確定です。未確認週を推測で追加していません。</p><h2>連続記録</h2><p>同一曲・同一公開週は1回。TOP10圏外、または公開間隔が8日を超えて連続性を確認できない箇所で区切ります。11/26の火曜日公開のような日付変更を含む連続週は維持します。上位20位の記録は、未確認の年末年始7週をまたいでいません。</p><h2>補完の出典</h2><ul><li><a href="https://www.billboard-japan.com/charts/detail?a=hot100&year=2013&month=12&day=1">Hot 100 2013/11/26</a></li><li><a href="https://www.billboard-japan.com/charts/detail?a=dlsongs&year=2019&month=08&day=12">Download 2019/8/7（前回順位から7/31を補完）</a></li><li><a href="https://www.billboard-japan.com/charts/detail?a=dlsongs&year=2020&month=03&day=30">Download 2020/3/25（前回順位から3/18を補完）</a></li><li><a href="https://www.billboard-japan.com/d_news/detail/86101/2">Download 2020/3/18の公式記事</a></li></ul></html>'''
    prefix='../records/' if dst.name=='billboard_output' else 'records/'
    links='<h2>修正後のTOP10連続記録</h2><ul>'+''.join(f'<li>{name}：<a href="{prefix}{code}-top10-consecutive-20260930.png">画像</a> / <a href="{prefix}{code}_top10_consecutive.csv">全順位CSV</a></li>' for code,name in [('hot100','Hot 100'),('stsongs','Streaming'),('dlsongs','Download')])+'</ul>'
    back='index.html' if (dst/'index.html').exists() else ('boys_group_power_map_2024_2025_2026.html' if dst.name=='billboard_output' else 'preview.html')
    detail=detail.replace('href="index.html"',f'href="{back}"').replace('</html>',links+'</html>')
    (dst/'data-quality.html').write_text(detail,encoding='utf-8')

def quality_script(document):
    return document if 'src="data-quality.js"' in document else document.replace('</body>','<script src="data-quality.js"></script></body>')
