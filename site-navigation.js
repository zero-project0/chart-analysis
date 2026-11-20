(()=>{
  'use strict';
  const recordsPage=document.documentElement.dataset.page==='records',nav=document.querySelector('.top nav');
  const link=document.createElement('a');link.id='recordsPageLink';link.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M11 17v4"/></svg>記録・実績';
  function refresh(){const state=new URLSearchParams({scope:scopeCode,chart:chartCode,kpop:window.chartIncludeKpop?.()?'1':'0'});link.href='records.html#'+state;const home=document.getElementById('chartsPageLink');if(home)home.href='index.html#'+state;}
  const baseApply=applyDashboard;applyDashboard=function(...args){const value=baseApply.apply(this,args);refresh();return value;};refresh();
  addEventListener('hashchange',()=>{const state=new URLSearchParams(location.hash.slice(1)),scope=state.get('scope'),chart=state.get('chart');const filterChanged=state.has('kpop')&&window.chartIncludeKpop?.()!==(state.get('kpop')!=='0');if(filterChanged)window.setChartIncludeKpop(state.get('kpop')!=='0');if(!state.has('artist')&&!state.has('song')&&dashboardManifest[scope+'|'+chart]&&(scope!==scopeCode||chart!==chartCode||filterChanged))activateDashboard(scope,chart);});
  if(recordsPage){
    document.title='記録・実績 — Music Charts';document.querySelector('.hero h1').textContent='記録・実績';document.querySelector('.brand').href='index.html';link.classList.add('is-current');link.setAttribute('aria-current','page');
    const home=document.createElement('a');home.id='chartsPageLink';home.href='index.html';home.textContent='チャートへ戻る';const compare=document.getElementById('openComparePage');nav.replaceChildren(home,link,...(compare?[compare]:[]));refresh();
  }else{
    nav.append(link);
    if(location.hash==='#statistics')location.replace('records.html'+location.search+'#'+new URLSearchParams({scope:scopeCode,chart:chartCode,kpop:window.chartIncludeKpop?.()?'1':'0'}));
  }
  const releases=document.createElement('a');releases.href='releases.html';releases.id='releasesPageLink';releases.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>配信カレンダー';nav.append(releases);
  const groups=document.createElement('a');groups.href='annual-review.html';
  groups.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 19v-2a6 6 0 0 1 12 0v2m2-14a3 3 0 0 1 0 6m4 8v-2a5 5 0 0 0-4-5"/></svg>グループ一覧';
  nav.append(groups);
  const detailLink=document.createElement('a');
  detailLink.className='share-x';detailLink.href='annual-review.html';detailLink.textContent='年間まとめ';
  const detailTitle=document.getElementById('detailName');
  const shareKind=document.getElementById('shareKind');
  const shareLink=document.createElement('a');
  shareLink.className='share-action';shareLink.textContent='年間まとめ';shareLink.hidden=true;
  document.getElementById('copyShareLink').before(shareLink);
  const syncAnnualLinks=()=>{
    detailLink.href='annual-review.html?'+new URLSearchParams({artist:detailTitle.textContent});
    shareLink.href=detailLink.href;
    shareLink.hidden=shareKind.textContent!=='SHARE ARTIST';
  };
  const observer=new MutationObserver(syncAnnualLinks);
  observer.observe(detailTitle,{childList:true,characterData:true,subtree:true});
  observer.observe(shareKind,{childList:true,characterData:true,subtree:true});
  document.getElementById('openShare').before(detailLink);
})();
