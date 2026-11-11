"""Resolve canonical data, with self-contained deployment fallback."""
import json, shutil
from pathlib import Path

def shared_root(root):
    root=Path(root)
    config=root/'chart-data-config.json'
    if not config.exists():return None
    target=(root/json.loads(config.read_text(encoding='utf-8'))['shared_root']).resolve()
    return target if target.exists() else None

def source_directory(root):
    shared=shared_root(root)
    return shared/'source' if shared else Path(root)/'billboard_output'

def metadata_file(root,name):
    shared=shared_root(root)
    return shared/'metadata'/name if shared else Path(root)/name

def registry(root):
    return json.loads(metadata_file(root,'artists-registry.json').read_text(encoding='utf-8'))

def result_directory(root):
    shared=shared_root(root)
    return shared/'results/records' if shared else Path(root)/'records'

def publish_records(root):
    root=Path(root);shared=shared_root(root)
    if not shared:return
    for member in json.loads((shared/'projects.json').read_text(encoding='utf-8')).values():
        dest=Path(member);(dest/'records').mkdir(exist_ok=True)
        records=shared/'results/records'
        names=['rankings.json','visual-checks.json']
        names.extend(f'{code}_top10_consecutive.csv' for code in ['hot100','stsongs','dlsongs'])
        for name in names:
            src=records/name
            if src.is_file():shutil.copy2(src,dest/'records'/name)
        for name in ['streak-summary.json','hot100_top10_consecutive_2008_2026.csv']:
            shutil.copy2(shared/'results'/name,dest/name)

def publish_sources(root):
    shared=shared_root(root)
    if not shared:return
    projects=json.loads((shared/'projects.json').read_text(encoding='utf-8'))
    # A standalone GitHub checkout retains portable source snapshots.
    dest=Path(projects['github'])
    for src in (shared/'source').glob('billboard_*_entries.csv'):
        shutil.copy2(src,dest/'billboard_output'/src.name)
    for project in projects.values():
        for src in (shared/'metadata').glob('*.json'):
            shutil.copy2(src,Path(project)/src.name)
