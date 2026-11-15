/* Local artwork for records. Missing metadata leaves the original text intact. */
(()=>{
  'use strict';
  const norm=v=>String(v||'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
  const photos=new Map((window.ARTIST_PHOTOS||[]).map(item=>[norm(item.artist),item]));
  const images=new Map();
  const artist=name=>photos.get(norm(name));
  const song=(name,title)=>window.SongJackets?.get(name,title);
  const ready=Promise.all([window.SongJackets?.ready,...[...photos.values()].map(item=>new Promise(resolve=>{const img=new Image();img.onload=()=>{images.set(item.uri,img);resolve();};img.onerror=()=>resolve();img.src=item.imageData||item.image;}))]);
  const shortUrl=item=>'open.spotify.com/'+(item.uri.includes(':artist:')?'artist/':'track/')+item.uri.split(':').at(-1);
  function paint(ctx,item,x,y,size){if(!item)return false;if(!item.uri.includes(':artist:'))return window.SongJackets.paint(ctx,item,x,y,size);const img=images.get(item.uri);if(!img)return false;ctx.drawImage(img,x,y,size,size);return true;}
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
      const link=document.createElement('a');link.className='record-artwork-source';link.href=item.url;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',item.artist+'をSpotifyで開く');
      const logo=document.createElement('img');logo.src='jacket-assets/spotify-logo.svg';logo.alt='Spotify';link.append(logo,document.createTextNode('で開く'));copy.append(link);
    });
  }
  window.RecordArtwork={artist,song,ready,paint,shortUrl,decorate};
})();
