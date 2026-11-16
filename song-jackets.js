/* Local artwork pilot. Exact artist/title mapping; chart data stays untouched. */
(()=>{
  'use strict';
  const normalize=value=>String(value??'').normalize('NFKC').replace(/\s/g,'').toLocaleLowerCase();
  const bySong=new Map((window.SONG_JACKETS||[]).map(item=>[normalize(item.artist)+'|'+normalize(item.title),item]));
  const lookup=(artist,title)=>bySong.get(normalize(artist)+'|'+normalize(title));
  window.SongJackets={get:lookup,cover,credit};
  const logo=()=>{const img=document.createElement('img');img.src='jacket-assets/spotify-logo.svg';img.alt='Spotify';img.className='jacket-spotify-logo';return img;};
  function cover(item){
    const frame=document.createElement('span');frame.className='song-jacket';frame.setAttribute('aria-hidden','true');
    if(item){const img=document.createElement('img');img.src=item.image;img.alt='';img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{img.remove();frame.classList.add('jacket-unavailable');},{once:true});frame.append(img);}
    else frame.classList.add('jacket-unavailable');
    return frame;
  }
  function credit(item){const link=document.createElement('a');link.className='jacket-credit';link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.append(logo());const text=document.createElement('span');text.textContent='で開く';link.append(text);link.addEventListener('click',e=>e.stopPropagation());return link;}
  function decorateRows(){
    document.querySelectorAll('#songRows tr[data-song-title]').forEach(row=>{
      if(row.dataset.jacketReady)return;row.dataset.jacketReady='1';const cell=row.children[1],item=lookup(row.dataset.songArtist,row.dataset.songTitle),text=document.createElement('span');text.className='jacket-title-copy';const originalContent=document.createElement('span');originalContent.className='jacket-original-title';originalContent.append(...cell.childNodes);text.append(originalContent);const wrap=document.createElement('span');wrap.className='jacket-song-cell';wrap.append(cover(item),text);cell.append(wrap);if(item)text.append(credit(item));
    });
  }
  function decorateLatest(){
    document.querySelectorAll('#latestGrid .latest-song').forEach(row=>{if(row.dataset.jacketReady)return;row.dataset.jacketReady='1';row.classList.add('jacket-latest');const item=lookup(row.dataset.songArtist,row.dataset.songTitle);if(item){row.classList.add('jacket-latest-cover');row.querySelector('.latest-rank')?.after(cover(item));}row.title=row.dataset.songTitle+' / '+row.dataset.songArtist;});
    const grid=document.getElementById('latestViewport');if(grid&&!document.getElementById('jacketAttribution')){const note=document.createElement('a');note.id='jacketAttribution';note.className='jacket-attribution';note.href='https://open.spotify.com/artist/4jhJ8cnJ9vYKyCh289nuwQ';note.target='_blank';note.rel='noopener noreferrer';note.append(logo(),document.createTextNode('ジャケット：Spotify'));(grid.closest('.latest-carousel')||grid).after(note);}
  }
  function decorateSearch(){document.querySelectorAll('#searchResults [data-song-title]').forEach(row=>{if(row.dataset.jacketReady)return;row.dataset.jacketReady='1';row.classList.add('jacket-search');row.prepend(cover(lookup(row.dataset.songArtist,row.dataset.songTitle)));});}
  function decorateDetail(artist,title){
    const dialog=document.getElementById('songDialog'),head=dialog?.querySelector('.modal-head');if(!head)return;
    document.getElementById('jacketDetailBlock')?.remove();head.classList.remove('has-song-jacket');
    const item=lookup(artist,title);if(!item)return;
    const block=document.createElement('div');block.id='jacketDetailBlock';block.className='jacket-detail-block';
    const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',item.title+'をSpotifyで開く');const image=cover(item);image.removeAttribute('aria-hidden');image.querySelector('img').alt=item.album+'のジャケット';link.append(image);block.append(link,credit(item));head.prepend(block);head.classList.add('has-song-jacket');
  }
  const originalSongs=renderSongs;renderSongs=function(...args){const result=originalSongs.apply(this,args);decorateRows();return result;};
  const originalLatest=renderLatest;renderLatest=function(...args){const result=originalLatest.apply(this,args);decorateLatest();return result;};
  const originalSearch=renderGlobalSearchResults;renderGlobalSearchResults=function(...args){const result=originalSearch.apply(this,args);decorateSearch();return result;};
  const originalDetail=renderSongDetail;renderSongDetail=function(artist,title,...args){const result=originalDetail.call(this,artist,title,...args);decorateDetail(artist,title);return result;};
  const originalOpen=openSongDetail;openSongDetail=function(artist,title,...args){const result=originalOpen.call(this,artist,title,...args);decorateDetail(artist,title);if(result?.then)result.then(()=>decorateDetail(artist,title));return result;};
  decorateRows();decorateLatest();decorateSearch();
  if(document.getElementById('songDialog')?.open)decorateDetail(document.getElementById('songDetailArtist').dataset.artistName,document.getElementById('songDetailTitle').textContent);
  if(['localhost','127.0.0.1',''].includes(location.hostname)){const banner=document.createElement('aside');banner.className='jacket-preview-note';banner.textContent='ローカル試用版 · ジャケット表示はM!LKの6曲が対象';document.querySelector('main')?.prepend(banner);}
})();
