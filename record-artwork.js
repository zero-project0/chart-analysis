/* Local artwork for records. Missing metadata leaves the original text intact. */
(()=>{
  'use strict';
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const photos=new Map((window.ARTIST_PHOTOS||[]).map(item=>[norm(item.artist),item]));
  const songKey=(artist,title)=>norm(artist)+'\u0000'+norm(title);
  const recordSongs=new Map((window.RECORD_SONG_ARTWORK||[]).map(item=>[
    songKey(item.artist,item.title),{...item,uri:'record-cover:'+item.image}
  ]));
  const artist=name=>photos.get(norm(name));
  const song=(name,title)=>window.SongJackets?.get(name,title)||recordSongs.get(songKey(name,title));
  const ready=window.SongJackets?.ready;
  const ensure=items=>window.SongJackets?.ensure(items);
  const shortUrl=item=>'open.spotify.com/'+(item.uri.includes(':artist:')?'artist/':'track/')+item.uri.split(':').at(-1);
  function paint(ctx,item,x,y,size){return item?window.SongJackets.paint(ctx,item,x,y,size):false;}
  function decorate(root){
    root.querySelectorAll('[data-stat-artist],[data-stat-song]').forEach(button=>{
      if(button.dataset.recordArtwork)return;
      const item=button.dataset.statSong?song(button.dataset.statOwner,button.dataset.statSong):artist(button.dataset.statArtist);
      if(!item)return;
      button.dataset.recordArtwork='1';
      const layout=document.createElement('span');layout.className='record-artwork-cell';
      const img=document.createElement('img');img.src=item.image;img.alt='';img.width=48;img.height=48;img.loading='lazy';img.onerror=()=>img.remove();
      const copy=document.createElement('span');copy.className='record-artwork-copy';
      const subtitle=button.nextElementSibling?.tagName==='SMALL'?button.nextElementSibling:null;
      button.before(layout);layout.append(img,copy);copy.append(button);
      if(subtitle)copy.append(subtitle);
      if(!item.url)return;
      const link=document.createElement('a');link.className='record-artwork-source';link.href=item.url;link.target='_blank';link.rel='noopener';
      if(item.uri.startsWith('spotify:')){
        link.setAttribute('aria-label',item.artist+'をSpotifyで開く');
        const logo=document.createElement('img');logo.src='jacket-assets/spotify-logo.svg';logo.alt='Spotify';link.append(logo,document.createTextNode('で開く'));
      }else{
        link.textContent=item.source+' ↗';
      }
      copy.append(link);
    });
  }
  window.RecordArtwork={artist,song,ready,ensure,paint,shortUrl,decorate};
})();
