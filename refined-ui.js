/* Reversible presentation layer. No chart records or classifications are changed. */
(()=>{
  'use strict';
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  q('.mark').innerHTML=svg('<path d="M5 17V11M12 17V5M19 17V8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>');
  const paths={'#search':'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>','#latest':'<path d="M4 7h16M4 12h10M4 17h13"/>','#ranking':'<path d="M5 20v-7h4v7M10 20V5h4v15M15 20v-11h4v11"/>','#songs':'<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>'};
  qa('.top nav a').forEach(a=>{a.insertAdjacentHTML('afterbegin',svg(paths[a.getAttribute('href')]||''));});
  q('#openComparePage')?.insertAdjacentHTML('afterbegin',svg('<path d="M6 5v14M18 5v14M3 8h6M15 16h6"/>'));
  [['boys','ボーイズ'],['girls','ガールズ'],['korean','K-POP'],['all','すべて']].forEach(([code,label])=>{const b=q(`[data-scope="${code}"]`);b.title=b.textContent;b.setAttribute('aria-label',b.textContent);b.textContent=label;});
  q('.hero h1').textContent='チャートを見渡す';
  q('#search label').textContent='アーティスト・楽曲を検索';
  q('#globalSearch').insertAdjacentHTML('beforebegin',svg('<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>').replace('<svg ','<svg class="search-symbol" '));
  q('#latest h2').textContent='最新週のチャート';
  q('#latest .section-copy').innerHTML='<span id="latestWeek">'+safe(dashboard.latestDate)+'</span> 公開分 · <span id="latestChartName">'+safe(dashboard.chartName)+'</span>';
  const overview=document.createElement('section');overview.id='overview';overview.className='section overview-section';
  overview.innerHTML=`<div class="wrap"><div class="section-head"><div><p class="kicker">YEAR IN VIEW</p><h2>今年の実績</h2></div><p class="section-copy" id="overviewContext"></p></div><div class="overview-grid"><article class="overview-card"><h3>累積ランクイン TOP5</h3><p>各曲が各週にランクインした回数の合計</p><div class="overview-bars" id="overviewBars"></div></article><article class="overview-card"><div class="overview-chart-head"><div><h3>週ごとのランクイン曲数</h3><p>その週にTOP100入りした曲数</p></div><select id="overviewArtist" aria-label="週別グラフのアーティスト"></select></div><div class="overview-readout" aria-live="polite"><span id="overviewDate"></span><strong id="overviewValue"></strong></div><div id="overviewPlot"></div><p class="overview-hint">グラフをなぞると各週の曲数を確認できます。</p><details class="overview-data"><summary>週別の数値を見る</summary><div class="overview-data-list" id="overviewData"></div></details></article></div></div>`;
  q('#latest').after(overview);
  const nav=document.createElement('a');nav.href='#overview';nav.innerHTML=svg('<path d="M4 17 9 11l5 3 6-10"/>')+'実績の推移';q('.top nav a[href="#ranking"]').before(nav);
  let selectedName='',overviewSeries=[],overviewArtists=[];
  // Saved Apple light accents; yellow is darkened for white-background data marks.
  const categoryColor=()=>({boys:'#0088ff',girls:'#ff383c',korean:'#b58a00',combined:'#326d52',all:'#5856d6'}[scopeCode]||'#0088ff');
  function updateOverview(){
    const year=String(dashboard.latestDate).slice(0,4);
    overviewArtists=[...artistUniverse()].sort((a,b)=>b.appearances-a.appearances||a.artist.localeCompare(b.artist,'ja')).slice(0,5);
    q('#overviewContext').textContent=`${year}年 · ${dashboard.latestDate.replaceAll('-','.')} 公開分まで`;
    const max=Math.max(1,...overviewArtists.map(a=>a.appearances));
    q('#overviewBars').innerHTML=overviewArtists.length?overviewArtists.map(a=>`<button class="overview-bar" data-overview-open="${safe(a.artist)}" aria-label="${safe(a.artist)}、累積${a.appearances}回。詳細を見る"><span class="overview-bar-name">${safe(a.artist)}</span><span class="overview-bar-value">${a.appearances.toLocaleString('ja-JP')}<small> 回</small></span><span class="overview-track"><i class="overview-fill" style="width:${a.appearances/max*100}%;background:${categoryColor()}"></i></span></button>`).join(''):'<p>対象の記録はありません。</p>';
    if(!overviewArtists.some(a=>a.artist===selectedName))selectedName=overviewArtists[0]?.artist||'';
    q('#overviewArtist').innerHTML=overviewArtists.map(a=>`<option value="${safe(a.artist)}"${a.artist===selectedName?' selected':''}>${safe(a.artist)}</option>`).join('');
    drawWeekly();
  }
  function drawWeekly(){
    const artist=overviewArtists.find(a=>a.artist===selectedName),year=String(dashboard.latestDate).slice(0,4);
    const storedDates=dashboard.publicationDates||[],dateList=Array.isArray(storedDates)?storedDates:(storedDates[year]||Object.values(storedDates).flat());
    const ds=dateList.filter(x=>String(x).startsWith(year)).sort();
    const counts=new Map();const seen=new Set();
    for(const s of artist?.allSongs||artist?.songs||[])for(const p of s.allTimeHistory||s.history||[]){if(!String(p.date).startsWith(year))continue;const id=s.title+'|'+p.date;if(seen.has(id))continue;seen.add(id);counts.set(p.date,(counts.get(p.date)||0)+1);}
    const dates=ds.length?ds:[...counts.keys()].sort();overviewSeries=dates.map(date=>({date,value:counts.get(date)||0}));
    const total=overviewSeries.reduce((n,p)=>n+p.value,0);
    q('#overviewPlot').dataset.sum=String(total);q('#overviewPlot').dataset.expected=String(artist?.appearances||0);
    if(!overviewSeries.length){q('#overviewPlot').innerHTML='<p>週別データがありません。</p>';q('#overviewDate').textContent='';q('#overviewValue').textContent='—';q('#overviewData').textContent='記録なし';return;}
    const w=620,h=230,l=38,r=25,t=16,b=34,gw=w-l-r,gh=h-t-b,max=Math.max(4,Math.ceil(Math.max(...overviewSeries.map(p=>p.value))/4)*4),x=i=>l+i/Math.max(1,overviewSeries.length-1)*gw,y=v=>t+gh-v/max*gh;
    const points=overviewSeries.map((p,i)=>`${x(i)},${y(p.value)}`).join(' '),color=categoryColor();
    let markup=`<svg class="overview-svg" role="img" aria-label="${safe(selectedName)}、${year}年の週別ランクイン曲数" viewBox="0 0 ${w} ${h}"><title>${safe(selectedName)}の週別ランクイン曲数</title><desc>縦軸は0から${max}曲。週別の数値表を下に掲載。</desc>`;
    for(let k=0;k<=4;k++){const v=max*k/4;markup+=`<line x1="${l}" y1="${y(v)}" x2="${w-r}" y2="${y(v)}" stroke="#e6e9ef"/><text x="${l-9}" y="${y(v)+4}" text-anchor="end" fill="#80808d" font-size="12">${Number.isInteger(v)?v:v.toFixed(1)}</text>`;}
    markup+=`<polygon points="${l},${t+gh} ${points} ${w-r},${t+gh}" fill="${color}" opacity=".07"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const indexes=[...new Set([0,Math.round((overviewSeries.length-1)/3),Math.round((overviewSeries.length-1)*2/3),overviewSeries.length-1])];
    for(const i of indexes){const p=overviewSeries[i];markup+=`<text x="${x(i)}" y="${h-8}" text-anchor="middle" fill="#80808d" font-size="12">${Number(p.date.slice(5,7))}/${Number(p.date.slice(8))}</text>`;}
    markup+=`<circle id="overviewMarker" cx="${x(overviewSeries.length-1)}" cy="${y(overviewSeries.at(-1).value)}" r="4.5" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
    q('#overviewPlot').innerHTML=markup;
    function select(i){const p=overviewSeries[i];q('#overviewDate').textContent=p.date.replaceAll('-','.');q('#overviewValue').textContent=p.value+'曲';q('#overviewMarker').setAttribute('cx',x(i));q('#overviewMarker').setAttribute('cy',y(p.value));}
    const chart=q('#overviewPlot svg');chart.addEventListener('pointermove',event=>{const box=chart.getBoundingClientRect(),local=(event.clientX-box.left)/box.width*w;select(Math.max(0,Math.min(overviewSeries.length-1,Math.round((local-l)/gw*(overviewSeries.length-1)))));});chart.addEventListener('pointerleave',()=>select(overviewSeries.length-1));
    q('#overviewData').innerHTML='<table><thead><tr><th>公開日</th><th>ランクイン曲数</th></tr></thead><tbody>'+overviewSeries.map(p=>`<tr><td>${p.date}</td><td>${p.value}曲</td></tr>`).join('')+'</tbody></table>';select(overviewSeries.length-1);
  }
  q('#overviewArtist').addEventListener('change',e=>{selectedName=e.target.value;drawWeekly();});
  q('#overviewBars').addEventListener('click',e=>{const button=e.target.closest('[data-overview-open]');if(button)openDetail(button.dataset.overviewOpen);});
  // Three visible rows form one carousel column; pagination uses the same grouping.
  renderLatest=function(){
    q('#latestChartName').textContent=dashboard.chartName;q('#latestWeek').textContent=dashboard.latestDate;
    const filler=(3-latestSongs.length%3)%3;
    q('#latestGrid').innerHTML=latestSongs.length?latestSongs.map(s=>latestCardMarkup(s)).join('')+Array.from({length:filler},()=>'<span class="latest-filler" aria-hidden="true"></span>').join('')+(latestSongs.length>1?latestSongs.map(s=>latestCardMarkup(s,true)).join(''):''):'<p class="muted">対象のランクイン楽曲はありません。</p>';
    syncLatestCarousel();
  };
  syncLatestCarousel=function(){requestAnimationFrame(()=>{
    const viewport=q('#latestViewport'),grid=q('#latestGrid');grid.style.setProperty('--latest-column-width',optimalLatestColumnWidth(viewport)+'px');
    const copies=qa('#latestGrid [data-loop-copy]');copies.forEach(c=>c.hidden=false);
    requestAnimationFrame(()=>{const originals=qa('#latestGrid .latest-song:not([data-loop-copy])'),first=originals[0],next=originals[3],copy=copies[0];
      latestPageCount=Math.ceil(originals.length/3);latestPageWidth=first&&next?next.offsetLeft-first.offsetLeft:0;latestAutoCycleWidth=first&&copy?copy.offsetLeft-first.offsetLeft:0;
      const overflow=latestPageCount>1&&latestPageWidth>0&&latestAutoCycleWidth>viewport.clientWidth+4;
      copies.forEach(c=>c.hidden=!overflow);if(!overflow){latestAutoCycleWidth=0;latestPageWidth=0;latestPageCount=Math.min(1,latestPageCount);}
      q('#latestPrev').hidden=!overflow;q('#latestNext').hidden=!overflow;viewport.scrollLeft=0;latestAutoLast=performance.now();renderLatestDots();
    });
  });};
  const originalApply=applyDashboard;applyDashboard=function(...args){const value=originalApply.apply(this,args);updateOverview();return value;};
  updateOverview();renderLatest();
  // Song rank chart: responsive width, fewer marker labels, and an explicitly labeled TOP10 band.
  drawSongRankTrend=function(rawHistory){
    const complete=activeSongTrendSource?.allTimeHistory||rawHistory||[],source=songTrendRange==='all'?complete:complete.filter(p=>String(p.date).slice(0,4)===songTrendRange);
    activeSongTrendHistory=[...source].sort((a,b)=>a.date.localeCompare(b.date));q('#songRankTrendTooltip')?.setAttribute('hidden','');
    q('#songTrendTitle').textContent=songTrendRange==='all'?'全期間の順位推移':songTrendRange+'年の順位推移';
    q('#songDetailHistory').innerHTML=activeSongTrendHistory.length?[...activeSongTrendHistory].reverse().map(p=>`<div class="song-history-item"><span>${safe(p.date)}</span><strong>#${p.rank}</strong></div>`).join(''):'<p class="muted">この年の順位データはありません。</p>';
    const canvas=q('#songRankTrend'),ratio=devicePixelRatio||1,width=Math.max(canvas.parentElement.clientWidth,280),height=300,left=52,right=22,top=27,bottom=46,gw=width-left-right,gh=height-top-bottom;
    canvas.width=Math.round(width*ratio);canvas.height=height*ratio;canvas.style.width=width+'px';canvas.style.height=height+'px';const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    const history=activeSongTrendHistory;if(!history.length){ctx.fillStyle='#73737f';ctx.font='13px sans-serif';ctx.fillText('順位データがありません',left,80);return;}
    const times=history.map(p=>Date.parse(p.date+'T00:00:00Z')),min=times[0],max=times.at(-1),x=time=>min===max?left+gw/2:left+(time-min)/(max-min)*gw,y=rank=>top+(rank-1)/99*gh;
    ctx.fillStyle='#edf5ff';ctx.fillRect(left,top,gw,y(10)-top);ctx.font='11px sans-serif';ctx.fillStyle='#7c7c76';ctx.textAlign='right';ctx.textBaseline='middle';
    for(const rank of [1,10,25,50,75,100]){ctx.strokeStyle=rank===10?'#cadff5':'#e5e5ea';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y(rank));ctx.lineTo(width-right,y(rank));ctx.stroke();ctx.fillText(rank+'位',left-9,y(rank));}
    ctx.textAlign='right';ctx.fillStyle='#68788b';ctx.fillText('TOP10',width-right,top-12);
    const indices=[...new Set([0,Math.round((history.length-1)/3),Math.round((history.length-1)*2/3),history.length-1])];
    ctx.fillStyle='#80808b';ctx.textAlign='center';ctx.textBaseline='top';for(const i of indices){const p=history[i],longRange=max-min>400*86400000;ctx.fillText(longRange?p.date.slice(0,4)+'/'+Number(p.date.slice(5,7)):Number(p.date.slice(5,7))+'/'+Number(p.date.slice(8)),x(times[i]),height-bottom+15);}
    ctx.strokeStyle='#0088ff';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();history.forEach((p,i)=>{const xx=x(times[i]),yy=y(p.rank);if(!i||times[i]-times[i-1]>9*86400000)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();
    history.forEach((p,i)=>{ctx.fillStyle=p.rank<=10?'#0088ff':'#fff';ctx.strokeStyle='#0088ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x(times[i]),y(p.rank),history.length>80?2.2:4,0,Math.PI*2);ctx.fill();ctx.stroke();});
    canvas.setAttribute('aria-label',`${history[0].date}から${history.at(-1).date}の順位推移。1位が上。TOP10を薄い青の帯で表示。`);
  };
  // Cumulative line chart: three years, shared scale, warm surfaces and a readable legend.
  let artistLineMeta=null;
  function artistLineSeries(artist,source){
    const latest=String(source.latestDate).slice(0,4),years=artistGraphYears();
    return years.map((year,i)=>({year,color:year===latest?'#0088ff':i===0?'#8e8e93':'#af52de',dash:year===latest?[]:i===0?[4,4]:[9,4],values:artistCumulativeForYear(artist,year),dates:source.publicationDates?.[year]||[],latest:year===latest}));
  }
  function paintArtistLines(ctx,series,width,height,ox=0,oy=0){
    const left=44,right=19,top=20,bottom=37,gw=width-left-right,gh=height-top-bottom,maximum=Math.max(1,...series.flatMap(s=>s.values)),step=Math.max(1,Math.pow(10,Math.floor(Math.log10(maximum/4)))),tick=Math.ceil(maximum/4/step)*step,max=tick*4,points=[];
    ctx.save();ctx.translate(ox,oy);ctx.font='12px sans-serif';ctx.lineWidth=1;ctx.textBaseline='middle';
    for(let i=0;i<=4;i++){const v=tick*i,y=top+gh-v/max*gh;ctx.strokeStyle='#e5e5ea';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.textAlign='right';ctx.fillStyle='#77777f';ctx.fillText(v.toLocaleString('ja-JP'),left-8,y);}
    for(const month of (width<420?[0,3,6,9]:[0,3,6,9,11])){const x=left+month/12*gw;ctx.textAlign='center';ctx.fillStyle='#77777f';ctx.fillText((month+1)+'月',x,height-13);}
    series.forEach((s,row)=>{
      const start=Date.UTC(Number(s.year),0,1),end=Date.UTC(Number(s.year)+1,0,1),ps=s.values.map((value,index)=>({value,index,row,year:s.year,date:s.dates[index]||'',x:left+(s.dates[index]?(Date.parse(s.dates[index]+'T00:00:00Z')-start)/(end-start):index/52)*gw,y:top+gh-value/max*gh}));points.push(...ps);
      if(!ps.length)return;
      if(s.latest){ctx.beginPath();ctx.moveTo(ps[0].x,top+gh);for(const p of ps)ctx.lineTo(p.x,p.y);ctx.lineTo(ps.at(-1).x,top+gh);ctx.closePath();ctx.fillStyle='#0088ff10';ctx.fill();}
      ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=s.color;ctx.lineWidth=s.latest?3:2;ctx.setLineDash(s.dash);ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();ctx.setLineDash([]);
      const p=ps.at(-1);ctx.beginPath();ctx.arc(p.x,p.y,s.latest?4.5:3.5,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
    });ctx.restore();return{points,series,width,height,left,right,top,bottom,max};
  }
  drawArtistSelectedYearTrend=function(artist){
    const source=dashboards[detailScopeCode]?.[detailChartCode]||dashboard,series=artistLineSeries(artist,source),canvas=q('#yearTrend'),ratio=devicePixelRatio||1,width=Math.max(canvas.parentElement.clientWidth,280),height=innerWidth<700?300:325;
    canvas.width=Math.round(width*ratio);canvas.height=height*ratio;canvas.style.width=width+'px';canvas.style.height=height+'px';const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);artistLineMeta=paintArtistLines(ctx,series,width,height);
    activeYearTrendArtist=artist;activeArtistYearSeries=series;
    q('#detailDialog .trend-panel h3').textContent='年ごとの累積ランクイン推移';const legend=q('#detailDialog .trend-legend');legend.classList.add('artist-line-legend');
    legend.innerHTML=series.map(s=>`<span class="artist-year-key${s.latest?' is-latest':''}"><span><i style="background:${s.color}"></i>${s.year}年</span><strong>${(s.values.at(-1)||0).toLocaleString('ja-JP')}<small>回</small></strong></span>`).join('');
    let note=q('#artistPeriodNote');if(!note){note=document.createElement('p');note.id='artistPeriodNote';note.className='artist-period-note';canvas.parentElement.before(note);}
    note.textContent=`縦軸は累積回数、横軸は月。${String(source.latestDate).slice(0,4)}年は${source.latestDate.replaceAll('-','.')}まで。`;
    let table=q('#artistPeriodData');if(!table){table=document.createElement('details');table.id='artistPeriodData';table.className='artist-period-data';canvas.parentElement.after(table);}
    table.innerHTML='<summary>週別の累積値を見る</summary><div class="table-wrap"><table><thead><tr><th>年</th><th>公開日</th><th>累積登場数</th></tr></thead><tbody>'+series.flatMap(s=>s.values.map((v,i)=>`<tr><td>${s.year}</td><td>${s.dates[i]||'第'+(i+1)+'週'}</td><td>${v}回</td></tr>`)).join('')+'</tbody></table></div>';
    canvas.tabIndex=0;canvas.setAttribute('aria-label',series.map(s=>s.year+'年 '+(s.values.at(-1)||0)+'回').join('。')+'。共通目盛りの累積折れ線グラフ。左右キーで公開週を移動。');canvas.dataset.series=JSON.stringify(series.map(s=>({year:s.year,total:s.values.at(-1)||0,sum:s.values.at(-1)||0,points:s.values.length,type:'cumulative-line'})));q('#yearTrendTooltip')?.setAttribute('hidden','');
  };
  const yearCanvas=q('#yearTrend');for(const fn of [showArtistTrendTooltip,showArtistRangeTooltip,showArtistSelectedYearTooltip]){yearCanvas.removeEventListener('pointermove',fn);yearCanvas.removeEventListener('click',fn);}
  function showArtistLinesAt(x){
    if(!artistLineMeta)return;const m=artistLineMeta,fraction=Math.max(0,Math.min(1,(x-m.left)/(m.width-m.left-m.right))),tooltip=ensureChartTooltip(yearCanvas.parentElement,'yearTrendTooltip'),generic=new Date(Date.UTC(2025,0,1)+fraction*(Date.UTC(2026,0,1)-Date.UTC(2025,0,1)));
    tooltip.innerHTML=`<div class="chart-tooltip-title">${generic.getUTCMonth()+1}月${generic.getUTCDate()}日頃</div>`+m.series.map((s,row)=>{const points=m.points.filter(p=>p.row===row);let nearest=points[0];for(const p of points)if(Math.abs(p.x-x)<Math.abs((nearest||p).x-x))nearest=p;const past=nearest&&x>points.at(-1).x+7/(Number(s.year)%4===0?366:365)*(m.width-m.left-m.right);return`<div class="chart-tooltip-row"><span><i class="chart-tooltip-dot" style="background:${s.color}"></i>${s.year}年</span><strong>${!nearest||past?'集計期間外':nearest.value+'回'}<small>${!nearest||past?'':nearest.date.slice(5).replace('-','/')}</small></strong></div>`;}).join('');tooltip.hidden=false;positionChartTooltip(tooltip,yearCanvas,x,22);
  }
  const artistLinePointer=e=>{const b=yearCanvas.getBoundingClientRect();showArtistLinesAt((e.clientX-b.left)/b.width*yearCanvas.clientWidth);};yearCanvas.addEventListener('pointermove',artistLinePointer);yearCanvas.addEventListener('click',artistLinePointer);
  let lineWeek=0;yearCanvas.addEventListener('keydown',e=>{if(!artistLineMeta||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const ps=artistLineMeta.points.filter(p=>p.row===artistLineMeta.series.length-1);lineWeek=Math.max(0,Math.min(ps.length-1,lineWeek+(e.key==='ArrowRight'?1:-1)));showArtistLinesAt(ps[lineWeek]?.x||artistLineMeta.left);});
  drawArtistGraphShare=function(context,artist,selectedDashboard){graphArea(context,artist.artist,selectedDashboard.chartName+' / 年ごとの累積ランクイン推移');const series=artistLineSeries(artist,selectedDashboard);context.save();context.font='600 17px sans-serif';series.forEach((s,i)=>{const x=90+i*340;context.fillStyle=s.color;context.fillRect(x,260,26,4);context.fillStyle='#3a3a3c';context.fillText(s.year+'年  '+(s.values.at(-1)||0)+'回',x+36,268);});context.restore();paintArtistLines(context,series,1040,270,80,290);context.font='15px sans-serif';context.textAlign='left';context.fillStyle='#6e6e73';context.fillText('各年1月〜12月。'+String(selectedDashboard.latestDate).slice(0,4)+'年は'+selectedDashboard.latestDate+'公開分まで。',80,598);};
  drawYearTrend=(...args)=>drawArtistSelectedYearTrend(...args);

  setupCompareCanvas=function(){const canvas=q('#compareCanvas'),ratio=devicePixelRatio||1,width=Math.max(canvas.parentElement.clientWidth,280),height=innerWidth<720?330:430;canvas.width=Math.round(width*ratio);canvas.height=height*ratio;canvas.style.width=width+'px';canvas.style.height=height+'px';const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);return{canvas,context,width,height,left:52,right:24,top:24,bottom:48};};
  // Comparisons: shared graph styling, explicit series keys, optional line emphasis.
  compareColors.splice(0,compareColors.length,'#0088ff','#e87500','#af52de','#008c95','#e63b7a','#5856d6','#ff383c','#8c6d46','#248a3d','#b58a00');
  let comparisonRecords=[],focusedSeries=null;
  const picker=document.createElement('details');picker.className='compare-picker';picker.id='comparePicker';picker.open=innerWidth>700;picker.innerHTML='<summary>比較対象を追加・変更</summary>';const sidebar=q('.compare-sidebar');sidebar.before(picker);picker.append(sidebar);
  q('#compareSelected').before(Object.assign(document.createElement('h3'),{className:'compare-picker-title',textContent:'選択中'}));
  q('#compareResults').before(Object.assign(document.createElement('h3'),{className:'compare-picker-title',textContent:'検索結果'}));
  const edit=document.createElement('button');edit.id='compareEdit';edit.type='button';edit.className='compare-edit';edit.textContent='対象を追加・変更';q('.compare-toolbar').after(edit);edit.addEventListener('click',()=>{picker.open=true;picker.scrollIntoView({block:'nearest',behavior:'smooth'});q('#compareSearch').focus({preventScroll:true});});
  const instructions=document.createElement('p');instructions.id='compareInstructions';instructions.className='compare-instructions';q('.compare-canvas-wrap').before(instructions);
  q('.compare-canvas-wrap').before(q('#compareLegend'));
  const basePicker=renderComparePicker;renderComparePicker=function(...args){basePicker.apply(this,args);const items=compareItems[compareType];q('.compare-layout').classList.toggle('is-empty',!items.length);if(!items.length)picker.open=true;qa('#compareSelected .compare-chip').forEach((chip,i)=>{chip.style.setProperty('--series-color',compareColors[i]);chip.querySelector('.compare-name')?.insertAdjacentHTML('afterbegin',`<span class="compare-item-number">${i+1}</span>`);});};
  function comparisonKey(records){
    q('#compareLegend').innerHTML=records.map((r,i)=>{const name=compareType==='artist'?r.item.name:r.item.title,sub=compareType==='artist'?`${chartLabel(compareChart)} · ${compareArtistYear}年`:`${r.item.artist} · ${chartLabel(r.item.chart||compareChart)}`;return`<span class="series-key${focusedSeries===i?' is-focused':''}" role="button" tabindex="0" data-series-focus="${i}" aria-pressed="${focusedSeries===i}"><i style="background:${compareColors[i]}"></i><span class="compare-series-text">${i+1}. ${safe(name)}<small>${safe(sub)}</small></span></span>`;}).join('');
  }
  function focusKey(index){focusedSeries=focusedSeries===index?null:index;if(compareType==='artist')drawArtistComparison(comparisonRecords);else drawSongComparison(comparisonRecords);q(`[data-series-focus="${index}"]`)?.focus({preventScroll:true});}
  q('#compareLegend').addEventListener('click',e=>{const key=e.target.closest('[data-series-focus]');if(key)focusKey(Number(key.dataset.seriesFocus));});
  q('#compareLegend').addEventListener('keydown',e=>{const key=e.target.closest('[data-series-focus]');if(key&&['Enter',' '].includes(e.key)){e.preventDefault();focusKey(Number(key.dataset.seriesFocus));}});
  function prepareComparison(records){comparisonRecords=records;if(focusedSeries>=records.length)focusedSeries=null;const box=setupCompareCanvas();box.right=box.width>=700?120:24;box.context.font='12px sans-serif';box.context.lineCap='round';box.context.lineJoin='round';return box;}
  function gridComparison(box,ticks,yFor,xLabels){const{context:ctx,left,right,width,height,bottom}=box;ctx.lineWidth=1;ctx.font='12px sans-serif';for(const [value,label]of ticks){const y=yFor(value);ctx.strokeStyle='#e5e5ea';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.fillStyle='#77777f';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(label,left-9,y);}for(const [x,label]of xLabels){ctx.fillStyle='#77777f';ctx.textAlign='center';ctx.textBaseline='top';const half=ctx.measureText(label).width/2;ctx.fillText(label,Math.max(half+4,Math.min(width-half-4,x)),height-bottom+13);}}
  function lineAppearance(ctx,index){ctx.globalAlpha=focusedSeries===null||focusedSeries===index?1:.16;ctx.strokeStyle=compareColors[index];ctx.fillStyle=compareColors[index];ctx.lineWidth=focusedSeries===index?3.5:2.5;ctx.setLineDash([]);}
  function endpointLabels(box,ends){if(box.width<700)return;const ctx=box.context,usable=box.height-box.bottom-box.top,sorted=ends.filter(e=>focusedSeries===null||e.index===focusedSeries).sort((a,b)=>a.y-b.y);let last=box.top-24;for(const e of sorted){e.labelY=Math.max(e.y,last+22);last=e.labelY;}if(sorted.length){const excess=sorted.at(-1).labelY-(box.top+usable-5);if(excess>0)sorted.forEach(e=>e.labelY-=excess);}ctx.save();ctx.font='12px sans-serif';for(const e of sorted){const y=Math.max(box.top+7,e.labelY),x=box.width-box.right+12;ctx.strokeStyle='#a1a1a6';ctx.setLineDash([]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(x-4,y);ctx.stroke();ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#48484a';ctx.fillText(clipCanvasText(ctx,e.label,box.right-20),x,y);}ctx.restore();}
  drawArtistComparison=function(records){
    comparisonRecords=records;if(!records.length){activeCompareHover=null;drawCompareEmpty('比較するアーティストを追加してください');q('#compareLegend').innerHTML='';q('#compareSummary').innerHTML='';instructions.textContent='対象を選ぶと、累積ランクイン回数を同じ目盛りで比較できます。';return;}
    const box=prepareComparison(records),{context:ctx,width,height,left,right,top,bottom}=box,gw=width-left-right,gh=height-top-bottom,series=records.map(r=>({label:r.item.name,values:artistCumulativeForYear(r.source?.artist||{},compareArtistYear)})),maximum=Math.max(1,...series.flatMap(s=>s.values)),unit=Math.pow(10,Math.floor(Math.log10(maximum/4))),tick=Math.max(1,Math.ceil(maximum/4/unit)*unit),rounded=tick*4,y=v=>top+gh-v/rounded*gh,x=i=>left+i/52*gw;
    gridComparison(box,Array.from({length:5},(_,i)=>[tick*i,String(tick*i)]),y,(width<450?[1,26,53]:[1,13,26,39,53]).map(w=>[x(w-1),'第'+w+'週']));
    const ends=[];series.forEach((s,i)=>{if(!s.values.length)return;lineAppearance(ctx,i);ctx.beginPath();s.values.forEach((v,j)=>j?ctx.lineTo(x(j),y(v)):ctx.moveTo(x(j),y(v)));ctx.stroke();ctx.setLineDash([]);const j=s.values.length-1;ctx.beginPath();ctx.arc(x(j),y(s.values[j]),4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();ends.push({index:i,x:x(j),y:y(s.values[j]),label:s.label});});ctx.globalAlpha=1;ctx.setLineDash([]);
    activeCompareHover={mode:'artist',series,left,right,top,bottom,rounded};endpointLabels(box,ends);comparisonKey(records);
    instructions.textContent='縦軸：累積ランクイン回数 / 横軸：年内の公開週。名前を押すと対応する線を強調します。';
    q('#compareSummary').innerHTML='<div class="compare-summary-table"><table><thead><tr><th>対象</th><th>累積登場数</th><th>集計週数</th></tr></thead><tbody>'+series.map((s,i)=>`<tr><td><i style="background:${compareColors[i]}"></i>${safe(s.label)}</td><td>${s.values.length?s.values.at(-1)+'回':'—'}</td><td>${s.values.length?s.values.length+'週':'記録なし'}</td></tr>`).join('')+'</tbody></table></div>';
    q('#compareCanvas').setAttribute('aria-label',compareArtistYear+'年の累積ランクイン回数の折れ線比較。凡例から線を強調できます。');
  };
  drawSongComparison=function(records){
    comparisonRecords=records;if(!records.length){activeCompareHover=null;drawCompareEmpty('比較する楽曲を追加してください');q('#compareLegend').innerHTML='';q('#compareSummary').innerHTML='';instructions.textContent='楽曲を選ぶと順位推移を比較できます。';return;}
    const box=prepareComparison(records),{context:ctx,width,height,left,right,top,bottom}=box,gw=width-left-right,gh=height-top-bottom,histories=records.map(r=>({label:r.item.title+' / '+r.item.artist,shortLabel:r.item.title,artist:r.item.artist,chart:chartLabel(r.item.chart||compareChart),history:comparisonSongHistory(r.source?.song)})),firstTimes=histories.map(s=>s.history.length?Date.parse(s.history[0].date+'T00:00:00Z'):0),all=histories.flatMap(s=>s.history.map(p=>Date.parse(p.date+'T00:00:00Z')));
    if(!all.length){activeCompareHover=null;drawCompareEmpty('選択した期間の順位データがありません');comparisonKey(records);q('#compareSummary').innerHTML='';return;}
    const minimum=compareSongAxis==='calendar'?Math.min(...all):0,maximum=compareSongAxis==='calendar'?Math.max(...all):Math.max(1,...histories.flatMap((s,i)=>s.history.map(p=>Math.round((Date.parse(p.date+'T00:00:00Z')-firstTimes[i])/604800000)))),span=Math.max(1,maximum-minimum),value=(p,i)=>compareSongAxis==='calendar'?Date.parse(p.date+'T00:00:00Z'):Math.round((Date.parse(p.date+'T00:00:00Z')-firstTimes[i])/604800000),x=v=>left+(v-minimum)/span*gw,y=rank=>top+(rank-1)/99*gh;
    ctx.fillStyle='#edf5ff';ctx.fillRect(left,top,gw,y(10)-top);
    const xLabels=Array.from({length:width<450?3:4},(_,i,a)=>{const t=i/Math.max(1,(width<450?3:4)-1),v=minimum+span*t;return[left+gw*t,compareSongAxis==='calendar'?new Date(v).toISOString().slice(0,7).replace('-','/'):'第'+(Math.round(v)+1)+'週'];});
    gridComparison(box,[1,10,25,50,75,100].map(v=>[v,v+'位']),y,xLabels);
    const ends=[];histories.forEach((s,i)=>{if(!s.history.length)return;lineAppearance(ctx,i);ctx.beginPath();s.history.forEach((p,j)=>{const xx=maximum===minimum?left+gw/2:x(value(p,i)),yy=y(p.rank),gap=j&&Date.parse(p.date)-Date.parse(s.history[j-1].date)>9*86400000;if(!j||gap)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();ctx.setLineDash([]);s.history.forEach((p,j)=>{if(s.history.length>100&&j!==s.history.length-1)return;ctx.beginPath();ctx.arc(maximum===minimum?left+gw/2:x(value(p,i)),y(p.rank),focusedSeries===i?3:s.history.length>50?1.7:2.5,0,Math.PI*2);ctx.fill();});const last=s.history.at(-1);ends.push({index:i,x:maximum===minimum?left+gw/2:x(value(last,i)),y:y(last.rank),label:s.shortLabel});});ctx.globalAlpha=1;ctx.setLineDash([]);
    activeCompareHover={mode:'song',histories,firstTimes,minimum,maximum,left,right,top,bottom};endpointLabels(box,ends);comparisonKey(records);instructions.textContent='上にあるほど上位。ランク外の期間は線をつなぎません。名前を押すと対応する線を強調します。';
    q('#compareSummary').innerHTML='<div class="compare-summary-table"><table><thead><tr><th>楽曲</th><th>最高順位</th><th>登場回数</th></tr></thead><tbody>'+histories.map((s,i)=>`<tr><td><i style="background:${compareColors[i]}"></i>${safe(s.shortLabel)}<small>${safe(s.artist)}</small></td><td>${s.history.length?Math.min(...s.history.map(p=>p.rank))+'位':'—'}</td><td>${s.history.length}回</td></tr>`).join('')+'</tbody></table></div>';q('#compareCanvas').setAttribute('aria-label','楽曲の順位推移を折れ線で比較。1位が上。凡例から線を強調できます。');
  };
  const comparePlot=q('#compareCanvas');for(const fn of [showCompareTooltip,showCompareTooltipAccurate]){comparePlot.removeEventListener('pointermove',fn);comparePlot.removeEventListener('pointerdown',fn);}comparePlot.addEventListener('pointermove',showCompareTooltipAccurate);comparePlot.addEventListener('pointerdown',showCompareTooltipAccurate);

  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){qa('.top nav a').forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+entry.target.id));}},{rootMargin:'-15% 0px -65% 0px',threshold:0});
  const sheetObserver=new MutationObserver(entries=>{for(const entry of entries){const dialog=entry.target;if(dialog.open)requestAnimationFrame(()=>{dialog.scrollTo({top:0,behavior:'instant'});dialog.querySelector('.modal-body')?.scrollTo({top:0,behavior:'instant'});});}});
  qa('dialog').forEach(dialog=>sheetObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
  qa('main>section[id]').forEach(s=>observer.observe(s));q('.top nav a').classList.add('is-current');
  let resized;addEventListener('resize',()=>{clearTimeout(resized);resized=setTimeout(()=>{drawWeekly();if(q('#detailDialog').open&&typeof activeYearTrendArtist!=='undefined'&&activeYearTrendArtist)drawArtistSelectedYearTrend(activeYearTrendArtist);if(q('#songDialog').open&&activeSongTrendHistory?.length)drawSongRankTrend(activeSongTrendHistory);if(q('#compareDialog').open)renderComparison().catch(showDataError);},150);});
})();
