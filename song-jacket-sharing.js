/* Load only artwork used by the active share image. */
(()=>{
  'use strict';
  const api=window.SongJackets,images=new Map(),loads=new Map(),jobs=new WeakMap();
  function preload(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s/g,'').toLowerCase(),photos=new Map((window.ARTIST_PHOTOS||[]).map(item=>[norm(item.artist),item]));
  api.ensure=items=>Promise.all(items.filter(Boolean).map(item=>{if(!loads.has(item.uri))loads.set(item.uri,preload(item.imageData||item.image).then(image=>{images.set(item.uri,image);return image;}));return loads.get(item.uri);}));
  api.ready=Promise.resolve();
  api.getArtistPhoto=name=>photos.get(norm(name));
  const logoReady=preload(window.JACKET_SPOTIFY_LOGO).then(img=>api.logoImage=img);
  api.ready=Promise.all([api.ready,logoReady]);
  api.paint=(ctx,item,x,y,size)=>{const img=images.get(item.uri);if(!img)return false;ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,size>=100?8:4);ctx.clip();const scale=Math.min(size/img.naturalWidth,size/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,x+(size-w)/2,y+(size-h)/2,w,h);ctx.restore();return true;};
  api.paintCredit=()=>{}; // Credits are displayed in the site UI, not in exported images.
  const songArt=item=>api.get(item.artist,item.title);
  const artistArt=(artist,selected)=>[api.getArtistPhoto(artist.artist),...[...selected.songs].sort((a,b)=>b.appearances-a.appearances||a.title.localeCompare(b.title,'ja')).slice(0,3).map(song=>api.get(artist.artist,song.title))];
  let shareArtwork=[];
  function comparisonArt(){return compareType==='song'?compareItems.song.map(songArt).filter(Boolean):[];}
  function comparisonKey(){return JSON.stringify([compareType,compareItems[compareType],typeof comparePeriod!=='undefined'?comparePeriod:null]);}
  function repaintComparison(){if(currentShareTarget?.type!=='comparison'||!document.getElementById('shareDialog').open)return;const image=buildComparisonShareImage(),canvas=document.getElementById('shareCard');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);}
  function decorateRelated(){
    document.querySelectorAll('#detailSongs [data-song-title]').forEach(row=>{if(row.dataset.jacketReady)return;row.dataset.jacketReady='1';row.classList.add('jacket-related-song');const content=document.createElement('span');content.className='jacket-related-copy';content.append(...row.childNodes);row.append(api.cover(api.get(row.dataset.songArtist,row.dataset.songTitle)),content);});
    if(compareType!=='song')return;
    for(const [selector,list] of [['#compareSelected .compare-chip',compareItems.song],['#compareResults .compare-result',document.getElementById('compareResults')?._items||[]],['#compareLegend [data-series-focus]',compareItems.song]]){
      document.querySelectorAll(selector).forEach((node,i)=>{if(node.dataset.jacketReady)return;node.dataset.jacketReady='1';const item=list[i];if(!item)return;node.classList.add('jacket-compare-item');node.prepend(api.cover(api.get(item.artist,item.title)));});
    }
  }
  for(const id of ['detailSongs','compareSelected','compareResults','compareLegend']){const root=document.getElementById(id);if(root)new MutationObserver(decorateRelated).observe(root,{childList:true,subtree:true});}
  decorateRelated();
  const paintSong=window.paintChosenSongShare;
  window.paintChosenSongShare=function(...args){const token={};jobs.set(args[0],token);shareArtwork=[songArt(args[1])];const result=paintSong(...args);api.ensure(shareArtwork).then(()=>{if(jobs.get(args[0])===token&&currentShareTarget?.type==='song')paintSong(...args);});return result;};
  const paintArtist=window.paintChosenArtistShare;
  window.paintChosenArtistShare=function(...args){const token={};jobs.set(args[0],token);shareArtwork=artistArt(args[1],args[2]);const render=()=>paintArtist(...args);render();api.ensure(shareArtwork).then(()=>{if(jobs.get(args[0])===token&&currentShareTarget?.type==='artist')render();});};
  const originalComparison=buildComparisonShareImage;
  buildComparisonShareImage=function(){
    const base=originalComparison(),items=compareItems.song;
    if(compareType!=='song'||!items.some(i=>api.get(i.artist,i.title))){
      window.drawImageSignature(base.getContext('2d'));
      return base;
    }
    const pending=comparisonArt().filter(item=>!images.has(item.uri));if(pending.length){const key=comparisonKey();api.ensure(pending).then(()=>{if(comparisonKey()===key)repaintComparison();});}
    const source=document.getElementById('compareCanvas'),bottom=142+Math.round(1104*source.height/source.width)+18,rows=Math.ceil(items.length/2),out=document.createElement('canvas');out.width=1200;out.height=bottom+rows*104+72;const ctx=out.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(base,0,0,1200,bottom,0,0,1200,bottom);ctx.textBaseline='top';
    items.forEach((item,i)=>{const x=52+(i%2)*550,y=bottom+12+Math.floor(i/2)*104,art=api.get(item.artist,item.title);if(art)api.paint(ctx,art,x,y,64);else{ctx.fillStyle='#edf0ed';ctx.fillRect(x,y,64,64);}ctx.strokeStyle=compareColors[i];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+80,y+7);ctx.lineTo(x+110,y+7);ctx.stroke();ctx.fillStyle='#24211d';ctx.font='bold 21px Meiryo,sans-serif';ctx.fillText(item.title,x+122,y-4,380);ctx.fillStyle='#697168';ctx.font='16px Meiryo,sans-serif';ctx.fillText(item.artist+' / '+chartLabel(item.chart||compareChart),x+80,y+30,440);});
    window.drawImageSignature(ctx);
    out.dataset.jacketCount=String(items.filter(i=>api.get(i.artist,i.title)).length);return out;
  };
  const originalCanvasBlob=canvasBlob;
  canvasBlob=async function(){const target=currentShareTarget;await api.ensure(target?.type==='comparison'?comparisonArt():shareArtwork);if(currentShareTarget!==target)throw new Error('Share changed while loading artwork');if(target?.type==='comparison')repaintComparison();else if(target)redrawPeriodShare();return originalCanvasBlob();};
  const originalCompareShare=openComparisonShareDialog;
  openComparisonShareDialog=function(...args){const result=originalCompareShare(...args);const key=comparisonKey();api.ensure(comparisonArt()).then(()=>{if(comparisonKey()===key)repaintComparison();});return result;};
  const download=document.createElement('button');download.id='downloadJacketShare';download.className='button';download.type='button';download.textContent='PNGを保存';download.addEventListener('click',async()=>{download.disabled=true;try{const blob=await canvasBlob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='music-chart-jacket-share.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setShareStatus('PNG画像を保存しました。','success');}catch(error){setShareStatus('画像を保存できませんでした。','error');}finally{download.disabled=false;}});document.getElementById('shareWithImage')?.before(download);
})();
