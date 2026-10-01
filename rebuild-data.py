"""Rebuild all historical assets from the verified local CSVs, without downloading."""
import sys
from pathlib import Path
from collections import Counter
import billboard_boys_group_complete as site
import chart_integrity

collections={}
matched={}
lookup=site.build_alias_lookup()
all_collections=[]
for code in site.CHART_CODES:
    collections[code]=[];matched[code]=[]
    for year in range(site.CHART_START_DATES[code].year,2027):
        c=chart_integrity.collection_from_csv(site,year,code)
        if c is None:raise RuntimeError(f'Missing CSV: {code} {year}')
        collections[code].append(c);all_collections.append(c)
        matched[code].extend(site.count_target_artists(c,lookup)[2])
    print('VERIFIED',code,sum(len(c['entries']) for c in collections[code]),flush=True)
site.save_collection_report(all_collections)
counts={c['year']:site.count_target_artists(c,lookup)[0] for c in collections['hot100'] if c['year'] in site.ANALYSIS_YEARS}
aliases={c['year']:site.count_target_artists(c,lookup)[1] for c in collections['hot100'] if c['year'] in site.ANALYSIS_YEARS}
site.save_comparison_csv(site.build_results(counts),[c for c in collections['hot100'] if c['year'] in site.ANALYSIS_YEARS],aliases)
site.save_match_details([r for r in matched['hot100'] if r['year'] in site.ANALYSIS_YEARS])
site.save_site(matched,collections)
print('ALL DASHBOARDS REBUILT',flush=True)
