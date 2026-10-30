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
})();
