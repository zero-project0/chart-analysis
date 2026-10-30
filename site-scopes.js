/* Combined scope reuses the three registered group datasets, without counting duplicates. */
(()=>{
  'use strict';
  const names={boys:'国内ボーイズグループ',girls:'国内ガールズグループ',korean:'K-POPグループ',combined:'ボーイズ＆ガールズグループ総合',all:'全アーティスト'};
  scopeLabel=()=>names[scopeCode]||names.all;
  const button=document.createElement('button');button.type='button';button.className='scope-tab';button.dataset.scope='combined';button.setAttribute('aria-selected','false');button.textContent='グループ総合';button.title='国内ボーイズ・国内ガールズ・K-POPをまとめて表示';document.querySelector('[data-scope="all"]').before(button);
  const originalLoader=loadDashboard,combinedLoads=new Map();
  for(const chart of ['hot100','stsongs','dlsongs'])dashboardManifest['combined|'+chart]=[];
  loadDashboard=function(scope,chart){
    if(scope!=='combined')return originalLoader(scope,chart);
    if(dashboardReady.has('combined|'+chart))return Promise.resolve(dashboards.combined[chart]);
    if(!combinedLoads.has(chart))combinedLoads.set(chart,Promise.all(['boys','girls','korean'].map(s=>originalLoader(s,chart))).then(sources=>{
      if(new Set(sources.map(s=>s.latestDate)).size!==1)throw new Error('グループ別データの集計日が一致しません。');
      const unique=(list,key)=>[...new Map(list.map(item=>[key(item),item])).values()];
      const details=unique(sources.flatMap(s=>s.artistDetails||[]),a=>a.artist).sort((a,b)=>b.appearances-a.appearances||a.artist.localeCompare(b.artist,'ja'));
      const artists=details.filter(a=>a.appearances>0).map((a,i)=>({...a,rank:i+1}));
      const data={...sources[0],artistDetails:details,artists:artists.slice(0,50),songs:unique(sources.flatMap(s=>s.songs||[]),s=>s.artist+'\u0000'+s.title).sort((a,b)=>b.appearances-a.appearances),latestSongs:unique(sources.flatMap(s=>s.latestSongs||[]),s=>s.artist+'\u0000'+s.title).sort((a,b)=>(a.rank||a.latestRank)-(b.rank||b.latestRank)),combinedScopes:['boys','girls','korean']};
      dashboards.combined??={};dashboards.combined[chart]=data;dashboardReady.add('combined|'+chart);return data;
    }).catch(error=>{combinedLoads.delete(chart);throw error;}));
    return combinedLoads.get(chart);
  };
  button.addEventListener('click',()=>activateDashboard('combined',requestedChartCode));
  const labels={boys:'国内ボーイズ',girls:'国内ガールズ',korean:'K-POP',combined:'グループ総合',all:'すべて'};
  document.querySelectorAll('.scope-tab').forEach(b=>{b.textContent=labels[b.dataset.scope];b.setAttribute('aria-label',names[b.dataset.scope]);});
  const note=document.createElement('p');note.className='scope-combined-note';note.textContent='国内ボーイズ・国内ガールズ・K-POPを統合。同じアーティストは重複して数えません。';document.querySelector('.hero .wrap').append(note);
  const previousApply=applyDashboard;applyDashboard=function(...args){const result=previousApply.apply(this,args);note.hidden=scopeCode!=='combined';return result;};note.hidden=scopeCode!=='combined';
  const requested=new URLSearchParams(location.hash.slice(1));
  if(requested.get('scope')==='combined')activateDashboard('combined',['hot100','stsongs','dlsongs'].includes(requested.get('chart'))?requested.get('chart'):'hot100').then(()=>{if(requested.get('song'))openSongDetail(requested.get('songArtist'),requested.get('song'),false);else if(requested.get('artist'))openDetail(requested.get('artist'),false);});
})();
