"""Calculate verified TOP10 runs from the same corrected CSVs used by the site."""
import csv,json,sys,unicodedata
from collections import Counter,defaultdict
from datetime import date
from pathlib import Path
import chart_integrity
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).parent;SOURCE=ROOT/'billboard_output';OUT=ROOT/'records';OUT.mkdir(exist_ok=True)
norm=chart_integrity.normalize
charts={}
for code in ['hot100','stsongs','dlsongs']:
    rows=[]
    for file in sorted(SOURCE.glob(f'billboard_{code}_*_entries.csv')):
        part=list(csv.DictReader(file.open(encoding='utf-8-sig',newline='')))
        chart_integrity.validate_saved_rows(part,int(file.stem.split('_')[2]),code,ROOT)
        rows.extend(part)
    dates=sorted({r['chart_date'] for r in rows});index={d:i for i,d in enumerate(dates)}
    tops=[r for r in rows if int(r['rank'])<=10]
    counts=Counter(r['chart_date'] for r in tops)
    assert set(counts)==set(dates) and min(counts.values())>=10
    groups=defaultdict(list)
    for r in tops:groups[(norm(r['artist']),norm(r['title']))].append(r)
    records=[]
    for points in groups.values():
        points.sort(key=lambda r:(r['chart_date'],int(r['rank'])))
        assert len({p['chart_date'] for p in points})==len(points)
        runs=[];run=[]
        for p in points:
            if run and (index[p['chart_date']]!=index[run[-1]['chart_date']]+1 or not 6<=(date.fromisoformat(p['chart_date'])-date.fromisoformat(run[-1]['chart_date'])).days<=8):
                runs.append(run);run=[]
            run.append(p)
        if run:runs.append(run)
        best=min(runs,key=lambda r:(-len(r),r[0]['chart_date']))
        records.append(dict(title=unicodedata.normalize('NFKC',points[-1]['title']),artist=unicodedata.normalize('NFKC',points[-1]['artist']),weeks=len(best),start=best[0]['chart_date'],end=best[-1]['chart_date'],ongoing=best[-1]['chart_date']==dates[-1],begins_at_chart_start=best[0]['chart_date']==dates[0],total_top10_weeks=len(points),best_rank_in_streak=min(int(p['rank']) for p in best),runs=len(runs)))
    records.sort(key=lambda r:(-r['weeks'],r['start'],r['artist'],r['title']))
    previous=None
    for position,r in enumerate(records,1):
        if r['weeks']!=previous:rank=position
        r['rank']=rank;previous=r['weeks']
    displayed=[r for r in records if r['rank']<=20]
    for r in displayed:
        assert (date.fromisoformat(r['end'])-date.fromisoformat(r['start'])).days//7+1==r['weeks'],(code,r)
    info=dict(code=code,first=dates[0],last=dates[-1],issues=len(dates),songs=len(records),displayed=displayed,records=records,dates=dates,method='同一曲・同一公開週は1回。圏外または8日超の未確認期間で区切る。2013/11/26の火曜公開を含む6〜8日間隔は連続。')
    charts[code]=info
    fields=['rank','artist','title','weeks','start','end','ongoing','total_top10_weeks','best_rank_in_streak','runs','begins_at_chart_start']
    with (OUT/f'{code}_top10_consecutive.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(records)
    print(code,'issues',len(dates),'TOP20 rows',len(displayed),'leader',displayed[0]['title'],displayed[0]['weeks'],flush=True)
(OUT/'rankings.json').write_text(json.dumps(charts,ensure_ascii=False,indent=2),encoding='utf-8')
# Keep the legacy Hot100 export in sync for existing consumers.
legacy=[dict(rank=r['rank'],artist=r['artist'],title=r['title'],consecutive_weeks=r['weeks'],start=r['start'],end=r['end'],ongoing=r['ongoing'],best_rank_in_streak=r['best_rank_in_streak'],total_top10_weeks=r['total_top10_weeks'],runs=r['runs']) for r in charts['hot100']['records']]
with (ROOT/'hot100_top10_consecutive_2008_2026.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=list(legacy[0]));w.writeheader();w.writerows(legacy)
(ROOT/'streak-summary.json').write_text(json.dumps({c:{k:v for k,v in x.items() if k not in {'records','dates'}} for c,x in charts.items()},ensure_ascii=False,indent=2),encoding='utf-8')
