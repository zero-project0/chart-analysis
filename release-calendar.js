/* Monthly release browser. No live Spotify requests or changes to chart datasets. */
(()=>{
  'use strict';
  const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g,'');
  const validMonth=s=>/^202[56]-(0[1-9]|1[0-2])$/.test(s||'');
  const validDate=s=>/^202[56]-(0[1-9]|1[0-2])-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const nextMonth=(m,delta)=>{const [y,n]=m.split('-').map(Number),d=new Date(Date.UTC(y,n-1+delta,1));return d.toISOString().slice(0,7);};
  const filter=(rows,state)=>{const q=norm(state.query);return rows.filter(r=>r.date.startsWith(state.month)&&(!state.artist||r.groups.includes(state.artist))&&(!state.type||r.type===state.type)&&(!q||norm([r.title,...r.groups].join(' ')).includes(q)));};
  const pickDate=(month,rows,anchor)=>{const days=[...new Set(rows.map(r=>r.date))].sort();return days.find(d=>d>=anchor)||days.at(-1)||(validDate(anchor)&&anchor.startsWith(month)?anchor:month+'-01');};
  const core={norm,validMonth,validDate,nextMonth,filter,pickDate};
  if(typeof module==='object'&&module.exports){module.exports=core;return;}
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&u.hostname==='open.spotify.com'?u.href:'';}catch{return '';}};
  const coverUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&u.hostname==='i.scdn.co'?u.href:'';}catch{return '';}};
  const typeNames={SINGLE:'シングル',EP:'EP',ALBUM:'アルバム',COMPILATION:'コンピレーション'};
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
  const params=new URLSearchParams(location.search);
  const initialMonth=validMonth(params.get('month'))?params.get('month'):(validMonth(today.slice(0,7))?today.slice(0,7):today<'2025'?'2025-01':'2026-12');
  let data=null,loading=false;
  const state={month:initialMonth,date:params.get('date')||'',artist:params.get('artist')||'',type:params.get('type')||'',query:params.get('q')||''};
  for(let m=1;m<=12;m++)$('releaseMonth').add(new Option(m+'月',String(m).padStart(2,'0')));
  function syncUrl(){
    const p=new URLSearchParams({month:state.month,date:state.date});
    if(state.artist)p.set('artist',state.artist);if(state.type)p.set('type',state.type);if(state.query)p.set('q',state.query);
    history.replaceState(null,'',location.pathname+'?'+p);
  }
  function dayLabel(date){const [y,m,d]=date.split('-').map(Number),w='日月火水木金土'[new Date(Date.UTC(y,m-1,d)).getUTCDay()];return `${y}年${m}月${d}日（${w}）`;}
  function chooseDay(rows){if(!validDate(state.date)||!state.date.startsWith(state.month))state.date=pickDate(state.month,rows,today.startsWith(state.month)?today:state.month+'-01');}
  function renderMonth(){
    if(!data)return;
    const rows=filter(data.releases,state);chooseDay(rows);
    $('releaseYear').value=state.month.slice(0,4);$('releaseMonth').value=state.month.slice(5);
    $('releaseMonthTitle').textContent=Number(state.month.slice(0,4))+'年'+Number(state.month.slice(5))+'月';
    const countArtists=new Set(rows.flatMap(r=>r.groups)).size;
    $('releaseMonthCount').textContent=rows.length+'作品 · '+countArtists+'組';
    $('releasePrevious').disabled=state.month===data.meta.firstMonth;$('releaseNext').disabled=state.month===data.meta.lastMonth;
    $('releaseToday').disabled=!validMonth(today.slice(0,7));
    $('releaseReset').hidden=!(state.artist||state.type||state.query);
    const [y,m]=state.month.split('-').map(Number),offset=new Date(Date.UTC(y,m-1,1)).getUTCDay(),last=new Date(Date.UTC(y,m,0)).getUTCDate();
    const byDay=new Map();for(const r of rows){if(!byDay.has(r.date))byDay.set(r.date,[]);byDay.get(r.date).push(r);}
    let cells='<div class="rc-blank" aria-hidden="true"></div>'.repeat(offset);
    for(let n=1;n<=last;n++){
      const date=state.month+'-'+String(n).padStart(2,'0'),items=byDay.get(date)||[],selected=date===state.date;
      cells+=`<button type="button" class="rc-day" data-release-date="${date}" aria-label="${dayLabel(date)}、${items.length}作品" aria-pressed="${selected}"${date===today?' aria-current="date"':''}><span class="rc-day-top"><span class="rc-date-number">${n}</span>${items.length?`<span class="rc-release-count">${items.length}件</span>`:''}</span>${items.slice(0,2).map(r=>`<span class="rc-day-preview" aria-hidden="true"><b>${esc(r.groups.join(' / '))}</b><span>${esc(r.title)}</span></span>`).join('')}${items.length>2?`<span class="rc-more" aria-hidden="true">ほか${items.length-2}件</span>`:''}</button>`;
    }
    cells+='<div class="rc-blank" aria-hidden="true"></div>'.repeat((7-(offset+last)%7)%7);
    $('releaseDays').innerHTML=cells;renderDay(rows);syncUrl();
  }
  function renderDay(rows){
    const dayRows=rows.filter(r=>r.date===state.date);
    $('releaseDayTitle').textContent=dayLabel(state.date).replace(/^\d{4}年/,'');
    $('releaseDayCount').textContent=dayRows.length+'作品'+(state.artist?' · '+state.artist:'');
    if(!dayRows.length){
      const unresolved=data.artists.find(a=>a.name===state.artist&&!a.idConfirmed);
      $('releaseDayList').innerHTML=`<p class="rc-empty">${unresolved?'このグループのSpotify ID・正規の作品情報は未確認です。':rows.length?'この日に確認済みのリリースはありません。別の日付を選んでください。':'この月・条件で確認済みのリリースはありません。月を変更するか、絞り込みを解除してください。'}</p>`;return;
    }
    $('releaseDayList').innerHTML=dayRows.map(r=>{
      const cover=coverUrl(r.cover),url=safeUrl(r.url),future=r.date>today;
      const tracks=r.versions.map((v,i)=>`<div class="rc-version">${r.versions.length>1?`<a href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener noreferrer">版${i+1} · ${v.trackCount}曲 ↗</a>`:''}<ol>${v.tracks.map(t=>`<li>${esc(t.unannounced?'曲名未公開（'+t.title+'）':t.title)}</li>`).join('')}</ol>${v.complete?'':'<p>曲目は一部のみ取得しています。</p>'}</div>`).join('');
      return `<article class="rc-release"><div class="rc-release-main">${cover?`<img class="rc-cover" src="${esc(cover)}" alt="${esc(r.title)}のジャケット" loading="lazy" referrerpolicy="no-referrer">`:'<div class="rc-cover rc-cover-placeholder" aria-hidden="true">♫</div>'}<div><span class="rc-type">${typeNames[r.type]||esc(r.type)}</span><h3>${esc(r.title)}</h3><p class="rc-group">${esc(r.groups.join(' / '))}</p>${future?'<span class="rc-status">配信予定</span>':r.prereleaseAtCheck?'<span class="rc-status">収集時点で配信予定</span>':''}</div></div><div class="rc-release-actions"><a class="rc-spotify" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="jacket-assets/spotify-logo.svg" alt="Spotify">で開く ↗</a><span class="rc-track-count">${r.trackCount}曲${r.versions.length>1?' · '+r.versions.length+'版':''}</span></div><details class="rc-tracks"><summary>収録曲を見る</summary>${tracks}</details></article>`;
    }).join('');
    $('releaseDayList').querySelectorAll('.rc-cover').forEach(img=>img.addEventListener('error',()=>{const box=document.createElement('div');box.className='rc-cover rc-cover-placeholder';box.textContent='♫';box.setAttribute('role','img');box.setAttribute('aria-label','ジャケットを表示できません');img.replaceWith(box);},{once:true}));
  }
  function applyFilters(){
    if(!data)return;
    state.artist=$('releaseArtist').value;state.type=$('releaseType').value;state.query=$('releaseSearch').value;
    const rows=filter(data.releases,state);
    if(rows.length&&!rows.some(r=>r.date===state.date))state.date=pickDate(state.month,rows,state.date||today);
    renderMonth();
  }
  function moveMonth(month){if(!validMonth(month))return;state.month=month;state.date='';renderMonth();}
  $('releaseFilters').addEventListener('submit',e=>e.preventDefault());
  ['releaseSearch','releaseArtist','releaseType'].forEach(id=>$(id).addEventListener('input',applyFilters));
  $('releaseReset').addEventListener('click',()=>{$('releaseSearch').value='';$('releaseArtist').value='';$('releaseType').value='';applyFilters();});
  $('releasePrevious').addEventListener('click',()=>moveMonth(nextMonth(state.month,-1)));
  $('releaseNext').addEventListener('click',()=>moveMonth(nextMonth(state.month,1)));
  ['releaseYear','releaseMonth'].forEach(id=>$(id).addEventListener('change',()=>moveMonth($('releaseYear').value+'-'+$('releaseMonth').value)));
  $('releaseToday').addEventListener('click',()=>moveMonth(today.slice(0,7)));
  $('releaseDays').addEventListener('click',e=>{const b=e.target.closest('[data-release-date]');if(!b)return;state.date=b.dataset.releaseDate;const previous=$('releaseDays').querySelector('[aria-pressed=true]');if(previous)previous.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');renderDay(filter(data.releases,state));syncUrl();});
  $('releaseDays').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    const b=e.target.closest('[data-release-date]');if(!b)return;e.preventDefault();
    const buttons=[...$('releaseDays').querySelectorAll('button')],i=buttons.indexOf(b),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-i,End:buttons.length-1-i}[e.key];buttons[Math.max(0,Math.min(buttons.length-1,i+delta))].focus();
  });
  async function load(){
    if(loading)return;loading=true;$('releaseLoading').hidden=false;$('releaseError').hidden=true;
    try{
      const response=await fetch('release-calendar-data.json?v=20261117');if(!response.ok)throw Error('HTTP '+response.status);
      const result=await response.json();
      if(!result.meta||!Array.isArray(result.releases)||!Array.isArray(result.artists)||result.releases.some(r=>!validDate(r.date)||!Array.isArray(r.groups)||!Array.isArray(r.versions)))throw Error('Invalid release data');
      data=result;state.artist=data.artists.some(a=>a.name===state.artist)?state.artist:'';state.type=Object.hasOwn(typeNames,state.type)?state.type:'';
      $('releaseArtist').replaceChildren(new Option('すべてのグループ',''),...data.artists.map(a=>new Option(a.name,a.name)).sort((a,b)=>a.text.localeCompare(b.text,'ja')));
      $('releaseArtist').value=state.artist;$('releaseType').value=state.type;$('releaseSearch').value=state.query;
      $('releaseSourceNote').textContent=data.meta.dateMeaning;
      $('releaseCoverageNote').textContent=`対象${data.meta.registeredGroups}組のうち、${data.meta.groupsWithReleases}組・${data.meta.releaseCount}作品を収集。${data.meta.coverageNote}`;
      $('releaseCheckedAt').textContent='情報確認：'+data.meta.checkedAt.slice(0,10).replaceAll('-','.')+' · Spotify上の作品リリース日を表示';
      $('releaseLoading').hidden=true;$('releaseApp').hidden=false;renderMonth();
    }catch(error){console.error('Release calendar:',error);$('releaseLoading').hidden=true;$('releaseError').hidden=false;$('releaseApp').hidden=true;}
    finally{loading=false;}
  }
  $('releaseRetry').addEventListener('click',load);load();
})();
