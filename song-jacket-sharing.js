/* Artwork for local previews and actual PNG exports, including file:// use. */
(()=>{
  'use strict';
  const api=window.SongJackets,images=new Map(),jobs=new WeakMap();
  function preload(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
  api.ready=Promise.all([...(window.SONG_JACKETS||[]),...(window.ARTIST_PHOTOS||[])].map(async item=>{const image=await preload(item.imageData||item.image);images.set(item.uri,image);}));
  api.getArtistPhoto=name=>(window.ARTIST_PHOTOS||[]).find(item=>String(item.artist).normalize('NFKC').replace(/\s/g,'').toLowerCase()===String(name).normalize('NFKC').replace(/\s/g,'').toLowerCase());
  const logoReady=preload(window.JACKET_SPOTIFY_LOGO).then(img=>api.logoImage=img);
  api.ready=Promise.all([api.ready,logoReady]);
  api.paint=(ctx,item,x,y,size)=>{const img=images.get(item.uri);if(!img)return false;ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,size>=100?8:4);ctx.clip();ctx.drawImage(img,x,y,size,size);ctx.restore();return true;};
  api.paintCredit=()=>{}; // Credits are displayed in the site UI, not in exported images.
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
  window.paintChosenSongShare=function(...args){const token={};jobs.set(args[0],token);const result=paintSong(...args);api.ready.then(()=>{if(jobs.get(args[0])===token&&currentShareTarget?.type==='song')paintSong(...args);});return result;};
  const paintArtist=window.paintChosenArtistShare;
  window.paintChosenArtistShare=function(...args){const token={};jobs.set(args[0],token);const render=()=>paintArtist(...args);render();api.ready.then(()=>{if(jobs.get(args[0])===token&&currentShareTarget?.type==='artist')render();});};
  const originalComparison=buildComparisonShareImage;
  buildComparisonShareImage=function(){
    const base=originalComparison();if(compareType!=='song')return base;
    const items=compareItems.song;if(!items.some(i=>api.get(i.artist,i.title)))return base;
    const source=document.getElementById('compareCanvas'),bottom=142+Math.round(1104*source.height/source.width)+18,rows=Math.ceil(items.length/2),out=document.createElement('canvas');out.width=1200;out.height=bottom+rows*104+72;const ctx=out.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(base,0,0,1200,bottom,0,0,1200,bottom);ctx.textBaseline='top';
    items.forEach((item,i)=>{const x=52+(i%2)*550,y=bottom+12+Math.floor(i/2)*104,art=api.get(item.artist,item.title);if(art)api.paint(ctx,art,x,y,64);else{ctx.fillStyle='#edf0ed';ctx.fillRect(x,y,64,64);}ctx.strokeStyle=compareColors[i];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+80,y+7);ctx.lineTo(x+110,y+7);ctx.stroke();ctx.fillStyle='#24211d';ctx.font='bold 21px Meiryo,sans-serif';ctx.fillText(item.title,x+122,y-4,380);ctx.fillStyle='#697168';ctx.font='16px Meiryo,sans-serif';ctx.fillText(item.artist+' / '+chartLabel(item.chart||compareChart),x+80,y+30,440);});
    out.dataset.jacketCount=String(items.filter(i=>api.get(i.artist,i.title)).length);return out;
  };
  const originalCanvasBlob=canvasBlob;
  canvasBlob=async function(){await api.ready;if(currentShareTarget?.type==='comparison'){const image=buildComparisonShareImage(),canvas=document.getElementById('shareCard');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);}else if(currentShareTarget)redrawPeriodShare();return originalCanvasBlob();};
  const originalCompareShare=openComparisonShareDialog;
  openComparisonShareDialog=function(...args){const result=originalCompareShare(...args);api.ready.then(()=>{if(currentShareTarget?.type==='comparison'&&document.getElementById('shareDialog').open){const image=buildComparisonShareImage(),canvas=document.getElementById('shareCard');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);}});return result;};
  const download=document.createElement('button');download.id='downloadJacketShare';download.className='button';download.type='button';download.textContent='PNGを保存';download.addEventListener('click',async()=>{download.disabled=true;try{const blob=await canvasBlob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='music-chart-jacket-share.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setShareStatus('PNG画像を保存しました。','success');}catch(error){setShareStatus('画像を保存できませんでした。','error');}finally{download.disabled=false;}});document.getElementById('shareWithImage')?.before(download);
})();
