/* Explicit artist aliases; merge histories before scope, search and record views. */
(()=>{
 'use strict';
 const canonical=name=>String(name||'').normalize('NFKC')==='SMAP'?'SMAP':name;
 const completed=new WeakSet();
 function normalize(data){
  if(!data||completed.has(data))return data;
  const matches=(data.artistDetails||[]).filter(a=>canonical(a.artist)==='SMAP');
  if(matches.length>1||matches.some(a=>a.artist!=='SMAP')){
   const representative=matches.find(a=>a.artist==='SMAP')||matches[0],byTitle=new Map();
   for(const a of matches)for(const song of a.allSongs||a.songs||[]){
    const key=song.title.normalize('NFKC'),entry=byTitle.get(key)||{song,points:new Map()};
    for(const point of song.allTimeHistory||song.history||[]){const old=entry.points.get(point.date);if(old&&old.rank!==point.rank)throw new Error('SMAPの同一楽曲・公開日に順位の矛盾があります: '+song.title+' / '+point.date);entry.points.set(point.date,point);}
    byTitle.set(key,entry);
   }
   const year=String(data.latestDate).slice(0,4),allSongs=[...byTitle.values()].map(({song,points})=>{const history=[...points.values()].sort((a,b)=>a.date.localeCompare(b.date));return{...song,appearances:history.length,weeks:history.length,best:Math.min(...history.map(p=>p.rank)),first:history[0]?.date,latest:history.at(-1)?.date,years:[...new Set(history.map(p=>Number(p.date.slice(0,4))))],allTimeHistory:history};}).sort((a,b)=>b.appearances-a.appearances||a.title.localeCompare(b.title,'ja'));
   const yearCounts={},weeklyCumulative={};
   for(const [yr,dates]of Object.entries(data.publicationDates||{})){const counts=new Map();for(const s of allSongs)for(const p of s.allTimeHistory)if(p.date.startsWith(yr))counts.set(p.date,(counts.get(p.date)||0)+1);let sum=0;weeklyCumulative[yr]=dates.map(date=>sum+=counts.get(date)||0);yearCounts[yr]=sum;}
   const songs=allSongs.flatMap(s=>{const history=s.allTimeHistory.filter(p=>p.date.startsWith(year));return history.length?[{...s,history,appearances:history.length,weeks:history.length,best:Math.min(...history.map(p=>p.rank)),top10:history.filter(p=>p.rank<=10).length,latest:history.at(-1).date}]:[];});const points=songs.flatMap(s=>s.history);
   const merged={...representative,artist:'SMAP',allSongs,songs,yearCounts,weeklyCumulative,appearances:points.length,weeks:new Set(points.map(p=>p.date)).size,songsCount:songs.length,top10:points.filter(p=>p.rank<=10).length,best:points.length?Math.min(...points.map(p=>p.rank)):null,active:points.some(p=>p.date===data.latestDate)};
   data.artistDetails=data.artistDetails.filter(a=>canonical(a.artist)!=='SMAP').concat(merged);
   for(const key of ['artists','songs','latestSongs'])if(Array.isArray(data[key])){const seen=new Set();data[key]=data[key].map(r=>({...r,artist:canonical(r.artist)})).filter(r=>{const id=r.artist+'|'+(r.title||'');if(seen.has(id))return false;seen.add(id);return true;});}
  }
  completed.add(data);return data;
 }
 window.canonicalArtistName=canonical;window.canonicalizeChartDashboard=normalize;
 for(const charts of Object.values(window.CHART_DASHBOARDS||{}))for(const data of Object.values(charts))normalize(data);
})();
