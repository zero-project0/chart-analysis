/* Adopted A: intact square artwork with rank, metric, and labels outside it. */
(()=>{
 'use strict';
 function draw(o){
  const {canvas,rows,metric,ranks,annual,streak,liveEntity,liveYear,liveScope,scope,chart,title,model,context,accent,pageIndex,pages,rowArtwork,artwork}=o;
  const W=1800,cols=5,gap=30,left=72,size=(W-left*2-gap*(cols-1))/cols,rowHeight=annual?535:streak?600:535,start=390,H=Math.max(1000,start+Math.ceil(rows.length/cols)*rowHeight+185);
  canvas.width=W;canvas.height=H;canvas.dataset.columns=String(cols);canvas.dataset.layout='jacket-grid-a';
  const ctx=canvas.getContext('2d'),font='Meiryo,"Yu Gothic UI",sans-serif',ink='#171915',muted='#697078';ctx.textBaseline='top';ctx.fillStyle='#f5f6f8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#b8ff25';ctx.fillRect(0,0,W,10);
  function text(value,x,y,size=28,color=ink,bold=false,max=1656){ctx.textAlign='left';ctx.font=`${bold?700:400} ${size}px ${font}`;let label=String(value);while(ctx.measureText(label).width>max&&label.length>1)label=label.slice(0,-1);if(label!==String(value))label=label.slice(0,-1)+'…';ctx.fillStyle=color;ctx.fillText(label,x,y);}
  function lines(value,x,y,width,size=28,maxLines=2,bold=true){ctx.font=`${bold?700:400} ${size}px ${font}`;const output=[];let line='';for(const ch of String(value)){if(line&&ctx.measureText(line+ch).width>width){output.push(line);line='';}line+=ch;}if(line)output.push(line);output.slice(0,maxLines).forEach((line,i)=>text(line+(i===maxLines-1&&output.length>maxLines?'…':''),x,y+i*(size+10),size,ink,bold,width));}
  text('MUSIC CHART ANALYSIS',left,48,28,muted,true);text('Billboard JAPAN / '+chart,1050,50,25,muted,false,680);
  const period=context.match(/集計期間：(.+?)（/)?.[1]||context;
  text(scope,left,115,45,ink,true);text(title,left,185,58,accent,true);text('集計期間：'+period+' 公開分',left,274,25,muted,false,1656);
  text(streak?o.liveRun+' · 同順位を含む':annual?'アーティスト×年の記録 · 同順位を含む':(liveEntity==='song'?'楽曲別':'アーティスト別')+'の累積登場回数 · 同順位を含む',left,319,25,muted);
  if(pages.length>1)text((pageIndex+1)+' / '+pages.length+'枚',1540,322,23,muted,false,180);
  rows.forEach((r,i)=>{
   const x=left+(i%cols)*(size+gap),y=start+Math.floor(i/cols)*rowHeight,value=Number(r[metric]),rank=ranks.get(value),highlight=streak?r[6]==='はい':annual?liveYear==='all'&&String(r[0])===String(model.latest).slice(0,4):true,color=highlight?accent:ink;
   ctx.fillStyle=ink;ctx.font='700 51px Arial';ctx.fillText(String(rank).padStart(2,'0'),x,y);
   ctx.fillStyle=color;ctx.font='700 48px Arial';ctx.textAlign='right';ctx.fillText(value.toLocaleString(),x+size-36,y+3);ctx.textAlign='left';text(streak?'週':'回',x+size-29,y+18,24,color,true,32);
   const imageY=y+70,art=rowArtwork(r);if(!artwork?.paint(ctx,art,x,imageY,size)){ctx.fillStyle='#e8ebee';ctx.fillRect(x,imageY,size,size);text('画像未取得',x+60,imageY+size/2-12,26,muted,false,size-90);}
   let name=r[1];if(!annual&&name.startsWith('Yes! 東京 (feat.'))name='Yes! 東京';
   lines(name,x,imageY+size+16,size,29,2,true);
   const labelY=imageY+size+94;
   if(annual){text(String(r[0])+'年',x,labelY,27,highlight?accent:muted,highlight,size);}
   else{lines(liveEntity==='artist'&&!streak?'登場 '+r[4]+'週':r[2],x,labelY,size,25,1,false);if(streak){text(String(r[4]).replaceAll('-','.')+' —',x,labelY+40,23,muted,false,size);text(r[6]==='はい'?'継続中':String(r[5]).replaceAll('-','.'),x,labelY+73,24,highlight?accent:muted,highlight,size);}}
  });
  ctx.strokeStyle='#dce1e6';ctx.beginPath();ctx.moveTo(left,H-145);ctx.lineTo(W-left,H-145);ctx.stroke();
  text(streak?'連続週数を比較。最新週まで継続中の記録のみ色を付けています。':'1曲×1週＝1回。同週に複数曲が入った場合は別々に加算。',left,H-116,24,muted);
  text('出典：Billboard JAPAN / サイト収録データ',left,H-68,24,muted);
  if(!rows.length)text('該当する記録はありません',left,start+60,36,muted);
 }
 window.RecordJacketGrid={draw};
})();
