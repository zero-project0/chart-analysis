/* Visual records share the table's TOP20 selection, ties and 25-item pagination. */
(()=>{
 'use strict';
 function draw(o){
  const {canvas,rows,metric,ranks,annual,streak,liveEntity,liveYear,liveScope,chart,title,model,context,accent,pageIndex,pages,rowArtwork,artwork}=o;
  const header=document.createElement('canvas');header.width=canvas.width;header.height=490;header.getContext('2d').drawImage(canvas,0,0);
  const W=1800,H=2400,cols=5,left=96,pitch=1608/cols,compact=rows.length>20,start=compact?280:535,nRows=Math.max(compact?5:4,Math.ceil(rows.length/cols)),rowHeight=(2220-start)/nRows;
  // Keep the same gutters in all five columns; size artwork from the remaining text space.
  const imageSize=Math.min(296,Math.floor(rowHeight-(streak?140:104)-12)),imageInset=(pitch-imageSize)/2,titleSize=compact?22:24,labelSize=compact?19:21;
  canvas.width=W;canvas.height=H;Object.assign(canvas.dataset,{columns:String(cols),layout:'visual',aspectRatio:'3:4',headerStyle:compact?'compact':'original'});
  const ctx=canvas.getContext('2d'),font='Meiryo,"Yu Gothic UI",sans-serif',ink='#1d1d1f',muted='#697078';ctx.textBaseline='top';
  ctx.fillStyle='#f5f5f7';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(48,38,W-96,H-86,38);ctx.fill();ctx.strokeStyle='#e1e1e6';ctx.lineWidth=1;ctx.stroke();
  function text(value,x,y,size=24,color=ink,bold=true,max=1608){ctx.textAlign='left';ctx.font=`${bold?700:400} ${size}px ${font}`;let label=String(value??'');while(ctx.measureText(label).width>max&&label.length>1)label=label.slice(0,-1);if(label!==String(value??''))label=label.slice(0,-1)+'…';ctx.fillStyle=color;ctx.fillText(label,x,y);}
  function right(value,x,y,size,color){ctx.textAlign='right';ctx.font=`700 ${size}px Arial,${font}`;ctx.fillStyle=color;ctx.fillText(String(value),x,y);ctx.textAlign='left';}
  function round(x,y,w,h,color,r=12){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  if(!compact)ctx.drawImage(header,0,0);
  else{
   text('Billboard JAPAN / '+chart,left,61,26,ink);right(model.latest.replaceAll('-','.'),1704,66,21,muted);
   text(({boys:'ボーイズグループ',girls:'ガールズグループ',korean:'K-POPグループ',combined:'ボーイズ＆ガールズグループ',all:'全アーティスト'})[liveScope],left,111,32,accent);
   text(title,left,159,39,ink,true,1608);
   round(left,216,1608,43,'#f5f5f7',10);
   const winner=o.allRows[0],name=winner?.[1]||'該当する記録はありません',value=winner?Number(winner[metric]).toLocaleString()+(streak?'週':'回'):'';
   text((streak?'最長記録':'最多記録')+'　'+name,left+15,227,20,ink,true,1060);right(value,1260,225,26,accent);
   right((pageIndex+1)+' / '+pages.length+'枚',1685,230,19,muted);
  }
  const bounds=[];
  rows.forEach((r,i)=>{
   const cellX=left+i%cols*pitch,x=cellX+imageInset,y=start+Math.floor(i/cols)*rowHeight,value=Number(r[metric]),rank=ranks.get(value);
   const highlighted=streak?r[6]==='はい':annual&&liveYear==='all'&&String(r[0])===String(model.latest).slice(0,4);
   const color=ink,rankColor=({1:'#af8a37',2:'#8896a4',3:'#ad7b58'})[rank]||'#244d70';
   // Rank colors express placement only. A separate card background expresses record status.
   if(highlighted){
    ctx.save();ctx.globalAlpha=.11;round(cellX+5,y-8,pitch-10,rowHeight-4,accent,16);
    ctx.globalAlpha=.72;ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.stroke();ctx.restore();
   }
   const art=rowArtwork(r);
   if(!artwork?.paint(ctx,art,x,y,imageSize)){round(x,y,imageSize,imageSize,'#e8ebee',7);text('画像未取得',x+25,y+imageSize/2-12,20,muted,false,imageSize-45);}
   // Rank crosses only the lower-right edge; the count occupies the left gap.
   const rankSize=compact?(rank<10?84:72):(rank<10?100:84),rightEdge=x+imageSize+4,bottom=y+imageSize+(compact?45:54);
   ctx.save();ctx.globalAlpha=.84;ctx.fillStyle=rankColor;ctx.font=`italic 900 ${rankSize}px Impact,"Arial Narrow",Arial,sans-serif`;ctx.textAlign='right';ctx.textBaseline='alphabetic';ctx.fillText(String(rank),rightEdge,bottom);ctx.restore();ctx.textBaseline='top';ctx.textAlign='left';
   ctx.font=`700 ${compact?29:33}px Arial`;ctx.fillStyle=color;const number=value.toLocaleString();ctx.fillText(number,x,y+imageSize+14);const numberW=ctx.measureText(number).width;text(streak?'週':'回',x+numberW+5,y+imageSize+26,compact?17:19,color,true,32);
   let name=String(r[1]||'');if(!annual&&name.startsWith('Yes! 東京 (feat.'))name='Yes! 東京';if(!annual&&name==='罪と罰と雨とキス (佐野勇斗&吉田仁人)')name='罪と罰と雨とキス';
   const titleY=y+imageSize+(compact?63:60),labelY=y+imageSize+(compact?94:92);
   text(name,x,titleY,titleSize,ink,true,imageSize);
   text(annual?String(r[0])+'年':liveEntity==='artist'&&!streak?'登場 '+r[4]+'週':r[2],x,labelY,labelSize,annual?color:muted,annual,imageSize);
   let lastY=labelY+labelSize;
   if(streak){const ongoing=r[6]==='はい',period=String(r[4]).replaceAll('-','.')+' — '+(ongoing?'継続中':String(r[5]).replaceAll('-','.'));text(period,x,labelY+27,compact?16:18,ongoing?accent:muted,ongoing,imageSize);lastY=labelY+48;}
   bounds.push({rank,x,y,size:imageSize,cellX,cellWidth:pitch,bottom:lastY,rowBottom:start+(Math.floor(i/cols)+1)*rowHeight,ongoing:streak&&r[6]==='はい',highlighted:Boolean(highlighted),rankColor});
  });
  canvas.dataset.cardBounds=JSON.stringify(bounds);
  ctx.strokeStyle='#d2d2d7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,2230);ctx.lineTo(W-left,2230);ctx.stroke();
  text(context,left,2252,18,muted,false,1608);
  text(streak?'背景・枠線付き：最新週まで継続中の記録。':annual&&liveYear==='all'?'背景・枠線付き：'+String(model.latest).slice(0,4)+'年の記録。':'1曲×1週＝1回。同週の複数曲は別々に加算。',left,2292,20,muted,false,1608);
  text('出典：Billboard JAPAN',left,2330,20,muted,false,1608);
  if(!rows.length)text('該当する記録はありません',left,start+70,30,muted);
 }
 window.RecordJacketGrid={draw};
})();
