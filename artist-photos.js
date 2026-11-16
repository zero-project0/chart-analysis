/* Existing verified artist portraits, shared by rankings and artist details. */
(()=>{
  'use strict';
  const norm=value=>String(value||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const photos=new Map((window.ARTIST_PHOTOS||[]).map(item=>[norm(item.artist),item]));
  function portrait(item,lazy=true){
    const frame=document.createElement('span');frame.className='artist-portrait';frame.setAttribute('aria-hidden','true');
    const image=document.createElement('img');image.src=item.image;image.alt='';image.loading=lazy?'lazy':'eager';image.decoding='async';
    image.addEventListener('error',()=>{frame.hidden=true;},{once:true});frame.append(image);return frame;
  }
  function decorateRows(){
    document.querySelectorAll('#artistRows tr[data-artist]').forEach(row=>{
      const cell=row.querySelector('.artist-cell'),item=photos.get(norm(row.dataset.artist));
      if(!cell||!item||cell.querySelector('.artist-ranking-identity'))return;
      const copy=document.createElement('span');copy.className='artist-ranking-copy';copy.append(...cell.childNodes);
      const identity=document.createElement('span');identity.className='artist-ranking-identity';identity.append(portrait(item),copy);cell.append(identity);
    });
  }
  function decorateDetail(name){
    const heading=document.getElementById('detailName'),identity=heading?.closest('.modal-head')?.firstElementChild;if(!identity)return;
    let copy=identity.querySelector('.artist-detail-copy');
    if(!copy){copy=document.createElement('div');copy.className='artist-detail-copy';copy.append(...identity.childNodes);identity.append(copy);}
    identity.querySelector('.artist-detail-photo')?.remove();copy.querySelector('.artist-photo-source')?.remove();
    const item=photos.get(norm(name));identity.classList.toggle('artist-detail-identity',Boolean(item));
    if(!item)return;
    const link=document.createElement('a');link.className='artist-detail-photo';link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',name+'のSpotifyプロフィールを開く');
    const image=portrait(item,false);image.removeAttribute('aria-hidden');link.append(image);identity.prepend(link);
    const credit=window.SongJackets.credit(item);credit.classList.add('artist-photo-source');copy.append(credit);
  }
  const render=renderArtists;renderArtists=function(...args){const result=render.apply(this,args);decorateRows();return result;};
  const open=openDetail;openDetail=function(name,...args){const result=open.call(this,name,...args);decorateDetail(name);return result;};
  decorateRows();if(document.getElementById('detailDialog')?.open)decorateDetail(document.getElementById('detailName').textContent);
})();
