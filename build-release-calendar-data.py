"""Build a portable release-calendar snapshot from the verified collection JSON."""
import argparse,datetime,json,pathlib

def build(source):
    data=json.loads(source.read_text(encoding='utf-8'))
    rows=[]
    for r in data['releases']:
        date=datetime.date.fromisoformat(r['release_date'])
        if date.year not in (2025,2026):raise ValueError('Unexpected release year')
        if not r['groups']:raise ValueError('Release without a classified artist')
        versions=[]
        for v in r['versions']:
            versions.append({'id':v['uri'],'url':v['url'],'trackCount':v['track_count'],'complete':v['tracklist_complete'],'tracks':[{'title':t['title'],'unannounced':t.get('is_placeholder',False)} for t in v['tracks']]})
        rows.append({'id':versions[0]['id'],'date':r['release_date'],'title':r['title'],'type':r['type'],'groups':r['groups'],'trackCount':r['track_count'],'url':r['url'],'cover':r['cover_url'],'prereleaseAtCheck':r['is_prerelease'],'versions':versions})
    if len({r['id'] for r in rows})!=len(rows):raise ValueError('Duplicate release ID')
    m=data['metadata'];coverage=source.parent/'coverage.json'
    artists=[{'name':r['artist'],'idConfirmed':bool(r['spotify_uri'])} for r in json.loads(coverage.read_text(encoding='utf-8'))] if coverage.exists() else [{'name':n,'idConfirmed':True} for n in sorted({n for r in rows for n in r['groups']})]
    return {'meta':{'checkedAt':m['collected_at'],'firstMonth':'2025-01','lastMonth':'2026-12','scope':'国内ボーイズグループ','registeredGroups':m['registry_groups'],'identifiedGroups':m['identified_groups'],'groupsWithReleases':m['groups_with_releases'],'releaseCount':len(rows),'source':'Spotify','dateMeaning':'Spotify上の作品リリース日。初回配信開始日とは限りません。再発・特別版・ライブ盤などを含みます。','coverageNote':'検索・公開ページの表示上限があり、全作品の網羅は未確認です。未収集をリリースなしとは判定していません。'},'artists':artists,'releases':rows}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,default=pathlib.Path(__file__).parent/'release-calendar-data.json');a=p.parse_args()
    result=build(a.input);a.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');print(json.dumps({'releases':len(result['releases']),'bytes':a.output.stat().st_size}))
