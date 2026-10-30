/* Selected share layouts: artist A, song B. Uses the selected chart and period. */
(()=>{
  'use strict';
  const font='Meiryo,"Yu Gothic UI",sans-serif',ink='#24211d',muted='#777168',blue='#0088ff',seriesColors=['#98969a','#af52de',blue];
  function setup(canvas,source,kind){
    canvas.width=1200;canvas.height=675;const ctx=canvas.getContext('2d');ctx.textBaseline='top';
    function text(value,x,y,size=22,color=ink,bold=false,max=1072,align='left'){
      value=String(value);ctx.font=(bold?'700 ':'400 ')+size+'px '+font;
      while(ctx.measureText(value).width>max&&size>15){size--;ctx.font=(bold?'700 ':'400 ')+size+'px '+font;}
      if(ctx.measureText(value).width>max){while(value.length&&ctx.measureText(value+'…').width>max)value=value.slice(0,-1);value+='…';}
      ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y);ctx.textAlign='left';
    }
    function line(x1,y1,x2,y2,color='#dedad2',width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    function rect(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
    rect(0,0,1200,675,'#fffdf8');ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.strokeRect(24,24,1152,627);rect(24,24,1152,14,'#b8ff25');rect(64,64,58,58,'#b8ff25');text('JP',93,78,25,ink,true,58,'center');text('MUSIC CHART ANALYSIS',150,66,27,ink,true,720);text(kind,150,105,16,'#557500',true);text(source.latestDate,1136,82,18,muted,true,220,'right');line(64,145,1136,145,'#d9d3c9');
    return{ctx,text,line,rect};
  }
  function footer(draw,period,source,dates){const {line,text}=draw;line(64,592,1136,592,'#d9d3c9');const range=dates.length?dates[0]+'〜'+dates.at(-1):'対象期間に記録なし';text(period+'集計 / '+range+' 公開分',64,604,16,muted,true);text('出典：Billboard JAPAN',64,630,15,muted);text('1曲×1週＝1回',1136,630,15,muted,false,280,'right');}
  function chart(draw,series,area,{rank=false,axis=100,calendar=false}={}){
    const {ctx,text,line,rect}=draw;rect(area.x,area.y,area.w,area.h,'#f7f4ed');
    const yFor=value=>area.y+(rank?(value-1)/(axis-1):1-value/axis)*area.h;
    const ticks=rank?(axis===10?[1,5,10]:[1,25,50,75,100]):[...new Set(Array.from({length:5},(_,i)=>Math.round(axis*i/4)))];
    ticks.forEach(v=>{const y=yFor(v);line(area.x,y,area.x+area.w,y);text(String(v),area.x-15,y-9,16,muted,false,65,'right');});
    const all=series.flatMap(s=>s.points);if(!all.length){text('この期間の記録はありません',area.x+30,area.y+90,24,muted);return;}
    const min=Math.min(...all.map(p=>Date.parse(p.date))),max=Math.max(...all.map(p=>Date.parse(p.date))),span=Math.max(1,max-min);
    const xFor=p=>calendar?area.x+(Date.parse(p.date)-Date.UTC(Number(p.date.slice(0,4)),0,1))/(Date.UTC(Number(p.date.slice(0,4))+1,0,1)-Date.UTC(Number(p.date.slice(0,4)),0,1))*area.w:area.x+(Date.parse(p.date)-min)/span*area.w;
    series.forEach(s=>{const ps=s.points;if(!ps.length)return;ctx.beginPath();ps.forEach((p,i)=>{const x=xFor(p),y=yFor(p.value),gap=i?Date.parse(p.date)-Date.parse(ps[i-1].date):0;if(!i||rank&&gap>9*86400000)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle=s.color;ctx.lineWidth=s.color===blue?4:3;ctx.lineJoin='round';ctx.stroke();const end=ps.at(-1);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(xFor(end),yFor(end.value),4,0,Math.PI*2);ctx.fill();});
    if(calendar)[1,4,7,10,12].forEach(month=>text(month+'月',area.x+(month-1)/12*area.w,area.y+area.h+15,16,muted));
    else{const totalMonths=(new Date(max).getUTCFullYear()-new Date(min).getUTCFullYear())*12+new Date(max).getUTCMonth()-new Date(min).getUTCMonth();if(totalMonths<15){const ticks=[];let date=new Date(min);date=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1));while(+date<max){ticks.push(+date);date=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1));}const every=Math.max(1,Math.ceil(ticks.length/3));text(new Date(min).getUTCMonth()+1+'月',area.x,area.y+area.h+15,16,muted);ticks.filter((_,i)=>i%every===every-1).forEach(v=>{const x=area.x+(v-min)/span*area.w;if(x<area.x+area.w-45)text(new Date(v).getUTCMonth()+1+'月',x,area.y+area.h+15,16,muted);});}else{for(let i=0;i<4;i++){const date=new Date(min+span*i/3);text(date.getUTCFullYear()+'/'+(date.getUTCMonth()+1),area.x+area.w*i/3,area.y+area.h+15,15,muted,false,100,i===3?'right':'left');}}}
  }
  function metrics(draw,list){list.forEach(([label,value],i)=>{const x=64+i*270;draw.rect(x,335,250,142,'#f3f0e9',10);draw.rect(x,335,250,5,'#b8ff25');draw.text(label,x+18,360,18,muted,true,214);draw.text(value,x+18,403,37,ink,true,214);});}
  window.paintChosenArtistShare=(canvas,artist,selected,source,period,view)=>{
    const recent=period==='recent',year=String(source.latestDate).slice(0,4),draw=setup(canvas,source,view==='graph'?'ARTIST GRAPH':'ARTIST PROFILE');
    const label=recent?(Number(year)-2)+'〜'+year+'年':period==='all'?'全期間':year+'年';
    draw.text(source.chartName+' / '+(recent?'年ごとの累積ランクイン推移':label+'の累積ランクイン推移'),64,165,19,muted,true);draw.text(artist.artist,64,202,46,ink,true);
    const allDates=[...new Set(Object.values(source.publicationDates||{}).flat())].sort(),selectedDates=allDates.filter(d=>period==='all'||(recent?Number(d.slice(0,4))>=Number(year)-2:d.startsWith(year)));
    let series;
    if(recent){series=Array.from({length:3},(_,i)=>{const yr=String(Number(year)-2+i),counts=new Map();(artist.allSongs||artist.songs||[]).forEach(s=>(s.allTimeHistory||s.history||[]).filter(p=>p.date.startsWith(yr)).forEach(p=>counts.set(p.date,(counts.get(p.date)||0)+1)));let total=0;return{year:yr,color:seriesColors[i],points:allDates.filter(d=>d.startsWith(yr)).map(date=>({date,value:total+=counts.get(date)||0}))};});}
    else{const counts=new Map();selected.songs.forEach(s=>s.history.forEach(p=>counts.set(p.date,(counts.get(p.date)||0)+1)));let total=0;series=[{year:label,color:blue,points:selectedDates.map(date=>({date,value:total+=counts.get(date)||0}))}];}
    if(view==='summary')metrics(draw,[['累積登場数',selected.appearances+'回'],['登場週',selected.weeks+'週'],['ランクイン楽曲',selected.songs.length+'曲'],['TOP10入り',selected.top10+'回']]);
    else{series.forEach((s,i)=>{const x=88+i*(series.length>1?348:0);draw.line(x,282,x+30,282,s.color,4);draw.text(s.year+(recent?'年':'')+'  '+(s.points.at(-1)?.value||0)+'回',x+42,267,21,ink,true,series.length>1?286:960);});const maximum=Math.max(1,...series.flatMap(s=>s.points.map(p=>p.value))),step=maximum>100?50:maximum>20?10:5,axis=Math.ceil(maximum/step)*step;chart(draw,series,{x:96,y:318,w:1000,h:230},{axis,calendar:recent});}
    canvas.dataset.shareDesign='artist-A';canvas.dataset.shareMetrics=JSON.stringify({chart:source.chartName,period,total:selected.appearances,series:series.map(s=>({year:s.year,total:s.points.at(-1)?.value||0}))});footer(draw,label,source,selectedDates);
  };
  window.paintChosenSongShare=(canvas,song,source,period,view)=>{
    const draw=setup(canvas,source,view==='graph'?'SONG GRAPH':'SONG PROFILE'),year=String(source.latestDate).slice(0,4),label=period==='all'?'全期間':year+'年';draw.text(source.chartName+' / '+label+' 週間順位推移',64,165,19,muted,true);draw.text(song.title,64,202,39,ink,true,760);draw.text(song.artist,836,211,22,muted,true,260,'right');
    [['最新順位',song.latestRank==null?'—':song.latestRank+'位'],['最高順位',song.best==null?'—':song.best+'位'],['TOP10入り',song.top10+'回']].forEach(([label,value],i)=>{draw.rect(888,260+i*99,248,87,'#f3f0e9',9);draw.text(label,907,271+i*99,17,muted,true,210);draw.text(value,907,301+i*99,34,i?ink:blue,true,210);});draw.text(label+' · 登場 '+song.appearances+'回',64,268,23,ink,true,765);
    const history=song.history||[];if(view==='graph'){const axis=Math.max(1,...history.map(p=>p.rank))<=10?10:100;draw.text('縦軸：1〜'+axis+'位',831,294,15,muted,false,220,'right');chart(draw,[{color:blue,points:history.map(p=>({date:p.date,value:p.rank}))}],{x:96,y:318,w:735,h:230},{rank:true,axis});}
    else{draw.text(song.latestRank==null?'最新週のランクインなし':'最新 '+song.latestRank+'位',80,345,48,blue,true,735);draw.text('登場 '+song.weeks+'週',80,425,30,ink,true);draw.text('最終登場 '+(history.at(-1)?.date||'—'),80,493,22,muted);}
    canvas.dataset.shareDesign='song-B';canvas.dataset.shareMetrics=JSON.stringify({chart:source.chartName,period,total:song.appearances,latest:song.latestRank,best:song.best,top10:song.top10});footer(draw,label,source,history.map(p=>p.date));
  };
})();
