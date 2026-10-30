/* Scope views are derived from immutable registered datasets. */
(()=>{
  'use strict';
  const names={boys:'ボーイズグループ',girls:'ガールズグループ',korean:'K-POPグループ',combined:'ボーイズ＆ガールズグループ',all:'全アーティスト'};
  let includeKpop=true;
  const requested=new URLSearchParams(location.hash.slice(1));
  try{includeKpop=requested.has('kpop')?requested.get('kpop')!=='0':localStorage.getItem('chart-include-kpop')!=='0';}catch{}
  window.chartIncludeKpop=()=>includeKpop;window.setChartIncludeKpop=value=>{includeKpop=Boolean(value);try{localStorage.setItem('chart-include-kpop',includeKpop?'1':'0');}catch{}};
  scopeLabel=()=>names[scopeCode]+(['boys','girls','combined'].includes(scopeCode)?(includeKpop?'（K-POP含む）':'（K-POP除く）'):'');
  const button=document.createElement('button');button.type='button';button.className='scope-tab';button.dataset.scope='combined';button.setAttribute('aria-selected','false');button.textContent='グループ総合';document.querySelector('[data-scope="all"]').before(button);
  const control=document.createElement('div');control.className='kpop-filter';control.innerHTML='<label><input id="includeKpop" type="checkbox">K-POPを含める</label><p id="kpopScopeHelp">K-POP分類に重なるグループも対象。男女混成は総合のみ。</p>';document.querySelector('.scope-tabs').after(control);
  const note=document.createElement('p');note.className='scope-combined-note';document.querySelector('.hero .wrap').append(note);
  const originalLoader=loadDashboard,baseSources=new Map(),views=new Map();
  function base(scope,chart){const key=scope+'|'+chart;if(!baseSources.has(key))baseSources.set(key,originalLoader(scope,chart).then(data=>data).catch(error=>{baseSources.delete(key);throw error;}));return baseSources.get(key);}
  for(const chart of ['hot100','stsongs','dlsongs'])dashboardManifest['combined|'+chart]=[];
  loadDashboard=async function(scope,chart){
    if(!['boys','girls','combined'].includes(scope))return base(scope,chart);
    const include=includeKpop,key=scope+'|'+chart+'|'+Number(include);
    if(!views.has(key))views.set(key,(async()=>{
      const scopes=scope==='combined'?['boys','girls','korean']:[scope,'korean'];
      const sources=await Promise.all(scopes.map(s=>base(s,chart)));
      if(new Set(sources.map(s=>s.latestDate)).size!==1)throw new Error('分類ごとのデータ集計日が一致しません。');
      const classification=window.CHART_GROUP_CLASSIFICATION,korean=sources.at(-1),kpopNames=new Set([...classification.kpopArtists,...korean.artistDetails.map(a=>a.artist)]),gender=classification.groups;
      const allowed=name=>{if(!include)return !kpopNames.has(name);if(scope==='combined')return true;if(!kpopNames.has(name))return true;return gender[name]===scope;};
      const unique=(list,key)=>[...new Map(list.map(item=>[key(item),item])).values()];
      const details=unique(sources.flatMap(s=>s.artistDetails||[]),a=>a.artist).filter(a=>allowed(a.artist)).sort((a,b)=>b.appearances-a.appearances||a.artist.localeCompare(b.artist,'ja'));
      const allowedNames=new Set(details.map(a=>a.artist));
      const artists=details.filter(a=>a.appearances>0).map((a,i)=>({...a,rank:i+1}));
      return {...sources[0],artistDetails:details,artists:artists.slice(0,50),songs:unique(sources.flatMap(s=>s.songs||[]),s=>s.artist+'\u0000'+s.title).filter(s=>allowedNames.has(s.artist)).sort((a,b)=>b.appearances-a.appearances),latestSongs:unique(sources.flatMap(s=>s.latestSongs||[]),s=>s.artist+'\u0000'+s.title).filter(s=>allowedNames.has(s.artist)).sort((a,b)=>(a.rank||a.latestRank)-(b.rank||b.latestRank)),combinedScopes:scopes,includeKpop:include};
    })().catch(error=>{views.delete(key);throw error;}));
    const data=await views.get(key);if(include===includeKpop){dashboards[scope]??={};dashboards[scope][chart]=data;dashboardReady.add(scope+'|'+chart);}return data;
  };
  const labels={boys:'ボーイズ',girls:'ガールズ',korean:'K-POP',combined:'グループ総合',all:'すべて'};
  document.querySelectorAll('.scope-tab').forEach(b=>{b.textContent=labels[b.dataset.scope];b.setAttribute('aria-label',names[b.dataset.scope]);});
  button.addEventListener('click',()=>activateDashboard('combined',requestedChartCode));
  function sync(){const applicable=['boys','girls','combined'].includes(scopeCode);const input=document.getElementById('includeKpop');input.checked=includeKpop;input.disabled=!applicable;control.classList.toggle('is-disabled',!applicable);note.hidden=!applicable;note.textContent=applicable?(includeKpop?'K-POPを含む分類。':'K-POP分類に属するグループを除外。')+'同じアーティストは重複して数えません。':'';const hash=new URLSearchParams(location.hash.slice(1));hash.set('scope',scopeCode);hash.set('chart',chartCode);hash.set('kpop',includeKpop?'1':'0');history.replaceState(null,'',location.pathname+location.search+'#'+hash);}
  const previousApply=applyDashboard;applyDashboard=function(...args){const result=previousApply.apply(this,args);sync();return result;};
  control.querySelector('input').addEventListener('change',async e=>{const previous=includeKpop;includeKpop=e.target.checked;e.target.disabled=true;const success=await activateDashboard(scopeCode,requestedChartCode);if(!success){includeKpop=previous;sync();return;}try{localStorage.setItem('chart-include-kpop',includeKpop?'1':'0');}catch{}});
  const addFilter=url=>{const u=new URL(url,location.href),state=new URLSearchParams(u.hash.slice(1));state.set('kpop',includeKpop?'1':'0');u.hash=state;return u.href;};const previousArtistShare=artistShareUrl,previousSongShare=songShareUrl;artistShareUrl=(...args)=>addFilter(previousArtistShare(...args));songShareUrl=(...args)=>addFilter(previousSongShare(...args));
  sync();
  activateDashboard(['boys','girls','korean','combined','all'].includes(requested.get('scope'))?requested.get('scope'):scopeCode,['hot100','stsongs','dlsongs'].includes(requested.get('chart'))?requested.get('chart'):chartCode).then(()=>{if(requested.get('song'))openSongDetail(requested.get('songArtist'),requested.get('song'),false);else if(requested.get('artist'))openDetail(requested.get('artist'),false);});
})();
