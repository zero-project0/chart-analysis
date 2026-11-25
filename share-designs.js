/* Selected share layouts: artist A, song C. Uses the selected chart and period. */
(()=>{
  'use strict';
  const font='Meiryo,"Yu Gothic UI",sans-serif',ink='#24211d',muted='#777168',blue='#0088ff',seriesColors=['#8e8e93','#af52de',blue];
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
  function compactHeader(draw,source,title,subtitle,jacket=null){
    const {rect,text}=draw;rect(0,0,1200,675,'#fafafa');rect(24,18,1152,639,'#fff',20);rect(60,18,1080,7,'#b8ff25');
    text('MUSIC CHART ANALYSIS',60,38,19,'#64665f',true);text(source.latestDate.replaceAll('-','.')+' 公開分',1140,38,20,'#64665f',false,320,'right');
    const tx=jacket?225:60; if(jacket)window.SongJackets.paint(draw.ctx,jacket,60,91,132);text(title,tx,103,jacket?48:54,'#171915',true,1140-tx);text(subtitle,tx,179,jacket?22:25,'#64665f',false,1140-tx);
  }
  function compactFooter(draw,source,label,dates){
    const {line,text}=draw;line(60,597,1140,597,'#e5e5e8');const range=dates.length?dates[0].replaceAll('-','.')+' — '+dates.at(-1).replaceAll('-','.'):'対象期間に記録なし';text(source.chartName+' / '+label+' / '+range,60,620,19,'#64665f',false,780);text('出典：Billboard JAPAN',1140,620,19,'#64665f',false,280,'right');
  }
  function summaryValue(draw,value,x,y,size,color,width){
    const parts=String(value).match(/^(\d+)(.*)$/);if(!parts){draw.text(value,x,y,size,color,true,width);return;}
    const unit=parts[2];let numberWidth;
    do{draw.ctx.font='700 '+size+'px '+font;numberWidth=draw.ctx.measureText(parts[1]).width;if(numberWidth+(unit?64:0)<=width)break;size--;}while(size>20);
    draw.text(parts[1],x,y,size,color,true,width);if(unit)draw.text(unit,x+numberWidth+10,y+size-32,28,color,true,54);
  }
  function chart(draw,series,area,{rank=false,axis=100,calendar=false,surface='#f7f4ed',tickSize=16,sparseDates=false}={}){
    const {ctx,text,line,rect}=draw;rect(area.x,area.y,area.w,area.h,surface);
    const yFor=value=>area.y+(rank?(value-1)/(axis-1):1-value/axis)*area.h;
    const ticks=rank?(axis===10?[1,5,10]:[1,25,50,75,100]):[...new Set(Array.from({length:5},(_,i)=>Math.round(axis*i/4)))];
    ticks.forEach(v=>{const y=yFor(v);line(area.x,y,area.x+area.w,y);text(String(v),area.x-15,y-tickSize/2,tickSize,muted,false,65,'right');});
    const all=series.flatMap(s=>s.points);if(!all.length){text('この期間の記録はありません',area.x+30,area.y+90,24,muted);return;}
    const min=Math.min(...all.map(p=>Date.parse(p.date))),max=Math.max(...all.map(p=>Date.parse(p.date))),span=Math.max(1,max-min);
    const singleWeek=min===max;
    const xFor=p=>singleWeek?area.x+area.w/2:calendar?area.x+(Date.parse(p.date)-Date.UTC(Number(p.date.slice(0,4)),0,1))/(Date.UTC(Number(p.date.slice(0,4))+1,0,1)-Date.UTC(Number(p.date.slice(0,4)),0,1))*area.w:area.x+(Date.parse(p.date)-min)/span*area.w;
    series.forEach(s=>{const ps=s.points;if(!ps.length)return;ctx.beginPath();ps.forEach((p,i)=>{const x=xFor(p),y=yFor(p.value),gap=i?Date.parse(p.date)-Date.parse(ps[i-1].date):0;if(!i||rank&&gap>9*86400000)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle=s.color;ctx.lineWidth=s.color===blue?4:3;ctx.lineJoin='round';ctx.stroke();if(!rank){const end=ps.at(-1);ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(xFor(end),yFor(end.value),4,0,Math.PI*2);ctx.fill();}});
    if(rank)series.forEach(s=>s.points.forEach(p=>{ctx.beginPath();ctx.arc(xFor(p),yFor(p.value),4,0,Math.PI*2);ctx.fillStyle=p.value<=10?s.color:'#fff';ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.fill();ctx.stroke();}));
    if(singleWeek){const date=new Date(min);text((date.getUTCMonth()+1)+'/'+date.getUTCDate(),area.x+area.w/2,area.y+area.h+15,tickSize,muted,false,100,'center');}
    else if(sparseDates){const dates=[...new Set(all.map(p=>p.date))].sort(),indices=[...new Set([0,Math.floor((dates.length-1)/2),dates.length-1])];indices.forEach(i=>{const date=new Date(dates[i]),x=xFor({date:dates[i]});text((date.getUTCMonth()+1)+'/'+date.getUTCDate(),x,area.y+area.h+15,tickSize,muted,false,110,'center');});}
    else if(calendar)[1,4,7,10,12].forEach(month=>text(month+'月',area.x+(month-1)/12*area.w,area.y+area.h+15,16,muted));
    else{const totalMonths=(new Date(max).getUTCFullYear()-new Date(min).getUTCFullYear())*12+new Date(max).getUTCMonth()-new Date(min).getUTCMonth();if(totalMonths<15){const ticks=[];let date=new Date(min);date=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1));while(+date<max){ticks.push(+date);date=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1));}const every=Math.max(1,Math.ceil(ticks.length/3));text(new Date(min).getUTCMonth()+1+'月',area.x,area.y+area.h+15,16,muted);ticks.filter((_,i)=>i%every===every-1).forEach(v=>{const x=area.x+(v-min)/span*area.w;if(x<area.x+area.w-45)text(new Date(v).getUTCMonth()+1+'月',x,area.y+area.h+15,16,muted);});}else{for(let i=0;i<4;i++){const date=new Date(min+span*i/3);text(date.getUTCFullYear()+'/'+(date.getUTCMonth()+1),area.x+area.w*i/3,area.y+area.h+15,15,muted,false,100,i===3?'right':'left');}}}
  }
  function metrics(draw,list){list.forEach(([label,value],i)=>{const x=64+i*270;draw.rect(x,335,250,142,'#f3f0e9',10);draw.rect(x,335,250,5,'#b8ff25');draw.text(label,x+18,360,18,muted,true,214);draw.text(value,x+18,403,37,ink,true,214);});}
  // Adopted Apple Design proposal: image and metrics are separate, facts lead.
  window.paintChosenArtistShare=(canvas,artist,selected,source,period,view)=>{
    const recent=period==='recent',year=String(source.latestDate).slice(0,4),draw=setup(canvas,source,''),{ctx,text,line,rect}=draw;
    const label=recent?(Number(year)-2)+'〜'+year+'年':period==='all'?'全期間':year+'年';
    const api=window.SongJackets,photo=api?.getArtistPhoto?.(artist.artist),chartName=source.chartName.replace(/^Billboard Japan /i,'');
    const allDates=[...new Set(Object.values(source.publicationDates||{}).flat())].sort();
    const selectedDates=allDates.filter(d=>period==='all'||(recent?Number(d.slice(0,4))>=Number(year)-2&&Number(d.slice(0,4))<=Number(year):d.startsWith(year)));
    rect(0,0,1200,675,'#fff');rect(0,0,1200,4,'#b8ff25');
    text('MUSIC CHART ANALYSIS',48,27,17,'#64665f',true);text(source.latestDate.replaceAll('-','.')+' 公開分まで',1152,26,18,'#64665f',false,360,'right');
    const headPhoto=view==='graph'&&photo,headX=headPhoto?146:48;
    if(headPhoto)api.paint(ctx,photo,48,72,76);
    text(artist.artist,headX,74,43,'#171915',true,1152-headX);
    text(chartName+' / '+(view==='summary'?label+'のランクイン実績':recent?'年別の累積登場回数':label+'の累積登場回数'),headX,132,22,'#64665f',false,1152-headX);
    let series=[];
    const topSongs=[...selected.songs].sort((a,b)=>b.appearances-a.appearances||a.title.localeCompare(b.title,'ja')).slice(0,3);
    if(view==='summary'){
      if(photo){rect(48,180,292,330,'#f5f5f7',24);api.paint(ctx,photo,70,200,248);text(artist.artist,194,473,22,'#64665f',true,248,'center');}
      [['累積登場回数',selected.appearances,'回'],['登場週数',selected.weeks,'週'],['ランクイン楽曲数',selected.songs.length,'曲'],['TOP10入り',selected.top10,'回']].forEach(([name,value,unit],i)=>{
        const x=photo?372+(i%2)*402:48+(i%2)*564,y=180+Math.floor(i/2)*174,w=photo?378:540;
        rect(x,y,w,156,i===0?'#efffcf':'#f5f5f7',24);text(name,x+26,y+21,23,'#64665f');
        let size=82,number=Number(value).toLocaleString();ctx.font='700 '+size+'px Arial,'+font;while(ctx.measureText(number).width>w-100&&size>30){size--;ctx.font='700 '+size+'px Arial,'+font;}
        const numberWidth=ctx.measureText(number).width;ctx.fillStyle=i===0?'#425b16':'#171915';ctx.fillText(number,x+23,y+61);text(unit,x+numberWidth+37,y+size+32,27,i===0?'#425b16':'#171915',true,48);
      });
      text(topSongs.length?'楽曲別登場回数 上位'+topSongs.length+'曲（'+label+'）':'対象期間の楽曲別記録はありません',48,525,20,'#171915',true,780);text('1曲×1週＝1回',1152,527,17,'#64665f',false,300,'right');
      topSongs.forEach((song,i)=>{const x=48+i*375,item=api?.get(artist.artist,song.title),hasArt=item&&api.paint(ctx,item,x,557,38),tx=x+(hasArt?51:0);text(song.title,tx,554,20,'#171915',true,x+354-tx);text(song.appearances.toLocaleString()+'回',tx,580,17,'#64665f',false,300);});
    }else{
      if(recent){series=Array.from({length:3},(_,i)=>{const yr=String(Number(year)-2+i),counts=new Map();(artist.allSongs||artist.songs||[]).forEach(song=>(song.allTimeHistory||song.history||[]).filter(p=>p.date.startsWith(yr)).forEach(p=>counts.set(p.date,(counts.get(p.date)||0)+1)));let total=0;return{year:yr,color:seriesColors[i],points:allDates.filter(d=>d.startsWith(yr)).map(date=>({date,value:total+=counts.get(date)||0}))};});}
      else{const counts=new Map();selected.songs.forEach(song=>song.history.forEach(p=>counts.set(p.date,(counts.get(p.date)||0)+1)));let total=0;series=[{year:label,color:blue,points:selectedDates.map(date=>({date,value:total+=counts.get(date)||0}))}];}
      series.forEach((s,i)=>{const x=48+i*375,w=series.length>1?354:1104;rect(x,175,w,70,'#f5f5f7',18);text(s.year+(recent?'年':''),x+20,198,24,'#64665f',false,series.length>1?130:700);text((s.points.at(-1)?.value||0).toLocaleString()+'回',x+w-20,190,38,s.color,true,series.length>1?180:330,'right');});
      const maximum=Math.max(1,...series.flatMap(s=>s.points.map(p=>p.value))),step=maximum>100?50:maximum>20?10:5,axis=Math.ceil(maximum/step)*step;
      chart(draw,series,{x:111,y:281,w:989,h:246},{axis,calendar:recent,surface:'#fff',tickSize:19});
      text(recent?String(Number(year)-2)+'・'+String(Number(year)-1)+'年：年間集計 / '+year+'年：'+source.latestDate.replaceAll('-','.')+' 公開分まで':'1曲×1週＝1回。同じ週の複数曲は別々に加算。',48,580,18,'#64665f',false,1104);
    }
    line(48,611,1152,611,'#e1e4de',1);const range=selectedDates.length?selectedDates[0].replaceAll('-','.')+' — '+selectedDates.at(-1).replaceAll('-','.')+' 公開分':'対象期間に記録なし';text(range,48,632,18,'#64665f',false,620);text('出典：Billboard JAPAN',962,632,17,'#64665f',false,270,'right');
    window.drawImageSignature(ctx,{right:48,bottom:26});
    canvas.dataset.shareDesign=view==='summary'?'artist-summary-apple-design':'artist-graph-apple-design';canvas.dataset.artistPhoto=photo?.uri||'';canvas.dataset.jacketCount=String(view==='summary'?topSongs.filter(song=>api?.get(artist.artist,song.title)).length:0);canvas.dataset.shareTopSongs=JSON.stringify(topSongs.map(song=>({title:song.title,count:song.appearances})));canvas.dataset.shareMetrics=JSON.stringify({chart:source.chartName,period,total:selected.appearances,weeks:selected.weeks,songs:selected.songs.length,top10:selected.top10,series:series.map(s=>({year:s.year,total:s.points.at(-1)?.value||0}))});
  };
  window.paintChosenSongShare=(canvas,song,source,period,view)=>{
    const draw=setup(canvas,source,''),{ctx,text,line,rect}=draw,year=String(source.latestDate).slice(0,4),label=period==='all'?'全期間':year+'年',history=[...(song.history||[])].sort((a,b)=>a.date.localeCompare(b.date));
    rect(0,0,1200,675,'#fafafa');rect(24,18,1152,639,'#fff',20);rect(60,18,1080,7,'#b8ff25');
    text('MUSIC CHART ANALYSIS',60,38,19,'#64665f',true);text(source.latestDate.replaceAll('-','.')+' 公開分',1140,38,20,'#64665f',false,320,'right');
    const jacket=window.SongJackets?.get(song.artist,song.title),tx=jacket?225:60;if(jacket)window.SongJackets.paint(ctx,jacket,60,91,132);text(song.title,tx,100,jacket?41:51,'#171915',true,580-tx);text(song.artist,tx,159,25,'#64665f',false,580-tx);text(source.chartName+' / '+label,tx,199,20,'#64665f',false,580-tx);
    if(view==='graph'){
      rect(614,96,168,100,'#efffcf',14);
      [['最新',song.latestRank==null?'—':song.latestRank+'位'],['最高',song.best==null?'—':song.best+'位'],['登場',(song.weeks??new Set(history.map(p=>p.date)).size)+'週']].forEach(([name,value],i)=>{const x=630+i*180;text(name,x,109,21,'#64665f');text(value,x,146,38,i?'#171915':'#425b16',true,150);});
      const axis=100,area={x:105,y:269,w:930,h:240};
      chart(draw,[{color:blue,points:history.map(p=>({date:p.date,value:p.rank}))}],area,{rank:true,axis,surface:'#fff',tickSize:22,sparseDates:true});
    }else{
      compactHeader(draw,source,song.title,song.artist+' / 楽曲概要 / '+source.chartName+' / '+label,jacket);
      [['最新順位',song.latestRank==null?'—':song.latestRank+'位'],['最高順位',song.best==null?'—':song.best+'位'],['登場週数',(song.weeks??new Set(history.map(p=>p.date)).size)+'週'],['TOP10入り',song.top10+'回']].forEach(([name,value],i)=>{const x=60+i*280;if(i===0)rect(x-16,247,262,151,'#efffcf',14);text(name,x,265,23,'#64665f');summaryValue(draw,value,x,315,64,i===0?'#425b16':'#171915',240);});
      line(60,439,1140,439,'#e5e5e8');[['初登場',history[0]?.date],['最終登場',history.at(-1)?.date]].forEach(([name,value],i)=>{const x=60+i*580;text(name,x,475,22,'#64665f');text(value?value.replaceAll('-','.'):'—',x,514,32,'#171915',true,500);});
    }
    line(60,597,1140,597,'#e5e5e8');const range=history.length?history[0].date.replaceAll('-','.')+' — '+history.at(-1).date.replaceAll('-','.'):'対象期間に記録なし';text(source.chartName+' / '+label+' / '+range,60,620,19,'#64665f',false,625);text('出典：Billboard JAPAN',950,620,19,'#64665f',false,250,'right');
    window.drawImageSignature(ctx,{right:60,bottom:36});
    if(jacket)window.SongJackets.paintCredit(ctx,jacket,825,555,315);canvas.dataset.shareDesign='song-C';canvas.dataset.jacketUri=jacket?.uri||'';canvas.dataset.shareMetrics=JSON.stringify({chart:source.chartName,period,total:song.appearances,latest:song.latestRank,best:song.best,top10:song.top10});
  };
})();
